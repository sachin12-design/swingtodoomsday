// ---------------------------------------------------------------
// EVERY LINE IN THE GAME. Keyed by the GUIDE (the Spider you did
// not pick). `who` says which hero the bubble hangs over:
//   leader   — the guide
//   follower — you
// Scripted beats carry the name; ambient quips don't need it.
// ---------------------------------------------------------------

// Before the partner joins: your own HUD self-talk.
export const SOLO_IDLE = [
  'Big city. One checklist. No pressure.',
  'Tick a window, light the city.',
  'See the pixel tracker under the clock? Tap it — someone’s waiting.',
  'Doomsday’s not gonna wait. Swing faster.',
]

export const SOLO_TICK = (t) => [
  `${t} — lit.`,
  `Another window on. ${t}.`,
  `${t}, done. Keep climbing.`,
]

export const BANTER = {
  // Gwen guides (you picked Miles)
  gwen: {
    summon: () => [
      { who: 'leader', text: 'Gwen: "Hey, Miles. Heard you could use a hand — I’m here to help. Anytime. Don’t make it weird."', ms: 2700 },
      { who: 'follower', text: 'Miles: "I wasn’t gonna make it weird. I had a whole cool thing ready."', ms: 2300 },
      { who: 'leader', text: 'Gwen: "Sure you did. My dimension keeps the 15 canon events — zero filler. Grab on!"', ms: 2600 },
    ],
    idle: [
      'Pick something. Clock’s running.',
      'I’ve seen all of these twice. Try me.',
      'You swing like you’re showing off. …Don’t stop.',
      'Eyes on the skyline, Morales. Mostly.',
      'In every universe you’re late. Lucky it’s cute.',
    ],
    tick: (t) => [
      `Nice. ${t} down. You’re kind of good at this.`,
      `${t} — lit. Almost impressive.`,
      `Another window on. Keep up with me now.`,
      `${t}. See? Better with company.`,
    ],
    land: [
      'Clean landing. I taught you that.',
      'Okay, that was almost graceful.',
      'Careful, Morales — I might get impressed.',
      'Stuck it. Cute.',
    ],
    portal: {
      toCore: 'Gwen: "Ping received! Portal’s up — get over here, Morales."',
      toAll: 'Gwen: "Dropping you back home. Don’t be a stranger."',
    },
    arrive: {
      first: 'Gwen: "Welcome to my dimension — 15 canon events, zero filler. Stick close."',
      core: 'Gwen: "Welcome back to my dimension — 15 canon events, zero filler."',
      all: 'Gwen: "Full city, all 106 windows. Tap the tracker when you miss me."',
    },
    milestone: {
      canon: 'All 15 canon events. You’re ready for Doomsday — I knew you would be.',
      half: 'Half the city’s lit. Told you we make a good team.',
      all: 'Every window in the city. Okay, Morales… now I’m impressed.',
    },
  },

  // Miles guides (you picked Gwen)
  miles: {
    summon: () => [
      { who: 'leader', text: 'Miles: "Hey! Someone call for backup? I’m here to help — anytime. Like, anytime."', ms: 2700 },
      { who: 'follower', text: 'Gwen: "You rehearsed that in the portal, didn’t you?"', ms: 2300 },
      { who: 'leader', text: 'Miles: "…Little bit. Okay — my dimension keeps the 15 canon events. Grab on!"', ms: 2600 },
    ],
    idle: [
      'Yo — pick a movie. I’ll walk you through it.',
      'I know this city like the back of my web-shooter.',
      'That last landing? Ten out of ten. Not that I was staring.',
      'Doomsday’s counting down. Good thing you’ve got me.',
      'You swing better than me. Don’t tell anyone I said that.',
    ],
    tick: (t) => [
      `${t} — lit. You’re kind of amazing at this.`,
      `Nice. ${t} down. High-five on the next roof.`,
      `Another window on. We make a good team.`,
      `${t}. Smooth. Like your landings.`,
    ],
    land: [
      'Stuck the landing. Show-off.',
      'Okay, that swing was smooth.',
      'Right behind you. Always.',
      'Ten out of ten. Again.',
    ],
    portal: {
      toCore: 'Miles: "Yo! Tracker ping. Portal’s up — come through!"',
      toAll: 'Miles: "Dropping you back home. Miss me already? You will."',
    },
    arrive: {
      first: 'Miles: "Welcome to my shortcut — 15 canon events, zero filler. Stick with me."',
      core: 'Miles: "Welcome back to my shortcut — 15 canon events, zero filler."',
      all: 'Miles: "Full city, all 106 windows. I’m one tap away."',
    },
    milestone: {
      canon: 'All 15 canon events, done. You’re Doomsday-ready. Never doubted you.',
      half: 'Half the city’s lit! You and me — unstoppable.',
      all: 'Every. Single. Window. I’d follow you to any universe.',
    },
  },
}
