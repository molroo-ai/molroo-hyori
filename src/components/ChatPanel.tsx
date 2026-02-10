import { useState, useRef, useEffect } from 'react'
import type { SessionState } from '../hooks/useSession'
import type { TurnResultResponse } from '../lib/api/types'
import './ChatPanel.css'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

interface ChatPanelProps {
  characterName?: string
  session: SessionState
  isProcessing: boolean
  onSend: (message: string) => Promise<{
    turnResponse: TurnResultResponse
    displayText: string
  } | null>
  onTurnResponse: (res: TurnResultResponse) => void
}

export function ChatPanel({
  characterName = 'Hyori',
  session,
  isProcessing,
  onSend,
  onTurnResponse,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [floatingText, setFloatingText] = useState<string | null>(null)
  const userListRef = useRef<HTMLDivElement>(null)
  const floatingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (session.status === 'idle') setMessages([])
  }, [session.status])

  useEffect(() => {
    userListRef.current?.scrollTo({ top: userListRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || isProcessing) return
    const userMsg = input.trim()
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setInput('')

    if (session.status !== 'active') {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Create a session first in the Setup tab.',
      }])
      return
    }

    const result = await onSend(userMsg)
    if (result) {
      setMessages(prev => [...prev, { role: 'assistant', text: result.displayText }])
      showFloating(result.displayText)
      onTurnResponse(result.turnResponse)
    } else {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Something went wrong. Check the Setup tab for errors.',
      }])
    }
  }

  function showFloating(text: string) {
    if (floatingTimerRef.current) clearTimeout(floatingTimerRef.current)
    setFloatingText(text)
    floatingTimerRef.current = setTimeout(() => setFloatingText(null), 3500)
  }

  const placeholder = session.status === 'active'
    ? `Talk to ${characterName}...`
    : 'Create a session first...'

  return (
    <>
      {floatingText && (
        <div className="speech-bubble" key={floatingText}>
          {floatingText}
        </div>
      )}

      <div className="chat-messages-layer">
        <div className="chat-messages" ref={userListRef}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={msg.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--assistant'}
            >
              {msg.text}
            </div>
          ))}
          {isProcessing && (
            <div className="chat-bubble--assistant chat-bubble--loading">
              <span className="chat-dots">
                <span /><span /><span />
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="chat-input-layer">
        <div className="chat-input-bar">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
            placeholder={placeholder}
            className="chat-input"
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            className="chat-send"
            disabled={isProcessing || !input.trim()}
          >
            {isProcessing ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </>
  )
}
