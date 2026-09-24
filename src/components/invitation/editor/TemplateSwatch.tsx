'use client'
import { templateById } from '@/lib/invitation/templates'
import { cn } from '@/lib/utils'
import type { TemplateId } from '@/types'

export function TemplateSwatch({ id, selected, onClick }: { id: TemplateId; selected?: boolean; onClick?: () => void }) {
  const t = templateById(id)
  return (
    <button type="button" onClick={onClick}
      className={cn('group rounded-2xl overflow-hidden border-2 text-left transition-all', selected ? 'border-sakura-500 shadow-glow-sakura' : 'border-ink-100 hover:border-ink-300')}>
      <div className="h-24 relative flex flex-col items-center justify-center" style={{ background: t.theme.background, color: t.theme.primary }}>
        <div className="absolute inset-2 border rounded-lg opacity-40" style={{ borderColor: t.theme.primary }}/>
        <span style={{ fontFamily: `'${t.theme.heading_font}', cursive` }} className="text-2xl leading-none">A &amp; B</span>
        <span className="text-[9px] tracking-[.3em] uppercase mt-1" style={{ color: t.theme.text, opacity: .6 }}>Save the date</span>
        <div className="absolute bottom-2 right-2 flex gap-1">
          {[t.theme.primary, t.theme.accent, t.theme.background].map(c => <span key={c} className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ background: c }}/>)}
        </div>
      </div>
      <div className="px-3 py-2 bg-white">
        <p className="text-xs font-bold text-ink-800">{t.name}</p>
        <p className="text-[10px] text-ink-400 line-clamp-2 leading-snug">{t.tagline}</p>
      </div>
    </button>
  )
}
