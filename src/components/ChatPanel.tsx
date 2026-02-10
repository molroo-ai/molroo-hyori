import { useState, useRef, useEffect } from 'react'
import './ChatPanel.css'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

interface ChatPanelProps {
  characterName?: string
}

export function ChatPanel({ characterName = 'Hyori' }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [floatingText, setFloatingText] = useState<string | null>(null)
  const userListRef = useRef<HTMLDivElement>(null)
  const floatingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    userListRef.current?.scrollTo({ top: userListRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!input.trim()) return
    const userMsg = input.trim()
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setInput('')

    // Phase 2: real AI backend — for now, echo stub
    setTimeout(() => {
      const reply = userMsg
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
      showFloating(reply)
    }, 600)
  }

  function showFloating(text: string) {
    if (floatingTimerRef.current) clearTimeout(floatingTimerRef.current)
    setFloatingText(text)
    floatingTimerRef.current = setTimeout(() => setFloatingText(null), 3500)
  }

  return (
    <>
      {/* Character speech bubble */}
      {floatingText && (
        <div className="speech-bubble" key={floatingText}>
          {floatingText}
        </div>
      )}

      {/* Messages — behind character */}
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
        </div>
      </div>

      {/* Input bar — above character */}
      <div className="chat-input-layer">
        <div className="chat-input-bar">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
            placeholder={`Talk to ${characterName}...`}
            className="chat-input"
          />
          <button onClick={handleSend} className="chat-send">
            Send
          </button>
        </div>
      </div>
    </>
  )
}
