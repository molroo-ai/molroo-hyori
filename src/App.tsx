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

export default function App() {
  const [controller, setController] = useState<Live2DController | null>(null)
  const [activeMotion, setActiveMotion] = useState<ActiveMotion | null>(null)
  const [devOpen, setDevOpen] = useState(false)
  const autoSessionRef = useRef(false)

  const {
    session, molrooApiKey, setMolrooApiKey,
    llmConfig, setLlmConfig,
    turnHistory, currentState, isProcessing,
    createSession, sendMessage, reset, presets,
  } = useSession()

  // Auto-create session from URL params
  // e.g. ?provider=openai&apiKey=sk-xxx&model=gpt-4o-mini&preset=cheerful_companion
  // or   ?baseUrl=https://api.example.com/v1&apiKey=xxx&model=my-model
  useEffect(() => {
    if (autoSessionRef.current) return
    const params = new URLSearchParams(window.location.search)
    const provider = params.get('provider')
      ?? (params.get('baseUrl') ? 'openai-compatible' : null)
    if (!provider) return

    autoSessionRef.current = true

    const config: LlmConfig = {
      provider,
      apiKey: params.get('apiKey') ?? params.get('key') ?? '',
      model: params.get('model') ?? undefined,
      baseUrl: params.get('baseUrl') ?? undefined,
    }
    setLlmConfig(config)

    const presetKey = params.get('preset') ?? Object.keys(presets)[0]
    const preset = presets[presetKey]
    if (preset) {
      createSession(presetKey, preset.identity)
    }

    // Remove API key from URL for security
    window.history.replaceState({}, '', window.location.pathname)
  }, [setLlmConfig, createSession, presets])

  function handleTurnResponse(res: TurnResultResponse) {
    if (!controller) return
    applyEmotionToLive2D(controller, res)
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
