# SPIDY — an MCU catch-up timeline, guided

A Spider-Verse-styled Marvel checklist for anyone catching up before
**Avengers: Doomsday (18 Dec 2026)**. Every year from 2000 to 2026 sits
on a rooftop of a scrolling skyline; reach one and its films and series
zoom out of the roof. Tick what you've seen and the roof lights up.

Personal / portfolio project. Non-commercial.

## Run

```bash
npm install
npm run dev
```

Opens on http://localhost:5173 — no API key needed.

## Controls

| Do | Get |
|---|---|
| `→` / `←` (or `D` / `A`), the edge buttons, a wheel flick, a swipe | hop to the next / previous building |
| click a roof sign or a minimap bar | long jump to that year |
| click a title in the open list | tick it — the roof warms up |
| hover a title | poster + "Watch on …" / "Where to watch ↗" card |
| ★ Fast track (topbar) | the 15 mandatory titles before Doomsday, with India links — tick them there |
| ⬡ dimension chip (topbar) | portal between the **full city** (golden, all 106) and the **shortlist** (neon night, ★ only). First use summons your partner |
| `?` on a ticked title | optional quiz |
| 🔊 in the topbar | mute / unmute the music (`public/audio/sunflower.mp3`, 15% volume) |

You play the Spider you picked; the other one is your guide — leads
every jump and does the talking. The list opens when you both land.

## Posters and streaming links

```bash
cp .env.example .env.local   # add your free TMDB key + region
npm run ingest               # → public/data/marvel.generated.json
```

Until that file exists, hover cards show a placeholder poster and a
JustWatch search button; after, real posters and per-provider buttons.

## Where things live

| Path | What |
|---|---|
| `src/config.js` | Doomsday date, characters. **Tweak here first.** |
| `src/data/marvel.js` | All 106 titles, 2000 → 2026 |
| `src/data/essentials.js` | The 15-title fast track + India OTT links |
| `src/lib/skyline.js` | Reads rooftops off the skyline art; lays the years out on them |
| `src/components/Skyline.jsx` | The paginated city: tiled art, road, towers, the jump (`goTo`), minimap |
| `src/components/Heroes.jsx` | The pair on the roof — positioned by the flight loop |
| `src/lib/music.js` | Background music hook (loop, fade, mute memory) |
| `src/lib/worlds.js` | The two dimensions: full city vs ★ shortlist |
| `src/components/Tower.jsx` | A year on a rooftop: sign, glow, zooming movie panel |
| `src/components/Parallax.jsx` | Fixed sky (behind) and rooftop ledge (in front) |
| `src/components/HeroSprite.jsx` | A hero: sprite sheet (`<id>.sheet.json`) → PNG cut-out → SVG rig |
| `src/components/SheetSprite.jsx` | Plays sheet animations from the flight loop's data-* flags |
| `src/styles/comic.css` | The Spider-Verse look. One file. |
| `src/components/SpiderHero.jsx` | SVG/Rive character rig — the fallback behind HeroSprite |
| `TODO.md` | **The build checklist. Start here.** |

## The visual system

~70% of the Spider-Verse look is post-processing, not artwork. It all
lives in `comic.css` as composable classes:

- `.halftone` — Ben-Day dots
- `.chroma` / `.chroma--heavy` — CMYK channel split
- `.grain` — paper texture
- `.panel` — comic borders with hard shadow
- `.on-twos` — **12fps stepped motion.** The single most important
  rule in the file. Characters animate at 12fps while the UI runs at
  60fps; that contrast is what reads as "Spider-Verse."
- `.sfx` — THWIP!/BAM! bursts
- `.glitch` — dimension tear

Retune the whole site by editing that one file.

## Credits

Film data and artwork from [TMDB](https://www.themoviedb.org).
This product uses the TMDB API but is not endorsed or certified by TMDB.
