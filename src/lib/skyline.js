// ---------------------------------------------------------------
// SKYLINE → ROOFTOPS.
//
// The skyline art IS the city. This module turns any skyline image
// into a list of rooftop anchors (flat roofs, prominent, spaced),
// then lays the 26 years + the Doomsday finish out along them,
// tiling the art as many times as needed. Swap the art and the
// towers re-detect on the next load.
// ---------------------------------------------------------------

// Baked at build time: the strips as WebP plus their roof metadata,
// so production never runs the pixel scan or the recolor.
export const STRIPS = {
  core: { src: '/bg/skyline.webp', meta: '/bg/skyline.meta.json' },
  all: { src: '/bg/skyline-pink.webp', meta: '/bg/skyline-pink.meta.json' },
}

const ANALYSIS_CACHE = new Map()
export async function analyzeSkylineCached(src, metaUrl) {
  if (ANALYSIS_CACHE.has(src)) return ANALYSIS_CACHE.get(src)
  let result = null
  if (metaUrl) {
    try {
      const r = await fetch(metaUrl)
      if (r.ok && (r.headers.get('content-type') || '').includes('json')) {
        const m = await r.json()
        await loadImage(src) // the image must really exist (and warms the decode)
        result = { src, ...m }
      }
    } catch {
      /* fall through to the full scan */
    }
  }
  if (!result) result = await analyzeSkyline(src)
  ANALYSIS_CACHE.set(src, result)
  return result
}

// First one that exists wins. Any city image works — a flattened
// wallpaper with its sky still in gets the sky keyed out at load.
export const SKYLINE_CANDIDATES = [
  '/bg/skyline.png',
  '/bg/skyline.jpg',
  '/bg/skyline.jpeg',
  '/bg/skyline.webp',
]
export const SKYLINE_SRC = SKYLINE_CANDIDATES[0]

// Measured off the Figma frame (1512×982): the strip sits at 1:1,
// bottom-aligned, so it fills 87% of the height, and the heroes' feet
// rest on the strip's own rooftop ledge, ~9.5% up from its base.
export const TILE_H_RATIO = 0.87
export const BASE_RATIO = 0.095
export const INTRO_W = 720       // roofs under the intro text are skipped

// panel geometry used when choosing roofs (mirrors city.css) — the
// panel grows upward from the roof, beside the sign
const ROW_H = 32
const PANEL_HEAD = 46
const PANEL_GAP = 130  // the billboard sits 100px up on struts + breathing room

