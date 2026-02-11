import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { createMolrooClient, DEFAULT_API_URL, DEFAULT_API_KEY } from '../lib/api/client'
import { PERSONA_PRESETS } from '../lib/api/presets'
import { generateWithAppraisal } from '../lib/llm/chat'
import type { LlmConfig } from '../lib/llm/chat'
import type { TurnResultResponse, StateResponse, PersonaIdentity } from '../lib/api/types'

export type { LlmConfig } from '../lib/llm/chat'

export interface SessionState {
  status: 'idle' | 'creating' | 'active' | 'error'
  sessionId: string | null
  presetName: string | null
  error: string | null
}

export interface TurnEntry {
  id: number
  userMessage: string
  response: TurnResultResponse
  llmResponse: string | null
  timestamp: number
}

const INITIAL_SESSION: SessionState = {
  status: 'idle',
  sessionId: null,
  presetName: null,
  error: null,
}

const LS_KEY = 'molroo-llm-config'

function loadLlmConfig(): LlmConfig {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<LlmConfig>
      return { provider: saved.provider ?? 'none', apiKey: '', model: saved.model, baseUrl: saved.baseUrl }
    }
  } catch { /* ignore */ }
  return { provider: 'none', apiKey: '' }
}

function saveLlmConfig(config: LlmConfig) {
  const { apiKey: _, ...rest } = config
  localStorage.setItem(LS_KEY, JSON.stringify(rest))
}

export function useSession() {
  const [session, setSession] = useState<SessionState>(INITIAL_SESSION)
  const [molrooApiKey, setMolrooApiKey] = useState(DEFAULT_API_KEY)
  const [llmConfig, setLlmConfigState] = useState<LlmConfig>(loadLlmConfig)
  const [turnHistory, setTurnHistory] = useState<TurnEntry[]>([])
  const [currentState, setCurrentState] = useState<StateResponse | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const turnIdRef = useRef(0)
  const systemPromptRef = useRef<string>('')

  const setLlmConfig = useCallback((config: LlmConfig) => {
    setLlmConfigState(config)
    saveLlmConfig(config)
  }, [])

  const client = useMemo(
    () => createMolrooClient(DEFAULT_API_URL, molrooApiKey),
    [molrooApiKey],
  )

  const createSession = useCallback(async (presetKey: string, identity: PersonaIdentity) => {
    setSession({ status: 'creating', sessionId: null, presetName: presetKey, error: null })
    try {
      console.log('[Session] creating...', presetKey)
      const res = await client.createSession({
        persona: { identity },
        preset: presetKey,
      })
      console.log('[Session] created:', res.sessionId)
      if (!res.sessionId) {
        console.error('[Session] No sessionId in response:', JSON.stringify(res))
        setSession(prev => ({ ...prev, status: 'error', error: 'No sessionId in response' }))
        return
      }
      setSession({ status: 'active', sessionId: res.sessionId, presetName: presetKey, error: null })
      setTurnHistory([])
      setCurrentState(null)
      turnIdRef.current = 0

      systemPromptRef.current = res.prompt_data?.system?.formatted?.system_prompt ?? ''

      try {
        const state = await client.getState(res.sessionId)
        setCurrentState(state)
      } catch (stateErr) {
        console.warn('[Session] getState failed (non-fatal):', stateErr)
      }
    } catch (err) {
      console.error('[Session] createSession failed:', err)
      const msg = err instanceof Error ? err.message : 'Failed to create session'
      setSession(prev => ({ ...prev, status: 'error', error: msg }))
    }
  }, [client])

  // Cached prompt_data from last appraisal response (context + instruction update each turn)
  const promptDataRef = useRef<{ ctx: string; inst: string }>({ ctx: '', inst: '' })

  const sendMessage = useCallback(async (message: string): Promise<{
    turnResponse: TurnResultResponse
    displayText: string
  } | null> => {
    if (!session.sessionId || isProcessing) return null
    setIsProcessing(true)
    try {
      let finalRes: TurnResultResponse | null = null
      let llmText: string | null = null

      if (llmConfig.provider !== 'none' && llmConfig.apiKey) {
        const history = turnHistory.flatMap(t => [
          { role: 'user' as const, content: t.userMessage },
          { role: 'assistant' as const, content: t.llmResponse ?? t.response.response },
        ])

        // Single LLM call → text + appraisal via tool calling
        const { text: chatResponse, appraisal } = await generateWithAppraisal(
          llmConfig, systemPromptRef.current,
          promptDataRef.current.ctx, promptDataRef.current.inst,
          message, history,
        )

        llmText = chatResponse
        console.log('[Appraisal] Evaluated:', appraisal)

        // Send appraisal to molroo API → get emotion + updated prompt_data
        finalRes = await client.processAppraisal({
          sessionId: session.sessionId,
          appraisal,
          context: message,
        })
        console.log('[Appraisal] Result:', finalRes.discrete_emotion)

        // Cache updated prompt_data for next turn
        promptDataRef.current = {
          ctx: finalRes.prompt_data?.context?.formatted?.context_block ?? '',
          inst: finalRes.prompt_data?.instruction?.formatted?.instruction_block ?? '',
        }
      } else {
        // No LLM — just send appraisal with defaults
        finalRes = await client.processAppraisal({
          sessionId: session.sessionId,
          appraisal: {
            goal_relevance: 0.5, goal_congruence: 0.5, expectedness: 0.5,
            controllability: 0.5, agency: 0.5, norm_compatibility: 0.5,
          },
          context: message,
        })
      }

      const entry: TurnEntry = {
        id: ++turnIdRef.current,
        userMessage: message,
        response: finalRes,
        llmResponse: llmText,
        timestamp: Date.now(),
      }
      setTurnHistory(prev => [...prev, entry])

      setCurrentState(prev => prev ? {
        ...prev,
        emotion: finalRes.new_emotion,
        emotion_intensity: finalRes.emotion_intensity,
        discrete_emotion: finalRes.discrete_emotion,
        body_budget: finalRes.body_budget,
        soul_stage: finalRes.soul_stage,
        velocity: finalRes.velocity,
        blend_ratio: finalRes.blend_ratio,
      } : null)

      return {
        turnResponse: finalRes,
        displayText: llmText ?? finalRes.response,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to process turn'
      setSession(prev => ({ ...prev, error: msg }))
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [session.sessionId, isProcessing, llmConfig, client])

  const resumeSession = useCallback(async (sessionId: string) => {
    setSession({ status: 'creating', sessionId: null, presetName: null, error: null })
    try {
      const state = await client.getState(sessionId)
      setSession({ status: 'active', sessionId, presetName: null, error: null })
      setTurnHistory([])
      setCurrentState(state)
      turnIdRef.current = 0
      systemPromptRef.current = ''
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Session not found'
      setSession(prev => ({ ...prev, status: 'error', error: msg }))
    }
  }, [client])

  const reset = useCallback(() => {
    setSession(INITIAL_SESSION)
    setTurnHistory([])
    setCurrentState(null)
    systemPromptRef.current = ''
    turnIdRef.current = 0
  }, [])

  return {
    session,
    molrooApiKey,
    setMolrooApiKey,
    llmConfig,
    setLlmConfig,
    turnHistory,
    currentState,
    isProcessing,
    createSession,
    resumeSession,
    sendMessage,
    reset,
    presets: PERSONA_PRESETS,
  }
}
