import { useEffect, useState } from 'react'

// ---------------------------------------------------------------
// The TMDB layer: posters, blurbs, where-to-watch. Produced by
// `npm run ingest` into public/data/marvel.generated.json and read
// here at runtime. Missing file → null, and the hover cards fall
// back to a placeholder poster + a JustWatch search CTA.
// ---------------------------------------------------------------
export const CATALOG_URL = '/data/marvel.generated.json'
export const REGION = (import.meta.env.VITE_WATCH_REGION || 'IN').toUpperCase()

export function useCatalog() {
  const [catalog, setCatalog] = useState(null)
  useEffect(() => {
    let alive = true
    fetch(CATALOG_URL)
      .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null))
      .then((c) => alive && setCatalog(c))
      .catch(() => alive && setCatalog(null))
    return () => {
      alive = false
    }
  }, [])
  return catalog
}

const JW_COUNTRY = { GB: 'uk' }
export function whereToWatchUrl(title, year) {
  const c = JW_COUNTRY[REGION] || REGION.toLowerCase()
  return `https://www.justwatch.com/${c}/search?q=${encodeURIComponent(`${title} ${year}`)}`
}
export const posterUrl = (path, size = 'w342') => (path ? `https://image.tmdb.org/t/p/${size}${path}` : null)
export const logoUrl = (path) => (path ? `https://image.tmdb.org/t/p/w45${path}` : null)
