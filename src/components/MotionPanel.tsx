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

  const btnBase = 'px-2.5 py-1 text-xs border rounded cursor-pointer transition-all duration-150'
  const btnDefault = 'bg-secondary border-input text-foreground hover:bg-[#252525]'
  const btnActive = 'bg-[#2d4a5a] border-[#4a9ec9] text-white'

  return (
    <div className="py-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-3">
        Preset Motions
      </h3>
      <div className="flex flex-wrap gap-1 px-3">
        {presetMotions.map(([key, def]) => (
          <button
            key={key}
            onClick={() => controller?.playMotion(def.group, def.index)}
            className={`${btnBase} ${isActive(def.group, def.index) ? btnActive : btnDefault}`}
            title={def.label}
          >
            {key}
          </button>
        ))}
      </div>

      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 mt-3 px-3">
        Raw Motion Groups
      </h3>
      <div className="flex flex-wrap gap-1 px-3">
        {Object.entries(rawGroups).map(([group, count]) => (
          Array.from({ length: count }, (_, i) => (
            <button
              key={`${group}-${i}`}
              onClick={() => controller?.playMotion(group, i)}
              className={`${btnBase} ${isActive(group, i) ? btnActive : btnDefault}`}
            >
              {group}[{i}]
            </button>
          ))
        ))}
      </div>
    </div>
  )
}
