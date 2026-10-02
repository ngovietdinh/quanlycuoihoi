'use client'
// Hình minh họa SVG cho hero các phân hệ Gia đình — có chuyển động nhẹ, phản ánh số liệu thật
import { useId } from 'react'

/** Ngôi nhà: mỗi thành viên một ô cửa sổ sáng đèn, trái tim đập trên mái */
export function HomeArt({ members = 2, size = 210 }: { members?: number; size?: number }) {
  const id = useId().replace(/:/g, '')
  const lit = Math.max(1, Math.min(6, members))
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className="float-art" aria-hidden>
      <defs>
        <linearGradient id={`w${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#ffe4ed"/></linearGradient>
        <linearGradient id={`r${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff6b96"/><stop offset="1" stopColor="#f97316"/></linearGradient>
        <radialGradient id={`g${id}`}><stop offset="0" stopColor="#fde68a"/><stop offset="1" stopColor="#f59e0b"/></radialGradient>
      </defs>
      <ellipse cx="100" cy="178" rx="70" ry="8" fill="#000" opacity=".18"/>
      <rect x="38" y="84" width="124" height="92" rx="10" fill={`url(#w${id})`}/>
      <path d="M24 92 100 30l76 62" fill="none" stroke={`url(#r${id})`} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="132" y="38" width="16" height="30" rx="3" fill="#c2410c"/>
      {Array.from({ length: 6 }).map((_, i) => {
        const x = 54 + (i % 3) * 34, y = 100 + Math.floor(i / 3) * 34, on = i < lit
        return <rect key={i} x={x} y={y} width="24" height="22" rx="5" fill={on ? `url(#g${id})` : '#e2dfe8'} className={on ? 'win-on' : undefined} style={{ animationDelay: `${i * .35}s` }}/>
      })}
      <rect x="88" y="140" width="24" height="36" rx="12" fill="#9d174d"/>
      <path className="beat" d="M100 72s-12-7-12-15a6.5 6.5 0 0 1 12-3.5A6.5 6.5 0 0 1 112 57c0 8-12 15-12 15Z" fill="#fff"/>
    </svg>
  )
}

/** Vòng thu–chi: phần chi chiếm bao nhiêu trên thu, số ở giữa là tỉ lệ để dành */
export function MoneyRing({ income, expense, size = 200 }: { income: number; expense: number; size?: number }) {
  const r = 70, c = 2 * Math.PI * r
  const spentPct = income > 0 ? Math.min(1, expense / income) : expense > 0 ? 1 : 0
  const save = income > 0 ? Math.round(((income - expense) / income) * 100) : 0
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden>
      <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="22"/>
      <circle cx="100" cy="100" r={r} fill="none" stroke="#a7f3d0" strokeWidth="22" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={0} transform="rotate(-90 100 100)" opacity=".35"/>
      <circle cx="100" cy="100" r={r} fill="none" stroke="#fda4af" strokeWidth="22" strokeLinecap="round" strokeDasharray={c}
        strokeDashoffset={c * (1 - spentPct)} transform="rotate(-90 100 100)" className="ring-draw" style={{ ['--c' as string]: c, transition: 'stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)' }}/>
      <text x="100" y="96" textAnchor="middle" fill="#fff" fontSize="34" fontWeight="800" letterSpacing="-1">{income > 0 ? `${save}%` : '—'}</text>
      <text x="100" y="118" textAnchor="middle" fill="rgba(255,255,255,.7)" fontSize="12">để dành được</text>
      {['💵', '🪙', '💳'].map((e, i) => <text key={i} x={[30, 168, 160][i]} y={[46, 60, 170][i]} fontSize="20" className="coin-bob" style={{ animationDelay: `${i * .8}s` }}>{e}</text>)}
    </svg>
  )
}

