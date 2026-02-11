import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { createMolrooClient, DEFAULT_API_URL, DEFAULT_API_KEY } from '../lib/api/client'
import { PERSONA_PRESETS } from '../lib/api/presets'
import { generateResponse } from '../lib/llm/chat'
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
      const res = await client.createSession({
        persona: { identity },
        preset: presetKey,
      })
      setSession({ status: 'active', sessionId: res.sessionId, presetName: presetKey, error: null })
      setTurnHistory([])
      setCurrentState(null)
      turnIdRef.current = 0

      systemPromptRef.current = res.prompt_data?.system?.formatted?.system_prompt ?? ''

      const state = await client.getState(res.sessionId)
      setCurrentState(state)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create session'
      setSession(prev => ({ ...prev, status: 'error', error: msg }))
    }
  }, [client])

  const sendMessage = useCallback(async (message: string): Promise<{
    turnResponse: TurnResultResponse
    displayText: string
  } | null> => {
    if (!session.sessionId || isProcessing) return null
    setIsProcessing(true)
    try {
      const res = await client.processTurn({
        sessionId: session.sessionId,
        message,
      })

      let llmText: string | null = null
      if (llmConfig.provider !== 'none' && llmConfig.apiKey) {
        const ctx = res.prompt_data?.context?.formatted?.context_block ?? ''
        const inst = res.prompt_data?.instruction?.formatted?.instruction_block ?? ''
        const history = turnHistory.flatMap(t => [
          { role: 'user' as const, content: t.userMessage },
          { role: 'assistant' as const, content: t.llmResponse ?? t.response.response },
        ])
        llmText = await generateResponse(llmConfig, systemPromptRef.current, ctx, inst, message, history)
      }

      const entry: TurnEntry = {
        id: ++turnIdRef.current,
        userMessage: message,
        response: res,
        llmResponse: llmText,
        timestamp: Date.now(),
      }
      setTurnHistory(prev => [...prev, entry])

      setCurrentState(prev => prev ? {
        ...prev,
        emotion: res.new_emotion,
        emotion_intensity: res.emotion_intensity,
        discrete_emotion: res.discrete_emotion,
        body_budget: res.body_budget,
        soul_stage: res.soul_stage,
        velocity: res.velocity,
        blend_ratio: res.blend_ratio,
      } : null)

      return {
        turnResponse: res,
        displayText: llmText ?? res.response,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to process turn'
      setSession(prev => ({ ...prev, error: msg }))
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [session.sessionId, isProcessing, llmConfig, client])

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
    sendMessage,
    reset,
    presets: PERSONA_PRESETS,
  }
}
