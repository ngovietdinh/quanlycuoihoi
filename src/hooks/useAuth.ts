'use client'
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { sb } from '@/lib/supabase/client'
export function useAuth() {
  const [user, setUser] = useState<User|null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    sb().auth.getUser().then(({ data: { user } }) => { setUser(user); setLoading(false) })
    const { data: { subscription } } = sb().auth.onAuthStateChange((_, s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])
  const signOut = async () => { await sb().auth.signOut(); window.location.href = '/auth/login' }
  return { user, loading, signOut }
}
