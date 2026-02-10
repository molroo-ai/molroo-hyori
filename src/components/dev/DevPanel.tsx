import type { SessionState, TurnEntry, LlmConfig } from '../../hooks/useSession'
import type { StateResponse, PersonaIdentity } from '../../lib/api/types'
import type { PresetEntry } from '../../lib/api/presets'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { SetupTab } from './SetupTab'
import { EmotionTab } from './EmotionTab'
import { ResponseTab } from './ResponseTab'
import { TimelineTab } from './TimelineTab'

interface DevPanelProps {
  session: SessionState
  molrooApiKey: string
  onMolrooApiKeyChange: (key: string) => void
  llmConfig: LlmConfig
  onLlmConfigChange: (config: LlmConfig) => void
  currentState: StateResponse | null
  turnHistory: TurnEntry[]
  isProcessing: boolean
  presets: Record<string, PresetEntry>
  onCreateSession: (preset: string, identity: PersonaIdentity) => void
  onReset: () => void
}

export function DevPanel({
  session, molrooApiKey, onMolrooApiKeyChange,
  llmConfig, onLlmConfigChange,
  currentState, turnHistory, isProcessing,
  presets, onCreateSession, onReset,
}: DevPanelProps) {
  const latestTurn = turnHistory[turnHistory.length - 1] ?? null

  return (
    <div className="flex h-full flex-col bg-background text-foreground text-[13px]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-white">API Playground</h2>
        {session.status === 'active' && (
          <Button variant="destructive" size="sm" onClick={onReset}>Reset</Button>
        )}
      </div>

      <Tabs defaultValue="setup" className="flex flex-1 flex-col overflow-hidden">
        <TabsList variant="line" className="w-full justify-start border-b border-border px-3">
          <TabsTrigger value="setup" className="text-xs">Setup</TabsTrigger>
          <TabsTrigger value="emotion" className="text-xs">Emotion</TabsTrigger>
          <TabsTrigger value="response" className="text-xs">Response</TabsTrigger>
          <TabsTrigger value="timeline" className="relative text-xs">
            Timeline
            {turnHistory.length > 0 && (
              <Badge className="ml-1 h-4 px-1 text-[10px]">{turnHistory.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="setup">
            <SetupTab
              session={session}
              presets={presets}
              isProcessing={isProcessing}
              molrooApiKey={molrooApiKey}
              onMolrooApiKeyChange={onMolrooApiKeyChange}
              llmConfig={llmConfig}
              onLlmConfigChange={onLlmConfigChange}
              onCreateSession={onCreateSession}
            />
          </TabsContent>
          <TabsContent value="emotion"><EmotionTab state={currentState} /></TabsContent>
          <TabsContent value="response"><ResponseTab turn={latestTurn} /></TabsContent>
          <TabsContent value="timeline"><TimelineTab history={turnHistory} /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
