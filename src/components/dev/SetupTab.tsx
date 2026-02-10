import { useState, useEffect } from 'react'
import type { SessionState, LlmConfig } from '../../hooks/useSession'
import type { PersonaIdentity } from '../../lib/api/types'
import type { PresetEntry } from '../../lib/api/presets'
import { LLM_PROVIDERS, getProvider } from '../../lib/llm/providers'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface SetupTabProps {
  session: SessionState
  presets: Record<string, PresetEntry>
  isProcessing: boolean
  molrooApiKey: string
  onMolrooApiKeyChange: (key: string) => void
  llmConfig: LlmConfig
  onLlmConfigChange: (config: LlmConfig) => void
  onCreateSession: (preset: string, identity: PersonaIdentity) => void
}

const EMPTY_IDENTITY: PersonaIdentity = {
  name: '', role: '', core_values: [], speaking_style: '',
}

export function SetupTab({
  session, presets, isProcessing,
  molrooApiKey, onMolrooApiKeyChange,
  llmConfig, onLlmConfigChange, onCreateSession,
}: SetupTabProps) {
  const presetKeys = Object.keys(presets)
  const [selectedPreset, setSelectedPreset] = useState(presetKeys[0] ?? '')
  const [identity, setIdentity] = useState<PersonaIdentity>(EMPTY_IDENTITY)
  const [coreValuesText, setCoreValuesText] = useState('')

  useEffect(() => {
    const preset = presets[selectedPreset]
    if (preset) {
      setIdentity(preset.identity)
      setCoreValuesText(preset.identity.core_values.join(', '))
    }
  }, [selectedPreset])

  const isActive = session.status === 'active'
  const isCreating = session.status === 'creating'
  const prov = getProvider(llmConfig.provider)

  function handleCreate() {
    onCreateSession(selectedPreset, {
      ...identity,
      core_values: coreValuesText.split(',').map(s => s.trim()).filter(Boolean),
    })
  }

  return (
    <div className="space-y-5">
      <Section title="API Keys">
        <Field label="molroo API Key">
          <Input type="password" value={molrooApiKey} onChange={e => onMolrooApiKeyChange(e.target.value)}
            placeholder="Bearer token for api.molroo.io" disabled={isActive} />
          <p className="text-[10px] text-muted-foreground">Emotion engine API. Default key provided.</p>
        </Field>
      </Section>

      <Section title="LLM Provider">
        <Field label="Provider">
          <NativeSelect value={llmConfig.provider} onChange={v => {
            const p = getProvider(v)
            onLlmConfigChange({ ...llmConfig, provider: v, model: p?.defaultModel ?? '',
              baseUrl: v === 'openai-compatible' ? llmConfig.baseUrl : undefined })
          }}>
            {LLM_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </NativeSelect>
        </Field>
        {llmConfig.provider !== 'none' && (
          <Field label="API Key">
            <Input type="password" value={llmConfig.apiKey}
              onChange={e => onLlmConfigChange({ ...llmConfig, apiKey: e.target.value })}
              placeholder={prov?.apiKeyPlaceholder || 'API key'} />
          </Field>
        )}
        {prov && prov.models.length > 0 && (
          <Field label="Model">
            <NativeSelect value={llmConfig.model ?? prov.defaultModel}
              onChange={v => onLlmConfigChange({ ...llmConfig, model: v })}>
              {prov.models.map(m => <option key={m} value={m}>{m}</option>)}
            </NativeSelect>
          </Field>
        )}
        {llmConfig.provider === 'openai-compatible' && (
          <>
            <Field label="Base URL">
              <Input value={llmConfig.baseUrl ?? ''} onChange={e => onLlmConfigChange({ ...llmConfig, baseUrl: e.target.value })}
                placeholder="https://api.example.com/v1" />
            </Field>
            <Field label="Model">
              <Input value={llmConfig.model ?? ''} onChange={e => onLlmConfigChange({ ...llmConfig, model: e.target.value })}
                placeholder="model-name" />
            </Field>
          </>
        )}
        {llmConfig.provider === 'none' && (
          <p className="text-xs text-muted-foreground">Without an LLM, responses use keyword-based appraisal only. Emotion analysis still works.</p>
        )}
      </Section>

      <Section title="Persona">
        <Field label="Preset">
          <NativeSelect value={selectedPreset} onChange={setSelectedPreset} disabled={isActive}>
            {presetKeys.map(k => <option key={k} value={k}>{presets[k].name}</option>)}
          </NativeSelect>
        </Field>
        {presets[selectedPreset] && (
          <p className="text-xs text-muted-foreground -mt-1">{presets[selectedPreset].description}</p>
        )}
        <Field label="Name">
          <Input value={identity.name} onChange={e => setIdentity(p => ({ ...p, name: e.target.value }))} disabled={isActive} />
        </Field>
        <Field label="Role">
          <Input value={identity.role ?? ''} onChange={e => setIdentity(p => ({ ...p, role: e.target.value }))} disabled={isActive} />
        </Field>
        <Field label="Core Values">
          <Input value={coreValuesText} onChange={e => setCoreValuesText(e.target.value)} placeholder="comma-separated" disabled={isActive} />
        </Field>
        <Field label="Speaking Style">
          <textarea className="flex min-h-[40px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-y"
            value={identity.speaking_style} onChange={e => setIdentity(p => ({ ...p, speaking_style: e.target.value }))}
            rows={2} disabled={isActive} />
        </Field>
      </Section>

      {!isActive && (
        <Button className="w-full" onClick={handleCreate} disabled={isCreating || !identity.name.trim()}>
          {isCreating ? 'Creating...' : 'Create Session'}
        </Button>
      )}
      {isActive && session.sessionId && (
        <div className="rounded-lg border border-border bg-card p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Session ID</span>
          <code className="mt-1 block break-all text-xs text-primary">{session.sessionId}</code>
        </div>
      )}
      {session.error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {session.error}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function NativeSelect({ value, onChange, disabled, children }: {
  value: string; onChange: (v: string) => void; disabled?: boolean; children: React.ReactNode
}) {
  return (
    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer"
      value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
      {children}
    </select>
  )
}
