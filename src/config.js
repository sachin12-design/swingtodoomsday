// ---------------------------------------------------------------
// Single source of truth for anything you'll want to tweak later.
// ---------------------------------------------------------------

// Avengers: Doomsday. Marvel has already moved this date twice,
// so it lives here and nowhere else. Change it in ONE place.
export const DOOMSDAY = new Date('2026-12-18T00:00:00')

// You play one; the other one guides you.
export const CHARACTERS = {
  miles: {
    id: 'miles',
    name: 'Miles Morales',
    tagline: 'Brooklyn. Bite. Bad timing.',
    // Swap these for your AI-generated art later — see TODO.md step 4
    colors: { suit: '#17171F', accent: '#FF1744', lens: '#FFFFFF', glow: '#FF1744' },
    // spoken when Miles is the GUIDE (i.e. you picked Gwen)
    voice: {
      pick: () => `Miles: "Gwen Stacy, in my city? Nice. Tap my tracker when you want company — I\u2019m around."`,
      idle: "Yo — pick a movie. I'll walk you through it.",
    },
  },
  gwen: {
    id: 'gwen',
    name: 'Gwen Stacy',
    tagline: 'Drummer. Dimension-hopper. Done explaining.',
    colors: { suit: '#F4F1EC', accent: '#FF4FA3', lens: '#22E0D6', glow: '#7C4DFF' },
    // spoken when Gwen is the GUIDE (i.e. you picked Miles)
    voice: {
      pick: () => `Gwen: "Miles Morales. Lighting up the whole city, huh? Tap the tracker if you want company — I\u2019m around."`,
      idle: "Pick something. Clock's running.",
    },
  },
}

// localStorage keys — swap for Supabase in TODO step 7
export const STORAGE = {
  character: 'spidy.character',
  watched: 'spidy.watched',
  scores: 'spidy.scores',
}

export const guideFor = (id) => Object.values(CHARACTERS).find((c) => c.id !== id)
