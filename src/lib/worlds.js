import { TITLES, buildYears } from '../data/marvel.js'
import { ESSENTIAL_IDS } from '../data/essentials.js'

// ---------------------------------------------------------------
// TWO DIMENSIONS.
//   all  — the full city: every title, pink Gwen-dimension backdrop
//   core — the shortlist: only the ★ essentials, the neon-night city
// You start alone in `all`; the other Spider recruits you through a
// portal the first time you switch.
// ---------------------------------------------------------------
const ESS = new Set(ESSENTIAL_IDS)

export const WORLDS = {
  all: {
    id: 'all',
    name: 'the full city',
    chip: 'ALL 106',
    titles: TITLES,
  },
  core: {
    id: 'core',
    name: 'the shortlist',
    chip: '★ 15',
    titles: TITLES.filter((t) => ESS.has(t.id)),
  },
}
for (const w of Object.values(WORLDS)) w.years = buildYears(w.titles)

export const otherWorld = (id) => (id === 'all' ? 'core' : 'all')
