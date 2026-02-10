import type { CharacterPackage } from '../characters/types'
import type { Live2DController, ActiveMotion } from '../hooks/useLive2D'

interface MotionPanelProps {
  character: CharacterPackage
  controller: Live2DController | null
  activeMotion: ActiveMotion | null
}

export function MotionPanel({ character, controller, activeMotion }: MotionPanelProps) {
  const presetMotions = Object.entries(character.motions)
  const rawGroups = controller?.motionGroups ?? {}
  const active = activeMotion

  function isActive(group: string, index: number) {
    return active?.group === group && active?.index === index
  }

  return (
    <div style={{ padding: '8px 0' }}>
      <h3 style={headingStyle}>Preset Motions</h3>
      <div style={gridStyle}>
        {presetMotions.map(([key, def]) => (
          <button
            key={key}
            onClick={() => controller?.playMotion(def.group, def.index)}
            style={{
              ...buttonStyle,
              ...(isActive(def.group, def.index) ? activeButtonStyle : {}),
            }}
            title={def.label}
          >
            {key}
          </button>
        ))}
      </div>

      <h3 style={{ ...headingStyle, marginTop: '12px' }}>Raw Motion Groups</h3>
      <div style={gridStyle}>
        {Object.entries(rawGroups).map(([group, count]) => (
          Array.from({ length: count }, (_, i) => (
            <button
              key={`${group}-${i}`}
              onClick={() => controller?.playMotion(group, i)}
              style={{
                ...buttonStyle,
                ...(isActive(group, i) ? activeButtonStyle : {}),
              }}
            >
              {group}[{i}]
            </button>
          ))
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
  background: '#2d4a5a',
  borderColor: '#4a9ec9',
  color: '#fff',
}
