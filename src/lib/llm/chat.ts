import { getProvider } from './providers'

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

/**
 * Call any OpenAI-compatible chat completions endpoint.
 * Anthropic's direct-browser header is handled automatically.
 */
async function callChatCompletion(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  extraHeaders?: Record<string, string>,
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const isAnthropic = baseUrl.includes('anthropic.com')
  const base = baseUrl.replace(/\/+$/, '')

  const res = await fetch(`${base}${isAnthropic ? '/messages' : '/chat/completions'}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(
      isAnthropic
        ? {
            model,
            max_tokens: 512,
            messages: messages.filter(m => m.role !== 'system'),
            system: messages.find(m => m.role === 'system')?.content ?? '',
          }
        : {
            model,
            messages,
            max_tokens: 512,
            temperature: 0.8,
          },
    ),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = (body as any)?.error?.message ?? `LLM error ${res.status}`
    throw new Error(msg)
  }

  const data = (await res.json()) as any

  // Anthropic returns content[0].text, OpenAI-compat returns choices[0].message.content
  if (isAnthropic) {
    return data.content?.[0]?.text ?? ''
  }
  return data.choices?.[0]?.message?.content ?? ''
}

/**
 * Generate a conversational response using the configured LLM and molroo prompt_data.
 *
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

  const baseUrl = config.baseUrl || providerDef.baseUrl
  const model = config.model || providerDef.defaultModel
  if (!model) return null

  const system = [systemPrompt, contextBlock, instructionBlock]
    .filter(Boolean)
    .join('\n\n')

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    ...(history ?? []),
    { role: 'user', content: userMessage },
  ]

  return callChatCompletion(baseUrl, config.apiKey, model, messages, providerDef.headers)
}
