import createClient from 'openapi-fetch'
import type { paths, components } from './api-types'

export type Schemas = components['schemas']

export const DEFAULT_API_URL = import.meta.env.VITE_MOLROO_API_URL ?? 'https://api.molroo.io'
export const DEFAULT_API_KEY = import.meta.env.VITE_MOLROO_API_KEY ?? ''

export function createMolrooClient(baseUrl: string, apiKey: string) {
  const client = createClient<paths>({
    baseUrl,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
  })

  return {
    async getPersonaGuide() {
      const res = await fetch(`${baseUrl}/v1/guide`, {
        headers: { 'X-API-Key': apiKey },
      })
      if (!res.ok) throw new Error('Failed to fetch persona guide')
      return res.json() as Promise<{ llm_prompt: string; [key: string]: unknown }>
    },

    // Legacy endpoint - will be replaced with Thin Client flow
    async createSession(body: Schemas['CreatePersonaRequest']) {
      const { data, error } = await client.POST('/v1/persona', { body })
      if (error) throw new Error((error as Schemas['ErrorResponse']).error.message)
      return data
    },

    // Legacy endpoint
    async processAppraisal(body: Schemas['ProcessAppraisalRequest']) {
      const { data, error } = await client.POST('/v1/turn/appraisal', { body })
      if (error) throw new Error((error as Schemas['ErrorResponse']).error.message)
      return data
    },

    // New Thin Client endpoints
    async prepareChat(worldId: string, personaId: string, message: string) {
      const res = await fetch(`${baseUrl}/v1/prompt/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ worldId, personaId, message }),
      })
      if (!res.ok) throw new Error('Failed to prepare chat')
      return res.json() as Promise<{
        prompt: { system: string; context: string; instruction: string }
        schema: object
        sessionId: string
        metadata: { personaId: string; turnNumber: number }
      }>
    },

    async completeChat(sessionId: string, personaId: string, text: string, appraisal: any) {
      const res = await fetch(`${baseUrl}/v1/prompt/chat/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ sessionId, personaId, text, appraisal }),
      })
      if (!res.ok) throw new Error('Failed to complete chat')
      return res.json() as Promise<{
        emotion: any
        text: string
        reflectionRequired: boolean
        reflectionPrompt?: { system: string; user: string }
      }>
    },

    async getState(sessionId: string) {
      const { data, error } = await client.GET('/v1/state/{sessionId}', {
        params: { path: { sessionId } },
      })
      if (error) throw new Error((error as Schemas['ErrorResponse']).error.message)
      return data
    },
  }
}

export type MolrooClient = ReturnType<typeof createMolrooClient>
