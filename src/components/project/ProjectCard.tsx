'use client'
import Link from 'next/link'
import { Card, CardBody, CardFooter } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, calcProgress, daysUntilEvent } from '@/lib/utils'
import type { ProjectSummary } from '@/types'

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const progress  = calcProgress(project.completed_tasks, project.total_tasks)
  const days      = daysUntilEvent(project.event_date)
  const remaining = project.budget_total - project.total_spent
  const overBudget = remaining < 0

  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <Card hover gradient className="overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-rose-300 via-rose-400 to-amber-300" />

        <CardBody className="pt-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-stone-900 text-base leading-snug group-hover:text-rose-600 transition-colors line-clamp-2">
                {project.name}
              </h3>
              {project.venue && (
                <p className="text-xs text-stone-400 mt-0.5 truncate">📍 {project.venue}</p>
              )}
            </div>
            {days !== null && (
              <Badge
                variant={days < 0 ? 'done' : days <= 7 ? 'overdue' : days <= 30 ? 'in_progress' : 'default'}
                className="flex-shrink-0 text-[10px]"
              >
                {days < 0 ? 'Đã qua' : days === 0 ? 'Hôm nay' : `${days}d`}
              </Badge>
            )}
          </div>

          {/* Event date */}
          {project.event_date && (
            <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-4">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {formatDate(project.event_date)}
              {days !== null && days > 0 && (
                <span className="text-rose-400 font-medium">· còn {days} ngày</span>
              )}
            </div>
          )}

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-stone-500">Tiến độ</span>
              <span className="font-semibold text-stone-700 tabular-nums">{progress}%</span>
            </div>
            <ProgressBar value={progress} size="sm" />
            <p className="text-xs text-stone-400 mt-1">
              {project.completed_tasks}/{project.total_tasks} đầu mục
            </p>
          </div>

          {/* Budget row */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-xl">
            <div className="text-center">
              <p className="text-[10px] text-stone-400 mb-0.5">Ngân sách</p>
              <p className="text-xs font-semibold text-stone-700">{formatCurrency(project.budget_total)}</p>
            </div>
            <div className="text-center border-x border-stone-200">
              <p className="text-[10px] text-stone-400 mb-0.5">Đã chi</p>
              <p className="text-xs font-semibold text-rose-500">{formatCurrency(project.total_spent)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-stone-400 mb-0.5">Còn lại</p>
              <p className={`text-xs font-semibold ${overBudget ? 'text-red-500' : 'text-emerald-600'}`}>
                {formatCurrency(Math.abs(remaining))}
              </p>
            </div>
          </div>
        </CardBody>

        <CardFooter className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-300" />
            <div className="w-2 h-2 rounded-full bg-amber-300" />
            <div className="w-2 h-2 rounded-full bg-emerald-300" />
          </div>
          <span className="text-xs text-stone-400 group-hover:text-rose-500 transition-colors flex items-center gap-1">
            Xem chi tiết
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}
