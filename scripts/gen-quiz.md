# Extending the question bank

80 questions ship today, covering the 12 seeded titles plus the
Phase 1 and Phase 2 exams. Once `ingest-tmdb.mjs` expands `TITLES`
to the full ~50, you need roughly 230 more.

**Generate them offline into the file. Never call an LLM at runtime** —
you'd pay per user, add latency, and ship hallucinated wrong answers
nobody reviewed.

## The prompt

Paste this into Claude, one title at a time (batching more than ~4
titles per call makes accuracy drop):

```
Write 5 multiple-choice questions about the MCU film "<TITLE>" (<YEAR>).

Rules:
- 4 options each, exactly one unambiguously correct
- Only well-established central plot points — no deep trivia,
  no production facts, no post-credits unless famous
- Wrong options must be plausible (other MCU characters/objects),
  never obviously silly
- Mix: 3 easy, 2 medium
- Nothing that reveals events from any LATER film

Return ONLY a JavaScript array in exactly this shape:

  { q: '...',
    options: ['...', '...', '...', '...'],
    answer: 0,
    difficulty: 'easy',
    spoilerUpTo: '<title-id>' },

where answer is the 0-based index of the correct option and
spoilerUpTo is '<title-id>'.
```

Paste the result into `TITLE_QUIZZES` in `src/data/quizzes.js`.

## Phase exams

Same, but ask for 10 cross-cutting questions spanning the whole
phase, and set `spoilerUpTo` to the **last** title in that phase.

## ⚠️ Spot-check before shipping

Read every generated question. LLMs invent MCU trivia with total
confidence — wrong answer keys are the one bug your users will
definitely notice. Budget 20 minutes per 50 questions.

## How spoiler gating works

`src/lib/quiz.js` ranks titles by their position in `TITLES`
(release order). A question only appears once the user has marked
`spoilerUpTo` — or anything later — as watched. So a Phase 1 quiz
can never spoil Endgame for someone who just started.

Tag honestly and the system handles the rest.
