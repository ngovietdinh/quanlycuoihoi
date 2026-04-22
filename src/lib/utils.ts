import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns'
import { vi } from 'date-fns/locale'

export const cn = (...i: ClassValue[]) => twMerge(clsx(i))

export const vnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)

export const fmtDate = (d?: string | null) =>
  d ? format(new Date(d), 'dd/MM/yyyy', { locale: vi }) : '—'

export const fmtDateFull = (d?: string | null) =>
  d ? format(new Date(d), "EEEE, dd 'tháng' MM yyyy", { locale: vi }) : '—'

export function deadlineInfo(date: string | null) {
  if (!date) return { label: 'Không hạn', urgent: false, overdue: false, days: null }
  const d = new Date(date)
  const days = differenceInDays(d, new Date())
  if (isPast(d) && !isToday(d)) return { label: `Quá hạn ${fmtDate(date)}`, urgent: true, overdue: true, days }
  if (isToday(d))    return { label: 'Hôm nay', urgent: true,  overdue: false, days: 0 }
  if (isTomorrow(d)) return { label: 'Ngày mai', urgent: true, overdue: false, days: 1 }
  if (days <= 7)     return { label: `${days} ngày nữa`, urgent: true, overdue: false, days }
  return { label: fmtDate(date), urgent: false, overdue: false, days }
}

export const pct = (done: number, total: number) =>
  total === 0 ? 0 : Math.round((done / total) * 100)

export const daysTo = (d: string | null): number | null =>
  d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null

export const STATUS_LABELS: Record<string, string> = {
  todo: 'Chưa làm', in_progress: 'Đang thực hiện', done: 'Hoàn thành',
}
export const PRI_LABELS: Record<string, string> = {
  low: 'Thấp', medium: 'Trung bình', high: 'Cao',
}
export const EXPENSE_CATEGORIES = [
  'Trang phục', 'Tiệc & đồ ăn', 'Hoa & trang trí', 'Chụp ảnh / quay phim',
  'Thiệp mời', 'Mâm quả lễ vật', 'Di chuyển', 'Khác',
]
