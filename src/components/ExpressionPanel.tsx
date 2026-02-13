import type { CharacterPackage } from '../characters/types'
import type { Live2DController } from '../hooks/useLive2D'

interface ExpressionPanelProps {
  character: CharacterPackage
  controller: Live2DController | null
  activeExpression: string | null
  onExpressionChange: (name: string | null) => void
}

export function ExpressionPanel({ character, controller, activeExpression, onExpressionChange }: ExpressionPanelProps) {
  const expressionNames = Object.keys(character.expressions)

  function handleClick(name: string) {
    if (!controller) return

    if (activeExpression === name) {
      controller.clearExpression()
      onExpressionChange(null)
    } else {
      controller.setExpression(name)
      onExpressionChange(name)
    }
  }

  return (
    <div className="py-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-3">
        Expressions
      </h3>
      <div className="flex flex-wrap gap-1 px-3">
        {expressionNames.map(name => (
          <button
            key={name}
            onClick={() => handleClick(name)}
            className={`px-2.5 py-1 text-xs border rounded cursor-pointer transition-all duration-150
              ${activeExpression === name
                ? 'bg-[#2d5a3d] border-accent text-white'
                : 'bg-secondary border-input text-foreground hover:bg-[#252525]'
              }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}
