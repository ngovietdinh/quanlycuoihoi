'use client'
import { useState, useEffect, useCallback } from 'react'
import { getMyProfile, touchLastSeen } from '@/lib/api/account'
import type { UserProfile } from '@/types'

let cache: UserProfile | null = null
let seen = false

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(cache)
  const [loading, setLoading] = useState(!cache)

  const refresh = useCallback(async () => {
    const { data } = await getMyProfile()
    cache = data; setProfile(data); setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    if (!seen) { seen = true; touchLastSeen().catch(() => {}) }
  }, [refresh])

  return { profile, loading, refresh, isAdmin: profile?.role === 'admin' }
}

export const clearProfileCache = () => { cache = null }
