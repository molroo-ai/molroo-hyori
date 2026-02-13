import type { SessionState, LlmConfig } from '../../hooks/useSession'
import { LLM_PROVIDERS, getProvider } from '../../lib/llm/providers'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface SetupTabProps {
  session: SessionState
  isProcessing: boolean
  molrooApiKey: string
  onMolrooApiKeyChange: (key: string) => void
  llmConfig: LlmConfig
  onLlmConfigChange: (config: LlmConfig) => void
  characterName: string
  characterMd: string
  onCreateSession: () => void
}

export function SetupTab({
  session, isProcessing,
  molrooApiKey, onMolrooApiKeyChange,
  llmConfig, onLlmConfigChange,
  characterName, characterMd,
  onCreateSession,
}: SetupTabProps) {
  const isActive = session.status === 'active'
  const isCreating = session.status === 'creating'
  const prov = getProvider(llmConfig.provider)

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

      <Section title="Character">
        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-white">{characterName}</span>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Character Description</summary>
            <pre className="mt-1 text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto text-[11px]">
              {characterMd.slice(0, 1000)}{characterMd.length > 1000 ? '...' : ''}
            </pre>
          </details>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Session creation: hardcoded persona sent directly to API (no LLM needed).
        </p>
      </Section>

      {!isActive && (
        <Button className="w-full" onClick={onCreateSession} disabled={isCreating}>
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
