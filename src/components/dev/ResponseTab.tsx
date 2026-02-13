import { useState } from 'react'
import { JsonView, darkStyles } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'
import type { TurnEntry } from '../../hooks/useSession'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { Button } from '../ui/button'

interface ResponseTabProps {
  turn: TurnEntry | null
}

export function ResponseTab({ turn }: ResponseTabProps) {
  const [copied, setCopied] = useState(false)

  if (!turn) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No turns yet. Send a message to see the API response.</p>
  }

  const { response: res } = turn

  function handleCopy() {
    navigator.clipboard.writeText(JSON.stringify(res, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const sections = [
    { key: 'appraisal', label: 'Appraisal', data: res.appraisal },
    { key: 'prediction', label: 'Prediction Error', data: res.prediction_error },
    { key: 'delta', label: 'Emotion Delta', data: res.emotion_delta },
    { key: 'emotion', label: 'New Emotion', data: res.new_emotion },
    { key: 'discrete', label: 'Discrete Emotion', data: res.discrete_emotion },
    { key: 'regulation', label: 'Regulation', data: res.regulation },
    { key: 'catastrophe', label: 'Catastrophe', data: res.catastrophe },
    { key: 'full', label: 'Full Response', data: res },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary">Turn #{turn.id}</span>
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy JSON'}
        </Button>
      </div>

      <div className="space-y-1 rounded-lg border border-border bg-card p-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">User</span>
        <p className="text-sm text-foreground">{turn.userMessage}</p>
      </div>

      <div className="space-y-1 rounded-lg border border-border bg-card p-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Response</span>
        <p className="text-sm text-foreground">{res.reply}</p>
      </div>

      <Accordion type="multiple" defaultValue={['appraisal', 'delta', 'emotion']}>
        {sections.map(s => (
          <AccordionItem key={s.key} value={s.key} className="border-border">
            <AccordionTrigger className="py-2 text-xs hover:no-underline">{s.label}</AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="max-h-[200px] overflow-auto rounded-md bg-[#0d0d0d] p-2 text-[11px]">
                <JsonView data={s.data as object} style={darkStyles} />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
