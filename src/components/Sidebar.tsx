import type { CharacterPackage } from '../characters/types'
import type { Live2DController, ActiveMotion } from '../hooks/useLive2D'
import { ExpressionPanel } from './ExpressionPanel'
import { MotionPanel } from './MotionPanel'
import { ControlPanel } from './ControlPanel'
import { ChatPanel } from './ChatPanel'

interface SidebarProps {
  character: CharacterPackage
  controller: Live2DController | null
  activeExpression: string | null
  onExpressionChange: (name: string | null) => void
  activeMotion: ActiveMotion | null
}

export function Sidebar({ character, controller, activeExpression, onExpressionChange, activeMotion }: SidebarProps) {
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 700 }}>{character.name}</span>
        <span style={{ fontSize: '11px', color: controller?.isLoaded ? '#4a9' : '#888' }}>
          {controller?.isLoaded ? 'loaded' : 'loading...'}
        </span>
      </div>
      <div style={scrollAreaStyle}>
        <ExpressionPanel
          character={character}
          controller={controller}
          activeExpression={activeExpression}
          onExpressionChange={onExpressionChange}
        />
        <div style={dividerStyle} />
        <MotionPanel character={character} controller={controller} activeMotion={activeMotion} />
        <div style={dividerStyle} />
        <ControlPanel controller={controller} />
        <div style={dividerStyle} />
        <ChatPanel />
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  width: '280px',
  minWidth: '280px',
  background: '#111',
  borderRight: '1px solid #222',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px',
  borderBottom: '1px solid #222',
  fontSize: '14px',
  color: '#eee',
}

const scrollAreaStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
}

const dividerStyle: React.CSSProperties = {
  height: '1px',
  background: '#222',
  margin: '4px 0',
}
