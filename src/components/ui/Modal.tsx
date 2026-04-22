'use client'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
interface ModalProps { open:boolean; onClose:()=>void; title?:string; subtitle?:string; size?:'sm'|'md'|'lg'; children:React.ReactNode; footer?:React.ReactNode }
const SIZES = { sm:'max-w-sm', md:'max-w-md', lg:'max-w-lg' }

export function Modal({ open, onClose, title, subtitle, size='md', children, footer }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow='hidden'
    else document.body.style.overflow=''
    return () => { document.body.style.overflow='' }
  },[open])
  useEffect(() => {
    const h = (e:KeyboardEvent) => { if (e.key==='Escape') onClose() }
    document.addEventListener('keydown',h); return ()=>document.removeEventListener('keydown',h)
  },[onClose])
  if (!open) return null
  return createPortal(
    <div className="modal-overlay" onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div className={cn('modal-panel', SIZES[size])}>
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-ink-200"/>
        </div>
        {title && (
          <div className="px-6 pt-5 pb-4 border-b border-ink-100 flex-shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">{title}</h2>
                {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="flex-shrink-0 p-1.5 rounded-xl hover:bg-ink-100 text-ink-400 hover:text-ink-700 transition-colors mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-ink-100 flex-shrink-0 flex items-center justify-end gap-2.5 bg-ink-50/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export function ConfirmModal({ open, onClose, onConfirm, title, msg, confirmLabel='Xác nhận', loading }:
  { open:boolean; onClose:()=>void; onConfirm:()=>void; title:string; msg:string; confirmLabel?:string; loading?:boolean }) {
  return (
    <Modal open={open} onClose={onClose} size="sm"
      footer={<>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Hủy bỏ</button>
        <button onClick={onConfirm} disabled={loading} className="btn btn-danger btn-sm disabled:opacity-60">
          {loading ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"/> : confirmLabel}
        </button>
      </>}>
      <div className="text-center py-3">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 text-3xl animate-popIn">⚠️</div>
        <h3 className="font-display text-lg font-semibold text-ink-900 mb-2">{title}</h3>
        <p className="text-sm text-ink-500 leading-relaxed">{msg}</p>
      </div>
    </Modal>
  )
}
