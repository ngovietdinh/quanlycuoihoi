import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { sbServer } from '@/lib/supabase/server'
import { InvitationView } from '@/components/invitation/InvitationView'
import { demoInvitation, normalizeInvitation, TEMPLATES } from '@/lib/invitation/templates'
import { fmtLong } from '@/lib/invitation/datetime'
import type { Invitation, GuestGreeting, Wish, TemplateId } from '@/types'

export const dynamic = 'force-dynamic'

type Props = { params: { slug: string }; searchParams: { g?: string; t?: string } }

const load = cache(async (slug: string, t?: string): Promise<Invitation | null> => {
  if (slug === 'demo') {
    const tpl = TEMPLATES.some(x => x.id === t) ? (t as TemplateId) : 'classic'
    return demoInvitation(tpl)
  }
  try {
    const s = await sbServer()
    const { data } = await s.from('invitations').select('*').eq('slug', slug).maybeSingle()
    return data ? normalizeInvitation(data as Invitation) : null
  } catch { return null }
})

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const inv = await load(params.slug, searchParams.t)
  if (!inv) return { title: 'Không tìm thấy thiệp' }
  const { groom, bride, cover_url, invite_text } = inv.content
  const title = `Thiệp cưới ${groom.name} & ${bride.name}`
  const date = inv.event_date ? fmtLong(inv.event_date) : ''
  const description = [date, invite_text].filter(Boolean).join(' · ')
  return {
    title: { absolute: title }, description,
    openGraph: { title, description, type: 'website', images: cover_url ? [{ url: cover_url }] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: cover_url ? [cover_url] : undefined },
    robots: { index: false },
  }
}

export default async function PublicInvitationPage({ params, searchParams }: Props) {
  const inv = await load(params.slug, searchParams.t)
  if (!inv) notFound()
  const demo = inv.id === 'demo'
  let guest: GuestGreeting | null = null
  let wishes: Wish[] = []

  if (demo) {
    if (searchParams.g) guest = { name: 'Nguyễn Văn Nam', salutation: 'Anh', invited_count: 2, side: 'groom' }
    wishes = [
      { id:'w1', invitation_id:'demo', name:'Hoàng Mai', message:'Chúc hai bạn trăm năm hạnh phúc, sớm có thiên thần nhỏ nhé! 💕', is_hidden:false, created_at:new Date().toISOString() },
      { id:'w2', invitation_id:'demo', name:'Team Marketing', message:'Chúc mừng đám cưới Minh Anh & Thu Trang! Bách niên giai lão 🎊', is_hidden:false, created_at:new Date().toISOString() },
    ]
  } else {
    const s = await sbServer()
    const [g, w] = await Promise.all([
      searchParams.g ? s.rpc('get_invitation_guest', { p_invitation_id: inv.id, p_code: searchParams.g }) : Promise.resolve({ data: null }),
      s.from('wishes').select('*').eq('invitation_id', inv.id).eq('is_hidden', false).order('created_at', { ascending: false }).limit(100),
      inv.is_published ? s.rpc('increment_invitation_view', { p_invitation_id: inv.id }) : Promise.resolve(null),
    ])
    guest = (g.data as GuestGreeting[] | null)?.[0] ?? null
    wishes = (w.data as Wish[] | null) ?? []
  }

  return (
    <>
      {!inv.is_published && (
        <div className="fixed top-0 inset-x-0 z-[100] bg-gold-500 text-white text-center text-xs font-semibold py-1.5">
          Bản nháp — chỉ bạn nhìn thấy. Hãy phát hành thiệp để gửi cho khách mời.
        </div>
      )}
      <InvitationView invitation={inv} guest={guest} guestCode={searchParams.g} demo={demo} initialWishes={wishes}/>
    </>
  )
}
