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
    <div style={{ padding: '2px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#999' }}>
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
        style={{ width: '100%', accentColor: '#4a9' }}
      />
    </div>
  )
}

export function ControlPanel({ controller }: ControlPanelProps) {
  return (
    <div style={{ padding: '8px 0' }}>
      <h3 style={headingStyle}>Controls</h3>

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

const headingStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#888',
  margin: '0 0 8px 0',
  padding: '0 12px',
}
