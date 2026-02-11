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
      'Authorization': `Bearer ${apiKey}`,
    },
  })

  return {
    async createSession(body: Schemas['CreatePersonaRequest']) {
      const { data, error } = await client.POST('/v1/persona', { body })
      if (error) throw new Error((error as Schemas['ErrorResponse']).error.message)
      return data
    },

    async processAppraisal(body: Schemas['ProcessAppraisalRequest']) {
      const { data, error } = await client.POST('/v1/turn/appraisal', { body })
      if (error) throw new Error((error as Schemas['ErrorResponse']).error.message)
      return data
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
