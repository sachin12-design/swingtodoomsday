import { useEffect, useRef, useState } from 'react'
import SpiderHero from './SpiderHero.jsx'
import SheetSprite from './SheetSprite.jsx'

// public/characters/<id>.sheet.json → frame data, or null when the
// character has no sheet. Cached per id across mounts.
const sheetCache = new Map()
if (import.meta.env.DEV) window.__sheetCache = sheetCache
function useSheet(id) {
  const [sheet, setSheet] = useState(sheetCache.has(id) ? sheetCache.get(id) : undefined)
  useEffect(() => {
    if (sheetCache.has(id)) {
      setSheet(sheetCache.get(id))
      return
    }
    let alive = true
    fetch(`/characters/${id}.sheet.json`)
      .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null))
      .then((j) => {
        sheetCache.set(id, j)
        if (alive) setSheet(j)
      })
      .catch(() => {
        sheetCache.set(id, null)
        if (alive) setSheet(null)
      })
    return () => {
      alive = false
    }
  }, [id])
  return sheet
}

// ---------------------------------------------------------------
// A character as a PNG cut-out: public/characters/<id>.png
// (your Figma exports). If the file is missing it falls back to the
// SVG rig automatically, so the page always has a hero on it.
//
// Motion is deliberately minimal for now — idle bob, talk wobble,
// celebrate hop — all 12fps. Walking/jumping between rooftops comes
// later, per plan.
// ---------------------------------------------------------------
export default function HeroSprite({
  character,
  size = 150, // rendered HEIGHT in px
  talking = false,
  reaction = null,
  speaker = false,
}) {
  const sheet = useSheet(character.id)
  const [failed, setFailed] = useState(false)
  // png first, webp second — both keep transparency
  const sources = [`/characters/${character.id}.png`, `/characters/${character.id}.webp`]
  const [srcIndex, setSrcIndex] = useState(0)
  const [oneShot, setOneShot] = useState(null)
  const firedAt = useRef(reaction?.at ?? 0)

  useEffect(() => {
    if (!reaction || reaction.at === firedAt.current) return
    firedAt.current = reaction.at
    setOneShot(reaction.type)
    const id = setTimeout(() => setOneShot(null), 950)
    return () => clearTimeout(id)
  }, [reaction])

  if (failed) {
    // SpiderHero's `size` is width; its aspect is 2.1 tall.
    return (
      <SpiderHero
        character={character}
        size={Math.round(size / 2.1)}
        talking={talking}
        reaction={reaction}
      />
    )
  }

  const classes = [
    'sprite',
    speaker && 'sprite--speaker',
    talking && 'sprite--talking',
    oneShot && `sprite--${oneShot}`,
  ]
    .filter(Boolean)
    .join(' ')

  // a real sprite sheet beats a single cut-out
  if (sheet) return <SheetSprite sheet={sheet} size={size} className={classes} />

  return (
    <img
      className={classes}
      src={sources[srcIndex]}
      alt={character.name}
      style={{ height: size }}
      draggable={false}
      onError={() => (srcIndex + 1 < sources.length ? setSrcIndex(srcIndex + 1) : setFailed(true))}
    />
  )
}
