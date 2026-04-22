import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
  )
}

// Ensure URL has no trailing slash
const cleanUrl = SUPABASE_URL.replace(/\/$/, '')

export function createClient() {
  return createBrowserClient(cleanUrl, SUPABASE_ANON_KEY)
}

let _client: ReturnType<typeof createClient> | null = null
export function getSupabaseClient() {
  if (!_client) _client = createClient()
  return _client
}
