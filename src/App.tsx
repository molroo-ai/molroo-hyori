import { useState } from 'react'
import { hyoriCharacter } from './characters/hyori'
import { Live2DViewer } from './components/Live2DViewer'
import { Sidebar } from './components/Sidebar'
import { ChatPanel } from './components/ChatPanel'
import type { Live2DController, ActiveMotion } from './hooks/useLive2D'
import './App.css'

export default function App() {
  const [controller, setController] = useState<Live2DController | null>(null)
  const [activeExpression, setActiveExpression] = useState<string | null>(null)
  const [activeMotion, setActiveMotion] = useState<ActiveMotion | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      {/* Mobile sidebar toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? '\u2715' : '\u2630'}
      </button>

      {/* Sidebar — always visible on desktop, overlay on mobile */}
      <div className={`sidebar-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar
          character={hyoriCharacter}
          controller={controller}
          activeExpression={activeExpression}
          onExpressionChange={setActiveExpression}
          activeMotion={activeMotion}
        />
      </div>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="main-area">
        <Live2DViewer
          character={hyoriCharacter}
          onReady={setController}
          onActiveMotionChange={setActiveMotion}
        />
        <ChatPanel characterName={hyoriCharacter.name} />
        <div className="absolute bottom-2 right-3 text-[10px] text-[#444] pointer-events-none">
          This content uses sample data owned and copyrighted by Live2D Inc.
        </div>
      </div>
    </div>
  )
}
