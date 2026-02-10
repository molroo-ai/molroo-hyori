import { useState } from 'react'
import { hyoriCharacter } from './characters/hyori'
import { Live2DViewer } from './components/Live2DViewer'
import { Sidebar } from './components/Sidebar'
import type { Live2DController, ActiveMotion } from './hooks/useLive2D'
import './App.css'

export default function App() {
  const [controller, setController] = useState<Live2DController | null>(null)
  const [activeExpression, setActiveExpression] = useState<string | null>(null)
  const [activeMotion, setActiveMotion] = useState<ActiveMotion | null>(null)

  return (
    <div className="app">
      <Sidebar
        character={hyoriCharacter}
        controller={controller}
        activeExpression={activeExpression}
        onExpressionChange={setActiveExpression}
        activeMotion={activeMotion}
      />
      <div className="viewer">
        <Live2DViewer
          character={hyoriCharacter}
          onReady={setController}
          onActiveMotionChange={setActiveMotion}
        />
        <div className="attribution">
          This content uses sample data owned and copyrighted by Live2D Inc.
        </div>
      </div>
    </div>
  )
}
