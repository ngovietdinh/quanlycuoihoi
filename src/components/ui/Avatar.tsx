import { cn } from '@/lib/utils'

interface AvatarProps { name?: string | null; url?: string | null; size?: 'xs'|'sm'|'md'|'lg'; className?: string }

const sizes = { xs:'w-6 h-6 text-xs', sm:'w-8 h-8 text-sm', md:'w-9 h-9 text-sm', lg:'w-11 h-11 text-base' }

const palette = ['bg-rose-400','bg-amber-400','bg-emerald-400','bg-sky-400','bg-violet-400','bg-pink-400']

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function getColor(name?: string | null) {
  if (!name) return palette[0]
  return palette[name.charCodeAt(0) % palette.length]
}

export function Avatar({ name, url, size = 'md', className }: AvatarProps) {
  if (url) {
    return <img src={url} alt={name||''} className={cn('rounded-full object-cover flex-shrink-0', sizes[size], className)} />
  }
  return (
    <div className={cn('rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white', getColor(name), sizes[size], className)}>
      {getInitials(name)}
    </div>
  )
}

export function AvatarGroup({ names, max = 3 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max)
  const rest  = names.length - max
  return (
    <div className="flex -space-x-2">
      {shown.map((n, i) => <Avatar key={i} name={n} size="sm" className="ring-2 ring-white" />)}
      {rest > 0 && <div className="w-8 h-8 rounded-full bg-stone-200 ring-2 ring-white flex items-center justify-center text-xs font-medium text-stone-600">+{rest}</div>}
    </div>
  )
}
