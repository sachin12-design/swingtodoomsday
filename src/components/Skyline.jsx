import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { TITLES } from '../data/marvel.js'
import { WORLDS } from '../lib/worlds.js'
import { guideFor } from '../config.js'
import { watchFrontier } from '../lib/quiz.js'
import {
  SKYLINE_CANDIDATES, STRIPS, BASE_RATIO, analyzeSkyline, analyzeSkylineCached, layoutTowers, proceduralSkyline,
} from '../lib/skyline.js'
import { useCatalog } from '../lib/catalog.js'
import Tower from './Tower.jsx'
import Heroes from './Heroes.jsx'
import Portal from './Portal.jsx'
import HoverCard from './HoverCard.jsx'

// ---------------------------------------------------------------
// THE CITY, PAGINATED. One building per page. The heroes stand on
// the current roof; moving to another year is a jump along the
// web-road while the camera pans with them, and the movie list
// opens once they've landed. Keys, edge buttons, a wheel flick or a
// swipe hop one building; the minimap or a roof sign jumps far.
// ---------------------------------------------------------------

const RUN_SPEED = 560   // px/s along a roof
const JUMP_GAP = 290    // voids (edge to edge) narrower than this are jumped, wider are swung
const DROP_JUMP = 120   // a next roof this much lower is jumped (a dive), never webbed from below
const PORTAL_DIST = 2600 // travel further than this and they take a portal instead
const POP = 240   // ms: the entry portal snapping open
const ENTER = 300 // ms: diving into it
const WARP = 560  // ms: inside — the camera crosses the city
const DROP = 460  // ms: falling out of the exit portal
const SLAND = 300 // ms: the superhero landing
const CROUCH = 100      // ms before a jump
const SHOOT = 110       // ms firing the line
const LAND = 150        // ms of landing squash
const FOLLOW = 200      // the partner runs this much later
const HOP_MAX = 520     // px of travel per hop before we chain hops through roofs
const MAX_HOPS = 8
const MAX_TOTAL = 5200  // ms — long chains speed up to fit
const CAM = 0.42        // where the current roof sits across the viewport
const TITLE_CAM = 30    // on the first roof, keep the intro on screen

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

function bez(a, c, b, t) {
  const u = 1 - t
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  }
}
// the decorative dashed road, roof to roof
function roadPath(pts) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    d += ` Q ${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 50 - Math.abs(a.y - b.y) * 0.2} ${b.x} ${b.y}`
  }
  return d
}
// where the camera rests for roof i. The first roof also frames the
// intro — scrolling only as far as it takes to keep the heroes (who
// stand just left of the roof point) on screen; phones, with no room
// for both, frame it like any other roof.
function restScroll(i, to, W, scrollW) {
  const raw = to.x - W * CAM
  const want = i === 0 && W >= 700 ? Math.max(to.x - (W + 4), Math.min(raw, TITLE_CAM)) : raw
  return clamp(want, 0, Math.max(0, scrollW - W))
}
// a billboard that would run off the right edge opens to the left
const PANEL_REACH = 40 + 282 + 14
const panelFlips = (sx, W) => W >= 700 && sx + PANEL_REACH > W
function camFor(city, i, to) {
  return restScroll(i, to, city.clientWidth, city.scrollWidth)
}

function cubic(a, c1, c2, b, t) {
  const u = 1 - t
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  }
}
const smooth = (t) => t * t * (3 - 2 * t)

// THE PLAN. Run to the roof edge; jump if the void to the next building
// is small, otherwise shoot a web at the near corner of the next roof
// and swing across (down into the gap, up onto the roof), landing near
// the middle; then run to the standing spot. Long trips chain through
// the roofs in between. `floor` keeps the swoop on screen.
function planTraversal(towers, fromIdx, toIdx, start, floor, heroH) {
  const sign = toIdx >= fromIdx ? 1 : -1
  const dir = sign > 0 ? 'right' : 'left'
  const steps = Math.abs(toIdx - fromIdx)
  const dist = Math.abs(towers[toIdx].x - start.x)
  const hops = Math.max(1, Math.min(MAX_HOPS, steps, Math.ceil(dist / HOP_MAX)))
  const idxs = [fromIdx]
  for (let h = 1; h <= hops; h++) idxs.push(h === hops ? toIdx : Math.round(fromIdx + ((toIdx - fromIdx) * h) / hops))

  const segs = []
  let cur = start
  let acc = 0
  const push = (seg) => {
    seg.t0 = acc
    acc += seg.dur
    seg.t1 = acc
    segs.push(seg)
  }
  const runTo = (to) => {
    const dx = Math.abs(to.x - cur.x)
    if (dx > 4) push({ kind: 'run', from: cur, to, dur: Math.max(120, (dx / RUN_SPEED) * 1000), dir: to.x >= cur.x ? 'right' : 'left' })
    cur = to
  }
  // VERY FAR: take a portal. Run to the edge, it snaps open, dive in;
  // a second one opens flat over the target roof and drops them into
  // a superhero landing.
  if (dist > PORTAL_DIST) {
    const a = towers[fromIdx]
    const b = towers[toIdx]
    const edge = { x: a.x + sign * (a.deckW / 2 - 14), y: a.y }
    runTo(edge)
    const pin = { x: edge.x + sign * 88, y: edge.y - heroH * 0.62 }
    const pout = { x: b.x, y: b.y - 198 }
    const landing = { x: b.x - sign * 10, y: b.y }
    push({ kind: 'popin', at: edge, dur: POP, dir })
    // all the way through the surface (it hides them as they pass)
    push({ kind: 'enter', from: edge, to: { x: pin.x + sign * heroH * 0.75, y: edge.y - heroH * 0.12 }, hop: heroH * 0.22, pin, dur: ENTER, dir })
    push({ kind: 'warp', at: pin, dur: WARP, dir })
    push({ kind: 'drop', from: { x: pout.x, y: pout.y + 4 }, to: landing, pout, dur: DROP, dir })
    push({ kind: 'land', at: landing, dur: SLAND, dir, superLand: true })
    cur = landing
    runTo({ x: towers[toIdx].x, y: towers[toIdx].y })
    return { segs, total: acc, end: cur, dir, portal: { pin, pout } }
  }

  for (let h = 0; h < hops; h++) {
    const a = towers[idxs[h]]
    const b = towers[idxs[h + 1]]
    const edge = { x: a.x + sign * (a.deckW / 2 - 14), y: a.y }
    const nearEdge = b.x - sign * (b.deckW / 2)
    const gap = Math.abs(nearEdge - edge.x) // the actual void between the buildings
    const climb = edge.y - b.y // positive when the next roof is higher
    runTo(edge)
    const dive = climb < -DROP_JUMP // the next roof is well below us: leap off, don't web downward
    if ((gap < JUMP_GAP && climb < 90) || dive) {
      const landing = { x: nearEdge + sign * 60, y: b.y }
      push({ kind: 'crouch', at: edge, dur: CROUCH, dir })
      const apex = dive ? edge.y - 70 : Math.min(edge.y, landing.y) - (90 + Math.max(0, climb) * 0.4 + gap * 0.2)
      push({ kind: 'jump', from: edge, to: landing, apex, dur: clamp(gap * 1.5 + 320 + (dive ? 200 : 0), 400, 1000), dir })
      push({ kind: 'land', at: landing, dur: LAND, dir })
      cur = landing
    } else {
      // THE SWING. Web on the near corner of the next roof; swoop down
      // into the gap (never across the building's face), ride the line
      // up beside the wall, let go at about anchor height and hop over
      // the parapet onto the roof — "go down, jump up".
      const A = { x: nearEdge + sign * 18, y: b.y - 30 }
      const m = heroH * 0.42 // keep the body this far off the wall
      // let go while the hand is still below the anchor, so the line pulls up to the last frame
      const rel = { x: edge.x + sign * Math.max(gap * 0.5, gap - m - 6), y: A.y + heroH * 1.15 }
      const depth = clamp(gap * 0.45, 110, 260)
      const low = Math.min(Math.max(edge.y, rel.y) + depth, floor)
      const c1 = { x: edge.x + sign * gap * 0.42, y: low + depth * 0.25 }
      const c2 = { x: rel.x, y: low + depth * 0.2 } // rising straight up into the release
      const landing = { x: b.x - sign * 10, y: b.y }
      const cq = { x: nearEdge + sign * m * 0.2, y: Math.min(rel.y, b.y) - heroH * 1.3 }
      push({ kind: 'shoot', at: edge, A, dur: SHOOT, dir })
      push({ kind: 'swing', from: edge, c1, c2, rel, cq, to: landing, A, dur: clamp(640 + gap * 0.75, 780, 1450), dir })
      push({ kind: 'land', at: landing, dur: LAND, dir })
      cur = landing
    }
  }
  runTo({ x: towers[toIdx].x, y: towers[toIdx].y })
  if (acc > MAX_TOTAL) {
    const k = MAX_TOTAL / acc
    let t = 0
    for (const sg of segs) {
      sg.dur *= k
      sg.t0 = t
      t += sg.dur
      sg.t1 = t
    }
    acc = t
  }
  return { segs, total: acc, end: cur, dir }
}

