'use client'
import { useState } from 'react'
import { vnd, cn } from '@/lib/utils'
import { SERIES, OTHER_COLOR } from '@/lib/family/data'
import { short } from './ui'

/** Cột nhóm theo tháng (vd. Thu vs Chi). Một trục, cột mảnh bo đầu 4px, khe 2px, tooltip khi rê chuột. */
export function GroupedBars({ labels, series, height = 220 }: { labels: string[]; series: { name: string; color: string; values: number[] }[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...series.flatMap(s => s.values))
  const nice = (() => { const p = Math.pow(10, Math.floor(Math.log10(max))); return Math.ceil(max / p) * p })()
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => t * nice)
  const W = 640, H = height, padL = 44, padB = 22, padT = 8
  const cw = (W - padL) / labels.length
  const bw = Math.min(16, (cw - 10) / series.length - 2)
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / nice)
  return (
    <div className="relative">
      <div className="flex flex-wrap gap-4 mb-2 text-xs text-ink-600">
        {series.map(s => <span key={s.name} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: s.color }}/>{s.name}</span>)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Biểu đồ thu chi theo tháng">
        {ticks.map(t => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke="#e7e5e4" strokeWidth={1} strokeDasharray={t ? '3 3' : undefined}/>
            <text x={padL - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill="#78716c">{short(t)}</text>
          </g>
        ))}
        {labels.map((l, i) => {
          const x0 = padL + i * cw + (cw - series.length * (bw + 2)) / 2
          return (
            <g key={l} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padL + i * cw} y={padT} width={cw} height={H - padT - padB} fill={hover === i ? '#f5f5f4' : 'transparent'}/>
              {series.map((s, k) => {
                const v = s.values[i], top = y(v), h = Math.max(0, H - padB - top)
                const r = Math.min(4, h, bw / 2)
                return h > 0 ? <path key={s.name} fill={s.color} d={`M${x0 + k * (bw + 2)},${H - padB} v${-(h - r)} q0,${-r} ${r},${-r} h${bw - 2 * r} q${r},0 ${r},${r} v${h - r} z`}/> : null
              })}
              <text x={padL + i * cw + cw / 2} y={H - 6} textAnchor="middle" fontSize="10" fill={hover === i ? '#1c1917' : '#78716c'} fontWeight={hover === i ? 700 : 400}>{l}</text>
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div className="absolute top-8 pointer-events-none card px-3 py-2 text-xs shadow-modal z-10" style={{ left: `min(calc(${((padL + hover * cw + cw / 2) / W) * 100}% + 8px), calc(100% - 170px))` }}>
          <p className="font-semibold text-ink-900 mb-1">{labels[hover]}</p>
          {series.map(s => <p key={s.name} className="flex items-center gap-1.5 text-ink-600"><span className="w-2 h-2 rounded-sm" style={{ background: s.color }}/>{s.name}: <b className="text-ink-900 tabular">{vnd(s.values[hover])}</b></p>)}
        </div>
      )}
    </div>
  )
}

