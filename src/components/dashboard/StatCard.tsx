import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'

interface StatCardProps {
  title: string
  value: string | number
  sub?: string
  icon: string
  trend?: { value: number; label: string }
  color?: 'rose' | 'amber' | 'emerald' | 'sky'
  className?: string
}

const colorMap = {
  rose:    { bg: 'bg-rose-50',    icon: 'bg-rose-100   text-rose-500',    text: 'text-rose-600',    bar: 'bg-rose-200' },
  amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-100  text-amber-500',   text: 'text-amber-600',   bar: 'bg-amber-200' },
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-500', text: 'text-emerald-600', bar: 'bg-emerald-200' },
  sky:     { bg: 'bg-sky-50',     icon: 'bg-sky-100    text-sky-500',     text: 'text-sky-600',     bar: 'bg-sky-200' },
}

export function StatCard({ title, value, sub, icon, trend, color = 'rose', className }: StatCardProps) {
  const c = colorMap[color]
  return (
    <Card hover className={cn('p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0', c.icon)}>
          {icon}
        </div>
        {trend && (
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', trend.value >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-xs text-stone-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-stone-900 mt-0.5 font-display tracking-tight">{value}</p>
        {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
      </div>
    </Card>
  )
}
