import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { CHARACTERS, STORAGE, guideFor } from './config.js'
import { TITLES } from './data/marvel.js'
import { buildTitleQuiz } from './lib/quiz.js'
import CharacterSelect from './components/CharacterSelect.jsx'
import DoomsdayClock from './components/DoomsdayClock.jsx'
import { useMusic } from './lib/music.js'
import Parallax from './components/Parallax.jsx'
import Skyline from './components/Skyline.jsx'
const QuizModal = lazy(() => import('./components/QuizModal.jsx'))
const FastTrack = lazy(() => import('./components/FastTrack.jsx'))
import Login from './components/Login.jsx'
const Onboarding = lazy(() => import('./components/Onboarding.jsx'))
import { useAuth } from './lib/auth.js'
import { ESSENTIAL_IDS, ESSENTIAL_ROWS } from './data/essentials.js'
import { otherWorld } from './lib/worlds.js'
import { BANTER, SOLO_IDLE, SOLO_TICK } from './data/banter.js'
import SpiderTracker from './components/SpiderTracker.jsx'

// localStorage is the whole "backend" for now. Swap these two helpers
// for Supabase later and nothing else changes.
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const HALF = Math.ceil(TITLES.length / 2)

// canon events done, counted in rows (Loki's two seasons = one row)
function countCanon(set) {
  const lokiDone = set.has('loki-s1') && set.has('loki-s2')
  const others = ESSENTIAL_IDS.filter((id) => !id.startsWith('loki-')).filter((id) => set.has(id)).length
  return others + (lokiDone ? 1 : 0)
}

