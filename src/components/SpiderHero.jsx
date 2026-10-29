import { lazy, Suspense, useEffect, useState } from 'react'
import HeroPlaceholder from './HeroPlaceholder.jsx'

// The Rive runtime is heavy and no shipped character uses it yet, so
// it stays out of the main bundle until a .riv file is detected.
const RiveHero = lazy(() => import('./RiveHero.jsx'))

// ---------------------------------------------------------------
// THE RIVE CONTRACT
//
// The app looks for  public/characters/<id>.riv  (miles.riv,
// gwen.riv). Build your file to match docs/RIVE-GUIDE.md:
//
//   state machine:  HeroSM
//   inputs:         talk       Boolean  — true while the bubble shows
//                   celebrate  Trigger  — movie marked / quiz correct
//                   point      Trigger  — nudge toward the timeline
//                   lookX/lookY Number 0–100 — OPTIONAL cursor follow
//
// No .riv file yet? The SVG placeholder renders and everything
// still works. Missing optional inputs are silently skipped.
// ---------------------------------------------------------------

// True only when a real .riv exists. Vite (and Netlify/Vercel) can
// answer missing files with index.html (SPA fallback), so a plain
// res.ok check lies — reject text/html responses too.
function useRivAvailable(src) {
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    let alive = true
    fetch(src, { method: 'HEAD' })
      .then((res) => {
        const type = res.headers.get('content-type') || ''
        if (alive) setAvailable(res.ok && !type.includes('text/html'))
      })
      .catch(() => alive && setAvailable(false))
    return () => {
      alive = false
    }
  }, [src])
  return available
}

export default function SpiderHero({
  character,
  size = 160,
  className = '',
  talking = false,
  reaction = null,
}) {
  const src = `/characters/${character.id}.riv`
  const available = useRivAvailable(src)
  const [failed, setFailed] = useState(false)

  if (available && !failed) {
    return (
      <Suspense fallback={null}>
        <RiveHero
          src={src}
          size={size}
          className={className}
          talking={talking}
          reaction={reaction}
          onFail={() => {
            console.warn(
              `[SpiderHero] ${src} loaded but broke the contract — ` +
                `check the state machine is named "HeroSM" (docs/RIVE-GUIDE.md). ` +
                `Falling back to placeholder art.`
            )
            setFailed(true)
          }}
        />
      </Suspense>
    )
  }

  // The placeholder carries its own rig (blink/talk/celebrate/look),
  // so it takes the same behaviour props as the Rive path.
  return (
    <HeroPlaceholder
      colors={character.colors}
      size={size}
      className={className}
      talking={talking}
      reaction={reaction}
    />
  )
}
