import { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------
// A character drawn from a sprite sheet. Frames come from
// public/characters/<id>.sheet.json (made by the slicer); the
// animation to play is read off the parent wrapper's data-*
// attributes, which Skyline's flight loop writes every frame:
//   data-phase  crouch | air | land | ''
//   data-vy     up | down          (while airborne)
//   data-move   run | swing | ''   (for the controllable mode)
//   data-dir    left | right
// Frames step at 12fps by default — on twos, like the film.
// ---------------------------------------------------------------
const FPS = 12

function pick(ds) {
  const phase = ds.phase || ''
  if (phase === 'crouch') return 'takeoff'
  if (phase === 'air') return ds.vy === 'down' ? 'fall' : 'jump'
  if (phase === 'land') return 'land'
  if (ds.move === 'run') return 'run'
  if (ds.move === 'swing') return 'swing'
  if (ds.move === 'shoot') return 'shoot'
  return 'idle'
}

export default function SheetSprite({ sheet, size, className = '' }) {
  const elRef = useRef(null)
  const [anim, setAnim] = useState('idle')
  const [dir, setDir] = useState('right')
  const [i, setI] = useState(0)

  useEffect(() => {
    const host = elRef.current?.parentElement
    if (!host) return
    const update = () => {
      setAnim((a) => {
        const n = sheet.anims[pick(host.dataset)] ? pick(host.dataset) : 'idle'
        return n === a ? a : n
      })
      setDir(host.dataset.dir === 'left' ? 'left' : 'right')
    }
    update()
    const mo = new MutationObserver(update)
    mo.observe(host, { attributes: true, attributeFilter: ['data-phase', 'data-vy', 'data-move', 'data-dir'] })
    return () => mo.disconnect()
  }, [sheet])

  useEffect(() => setI(0), [anim])
  useEffect(() => {
    const frames = sheet.anims[anim] || sheet.anims.idle
    const loop = sheet.loops?.[anim] ?? true
    const fps = sheet.fps?.[anim] || FPS
    const id = setInterval(
      () => setI((k) => (loop ? (k + 1) % frames.length : Math.min(k + 1, frames.length - 1))),
      1000 / fps
    )
    return () => clearInterval(id)
  }, [anim, sheet])

  const frames = sheet.anims[anim] || sheet.anims.idle
  const f = frames[Math.min(i, frames.length - 1)]
  const s0 = size / sheet.refH
  // the source sheets drew the action rows at a smaller scale than the
  // standing row; animScale brings every pose back to the same body size
  const s = s0 * (sheet.animScale?.[anim] || 1)
  // mirror only when showing the other way from how a clip is drawn:
  // nativeDir for the sheet, animDir per clip (standing faces left)
  const native = sheet.animDir?.[anim] || sheet.nativeDir || 'right'
  const flip = dir === native ? 1 : -1
  // where the web leaves the body, as a fraction of the frame
  const hand = sheet.hands?.[anim]
  // the layout box is the standing width at the base scale, so the
  // party row never reflows between poses; action frames overflow it
  const boxW = sheet.refW

  // Draw the frame at its final size with background-size instead of
  // scaling a full-size box with transform — no oversized layout box
  // for browsers to paint artefacts around.
  const hasAtlas = sheet.atlasW && sheet.atlasH
  const frameStyle = hasAtlas
    ? {
        width: f.w * s,
        height: f.h * s,
        backgroundImage: `url("${sheet.src}")`,
        backgroundSize: `${sheet.atlasW * s}px ${sheet.atlasH * s}px`,
        backgroundPosition: `-${f.x * s}px -${f.y * s}px`,
        transform: `translateX(-50%) scaleX(${flip})`,
      }
    : {
        width: f.w,
        height: f.h,
        backgroundImage: `url("${sheet.src}")`,
        backgroundPosition: `-${f.x}px -${f.y}px`,
        transform: `translateX(-50%) scale(${flip * s}, ${s})`,
      }

  return (
    <div
      ref={elRef}
      className={`sheet ${className}`}
      style={{ width: Math.round(boxW * s0), height: Math.round(size) }}
      data-anim={anim}
      data-arm={sheet.armDeg || ''}
    >
      <div className="sheet__frame" style={frameStyle}>
        {hand && <i className="sheet__hand" style={{ left: `${hand[0] * 100}%`, top: `${hand[1] * 100}%` }} />}
      </div>
    </div>
  )
}
