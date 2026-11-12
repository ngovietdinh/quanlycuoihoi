import { createBrowserClient } from '@supabase/ssr'
import { supabaseUrl, supabaseKey } from '@/lib/supabase/env'
let _c: ReturnType<typeof createBrowserClient>|null = null
export const sb = () => {
  if (!_c) _c = createBrowserClient(
    supabaseUrl(),
    supabaseKey()
  )
  return _c
}
