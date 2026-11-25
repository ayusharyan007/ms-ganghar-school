import { createContext, useContext, useEffect, useState } from 'react'
import { configured, supabase } from '../lib/supabase'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [admin, setAdmin] = useState(false)
  const [recovery, setRecovery] = useState(false)
  const [loading, setLoading] = useState(configured)
  useEffect(() => {
    if (!supabase) return
    let alive = true
    let checkVersion = 0
    const check = async (next) => {
      const version = ++checkVersion
      setSession(next)
      if (!next?.user) { setAdmin(false); setLoading(false); return }
      try {
        const { data, error } = await supabase.from('admin_profiles').select('user_id').eq('user_id', next.user.id).maybeSingle()
        if (alive && version === checkVersion) { setAdmin(Boolean(data && !error)); setLoading(false) }
      } catch {
        if (alive && version === checkVersion) { setAdmin(false); setLoading(false) }
      }
    }
    supabase.auth.getSession().then(({ data }) => check(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      setLoading(true)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      // Supabase auth callbacks run while its auth lock is held. Defer the
      // membership query until after the callback returns to avoid deadlock.
      setTimeout(() => { if (alive) check(next) }, 0)
    })
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [])
  return <AuthContext.Provider value={{ session, admin, loading, recovery, finishRecovery: () => setRecovery(false) }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
