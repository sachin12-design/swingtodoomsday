import { useState } from 'react'

// The front door: a holo terminal over the night sky. Guest mode
// always works (device-local); Google / magic-link light up once
// Supabase keys are in .env.local.
export default function Login({ auth }) {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const google = async () => {
    setBusy(true)
    const err = await auth.signInGoogle()
    if (err) setMsg(err)
    setBusy(false)
  }
  const magic = async (e) => {
    e.preventDefault()
    setBusy(true)
    const err = await auth.signInEmail(email.trim())
    setMsg(err || 'Link sent — check your inbox.')
    setBusy(false)
  }

  return (
    <div className="login grain">
      <div className="login__card">
        <div className="login__kicker">A Marvel checklist · before Doomsday</div>
        <h1 className="display login__brand chroma--heavy">Swing to Doomsday</h1>
        <p className="login__tag">106 titles. 26 rooftops. One city to light up.</p>

        <button className="login__btn login__btn--primary" disabled={!auth.configured || busy} onClick={google}>
          Continue with Google
        </button>

        <form className="login__row" onSubmit={magic}>
          <input
            className="login__input"
            type="email"
            placeholder="name@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
          <button className="login__btn" type="submit" disabled={busy || !email.includes('@')}>
            Magic link
          </button>
        </form>

        {msg && <p className="login__msg">{msg}</p>}
        {!auth.configured && (
          <p className="login__hint">No mail server yet — the magic link signs you in on this device. Google needs the backend keys.</p>
        )}

        <button className="login__guest" onClick={auth.continueAsGuest}>
          Continue as guest <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )
}
