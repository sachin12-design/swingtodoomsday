import { useEffect, useRef } from 'react'
import {
  useRive,
  useStateMachineInput,
  Layout,
  Fit,
  Alignment,
} from '@rive-app/react-canvas'
import { HERO_ASPECT } from './HeroPlaceholder.jsx'

// Lazily loaded: the Rive runtime (~250KB) only downloads when a real
// .riv file exists at public/characters/<id>.riv. See SpiderHero.jsx
// for the contract.
const STATE_MACHINE = 'HeroSM'

export default function RiveHero({ src, size, className, talking, reaction, onFail }) {
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter }),
    onLoadError: onFail,
  })

  const talk = useStateMachineInput(rive, STATE_MACHINE, 'talk')
  const celebrate = useStateMachineInput(rive, STATE_MACHINE, 'celebrate')
  const point = useStateMachineInput(rive, STATE_MACHINE, 'point')
  const lookX = useStateMachineInput(rive, STATE_MACHINE, 'lookX')
  const lookY = useStateMachineInput(rive, STATE_MACHINE, 'lookY')

  // speech bubble open/close → talk loop
  useEffect(() => {
    if (talk) talk.value = !!talking
  }, [talk, talking])

  // one-shot reactions: { type: 'celebrate' | 'point', at: timestamp }
  const firedAt = useRef(reaction?.at ?? 0)
  useEffect(() => {
    if (!reaction || reaction.at === firedAt.current) return
    const input = { celebrate, point }[reaction.type]
    if (input) {
      input.fire()
      firedAt.current = reaction.at
    }
  }, [reaction, celebrate, point])

  // optional cursor-follow — only wired if the rig has the inputs
  useEffect(() => {
    if (!lookX && !lookY) return
    const onMove = (e) => {
      if (lookX) lookX.value = (e.clientX / window.innerWidth) * 100
      if (lookY) lookY.value = (e.clientY / window.innerHeight) * 100
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [lookX, lookY])

  return (
    <div className={className} style={{ width: size, height: size * HERO_ASPECT }}>
      <RiveComponent />
    </div>
  )
}
