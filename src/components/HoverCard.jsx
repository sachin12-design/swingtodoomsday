import { logoUrl, posterUrl, whereToWatchUrl } from '../lib/catalog.js'
import { isEssential, providersFor } from '../data/essentials.js'

const W = 300
const H = 182
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

// The card beside a hovered title: poster, facts, and the CTA to go
// watch it. Rendered outside the transformed track so `fixed` works.
export default function HoverCard({ hover, catalog, onEnter, onLeave }) {
  if (!hover) return null
  const { title: t, rect } = hover
  const data = catalog?.titles?.[t.id]

  const vw = window.innerWidth
  const vh = window.innerHeight
  const w = Math.min(W, vw - 24)
  let left = rect.right + 14
  let top = clamp(rect.top - 28, 74, vh - H - 16)
  if (left + w > vw - 12) left = rect.left - w - 14
  if (left < 12) {
    // no room beside the row (phones): under it, or over it, centred
    left = clamp((vw - w) / 2, 12, vw - w - 12)
    top = rect.bottom + 10 + H < vh - 12 ? rect.bottom + 10 : Math.max(62, rect.top - H - 10)
  }

  const fallback = whereToWatchUrl(t.title, t.year)
  // hand-checked India links beat anything generic
  const curated = providersFor(t.id)
  const providers = data?.providers?.slice(0, 2) || []

  return (
    <aside className="hcard" style={{ left, top, width: w }} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div className="hcard__poster">
        {data?.poster ? (
          <img src={posterUrl(data.poster)} alt="" />
        ) : (
          <div className="hcard__ph halftone">
            <span className="display">{t.title}</span>
            <span className="hcard__ph-year">{t.year}</span>
          </div>
        )}
      </div>
      <div className="hcard__body">
        <div className="hcard__title">
          {isEssential(t.id) && <span className="hcard__star" title="A canon event">★</span>}
          {t.title}
        </div>
        <div className="hcard__meta">
          {t.year} · {t.type === 'series' ? 'Series' : 'Film'}
          {data?.runtime ? ` · ${data.runtime} min` : ''}
          {data?.rating ? ` · ★ ${data.rating}` : ''}
        </div>
        {data?.overview && <p className="hcard__blurb">{data.overview}</p>}
        <div className="hcard__ctas">
          {curated
            ? curated.map((p) => (
                <a key={p.name} className="cta" href={p.url} target="_blank" rel="noopener noreferrer">
                  Watch on {p.name} ↗
                </a>
              ))
            : providers.length
              ? providers.map((p) => (
                  <a key={p.name} className="cta" href={data.link || fallback} target="_blank" rel="noopener noreferrer">
                    {p.logo && <img src={logoUrl(p.logo)} alt="" />}
                    <span>Watch on {p.name} ↗</span>
                  </a>
                ))
              : (
                <a className="cta" href={fallback} target="_blank" rel="noopener noreferrer">
                  Where to watch ↗
                </a>
              )}
        </div>
      </div>
    </aside>
  )
}
