import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { supabaseUrl, supabaseKey } from '@/lib/supabase/env'
type CookieList = { name: string; value: string; options?: CookieOptions }[]
import { cookies } from 'next/headers'
export async function sbServer() {
  const jar = await cookies()
  return createServerClient(
    supabaseUrl(),
    supabaseKey(),
    { cookies: { getAll:()=>jar.getAll(), setAll(l: CookieList){try{l.forEach(({name,value,options})=>jar.set(name,value,options))}catch{}} } }
  )
}
