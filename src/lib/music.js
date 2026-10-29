import { useCallback, useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------
// Background music. Loops, fades in to a mild level, remembers mute.
// Browsers refuse audio before a user gesture, so start() is called
// from the character pick and re-armed on the next click/key if the
// browser said no.
// ---------------------------------------------------------------
export const MUSIC_SRC = '/audio/sunflower.m4a'
const KEY = 'spidy.muted'
const LEVEL = 0.15

function fade(audio, to, ms, done) {
  const from = audio.volume
  const t0 = Date.now()
  const id = setInterval(() => {
    const k = Math.min(1, (Date.now() - t0) / ms)
    audio.volume = from + (to - from) * k
    if (k >= 1) {
      clearInterval(id)
      done?.()
    }
  }, 50)
}

export function useMusic() {
  const ref = useRef(null)
  const [muted, setMuted] = useState(() => localStorage.getItem(KEY) === '1')
  const [playing, setPlaying] = useState(false)

  const get = () => {
    if (!ref.current) {
      const a = new Audio(MUSIC_SRC)
      a.loop = true
      a.preload = 'none' // nothing downloads until the first play
      a.volume = 0
      ref.current = a
    }
    return ref.current
  }

  const start = useCallback(() => {
    if (muted) return
    const a = get()
    if (!a.paused) return
    a.play()
      .then(() => {
        setPlaying(true)
        fade(a, LEVEL, 2500)
      })
      .catch(() => {
        /* blocked until a gesture — the arm effect below retries */
      })
  }, [muted])

  useEffect(() => {
    if (playing || muted) return
    const arm = () => start()
    window.addEventListener('pointerdown', arm)
    window.addEventListener('keydown', arm)
    return () => {
      window.removeEventListener('pointerdown', arm)
      window.removeEventListener('keydown', arm)
    }
  }, [playing, muted, start])

  const toggle = useCallback(() => {
    const a = get()
    const next = !muted
    localStorage.setItem(KEY, next ? '1' : '0')
    if (next) {
      fade(a, 0, 400, () => a.pause())
    } else {
      a.play()
        .then(() => {
          setPlaying(true)
          fade(a, LEVEL, 1200)
        })
        .catch(() => {})
    }
    setMuted(next)
  }, [muted])

  return { muted, playing, start, toggle }
}
