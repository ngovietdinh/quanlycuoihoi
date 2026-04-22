'use client'
import { createContext, useContext, useState, useCallback, useRef } from 'react'

type TType = 'success'|'error'|'warning'|'info'
interface T { id:string; type:TType; msg:string }
interface TCtx { success:(m:string)=>void; error:(m:string)=>void; warning:(m:string)=>void; info:(m:string)=>void }

const Ctx = createContext<TCtx|null>(null)
export const useToast = () => { const c = useContext(Ctx); if (!c) throw new Error('No ToastProvider'); return c }

const STYLES: Record<TType,string> = {
  success:'border-emerald-200 bg-emerald-50 text-emerald-800',
  error:  'border-red-200    bg-red-50    text-red-800',
  warning:'border-amber-200  bg-amber-50  text-amber-800',
  info:   'border-sky-200    bg-sky-50    text-sky-800',
}
const ICONS: Record<TType,string> = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<T[]>([])
  const n = useRef(0)
  const remove = useCallback((id:string) => setItems(s=>s.filter(x=>x.id!==id)), [])
  const add = useCallback((type:TType, msg:string) => {
    const id = String(++n.current)
    setItems(s => [...s.slice(-4), {id,type,msg}])
    setTimeout(() => remove(id), 3500)
  }, [remove])
  return (
    <Ctx.Provider value={{ success:(m)=>add('success',m), error:(m)=>add('error',m), warning:(m)=>add('warning',m), info:(m)=>add('info',m) }}>
      {children}
      <div className="fixed bottom-20 sm:bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-72">
        {items.map(t => (
          <div key={t.id} className={`toast border ${STYLES[t.type]}`}>
            <span className="text-base flex-shrink-0">{ICONS[t.type]}</span>
            <p className="text-sm font-medium flex-1">{t.msg}</p>
            <button onClick={()=>remove(t.id)} className="flex-shrink-0 opacity-60 hover:opacity-100 text-xs">✕</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
