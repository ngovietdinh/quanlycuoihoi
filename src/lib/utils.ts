import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isPast, isToday, isTomorrow } from 'date-fns'
import { vi } from 'date-fns/locale'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)

export const formatDate = (d: string | null | undefined) =>
  d ? format(new Date(d), 'dd/MM/yyyy', { locale: vi }) : '—'

export const formatDateFull = (d: string | null | undefined) =>
  d ? format(new Date(d), "EEEE, dd 'tháng' MM yyyy", { locale: vi }) : '—'

export function getDeadlineLabel(date: string | null) {
  if (!date) return { label: 'Không có hạn', urgent: false, overdue: false }
  const d = new Date(date)
  if (isPast(d) && !isToday(d)) return { label: `Quá hạn ${formatDate(date)}`, urgent: true, overdue: true }
  if (isToday(d))    return { label: 'Hôm nay',  urgent: true,  overdue: false }
  if (isTomorrow(d)) return { label: 'Ngày mai', urgent: true,  overdue: false }
  return { label: formatDate(date), urgent: false, overdue: false }
}

export const calcProgress = (completed: number, total: number) =>
  total === 0 ? 0 : Math.round((completed / total) * 100)

export const calcRemaining = (budget: number, spent: number) => budget - spent

export const daysUntilEvent = (eventDate: string | null): number | null =>
  eventDate ? Math.ceil((new Date(eventDate).getTime() - Date.now()) / 86400000) : null

export const getInitials = (name: string | null | undefined) =>
  name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?'

export const STATUS_LABELS: Record<string, string> = {
  todo: 'Chưa làm', in_progress: 'Đang thực hiện', done: 'Hoàn thành',
}
export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Thấp', medium: 'Trung bình', high: 'Cao',
}
