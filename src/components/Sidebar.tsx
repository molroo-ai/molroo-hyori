import type { CharacterPackage } from '../characters/types'
import type { Live2DController, ActiveMotion } from '../hooks/useLive2D'
import { ExpressionPanel } from './ExpressionPanel'
import { MotionPanel } from './MotionPanel'
import { ControlPanel } from './ControlPanel'

interface SidebarProps {
  character: CharacterPackage
  controller: Live2DController | null
  activeExpression: string | null
  onExpressionChange: (name: string | null) => void
  activeMotion: ActiveMotion | null
}

export function Sidebar({ character, controller, activeExpression, onExpressionChange, activeMotion }: SidebarProps) {
  return (
    <div className="w-[280px] min-w-[280px] bg-card border-r border-border flex flex-col h-full">
      <div className="flex justify-between items-center px-3 py-3 border-b border-border text-sm text-foreground">
        <span className="font-bold">{character.name}</span>
        <span className={`text-[11px] ${controller?.isLoaded ? 'text-accent' : 'text-muted-foreground'}`}>
          {controller?.isLoaded ? 'loaded' : 'loading...'}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col">
        <ExpressionPanel
          character={character}
          controller={controller}
          activeExpression={activeExpression}
          onExpressionChange={onExpressionChange}
        />
        <div className="h-px bg-border my-1" />
        <MotionPanel character={character} controller={controller} activeMotion={activeMotion} />
        <div className="h-px bg-border my-1" />
        <ControlPanel controller={controller} />
      </div>
    </div>
  )
}
