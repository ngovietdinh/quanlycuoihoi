import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isPast, isToday, isTomorrow } from 'date-fns'
import { vi } from 'date-fns/locale'

export const cn = (...i: ClassValue[]) => twMerge(clsx(i))
export const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(n)
export const formatDate = (d: string|null|undefined) =>
  d ? format(new Date(d),'dd/MM/yyyy',{locale:vi}) : '—'
export function getDeadlineLabel(date: string|null) {
  if (!date) return {label:'Không có hạn',urgent:false,overdue:false}
  const d = new Date(date)
  if (isPast(d)&&!isToday(d)) return {label:`Quá hạn ${formatDate(date)}`,urgent:true,overdue:true}
  if (isToday(d))    return {label:'Hôm nay',  urgent:true, overdue:false}
  if (isTomorrow(d)) return {label:'Ngày mai', urgent:true, overdue:false}
  return {label:formatDate(date),urgent:false,overdue:false}
}
export const calcProgress  = (c:number,t:number) => t===0?0:Math.round(c/t*100)
export const calcRemaining = (b:number,s:number) => b-s
export const daysUntilEvent = (d:string|null) =>
  d ? Math.ceil((new Date(d).getTime()-Date.now())/86400000) : null
export const getInitials = (n:string|null|undefined) =>
  n ? n.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase() : '?'
export const STATUS_LABELS: Record<string,string> = {
  todo:'Chưa làm', in_progress:'Đang thực hiện', done:'Hoàn thành'
}
export const PRIORITY_LABELS: Record<string,string> = {
  low:'Thấp', medium:'Trung bình', high:'Cao'
}
