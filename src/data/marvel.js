// ---------------------------------------------------------------
// THE FULL MARVEL CHECKLIST — 106 titles, 2000 → 2026.
// Films and series, every studio. One entry per title, in release
// order (which is also what the spoiler gating in lib/quiz.js uses).
//
//   type:     'film' | 'series'
//   universe: 'mcu' | 'fox' | 'sony' | 'netflix' | 'tv' | 'other'
//
// IDs are stable — quizzes.js keys off them. Don't rename the MCU
// ones (iron-man, thor, avengers…) or the quiz bank detaches.
// ---------------------------------------------------------------

export const ERAS = [
  { id: 'pre',        name: 'Before the MCU',      from: 2000, to: 2007 },
  { id: 'infinity',   name: 'The Infinity Saga',   from: 2008, to: 2019 },
  { id: 'multiverse', name: 'The Multiverse Saga', from: 2020, to: 2026 },
]

export function eraOf(year) {
  return ERAS.find((e) => year >= e.from && year <= e.to)?.id ?? 'pre'
}

const F = 'film', S = 'series'

export const TITLES = [
  // 2000
  { id: 'x-men',                       title: 'X-Men',                                        year: 2000, type: F, universe: 'fox' },
  // 2002
  { id: 'blade-2',                     title: 'Blade II',                                     year: 2002, type: F, universe: 'other' },
  { id: 'spider-man',                  title: 'Spider-Man',                                   year: 2002, type: F, universe: 'sony' },
  // 2003
  { id: 'daredevil-2003',              title: 'Daredevil',                                    year: 2003, type: F, universe: 'fox' },
  { id: 'x2',                          title: 'X2: X-Men United',                             year: 2003, type: F, universe: 'fox' },
  { id: 'hulk-2003',                   title: 'Hulk',                                         year: 2003, type: F, universe: 'other' },
  // 2004
  { id: 'punisher-2004',               title: 'The Punisher',                                 year: 2004, type: F, universe: 'other' },
  { id: 'spider-man-2',                title: 'Spider-Man 2',                                 year: 2004, type: F, universe: 'sony' },
  { id: 'blade-trinity',               title: 'Blade: Trinity',                               year: 2004, type: F, universe: 'other' },
  // 2005
  { id: 'elektra',                     title: 'Elektra',                                      year: 2005, type: F, universe: 'fox' },
  { id: 'fantastic-four-2005',         title: 'Fantastic Four',                               year: 2005, type: F, universe: 'fox' },
  // 2006
  { id: 'x-men-last-stand',            title: 'X-Men: The Last Stand',                        year: 2006, type: F, universe: 'fox' },
  { id: 'blade-series',                title: 'Blade: The Series',                            year: 2006, type: S, universe: 'tv' },
  // 2007
  { id: 'ghost-rider',                 title: 'Ghost Rider',                                  year: 2007, type: F, universe: 'sony' },
  { id: 'spider-man-3',                title: 'Spider-Man 3',                                 year: 2007, type: F, universe: 'sony' },
  { id: 'fantastic-four-silver-surfer', title: 'Fantastic Four: Rise of the Silver Surfer',   year: 2007, type: F, universe: 'fox' },
  // 2008
  { id: 'iron-man',                    title: 'Iron Man',                                     year: 2008, type: F, universe: 'mcu' },
  { id: 'incredible-hulk',             title: 'The Incredible Hulk',                          year: 2008, type: F, universe: 'mcu' },
  { id: 'punisher-war-zone',           title: 'Punisher: War Zone',                           year: 2008, type: F, universe: 'other' },
  // 2009
  { id: 'x-men-origins-wolverine',     title: 'X-Men Origins: Wolverine',                     year: 2009, type: F, universe: 'fox' },
  // 2010
  { id: 'iron-man-2',                  title: 'Iron Man 2',                                   year: 2010, type: F, universe: 'mcu' },
  // 2011
  { id: 'thor',                        title: 'Thor',                                         year: 2011, type: F, universe: 'mcu' },
  { id: 'x-men-first-class',           title: 'X-Men: First Class',                           year: 2011, type: F, universe: 'fox' },
  { id: 'cap-first-avenger',           title: 'Captain America: The First Avenger',           year: 2011, type: F, universe: 'mcu' },
  { id: 'ghost-rider-2',               title: 'Ghost Rider: Spirit of Vengeance',             year: 2011, type: F, universe: 'sony' },
  // 2012
  { id: 'avengers',                    title: 'The Avengers',                                 year: 2012, type: F, universe: 'mcu' },
  { id: 'amazing-spider-man',          title: 'The Amazing Spider-Man',                       year: 2012, type: F, universe: 'sony' },
  // 2013
  { id: 'iron-man-3',                  title: 'Iron Man 3',                                   year: 2013, type: F, universe: 'mcu' },
  { id: 'the-wolverine',               title: 'The Wolverine',                                year: 2013, type: F, universe: 'fox' },
  { id: 'thor-dark-world',             title: 'Thor: The Dark World',                         year: 2013, type: F, universe: 'mcu' },
  { id: 'agents-of-shield',            title: 'Agents of S.H.I.E.L.D.',                       year: 2013, type: S, universe: 'mcu', span: '2013–2020' },
  // 2014
  { id: 'cap-winter-soldier',          title: 'Captain America: The Winter Soldier',          year: 2014, type: F, universe: 'mcu' },
  { id: 'amazing-spider-man-2',        title: 'The Amazing Spider-Man 2',                     year: 2014, type: F, universe: 'sony' },
  { id: 'x-men-days-of-future-past',   title: 'X-Men: Days of Future Past',                   year: 2014, type: F, universe: 'fox' },
  { id: 'guardians',                   title: 'Guardians of the Galaxy',                      year: 2014, type: F, universe: 'mcu' },
  // 2015
  { id: 'age-of-ultron',               title: 'Avengers: Age of Ultron',                      year: 2015, type: F, universe: 'mcu' },
  { id: 'ant-man',                     title: 'Ant-Man',                                      year: 2015, type: F, universe: 'mcu' },
  { id: 'fantastic-four-2015',         title: 'Fantastic Four',                               year: 2015, type: F, universe: 'fox', note: 'reboot' },
  { id: 'agent-carter',                title: 'Agent Carter',                                 year: 2015, type: S, universe: 'mcu', span: '2015–2016' },
  { id: 'daredevil',                   title: 'Daredevil',                                    year: 2015, type: S, universe: 'netflix', span: '2015–2018' },
  { id: 'jessica-jones',               title: 'Jessica Jones',                                year: 2015, type: S, universe: 'netflix', span: '2015–2019' },
  // 2016
  { id: 'deadpool',                    title: 'Deadpool',                                     year: 2016, type: F, universe: 'fox' },
  { id: 'civil-war',                   title: 'Captain America: Civil War',                   year: 2016, type: F, universe: 'mcu' },
  { id: 'x-men-apocalypse',            title: 'X-Men: Apocalypse',                            year: 2016, type: F, universe: 'fox' },
  { id: 'doctor-strange',              title: 'Doctor Strange',                               year: 2016, type: F, universe: 'mcu' },
  { id: 'luke-cage',                   title: 'Luke Cage',                                    year: 2016, type: S, universe: 'netflix', span: '2016–2018' },
  // 2017
  { id: 'guardians-2',                 title: 'Guardians of the Galaxy Vol. 2',               year: 2017, type: F, universe: 'mcu' },
  { id: 'spider-man-homecoming',       title: 'Spider-Man: Homecoming',                       year: 2017, type: F, universe: 'mcu' },
  { id: 'logan',                       title: 'Logan',                                        year: 2017, type: F, universe: 'fox' },
  { id: 'thor-ragnarok',               title: 'Thor: Ragnarok',                               year: 2017, type: F, universe: 'mcu' },
  { id: 'iron-fist',                   title: 'Iron Fist',                                    year: 2017, type: S, universe: 'netflix', span: '2017–2018' },
  { id: 'the-defenders',               title: 'The Defenders',                                year: 2017, type: S, universe: 'netflix' },
  { id: 'inhumans',                    title: 'Inhumans',                                     year: 2017, type: S, universe: 'mcu' },
  { id: 'the-punisher-series',         title: 'The Punisher',                                 year: 2017, type: S, universe: 'netflix', span: '2017–2019' },
  { id: 'runaways',                    title: 'Runaways',                                     year: 2017, type: S, universe: 'tv', span: '2017–2019' },
  { id: 'legion',                      title: 'Legion',                                       year: 2017, type: S, universe: 'fox', span: '2017–2019' },
  { id: 'the-gifted',                  title: 'The Gifted',                                   year: 2017, type: S, universe: 'fox', span: '2017–2019' },
  // 2018
  { id: 'black-panther',               title: 'Black Panther',                                year: 2018, type: F, universe: 'mcu' },
  { id: 'infinity-war',                title: 'Avengers: Infinity War',                       year: 2018, type: F, universe: 'mcu' },
  { id: 'deadpool-2',                  title: 'Deadpool 2',                                   year: 2018, type: F, universe: 'fox' },
  { id: 'ant-man-and-the-wasp',        title: 'Ant-Man and the Wasp',                         year: 2018, type: F, universe: 'mcu' },
  { id: 'venom',                       title: 'Venom',                                        year: 2018, type: F, universe: 'sony' },
  { id: 'cloak-and-dagger',            title: 'Cloak & Dagger',                               year: 2018, type: S, universe: 'tv', span: '2018–2019' },
  // 2019
  { id: 'captain-marvel',              title: 'Captain Marvel',                               year: 2019, type: F, universe: 'mcu' },
  { id: 'endgame',                     title: 'Avengers: Endgame',                            year: 2019, type: F, universe: 'mcu' },
  { id: 'dark-phoenix',                title: 'Dark Phoenix',                                 year: 2019, type: F, universe: 'fox' },
  { id: 'far-from-home',               title: 'Spider-Man: Far From Home',                    year: 2019, type: F, universe: 'mcu' },
  // 2020
  { id: 'new-mutants',                 title: 'The New Mutants',                              year: 2020, type: F, universe: 'fox' },
  { id: 'helstrom',                    title: 'Helstrom',                                     year: 2020, type: S, universe: 'tv' },
  // 2021
  { id: 'black-widow',                 title: 'Black Widow',                                  year: 2021, type: F, universe: 'mcu' },
  { id: 'shang-chi',                   title: 'Shang-Chi and the Legend of the Ten Rings',    year: 2021, type: F, universe: 'mcu' },
  { id: 'eternals',                    title: 'Eternals',                                     year: 2021, type: F, universe: 'mcu' },
  { id: 'no-way-home',                 title: 'Spider-Man: No Way Home',                      year: 2021, type: F, universe: 'mcu' },
  { id: 'venom-2',                     title: 'Venom: Let There Be Carnage',                  year: 2021, type: F, universe: 'sony' },
  { id: 'wandavision',                 title: 'WandaVision',                                  year: 2021, type: S, universe: 'mcu' },
  { id: 'falcon-winter-soldier',       title: 'The Falcon and the Winter Soldier',            year: 2021, type: S, universe: 'mcu' },
  { id: 'loki-s1',                     title: 'Loki',                                         year: 2021, type: S, universe: 'mcu', span: 'Season 1' },
  { id: 'hawkeye',                     title: 'Hawkeye',                                      year: 2021, type: S, universe: 'mcu' },
  // 2022
  { id: 'multiverse-of-madness',       title: 'Doctor Strange in the Multiverse of Madness',  year: 2022, type: F, universe: 'mcu' },
  { id: 'love-and-thunder',            title: 'Thor: Love and Thunder',                       year: 2022, type: F, universe: 'mcu' },
  { id: 'wakanda-forever',             title: 'Black Panther: Wakanda Forever',               year: 2022, type: F, universe: 'mcu' },
  { id: 'morbius',                     title: 'Morbius',                                      year: 2022, type: F, universe: 'sony' },
  { id: 'moon-knight',                 title: 'Moon Knight',                                  year: 2022, type: S, universe: 'mcu' },
  { id: 'ms-marvel',                   title: 'Ms. Marvel',                                   year: 2022, type: S, universe: 'mcu' },
  { id: 'she-hulk',                    title: 'She-Hulk: Attorney at Law',                    year: 2022, type: S, universe: 'mcu' },
  // 2023
  { id: 'quantumania',                 title: 'Ant-Man and the Wasp: Quantumania',            year: 2023, type: F, universe: 'mcu' },
  { id: 'guardians-3',                 title: 'Guardians of the Galaxy Vol. 3',               year: 2023, type: F, universe: 'mcu' },
  { id: 'the-marvels',                 title: 'The Marvels',                                  year: 2023, type: F, universe: 'mcu' },
  { id: 'secret-invasion',             title: 'Secret Invasion',                              year: 2023, type: S, universe: 'mcu' },
  { id: 'loki-s2',                     title: 'Loki',                                         year: 2023, type: S, universe: 'mcu', span: 'Season 2' },
  // 2024
  { id: 'madame-web',                  title: 'Madame Web',                                   year: 2024, type: F, universe: 'sony' },
  { id: 'deadpool-and-wolverine',      title: 'Deadpool & Wolverine',                         year: 2024, type: F, universe: 'mcu' },
  { id: 'venom-3',                     title: 'Venom: The Last Dance',                        year: 2024, type: F, universe: 'sony' },
  { id: 'kraven',                      title: 'Kraven the Hunter',                            year: 2024, type: F, universe: 'sony' },
  { id: 'echo',                        title: 'Echo',                                         year: 2024, type: S, universe: 'mcu' },
  { id: 'agatha-all-along',            title: 'Agatha All Along',                             year: 2024, type: S, universe: 'mcu' },
  // 2025
  { id: 'brave-new-world',             title: 'Captain America: Brave New World',             year: 2025, type: F, universe: 'mcu' },
  { id: 'thunderbolts',                title: 'Thunderbolts*',                                year: 2025, type: F, universe: 'mcu' },
  { id: 'fantastic-four-first-steps',  title: 'The Fantastic Four: First Steps',              year: 2025, type: F, universe: 'mcu' },
  { id: 'daredevil-born-again-s1',     title: 'Daredevil: Born Again',                        year: 2025, type: S, universe: 'mcu', span: 'Season 1' },
  { id: 'ironheart',                   title: 'Ironheart',                                    year: 2025, type: S, universe: 'mcu' },
  // 2026
  { id: 'spider-man-brand-new-day',    title: 'Spider-Man: Brand New Day',                    year: 2026, type: F, universe: 'mcu' },
  { id: 'avengers-doomsday',           title: 'Avengers: Doomsday',                           year: 2026, type: F, universe: 'mcu' },
  { id: 'daredevil-born-again-s2',     title: 'Daredevil: Born Again',                        year: 2026, type: S, universe: 'mcu', span: 'Season 2' },
  { id: 'wonder-man',                  title: 'Wonder Man',                                   year: 2026, type: S, universe: 'mcu' },
  { id: 'visionquest',                 title: 'VisionQuest',                                  year: 2026, type: S, universe: 'mcu' },
]

// Titles grouped by year, in order. One entry per building.
// Worlds filter the title list, so the grouping is a function.
export function buildYears(titles) {
  const map = new Map()
  for (const t of titles) {
    if (!map.has(t.year)) map.set(t.year, [])
    map.get(t.year).push(t)
  }
  return [...map.entries()].map(([year, titles]) => ({
    year,
    titles,
    era: eraOf(year),
  }))
}
export const YEARS = buildYears(TITLES)
