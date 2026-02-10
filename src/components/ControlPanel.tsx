import { useState } from 'react'
import type { CameraTrackingStatus } from '../lib/face-tracking/jeeliz-adapter'
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

const STATUS_LABEL: Record<CameraTrackingStatus, string> = {
  off: 'Off',
  requesting: 'Requesting…',
  active: 'Active',
  error: 'Error',
}

const STATUS_COLOR: Record<CameraTrackingStatus, string> = {
  off: '#666',
  requesting: '#c90',
  active: '#0c6',
  error: '#c33',
}

export function ControlPanel({ controller }: ControlPanelProps) {
  const cameraStatus = controller?.cameraTrackingStatus ?? 'off'
  const isCameraOn = cameraStatus === 'active' || cameraStatus === 'requesting'

  return (
    <div className="py-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-3">
        Controls
      </h3>

      <div className="px-3 py-1 mb-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#999]">Camera Tracking</span>
          <div className="flex items-center gap-2">
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: STATUS_COLOR[cameraStatus],
              }}
            />
            <span className="text-[10px]" style={{ color: STATUS_COLOR[cameraStatus] }}>
              {STATUS_LABEL[cameraStatus]}
            </span>
          </div>
        </div>
        <button
          onClick={() => controller?.setCameraTracking(!isCameraOn)}
          disabled={!controller}
          style={{
            marginTop: 4,
            width: '100%',
            padding: '4px 0',
            fontSize: 11,
            border: '1px solid #333',
            borderRadius: 4,
            background: isCameraOn ? '#1a2a1a' : '#1a1a1a',
            color: isCameraOn ? '#0c6' : '#999',
            cursor: controller ? 'pointer' : 'not-allowed',
          }}
        >
          {isCameraOn ? 'Disable Camera' : 'Enable Camera'}
        </button>
      </div>

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
