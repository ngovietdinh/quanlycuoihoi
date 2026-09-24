import { createServerClient, type CookieOptions } from '@supabase/ssr'
type CookieList = { name: string; value: string; options?: CookieOptions }[]
import { cookies } from 'next/headers'
export async function sbServer() {
  const jar = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll:()=>jar.getAll(), setAll(l: CookieList){try{l.forEach(({name,value,options})=>jar.set(name,value,options))}catch{}} } }
  )
}
