import { cn } from '@/lib/utils'

interface SkeletonProps { className?: string; lines?: number }

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100 bg-[length:200%_100%] rounded-lg', className)} style={{ animation: 'shimmer 1.8s infinite' }} />
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-rose-100/60 bg-white shadow-soft p-5 space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-2 w-full mt-4" />
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  )
}

export function KanbanCardSkeleton() {
  return (
    <div className="rounded-xl border border-stone-100 bg-white p-4 space-y-2.5">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}
