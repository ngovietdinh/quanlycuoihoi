'use client'
import { createContext, useContext, useState, useCallback, useRef } from 'react'
type TType = 'success'|'error'|'warning'|'info'
interface T { id:string; type:TType; title:string; msg?:string }
interface TCtx { success:(t:string,m?:string)=>void; error:(t:string,m?:string)=>void; warning:(t:string,m?:string)=>void; info:(t:string,m?:string)=>void }
const Ctx = createContext<TCtx|null>(null)
export const useToast = () => { const c = useContext(Ctx); if (!c) throw new Error('No ToastProvider'); return c }
const S: Record<TType,{border:string;bg:string;icon:string}> = {
  success:{border:'border-jade-200',  bg:'bg-jade-50/90',   icon:'✅'},
  error:  {border:'border-red-200',   bg:'bg-red-50/90',    icon:'❌'},
  warning:{border:'border-gold-200',  bg:'bg-gold-50/90',   icon:'⚠️'},
  info:   {border:'border-blue-200',  bg:'bg-blue-50/90',   icon:'ℹ️'},
}
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<T[]>([])
  const n = useRef(0)
  const remove = useCallback((id:string) => setItems(s=>s.filter(x=>x.id!==id)),[])
  const add = useCallback((type:TType, title:string, msg?:string) => {
    const id = String(++n.current)
    setItems(s => [...s.slice(-4), {id,type,title,msg}])
    setTimeout(() => remove(id), 4000)
  },[remove])
  return (
    <Ctx.Provider value={{ success:(t,m)=>add('success',t,m), error:(t,m)=>add('error',t,m), warning:(t,m)=>add('warning',t,m), info:(t,m)=>add('info',t,m) }}>
      {children}
      <div className="fixed bottom-20 sm:bottom-5 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-80">
        {items.map(t => (
          <div key={t.id} className={`toast border ${S[t.type].border} ${S[t.type].bg} pointer-events-auto`}>
            <span className="text-lg flex-shrink-0">{S[t.type].icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-900">{t.title}</p>
              {t.msg && <p className="text-xs text-ink-600 mt-0.5">{t.msg}</p>}
            </div>
            <button onClick={()=>remove(t.id)} className="flex-shrink-0 text-ink-400 hover:text-ink-700 transition-colors text-sm">✕</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
