import { useState } from 'react'
import type { Live2DController } from '../hooks/useLive2D'

interface ControlPanelProps {
  controller: Live2DController | null
}

interface SliderConfig {
  label: string
  min: number
  max: number
  step: number
  defaultValue: number
  onChange: (value: number) => void
}

function Slider({ label, min, max, step, defaultValue, onChange }: SliderConfig) {
  const [value, setValue] = useState(defaultValue)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value)
    setValue(v)
    onChange(v)
  }

  return (
    <div className="px-3 py-0.5">
      <div className="flex justify-between text-[11px] text-[#999]">
        <span>{label}</span>
        <span>{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full accent-accent"
      />
    </div>
  )
}

export function ControlPanel({ controller }: ControlPanelProps) {
  return (
    <div className="py-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-3">
        Controls
      </h3>

      <Slider
        label="Head X"
        min={-30} max={30} step={1} defaultValue={0}
        onChange={v => controller?.setHeadRotation(v, 0)}
      />
      <Slider
        label="Head Y"
        min={-30} max={30} step={1} defaultValue={0}
        onChange={v => controller?.setHeadRotation(0, v)}
      />
      <Slider
        label="Body X"
        min={-10} max={10} step={0.5} defaultValue={0}
        onChange={v => controller?.setBodyRotation(v)}
      />
      <Slider
        label="Eye X"
        min={-1} max={1} step={0.05} defaultValue={0}
        onChange={v => controller?.lookAt(v, 0)}
      />
      <Slider
        label="Eye Y"
        min={-1} max={1} step={0.05} defaultValue={0}
        onChange={v => controller?.lookAt(0, v)}
      />
      <Slider
        label="Mouth"
        min={0} max={1} step={0.05} defaultValue={0}
        onChange={v => controller?.setMouthOpen(v)}
      />
    </div>
  )
}
