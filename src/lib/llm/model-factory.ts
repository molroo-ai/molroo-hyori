/**
 * AI SDK model factory — maps LlmConfig to a Vercel AI SDK LanguageModel.
 *
 * Routing:
 * - 'anthropic' → @ai-sdk/anthropic (with browser-access header)
 * - 'openai'    → @ai-sdk/openai, openai(model) (Responses API)
 * - everything else → @ai-sdk/openai, openai.chat(model) (Chat Completions API)
 */

import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import type { LanguageModel } from 'ai'
import type { LlmConfig } from './chat'
import { getProvider } from './providers'

export function createModel(config: LlmConfig): LanguageModel | null {
  if (config.provider === 'none') return null

  const providerDef = getProvider(config.provider)
  if (!providerDef) return null
  if (providerDef.apiKeyRequired && !config.apiKey) return null

  const model = config.model || providerDef.defaultModel
  if (!model) return null

  if (config.provider === 'anthropic') {
    const anthropic = createAnthropic({
      apiKey: config.apiKey,
      headers: { 'anthropic-dangerous-direct-browser-access': 'true' },
    })
    return anthropic(model)
  }

  const baseURL = config.baseUrl || providerDef.baseUrl
  const openai = createOpenAI({
    apiKey: config.apiKey || undefined,
    baseURL,
  })

  // openai(model) → Responses API (/v1/responses) — only works with actual OpenAI
  // openai.chat(model) → Chat Completions API (/v1/chat/completions) — works everywhere
  if (config.provider === 'openai') {
    return openai(model)
  }
  return openai.chat(model)
}