/** Thanh ngang xếp hạng theo danh mục: tối đa 7 màu cố định, phần còn lại gộp "Khác" */
export function RankBars({ rows, total, max = 7 }: { rows: [string, number][]; total: number; max?: number }) {
  const sorted = [...rows].sort((a, b) => b[1] - a[1])
  const head = sorted.slice(0, max), rest = sorted.slice(max).reduce((s, [, v]) => s + v, 0)
  const list: [string, number, string][] = [...head.map(([k, v], i) => [k, v, SERIES[i]] as [string, number, string]), ...(rest ? [['Khác (gộp)', rest, OTHER_COLOR] as [string, number, string]] : [])]
  const top = Math.max(1, ...list.map(r => r[1]))
  if (!list.length) return <p className="text-sm text-ink-400 text-center py-6">Chưa có dữ liệu</p>
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden gap-[2px] mb-4 bg-white">
        {list.map(([k, v, c]) => <span key={k} title={`${k}: ${vnd(v)}`} style={{ width: `${(v / total) * 100}%`, background: c }} className="first:rounded-l-full last:rounded-r-full"/>)}
      </div>
      <ul className="space-y-2.5">
        {list.map(([k, v, c]) => (
          <li key={k} className="group" title={`${k}: ${vnd(v)} (${Math.round((v / total) * 100)}%)`}>
            <div className="flex items-center justify-between text-sm gap-2 mb-1">
              <span className="flex items-center gap-2 text-ink-700 truncate"><span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: c }}/>{k}</span>
              <span className="flex-shrink-0 tabular"><span className="text-xs text-ink-400 mr-2">{Math.round((v / total) * 100)}%</span><b className="text-ink-900">{vnd(v)}</b></span>
            </div>
            <div className="h-1.5 rounded-full bg-ink-100"><div className="h-full rounded-full transition-all" style={{ width: `${(v / top) * 100}%`, background: c }}/></div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Thanh tiến độ ngân sách: trạng thái kèm biểu tượng + nhãn (không dùng màu đơn thuần) */
export function BudgetBar({ spent, limit }: { spent: number; limit: number }) {
  const p = limit ? (spent / limit) * 100 : 0
  const st = p >= 100 ? ['⛔', 'Vượt ngân sách', 'bg-red-500', 'text-red-600'] : p >= 80 ? ['⚠️', 'Sắp chạm hạn mức', 'bg-gold-500', 'text-gold-700'] : ['✓', 'Trong hạn mức', 'bg-jade-500', 'text-jade-700']
  return (
    <div>
      <div className="h-2 rounded-full bg-ink-100 overflow-hidden"><div className={cn('h-full rounded-full transition-all', st[2])} style={{ width: `${Math.min(100, p)}%` }}/></div>
      <p className={cn('text-xs mt-1 font-medium', st[3])}>{st[0]} {st[1]} · {Math.round(p)}%</p>
    </div>
  )
}

/** Biểu đồ đường tăng trưởng: dải tham chiếu WHO (xám) + giá trị của bé (1 chuỗi) */
// Lưu ý: không đặt tên prop là `ref` (React giữ lại, component sẽ không nhận được)
export function GrowthChart({ points, bands: ref, unit, height = 200 }: { points: { x: number; y: number; label: string }[]; bands: { x: number; lo: number; med: number; hi: number }[]; unit: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  if (!ref.length) return null
  const W = 640, H = height, padL = 40, padB = 22, padT = 8
  const xs = [...ref.map(r => r.x), ...points.map(p => p.x)], ys = [...ref.flatMap(r => [r.lo, r.hi]), ...points.map(p => p.y)]
  const x0 = Math.min(...xs), x1 = Math.max(...xs, x0 + 1), y0 = Math.floor(Math.min(...ys) * 0.95), y1 = Math.ceil(Math.max(...ys) * 1.03)
  const X = (v: number) => padL + ((v - x0) / (x1 - x0)) * (W - padL - 8), Y = (v: number) => padT + (H - padT - padB) * (1 - (v - y0) / (y1 - y0))
  const band = `M${ref.map(r => `${X(r.x)},${Y(r.hi)}`).join(' L')} L${[...ref].reverse().map(r => `${X(r.x)},${Y(r.lo)}`).join(' L')} Z`
  const med = `M${ref.map(r => `${X(r.x)},${Y(r.med)}`).join(' L')}`
  const line = points.length ? `M${points.map(p => `${X(p.x)},${Y(p.y)}`).join(' L')}` : ''
  const yt = Array.from({ length: 5 }, (_, i) => y0 + ((y1 - y0) * i) / 4)
  return (
    <div className="relative">
      <div className="flex flex-wrap gap-4 mb-2 text-xs text-ink-600">
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 rounded" style={{ background: SERIES[0] }}/>Của bé</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-2.5 rounded-sm bg-ink-200"/>Vùng bình thường WHO (±2SD, gần đúng)</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-ink-400"/>Trung vị</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Biểu đồ tăng trưởng (${unit})`}>
        {yt.map(t => <g key={t}><line x1={padL} x2={W} y1={Y(t)} y2={Y(t)} stroke="#f0eeec"/><text x={padL - 5} y={Y(t) + 3} fontSize="10" textAnchor="end" fill="#78716c">{t.toFixed(unit === 'kg' ? 1 : 0)}</text></g>)}
        <path d={band} fill="#e7e5e4" opacity={0.7}/>
        <path d={med} fill="none" stroke="#a8a29e" strokeWidth={1.5} strokeDasharray="4 4"/>
        {line && <path d={line} fill="none" stroke={SERIES[0]} strokeWidth={2} strokeLinejoin="round"/>}
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <circle cx={X(p.x)} cy={Y(p.y)} r={12} fill="transparent"/>
            <circle cx={X(p.x)} cy={Y(p.y)} r={hover === i ? 6 : 4.5} fill={SERIES[0]} stroke="#fff" strokeWidth={2}/>
          </g>
        ))}
        {[x0, (x0 + x1) / 2, x1].map(t => <text key={t} x={X(t)} y={H - 6} fontSize="10" textAnchor="middle" fill="#78716c">{Math.round(t)} th</text>)}
      </svg>
      {hover !== null && points[hover] && (
        <div className="absolute top-6 card px-3 py-2 text-xs shadow-modal pointer-events-none" style={{ left: `min(calc(${(X(points[hover].x) / W) * 100}% + 8px), calc(100% - 150px))` }}>
          <p className="font-semibold text-ink-900">{points[hover].label}</p><p className="text-ink-600 tabular">{points[hover].y} {unit}</p>
        </div>
      )}
    </div>
  )
}
