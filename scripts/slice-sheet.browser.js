// ---------------------------------------------------------------
// SPRITE-SHEET SLICER — runs IN THE BROWSER on the dev server.
//
// 1. Drop the sheet at public/characters/<id>-sheet.png
// 2. Open http://localhost:5173, open DevTools console, paste this
//    whole file, then run:   await sliceSheet('miles', { ... })
// 3. It draws a contact sheet (rows/frames numbered) so you can pick
//    frames, and once you pass `pick` it saves
//       public/characters/<id>-clean.png   (web lines stripped)
//       public/characters/<id>.sheet.json  (frames per animation)
//    through the dev-only /__save endpoint (vite.config.js).
//
//    await sliceSheet('miles')                       → just the contact sheet
//    await sliceSheet('miles', { pick: {
//      idle: [3, [4,5,6,7]], run: [0, [0,1,2,3,4,5,6,7,8,9,10]],
//      takeoff: [18, [0,1]], jump: [18, [4,5]], fall: [21, [15,16]],
//      land: [5, [0,1]], swing: [21, [5,6,7,8,9,10,11,12]], shoot: [18, [10]],
//    }, cleanAnims: ['swing', 'shoot', 'takeoff'] })
//    (numbers are [row, [frame indices]] as printed on the contact sheet)
// ---------------------------------------------------------------
async function sliceSheet(id, { pick = null, cleanAnims = ['swing', 'shoot'], fps = {}, loops = {} } = {}) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('cannot load sheet')); i.src = `/characters/${id}-sheet.png?v=${Date.now()}` })
  const W = img.naturalWidth, H = img.naturalHeight
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0)
  const im = ctx.getImageData(0, 0, W, H); const d = im.data; const N = W * H

  // connected components of non-transparent pixels
  const mask = new Uint8Array(N); for (let p = 0; p < N; p++) if (d[p * 4 + 3] >= 40) mask[p] = 1
  const label = new Int32Array(N), stack = new Int32Array(N); let n = 0; const comps = []
  for (let p = 0; p < N; p++) {
    if (!mask[p] || label[p]) continue
    n++; let sp = 0; stack[sp++] = p; label[p] = n; let minx = W, miny = H, maxx = 0, maxy = 0, cnt = 0
    while (sp) {
      const q = stack[--sp]; const x = q % W, y = (q / W) | 0; cnt++
      if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y
      for (let dy = -1; dy <= 1; dy++) { const ny = y + dy; if (ny < 0 || ny >= H) continue
        for (let dx = -1; dx <= 1; dx++) { const nx = x + dx; if (nx < 0 || nx >= W) continue; const r = ny * W + nx; if (mask[r] && !label[r]) { label[r] = n; stack[sp++] = r } } }
    }
    if (cnt >= 20) comps.push({ x: minx, y: miny, w: maxx - minx + 1, h: maxy - miny + 1, n: cnt })
  }
  // bodies vs fragments (hair, hands): attach fragments to the nearest body
  const dens = (b) => b.n / (b.w * b.h); const isBody = (b) => b.h >= 60 && dens(b) > 0.08
  const bodies = comps.filter(isBody).map((b) => ({ ...b })); const frags = comps.filter((b) => !isBody(b))
  for (const f of frags) {
    if ((f.w > 220 || f.h > 220) && dens(f) < 0.06) continue // long thin web strokes: ignore
    let best = null, bestD = 1e9
    for (const b of bodies) { const dx = Math.max(0, b.x - (f.x + f.w), f.x - (b.x + b.w)); const dy = Math.max(0, b.y - (f.y + f.h), f.y - (b.y + b.h)); const dist = Math.hypot(dx, dy); if (dist < bestD) { bestD = dist; best = b } }
    if (best && bestD <= 14) { const x = Math.min(best.x, f.x), y = Math.min(best.y, f.y); best.w = Math.max(best.x + best.w, f.x + f.w) - x; best.h = Math.max(best.y + best.h, f.y + f.h) - y; best.x = x; best.y = y; best.n += f.n }
  }
  // rows by vertical centre
  const frames = bodies.sort((a, b) => (a.y + a.h / 2) - (b.y + b.h / 2)); const rows = []
  for (const f of frames) { const cy = f.y + f.h / 2; const r = rows[rows.length - 1]; if (r && Math.abs(cy - r.cy) <= 55) { r.frames.push(f); r.cy = (r.cy * (r.frames.length - 1) + cy) / r.frames.length } else rows.push({ cy, frames: [f] }) }
  rows.forEach((r) => r.frames.sort((a, b) => a.x - b.x))

  // contact sheet overlay (remove with document.getElementById('__contact').remove())
  document.getElementById('__contact')?.remove()
  const PAD = 4, LABEL = 15; let y = 0; const meta = []
  for (const [ri, r] of rows.entries()) { const sumW = r.frames.reduce((s, f) => s + f.w, 0) + PAD * (r.frames.length - 1); const hMax = Math.max(...r.frames.map((f) => f.h)); const s = Math.min(0.4, 780 / sumW); meta.push({ ri, y, s, hMax }); y += hMax * s + LABEL + 5 }
  const cs = document.createElement('canvas'); cs.width = 790; cs.height = Math.ceil(y); const g = cs.getContext('2d'); g.fillStyle = '#5b5b68'; g.fillRect(0, 0, cs.width, cs.height)
  for (const m of meta) { const r = rows[m.ri]; g.fillStyle = '#FFD600'; g.font = 'bold 12px sans-serif'; g.fillText(`row ${m.ri} · ${r.frames.length}f`, 4, m.y + 11); let x = 4
    for (const [fi, f] of r.frames.entries()) { g.drawImage(c, f.x, f.y, f.w, f.h, x, m.y + LABEL, f.w * m.s, f.h * m.s); g.fillStyle = '#00E5FF'; g.font = 'bold 10px sans-serif'; g.fillText(fi, x + 1, m.y + LABEL + m.hMax * m.s - 1); x += f.w * m.s + PAD } }
  cs.id = '__contact'; Object.assign(cs.style, { position: 'fixed', left: 0, top: 0, zIndex: 99999, maxHeight: '100vh', overflow: 'auto' }); document.body.appendChild(cs)
  console.log(`${rows.length} rows:`, rows.map((r, i) => `${i}:${r.frames.length}`).join(' '))
  if (!pick) return { rows }

  // strip web lines (saturated pale blue) inside chosen boxes, keep the biggest blob
  const isWeb = (i) => { const r = d[i], gg = d[i + 1], b = d[i + 2]; const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); return d[i + 3] > 0 && b === mx && (mx + mn) / 2 > 140 && (mx - mn) / mx > 0.16 && b - r > 35 }
  const clean = (b) => {
    for (let yy = b.y; yy < b.y + b.h; yy++) for (let xx = b.x; xx < b.x + b.w; xx++) { const i = (yy * W + xx) * 4; if (isWeb(i)) d[i + 3] = 0 }
    const lab = new Int32Array(b.w * b.h); let k = 0; const sizes = [0]; const st = []
    for (let yy = 0; yy < b.h; yy++) for (let xx = 0; xx < b.w; xx++) { const li = yy * b.w + xx; if (lab[li] || d[((b.y + yy) * W + b.x + xx) * 4 + 3] < 40) continue; k++; sizes.push(0); lab[li] = k; st.push(li)
      while (st.length) { const q = st.pop(); sizes[k]++; const qx = q % b.w, qy = (q / b.w) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = qx + dx, ny = qy + dy; if (nx < 0 || ny < 0 || nx >= b.w || ny >= b.h) continue; const nl = ny * b.w + nx; if (!lab[nl] && d[((b.y + ny) * W + b.x + nx) * 4 + 3] >= 40) { lab[nl] = k; st.push(nl) } } } }
    let big = 1; for (let i = 2; i <= k; i++) if (sizes[i] > sizes[big]) big = i
    for (let yy = 0; yy < b.h; yy++) for (let xx = 0; xx < b.w; xx++) { const li = yy * b.w + xx; if (lab[li] && lab[li] !== big) d[((b.y + yy) * W + b.x + xx) * 4 + 3] = 0 }
  }
  for (const k of cleanAnims) { const [ri, idxs] = pick[k] || []; if (ri == null) continue; idxs.forEach((fi) => clean(rows[ri].frames[fi])) }
  ctx.putImageData(im, 0, 0)
  const tight = (b) => { let minx = b.x + b.w, miny = b.y + b.h, maxx = b.x, maxy = b.y; for (let yy = b.y; yy < b.y + b.h; yy++) for (let xx = b.x; xx < b.x + b.w; xx++) if (d[(yy * W + xx) * 4 + 3] >= 40) { if (xx < minx) minx = xx; if (xx > maxx) maxx = xx; if (yy < miny) miny = yy; if (yy > maxy) maxy = yy } return { x: minx, y: miny, w: maxx - minx + 1, h: maxy - miny + 1 } }
  const anims = Object.fromEntries(Object.entries(pick).map(([k, [ri, idxs]]) => [k, idxs.map((fi) => tight(rows[ri].frames[fi]))]))
  const refH = Math.max(...anims.idle.map((f) => f.h)), refW = Math.round(anims.idle.reduce((s, f) => s + f.w, 0) / anims.idle.length)
  const sheet = { src: `/characters/${id}-clean.png`, refH, refW,
    fps: { idle: 6, run: 14, takeoff: 12, jump: 8, fall: 8, land: 10, swing: 10, shoot: 8, ...fps },
    loops: { takeoff: false, jump: false, fall: false, land: false, shoot: false, ...loops }, anims }
  const r1 = await fetch(`/__save?name=${id}-clean.png`, { method: 'POST', body: c.toDataURL('image/png') }).then((r) => r.text())
  const r2 = await fetch(`/__save?name=${id}.sheet.json`, { method: 'POST', body: JSON.stringify(sheet, null, 1) }).then((r) => r.text())
  console.log(r1, '\n', r2); return { rows, sheet }
}
