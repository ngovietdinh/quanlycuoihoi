'use client'
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'
interface Toast { id: string; type: ToastType; title: string; message?: string }

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void
  success: (title: string, message?: string) => void
  error:   (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info:    (title: string, message?: string) => void
}

const ToastCtx = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const icons: Record<ToastType, string> = {
  success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️'
}
const styles: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50',
  error:   'border-red-200    bg-red-50',
  warning: 'border-amber-200  bg-amber-50',
  info:    'border-sky-200    bg-sky-50',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const remove = useCallback((id: string) => setToasts(t => t.filter(x => x.id !== id)), [])

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = String(++counter.current)
    setToasts(t => [...t.slice(-4), { ...opts, id }])
    setTimeout(() => remove(id), 4000)
  }, [remove])

  const success = useCallback((title: string, message?: string) => toast({ type: 'success', title, message }), [toast])
  const error   = useCallback((title: string, message?: string) => toast({ type: 'error',   title, message }), [toast])
  const warning = useCallback((title: string, message?: string) => toast({ type: 'warning', title, message }), [toast])
  const info    = useCallback((title: string, message?: string) => toast({ type: 'info',    title, message }), [toast])

  return (
    <ToastCtx.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-20 sm:bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg max-w-sm w-full',
              styles[t.type]
            )}
            style={{ animation: 'slideInRight 0.25s ease' }}
          >
            <span className="text-base flex-shrink-0 mt-0.5">{icons[t.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800">{t.title}</p>
              {t.message && <p className="text-xs text-stone-600 mt-0.5">{t.message}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="flex-shrink-0 text-stone-400 hover:text-stone-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
