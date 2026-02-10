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
    <div style={{ padding: '8px 0' }}>
      <h3 style={headingStyle}>Expressions</h3>
      <div style={gridStyle}>
        {expressionNames.map(name => (
          <button
            key={name}
            onClick={() => handleClick(name)}
            style={{
              ...buttonStyle,
              ...(activeExpression === name ? activeButtonStyle : {}),
            }}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}

const headingStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#888',
  margin: '0 0 8px 0',
  padding: '0 12px',
}

const gridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
  padding: '0 12px',
}

const buttonStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: '12px',
  border: '1px solid #333',
  borderRadius: '4px',
  background: '#1a1a1a',
  color: '#ccc',
  cursor: 'pointer',
  transition: 'all 0.15s',
}

const activeButtonStyle: React.CSSProperties = {
  background: '#2d5a3d',
  borderColor: '#4a9',
  color: '#fff',
}