// Body tilt (deg, clockwise) that points the reaching arm at the
// anchor. `th` is the pendulum angle (rad) of the body around the
// anchor, 0 = hanging straight below it; `arm` is how far the reaching
// arm sits from the body's own vertical in the hang pose.
function hangLean(th, dir, arm) {
  const sgn = dir === 'right' ? 1 : -1
  const want = (-th * 180) / Math.PI - sgn * arm
  // diving forward up to 72° (a far anchor pulls them almost flat),
  // laid back up to 64° — mirrored for leftward swings
  return sgn * clamp(sgn * want * 0.9, -64, 72)
}

// One hero's state at plan time `e` (their own clock), with a small
// anchor offset so two lines don't land on the same pixel. `arm` comes
// from that hero's sprite sheet (see hangLean).
function poseAt(plan, e, aOff, arm = 35) {
  const base = { phase: '', move: '', vy: '', lean: 0, s: 1, k: 1, alpha: 1, line: null, dir: plan.dir }
  const first = plan.segs[0]
  if (e < 0) return { ...base, pos: first.from || first.at, dir: first.dir }
  const sg = plan.segs.find((x) => e >= x.t0 && e < x.t1)
  if (!sg) return { ...base, pos: plan.end }
  const lt = clamp((e - sg.t0) / sg.dur, 0, 1)
  const off = (A) => ({ x: A.x + aOff.x, y: A.y + aOff.y })
  switch (sg.kind) {
    case 'run':
      return { ...base, pos: lerp(sg.from, sg.to, lt), move: 'run', dir: sg.dir }
    case 'crouch':
      return { ...base, pos: sg.at, phase: 'crouch', s: 0.9, dir: sg.dir }
    case 'jump': {
      const c = { x: (sg.from.x + sg.to.x) / 2, y: 2 * sg.apex - (sg.from.y + sg.to.y) / 2 }
      const p = bez(sg.from, c, sg.to, lt)
      const p2 = bez(sg.from, c, sg.to, Math.min(1, lt + 0.03))
      // nose up on the way up, down on the way down — relative to facing
      const pitch = (Math.atan2(p2.y - p.y, Math.abs(p2.x - p.x)) * 180) / Math.PI
      const lean = clamp((sg.dir === 'right' ? 1 : -1) * pitch * 0.2, -12, 12)
      return { ...base, pos: p, phase: 'air', vy: p2.y < p.y ? 'up' : 'down', lean, dir: sg.dir }
    }
    case 'shoot': {
      const A = off(sg.A)
      // lean into the throw, arm toward where the line will stick
      const lean = hangLean(Math.atan2(sg.at.x - A.x, sg.at.y - A.y), sg.dir, arm) * smooth(lt)
      return { ...base, pos: sg.at, move: 'shoot', lean, dir: sg.dir, line: { A, grow: lt, bow: 0.06 * Math.sin(lt * Math.PI * 3) * (1 - lt) } }
    }
    case 'swing': {
      const A = off(sg.A)
      const ON = 0.72 // share of the swing spent on the line
      const thAt = (q) => Math.atan2(q.x - A.x, q.y - A.y)
      if (lt < ON) {
        // slow off the edge, fastest through the dip, still moving at the release
        const u = lt / ON
        const p = cubic(sg.from, sg.c1, sg.c2, sg.rel, u - 0.13 * Math.sin(2 * Math.PI * u))
        return { ...base, pos: p, move: 'swing', lean: hangLean(thAt(p), sg.dir, arm), dir: sg.dir, line: { A, grow: 1, bow: 0.1 * Math.sin(u * Math.PI) } }
      }
      // let go: a parabola up over the parapet and down onto the roof,
      // tilting from the hang into the hop while the line snaps back
      const v = (lt - ON) / (1 - ON)
      const p = bez(sg.rel, sg.cq, sg.to, v)
      const p2 = bez(sg.rel, sg.cq, sg.to, Math.min(1, v + 0.03))
      const pitch = (Math.atan2(p2.y - p.y, Math.abs(p2.x - p.x)) * 180) / Math.PI
      const hop = clamp((sg.dir === 'right' ? 1 : -1) * pitch * 0.2, -12, 12)
      const w = smooth(clamp(v / 0.35, 0, 1))
      const lean = hangLean(thAt(sg.rel), sg.dir, arm) * (1 - w) + hop * w
      const r = clamp(v / 0.3, 0, 1)
      return {
        ...base, pos: p, phase: 'air', vy: p2.y < p.y ? 'up' : 'down', lean, dir: sg.dir,
        line: r < 1 ? { A, grow: 1 - r, bow: 0.22 * r, retract: true } : null,
      }
    }
    case 'popin':
      return { ...base, pos: sg.at, phase: lt > 0.55 ? 'crouch' : '', s: lt > 0.55 ? 0.92 : 1, dir: sg.dir }
    case 'enter': {
      // a dive: accelerate off the edge, small hop, through the surface
      const p = lerp(sg.from, sg.to, lt * lt)
      return { ...base, pos: { x: p.x, y: p.y - sg.hop * Math.sin(lt * Math.PI) }, phase: 'air', vy: lt < 0.5 ? 'up' : 'down', dir: sg.dir, clip: { v: sg.pin, dir: sg.dir } }
    }
    case 'warp':
      return { ...base, pos: sg.at, alpha: 0, k: 0.18, dir: sg.dir }
    case 'drop': {
      const t = lt * lt * (0.4 + 0.6 * lt) // gravity: slow out of the portal, fast at the roof
      const p = lerp(sg.from, sg.to, t)
      return { ...base, pos: p, phase: 'air', vy: 'down', dir: sg.dir, clip: { h: sg.pout } }
    }
    case 'land':
      if (sg.superLand) return { ...base, pos: sg.at, phase: 'land', s: 0.76 + 0.24 * smooth(lt), superland: true, dir: sg.dir }
      return { ...base, pos: sg.at, phase: 'land', s: 0.86 + 0.14 * lt, dir: sg.dir }
    default:
      return { ...base, pos: plan.end }
  }
}

