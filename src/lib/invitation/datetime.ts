// Định dạng ngày giờ theo múi giờ Việt Nam + đổi sang âm lịch (thuật toán Hồ Ngọc Đức)
const TZ = 'Asia/Ho_Chi_Minh'
const { floor, sin, PI } = Math

export function vnParts(iso: string) {
  const d = new Date(iso)
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false,
  }).formatToParts(d).map(p => [p.type, p.value]))
  const WD: Record<string, string> = { Mon:'Thứ Hai', Tue:'Thứ Ba', Wed:'Thứ Tư', Thu:'Thứ Năm', Fri:'Thứ Sáu', Sat:'Thứ Bảy', Sun:'Chủ Nhật' }
  return {
    day: +parts.day, month: +parts.month, year: +parts.year,
    hour: parts.hour === '24' ? '00' : parts.hour, minute: parts.minute, weekday: WD[parts.weekday] ?? parts.weekday,
  }
}

export const fmtTime = (iso: string) => { const p = vnParts(iso); return `${p.hour}:${p.minute}` }
export const fmtDay  = (iso: string) => { const p = vnParts(iso); return `${String(p.day).padStart(2,'0')}.${String(p.month).padStart(2,'0')}.${p.year}` }
export const fmtLong = (iso: string) => { const p = vnParts(iso); return `${p.weekday}, ngày ${p.day} tháng ${p.month} năm ${p.year}` }

function jdFromDate(dd: number, mm: number, yy: number) {
  const a = floor((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3
  let jd = dd + floor((153 * m + 2) / 5) + 365 * y + floor(y / 4) - floor(y / 100) + floor(y / 400) - 32045
  if (jd < 2299161) jd = dd + floor((153 * m + 2) / 5) + 365 * y + floor(y / 4) - 32083
  return jd
}
function newMoonDay(k: number, tz: number) {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3
  Jd1 += 0.00033 * sin((166.56 + 132.87 * T - 0.009173 * T2) * dr)
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3
  let C1 = (0.1734 - 0.000393 * T) * sin(M * dr) + 0.0021 * sin(2 * dr * M)
  C1 = C1 - 0.4068 * sin(Mpr * dr) + 0.0161 * sin(dr * 2 * Mpr) - 0.0004 * sin(dr * 3 * Mpr)
  C1 = C1 + 0.0104 * sin(dr * 2 * F) - 0.0051 * sin(dr * (M + Mpr)) - 0.0074 * sin(dr * (M - Mpr))
  C1 = C1 + 0.0004 * sin(dr * (2 * F + M)) - 0.0004 * sin(dr * (2 * F - M)) - 0.0006 * sin(dr * (2 * F + Mpr))
  C1 = C1 + 0.0010 * sin(dr * (2 * F - Mpr)) + 0.0005 * sin(dr * (2 * Mpr + M))
  const deltat = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2
  return floor(Jd1 + C1 - deltat + 0.5 + tz / 24)
}
function sunLongitude(jdn: number, tz: number) {
  const T = (jdn - 2451545.5 - tz / 24) / 36525, T2 = T * T, dr = PI / 180
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2
  let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * sin(dr * M)
  DL += (0.019993 - 0.000101 * T) * sin(dr * 2 * M) + 0.000290 * sin(dr * 3 * M)
  let L = (L0 + DL) * dr
  L = L - PI * 2 * floor(L / (PI * 2))
  return floor(L / PI * 6)
}
function lunarMonth11(yy: number, tz: number) {
  const k = floor((jdFromDate(31, 12, yy) - 2415021) / 29.530588853)
  let nm = newMoonDay(k, tz)
  if (sunLongitude(nm, tz) >= 9) nm = newMoonDay(k - 1, tz)
  return nm
}
function leapMonthOffset(a11: number, tz: number) {
  const k = floor((a11 - 2415021.076998695) / 29.530588853 + 0.5)
  let last = 0, i = 1, arc = sunLongitude(newMoonDay(k + i, tz), tz)
  do { last = arc; i++; arc = sunLongitude(newMoonDay(k + i, tz), tz) } while (arc !== last && i < 14)
  return i - 1
}

export function solarToLunar(dd: number, mm: number, yy: number, tz = 7) {
  const dayNumber = jdFromDate(dd, mm, yy)
  const k = floor((dayNumber - 2415021.076998695) / 29.530588853)
  let monthStart = newMoonDay(k + 1, tz)
  if (monthStart > dayNumber) monthStart = newMoonDay(k, tz)
  let a11 = lunarMonth11(yy, tz), b11 = a11, lunarYear: number
  if (a11 >= monthStart) { lunarYear = yy; a11 = lunarMonth11(yy - 1, tz) }
  else { lunarYear = yy + 1; b11 = lunarMonth11(yy + 1, tz) }
  const lunarDay = dayNumber - monthStart + 1
  const diff = floor((monthStart - a11) / 29)
  let leap = false, lunarMonth = diff + 11
  if (b11 - a11 > 365) {
    const leapDiff = leapMonthOffset(a11, tz)
    if (diff >= leapDiff) { lunarMonth = diff + 10; if (diff === leapDiff) leap = true }
  }
  if (lunarMonth > 12) lunarMonth -= 12
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap }
}

const CAN = ['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý']
const CHI = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi']
export const canChiYear = (y: number) => `${CAN[(y + 6) % 10]} ${CHI[(y + 8) % 12]}`

/** "Nhằm ngày 12 tháng 10 năm Giáp Thìn" */
export function lunarText(iso: string) {
  const p = vnParts(iso)
  const l = solarToLunar(p.day, p.month, p.year)
  return `Nhằm ngày ${l.day} tháng ${l.month}${l.leap ? ' (nhuận)' : ''} năm ${canChiYear(l.year)}`
}

// ── Lịch ──────────────────────────────────────────────────────────────────────
const icsStamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
export function googleCalendarUrl(title: string, startIso: string, location: string, details: string, hours = 3) {
  const s = new Date(startIso), e = new Date(s.getTime() + hours * 3600e3)
  const q = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${icsStamp(s)}/${icsStamp(e)}`, location, details })
  return `https://calendar.google.com/calendar/render?${q}`
}
export function icsDataUrl(title: string, startIso: string, location: string, details: string, hours = 3) {
  const s = new Date(startIso), e = new Date(s.getTime() + hours * 3600e3)
  const esc = (t: string) => t.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
  const body = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//HySu//Wedding//VI','BEGIN:VEVENT',
    `UID:${icsStamp(s)}-${Math.random().toString(36).slice(2)}@hysu`, `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(s)}`, `DTEND:${icsStamp(e)}`, `SUMMARY:${esc(title)}`, `LOCATION:${esc(location)}`, `DESCRIPTION:${esc(details)}`,
    'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:Nhắc lịch đám cưới','END:VALARM',
    'END:VEVENT','END:VCALENDAR'].join('\r\n')
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(body)
}
export const mapEmbedUrl = (address: string) => `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
export const mapLinkUrl  = (address: string, custom?: string) => custom || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
