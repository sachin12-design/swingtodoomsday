// ---------------------------------------------------------------
// THE SPIDEY TRACKER. A pixel-art sticker floating under the
// Doomsday clock — it IS the canon filter. Tap it and the partner
// portals in and takes you to the canon dimension; tap again to
// come home solo. The eyes blink on a pixel clock.
// ---------------------------------------------------------------

// 16×15 face, drawn as rects so every pixel stays crisp.
const ROWS = [
  '....KKKKKKKK....',
  '..KKRRRRRRRRKK..',
  '.KRRRRRRRRRRRRK.',
  'KRRRRRRRRRRRRRRK',
  'KRKWWWKRRKWWWKRK',
  'KWWWWWWKKWWWWWWK',
  'KWWWWWWKKWWWWWWK',
  'KWWWWWWKKWWWWWWK',
  'KKWWWWKRRKWWWWKK',
  '.KKWWKRRRRKWWKK.',
  '.KRKKRRRRRRKKRK.',
  '.KRRRRRRRRRRRRK.',
  '..KRRRRRRRRRRK..',
  '...KKRRRRRRKK...',
  '.....KKKKKK.....',
]
const INK = '#0E0E12'
const RED = '#E62429'
const EYE = '#F7F4EF'

const FACE = []
const LIDS = [] // red overlays on the whites — shown for a beat = blink
ROWS.forEach((row, y) => {
  ;[...row].forEach((ch, x) => {
    if (ch === '.') return
    const r = { x: x + 5, y: y + 5 }
    FACE.push({ ...r, c: ch === 'K' ? INK : ch === 'R' ? RED : EYE })
    if (ch === 'W') LIDS.push(r)
  })
})

// stepped-corner square: a fat cross plus little corner blocks
const Steps = ({ inset, corner, fill }) => (
  <g fill={fill}>
    <rect x={inset + corner} y={inset} width={26 - 2 * (inset + corner)} height={26 - 2 * inset} />
    <rect x={inset} y={inset + corner} width={26 - 2 * inset} height={26 - 2 * (inset + corner)} />
    {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([cx, cy]) => (
      <rect
        key={`${cx}${cy}`}
        x={cx ? 26 - inset - corner - 1 : inset + 1}
        y={cy ? 26 - inset - corner - 1 : inset + 1}
        width={corner}
        height={corner}
      />
    ))}
  </g>
)

export default function SpiderTracker({ on, busy, met, done, total, onToggle }) {
  const title = busy
    ? 'Mid-portal…'
    : on
      ? 'Canon dimension — tap to portal back to the full city'
      : met
        ? 'Spidey tracker — portal to the 15 canon events'
        : 'Spidey tracker — tap to call for backup'
  return (
    <button
      type="button"
      className={`tracker ${on ? 'tracker--on' : ''} ${busy ? 'tracker--busy' : ''} ${done === total ? 'tracker--done' : ''}`}
      onClick={onToggle}
      disabled={busy}
      aria-pressed={on}
      aria-label="Canon filter"
      title={title}
    >
      <svg viewBox="0 0 26 26" shapeRendering="crispEdges" aria-hidden="true">
        <Steps inset={0} corner={2} fill={on ? '#FFC43D' : RED} />
        <Steps inset={2} corner={1} fill={on ? '#13203B' : '#9FDCE4'} />
        {FACE.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width="1.04" height="1.04" fill={p.c} />
        ))}
        <g className="tracker__lids">
          {LIDS.map((p, i) => (
            <rect key={i} x={p.x} y={p.y} width="1.04" height="1.04" fill={RED} />
          ))}
        </g>
      </svg>
      <span className="tracker__chip">
        <span className="display">{done}/{total}</span> CANON
      </span>
    </button>
  )
}
