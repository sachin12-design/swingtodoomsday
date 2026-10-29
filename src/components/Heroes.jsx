import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import HeroSprite from './HeroSprite.jsx'

// The pair on the roof. The group's transform is the roof point (set
// by Skyline's flight loop); each hero has a wrapper the loop leans
// and squashes during a jump.
//
//   leader   — your GUIDE: the Spider you didn't pick. Jumps first.
//   follower — you. Trails a beat behind.
//
// `line` is a string or { who: 'leader'|'follower', text } — the
// bubble's tail and the talking animation follow the speaker.
const Heroes = forwardRef(function Heroes(
  { leader, follower, size, line, reaction, leaderRef, followerRef, solo = false, stamp, low = false },
  ref
) {
  const text = typeof line === 'string' ? line : line?.text
  // every spoken line carries its speaker; the summon cutscene runs
  // while `solo` is still set, so trust `who`, not the mode
  const who = (typeof line === 'object' && line?.who) || 'leader'
  const youSpeak = who === 'follower'

  // the tracker sticker floats over the play area: slide the bubble
  // left of it rather than under it
  const bubbleRef = useRef(null)
  useLayoutEffect(() => {
    const b = bubbleRef.current
    if (!b) return
    b.style.translate = ''
    const t = document.querySelector('.tracker')
    if (!t) return
    const br = b.getBoundingClientRect()
    const tr = t.getBoundingClientRect()
    const hit = br.right > tr.left - 10 && br.left < tr.right && br.bottom > tr.top && br.top < tr.bottom + 10
    if (hit) b.style.translate = `${Math.round(tr.left - 14 - br.right)}px 0`
  }, [text, stamp])

  const [talking, setTalking] = useState(false)
  useEffect(() => {
    if (!text) return
    setTalking(true)
    const id = setTimeout(() => setTalking(false), 3000)
    return () => clearTimeout(id)
  }, [text])

  return (
    <div className={`heroes ${solo ? 'heroes--solo' : ''} ${low ? 'heroes--low' : ''}`} ref={ref} style={{ '--hero-h': `${size}px` }}>
      {text && <div ref={bubbleRef} className={`bubble heroes__bubble ${youSpeak ? 'bubble--you' : ''}`}>{text}</div>}
      <div className="party">
        <div className="hero-wrap hero-wrap--follower" ref={followerRef}>
          <HeroSprite character={follower} size={Math.round(size * 0.97)} talking={talking && youSpeak} reaction={reaction} speaker={solo} />
        </div>
        <div className="hero-wrap hero-wrap--leader" ref={leaderRef}>
          <HeroSprite character={leader} size={size} talking={talking && !youSpeak} reaction={reaction} speaker />
        </div>
      </div>
    </div>
  )
})

export default Heroes
