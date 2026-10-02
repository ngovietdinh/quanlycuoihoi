'use client'
/**
 * Hình minh họa "bé to bằng…" cho từng tuần thai — vẽ tay bằng SVG (khung 120×120).
 * Mỗi loại quả/hạt có dáng & màu riêng; dùng chung các khối tô bóng để nhìn có khối.
 */
import { useId } from 'react'

type G = { id: string }
const L = '#3f7d3a', LL = '#6fbf4a' // lá

// Khối cầu có ánh sáng: màu nền + điểm sáng + bóng tối
function Ball({ id, cx, cy, r, c1, c2, rx, ry }: G & { cx: number; cy: number; r?: number; rx?: number; ry?: number; c1: string; c2: string }) {
  return (
    <>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor={c1}/><stop offset="1" stopColor={c2}/></radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx ?? r} ry={ry ?? r} fill={`url(#${id})`}/>
      <ellipse cx={cx - (rx ?? r!) * 0.35} cy={cy - (ry ?? r!) * 0.4} rx={(rx ?? r!) * 0.22} ry={(ry ?? r!) * 0.13} fill="#fff" opacity=".45" transform={`rotate(-25 ${cx} ${cy})`}/>
    </>
  )
}
const Leaf = ({ d, c = LL }: { d: string; c?: string }) => <path d={d} fill={c} stroke={L} strokeWidth="1.2"/>
const Shadow = ({ w = 34 }: { w?: number }) => <ellipse cx="60" cy="108" rx={w} ry="5" fill="#000" opacity=".12"/>

