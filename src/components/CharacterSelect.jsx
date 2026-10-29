import { CHARACTERS, guideFor } from '../config.js'
import HeroSprite from './HeroSprite.jsx'

// The pick screen: two comic-poster panels, one per Spider. Whoever
// you don't pick becomes the guide — the posters say so up front.
export default function CharacterSelect({ onPick }) {
  return (
    <div className="select grain">
      <div className="select__inner">
        <div className="select__kicker">Earth-616 · two Spiders on call</div>
        <h1 className="display select__title chroma--heavy">Choose your Spider</h1>
        <p className="select__sub">You swing. The other one tags along — and never stops talking.</p>

        <div className="select__grid">
          {Object.values(CHARACTERS).map((c, i) => {
            const g = guideFor(c.id)
            return (
              <button
                key={c.id}
                className={`pcard halftone ${i === 0 ? 'panel--tilt-l' : 'panel--tilt-r'}`}
                style={{ '--acc': c.colors.accent, '--glow': c.colors.glow }}
                onClick={() => onPick(c.id)}
              >
                <span className="pcard__no display" aria-hidden="true">0{i + 1}</span>
                <span className="pcard__burst" aria-hidden="true" />
                <span className="pcard__hero">
                  <HeroSprite character={c} size={236} />
                </span>
                <span className="pcard__name display">{c.name}</span>
                <span className="pcard__tag">{c.tagline}</span>
                <span className="pcard__guide">★ {g.name.split(' ')[0]} rides along</span>
                <span className="pcard__cta display">Suit up →</span>
              </button>
            )
          })}
        </div>

        <p className="select__foot">Progress saves on this device — pick once, swing forever.</p>
      </div>
    </div>
  )
}
