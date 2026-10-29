# Rive guide

## Read this first: you are NOT blocked

Your character already works. It blinks, talks when the bubble opens,
does a hop when you mark a movie watched, and its eyes follow your
mouse — all in plain SVG + CSS, no Rive file needed.

**You could ship the whole site without ever opening Rive.**

Rive is an *upgrade*, not a requirement. Do it when you feel like it.
And when you do, start with Part 1 — it takes 10 minutes and uses no
artwork at all.

---

# PART 1 — Hello World (10 min, no art)

The goal here is NOT a good character. It's to make a blob jump on
your site, so you've seen the whole pipeline work once. Everything
after this is just replacing the blob with real art.

### 1. Open the editor
Go to https://rive.app → free account → **New File** → **Blank**.

### 2. Draw one shape
Press `E` (ellipse), drag out a circle in the middle. That's your
whole character for now. Seriously.

### 3. Make two animations

Bottom-left you'll see **Animations**. Hit `+` twice.

**Animation 1, rename it `idle`:**
- Make sure the timeline is recording (the record button is on)
- At frame 0: leave the circle alone
- Drag the playhead to frame 30, move the circle up ~10px
- Drag to frame 60, move it back to the start
- Loop it

**Animation 2, rename it `celebrate`:**
- Frame 0: circle at rest
- Frame 10: circle way up high, a bit bigger
- Frame 25: back at rest
- Set it to play once, not loop

### 4. Make the state machine

Hit `+` in Animations again, choose **State Machine**.
**Rename it `HeroSM`** — this name must be exact.

In the Inputs panel (left), hit `+` → **Trigger** → name it
`celebrate`. Exact, lowercase.

Now in the graph:
- Drag `idle` in. Right-click it → **Set as default state**.
- Drag `celebrate` in.
- Hover `idle` → drag an arrow to `celebrate`. Click that arrow,
  add condition: `celebrate` (the trigger).
- Drag an arrow back from `celebrate` to `idle`. Click it, tick
  **Exit Time** and set 100%.

Press play. Fire the trigger from the Inputs panel. Blob jumps.
**That's a state machine.** That's the whole concept.

### 5. Export and drop in

- Top-left menu → **Export** → **Download** → choose **.riv**
  (NOT .rev — that's the editable project file)
- Save it as exactly: `public/characters/miles.riv`
- Refresh your site

Your SVG mask is gone. There's a blob where Miles was. Click a movie
— **the blob jumps.**

That's the entire pipeline working. Everything else is art.

> Want the mask back while you work? Just rename the file to
> `miles.riv.off`. The app falls back instantly.

---

# PART 2 — The real character

Only start this once Part 1 worked.

### The art you need

One clean pose per character — the rig makes every other pose.

```
[STYLE BIBLE] full body character, neutral standing pose, arms
slightly away from body, legs slightly apart, facing camera,
flat colors, clean silhouette, plain white background
```

Cut it into transparent PNGs at 2× in Photopea (free, photopea.com):

```
head.png   torso.png   arm-L.png   arm-R.png
leg-L.png  leg-R.png   eyes.png
```

Overlap the joints a little (arm tucks under the torso edge) so
rotating doesn't open gaps.

### Assembling

1. Drag the PNGs into a new Rive file, arrange them into a character
2. Group each limb
3. **Move each group's origin to its joint** — shoulder for arms,
   neck for head, hip for legs. This is the one step that separates
   "a joint bending" from "a sticker spinning"
4. Skip bones. Group rotation is how most Rive mascots are made and
   it's far easier

### Animations — all at 12fps

In each timeline's settings, set playback to **12fps**. This is the
Spider-Verse "on twos" look. One dropdown, biggest single win.

| Name | Loop? | What |
|---|---|---|
| `idle` | loop | breathing bob, small sway, occasional blink |
| `talk` | loop | head bob, one hand gesturing |
| `celebrate` | once | fist pump / hop |
| `point` | once | arm out toward the right |

Keep movements small. 6px of motion reads better than flailing.

### Full contract

Same as Part 1, plus two more inputs:

| Thing | Name | Type |
|---|---|---|
| State machine | `HeroSM` | — |
| Input | `talk` | Boolean |
| Input | `celebrate` | Trigger |
| Input | `point` | Trigger |
| Input | `lookX`, `lookY` | Number 0–100 (optional) |

Transitions:

```
idle → talk        when  talk == true
talk → idle        when  talk == false
idle → celebrate   when  celebrate fired
celebrate → idle   when  Exit Time 100%
idle → point       when  point fired
point → idle       when  Exit Time 100%
```

Set transition durations ~150ms so states blend instead of snap.

Export → `public/characters/miles.riv`, then repeat for `gwen.riv`.

---

# Troubleshooting

**Still seeing the SVG mask**
File isn't at `public/characters/<id>.riv`, or you exported `.rev`
instead of `.riv`. Open the browser console (F12) — if the contract
broke, it prints exactly which name it expected.

**Loads but nothing moves**
`idle` isn't set as the default state. Right-click it in the graph →
Set as default state.

**Jump animation plays forever**
The return transition is missing Exit Time, or `celebrate` is set to
loop instead of play-once.

**Gaps appear when limbs rotate**
Not enough overlap in your PNG slices. Re-export with joints tucked
further under.

**It moves but feels "webby", not comic**
You skipped the 12fps timeline setting.

**Totally lost in the editor**
Rive's own "Getting Started" video is 8 minutes and genuinely good.
Watch it, then come back to Part 1.
