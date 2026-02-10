import { useState } from 'react'
import type { TurnEntry } from '../../hooks/useSession'
import { Badge } from '../ui/badge'

interface TimelineTabProps {
  history: TurnEntry[]
}

export function TimelineTab({ history }: TimelineTabProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  if (history.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No turns yet. Start a conversation to build the timeline.</p>
  }

  const vValues = history.map(t => t.response.new_emotion.V)
  const aValues = history.map(t => t.response.new_emotion.A)
  const dValues = history.map(t => t.response.new_emotion.D)

  return (
    <div className="space-y-3">
      {history.length >= 2 && (
        <div className="flex gap-4 border-b border-border pb-3">
          <SparkRow label="V" values={vValues} />
          <SparkRow label="A" values={aValues} />
          <SparkRow label="D" values={dValues} />
        </div>
      )}

      <div className="space-y-2">
        {[...history].reverse().map(entry => (
          <TurnCard key={entry.id} entry={entry}
            expanded={expandedId === entry.id}
            onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)} />
        ))}
      </div>
    </div>
  )
}

function TurnCard({ entry, expanded, onToggle }: {
  entry: TurnEntry; expanded: boolean; onToggle: () => void
}) {
  const { response: res } = entry
  const delta = res.emotion_delta

  return (
    <div className="cursor-pointer rounded-lg border border-border bg-card p-3 transition-colors hover:border-muted-foreground/30"
      onClick={onToggle}>
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[11px] font-semibold text-primary">#{entry.id}</span>
        <Badge variant="secondary" className="text-[11px]">{res.discrete_emotion.primary}</Badge>
        <span className="text-[11px] text-muted-foreground">{res.discrete_emotion.intensity}</span>
      </div>
      <p className="mb-1 truncate text-xs text-muted-foreground">{entry.userMessage}</p>
      <div className="flex gap-2">
        <VadDelta label="V" value={delta.V} />
        <VadDelta label="A" value={delta.A} />
        <VadDelta label="D" value={delta.D} />
      </div>
      {expanded && (
        <div className="mt-2 border-t border-border pt-2">
          <p className="mb-2 text-xs leading-relaxed text-foreground">{res.response}</p>
          <pre className="max-h-[150px] overflow-auto rounded-md bg-[#0d0d0d] p-2 font-mono text-[10px] text-lime-400">
            {JSON.stringify({ appraisal: res.appraisal, prediction_error: res.prediction_error }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function VadDelta({ label, value }: { label: string; value: number }) {
  const color = value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-muted-foreground'
  const sign = value >= 0 ? '+' : ''
  return (
    <span className={`font-mono text-[11px] ${color}`}>
      {label}:{sign}{value.toFixed(3)}
    </span>
  )
}

function Sparkline({ values, width = 80, height = 20 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null
  const min = Math.min(...values, -1)
  const max = Math.max(...values, 1)
  const range = max - min || 1
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="block">
      <polyline points={points} fill="none" stroke="#60a5fa" strokeWidth="1.5" />
    </svg>
  )
}

function SparkRow({ label, values }: { label: string; values: number[] }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 text-[11px] font-semibold text-muted-foreground">{label}</span>
      <Sparkline values={values} />
    </div>
  )
}
