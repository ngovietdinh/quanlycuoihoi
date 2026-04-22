import { cn } from '@/lib/utils'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon = '🌸', title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-3xl mb-4 shadow-inner">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold text-stone-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-stone-500 max-w-xs mb-5">{description}</p>}
      {action && <Button onClick={action.onClick} size="sm">{action.label}</Button>}
    </div>
  )
}
