import { TITLES } from '../data/marvel.js'
import { ESSENTIALS, ESSENTIAL_IDS, FAST_TRACK_NOTE } from '../data/essentials.js'

// ---------------------------------------------------------------
// THE FAST TRACK. The mandatory watchlist as one working panel:
// tick straight from here, and every row carries its India link.
// Loki's two seasons are shown as one row, the way the list reads.
// ---------------------------------------------------------------
const byId = new Map(TITLES.map((t) => [t.id, t]))

// one display row per list entry; Loki pairs its two seasons
const ROWS = (() => {
  const out = []
  const seen = new Set()
  for (const id of ESSENTIAL_IDS) {
    if (seen.has(id)) continue
    const t = byId.get(id)
    if (id.startsWith('loki-')) {
      out.push({ ids: ['loki-s1', 'loki-s2'], title: 'Loki', year: '2021–2023', type: 'series', providers: ESSENTIALS[id] })
      seen.add('loki-s1')
      seen.add('loki-s2')
      continue
    }
    out.push({ ids: [id], title: t.title, year: t.year, type: t.type, providers: ESSENTIALS[id] })
    seen.add(id)
  }
  return out
})()

export default function FastTrack({ watched, onSetWatched, onGoToYear, onClose }) {
  const done = ROWS.filter((r) => r.ids.every((id) => watched.has(id))).length

  return (
    <div className="ft" role="dialog" aria-label="Canon events watchlist" onClick={onClose}>
      <div className="ft__panel panel" onClick={(e) => e.stopPropagation()}>
        <header className="ft__head">
          <div>
            <div className="ft__kicker">Canon events · mandatory before Doomsday</div>
            <h2 className="ft__title display">The canon events</h2>
          </div>
          <div className="ft__score">
            <span className="ft__score-n display">
              {done}/{ROWS.length}
            </span>
            <button className="ft__close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </header>

        <div className="ft__bar">
          <div className="ft__bar-fill" style={{ width: `${(done / ROWS.length) * 100}%` }} />
        </div>

        <ol className="ft__list">
          {ROWS.map((r, i) => {
            const on = r.ids.every((id) => watched.has(id))
            const year = byId.get(r.ids[0]).year
            return (
              <li key={r.ids[0]} className={`ft__row ${on ? 'ft__row--lit' : ''}`}>
                <button
                  className="ft__tick"
                  onClick={() => onSetWatched(r.ids, !on)}
                  aria-pressed={on}
                  title={on ? 'Untick' : 'Mark watched'}
                >
                  {on ? '✓' : i + 1}
                </button>
                <button className="ft__name" onClick={() => onGoToYear(year)} title={`Go to ${year}`}>
                  {r.title}
                  <em className="ft__year">
                    {' '}
                    {r.year}
                    {r.type === 'series' ? ' · Series' : ''}
                  </em>
                </button>
                <span className="ft__links">
                  {r.providers.map((p) => (
                    <a key={p.name} className="cta cta--sm" href={p.url} target="_blank" rel="noopener noreferrer">
                      {p.name} ↗
                    </a>
                  ))}
                </span>
              </li>
            )
          })}
        </ol>

        <p className="ft__note">{FAST_TRACK_NOTE}</p>
      </div>
    </div>
  )
}