// Portal surfaces. A body only shows on the near side of the surface
// it is passing through, so it really goes in / comes out instead of
// shrinking or fading. `clip` is { v: centre, dir } for a standing
// (in) portal — tilted 8°, top leaning back, and `dir` is the way
// through it — or { h: centre } for a flat (out) portal, where only
// what has dropped below the surface shows. `box` is the hero-wrap's
// untransformed border box in track coordinates; (tx, ty) the
// translate currently on it.
const TILT = Math.tan((8 * Math.PI) / 180)
function portalClip(w, clip, box, tx = 0, ty = 0) {
  if (!clip) {
    if (w.style.clipPath) w.style.clipPath = ''
    return
  }
  const L = box.left + tx
  const T = box.top + ty
  const B = 4000
  if (clip.h) {
    const v = clip.h.y - T
    w.style.clipPath = `polygon(${-B}px ${v}px, ${B}px ${v}px, ${B}px ${B}px, ${-B}px ${B}px)`
    return
  }
  const tilt = clip.dir === 'left' ? -TILT : TILT
  const uTop = clip.v.x + (T - B - clip.v.y) * tilt - L
  const uBot = clip.v.x + (T + B - clip.v.y) * tilt - L
  w.style.clipPath =
    clip.dir === 'left'
      ? `polygon(${uTop}px ${-B}px, ${B}px ${-B}px, ${B}px ${B}px, ${uBot}px ${B}px)`
      : `polygon(${-B}px ${-B}px, ${uTop}px ${-B}px, ${uBot}px ${B}px, ${-B}px ${B}px)`
}

// The web as a bowed curve — taut but alive, never a ruler line.
function webPath(H, A, grow, bow, dir) {
  const E = { x: H.x + (A.x - H.x) * grow, y: H.y + (A.y - H.y) * grow }
  const dx = E.x - H.x
  const dy = E.y - H.y
  const len = Math.hypot(dx, dy) || 1
  const k = (dir === 'right' ? 1 : -1) * bow * len
  const C = { x: (H.x + E.x) / 2 + (-dy / len) * k, y: (H.y + E.y) / 2 + (dx / len) * k }
  return `M ${H.x} ${H.y} Q ${C.x} ${C.y} ${E.x} ${E.y}`
}

