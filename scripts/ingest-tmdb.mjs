#!/usr/bin/env node
// ---------------------------------------------------------------
// Posters, blurbs, ratings and where-to-watch for all 106 titles.
//
//   npm run ingest
//
// Needs VITE_TMDB_KEY (and optionally VITE_WATCH_REGION) in .env.local
// or the environment. Writes public/data/marvel.generated.json, which
// the hover cards read at runtime. Re-run whenever you like — OTT
// availability moves monthly.
// ---------------------------------------------------------------
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { TITLES } from '../src/data/marvel.js'

function env(name) {
  if (process.env[name]) return process.env[name]
  try {
    const file = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    const m = file.match(new RegExp(`^${name}=(.*)$`, 'm'))
    return m ? m[1].trim() : ''
  } catch {
    return ''
  }
}

const KEY = env('VITE_TMDB_KEY')
const REGION = (env('VITE_WATCH_REGION') || 'IN').toUpperCase()
if (!KEY) {
  console.error('No TMDB key. Add VITE_TMDB_KEY=... to .env.local — free at https://www.themoviedb.org/settings/api')
  process.exit(1)
}

const API = 'https://api.themoviedb.org/3'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function get(path, params = {}) {
  const url = new URL(API + path)
  url.searchParams.set('api_key', KEY)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url)
  if (res.status === 429) {
    await sleep(2500)
    return get(path, params)
  }
  if (!res.ok) throw new Error(`${res.status} on ${path}`)
  return res.json()
}

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

async function resolve(t) {
  const tv = t.type === 'series'
  const query = t.title.replace(/\*$/, '') // Thunderbolts*
  const kind = tv ? '/search/tv' : '/search/movie'
  const first = await get(kind, tv ? { query, first_air_date_year: t.year } : { query, year: t.year })
  let hit = first.results?.find((r) => norm(r.title || r.name) === norm(query)) || first.results?.[0]
  if (!hit) hit = (await get(kind, { query })).results?.[0]
  return hit
}

const out = { generatedAt: new Date().toISOString(), region: REGION, titles: {} }
let ok = 0

for (const t of TITLES) {
  try {
    const hit = await resolve(t)
    if (!hit) {
      console.warn('  ✗ no match:', t.title)
      continue
    }
    const kind = t.type === 'series' ? 'tv' : 'movie'
    const [details, wp] = await Promise.all([
      get(`/${kind}/${hit.id}`),
      get(`/${kind}/${hit.id}/watch/providers`),
    ])
    const here = wp.results?.[REGION] || {}
    const providers = [...(here.flatrate || []), ...(here.free || []), ...(here.ads || []), ...(here.rent || []), ...(here.buy || [])]
      .filter((p, i, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === i)
      .slice(0, 4)
      .map((p) => ({ name: p.provider_name, logo: p.logo_path }))

    out.titles[t.id] = {
      tmdbId: hit.id,
      title: hit.title || hit.name,
      poster: hit.poster_path,
      backdrop: hit.backdrop_path,
      overview: hit.overview,
      rating: hit.vote_average ? Math.round(hit.vote_average * 10) / 10 : null,
      runtime: details.runtime || details.episode_run_time?.[0] || null,
      seasons: details.number_of_seasons ?? null,
      providers,
      link: here.link || null, // JustWatch page for this title in your region
    }
    ok++
    console.log(`  ✓ ${t.title} (${t.year})${providers.length ? ' · ' + providers.map((p) => p.name).join(', ') : ''}`)
    await sleep(260) // stay well under TMDB's rate limit
  } catch (e) {
    console.warn('  ✗', t.title, '—', e.message)
  }
}

mkdirSync(new URL('../public/data/', import.meta.url), { recursive: true })
writeFileSync(new URL('../public/data/marvel.generated.json', import.meta.url), JSON.stringify(out, null, 2))
console.log(`\n${ok}/${TITLES.length} titles → public/data/marvel.generated.json (${REGION})`)
