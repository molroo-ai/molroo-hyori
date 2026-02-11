import { useState, useEffect, useRef } from 'react'
import { hyoriCharacter } from './characters/hyori'
import { Live2DViewer } from './components/Live2DViewer'
import { MangaBackground } from './components/MangaBackground'
import { ChatPanel } from './components/ChatPanel'
import { DevPanel } from './components/dev/DevPanel'
import { useSession } from './hooks/useSession'
import { applyEmotionToLive2D } from './lib/live2d/emotion-controller'
import type { Live2DController, ActiveMotion } from './hooks/useLive2D'
import type { LlmConfig } from './hooks/useSession'
import type { TurnResultResponse } from './lib/api/types'
import './App.css'

const EMOTION_SYMBOLS: Record<string, string> = {
  joy: '♪',
  contentment: '~',
  trust: '♡',
  calm: '―',
  surprise: '?!',
  excitement: '☆',
  anger: '#',
  disgust: ';;;',
  fear: '!!',
  anxiety: '...?',
  sadness: 'ㅠ',
  guilt: '...',
  numbness: '. . .',
  shame: '///',
}

/** Any emotion change gets a symbol; unknown emotions default to '!' */
function emotionToSymbol(emotion: string): string {
  return EMOTION_SYMBOLS[emotion] ?? '!'
}

export default function App() {
  const [controller, setController] = useState<Live2DController | null>(null)
  const [activeMotion, setActiveMotion] = useState<ActiveMotion | null>(null)
  const [devOpen, setDevOpen] = useState(false)
  const [emotionReaction, setEmotionReaction] = useState<string | null>(null)
  const autoSessionRef = useRef(false)
  const prevEmotionRef = useRef<string | null>(null)

  const {
    session, molrooApiKey, setMolrooApiKey,
    llmConfig, setLlmConfig,
    turnHistory, currentState, isProcessing,
    createSession, resumeSession, sendMessage, reset, presets,
  } = useSession()

  // Auto-create or resume session from URL params
  // e.g. ?provider=openai&apiKey=sk-xxx&model=gpt-4o-mini&preset=cheerful_companion
  // or   ?baseUrl=https://api.example.com/v1&apiKey=xxx&model=my-model
  // or   ?sessionId=abc-123&provider=openai&apiKey=sk-xxx  (resume existing)
  useEffect(() => {
    console.log('[AutoSession] ref:', autoSessionRef.current, 'search:', window.location.search)
    if (autoSessionRef.current) return
    const params = new URLSearchParams(window.location.search)

    // LLM config from params
    const provider = params.get('provider')
      ?? (params.get('baseUrl') ? 'openai-compatible' : null)

    const sessionId = params.get('sessionId')
    console.log('[AutoSession] provider:', provider, 'sessionId:', sessionId)
    if (!provider && !sessionId) return

    autoSessionRef.current = true

    if (provider) {
      const config: LlmConfig = {
        provider,
        apiKey: params.get('apiKey') ?? params.get('key') ?? '',
        model: params.get('model') ?? undefined,
        baseUrl: params.get('baseUrl') ?? undefined,
      }
      setLlmConfig(config)
    }

    if (sessionId) {
      resumeSession(sessionId)
    } else {
      const presetKey = params.get('preset') ?? Object.keys(presets)[0]
      const preset = presets[presetKey]
      console.log('[AutoSession] preset:', presetKey, !!preset)
      if (preset) {
        createSession(presetKey, preset.identity)
          .then(() => console.log('[AutoSession] created'))
          .catch((e: unknown) => console.error('[AutoSession] failed:', e))
      }
    }

    // Remove API key from URL immediately for security
    params.delete('apiKey')
    params.delete('key')
    const clean = params.toString()
    window.history.replaceState({}, '', clean ? `?${clean}` : window.location.pathname)
  }, [setLlmConfig, createSession, resumeSession, presets])

  // Update URL with sessionId when session becomes active
  useEffect(() => {
    if (session.status !== 'active' || !session.sessionId) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('sessionId') === session.sessionId) return
    params.set('sessionId', session.sessionId)
    // Remove creation-only params
    params.delete('preset')
    params.delete('apiKey')
    params.delete('key')
    window.history.replaceState({}, '', `?${params.toString()}`)
  }, [session.status, session.sessionId])

  function handleTurnResponse(res: TurnResultResponse) {
    if (!controller) return
    applyEmotionToLive2D(controller, res)

    // Show reaction bubble on emotion change
    const newEmotion = res.discrete_emotion.primary
    if (prevEmotionRef.current && prevEmotionRef.current !== newEmotion) {
      setEmotionReaction(emotionToSymbol(newEmotion))
    }
    prevEmotionRef.current = newEmotion
  }

  return (
    <div className="app-layout">
      {/* Main column: Live2D + Chat */}
      <div className="main-column">
        <MangaBackground />
        <Live2DViewer
          character={hyoriCharacter}
          onReady={(ctrl) => {
            setController(ctrl)
            ctrl.setCameraTracking(true)
          }}
          onActiveMotionChange={setActiveMotion}
        />
        <ChatPanel
          characterName={hyoriCharacter.name}
          session={session}
          isProcessing={isProcessing}
          onSend={sendMessage}
          onTurnResponse={handleTurnResponse}
          emotionReaction={emotionReaction}
          onEmotionReactionDone={() => setEmotionReaction(null)}
        />
        <div className="attribution">
          Powered by Live2D
        </div>

        {/* Toggle for DevPanel */}
        <button
          className="dev-toggle"
          onClick={() => setDevOpen(!devOpen)}
          aria-label="Toggle developer panel"
        >
          {devOpen ? '\u2715' : '</>'}
        </button>
      </div>

      {/* Developer panel */}
      <div className={`dev-column ${devOpen ? '' : 'dev-column--hidden'}`}>
        <DevPanel
          session={session}
          molrooApiKey={molrooApiKey}
          onMolrooApiKeyChange={setMolrooApiKey}
          llmConfig={llmConfig}
          onLlmConfigChange={setLlmConfig}
          currentState={currentState}
          turnHistory={turnHistory}
          isProcessing={isProcessing}
          presets={presets}
          onCreateSession={createSession}
          onReset={reset}
        />
      </div>
    </div>
  )
}