export default function Skyline({
  watched, scores, onToggle, onQuiz, character, line, reaction, jumpToYear,
  world = 'all', solo = false, entrance = null, entryYear = null, onEntered, onLand, worldFxRef,
}) {
  const YEARS = WORLDS[world].years
  const cityRef = useRef(null)
  const trackRef = useRef(null)
  const websRef = useRef({})
  const portalsRef = useRef({})
  const dustRef = useRef({ els: [null, null], i: 0 })
  const onLandRef = useRef(null)
  onLandRef.current = onLand
  const heroesRef = useRef(null)
  const leaderRef = useRef(null)
  const followerRef = useRef(null)

  const [analysis, setAnalysis] = useState(null)
  const [cityH, setCityH] = useState(0)
  const [cityW, setCityW] = useState(0)
  const [current, setCurrent] = useState(0)
  const [landed, setLanded] = useState(false)
  const [moved, setMoved] = useState(false)
  const [hover, setHover] = useState(null)
  const hoverTimer = useRef(null)
  const showHover = useCallback((t, el) => {
    clearTimeout(hoverTimer.current)
    if (!t) {
      hoverTimer.current = setTimeout(() => setHover(null), 160)
      return
    }
    setHover({ title: t, rect: el.getBoundingClientRect() })
  }, [])
  const keepHover = useCallback(() => clearTimeout(hoverTimer.current), [])
  // belt and braces: if the pointer is anywhere but the list or the card,
  // the card goes — independent of enter/leave event synthesis
  const hoverRef = useRef(null)
  hoverRef.current = hover
  useEffect(() => {
    const onMove = (e) => {
      if (!hoverRef.current) return
      if (e.target.closest?.('.panel__list, .hcard')) return
      showHover(null)
    }
    document.addEventListener('mousemove', onMove, { passive: true })
    return () => document.removeEventListener('mousemove', onMove)
  }, [showHover])

  // refs mirror state for the animation loop + event handlers
  const currentRef = useRef(0)
  const landedRef = useRef(false)
  const posRef = useRef(null)
  const flightRef = useRef(null)
  const placedRef = useRef(false)
  const soloRef = useRef(solo)
  soloRef.current = solo
  const prevLayoutRef = useRef(null)

  // 1. Read the rooftops off the art (yours, else the procedural strip).
  useEffect(() => {
    let alive = true
    ;(async () => {
      let result = null
      // 1. the baked strip + metadata for this dimension (no pixel scan)
      const strip = STRIPS[world] || STRIPS.core
      try {
        result = await analyzeSkylineCached(strip.src, strip.meta)
      } catch {
        /* baked strip missing — fall back */
      }
      // 2. legacy formats, then the procedural stand-in
      if (!result) {
        for (const src of SKYLINE_CANDIDATES) {
          try {
            result = await analyzeSkylineCached(src)
            break
          } catch {
            /* try the next */
          }
        }
      }
      if (!result) result = await analyzeSkyline(proceduralSkyline())
      if (alive) setAnalysis(result)
    })().catch(() => {})
    return () => {
      alive = false
    }
  }, [world])

  // 2. The art scales with the city's height.
  useLayoutEffect(() => {
    const el = cityRef.current
    if (!el) return
    const update = () => {
      setCityH(el.clientHeight)
      setCityW(el.clientWidth)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 3. Years → rooftops.
  const layout = useMemo(
    () => (analysis && cityH ? layoutTowers(analysis, cityH, YEARS) : null),
    [analysis, cityH]
  )

  useEffect(() => {
    if (!layout) return
    document.documentElement.style.setProperty('--ledge-top', `${Math.round(layout.tileH * BASE_RATIO)}px`)
    if (import.meta.env.DEV) window.__spidy = { analysis, layout }
  }, [analysis, layout])

  const heroH = Math.round(clamp(cityH * 0.16, 110, 190))
  // which roofs open their billboard leftward: any that would run off the
  // right edge, and the last one (the finish-line billboard is to its right)
  const flipsAt = (i) =>
    !!layout && cityW >= 700 &&
    (i === YEARS.length - 1 || panelFlips(layout.towers[i].x - restScroll(i, layout.towers[i], cityW, layout.trackW), cityW))
  // the phone billboard floats above the heroes' heads, so it needs their height
  useEffect(() => {
    document.documentElement.style.setProperty('--hero-h', `${heroH}px`)
  }, [heroH])
  const guide = guideFor(character.id) // the Spider you didn't pick shows you around
  const catalog = useCatalog()

  // Put the pair on a roof and the camera on it — no animation.
  const place = useCallback(
    (i, { pop = true } = {}) => {
      const city = cityRef.current
      const to = layout.towers[i]
      if (!city || !to) return
      posRef.current = to
      if (heroesRef.current) {
        heroesRef.current.style.transform = `translate(${to.x}px, ${to.y}px)`
        heroesRef.current.dataset.phase = ''
      }
      for (const r of [leaderRef, followerRef]) {
        if (r.current) {
          r.current.style.transform = ''
          r.current.dataset.phase = ''
          r.current.dataset.move = ''
        }
      }
      for (const k of ['leadLine', 'leadDot', 'follLine', 'follDot']) {
        if (websRef.current[k]) websRef.current[k].style.opacity = 0
      }
      for (const k of ['pin', 'pout']) {
        if (portalsRef.current[k]) portalsRef.current[k].style.opacity = 0
      }
      city.scrollLeft = camFor(city, i, to)
      document.documentElement.style.setProperty('--sx', city.scrollLeft)
      currentRef.current = i
      setCurrent(i)
      if (pop) {
        landedRef.current = false
        setLanded(false)
        setTimeout(() => {
          landedRef.current = true
          setLanded(true)
        }, 350)
      } else {
        landedRef.current = true
        setLanded(true)
      }
    },
    [layout]
  )

  const nearestIdx = useCallback(
    (year) => {
      let best = 0
      let bd = Infinity
      YEARS.forEach((y, i) => {
        const d = Math.abs(y.year - year)
        if (d < bd) {
          bd = d
          best = i
        }
      })
      return best
    },
    [YEARS]
  )

  // First placement: an arrival year (portal entrance) beats the
  // furthest-watched default.
  useLayoutEffect(() => {
    if (!layout || placedRef.current) return
    placedRef.current = true
    let idx
    if (entryYear != null) {
      idx = nearestIdx(entryYear)
    } else {
      const f = watchFrontier(watched)
      idx = f < 0 ? 0 : nearestIdx(TITLES[f].year)
    }
    place(idx, { pop: entrance !== 'portal' })
    if (entrance === 'portal') {
      landedRef.current = false
      setLanded(false)
      const h = heroesRef.current
      if (h) h.style.opacity = 0
    }
  }, [layout, place, watched, entryYear, entrance, nearestIdx])

  // A resize re-lays the roofs out — keep the pair on theirs.
  useEffect(() => {
    if (!layout) return
    if (prevLayoutRef.current && prevLayoutRef.current !== layout && landedRef.current) {
      place(currentRef.current, { pop: false })
    }
    prevLayoutRef.current = layout
  }, [layout, place])

  // THE TRAVERSAL. Run to the edge, jump or swing (web on the next
  // building's corner), land, run on. The camera follows the leader; the
  // partner runs the same plan a beat later on a line of their own.
  const goTo = useCallback(
    (targetRaw) => {
      if (!layout) return
      const target = clamp(targetRaw, 0, YEARS.length - 1)
      if (!landedRef.current) return
      if (target === currentRef.current) return
      const city = cityRef.current
      const heroes = heroesRef.current
      const lead = leaderRef.current
      const foll = followerRef.current
      const webs = websRef.current
      if (!city || !heroes || !lead || !foll) return

      const fromIdx = currentRef.current
      const from = posRef.current || layout.towers[fromIdx]
      const plan = planTraversal(layout.towers, fromIdx, target, from, cityH - 70, heroH)
      if (plan.portal) {
        if (portalsRef.current.pin) portalsRef.current.pin.dataset.dir = plan.dir
        const g = (k) => plan.segs.find((x) => x.kind === k)
        const pop = g('popin')
        const enter = g('enter')
        const warp = g('warp')
        const sland = plan.segs.find((x) => x.superLand)
        Object.assign(plan.portal, {
          inO0: pop.t0, inO1: pop.t1,
          inC0: enter.t1 + FOLLOW + 80,
          outO0: warp.t0 + warp.dur * 0.45, outO1: warp.t0 + warp.dur * 0.45 + 240,
          outC0: sland.t1 + FOLLOW + 140,
          warpT0: warp.t0, warpT1: warp.t1,
          k: (heroH * 1.9) / 280,
        })
      }
      if (flightRef.current) cancelAnimationFrame(flightRef.current)

      landedRef.current = false
      setLanded(false)
      setHover(null)
      currentRef.current = target
      setCurrent(target)
      setMoved(true)

      const camTo = camFor(city, target, layout.towers[target])
      const t0 = performance.now()
      const total = plan.total + FOLLOW
      const maxCam = city.scrollWidth - city.clientWidth
      const sign = plan.dir === 'right' ? 1 : -1

      // where the line leaves the body: the hand marker on the sprite
      // frame when the pose has one, else the frame's top front corner
      const handOf = (wrap, dir, fallback) => {
        const track = trackRef.current
        if (!track) return { x: fallback.x, y: fallback.y - heroH * 0.95 }
        const tr = track.getBoundingClientRect()
        const hand = wrap.querySelector('.sheet__hand')
        if (hand) {
          const r = hand.getBoundingClientRect()
          return { x: r.left - tr.left, y: r.top - tr.top }
        }
        const el = wrap.querySelector('.sheet__frame') || wrap.querySelector('img')
        if (!el) return { x: fallback.x, y: fallback.y - heroH * 0.95 }
        const r = el.getBoundingClientRect()
        return {
          x: (dir === 'left' ? r.left + r.width * 0.1 : r.right - r.width * 0.1) - tr.left,
          y: r.top + r.height * 0.05 - tr.top,
        }
      }
      // each hero's reaching-arm angle, from their sprite sheet
      const armOf = (wrap) => Number(wrap.querySelector('.sheet')?.dataset.arm) || 35
      const armL = armOf(lead)
      const armF = armOf(foll)
      // the wraps' untransformed boxes relative to the group origin,
      // for clipping them at portal surfaces mid-flight
      const tr0 = trackRef.current?.getBoundingClientRect()
      const offOf = (wrap) => {
        if (!tr0) return { x: 0, y: 0 }
        const r = wrap.getBoundingClientRect()
        return { x: r.left - tr0.left - from.x, y: r.top - tr0.top - from.y }
      }
      const offL = offOf(lead)
      const offF = offOf(foll)
      // feet offsets from the group origin at rest. Mid-flight both heroes
      // ride the planned path exactly (the partner a beat behind), easing
      // off their standing spots at the start and back onto them at the end
      const feetOf = (wrap, off) => ({ x: off.x + wrap.offsetWidth / 2, y: off.y + wrap.offsetHeight })
      const dL = feetOf(lead, offL)
      const dF = feetOf(foll, offF)
      const onPath = (e) => smooth(clamp(e / 220, 0, 1)) * smooth(clamp((plan.total - e) / 220, 0, 1))
      // a puff of roof dust the moment feet touch down (portal landings get shockwaves)
      const dustAt = (pos) => {
        const d = dustRef.current
        const el = d.els[(d.i ^= 1)]
        if (!el) return
        el.style.transform = `translate(${pos.x}px, ${pos.y}px)`
        el.classList.remove('dust--go')
        void el.offsetWidth
        el.classList.add('dust--go')
      }
      const was = { L: '', F: '' }
      const touch = (key, P) => {
        if (P.phase === 'land' && was[key] === 'air' && !P.superland) dustAt(P.pos)
        was[key] = P.phase
      }
      const drawWeb = (path, dot, hand, L, dir) => {
        if (!path || !dot) return
        if (!L) {
          path.style.opacity = 0
          dot.style.opacity = 0
          return
        }
        // a released line snaps back toward the anchor instead of vanishing
        path.setAttribute('d', L.retract ? webPath(L.A, hand, L.grow, L.bow, dir) : webPath(hand, L.A, L.grow, L.bow, dir))
        path.style.opacity = 1
        dot.setAttribute('cx', L.A.x)
        dot.setAttribute('cy', L.A.y)
        dot.style.opacity = L.grow >= 1 || L.retract ? 1 : 0
      }
      const apply = (wrap, P) => {
        wrap.dataset.phase = P.phase
        wrap.dataset.move = P.move
        wrap.dataset.vy = P.vy
        wrap.dataset.dir = P.dir
      }

      if (import.meta.env.DEV) window.__plan = plan
      const step = (now) => {
        // dev: window.__flightT pins the clock, for frame-by-frame checks
        const el = import.meta.env.DEV && window.__flightT != null ? window.__flightT : now - t0
        const L = poseAt(plan, el, { x: 0, y: 0 }, soloRef.current ? armF : armL)
        const F = poseAt(plan, el - FOLLOW, { x: -sign * 16, y: -12 }, armF)

        // follow-cam on the leader; portal trips cut across during the warp
        let scroll
        if (plan.portal) {
          const P = plan.portal
          const camAtWarp = clamp(P.pin.x - city.clientWidth * CAM, 0, maxCam)
          if (el < P.warpT0) scroll = clamp(L.pos.x - city.clientWidth * CAM, 0, maxCam)
          else if (el < P.warpT1) scroll = camAtWarp + (camTo - camAtWarp) * easeInOut((el - P.warpT0) / (P.warpT1 - P.warpT0))
          else scroll = camTo
        } else {
          const follow = clamp(L.pos.x - city.clientWidth * CAM, 0, maxCam)
          const mix = clamp((el - (total - 700)) / 700, 0, 1)
          scroll = follow + (camTo - follow) * easeInOut(mix)
        }
        city.scrollLeft = scroll
        document.documentElement.style.setProperty('--sx', city.scrollLeft)

        heroes.style.transform = `translate(${L.pos.x}px, ${L.pos.y}px)`
        heroes.dataset.phase = 'flight'
        if (soloRef.current) {
          // alone: the player's wrapper is the mover; one web, no partner
          const b = onPath(el)
          const tx = -dF.x * b
          const ty = -dF.y * b
          foll.style.transform = `translate(${tx}px, ${ty}px) rotate(${L.lean}deg) scale(${L.k}) scaleY(${L.s})`
          foll.style.opacity = L.alpha
          apply(foll, L)
          portalClip(foll, L.clip, { left: L.pos.x + offF.x, top: L.pos.y + offF.y }, tx, ty)
          touch('L', L)
          drawWeb(webs.leadLine, webs.leadDot, handOf(foll, L.dir, L.pos), L.line, L.dir)
          drawWeb(webs.follLine, webs.follDot, null, null)
        } else {
          const bl = onPath(el)
          const bf = onPath(el - FOLLOW)
          const ltx = -dL.x * bl
          const lty = -dL.y * bl
          const ftx = F.pos.x - L.pos.x - dF.x * bf
          const fty = F.pos.y - L.pos.y - dF.y * bf
          lead.style.transform = `translate(${ltx}px, ${lty}px) rotate(${L.lean}deg) scale(${L.k}) scaleY(${L.s})`
          lead.style.opacity = L.alpha
          foll.style.transform = `translate(${ftx}px, ${fty}px) rotate(${F.lean}deg) scale(${F.k}) scaleY(${F.s})`
          foll.style.opacity = F.alpha
          apply(lead, L)
          apply(foll, F)
          portalClip(lead, L.clip, { left: L.pos.x + offL.x, top: L.pos.y + offL.y }, ltx, lty)
          portalClip(foll, F.clip, { left: L.pos.x + offF.x, top: L.pos.y + offF.y }, ftx, fty)
          touch('L', L)
          touch('F', F)
          drawWeb(webs.leadLine, webs.leadDot, handOf(lead, L.dir, L.pos), L.line, L.dir)
          drawWeb(webs.follLine, webs.follDot, handOf(foll, F.dir, F.pos), F.line, F.dir)
        }

        if (plan.portal) {
          const P = plan.portal
          const back = (t) => {
            const c = 1.70158
            const u = t - 1
            return 1 + (c + 1) * u * u * u + c * u * u
          }
          const drawP = (elp, pos, sc) => {
            if (!elp) return
            if (sc <= 0.02) {
              elp.style.opacity = 0
              return
            }
            elp.style.opacity = 1
            elp.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(${sc * P.k})`
          }
          let sIn = 0
          if (el >= P.inO0) sIn = el < P.inO1 ? back(clamp((el - P.inO0) / (P.inO1 - P.inO0), 0, 1)) : 1
          if (el >= P.inC0) sIn = Math.max(0, 1 - (el - P.inC0) / 240)
          drawP(portalsRef.current.pin, P.pin, sIn)
          let sOut = 0
          if (el >= P.outO0) sOut = el < P.outO1 ? back(clamp((el - P.outO0) / (P.outO1 - P.outO0), 0, 1)) : 1
          if (el >= P.outC0) sOut = Math.max(0, 1 - (el - P.outC0) / 260)
          drawP(portalsRef.current.pout, P.pout, sOut)

          const bang = (elDom, pos) => {
            if (!elDom) return
            elDom.style.transform = `translate(${pos.x}px, ${pos.y}px)`
            elDom.classList.remove('shock--go')
            void elDom.offsetWidth
            elDom.classList.add('shock--go')
          }
          if (L.superland && !plan._shL) {
            plan._shL = true
            bang(portalsRef.current.shockL, L.pos)
          }
          if (F.superland && !plan._shF) {
            plan._shF = true
            bang(portalsRef.current.shockF, F.pos)
          }
        }

        if (el < total) {
          flightRef.current = requestAnimationFrame(step)
        } else {
          flightRef.current = null
          posRef.current = plan.end
          city.scrollLeft = camTo
          heroes.style.transform = `translate(${plan.end.x}px, ${plan.end.y}px)`
          heroes.dataset.phase = ''
          for (const w of [lead, foll]) {
            w.style.transform = ''
            w.style.clipPath = ''
            w.dataset.phase = ''
            w.dataset.move = ''
            w.dataset.vy = ''
            w.dataset.dir = plan.dir // keep facing the way they arrived
          }
          drawWeb(webs.leadLine, webs.leadDot, null, null)
          drawWeb(webs.follLine, webs.follDot, null, null)
          for (const k of ['pin', 'pout']) {
            if (portalsRef.current[k]) portalsRef.current[k].style.opacity = 0
          }
          lead.style.opacity = ''
          foll.style.opacity = ''
          landedRef.current = true
          setLanded(true)
          onLandRef.current?.()
        }
      }
      flightRef.current = requestAnimationFrame(step)
      // dev: render one frame of this flight synchronously (works even
      // when the tab isn't painting, unlike rAF)
      if (import.meta.env.DEV) {
        window.__stepAt = (T) => {
          window.__flightT = T
          if (flightRef.current) cancelAnimationFrame(flightRef.current)
          step(performance.now())
        }
      }
    },
    [layout, heroH, cityH]
  )

  // ----------------------------------------------------------------
  // CINEMATICS — the dimension-switch beats. Hand-rolled tweens that
  // drive the same wrappers and portal elements as the flight loop.
  // ----------------------------------------------------------------
  const tween = (dur, fn) =>
    new Promise((res) => {
      const t0 = performance.now()
      const tick = (now) => {
        const t = clamp((now - t0) / dur, 0, 1)
        fn(t)
        if (t < 1) requestAnimationFrame(tick)
        else res()
      }
      requestAnimationFrame(tick)
    })
  const backEase = (t) => {
    const c = 1.70158
    const u = t - 1
    return 1 + (c + 1) * u * u * u + c * u * u
  }
  const gravity = (t) => t * t * (0.4 + 0.6 * t)
  const portalK = (heroH * 1.9) / 280
  const drawPortalAt = (el, pos, sc) => {
    if (!el) return
    if (sc <= 0.02) {
      el.style.opacity = 0
      return
    }
    el.style.opacity = 1
    el.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(${sc * portalK})`
  }
  const bangAt = (el, pos) => {
    if (!el) return
    el.style.transform = `translate(${pos.x}px, ${pos.y}px)`
    el.classList.remove('shock--go')
    void el.offsetWidth
    el.classList.add('shock--go')
  }

  // a hero-wrap's untransformed border box, in track coordinates
  const restBox = (w) => {
    const prev = w.style.transform
    w.style.transform = 'none'
    const r = w.getBoundingClientRect()
    w.style.transform = prev
    const tr = trackRef.current.getBoundingClientRect()
    return { left: r.left - tr.left, top: r.top - tr.top, w: r.width, h: r.height }
  }
  const shown = (w) => w.offsetParent !== null
  // beside the player, on whichever side has room on screen (the first
  // roof sits near the right edge); side 1 = right of them, -1 = left
  const portalSpot = (stand) => {
    const city = cityRef.current
    const off = clamp(heroH * 1.2, 96, 132)
    const need = off + heroH * 0.55 + 12
    const sx = stand.x - (city?.scrollLeft || 0)
    const side = !city || city.clientWidth - sx >= need || sx < need ? 1 : -1
    return { side, pin: { x: stand.x + side * off, y: stand.y - heroH * 0.62 }, dir: side > 0 ? 'right' : 'left' }
  }

  // The other Spider leans halfway out of a portal beside the player,
  // reaching for them, and stays there while the dialogue plays. The
  // portal stays open — pullThrough() finishes the job.
  const peekRef = useRef(null)
  const summonPartner = useCallback(async () => {
    const lead = leaderRef.current
    const pinEl = portalsRef.current.pin
    const stand = posRef.current
    if (!lead || !pinEl || !stand || !landedRef.current) return false
    landedRef.current = false
    setLanded(false)
    setHover(null)
    const { side, pin, dir } = portalSpot(stand)
    const clip = { v: pin, dir } // the player's side of the surface shows
    pinEl.dataset.dir = dir
    // out of the flex row, so the player doesn't shuffle sideways
    Object.assign(lead.style, { display: 'block', position: 'absolute', right: '0px', bottom: '0px', opacity: '0', transform: 'none' })
    lead.dataset.dir = side > 0 ? 'left' : 'right' // facing the player
    lead.dataset.move = 'shoot' // the reaching pose
    lead.dataset.phase = ''
    await tween(300, (t) => drawPortalAt(pinEl, pin, backEase(t)))
    const box = restBox(lead)
    const by = pin.y + heroH * 0.4 - (box.top + box.h) // body centred in the ring
    const x0 = pin.x + side * heroH * 0.45 - (box.left + box.w / 2) // still all inside
    const x1 = pin.x - side * heroH * 0.2 - (box.left + box.w / 2) // leaning out
    // the lean lives on the inner sprite, so the clip (on the wrap) stays
    // exact: head, chest and reaching arm clear the rim into open air,
    // the legs stay on the far side of the surface
    const inner = lead.querySelector('.sheet')
    if (inner) inner.style.transformOrigin = '50% 62%'
    const lean = (k) => inner && (inner.style.transform = `rotate(${-side * k}deg)`)
    lead.style.transform = `translate(${x0}px, ${by}px)`
    portalClip(lead, clip, box, x0, by)
    lead.style.opacity = '1'
    await tween(500, (t) => {
      const e = backEase(t)
      const tx = x0 + (x1 - x0) * e
      lead.style.transform = `translate(${tx}px, ${by}px)`
      lean(26 * e)
      portalClip(lead, clip, box, tx, by)
    })
    lead.classList.add('hero-wrap--peek')
    peekRef.current = { side, pin, clip, box, x1, by, lean }
    return true
  }, [heroH])

  // ...then grabs the player and yanks them through, and slips back in.
  const pullThrough = useCallback(async () => {
    const lead = leaderRef.current
    const foll = followerRef.current
    const pinEl = portalsRef.current.pin
    const pk = peekRef.current
    if (!lead || !foll || !pinEl || !pk) return false
    const { side, pin, clip, box, x1, by, lean } = pk
    lead.classList.remove('hero-wrap--peek')
    const x2 = x1 - side * heroH * 0.14 // the grab: one more lunge out
    await tween(180, (t) => {
      const e = smooth(t)
      const tx = x1 + (x2 - x1) * e
      lead.style.transform = `translate(${tx}px, ${by}px)`
      lean(26 + 12 * e)
      portalClip(lead, clip, box, tx, by)
    })
    const fb = restBox(foll)
    const inner = foll.querySelector('.sheet')
    const gx = pin.x + side * heroH * 0.8 - (fb.left + fb.w / 2)
    const gy = pin.y + heroH * 0.42 - (fb.top + fb.h)
    foll.dataset.dir = side > 0 ? 'right' : 'left'
    foll.dataset.move = ''
    foll.dataset.phase = 'air'
    foll.dataset.vy = 'up'
    await tween(560, (t) => {
      // yanked: fast off the mark, tumbling forward, through the surface
      const e = 1 - (1 - t) ** 3
      const tx = gx * e
      const ty = gy * e - heroH * 0.28 * Math.sin(Math.PI * Math.min(1, t * 1.15))
      foll.style.transform = `translate(${tx}px, ${ty}px)`
      if (inner) inner.style.transform = `rotate(${side * 190 * e}deg)`
      portalClip(foll, clip, fb, tx, ty)
      // the guide backs in right behind them, straightening up
      const back = smooth(clamp((t - 0.3) / 0.7, 0, 1))
      const ltx = x2 + side * heroH * 1.15 * back
      lead.style.transform = `translate(${ltx}px, ${by}px)`
      lean(38 * (1 - back))
      portalClip(lead, clip, box, ltx, by)
    })
    for (const w of [lead, foll]) w.style.opacity = '0'
    await tween(220, (t) => drawPortalAt(pinEl, pin, 1 - t))
    peekRef.current = null
    return true
  }, [heroH])

  // Both run and dive into a portal; resolves once they're through.
  const exitPortal = useCallback(async () => {
    const lead = leaderRef.current
    const foll = followerRef.current
    const pinEl = portalsRef.current.pin
    const stand = posRef.current
    if (!lead || !foll || !pinEl || !stand) return false
    landedRef.current = false
    setLanded(false)
    setHover(null)
    const { side, pin, dir } = portalSpot(stand)
    const clip = { v: pin, dir }
    pinEl.dataset.dir = dir
    const runners = [lead, foll].filter(shown) // a partner who isn't here stays hidden
    for (const w of runners) {
      w.dataset.dir = dir
      w.dataset.move = 'run'
    }
    await tween(260, (t) => drawPortalAt(pinEl, pin, backEase(t)))
    // whoever is nearer the portal goes first (the guide, on the right)
    const first = side > 0 ? lead : foll
    const jobs = runners.map((w) => {
      const b = restBox(w)
      return {
        w, b,
        delay: runners.length > 1 && w !== first ? 0.24 : 0,
        gx: pin.x + side * heroH * 0.8 - (b.left + b.w / 2),
        gy: pin.y + heroH * 0.4 - (b.top + b.h),
      }
    })
    await tween(640, (t) => {
      for (const j of jobs) {
        const q = clamp((t - j.delay) / (1 - j.delay), 0, 1)
        if (q > 0.38 && j.w.dataset.phase !== 'air') {
          j.w.dataset.move = ''
          j.w.dataset.phase = 'air'
          j.w.dataset.vy = 'up'
        }
        const e = q * q // accelerating into the dive
        const tx = j.gx * e
        const ty = j.gy * e - heroH * 0.22 * Math.sin(Math.PI * q)
        j.w.style.transform = `translate(${tx}px, ${ty}px)`
        portalClip(j.w, clip, j.b, tx, ty)
      }
    })
    for (const w of runners) {
      w.style.opacity = '0'
      w.dataset.move = ''
    }
    await tween(220, (t) => drawPortalAt(pinEl, pin, 1 - t))
    return true
  }, [heroH])

  useEffect(() => {
    if (!worldFxRef) return
    worldFxRef.current = {
      ready: () => landedRef.current,
      currentYear: () => YEARS[currentRef.current]?.year,
      summonPartner,
      pullThrough,
      exitPortal,
    }
    return () => {
      worldFxRef.current = null
    }
  }, [worldFxRef, summonPartner, pullThrough, exitPortal, YEARS])

  // Portal entrance after a dimension switch: drop out of a portal
  // above the arrival roof into a superhero landing.
  const enteredRef = useRef(false)
  useEffect(() => {
    if (entrance !== 'portal' || !layout || enteredRef.current) return
    enteredRef.current = true
    const heroes = heroesRef.current
    const lead = leaderRef.current
    const foll = followerRef.current
    const poutEl = portalsRef.current.pout
    const t = layout.towers[currentRef.current]
    if (!heroes || !lead || !foll || !poutEl || !t) return
    ;(async () => {
      const pout = { x: t.x, y: t.y - 198 }
      const clip = { h: pout } // only what has dropped below the surface shows
      heroes.style.opacity = 1
      const droppers = [lead, foll].filter(shown)
      const duo = droppers.length > 1
      for (const w of droppers) {
        w.style.opacity = '0'
        w.dataset.dir = 'right'
      }
      await tween(260, (q) => drawPortalAt(poutEl, pout, backEase(q)))
      const jobs = droppers.map((w) => {
        const b = restBox(w)
        return {
          w, b,
          delay: duo && w === foll ? 0.22 : 0,
          land: { x: b.left + b.w / 2, y: b.top + b.h },
          // start: feet at the surface, under the ring (side by side)
          sx: pout.x + (duo ? (w === foll ? -20 : 20) : 0) - (b.left + b.w / 2),
          sy: pout.y + 4 - (b.top + b.h),
        }
      })
      for (const j of jobs) {
        j.w.dataset.phase = 'air'
        j.w.dataset.vy = 'down'
        j.w.style.transform = `translate(${j.sx}px, ${j.sy}px)`
        portalClip(j.w, clip, j.b, j.sx, j.sy)
        j.w.style.opacity = '1'
      }
      await tween(520, (q) => {
        for (const j of jobs) {
          const g = gravity(clamp((q - j.delay) / (1 - j.delay), 0, 1))
          const tx = j.sx * (1 - g)
          const ty = j.sy * (1 - g)
          j.w.style.transform = `translate(${tx}px, ${ty}px)`
          portalClip(j.w, clip, j.b, tx, ty)
        }
      })
      for (const j of jobs) {
        j.w.style.clipPath = ''
        j.w.dataset.phase = 'land'
        j.w.dataset.vy = ''
      }
      jobs.forEach((j, i) => bangAt(i ? portalsRef.current.shockF : portalsRef.current.shockL, j.land))
      await tween(SLAND, (q) => {
        const sc = 0.78 + 0.22 * smooth(q)
        for (const j of jobs) j.w.style.transform = `scaleY(${sc})`
      })
      await tween(240, (q) => drawPortalAt(poutEl, pout, 1 - q))
      for (const w of [lead, foll]) {
        w.style.transform = ''
        w.style.opacity = ''
        w.dataset.phase = ''
      }
      landedRef.current = true
      setLanded(true)
      onEntered?.()
    })()
  }, [entrance, layout, heroH, onEntered])

  // let the fast-track panel send us to a year
  useEffect(() => {
    if (!jumpToYear) return
    jumpToYear.current = (year) => goTo(nearestIdx(year))
    return () => {
      jumpToYear.current = null
    }
  }, [jumpToYear, goTo, nearestIdx])

  useEffect(() => () => flightRef.current && cancelAnimationFrame(flightRef.current), [])

  // Controls: keys, wheel flick, swipe. One hop each, none mid-flight.
  useEffect(() => {
    const city = cityRef.current
    if (!city || !layout) return
    const hop = (dir) => {
      if (!landedRef.current) return
      goTo(currentRef.current + dir)
    }
    const onKey = (e) => {
      if (document.querySelector('.quiz')) return
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        hop(1)
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        hop(-1)
      }
    }
    let acc = 0
    let lock = 0
    const onWheel = (e) => {
      const list = e.target.closest?.('.panel__list')
      if (list && list.scrollHeight > list.clientHeight && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) return
      e.preventDefault()
      if (performance.now() < lock) return
      acc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (Math.abs(acc) > 60) {
        hop(Math.sign(acc))
        acc = 0
        lock = performance.now() + 800
      }
    }
    let downX = null
    const onDown = (e) => {
      downX = e.clientX
    }
    const onUp = (e) => {
      if (downX == null) return
      const dx = e.clientX - downX
      downX = null
      if (Math.abs(dx) > 50) hop(dx < 0 ? 1 : -1)
    }
    window.addEventListener('keydown', onKey)
    city.addEventListener('wheel', onWheel, { passive: false })
    city.addEventListener('pointerdown', onDown)
    city.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('keydown', onKey)
      city.removeEventListener('wheel', onWheel)
      city.removeEventListener('pointerdown', onDown)
      city.removeEventListener('pointerup', onUp)
    }
  }, [layout, goTo])

  const points = layout ? [...layout.towers, layout.finish] : []
  const prev = YEARS[current - 1]
  const next = YEARS[current + 1]

  return (
    <>
      <div className="city" ref={cityRef} tabIndex={0}>
        {layout && (
          <div className="track" ref={trackRef} style={{ width: layout.trackW }}>
            <div
              className="tiles"
              style={{
                backgroundImage: `url("${analysis.src}")`,
                backgroundSize: `${layout.tileW}px ${layout.tileH}px`,
                height: layout.tileH,
                bottom: 0,
              }}
            />

            <section className="intro">
              <p className="intro__kicker">A Marvel checklist</p>
              <h2 className="intro__title display chroma--heavy">
                Light up
                <br />
                the city
              </h2>
              <p className="intro__sub">
                26 years, 106 titles, one rooftop each. Jump building to building and tick
                what you've seen. Order doesn't matter. Finishing before Doomsday does.
              </p>
            </section>

            <svg className="road" width={layout.trackW} height={cityH} aria-hidden="true">
              <path className="road__under" d={roadPath(points)} />
              <path className="road__line" d={roadPath(points)} />
            </svg>

            {YEARS.map((y, i) => (
              <Tower
                key={y.year}
                index={i}
                year={y.year}
                titles={y.titles}
                pos={layout.towers[i]}
                open={i === current && landed}
                cityH={cityH}
                flip={flipsAt(i)}
                screenX={layout.towers[i].x - restScroll(i, layout.towers[i], cityW, layout.trackW)}
                watched={watched}
                scores={scores}
                onToggle={onToggle}
                onQuiz={onQuiz}
                onFocus={() => goTo(i)}
                onHover={showHover}
              />
            ))}

            <div className="finish" style={{ left: layout.finish.x, top: layout.finish.y }}>
              <div className="deck" aria-hidden="true">
                <div className="deck__body" />
                <div className="deck__top" />
                <div className="deck__pad" />
              </div>
              <section className="kiosk">
                <div className="kiosk__kicker">Finish line</div>
                <div className="kiosk__title display chroma--heavy">Doomsday</div>
                <div className="kiosk__screen">
                  {/* a screen, not a player: no controls, no clicks, YouTube's
                      title/branding bars cropped off by the taller frame */}
                  <iframe
                    src="https://www.youtube-nocookie.com/embed/f17J3AXVK5w?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&modestbranding=1&iv_load_policy=3&rel=0&playsinline=1&loop=1&playlist=f17J3AXVK5w"
                    title="Avengers: Doomsday"
                    loading="lazy"
                    tabIndex={-1}
                    allow="autoplay; encrypted-media"
                  />
                </div>
                <div className="kiosk__sub">18 · 12 · 2026</div>
              </section>
            </div>

            {/* the web lines — drawn by the flight loop */}
            <svg className="webs" width={layout.trackW} height={cityH} aria-hidden="true">
              <path ref={(el) => (websRef.current.leadLine = el)} className="web web--lead" />
              <circle ref={(el) => (websRef.current.leadDot = el)} className="web__anchor" r="5" />
              <path ref={(el) => (websRef.current.follLine = el)} className="web web--follow" />
              <circle ref={(el) => (websRef.current.follDot = el)} className="web__anchor" r="4" />
            </svg>

            {/* dimensional portals + landing shockwaves (flight loop drives them) */}
            <Portal ref={(el) => (portalsRef.current.pin = el)} variant="in" />
            <Portal ref={(el) => (portalsRef.current.pout = el)} variant="out" />
            <div className="shock" ref={(el) => (portalsRef.current.shockL = el)} />
            <div className="shock" ref={(el) => (portalsRef.current.shockF = el)} />
            <div className="dust" ref={(el) => (dustRef.current.els[0] = el)} />
            <div className="dust" ref={(el) => (dustRef.current.els[1] = el)} />

            <Heroes
              ref={heroesRef}
              stamp={`${current}:${landed}`}
              low={flipsAt(current)}
              solo={solo}
              leaderRef={leaderRef}
              followerRef={followerRef}
              leader={guide}
              follower={character}
              size={heroH}
              line={line}
              reaction={reaction}
            />
          </div>
        )}
      </div>

      {/* page turns */}
      <button
        className="pager pager--prev display"
        disabled={!landed || !prev}
        onClick={() => goTo(current - 1)}
        aria-label="Previous building"
      >
        ‹ <span>{prev?.year ?? ''}</span>
      </button>
      <button
        className="pager pager--next display"
        disabled={!landed || !next}
        onClick={() => goTo(current + 1)}
        aria-label="Next building"
      >
        <span>{next?.year ?? ''}</span> ›
      </button>

      {/* level-select strip */}
      <nav className="minimap" aria-label="Jump to a year">
        {YEARS.map((y, i) => {
          const lit = y.titles.filter((t) => watched.has(t.id)).length
          return (
            <button
              key={y.year}
              className={`mm ${i === current ? 'mm--current' : ''} ${
                lit === y.titles.length ? 'mm--done' : ''
              }`}
              style={{ '--n': y.titles.length, '--lit': lit / y.titles.length }}
              onClick={() => goTo(i)}
              title={`${y.year} · ${lit}/${y.titles.length}`}
            >
              <span className="mm__bar">
                <span className="mm__fill" />
              </span>
              <span className="mm__year">{String(y.year).slice(2)}</span>
            </button>
          )
        })}
      </nav>

      {!moved && <div className="hint display">← → jump between buildings</div>}

      <HoverCard hover={hover} catalog={catalog} onEnter={keepHover} onLeave={() => showHover(null)} />
    </>
  )
}