// A procedural strip so the app works before your art exists.
export function proceduralSkyline(seed = 7, color = '#221A5C') {
  const width = 1600
  const height = 300
  let s = seed
  const rnd = () => ((s = (s * 9301 + 49297) % 233280), s / 233280)
  const parts = []
  let x = 0
  while (x < width) {
    const w = 40 + Math.floor(rnd() * 80)
    const h = 60 + Math.floor(rnd() * 200)
    parts.push(`<rect x="${x}" y="${height - h}" width="${w}" height="${h}"/>`)
    x += w + Math.floor(rnd() * 14)
  }
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'>` +
    `<g fill='${color}'>${parts.join('')}</g></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`could not load ${src.slice(0, 60)}`))
    img.src = src
  })
}

// Read the art's top edge per column, find flat roofs, keep the
// prominent ones in the upper part of the image, spaced apart.
//
// A flattened export (a wallpaper with its sky still in) gets the sky
// keyed out here as well, so your gradient shows behind the towers.
export async function analyzeSkyline(src) {
  const img = await loadImage(src)
  const W = img.naturalWidth
  const H = img.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  const image = ctx.getImageData(0, 0, W, H)
  const { data } = image
  const row = W * 4

  // Does the art already have a transparent sky? Sample the top row.
  let hasAlpha = false
  for (let x = 0; x < W; x += Math.max(1, Math.floor(W / 64))) {
    if (data[x * 4 + 3] < 40) {
      hasAlpha = true
      break
    }
  }

  const top = new Float32Array(W)
  if (hasAlpha) {
    for (let x = 0; x < W; x++) {
      let y = 0
      while (y < H && data[(y * W + x) * 4 + 3] < 128) y++
      top[x] = y
    }
  } else {
    // The sky is a smooth gradient; a roofline is the first sharp change
    // down a column that persists (so compression noise doesn't count).
    const tol = 24
    const diff = (a, b) =>
      Math.abs(data[a] - data[b]) + Math.abs(data[a + 1] - data[b + 1]) + Math.abs(data[a + 2] - data[b + 2])
    for (let x = 0; x < W; x++) {
      let y = 2
      while (y < H - 2) {
        const here = (y * W + x) * 4
        if (diff(here, here - 2 * row) > tol && diff(here + 2 * row, here - 2 * row) > tol) break
        y++
      }
      top[x] = y
    }
    // Stars and specks stop a column early — a 5-wide median removes them.
    const raw = Float32Array.from(top)
    for (let x = 2; x < W - 2; x++) {
      const win = [raw[x - 2], raw[x - 1], raw[x], raw[x + 1], raw[x + 2]].sort((a, b) => a - b)
      top[x] = win[2]
    }
    // Key the sky out, with a short feather so the roofline stays crisp.
    for (let x = 0; x < W; x++) {
      const t = top[x]
      for (let y = 0; y < H; y++) {
        if (y >= t + 2) break
        const j = (y * W + x) * 4
        data[j + 3] = y < t - 2 ? 0 : Math.round(((y - (t - 2)) / 4) * 255)
      }
    }
    ctx.putImageData(image, 0, 0)
    src = canvas.toDataURL('image/png')
  }

  // flat roofs = runs where the top edge barely changes
  const tol = Math.max(2, H * 0.01)
  const minRun = Math.max(6, W * 0.012)
  const runs = []
  let start = 0
  for (let x = 1; x <= W; x++) {
    if (x === W || Math.abs(top[x] - top[x - 1]) > tol) {
      const w = x - start
      if (w >= minRun) {
        let sum = 0
        for (let k = start; k < x; k++) sum += top[k]
        runs.push({ cx: (start + x - 1) / 2, y: sum / w, w })
      }
      start = x
    }
  }

  // prominent (tall × wide), in the upper 60% of the art, spaced out
  const minGap = W * 0.1 // roofs at least a tenth of the strip apart → real gaps between buildings
  const usable = runs.filter((r) => r.y > 1 && r.y < H * 0.6)
  usable.sort((a, b) => (H - b.y) * Math.sqrt(b.w) - (H - a.y) * Math.sqrt(a.w))
  const picked = []
  for (const r of usable) {
    if (picked.every((p) => Math.abs(p.cx - r.cx) >= minGap)) picked.push(r)
  }
  picked.sort((a, b) => a.cx - b.cx)

  return {
    src,
    W,
    H,
    keyed: !hasAlpha,
    anchors: picked.map((p) => ({ nx: p.cx / W, ny: p.y / H, nw: p.w / W })),
  }
}

// Building widths are FIXED: from the roof the detector found, capped
// so every building keeps a clear gap (MIN_VOID) to its neighbours.
export const MIN_VOID = 120
export function buildingWidth(roofW = 300, spacing = Infinity) {
  return Math.round(Math.max(240, Math.min(340, (roofW || 200) + 90, spacing - MIN_VOID)))
}
function withBuildings(towers, finish) {
  const all = [...towers, finish]
  return all.map((p, i) => {
    const gaps = []
    if (i > 0) gaps.push(Math.abs(p.x - all[i - 1].x))
    if (i < all.length - 1) gaps.push(Math.abs(all[i + 1].x - p.x))
    return { ...p, deckW: buildingWidth(p.w, Math.min(...gaps)) }
  })
}

// Years → rooftops, left to right, tiling the art until they all fit.
export function layoutTowers(analysis, cityH, years) {
  const { W, H, anchors } = analysis
  const tileH = Math.round(cityH * TILE_H_RATIO)
  const tileW = Math.max(400, Math.round(tileH * (W / H)))
  const tilesTop = cityH - tileH
  const minGap = tileW * 0.1
  const base = { tileW, tileH, tilesTop }

  for (let N = 2; N <= 8 && anchors.length; N++) {
    const pts = []
    for (let t = 0; t < N; t++) {
      for (const a of anchors) {
        const x = t * tileW + a.nx * tileW
        if (x < INTRO_W) continue
        if (pts.length && x - pts[pts.length - 1].x < minGap) continue
        pts.push({ x, y: tilesTop + a.ny * tileH, w: a.nw * tileW })
      }
    }
    const placed = assign(pts, years, tileW)
    if (placed) {
      const all = withBuildings(placed.towers, placed.finish)
      return { ...base, N, trackW: N * tileW, towers: all.slice(0, -1), finish: all[all.length - 1] }
    }
  }

  // Nothing usable in the art — evenly spaced roofs so the app still works.
  const N = 3
  const trackW = N * tileW
  const step = (trackW - INTRO_W - 320) / (years.length + 1)
  const y = tilesTop + tileH * 0.4
  const all = withBuildings(years.map((_, i) => ({ x: INTRO_W + 160 + i * step, y, maxH: 320 })), { x: INTRO_W + 160 + years.length * step, y })
  return { ...base, N, trackW, towers: all.slice(0, -1), finish: all[all.length - 1] }
}

// Walk the roofs in order. If a year's panel wouldn't fit above a
// cramped roof and a roomier one is right next door, use that.
const TOP_SAFE = 76 // the topbar overlays the track; panels must stay below it
function assign(pts, years, tileW) {
  const room = (p) => p.y - PANEL_GAP - TOP_SAFE
  const towers = []
  let k = 0
  for (const yr of years) {
    if (k >= pts.length) return null
    const need = PANEL_HEAD + yr.titles.length * ROW_H + 24
    if (
      k + 1 < pts.length &&
      room(pts[k]) < need &&
      room(pts[k + 1]) > room(pts[k]) &&
      pts[k + 1].x - pts[k].x < tileW * 0.14
    ) {
      k++
    }
    const maxH = Math.max(130, Math.floor(room(pts[k]) - PANEL_HEAD - 12))
    const panelH = PANEL_HEAD + Math.min(yr.titles.length * ROW_H + 24, maxH)
    // a roof so high its (bottom-anchored) panel would slide under the
    // topbar gets pulled down; the art tower behind just reads as backdrop
    const y = Math.max(pts[k].y, TOP_SAFE + 110 + panelH)
    towers.push({ ...pts[k], y, maxH })
    k++
  }
  if (k >= pts.length) return null
  return { towers, finish: pts[k] }
}

// Dev-only: lets the console bake static artifacts (webp strips, roof
// metadata) that production then loads instead of recomputing.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__skylineTools = { analyzeSkyline, loadImage }
}
