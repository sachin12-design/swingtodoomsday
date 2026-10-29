import { useEffect, useState } from 'react'
import { DOOMSDAY } from '../config.js'

function diff(target) {
  const ms = target.getTime() - Date.now()
  if (ms <= 0) return null // Doomsday has landed
  const s = Math.floor(ms / 1000)
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  }
}

export default function DoomsdayClock() {
  const [t, setT] = useState(() => diff(DOOMSDAY))

  useEffect(() => {
    const id = setInterval(() => setT(diff(DOOMSDAY)), 1000)
    return () => clearInterval(id)
  }, [])

  // The clock never counts negative — it flips.
  if (!t) {
    return (
      <div className="clock">
        <span className="display chroma--heavy" style={{ fontSize: 26 }}>
          IT&apos;S HERE
        </span>
      </div>
    )
  }

  const units = [
    [t.d, 'DAYS'],
    [t.h, 'HRS'],
    [t.m, 'MIN'],
    [t.s, 'SEC'],
  ]

  return (
    <div className="clock">
      <div className="clock__label">
        Doomsday
        <br />
        in
      </div>
      <div className="clock__units">
        {units.map(([v, label]) => (
          <div className="clock__unit" key={label}>
            <div className="clock__num">{String(v).padStart(2, '0')}</div>
            <div className="clock__den">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
