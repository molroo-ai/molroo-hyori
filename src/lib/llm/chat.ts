import { generateText, tool } from 'ai'
import { z } from 'zod'
import { getProvider } from './providers'
import { createModel } from './model-factory'
import type { AppraisalVector } from '../api/types'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmConfig {
  provider: string
  apiKey: string
  model?: string
  baseUrl?: string
}

export interface ChatCompletionOptions {
  temperature?: number
  maxOutputTokens?: number
}

/**
 * Call a chat completion via Vercel AI SDK generateText.
 * Replaces the old raw-fetch approach — AI SDK handles Anthropic/OpenAI protocol differences.
 */
export async function callChatCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  options?: ChatCompletionOptions,
): Promise<string> {
  const model = createModel(config)
  if (!model) throw new Error('Cannot create model for provider: ' + config.provider)

  const systemMessage = messages.find(m => m.role === 'system')
  const nonSystemMessages = messages.filter(m => m.role !== 'system')

  const { text } = await generateText({
    model,
    system: systemMessage?.content,
    messages: nonSystemMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    temperature: options?.temperature ?? 0.8,
    maxOutputTokens: options?.maxOutputTokens ?? 512,
  })

  return text
}

/**
 * Generate a conversational response using the configured LLM and molroo prompt_data.
 * Returns null if provider is 'none' or no API key is set (when required).
 */
export async function generateResponse(
  config: LlmConfig,
  systemPrompt: string,
  contextBlock: string,
  instructionBlock: string,
  userMessage: string,
  history?: ChatMessage[],
): Promise<string | null> {
  if (config.provider === 'none') return null

  const providerDef = getProvider(config.provider)
  if (!providerDef) return null
  if (providerDef.apiKeyRequired && !config.apiKey) return null
  if (!config.model && !providerDef.defaultModel) return null

  const system = [systemPrompt, contextBlock, instructionBlock]
    .filter(Boolean)
    .join('\n\n')

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    ...(history ?? []),
    { role: 'user', content: userMessage },
  ]

  return callChatCompletion(config, messages)
}

/* ── Persona generation from guide + character description ── */

function parseJsonResponse(text: string): Record<string, unknown> {
  // Strip markdown fences if present
  const jsonStr = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(jsonStr)
}

/**
 * Use LLM to transform a natural language character description into
 * structured persona data, guided by the API's persona guide prompt.
 * Retries once on JSON parse failure with a stricter prompt.
 */
export async function generatePersonaFromGuide(
  config: LlmConfig,
  llmPrompt: string,
  characterDescription: string,
): Promise<Record<string, unknown>> {
  const model = createModel(config)
  if (!model) throw new Error('LLM is required for persona generation')

  // First attempt
  const { text } = await generateText({
    model,
    system: llmPrompt,
    messages: [{ role: 'user', content: characterDescription }],
    temperature: 0.2,
    maxOutputTokens: 8192,
  })

  try {
    return parseJsonResponse(text)
  } catch {
    console.warn('[PersonaGen] First attempt failed, retrying with stricter prompt...')
  }

  // Retry with explicit JSON-only instruction
  const { text: retryText } = await generateText({
    model,
    system: llmPrompt + '\n\nCRITICAL: Output ONLY a valid JSON object. No explanation, no markdown, no extra text. Start with { and end with }.',
    messages: [{ role: 'user', content: characterDescription }],
    temperature: 0.1,
    maxOutputTokens: 8192,
  })

  try {
    return parseJsonResponse(retryText)
  } catch {
    console.error('[PersonaGen] Retry also failed. Response:', retryText.slice(0, 500))
    throw new Error('LLM returned invalid JSON for persona generation (after retry)')
  }
}

/* ── Combined response + appraisal via tool calling ── */

const DEFAULT_APPRAISAL: AppraisalVector = {
  goal_relevance: 0.5, goal_congruence: 0.5, expectedness: 0.5,
  controllability: 0.5, agency: 0.5, norm_compatibility: 0.5,
}

const appraisalSchema = z.object({
  goal_relevance: z.number().min(0).max(1).describe('How relevant to your goals? 0=irrelevant, 1=critical'),
  goal_congruence: z.number().min(0).max(1).describe('Helps or threatens goals? 0=threatening, 1=supportive'),
  expectedness: z.number().min(0).max(1).describe('How predictable? 0=shocking, 1=expected'),
  controllability: z.number().min(0).max(1).describe('How much control? 0=helpless, 1=in control'),
  agency: z.number().min(0).max(1).describe('Who drives? 0=user drives, 1=you lead'),
  norm_compatibility: z.number().min(0).max(1).describe('How appropriate? 0=inappropriate, 1=normal'),
})

const appraisalTool = tool({
  description: `Evaluate how you emotionally react to the user's message. Rate each dimension 0.0–1.0. You MUST call this tool alongside your text response.`,
  inputSchema: appraisalSchema,
})

/**
 * Single LLM call that returns both conversational text AND appraisal.
 * Uses tool calling — the model writes text and calls report_appraisal in one response.
 */
export async function generateWithAppraisal(
  config: LlmConfig,
  systemPrompt: string,
  contextBlock: string,
  instructionBlock: string,
  userMessage: string,
  history?: ChatMessage[],
): Promise<{ text: string | null; appraisal: AppraisalVector }> {
  if (config.provider === 'none') return { text: null, appraisal: DEFAULT_APPRAISAL }

  const providerDef = getProvider(config.provider)
  if (!providerDef) return { text: null, appraisal: DEFAULT_APPRAISAL }
  if (providerDef.apiKeyRequired && !config.apiKey) return { text: null, appraisal: DEFAULT_APPRAISAL }
  if (!config.model && !providerDef.defaultModel) return { text: null, appraisal: DEFAULT_APPRAISAL }

  const model = createModel(config)
  if (!model) return { text: null, appraisal: DEFAULT_APPRAISAL }

  const system = [
    systemPrompt, contextBlock, instructionBlock,
    'After writing your reply, ALWAYS call the report_appraisal tool to report your emotional reaction.',
  ].filter(Boolean).join('\n\n')

  // Filter out empty-content messages (Anthropic rejects empty text blocks)
  const msgs = [
    ...(history ?? []),
    { role: 'user' as const, content: userMessage },
  ].filter(m => m.content)

  const { text, toolCalls } = await generateText({
    model,
    system,
    messages: msgs.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    tools: { report_appraisal: appraisalTool },
    toolChoice: 'auto',
    temperature: 0.8,
    maxOutputTokens: 768,
  })

  const call = toolCalls.find(tc => tc.toolName === 'report_appraisal')
  const appraisal = call
    ? { ...DEFAULT_APPRAISAL, ...(call.input as Partial<AppraisalVector>) }
    : DEFAULT_APPRAISAL

  return { text: text || null, appraisal }
}
