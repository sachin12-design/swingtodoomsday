import { STRIPS } from '../lib/skyline.js'

// ---------------------------------------------------------------
// The fixed backdrop behind the scrolling city — one per dimension.
//   core: the neon-night gradient (the original look)
//   all : the pink Gwen-dimension — purple-to-pink sky with a bright
//         glow at the horizon, and a hazy far copy of the pink city
// The interactive strip itself lives in the track (Skyline.jsx).
// ---------------------------------------------------------------
export default function Parallax({ world = 'core' }) {
  if (world === 'all') {
    return (
      <div className="px px--pink" aria-hidden="true">
        <div className="px__sky px__sky--pink" />
        <div className="px__glow" />
        <div className="px__far px__far--pink" style={{ backgroundImage: `url("${STRIPS.all.src}")` }} />
      </div>
    )
  }
  return (
    <div className="px" aria-hidden="true">
      <div className="px__sky" />
    </div>
  )
}
