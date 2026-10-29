import { useEffect, useState } from 'react'

const KEYS = ['A', 'B', 'C', 'D']

// questions: array of { q, options, answer }
// onComplete(score, total) fires when the user closes the result card.
export default function QuizModal({ kicker, title, questions, onComplete, onAnswer }) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState(null)
  const [results, setResults] = useState([])
  const [done, setDone] = useState(false)

  const current = questions[index]
  const score = results.filter(Boolean).length

  // Advance a beat after the user sees the answer land.
  useEffect(() => {
    if (picked === null) return
    const id = setTimeout(() => {
      if (index + 1 >= questions.length) {
        setDone(true)
      } else {
        setIndex((i) => i + 1)
        setPicked(null)
      }
    }, 1100)
    return () => clearTimeout(id)
  }, [picked, index, questions.length])

  function choose(i) {
    if (picked !== null) return
    const right = i === current.answer
    setPicked(i)
    setResults((r) => [...r, right])
    onAnswer?.(right)
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100)
    const verdict =
      pct === 100 ? 'Flawless. You were paying attention.'
      : pct >= 60 ? 'Solid. Good enough to move on.'
      : 'Rough. Maybe rewatch that one.'

    return (
      <div className="scrim">
        <div className="quiz halftone" style={{ textAlign: 'center' }}>
          <div className="quiz__kicker">{kicker} complete</div>
          <div className="quiz__score chroma">
            {score}/{questions.length}
          </div>
          <p className="quiz__verdict">{verdict}</p>
          <button className="quiz__btn" onClick={() => onComplete(score, questions.length)}>
            Back to the timeline
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="scrim">
      <div className="quiz halftone">
        <div className="quiz__top">
          <span className="quiz__kicker">{kicker}</span>
          <span className="quiz__count">
            {index + 1} / {questions.length}
          </span>
        </div>
        <h2 className="quiz__title">{title}</h2>

        <p className="quiz__q">{current.q}</p>

        <div className="opts">
          {current.options.map((opt, i) => {
            let mod = ''
            if (picked !== null) {
              if (i === current.answer) mod = 'opt--right'
              else if (i === picked) mod = 'opt--wrong'
              else mod = 'opt--muted'
            }
            return (
              <button
                key={i}
                className={`opt ${mod}`}
                onClick={() => choose(i)}
                disabled={picked !== null}
              >
                <span className="opt__key">{KEYS[i]}</span>
                <span>{opt}</span>
              </button>
            )
          })}
        </div>

        <p className="quiz__feedback">
          {picked === null
            ? ' '
            : picked === current.answer
            ? 'THWIP! Correct.'
            : `Nope — it's ${KEYS[current.answer]}.`}
        </p>

        <div className="quiz__bar">
          {questions.map((_, i) => (
            <span
              key={i}
              className={`quiz__pip ${
                results[i] === true ? 'quiz__pip--right'
                : results[i] === false ? 'quiz__pip--wrong'
                : ''
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