/** Heo đất: mức "nước" bên trong = phần trăm đã để dành so với tổng mục tiêu; đồng xu rơi vào khe */
export function PiggyArt({ pct = 0, size = 210 }: { pct?: number; size?: number }) {
  const id = useId().replace(/:/g, '')
  const p = Math.max(0, Math.min(1, pct))
  const top = 150 - p * 90
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className="float-art" aria-hidden>
      <defs>
        <clipPath id={`b${id}`}><path d="M40 108c0-34 28-56 64-56 28 0 46 12 54 26h14v28l-12 6c-4 16-14 26-24 30v20h-18v-14H86v14H68v-22c-18-8-28-22-28-32Z"/></clipPath>
        <linearGradient id={`f${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fde047"/><stop offset="1" stopColor="#f59e0b"/></linearGradient>
      </defs>
      <ellipse cx="104" cy="186" rx="64" ry="7" fill="#000" opacity=".18"/>
      <path d="M40 108c0-34 28-56 64-56 28 0 46 12 54 26h14v28l-12 6c-4 16-14 26-24 30v20h-18v-14H86v14H68v-22c-18-8-28-22-28-32Z" fill="#ffd1dc"/>
      <g clipPath={`url(#b${id})`}>
        <rect x="30" y={top} width="160" height="120" fill={`url(#f${id})`} opacity=".9" style={{ transition: 'y 1.2s cubic-bezier(.16,1,.3,1)' }}/>
        <path d={`M30 ${top} q20 -6 40 0 t40 0 t40 0 t40 0 v8 h-160z`} fill="#fde68a" className="wave"/>
      </g>
      <path d="M40 108c0-34 28-56 64-56 28 0 46 12 54 26h14v28l-12 6c-4 16-14 26-24 30v20h-18v-14H86v14H68v-22c-18-8-28-22-28-32Z" fill="none" stroke="#f472b6" strokeWidth="4"/>
      <path d="M78 58l-8-18 20 10" fill="#ffb3c6" stroke="#f472b6" strokeWidth="3" strokeLinejoin="round"/>
      <circle cx="140" cy="88" r="5" fill="#831843"/>
      <ellipse cx="166" cy="92" rx="6" ry="8" fill="#ff9fb8"/>
      <rect x="92" y="50" width="28" height="6" rx="3" fill="#9d174d"/>
      <g className="coin-drop"><circle cx="106" cy="20" r="11" fill="#fbbf24" stroke="#b45309" strokeWidth="2.5"/><text x="106" y="25" textAnchor="middle" fontSize="13" fontWeight="800" fill="#92400e">₫</text></g>
      <text x="100" y="128" textAnchor="middle" fontSize="22" fontWeight="800" fill="#831843">{Math.round(p * 100)}%</text>
    </svg>
  )
}

/** Bé theo độ tuổi: sơ sinh có núm ti, lớn hơn có tóc & má hồng; màu áo theo giới tính */
export function KidArt({ months = 0, gender, size = 200 }: { months?: number; gender?: string | null; size?: number }) {
  const shirt = gender === 'female' ? '#f472b6' : gender === 'male' ? '#38bdf8' : '#a78bfa'
  const baby = months < 12, toddler = months < 48
  const head = baby ? 46 : toddler ? 42 : 38
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className="float-art" aria-hidden>
      <ellipse cx="100" cy="186" rx="56" ry="7" fill="#000" opacity=".18"/>
      <path d={`M${baby ? 56 : 60} 186c0-34 20-52 44-52s44 18 44 52z`} fill={shirt}/>
      {!baby && <path d="M84 140l16 14 16-14" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity=".8"/>}
      <circle cx="100" cy={baby ? 96 : 92} r={head} fill="#ffd7b5"/>
      <circle cx={100 - head} cy={baby ? 98 : 94} r="9" fill="#ffc69c"/><circle cx={100 + head} cy={baby ? 98 : 94} r="9" fill="#ffc69c"/>
      {baby ? <path d="M88 54q12-12 24 0q-12-4-12 6q0-10-12-6z" fill="#7c4a24"/>
        : <path d={`M${100 - head} ${92 - 6}c0-${head} ${head * 2} -${head} ${head * 2} 0c-10-14-24-18-34-10-8-6-22-2-30 10z`} fill="#4a2a14"/>}
      {gender === 'female' && !baby && <circle cx={100 + head - 6} cy={92 - head + 10} r="9" fill="#f472b6"/>}
      <g className="blink"><ellipse cx="84" cy={baby ? 98 : 94} rx="4.5" ry="5.5" fill="#2a1d3a"/><ellipse cx="116" cy={baby ? 98 : 94} rx="4.5" ry="5.5" fill="#2a1d3a"/></g>
      <circle cx="74" cy={baby ? 110 : 106} r="7" fill="#ff9fb8" opacity=".6"/><circle cx="126" cy={baby ? 110 : 106} r="7" fill="#ff9fb8" opacity=".6"/>
      {baby ? <><circle cx="100" cy="118" r="10" fill="#7dd3fc"/><rect x="92" y="114" width="16" height="6" rx="3" fill="#0ea5e9"/></>
        : <path d="M90 112q10 10 20 0" fill="none" stroke="#9d174d" strokeWidth="4" strokeLinecap="round"/>}
      {['⭐', '✨', '🎈'].map((e, i) => <text key={i} x={[26, 160, 150][i]} y={[60, 44, 150][i]} fontSize="18" className="coin-bob" style={{ animationDelay: `${i * .7}s` }}>{e}</text>)}
    </svg>
  )
}
