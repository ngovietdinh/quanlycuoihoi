'use client'
import { useState } from 'react'
import { TEMPLATES, TEMPLATE_CATEGORIES, templateById, patternBg, LAYOUTS } from '@/lib/invitation/templates'
import { cn } from '@/lib/utils'
import type { TemplateId, TemplateCategory } from '@/types'

const ORN_GLYPH: Record<string, string> = { songhy: '囍', lotus: '❀', deco: '◆', heart: '♥', star: '✦', leaf: '❦', wave: '〰', floral: '✿', geo: '◇', line: '—' }

export function TemplateSwatch({ id, selected, onClick }: { id: TemplateId; selected?: boolean; onClick?: () => void }) {
  const t = templateById(id)
  const th = t.theme
  return (
    <button type="button" onClick={onClick}
      className={cn('group rounded-2xl overflow-hidden border-2 text-left transition-all', selected ? 'border-sakura-500 shadow-glow-sakura' : 'border-ink-100 hover:border-ink-300')}>
      <div className="h-24 relative flex flex-col items-center justify-center" style={{ background: th.background, backgroundImage: patternBg(th.pattern, th.primary), color: th.primary }}>
        <div className="absolute inset-2 border opacity-40" style={{ borderColor: th.primary, borderRadius: Math.min(th.radius, 14) }}/>
        <span className="text-[10px] leading-none mb-0.5 opacity-70">{ORN_GLYPH[t.ornament]}</span>
        <span style={{ fontFamily: `'${th.heading_font}', cursive` }} className="text-2xl leading-none">A &amp; B</span>
        <span className="text-[8px] tracking-[.3em] uppercase mt-1" style={{ color: th.text, opacity: .6 }}>Save the date</span>
        <div className="absolute bottom-2 right-2 flex gap-1">
          {[th.primary, th.accent].map(c => <span key={c} className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ background: c }}/>)}
        </div>
        {selected && <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-sakura-500 text-white text-[10px] flex items-center justify-center">✓</span>}
      </div>
      <div className="px-3 py-2 bg-white">
        <p className="text-xs font-bold text-ink-800 flex items-center justify-between gap-1">
          <span className="truncate">{t.name}</span>
          <span className="hidden sm:inline text-[9px] font-medium text-ink-400 flex-shrink-0">{LAYOUTS.find(l => l.id === th.layout)?.label}</span>
        </p>
        <p className="text-[10px] text-ink-400 line-clamp-2 leading-snug min-h-[1.6rem]">{t.tagline}</p>
      </div>
    </button>
  )
}

/** Lưới chọn mẫu có lọc theo nhóm phong cách */
export function TemplatePicker({ value, onChange, cols = 'grid-cols-2 sm:grid-cols-3' }: { value: TemplateId; onChange: (id: TemplateId) => void; cols?: string }) {
  const [cat, setCat] = useState<TemplateCategory | 'all'>('all')
  const list = TEMPLATES.filter(t => cat === 'all' || t.category === cat)
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {TEMPLATE_CATEGORIES.map(c => {
          const n = c.id === 'all' ? TEMPLATES.length : TEMPLATES.filter(t => t.category === c.id).length
          return (
            <button key={c.id} type="button" onClick={() => setCat(c.id)}
              className={cn('flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition',
                cat === c.id ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400')}>
              {c.label} <span className="opacity-60">{n}</span>
            </button>
          )
        })}
      </div>
      <div className={cn('grid gap-2.5', cols)}>
        {list.map(t => <TemplateSwatch key={t.id} id={t.id} selected={value === t.id} onClick={() => onChange(t.id)}/>)}
      </div>
    </div>
  )
}
