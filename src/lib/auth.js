import { useCallback, useEffect, useState } from 'react'

// ---------------------------------------------------------------
// Accounts. Three states: signedout → the Login screen; guest →
// everything runs on this device's localStorage (unchanged); authed
// → a real Supabase session.
//
// Supabase is loaded ONLY when keys exist in .env.local:
//   VITE_SUPABASE_URL=...   VITE_SUPABASE_ANON_KEY=...
// Until then the Login screen offers guest mode and shows the
// sign-in buttons disabled. Progress sync for signed-in users is
// the next step once keys are in (see TODO).
// ---------------------------------------------------------------
const URL_ = import.meta.env.VITE_SUPABASE_URL
const KEY_ = import.meta.env.VITE_SUPABASE_ANON_KEY
export const configured = Boolean(URL_ && KEY_)

const GUEST_FLAG = 'spidy.guest'
const LOCAL_USER = 'spidy.user' // email sign-in without a backend: device-local

let sb = null
async function client() {
  if (!configured) return null
  if (!sb) {
    const { createClient } = await import('@supabase/supabase-js')
    sb = createClient(URL_, KEY_)
  }
  return sb
}

export function useAuth() {
  const [state, setState] = useState({ status: 'loading', user: null })

  useEffect(() => {
    let alive = true
    let unsub = null
    ;(async () => {
      const c = await client()
      if (c) {
        const { data } = await c.auth.getSession()
        if (!alive) return
        if (data.session) {
          setState({ status: 'authed', user: data.session.user })
        } else if (localStorage.getItem(GUEST_FLAG) === '1') {
          setState({ status: 'guest', user: null })
        } else {
          setState({ status: 'signedout', user: null })
        }
        const sub = c.auth.onAuthStateChange((_e, session) => {
          if (!alive) return
          if (session) setState({ status: 'authed', user: session.user })
          else if (localStorage.getItem(GUEST_FLAG) !== '1') setState({ status: 'signedout', user: null })
        })
        unsub = sub.data.subscription
        return
      }
      if (!alive) return
      const localEmail = localStorage.getItem(LOCAL_USER)
      setState(
        localEmail
          ? { status: 'local', user: { email: localEmail } }
          : localStorage.getItem(GUEST_FLAG) === '1'
            ? { status: 'guest', user: null }
            : { status: 'signedout', user: null }
      )
    })()
    return () => {
      alive = false
      unsub?.unsubscribe()
    }
  }, [])

  const continueAsGuest = useCallback(() => {
    localStorage.setItem(GUEST_FLAG, '1')
    setState({ status: 'guest', user: null })
  }, [])

  const signInGoogle = useCallback(async () => {
    const c = await client()
    if (!c) return 'Sign-in is not configured yet.'
    const { error } = await c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    return error?.message || null
  }, [])

  const signInEmail = useCallback(async (email) => {
    const c = await client()
    if (!c) {
      // no mail server wired up: the email becomes a device-local
      // account, so the flow works today and upgrades to a real
      // magic link the moment Supabase keys land in .env.local
      localStorage.setItem(LOCAL_USER, email)
      setState({ status: 'local', user: { email } })
      return null
    }
    const { error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    return error?.message || null
  }, [])

  const signOut = useCallback(async () => {
    localStorage.removeItem(GUEST_FLAG)
    localStorage.removeItem(LOCAL_USER)
    const c = await client()
    await c?.auth.signOut()
    setState({ status: 'signedout', user: null })
  }, [])

  return { ...state, configured, continueAsGuest, signInGoogle, signInEmail, signOut }
}
