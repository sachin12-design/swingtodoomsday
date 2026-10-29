# Sprite sheets

Gwen animates from the **Spider String Performer** sheet (Grok-generated,
in the Figma cut-out style) — the Figma layer export lives in `gewn/`,
where every pose folder holds the same 23 transparent figure cut-outs.
Chosen cut-outs (by number in `standing-pose-N.png`): idle 6·5·16·5,
walk 8·10·11·12, run 2·3·4·7, takeoff 19, jump 20·21, fall 22, land 7,
swing 14·15·13·17·18, shoot 14. They're packed into
`public/characters/gwen-clean.png` + `gwen.sheet.json`.

Miles animates from his own Grok sheet the same way — Figma layer export
in `spidy/`, cut-outs in `spider-man-character/`: idle 3·5, walk
11·15·17·18, run 8·9·10·20, takeoff 7 (the superhero landing crouch),
jump 14·16, fall 19, land 7, swing 14·16·6·12·13 (acrobatic — his sheet
says "loose & explosive"), shoot 16. Packed into
`public/characters/miles-clean.png` + `miles.sheet.json`. #22 is the
hoodie Miles — unused so far (a nice character-select card someday).

## Two ways in

**A. Already-separated cut-outs** (what Gwen uses now): copy the PNGs
somewhere the dev server can see them (`public/dev/<id>/`), open the
console, load them, pick an order, draw them into one canvas and POST the
atlas + JSON to `/__save` — the packing snippet is in the git history of
this project's session notes; it's ~30 lines. Ask Claude to re-pack when
you swap frames.

**B. A single irregular sheet** (the earlier pixel-art route):

## How a sheet becomes a character

1. Drop the sheet at `public/characters/<id>-sheet.png` (transparent
   background). Irregular layouts are fine — every sprite is found by
   its own pixels, not a grid.
2. With `npm run dev` running, open the site, open the DevTools console,
   paste `scripts/slice-sheet.browser.js`, then `await sliceSheet('<id>')`.
   A numbered contact sheet appears over the page.
3. Pick frames per animation as `[row, [frame indices]]` and run again
   with `pick` (see the header of the script for Gwen's picks). It strips
   web lines from the swing/shoot frames and saves
   `public/characters/<id>-clean.png` + `<id>.sheet.json` through the
   dev-only `/__save` endpoint in `vite.config.js`.
4. Refresh. `HeroSprite` prefers `<id>.sheet.json` over the PNG cut-out.

## Animations the game asks for

| name | used when |
|---|---|
| `idle` | standing on a roof (loops) |
| `run` | controllable running (loops) |
| `takeoff` | crouch before a jump |
| `jump` | airborne, rising |
| `fall` | airborne, dropping |
| `land` | touchdown squash |
| `swing` | hanging from a web line (loops) |
| `shoot` | firing the line |

`SheetSprite.jsx` picks the animation from the wrapper's `data-phase`,
`data-vy`, `data-move` and `data-dir` attributes, which the flight loop
in `Skyline.jsx` writes every frame. Frames step at 12fps (on twos)
unless the sheet's `fps` says otherwise.

Gwen's chosen frames: idle row 31 · 17 (neutral stand + CSS bob),
run row 0 · 0–10, takeoff row 9 · 0–1 (crouch), jump row 18 · 4–5,
fall row 21 · 15–16, land row 9 · 0, swing row 21 · 5–12, shoot row 18 · 10.

Buildings are fixed-width (240–340px, `buildingWidth` in
`lib/skyline.js`), never resize, and always keep a `MIN_VOID` gap to
their neighbours (roofs are picked ≥ 10% of the strip apart).

Traversal (`planTraversal` + `goTo` in `Skyline.jsx`): run to the roof
edge → if the void to the next building is under `JUMP_GAP`, jump it;
otherwise shoot a web at the near corner of the next roof and swing —
full rope through the swoop into the gap, reeling in over the last half
to rise onto the roof and land near its middle → run to the standing
spot. Long trips chain through intermediate roofs (`MAX_HOPS`, ≤
`MAX_TOTAL` ms). Trips beyond `PORTAL_DIST` skip the chain entirely:
a dimensional portal (`Portal.jsx`) opens at the edge, both dive in
(shrinking into it), the camera warps across, and a second portal —
flattened, above the target roof — drops them into a superhero
landing (`superLand`, deeper squash + shockwave). At rest both face
right, toward the sign.
