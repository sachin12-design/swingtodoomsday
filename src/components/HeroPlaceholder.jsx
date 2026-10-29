import { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------
// FULL-BODY CHARACTER — hand-built SVG, rigged in CSS.
//
// Drawn from the turnaround sheet: near-black suit, red spider
// emblem, red piping down the outer arms and legs, large angular
// white lenses, red feet.
//
// Real joints — each limb rotates about its own pivot (see the
// transform-origin block in comic.css). Animations: idle, blink,
// talk, celebrate, point. All stepped at 12fps.
//
// Takes the SAME behaviour props as the Rive renderer, so swapping
// to a .riv file later changes nothing elsewhere.
// ---------------------------------------------------------------

export const HERO_ASPECT = 420 / 200

const OUTLINE = '#000000'

function useCursorLook(enabled) {
  const [look, setLook] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = null
    const onMove = (e) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = null
        setLook({
          x: (e.clientX / window.innerWidth) * 2 - 1,
          y: (e.clientY / window.innerHeight) * 2 - 1,
        })
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [enabled])

  return look
}

// A limb is stroked twice — fat black underneath for the ink
// outline, the suit colour on top. That's what stops arms from
// melting into the torso.
function Limb({ d, width, suit, pipe, accent, foot }) {
  const cap = { strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }
  return (
    <>
      <path d={d} stroke={OUTLINE} strokeWidth={width + 4.5} {...cap} />
      <path d={d} stroke={suit} strokeWidth={width} {...cap} />
      {foot && (
        <>
          <path d={foot} stroke={OUTLINE} strokeWidth={width + 4.5} {...cap} />
          <path d={foot} stroke={accent} strokeWidth={width} {...cap} />
        </>
      )}
      {pipe && <path d={pipe} stroke={accent} strokeWidth="2.3" {...cap} />}
    </>
  )
}

function Lens({ fill }) {
  return (
    <path
      d="M98 25 C88 22 81 26 78 32 C75 39 77 49 84 51 C91 53 97 47 98 37 Z"
      fill={fill}
      stroke={OUTLINE}
      strokeWidth="3"
      strokeLinejoin="round"
    />
  )
}

export default function HeroPlaceholder({
  colors,
  size = 120,
  className = '',
  talking = false,
  reaction = null,
  followCursor = true,
}) {
  const { suit, accent, lens } = colors
  const look = useCursorLook(followCursor)

  const [oneShot, setOneShot] = useState(null)
  const firedAt = useRef(reaction?.at ?? 0)

  useEffect(() => {
    if (!reaction || reaction.at === firedAt.current) return
    firedAt.current = reaction.at
    setOneShot(reaction.type)
    const id = setTimeout(() => setOneShot(null), 960)
    return () => clearTimeout(id)
  }, [reaction])

  const classes = ['hero', talking && 'hero--talking', oneShot && `hero--${oneShot}`, className]
    .filter(Boolean)
    .join(' ')

  const lookStyle = { transform: `translate(${look.x * 4}px, ${look.y * 2.5}px)` }

  return (
    <svg
      viewBox="0 0 200 420"
      width={size}
      height={size * HERO_ASPECT}
      className={classes}
      role="img"
      aria-label="Spider hero"
    >
      <g className="hero__body">
        {/* ---- LEGS ---- */}
        <g className="hero__leg hero__leg--l">
          <Limb d="M89 196 L84 298" width={23} suit={suit} accent={accent} />
          <Limb
            d="M84 298 L87 396"
            foot="M87 396 L87 402"
            pipe="M79 204 L74 298 L78 392"
            width={17} suit={suit} accent={accent}
          />
        </g>
        <g className="hero__leg hero__leg--r">
          <Limb d="M111 196 L116 298" width={23} suit={suit} accent={accent} />
          <Limb
            d="M116 298 L113 396"
            foot="M113 396 L113 402"
            pipe="M121 204 L126 298 L122 392"
            width={17} suit={suit} accent={accent}
          />
        </g>

        {/* ---- ARMS (splayed clear of the torso) ---- */}
        <g className="hero__arm hero__arm--l">
          <Limb d="M71 88 L57 140" width={15} suit={suit} accent={accent} />
          <Limb
            d="M57 140 L62 198"
            pipe="M64 94 L51 140 L56 194"
            width={11.5} suit={suit} accent={accent}
          />
        </g>
        <g className="hero__arm hero__arm--r">
          <Limb d="M129 88 L143 140" width={15} suit={suit} accent={accent} />
          <Limb
            d="M143 140 L138 198"
            pipe="M136 94 L149 140 L144 194"
            width={11.5} suit={suit} accent={accent}
          />
        </g>

        {/* ---- NECK ---- */}
        <path d="M92 56 L108 56 L108 82 L92 82 Z" fill={suit} stroke={OUTLINE} strokeWidth="2.5" />

        {/* ---- TORSO ---- */}
        <g className="hero__torso">
          <path
            d="M100 72 C112 72 126 79 131 90 C133 108 132 130 130 150
               C128 170 124 186 121 198 L79 198 C76 186 72 170 70 150
               C68 130 67 108 69 90 C74 79 88 72 100 72 Z"
            fill={suit}
            stroke={OUTLINE}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* side piping */}
          <path d="M74 95 C71 122 72 158 78 194" stroke={accent} strokeWidth="2.3" fill="none" strokeLinecap="round" />
          <path d="M126 95 C129 122 128 158 122 194" stroke={accent} strokeWidth="2.3" fill="none" strokeLinecap="round" />

          {/* ---- CHEST EMBLEM ---- */}
          <circle cx="100" cy="126" r="15" fill="none" stroke={accent} strokeWidth="2.4" />
          <ellipse cx="100" cy="130" rx="3.2" ry="5" fill={accent} />
          <ellipse cx="100" cy="122.5" rx="2.6" ry="3" fill={accent} />
          <g stroke={accent} strokeWidth="1.8" fill="none" strokeLinecap="round">
            <path d="M97.5 121 C93 117 89 116 86 118" />
            <path d="M97.5 125 C92 124 88 126 86 130" />
            <path d="M97.5 129 C92 130 89 134 88 138" />
            <g transform="translate(200,0) scale(-1,1)">
              <path d="M97.5 121 C93 117 89 116 86 118" />
              <path d="M97.5 125 C92 124 88 126 86 130" />
              <path d="M97.5 129 C92 130 89 134 88 138" />
            </g>
          </g>
        </g>

        {/* ---- HEAD ---- */}
        <g className="hero__head">
          <path
            d="M100 12 C115 12 121 26 121 42 C121 57 112 66 100 66
               C88 66 79 57 79 42 C79 26 85 12 100 12 Z"
            fill={suit}
            stroke={OUTLINE}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M100 14 L100 64" stroke={accent} strokeWidth="1" opacity="0.3" fill="none" />

          {/* outer group = cursor look, inner = blink */}
          <g style={lookStyle}>
            <g className="hero__lenses">
              <Lens fill={lens} />
              <g transform="translate(200,0) scale(-1,1)">
                <Lens fill={lens} />
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}
