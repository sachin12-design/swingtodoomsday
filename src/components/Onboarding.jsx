import { useState } from 'react'

const STEPS = [
  {
    icon: '🏙',
    title: 'Light up the city',
    body: 'Every rooftop is a year, every title a window. Tick what you’ve watched and the window glows. Any order — nothing is locked.',
  },
  {
    icon: '◼',
    title: 'The canon events',
    body: 'Short on time? Tap the pixel spidey tracker under the clock — a certain someone will portal in to help. The ▤ in the topbar lists all 15 canon events with streaming links.',
  },
  {
    icon: '🕸',
    title: 'Getting around',
    body: '← → hop between buildings — they run, jump and web-swing. Pick a far year on the minimap and they take a portal. Landing opens that year’s list.',
  },
]

// A three-beat tour the first time someone reaches the city.
export default function Onboarding({ onDone }) {
  const [i, setI] = useState(0)
  const last = i === STEPS.length - 1
  const s = STEPS[i]

  return (
    <div className="ob" role="dialog" aria-label="How it works">
      <div className="ob__card">
        <button className="ob__skip" onClick={onDone}>Skip</button>
        <div className="ob__icon" aria-hidden="true">{s.icon}</div>
        <h2 className="ob__title display">{s.title}</h2>
        <p className="ob__body">{s.body}</p>
        <div className="ob__foot">
          <div className="ob__dots" aria-hidden="true">
            {STEPS.map((_, k) => (
              <span key={k} className={`ob__dot ${k === i ? 'ob__dot--on' : ''}`} />
            ))}
          </div>
          <button className="ob__next" onClick={() => (last ? onDone() : setI(i + 1))}>
            {last ? "Let's go" : 'Next'} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