export default function App() {
  const [characterId, setCharacterId] = useState(
    () => localStorage.getItem(STORAGE.character) || null
  )
  const [watched, setWatched] = useState(() => new Set(load(STORAGE.watched, [])))
  const [scores, setScores] = useState(() => load(STORAGE.scores, {}))
  const [line, setLine] = useState(null)
  const [reaction, setReaction] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [fastTrack, setFastTrack] = useState(false)
  const jumpToYear = useRef(null)
  // dimensions: solo start in the full city; the partner joins by portal
  const [world, setWorld] = useState(() => (localStorage.getItem('spidy.world') === 'core' ? 'core' : 'all'))
  const [partnerJoined, setPartnerJoined] = useState(() => localStorage.getItem('spidy.partner') === '1')
  const [entry, setEntry] = useState(null) // { year } → next Skyline arrives by portal
  const [switching, setSwitching] = useState(false)
  const worldFxRef = useRef(null)
  const firstTrip = useRef(false) // the trip right after the partner first shows up

  const character = characterId ? CHARACTERS[characterId] : null
  const guide = character ? guideFor(character.id) : null
  const banter = guide ? BANTER[guide.id] : null
  const music = useMusic()
  const auth = useAuth()
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('spidy.onboarded') === '1')

  useEffect(() => {
    localStorage.setItem(STORAGE.watched, JSON.stringify([...watched]))
  }, [watched])

  useEffect(() => {
    localStorage.setItem(STORAGE.scores, JSON.stringify(scores))
  }, [scores])

  // --- the one mouth. Everything spoken goes through speak(). -----
  const lastLineAt = useRef(0)
  function speak(text, who) {
    lastLineAt.current = Date.now()
    // the guide is only on screen in the canon dimension; everywhere
    // else unattributed lines sit over you (self-talk / radio)
    setLine({ who: who || (world === 'core' ? 'leader' : 'follower'), text })
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const say = (text, who, ms = 2200) => {
    speak(text, who)
    return sleep(ms)
  }

  // Ambient chatter: when nobody has said anything for a while, the
  // guide (or your own HUD voice, pre-summon) drops an idle quip.
  const switchingRef = useRef(false)
  switchingRef.current = switching
  useEffect(() => {
    if (!character) return
    const idles = () => (world === 'core' ? banter.idle : SOLO_IDLE)
    if (!lastLineAt.current) speak(pick(idles()))
    const iv = setInterval(() => {
      if (switchingRef.current) return
      if (Date.now() - lastLineAt.current > 24000) speak(pick(idles()))
    }, 9000)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId, world])

  function pickCharacter(id) {
    localStorage.setItem(STORAGE.character, id)
    setCharacterId(id)
    lastLineAt.current = Date.now()
    setLine({ who: 'follower', text: guideFor(id).voice.pick(CHARACTERS[id].name.split(' ')[0]) })
    music.start() // the pick is the user gesture browsers need for audio
  }

  // Pure checklist: tick, untick, nothing blocks.
  // Functional update — a row like Loki sets two ids in one handler,
  // and a closure-read Set would drop the first.
  function setWatchedFor(ids, on) {
    setWatched((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (on) next.add(id)
        else next.delete(id)
      }
      return next
    })
    const t = TITLES.find((x) => x.id === ids[0])
    if (on) {
      setReaction({ type: 'celebrate', at: Date.now() })
      const next = new Set(watched)
      for (const id of ids) next.add(id)
      if (world !== 'core') {
        speak(pick(SOLO_TICK(t.title)))
      } else if (next.size === TITLES.length) {
        speak(banter.milestone.all)
      } else if (countCanon(next) === ESSENTIAL_ROWS && countCanon(watched) < ESSENTIAL_ROWS) {
        speak(banter.milestone.canon)
      } else if (next.size >= HALF && watched.size < HALF) {
        speak(banter.milestone.half)
      } else {
        speak(pick(banter.tick(t.title)))
      }
    } else {
      speak(`Unticked ${t.title}. No judgement.`)
    }
  }

  function toggleWatched(id) {
    setWatchedFor([id], !watched.has(id))
  }

  // Optional — the "?" on a lit floor.
  function openQuiz(id) {
    const t = TITLES.find((x) => x.id === id)
    const questions = buildTitleQuiz(id, watched)
    if (!questions.length) {
      speak(`Nothing I can ask about ${t.title} without spoiling something.`)
      return
    }
    setQuiz({ id, title: t.title, questions })
  }

  function finishQuiz(score, total) {
    setScores((s) => ({ ...s, [quiz.id]: { score, total } }))
    setQuiz(null)
    const pct = score / total
    speak(
      pct === 1 ? 'Perfect run. Show off.'
      : pct >= 0.6 ? `${score} out of ${total}. Respectable.`
      : `${score} out of ${total}. We'll let that slide.`
    )
    if (pct >= 0.6) setReaction({ type: 'celebrate', at: Date.now() })
  }

  // An occasional remark when a jump or swing sticks the landing.
  const lastQuipAt = useRef(0)
  function handleLand() {
    if (world !== 'core' || switchingRef.current) return
    const now = Date.now()
    if (now - lastQuipAt.current < 18000 || Math.random() > 0.38) return
    lastQuipAt.current = now
    speak(pick(banter.land), 'leader')
  }

  // The dimension switch: first time recruits the partner (portal in,
  // a short back-and-forth), then both dive through a portal; the new
  // world mounts and drops them out above the matching year.
  async function toggleWorld() {
    const fx = worldFxRef.current
    if (!fx || switching) return
    if (!fx.ready()) {
      speak('Hold on — mid-swing.')
      return
    }
    setSwitching(true)
    const next = otherWorld(world)
    if (!partnerJoined && next === 'core') {
      const ok = await fx.summonPartner()
      if (!ok) {
        setSwitching(false)
        return
      }
      for (const ln of banter.summon()) {
        await say(ln.text, ln.who, ln.ms)
      }
      localStorage.setItem('spidy.partner', '1')
      setPartnerJoined(true)
      firstTrip.current = true
      await sleep(180)
      const year = fx.currentYear()
      await fx.pullThrough() // grabbed straight into the summon portal
      setEntry({ year })
      localStorage.setItem('spidy.world', next)
      setWorld(next)
      return
    } else if (next === 'core') {
      await say(banter.portal.toCore, 'follower', 1700) // radio ping
    } else {
      await say(banter.portal.toAll, 'leader', 1400)
    }
    const year = fx.currentYear()
    await fx.exitPortal()
    setEntry({ year })
    localStorage.setItem('spidy.world', next)
    setWorld(next)
  }

  function handleEntered() {
    if (world === 'core') speak(firstTrip.current ? banter.arrive.first : banter.arrive.core, 'leader')
    else speak(banter.arrive.all, 'follower') // the guide stayed behind
    firstTrip.current = false
    setSwitching(false)
  }

  const pct = useMemo(
    () => Math.round((watched.size / TITLES.length) * 100),
    [watched]
  )
  const essDone = useMemo(() => countCanon(watched), [watched])

  if (auth.status === 'loading') return <div className="app" />
  if (auth.status === 'signedout') return <Login auth={auth} />
  if (!character) return <CharacterSelect onPick={pickCharacter} />

  return (
    <div className={`app grain ${world === 'all' ? 'app--pink' : ''}`}>
      <Parallax world={world} />

      <header className="topbar">
        <h1 className="display brand chroma">Swing to Doomsday</h1>
        <div className="fastwrap">
          <button className="fastlist" onClick={() => setFastTrack(true)} title="All 15 canon events, with streaming links">
            ▤
          </button>
        </div>

        <div className="progress" title={`${pct}% of the city lit`}>
          <span className="progress__label">
            {watched.size} / {TITLES.length} LIT
          </span>
          <div className="progress__bar">
            <div className="progress__fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button
          className="acct"
          onClick={auth.signOut}
          title={auth.user?.email ? `Signed in as ${auth.user.email} — sign out` : 'Guest mode — sign out'}
        >
          {auth.user?.email ? auth.user.email[0].toUpperCase() : 'G'}
        </button>
        <button
          className="mute"
          onClick={music.toggle}
          aria-pressed={music.muted}
          title={music.muted ? 'Music off' : 'Music on'}
        >
          {music.muted ? '🔇' : '🔊'}
        </button>
        <DoomsdayClock />
      </header>

      <Skyline
        key={world}
        world={world}
        solo={world !== 'core'}
        entrance={entry ? 'portal' : null}
        entryYear={entry?.year ?? null}
        onEntered={handleEntered}
        onLand={handleLand}
        worldFxRef={worldFxRef}
        watched={watched}
        scores={scores}
        onToggle={toggleWatched}
        onQuiz={openQuiz}
        jumpToYear={jumpToYear}
        character={character}
        line={line}
        reaction={reaction}
      />

      <SpiderTracker
        on={world === 'core'}
        busy={switching}
        met={partnerJoined}
        done={essDone}
        total={ESSENTIAL_ROWS}
        onToggle={toggleWorld}
      />

      {fastTrack && (
        <Suspense fallback={null}>
        <FastTrack
          watched={watched}
          onSetWatched={setWatchedFor}
          onGoToYear={(y) => {
            setFastTrack(false)
            jumpToYear.current?.(y)
          }}
          onClose={() => setFastTrack(false)}
        />
        </Suspense>
      )}

      {!onboarded && (
        <Suspense fallback={null}>
        <Onboarding
          onDone={() => {
            localStorage.setItem('spidy.onboarded', '1')
            setOnboarded(true)
          }}
        />
        </Suspense>
      )}

      {quiz && (
        <Suspense fallback={null}>
        <QuizModal
          kicker="Checkpoint"
          title={quiz.title}
          questions={quiz.questions}
          onAnswer={(right) => right && setReaction({ type: 'celebrate', at: Date.now() })}
          onComplete={finishQuiz}
        />
        </Suspense>
      )}
    </div>
  )
}
