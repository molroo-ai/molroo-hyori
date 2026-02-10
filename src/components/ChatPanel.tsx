import { useState } from 'react'

export function ChatPanel() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])

  function handleSend() {
    if (!input.trim()) return
    setMessages(prev => [...prev, { role: 'user', text: input.trim() }])
    setInput('')
    // Phase 2: integrate with AI backend
  }

  return (
    <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <h3 style={headingStyle}>Chat (Phase 2)</h3>
      <div style={messageListStyle}>
        {messages.length === 0 && (
          <div style={{ color: '#555', fontSize: '12px', padding: '8px 12px' }}>
            Chat will be connected in Phase 2.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ padding: '4px 12px', fontSize: '12px', color: msg.role === 'user' ? '#aaa' : '#6c6' }}>
            <strong>{msg.role === 'user' ? 'You' : 'Hyori'}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '4px', padding: '8px 12px' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          style={inputStyle}
        />
        <button onClick={handleSend} style={sendButtonStyle}>
          Send
        </button>
      </div>
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

const messageListStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  minHeight: 0,
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 8px',
  fontSize: '12px',
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '4px',
  color: '#ccc',
  outline: 'none',
}

const sendButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '12px',
  background: '#2d5a3d',
  border: '1px solid #4a9',
  borderRadius: '4px',
  color: '#fff',
  cursor: 'pointer',
}