const ART: Record<string, (g: G) => JSX.Element> = {
  poppy: () => <><Shadow w={14}/>{[[52, 98], [60, 101], [67, 97], [57, 94], [64, 92]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.6" fill="#3a3346"/>)}<circle cx="60" cy="60" r="7" fill="none" stroke="#fff" strokeOpacity=".0"/></>,
  sesame: () => <><Shadow w={16}/>{[[50, 96, -20], [60, 99, 10], [69, 95, 35], [56, 90, 60]].map(([x, y, a], i) => <ellipse key={i} cx={x} cy={y} rx="3.2" ry="5.2" fill="#f3e2b8" stroke="#c9a96a" strokeWidth=".8" transform={`rotate(${a} ${x} ${y})`}/>)}</>,
  lentil: () => <><Shadow w={14}/>{[[52, 96], [64, 97], [58, 90]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="6.5" ry="4.5" fill="#e98a3a" stroke="#b9601f" strokeWidth=".8"/>)}</>,
  blueberry: ({ id }) => <><Shadow w={20}/><Ball id={id} cx={60} cy={84} r={20} c1="#7b8fe0" c2="#2e3a86"/><path d="M53 66l3 4 4-5 4 5 3-4" fill="none" stroke="#1f275e" strokeWidth="2" strokeLinejoin="round"/></>,
  raspberry: ({ id }) => <><Shadow w={22}/><defs><radialGradient id={id} cx="35%" cy="30%"><stop offset="0" stopColor="#ff7a93"/><stop offset="1" stopColor="#b3123d"/></radialGradient></defs>
    {[[48, 72], [60, 68], [72, 72], [44, 84], [56, 82], [68, 82], [78, 84], [50, 95], [62, 95], [72, 94], [60, 104]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="8" fill={`url(#${id})`}/>)}
    <Leaf d="M50 62q10-10 20 0q-10 4-20 0z"/></>,
  grape: ({ id }) => <><Shadow w={22}/><defs><radialGradient id={id} cx="35%" cy="30%"><stop offset="0" stopColor="#c8ee8a"/><stop offset="1" stopColor="#5e9a2a"/></radialGradient></defs>
    {[[48, 50], [62, 48], [76, 52], [54, 62], [68, 62], [46, 74], [60, 76], [74, 74], [53, 88], [67, 88], [60, 100]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" fill={`url(#${id})`} stroke="#4a7d22" strokeWidth=".6"/>)}
    <path d="M62 40V26" stroke="#7a5230" strokeWidth="3" strokeLinecap="round"/><Leaf d="M63 30q16-12 26 2q-14 6-26-2z"/></>,
  kumquat: ({ id }) => <><Shadow w={22}/><Ball id={id} cx={60} cy={80} rx={22} ry={26} c1="#ffc069" c2="#f07f13"/><Leaf d="M60 54q8-14 22-8q-10 10-22 8z"/></>,
  fig: ({ id }) => <><Shadow w={24}/><path d="M60 40c6 0 6 10 12 18 10 12 16 22 12 34-4 12-18 16-24 16s-20-4-24-16c-4-12 2-22 12-34 6-8 6-18 12-18z" fill="#6b2d5c"/><Ball id={id} cx={58} cy={88} rx={20} ry={18} c1="#9b4d8a" c2="#5a1f4d"/><path d="M60 40v-8" stroke="#5a7d2a" strokeWidth="3" strokeLinecap="round"/></>,
  lime: ({ id }) => <><Shadow w={28}/><Ball id={id} cx={60} cy={76} rx={30} ry={28} c1="#b5e86b" c2="#3f8f1f"/><circle cx="88" cy="74" r="2.5" fill="#2f6b16"/></>,
  peach: ({ id }) => <><Shadow w={30}/><Ball id={id} cx={60} cy={74} r={32} c1="#ffd2a1" c2="#f0617a"/><path d="M60 44c-6 14-6 40 2 60" fill="none" stroke="#d94b66" strokeWidth="2" opacity=".5"/><Leaf d="M61 44q12-16 26-8q-12 12-26 8z"/></>,
  lemon: ({ id }) => <><Shadow w={34}/><Ball id={id} cx={60} cy={74} rx={38} ry={28} c1="#fff27a" c2="#f2b705"/><path d="M20 74q2-4 4-2M100 74q-2-4-4-2" stroke="#e0a400" strokeWidth="4" strokeLinecap="round"/></>,
  apple: ({ id }) => <><Shadow w={34}/><path d="M60 46c-10-8-36-6-38 22-2 22 14 40 26 40 6 0 8-3 12-3s6 3 12 3c12 0 28-18 26-40-2-28-28-30-38-22z" fill={`url(#${id})`}/><defs><radialGradient id={id} cx="35%" cy="30%"><stop offset="0" stopColor="#ff8a7a"/><stop offset="1" stopColor="#c81d25"/></radialGradient></defs>
    <path d="M60 48c0-8 2-14 6-18" stroke="#6b4423" strokeWidth="3" strokeLinecap="round" fill="none"/><Leaf d="M66 36q12-14 24-4q-12 10-24 4z"/><ellipse cx="42" cy="62" rx="7" ry="4" fill="#fff" opacity=".4" transform="rotate(-30 42 62)"/></>,
  avocado: ({ id }) => <><Shadow w={28}/><path d="M60 22c14 0 18 18 24 36 6 20 4 50-24 50S30 78 36 58c6-18 10-36 24-36z" fill="#3d6b2a"/><path d="M60 28c10 0 14 16 19 32 5 17 3 42-19 42S36 77 41 60c5-16 9-32 19-32z" fill="#d6ea8a"/><Ball id={id} cx={60} cy={78} r={14} c1="#b8763d" c2="#6b3a14"/></>,
  onion: ({ id }) => <><Shadow w={30}/><path d="M60 20c4 14 34 26 34 54 0 20-16 34-34 34S26 94 26 74c0-28 30-40 34-54z" fill={`url(#${id})`}/><defs><radialGradient id={id} cx="35%" cy="35%"><stop offset="0" stopColor="#d99ad0"/><stop offset="1" stopColor="#7b2d6e"/></radialGradient></defs>
    {[-14, 0, 14].map(d => <path key={d} d={`M60 26c${d / 2} 20 ${d} 50 ${d / 2} 80`} stroke="#5b1f52" strokeWidth="1.2" fill="none" opacity=".5"/>)}<path d="M56 108l-3 6M60 108v7M64 108l3 6" stroke="#c9b48a" strokeWidth="1.5"/></>,
  pepper: ({ id }) => <><Shadow w={32}/><defs><radialGradient id={id} cx="35%" cy="30%"><stop offset="0" stopColor="#ff6a5a"/><stop offset="1" stopColor="#b8120d"/></radialGradient></defs>
    <path d="M36 44c8-6 16-2 24-2s16-4 24 2c10 8 8 30 4 44-4 14-12 20-18 18-4-1-6-4-10-4s-6 3-10 4c-6 2-14-4-18-18-4-14-6-36 4-44z" fill={`url(#${id})`}/><path d="M60 44v18" stroke="#8f0d09" strokeWidth="1.5" opacity=".4"/>
    <path d="M52 44c0-6 4-10 8-10s8 4 8 10" fill="#3f8f1f"/><path d="M60 34v-12q4-4 8-2" stroke="#3f7d3a" strokeWidth="4" strokeLinecap="round" fill="none"/></>,
  mango: ({ id }) => <><Shadow w={34}/><defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9ccf3e"/><stop offset=".45" stopColor="#ffc93c"/><stop offset="1" stopColor="#f2603a"/></linearGradient></defs>
    <path d="M30 70c-4-26 20-42 46-36 22 6 26 34 14 52-10 16-32 24-46 16-8-4-12-14-14-32z" fill={`url(#${id})`}/><path d="M74 34q4-10 2-14" stroke="#6b4423" strokeWidth="3" strokeLinecap="round"/><ellipse cx="50" cy="56" rx="9" ry="5" fill="#fff" opacity=".35" transform="rotate(-30 50 56)"/></>,
  banana: () => <><Shadow w={38}/><path d="M22 52c6 34 34 54 70 40 8-3 10-8 8-10-26 12-56-2-66-34-2-6-14-4-12 4z" fill="#ffd93b" stroke="#c99a0c" strokeWidth="1.5"/><path d="M28 54c8 26 30 40 58 34" stroke="#f2b705" strokeWidth="3" fill="none" opacity=".6"/><path d="M22 52l-6-4" stroke="#5a4a1c" strokeWidth="4" strokeLinecap="round"/><path d="M100 82l4 2" stroke="#3d3214" strokeWidth="4" strokeLinecap="round"/></>,
  carrot: () => <><Shadow w={14}/><path d="M48 38h24c2 24-6 54-12 72-6-18-14-48-12-72z" fill="#ff8a1f" stroke="#d1610b" strokeWidth="1.5"/>{[52, 62, 74, 86].map(y => <path key={y} d={`M${52 + (y - 52) / 8} ${y}h${6 - (y - 52) / 12}`} stroke="#d1610b" strokeWidth="1.6" strokeLinecap="round"/>)}
    <Leaf d="M58 38c-8-14-14-20-10-24 6 4 8 12 10 24z"/><Leaf d="M60 38c0-16 2-24 6-24 2 6-2 14-6 24z"/><Leaf d="M62 38c6-14 12-20 16-16-4 6-10 10-16 16z"/></>,
  papaya: ({ id }) => <><Shadow w={36}/><defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7fb83a"/><stop offset=".5" stopColor="#ffb43b"/><stop offset="1" stopColor="#ff8a1f"/></linearGradient></defs>
    <path d="M18 72c0-18 20-26 44-26s40 8 40 26-16 30-40 30-44-12-44-30z" fill={`url(#${id})`}/><path d="M22 72h76" stroke="#d1610b" strokeWidth="1.2" opacity=".35"/><path d="M100 70l8-4" stroke="#5a7d2a" strokeWidth="4" strokeLinecap="round"/></>,
  grapefruit: ({ id }) => <><Shadow w={38}/><Ball id={id} cx={60} cy={70} r={38} c1="#ffd08a" c2="#f2742c"/>{[-1, 1].map(s => <circle key={s} cx={60 + s * 12} cy={58} r="1.4" fill="#d1610b" opacity=".5"/>)}<Leaf d="M60 32q10-16 26-10q-12 12-26 10z"/></>,
  corn: ({ id }) => <><Shadow w={22}/><defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffd84a"/><stop offset=".5" stopColor="#ffe98a"/><stop offset="1" stopColor="#f2b705"/></linearGradient></defs>
    <path d="M60 12c14 0 20 22 20 48s-8 44-20 44-20-18-20-44 6-48 20-48z" fill={`url(#${id})`}/>
    {Array.from({ length: 12 }).map((_, r) => [-12, -4, 4, 12].map(c => <ellipse key={`${r}${c}`} cx={60 + c * (1 - Math.abs(r - 6) / 14)} cy={22 + r * 7} rx="3.2" ry="2.8" fill="#ffe36a" stroke="#d9a400" strokeWidth=".7"/>))}
    <path d="M60 110c-22-4-30-30-28-58 6 16 12 30 28 42z" fill="#7cc34a" stroke={L} strokeWidth="1.3"/><path d="M60 110c22-4 30-30 28-58-6 16-12 30-28 42z" fill="#5ea83a" stroke={L} strokeWidth="1.3"/><path d="M60 110c-2 4-6 6-10 6" stroke={L} strokeWidth="3" strokeLinecap="round" fill="none"/></>,
  cauliflower: () => <><Shadow w={38}/><Leaf d="M20 80c4-18 18-22 30-12-8 6-14 18-12 32-10-4-18-10-18-20z"/><Leaf d="M100 80c-4-18-18-22-30-12 8 6 14 18 12 32 10-4 18-10 18-20z"/>
    {[[46, 56, 16], [62, 50, 17], [76, 60, 15], [40, 72, 15], [58, 68, 18], [78, 76, 15], [52, 86, 15], [68, 88, 15]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fbf6e6" stroke="#e2d6b0" strokeWidth="1.5"/>)}<Leaf d="M38 96c8-6 16-6 22 4 6-10 14-10 22-4-8 10-36 10-44 0z" c="#7cc34a"/></>,
  lettuce: () => <><Shadow w={40}/>{[[30, '#9fdc5c'], [44, '#7cc34a'], [58, '#b6e57a'], [72, '#7cc34a'], [86, '#9fdc5c']].map(([x, c], i) => <path key={i} d={`M${x} 104c-14-20-14-50 0-66 8 12 14 30 10 66z`} fill={c as string} stroke={L} strokeWidth="1.3" transform={`rotate(${(i - 2) * 14} 60 104)`}/>)}<path d="M50 104c2-10 18-10 20 0z" fill="#e8f5c8"/></>,
  cabbage: ({ id }) => <><Shadow w={40}/><Ball id={id} cx={60} cy={70} r={38} c1="#d9f2b0" c2="#6fae3a"/>{[-22, -8, 8, 22].map(d => <path key={d} d={`M60 104c${d / 3}-20 ${d}-46 ${d * 1.2}-66`} stroke="#4d8a24" strokeWidth="1.4" fill="none" opacity=".55"/>)}<path d="M24 76c-4-22 10-40 30-44-14 12-20 26-18 46z" fill="#9fdc5c" stroke={L} strokeWidth="1.3"/></>,
  eggplant: ({ id }) => <><Shadow w={30}/><defs><radialGradient id={id} cx="35%" cy="30%"><stop offset="0" stopColor="#9b6bd8"/><stop offset="1" stopColor="#3f1d6b"/></radialGradient></defs>
    <path d="M70 28c16 4 22 26 16 50-6 24-24 32-38 28-14-4-18-20-10-40 8-18 16-42 32-38z" fill={`url(#${id})`}/><path d="M64 26c4-6 14-8 18-2-2 4-6 6-6 10-4-4-8-6-12-8z" fill="#5ea83a"/><path d="M74 24l4-10" stroke="#3f7d3a" strokeWidth="4" strokeLinecap="round"/><ellipse cx="56" cy="62" rx="6" ry="12" fill="#fff" opacity=".25" transform="rotate(25 56 62)"/></>,
  pumpkin: ({ id }) => <><Shadow w={42}/><defs><radialGradient id={id} cx="40%" cy="35%"><stop offset="0" stopColor="#ffb25b"/><stop offset="1" stopColor="#d9570f"/></radialGradient></defs>
    {[[34, 22], [48, 26], [72, 26], [86, 22], [60, 28]].map(([x, rx], i) => <ellipse key={i} cx={x} cy="74" rx={rx} ry="32" fill={`url(#${id})`} stroke="#b8470c" strokeWidth="1.2"/>)}<path d="M60 44c0-8 2-14 8-18" stroke="#5a7d2a" strokeWidth="5" strokeLinecap="round" fill="none"/></>,
  coconut: ({ id }) => <><Shadow w={36}/><Ball id={id} cx={60} cy={72} r={36} c1="#a8743f" c2="#4a2a10"/>{[[50, 48], [62, 44], [56, 58]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#2a1606"/>)}{[0, 1, 2, 3, 4].map(i => <path key={i} d={`M${30 + i * 15} ${92 - (i % 2) * 6}l4 -6`} stroke="#d9b98a" strokeWidth="1.2" opacity=".5"/>)}</>,
  pineapple: ({ id }) => <><Shadow w={30}/><defs><radialGradient id={id} cx="40%" cy="35%"><stop offset="0" stopColor="#ffd45a"/><stop offset="1" stopColor="#d98a0c"/></radialGradient><clipPath id={`${id}c`}><ellipse cx="60" cy="80" rx="28" ry="32"/></clipPath></defs>
    {[-50, -25, 0, 25, 50].map((a, i) => <path key={i} d="M60 54Q51 36 60 14Q69 36 60 54Z" fill={i % 2 ? '#5ea83a' : '#3f8f1f'} stroke={L} strokeWidth="1" transform={`rotate(${a} 60 54)`}/>)}
    <ellipse cx="60" cy="80" rx="28" ry="32" fill={`url(#${id})`}/>
    <g clipPath={`url(#${id}c)`} stroke="#b8700a" strokeWidth="1.3" opacity=".65">{[-3, -2, -1, 0, 1, 2, 3].map(k => <path key={`a${k}`} d={`M${30 + k * 11} 46l36 70`}/>)}{[-3, -2, -1, 0, 1, 2, 3].map(k => <path key={`b${k}`} d={`M${90 + k * 11} 46l-36 70`}/>)}</g></>,
  cantaloupe: ({ id }) => <><Shadow w={40}/><Ball id={id} cx={60} cy={70} r={38} c1="#ecdba8" c2="#a8935a"/><defs><clipPath id={`${id}c`}><circle cx="60" cy="70" r="37"/></clipPath></defs><g clipPath={`url(#${id}c)`}>{[0, 1, 2, 3, 4, 5].map(i => <path key={i} d={`M${26 + i * 13} 46q8 24 0 50`} stroke="#fff6d8" strokeWidth="1.3" fill="none" opacity=".7"/>)}{[0, 1, 2, 3].map(i => <path key={`h${i}`} d={`M28 ${54 + i * 12}q32 6 64 0`} stroke="#fff6d8" strokeWidth="1.3" fill="none" opacity=".6"/>)}</g></>,
  honeydew: ({ id }) => <><Shadow w={40}/><Ball id={id} cx={60} cy={70} rx={42} ry={34} c1="#f1f8c8" c2="#a9cc5a"/><path d="M98 66l6-2" stroke="#7a9a3a" strokeWidth="3" strokeLinecap="round"/></>,
  bokchoy: () => <><Shadow w={30}/>{[-26, -12, 0, 12, 26].map((a, i) => <g key={i} transform={`rotate(${a} 60 106)`}><path d="M56 106V58h8v48z" fill="#f2f7e4" stroke="#c9d9a8" strokeWidth="1"/><path d="M60 64c-16-6-18-34 0-48 18 14 16 42 0 48z" fill={i % 2 ? '#4d9a2a' : '#3f8a24'} stroke={L} strokeWidth="1.2"/></g>)}</>,
  watermelon: ({ id }) => <><Shadow w={46}/><defs><radialGradient id={id} cx="35%" cy="30%"><stop offset="0" stopColor="#8fd16a"/><stop offset="1" stopColor="#2e7d1f"/></radialGradient></defs>
    <ellipse cx="60" cy="70" rx="48" ry="36" fill={`url(#${id})`}/>{[-30, -15, 0, 15, 30].map(d => <path key={d} d={`M${60 + d * 0.3} 34c${d}  10 ${d * 1.1} 60 ${d * 0.3} 72`} stroke="#1f5a14" strokeWidth="5" fill="none" opacity=".75"/>)}<ellipse cx="38" cy="52" rx="10" ry="5" fill="#fff" opacity=".3" transform="rotate(-25 38 52)"/></>,
}

/** Tên tiếng Việt trong FETAL → hình vẽ */
export function produceKey(name: string): string {
  const n = name.toLowerCase()
  const map: [string, string][] = [
    ['anh túc', 'poppy'], ['vừng', 'sesame'], ['đậu lăng', 'lentil'], ['việt quất', 'blueberry'], ['mâm xôi', 'raspberry'], ['nho', 'grape'],
    ['quất', 'kumquat'], ['sung', 'fig'], ['chanh vàng', 'lemon'], ['chanh', 'lime'], ['đào', 'peach'], ['táo', 'apple'], ['bơ', 'avocado'],
    ['hành', 'onion'], ['ớt', 'pepper'], ['xoài', 'mango'], ['chuối', 'banana'], ['cà rốt', 'carrot'], ['đu đủ', 'papaya'], ['bưởi', 'grapefruit'],
    ['bí', 'pumpkin'], ['ngô', 'corn'], ['súp lơ', 'cauliflower'], ['xà lách', 'lettuce'], ['bắp cải', 'cabbage'], ['cà tím', 'eggplant'],
    ['dừa', 'coconut'], ['dứa', 'pineapple'], ['dưa lưới', 'cantaloupe'], ['dưa lê', 'honeydew'], ['cải chíp', 'bokchoy'], ['dưa hấu', 'watermelon'],
  ]
  return map.find(([k]) => n.includes(k))?.[1] ?? 'lime'
}

export function Produce({ name, size = 160, className }: { name: string; size?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  const key = produceKey(name)
  const draw = ART[key]
  // Hạt rất nhỏ: phóng to như nhìn qua kính lúp để vẫn thấy rõ hình
  const tiny = key === 'poppy' || key === 'sesame' || key === 'lentil'
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} role="img" aria-label={name}>
      {tiny ? <>
        <circle cx="60" cy="60" r="44" fill="#fff" fillOpacity=".14" stroke="#fff" strokeOpacity=".5" strokeWidth="3"/>
        <path d="M91 91l18 18" stroke="#fff" strokeOpacity=".6" strokeWidth="7" strokeLinecap="round"/>
        <g transform="translate(60 64) scale(2.6) translate(-60 -96)">{draw({ id: `pg${id}` })}</g>
      </> : draw({ id: `pg${id}` })}
    </svg>
  )
}
