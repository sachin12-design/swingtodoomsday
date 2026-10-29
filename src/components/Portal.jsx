import { forwardRef } from 'react'

// ---------------------------------------------------------------
// THE DIMENSIONAL PORTAL — drawn to the reference art: an orange
// hexagonal tunnel receding into a dark void, wrapped in a pink
// crystalline shell, with energy sparks and drifting motes.
//
// Pure SVG. The flight loop owns position/scale/visibility via the
// container's transform; everything inside idles on its own CSS
// clocks (stepped, on twos). variant="out" is the exit portal,
// flattened so it reads as lying above the rooftop.
// ---------------------------------------------------------------

const hex = (r, rot = 0) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + rot
    return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`
  }).join(' ')

// the tunnel: ring radius / stroke width / colour / twist, split into
// two groups that counter-rotate
const RINGS = [
  { r: 114, w: 13, c: '#FF8A00', rot: 0.0 },
  { r: 92, w: 11, c: '#FFB300', rot: 0.16 },
  { r: 72, w: 10, c: '#FF8A00', rot: 0.32 },
  { r: 54, w: 8, c: '#FF9E1B', rot: 0.48 },
  { r: 38, w: 7, c: '#FFB300', rot: 0.64 },
  { r: 24, w: 6, c: '#FF8A00', rot: 0.8 },
]

const SPARKS = Array.from({ length: 10 }, (_, i) => {
  const a = (Math.PI / 5) * i + 0.35
  return {
    x1: Math.cos(a) * 64,
    y1: Math.sin(a) * 64,
    x2: Math.cos(a) * (116 + (i % 3) * 14),
    y2: Math.sin(a) * (116 + (i % 3) * 14),
    c: ['#FFFFFF', '#FFD600', '#FF8A00'][i % 3],
    w: 1.5 + (i % 2),
  }
})

const DOTS = [
  [78, -62, 3, '#00E5FF'], [-88, -40, 2.5, '#FF4FA3'], [104, 22, 2, '#FFFFFF'],
  [-70, 78, 3, '#00E5FF'], [40, 100, 2.5, '#FF4FA3'], [-108, -6, 2, '#FFD600'],
  [10, -104, 2.5, '#FFFFFF'], [96, 72, 2, '#FF4FA3'], [-44, -96, 2, '#00E5FF'],
]

const Portal = forwardRef(function Portal({ variant = 'in' }, ref) {
  return (
    <div className={`portal portal--${variant}`} ref={ref} aria-hidden="true">
      <svg viewBox="-140 -140 280 280" width="280" height="280">
        <defs>
          <radialGradient id={`pGlow-${variant}`}>
            <stop offset="30%" stopColor="rgba(255,138,0,.55)" />
            <stop offset="62%" stopColor="rgba(255,79,163,.22)" />
            <stop offset="100%" stopColor="rgba(255,79,163,0)" />
          </radialGradient>
          <radialGradient id={`pVoid-${variant}`}>
            <stop offset="0%" stopColor="#060112" />
            <stop offset="100%" stopColor="#1C0736" />
          </radialGradient>
        </defs>

        {/* halo */}
        <circle r="138" fill={`url(#pGlow-${variant})`} />

        {/* crystalline shell */}
        <g className="portal__shell">
          <polygon points={hex(129, 0.14)} fill="rgba(255,122,217,.10)" stroke="#FF7AD9" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points={hex(135, -0.38)} fill="none" stroke="#FFA3E6" strokeWidth="1.5" opacity=".8" strokeLinejoin="round" />
          <polygon points={hex(122, 0.66)} fill="rgba(170,120,255,.08)" stroke="#C78BFF" strokeWidth="1.5" opacity=".7" strokeLinejoin="round" />
          <polygon points={hex(138, 1.1)} fill="none" stroke="#7DE9FF" strokeWidth="1" opacity=".35" strokeLinejoin="round" />
        </g>

        {/* the dark mouth behind the rings */}
        <polygon points={hex(118)} fill={`url(#pVoid-${variant})`} />

        {/* energy dash ring */}
        <circle className="portal__dash" r="100" fill="none" stroke="#FFD600" strokeWidth="2" strokeDasharray="7 11" opacity=".75" />

        {/* the hexagonal tunnel, counter-rotating */}
        <g className="portal__ringsA">
          {RINGS.filter((_, i) => i % 2 === 0).map((g) => (
            <polygon key={g.r} points={hex(g.r, g.rot)} fill="none" stroke={g.c} strokeWidth={g.w} strokeLinejoin="round" />
          ))}
        </g>
        <g className="portal__ringsB">
          {RINGS.filter((_, i) => i % 2 === 1).map((g) => (
            <polygon key={g.r} points={hex(g.r, g.rot)} fill="none" stroke={g.c} strokeWidth={g.w} strokeLinejoin="round" />
          ))}
        </g>

        {/* the far end of the tunnel */}
        <polygon points={hex(15, 0.9)} fill="#0B0318" stroke="#FF8A00" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="-4" cy="-3" r="1.4" fill="#fff" />
        <circle cx="5" cy="4" r="1" fill="#9BE8FF" />
        <circle cx="1" cy="-6" r=".8" fill="#FFD1F2" />

        {/* sparks + drifting motes */}
        <g className="portal__sparks">
          {SPARKS.map((s, i) => (
            <line key={i} className="portal__spark" x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.c} strokeWidth={s.w} strokeLinecap="round" />
          ))}
        </g>
        {DOTS.map(([x, y, r, c], i) => (
          <circle key={i} className="portal__dot" cx={x} cy={y} r={r} fill={c} />
        ))}
      </svg>
    </div>
  )
})

export default Portal
