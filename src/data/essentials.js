// ---------------------------------------------------------------
// THE FAST TRACK — the mandatory watchlist before Avengers: Doomsday,
// with India (IN) streaming links.
//
// 15 entries on the list → 16 title ids, because Loki counts both
// seasons. Keys must match ids in marvel.js (verified by the test in
// the console: every key resolves).
//
// Where the source list gave only the JioHotstar homepage, we use a
// JioHotstar *search* link for the exact title instead — a homepage
// link is a dead end, a search lands you on the title. Direct links
// are kept verbatim where they were given.
// ---------------------------------------------------------------

const JH = 'https://www.hotstar.com/in'
const search = (q) => `${JH}/search?q=${encodeURIComponent(q)}`
const hotstar = (url) => ({ name: 'JioHotstar', url })
const sonyliv = (q) => ({ name: 'Sony LIV', url: `https://www.sonyliv.com/search?searchTerm=${encodeURIComponent(q)}` })

export const ESSENTIALS = {
  'x-men':                    [hotstar(`${JH}/movies/xmen/1770000943`)],
  x2:                         [hotstar(`${JH}/movies/x2`)],
  'cap-first-avenger':        [hotstar(`${JH}/movies/captain-america-the-first-avenger`)],
  avengers:                   [hotstar(`${JH}/movies/the-avengers`)],
  'infinity-war':             [hotstar(`${JH}/movies/avengers-infinity-war`)],
  endgame:                    [hotstar(`${JH}/movies/avengers-endgame`)],
  'loki-s1':                  [hotstar(`${JH}/tv/loki`)],
  'loki-s2':                  [hotstar(`${JH}/tv/loki`)],
  'shang-chi':                [hotstar(`${JH}/movies/shang-chi-and-the-legend-of-the-ten-rings/1260072682`)],
  'no-way-home':              [hotstar(search('Spider-Man No Way Home')), sonyliv('Spider-Man No Way Home')],
  'multiverse-of-madness':    [hotstar(`${JH}/movies/doctor-strange-in-the-multiverse-of-madness`)],
  'wakanda-forever':          [hotstar(`${JH}/movies/black-panther-wakanda-forever/1260118821`)],
  'deadpool-and-wolverine':   [hotstar(search('Deadpool & Wolverine'))],
  'brave-new-world':          [hotstar(search('Captain America Brave New World'))],
  thunderbolts:               [hotstar(search('Thunderbolts'))],
  'fantastic-four-first-steps': [hotstar(search('The Fantastic Four First Steps'))],
}

export const ESSENTIAL_IDS = Object.keys(ESSENTIALS)
export const isEssential = (id) => id in ESSENTIALS
export const providersFor = (id) => ESSENTIALS[id] || null

// Loki's two seasons are one row on the source list.
export const ESSENTIAL_ROWS = 15

export const FAST_TRACK_NOTE =
  'One JioHotstar subscription covers every title here except Spider-Man: No Way Home, which is also on Sony LIV. Most are available in English, Hindi, Tamil and Telugu.'
