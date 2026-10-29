# SWING TO DOOMSDAY — ship notes (2026-10-28)

## Shipped in the final pass
- [x] SWING, actually fixed (sprite sheets + Skyline.jsx):
      · every action clip is drawn facing RIGHT (only `idle` faces left)
        — sheets now say nativeDir:right + animDir:{idle:left}; before,
        run/jump/land/shoot were all shown mirrored
      · action rows were drawn at ~55% (Miles) / ~85% (Gwen) of the
        standing scale — `animScale` per clip keeps the body one size
      · one clean web-reach pose per hero (Miles' old swing loop had
        upside-down flip frames, kept as unused `flip`)
      · lean sign fixed (the body tilted AWAY from the web) — hangLean()
        aims the reaching arm at the anchor; leftward jumps mirrored too
      · the web leaves the exact hand (`hands` marker in the sheet)
      · new path: dip into the gap (never across the target wall), ride
        the line up beside it, release at anchor height, hop the parapet
        while the line snaps back; both heroes ride the same path
      · dust puffs at the actual touchdown
- [x] Portals are real surfaces: bodies are clipped at the portal plane
      (half-pop, pull-in, dives, drops) — portalClip() in Skyline.jsx
- [x] Summon: the guide leans HALF out of the ring (head/arm past the
      rim, legs inside), grabs, yanks the player through; the portal
      opens on whichever side has room on screen
- [x] First-visit arrival line ("Welcome to…" vs "Welcome back…")
- [x] Billboard video: controls=0, no clicks, YouTube bars cropped off
- [x] Layout: first roof framed with the title intact; billboards flip
      left when they'd run off-screen (and on the last roof, next to the
      Doomsday sign); bubble goes under the roofline then; bubble dodges
      the tracker sticker
- [x] Mobile, for real this time: panel never off-screen or under the
      tracker, floats above the heroes; bubbles under the roofline;
      hover card under/over the row; 27-year minimap fits; canon list,
      onboarding, login centred
- [x] Dev-only frame tools (stripped from prod): window.__flightT pins
      the flight clock, window.__stepAt(t) renders one frame, __plan
- [x] Renamed to SWING TO DOOMSDAY (title, topbar, login, meta,
      package.json; localStorage keys stay `spidy.*` on purpose)
- [x] Summon rework: the guide leans HALF out of the portal (bobbing,
      portal stays open through the dialogue) then yanks the player in
      (fx.pullThrough in Skyline.jsx)
- [x] Swing pose un-reversed: sheets' swing clip is drawn facing right —
      per-clip `animDir` override in *.sheet.json + SheetSprite
- [x] Doomsday billboard at the finish line plays the live trailer
      (lazy YouTube embed, muted autoplay — .kiosk__screen)
- [x] Magic link works without a backend: device-local email account
      (upgrades to real Supabase OTP when keys land in .env.local)
- [x] Mobile pass: compact 54px topbar + clock, scaled tracker, bubbles
      flip rightward, panels/cards/minimap fit 375px, stacked select
- [x] SPIDEY TRACKER: the canon filter is now a pixel-art sticker in the
      play area under the Doomsday clock (SpiderTracker.jsx) — blinking
      eyes, hover wiggle, gold/navy ON state, count chip
- [x] Partner is world-bound: solo in the pink full city, duo only while
      the canon filter is on; goodbye + radio-ping lines for the commute
- [x] Character-select banner: comic poster cards (burst rays, accents,
      "★ … rides along" chip, Suit up CTA), entrance pop
- [x] Dialogue system: src/data/banter.js — per-guide flirty lines for
      summon, idle rotation (~24s), ticks, landings, milestones
      (half / all-canon / all-106), portal + arrival beats; speech
      bubble tail + talking anim follow the speaker (who: leader/you)
- [x] Summon rewritten: "I'm here to help — anytime" + back-and-forth
- [x] Swing polish: comic speed-lines while airborne (direction-aware),
      landing dust puffs for both heroes
- [x] "Fast track" rebranded to CANON EVENTS (topbar ★ Canon, panel,
      onboarding, hover ★ tooltip, title/meta)
- [x] Full QA both characters, both dimensions, 0 console errors;
      build 3.9MB total, initial JS ~74KB gz

## To post it (any static host — Netlify / Vercel / GitHub Pages)
- `npm run build`, deploy the `dist/` folder at the DOMAIN ROOT
  (asset URLs are absolute: /bg/…, /characters/…)
- That's it — guest mode + localStorage works with zero backend

## Optional, later
- [ ] TMDB key in .env.local → `npm run ingest` → posters/links for the
      other 91 titles (canon links stay curated)
- [ ] Supabase keys → Google/magic-link sign-in goes live; then sync
      watched/scores to a `progress` table
- [ ] Thwip/land sounds; preload the other world's strip to hide the
      ~1s dimension-switch gap
- [ ] Knobs: all dialogue in src/data/banter.js; pink palette under
      `.app--pink`/`.px--pink` in city.css; dates in src/config.js
