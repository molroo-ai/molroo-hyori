import type { StateResponse } from '../../lib/api/types'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

interface EmotionTabProps {
  state: StateResponse | null
}

export function EmotionTab({ state }: EmotionTabProps) {
  if (!state) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No session active. Create one in Setup tab.</p>
  }

  const { emotion, discrete_emotion, body_budget, soul_stage, blend_ratio, velocity } = state

  return (
    <div className="space-y-5">
      <Section title="VAD State">
        <VadBar label="V" value={emotion.V} />
        <VadBar label="A" value={emotion.A} />
        <VadBar label="D" value={emotion.D} />
      </Section>

      <Section title="Velocity">
        <VadBar label="V" value={velocity.V} />
        <VadBar label="A" value={velocity.A} />
        <VadBar label="D" value={velocity.D} />
      </Section>

      <Section title="Discrete Emotion">
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">{discrete_emotion.primary}</Badge>
          {discrete_emotion.secondary && <Badge variant="secondary">{discrete_emotion.secondary}</Badge>}
          <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
            {discrete_emotion.intensity}
          </Badge>
        </div>
      </Section>

      <Section title="Status">
        <div className="space-y-2">
          <StatusRow label="Body Budget">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-300",
                body_budget > 0.5 ? 'bg-green-400' : body_budget > 0.25 ? 'bg-yellow-400' : 'bg-red-400')}
                style={{ width: `${body_budget * 100}%` }} />
            </div>
            <span className="w-12 text-right font-mono text-xs text-muted-foreground">{(body_budget * 100).toFixed(0)}%</span>
          </StatusRow>
          <StatusRow label="Soul Stage">
            <span className="text-xs text-muted-foreground">{soul_stage.name} (#{soul_stage.id})</span>
          </StatusRow>
          <StatusRow label="Blend">
            <span className="font-mono text-xs text-muted-foreground">
              R:{blend_ratio.rational.toFixed(2)} / I:{blend_ratio.irrational.toFixed(2)}
            </span>
          </StatusRow>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

function VadBar({ label, value }: { label: string; value: number }) {
  const pct = ((value + 1) / 2) * 100
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-[11px] font-semibold text-muted-foreground">{label}</span>
      <div className="relative h-2 flex-1 rounded-full bg-muted">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
        <div className="absolute top-0 h-full rounded-full transition-all duration-300"
          style={{
            left: value >= 0 ? '50%' : `${pct}%`,
            width: `${Math.abs(value) * 50}%`,
            background: value >= 0 ? '#4ade80' : '#f87171',
          }} />
      </div>
      <span className="w-13 text-right font-mono text-[11px] text-muted-foreground">{value.toFixed(3)}</span>
    </div>
  )
}

function StatusRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-[11px] text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
