import { useState, useEffect } from 'react'
import molrooRobot from '../assets/molroo-robot.svg'
import molrooText from '../assets/molroo-text.svg'
import './GuideOverlay.css'

const LS_KEY = 'molroo-guide-seen'

const STEPS = [
  {
    type: 'hero' as const,
    tagline: 'Emotion Middleware\nfor AI Characters',
    pitch: 'Psychology-grounded computation from 30+ papers.\nNot prompt hacking. Not memory tricks.',
  },
  {
    type: 'features' as const,
    title: 'What molroo Does',
    items: [
      'Emotions evolve naturally through conversation',
      'Characters can snap under pressure',
      'Trust deepens \u2014 or breaks \u2014 over time',
      'LLM-ready emotion data via REST API',
    ],
  },
  {
    type: 'stats' as const,
    title: 'Built for Production',
    stats: [
      { value: '30+', label: 'Research Papers' },
      { value: '<1ms', label: 'Edge Latency' },
      { value: '16', label: 'API Endpoints' },
    ],
  },
  {
    type: 'step' as const,
    title: 'Try It Now',
    body: 'Tap </> to set your LLM provider and API key.\nHit Create Session to start the emotion engine.\nChat and watch real-time emotion shifts.',
  },
]

interface GuideOverlayProps {
  onDone: () => void
}

export function GuideOverlay({ onDone }: GuideOverlayProps) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(LS_KEY)) {
      onDone()
      return
    }
    const t = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(t)
  }, [onDone])

  function dismiss() {
    localStorage.setItem(LS_KEY, '1')
    setVisible(false)
    setTimeout(onDone, 200)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1)
    else dismiss()
  }

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="guide-overlay" onClick={dismiss}>
      <div className="guide-card" onClick={e => e.stopPropagation()}>
        {current.type === 'hero' && (
          <>
            <img src={molrooRobot} alt="molroo" className="guide-logo-robot" />
            <img src={molrooText} alt="molroo" className="guide-logo-text" />
            <p className="guide-tagline">{current.tagline}</p>
            <p className="guide-pitch">{current.pitch}</p>
            <a href="https://molroo.io" target="_blank" rel="noopener noreferrer"
              className="guide-link" onClick={e => e.stopPropagation()}>
              molroo.io &rarr;
            </a>
          </>
        )}

        {current.type === 'features' && (
          <>
            <h2 className="guide-title">{current.title}</h2>
            <ul className="guide-features">
              {current.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </>
        )}

        {current.type === 'stats' && (
          <>
            <h2 className="guide-title">{current.title}</h2>
            <div className="guide-stats">
              {current.stats.map((s, i) => (
                <div key={i} className="guide-stat">
                  <span className="guide-stat-value">{s.value}</span>
                  <span className="guide-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {current.type === 'step' && (
          <>
            <div className="guide-step-num">&rarr;</div>
            <h2 className="guide-title">{current.title}</h2>
            <p className="guide-body">{current.body}</p>
          </>
        )}

        <div className="guide-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`guide-dot ${i === step ? 'guide-dot--active' : ''}`} />
          ))}
        </div>

        <div className="guide-actions">
          {!isLast && (
            <button className="guide-btn guide-btn--skip" onClick={dismiss}>Skip</button>
          )}
          <button className="guide-btn guide-btn--next" onClick={next}>
            {isLast ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Reset the guide so it shows again on next visit */
export function resetGuide() {
  localStorage.removeItem(LS_KEY)
}
