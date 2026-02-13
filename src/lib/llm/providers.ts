export interface LlmProviderDef {
  id: string
  name: string
  baseUrl: string
  defaultModel: string
  models: string[]
  apiKeyPlaceholder: string
  apiKeyRequired: boolean
  headers?: Record<string, string>
}

export const LLM_PROVIDERS: LlmProviderDef[] = [
  {
    id: 'none',
    name: 'None (keyword only)',
    baseUrl: '',
    defaultModel: '',
    models: [],
    apiKeyPlaceholder: '',
    apiKeyRequired: false,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4.1'],
    apiKeyPlaceholder: 'sk-...',
    apiKeyRequired: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-5-20250929',
    models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-5-20250929', 'claude-opus-4-1-20250805'],
    apiKeyPlaceholder: 'sk-ant-...',
    apiKeyRequired: true,
    headers: { 'anthropic-dangerous-direct-browser-access': 'true' },
  },
  {
    id: 'google-generative-ai',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro'],
    apiKeyPlaceholder: 'AIza...',
    apiKeyRequired: true,
  },
  {
    id: 'openrouter-ai',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    models: ['openai/gpt-4o-mini', 'anthropic/claude-sonnet-4-5', 'google/gemini-2.0-flash-001', 'mistralai/mistral-small-latest'],
    apiKeyPlaceholder: 'sk-or-...',
    apiKeyRequired: true,
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it', 'mixtral-8x7b-32768'],
    apiKeyPlaceholder: 'gsk_...',
    apiKeyRequired: true,
  },
  {
    id: 'mistral-ai',
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-small-latest',
    models: ['mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest'],
    apiKeyPlaceholder: 'API key',
    apiKeyRequired: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    apiKeyPlaceholder: 'sk-...',
    apiKeyRequired: true,
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-3-mini-fast',
    models: ['grok-3-mini-fast', 'grok-3-mini', 'grok-3-fast', 'grok-3'],
    apiKeyPlaceholder: 'xai-...',
    apiKeyRequired: true,
  },
  {
    id: 'together-ai',
    name: 'Together.ai',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'mistralai/Mixtral-8x7B-Instruct-v0.1', 'Qwen/Qwen2.5-72B-Instruct-Turbo'],
    apiKeyPlaceholder: 'API key',
    apiKeyRequired: true,
  },
  {
    id: 'fireworks-ai',
    name: 'Fireworks.ai',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    defaultModel: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    models: ['accounts/fireworks/models/llama-v3p3-70b-instruct', 'accounts/fireworks/models/mixtral-8x7b-instruct'],
    apiKeyPlaceholder: 'fw_...',
    apiKeyRequired: true,
  },
  {
    id: 'cerebras-ai',
    name: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    defaultModel: 'llama-3.3-70b',
    models: ['llama-3.3-70b', 'llama-3.1-8b'],
    apiKeyPlaceholder: 'API key',
    apiKeyRequired: true,
  },
  {
    id: 'perplexity-ai',
    name: 'Perplexity',
    baseUrl: 'https://api.perplexity.ai',
    defaultModel: 'sonar',
    models: ['sonar', 'sonar-pro', 'sonar-reasoning'],
    apiKeyPlaceholder: 'pplx-...',
    apiKeyRequired: true,
  },
  {
    id: 'ollama',
    name: 'Ollama (local)',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'llama3.1', 'mistral', 'gemma2', 'qwen2.5'],
    apiKeyPlaceholder: '',
    apiKeyRequired: false,
  },
  {
    id: 'openai-compatible',
    name: 'OpenAI Compatible',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: '',
    models: [],
    apiKeyPlaceholder: 'API key',
    apiKeyRequired: false,
  },
]

export const PROVIDER_MAP = Object.fromEntries(LLM_PROVIDERS.map(p => [p.id, p]))

export function getProvider(id: string): LlmProviderDef | undefined {
  return PROVIDER_MAP[id]
}
