import { redirect } from 'next/navigation'
import { sbServer } from '@/lib/supabase/server'
export default async function Root() {
  const s = await sbServer()
  const { data: { user } } = await s.auth.getUser()
  redirect(user ? '/dashboard' : '/auth/login')
}
