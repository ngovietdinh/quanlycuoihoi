'use client'
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
export function useAuth() {
  const [user,setUser]=useState<User|null>(null)
  const [profile,setProfile]=useState<Profile|null>(null)
  const [loading,setLoading]=useState(true)
  const sb=getSupabaseClient()
  async function fetchProfile(id:string) {
    const {data}=await sb.from('profiles').select('*').eq('id',id).single()
    if(data) setProfile(data as Profile)
  }
  useEffect(()=>{
    sb.auth.getUser().then(({data:{user}})=>{
      setUser(user); if(user) fetchProfile(user.id); setLoading(false)
    })
    const {data:{subscription}}=sb.auth.onAuthStateChange((_e,session)=>{
      setUser(session?.user??null)
      if(session?.user) fetchProfile(session.user.id); else setProfile(null)
    })
    return ()=>subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])
  const signOut=async()=>{ await sb.auth.signOut(); window.location.href='/auth/login' }
  return {user,profile,loading,signOut}
}
