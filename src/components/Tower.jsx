import { hasQuiz } from '../lib/quiz.js'
import { isEssential } from '../data/essentials.js'

// A year, standing on a rooftop of the skyline art.
//   deck   — a drawn rooftop the size of the roof the detector found;
//            everything below stands ON it, so nothing floats
//   sign   — year + count; click to travel here
//   glow   — the roof warms up as you light its titles
//   panel  — the movie list, a billboard on struts beside the sign,
//            zooms up when this is the current year (one open at a time)
export default function Tower({
  index, year, titles, pos, open, watched, scores, onToggle, onQuiz, onFocus, onHover, cityH, flip = false, screenX = 0,
}) {
  const lit = titles.filter((t) => watched.has(t.id)).length
  const complete = lit === titles.length
  // closed: the deck hugs the real roof; open: it extends so the heroes
  // and the billboard have somewhere to stand
  const roofW = pos.w || 0
  const deckClosed = Math.round(Math.max(150, Math.min(300, roofW)))
  const deckOpen = Math.round(Math.max(480, Math.min(600, roofW)))

  const classes = [
    'tower',
    index % 2 ? 'tower--tilt-r' : 'tower--tilt-l',
    open ? 'tower--open' : '',
    complete ? 'tower--complete' : '',
    flip ? 'tower--flip' : '', // the billboard opens on the left
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      data-year={year}
      style={{
        left: pos.x,
        top: pos.y,
        '--lit': lit / titles.length,
        '--max-h': `${pos.maxH}px`,
        '--deck-w': `${pos.deckW}px`,
        '--roof-sx': `${Math.round(screenX)}px`,
      }}
    >
      <div className="deck" aria-hidden="true">
        {/* the building under the roof, down into the city */}
        <div className="deck__building" style={{ '--drop': `${Math.max(0, (cityH || 0) - pos.y - 36)}px` }} />
        <div className="deck__body" />
        <div className="deck__top" />
        <div className="deck__pad" />
      </div>

      <div className="tower__glow" />

      <button
        type="button"
        className="tower__sign"
        onClick={open ? undefined : onFocus}
        title={open ? undefined : `Go to ${year}`}
      >
        <span className="tower__year display chroma">{year}</span>
        <span className="tower__count">
          {lit} / {titles.length} LIT
        </span>
      </button>

      <section className="tower__panel" aria-hidden={!open}>
        <header className="panel__head">
          <span className="panel__title display">{year}</span>
          <span className="panel__meta">
            {titles.length} {titles.length === 1 ? 'title' : 'titles'} · {lit} lit
          </span>
        </header>
        <ul className="panel__list" onMouseLeave={() => onHover(null)}>
          {titles.map((t) => {
            const on = watched.has(t.id)
            const score = scores[t.id]
            return (
              <li
                key={t.id}
                className={`row ${on ? 'row--lit' : ''} ${isEssential(t.id) ? 'row--key' : ''}`}
                role="checkbox"
                aria-checked={on}
                tabIndex={open ? 0 : -1}
                onClick={() => open && onToggle(t.id)}
                onMouseEnter={(e) => open && onHover(t, e.currentTarget)}
                onFocus={(e) => open && onHover(t, e.currentTarget)}
                onBlur={() => onHover(null)}
                onKeyDown={(e) => {
                  if (!open) return
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    onToggle(t.id)
                  }
                }}
              >
                <span className="row__tick">{on ? '✓' : ''}</span>
                {isEssential(t.id) && <span className="row__star" title="Mandatory before Doomsday">★</span>}
                <span className="row__title">
                  {t.title}
                  {t.span && <em className="row__span"> {t.span}</em>}
                </span>
                {t.type === 'series' && <span className="row__tag">TV</span>}
                {on && hasQuiz(t.id) && (
                  <button
                    type="button"
                    className="row__quiz"
                    title="Quiz me"
                    tabIndex={open ? 0 : -1}
                    onClick={(e) => {
                      e.stopPropagation()
                      onQuiz(t.id)
                    }}
                  >
                    {score ? `${score.score}/${score.total}` : '?'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
