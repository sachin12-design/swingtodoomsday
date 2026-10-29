import { TITLES } from '../data/marvel.js'
import { TITLE_QUIZZES } from '../data/quizzes.js'

// Release order = position in TITLES. Used for spoiler gating.
const ORDER = new Map(TITLES.map((t, i) => [t.id, i]))

// How far into the timeline has this user actually got?
export function watchFrontier(watched) {
  let max = -1
  for (const id of watched) {
    const i = ORDER.get(id)
    if (i !== undefined && i > max) max = i
  }
  return max
}

// A question is safe only if the user has already reached the title
// it could spoil. Untagged questions are treated as always safe.
export function isSpoilerSafe(question, frontier) {
  if (!question.spoilerUpTo) return true
  const need = ORDER.get(question.spoilerUpTo)
  if (need === undefined) return true
  return need <= frontier
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Up to 5 spoiler-safe questions for a single title.
export function buildTitleQuiz(titleId, watched) {
  const pool = TITLE_QUIZZES[titleId] || []
  const frontier = watchFrontier(watched)
  return shuffle(pool.filter((q) => isSpoilerSafe(q, frontier))).slice(0, 5)
}

export function hasQuiz(titleId) {
  return (TITLE_QUIZZES[titleId] || []).length > 0
}
