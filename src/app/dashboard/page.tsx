'use client'
import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getProjects, createProject, deleteProject } from '@/lib/api/projects'
import { formatCurrency, formatDate, calcProgress, daysUntilEvent } from '@/lib/utils'
import type { ProjectSummary, CreateProjectDTO } from '@/types'

function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F5EFE0]">
          <h2 className="font-display text-lg font-semibold text-[#2C1810]">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F5EFE0] text-[#A89080]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth()
  const [projects,setProjects]=useState<ProjectSummary[]>([])
  const [loading,setLoading]=useState(true)
  const [showCreate,setShowCreate]=useState(false)
  const [creating,setCreating]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const [form,setForm]=useState<CreateProjectDTO>({name:'',budget_total:0})
  const sf=(k:string,v:unknown)=>setForm(f=>({...f,[k]:v}))

  useEffect(()=>{load()},[])

  async function load() {
    setLoading(true)
    const {data,error}=await getProjects()
    if(data) setProjects(data)
    if(error) setError(error)
    setLoading(false)
  }

  async function handleCreate(e:FormEvent) {
    e.preventDefault()
    if(!form.name.trim()) return
    setCreating(true)
    const {error}=await createProject(form)
    if(error){setError(error);setCreating(false);return}
    setShowCreate(false); setForm({name:'',budget_total:0}); await load(); setCreating(false)
  }

  async function handleDelete(id:string) {
    if(!confirm('Bạn có chắc muốn xóa dự án này? Toàn bộ dữ liệu sẽ bị mất.')) return
    await deleteProject(id); await load()
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0]">
      <header className="bg-white border-b border-[#E8D5C4] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{background:'linear-gradient(135deg,#C41E3A,#C9A84C)'}}>
            <span className="text-lg">🌸</span>
          </div>
          <div>
            <p className="font-display font-bold text-[#2C1810] leading-tight">Lễ Ăn Hỏi</p>
            <p className="text-xs text-[#A89080]">Quản lý sự kiện</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#5C3D2E] hidden sm:block">
            Xin chào, {profile?.full_name||user?.email}
          </span>
          <button onClick={signOut} className="btn-ghost text-sm border border-[#E8D5C4]">Đăng xuất</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title mb-1">Dự án của bạn</h1>
            <p className="text-sm text-[#A89080]">Quản lý các sự kiện lễ ăn hỏi</p>
          </div>
          <button onClick={()=>setShowCreate(true)} className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tạo dự án mới
          </button>
        </div>

        {error&&<div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

        {loading?(
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3].map(i=>(
              <div key={i} className="card p-6 space-y-3">
                <div className="skeleton h-5 w-3/4"/>
                <div className="skeleton h-4 w-1/2"/>
                <div className="skeleton h-2 w-full mt-4"/>
                <div className="skeleton h-10 w-full mt-2"/>
              </div>
            ))}
          </div>
        ):projects.length===0?(
          <div className="card text-center py-20">
            <div className="text-5xl mb-4">🌸</div>
            <h3 className="font-display text-xl font-semibold text-[#2C1810] mb-2">Chưa có dự án nào</h3>
            <p className="text-[#A89080] text-sm mb-6">Tạo dự án đầu tiên để bắt đầu quản lý lễ ăn hỏi</p>
            <button onClick={()=>setShowCreate(true)} className="btn-primary mx-auto">Tạo dự án đầu tiên</button>
          </div>
        ):(
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(p=>{
              const progress=calcProgress(p.completed_tasks,p.total_tasks)
              const days=daysUntilEvent(p.event_date)
              const remaining=p.budget_total-p.total_spent
              return (
                <div key={p.id} className="card-hover p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="font-display font-semibold text-[#2C1810] text-base leading-snug mb-1 line-clamp-2">{p.name}</h3>
                    {p.event_date&&(
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-[#A89080]">📅 {formatDate(p.event_date)}</span>
                        {days!==null&&(
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${days<0?'bg-gray-100 text-gray-500':days<=7?'bg-red-50 text-red-600':'bg-[#FBF6EC] text-[#C9A84C]'}`}>
                            {days<0?'Đã qua':days===0?'Hôm nay!':`${days} ngày nữa`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#A89080]">Tiến độ</span>
                      <span className="font-medium text-[#5C3D2E]">{progress}%</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{width:`${progress}%`}}/></div>
                    <p className="text-xs text-[#A89080] mt-1">{p.completed_tasks}/{p.total_tasks} đầu mục hoàn thành</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-3 bg-[#FAF7F0] rounded-xl text-center">
                    <div><p className="text-xs text-[#A89080] mb-0.5">Ngân sách</p><p className="text-xs font-semibold text-[#2C1810]">{formatCurrency(p.budget_total)}</p></div>
                    <div><p className="text-xs text-[#A89080] mb-0.5">Đã chi</p><p className="text-xs font-semibold text-[#C41E3A]">{formatCurrency(p.total_spent)}</p></div>
                    <div><p className="text-xs text-[#A89080] mb-0.5">Còn lại</p><p className={`text-xs font-semibold ${remaining>=0?'text-emerald-600':'text-red-500'}`}>{formatCurrency(remaining)}</p></div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Link href={`/projects/${p.id}`} className="btn-primary flex-1 justify-center text-sm py-2">Mở dự án →</Link>
                    <button onClick={()=>handleDelete(p.id)}
                      className="p-2 rounded-xl border border-[#E8D5C4] text-[#A89080] hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {showCreate&&(
        <Modal title="Tạo dự án lễ ăn hỏi mới" onClose={()=>setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div><label className="label">Tên lễ *</label><input className="input" value={form.name} onChange={e=>sf('name',e.target.value)} placeholder="VD: Lễ Ăn Hỏi Gia Đình Trần - Nguyễn" required/></div>
            <div><label className="label">Mô tả</label><textarea className="input resize-none" rows={2} value={form.description||''} onChange={e=>sf('description',e.target.value)} placeholder="Chi tiết về buổi lễ..."/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Ngày tổ chức</label><input type="date" className="input" value={form.event_date||''} onChange={e=>sf('event_date',e.target.value)}/></div>
              <div><label className="label">Ngân sách (VNĐ)</label><input type="number" className="input" value={form.budget_total||''} onChange={e=>sf('budget_total',Number(e.target.value))} placeholder="80000000"/></div>
            </div>
            <div><label className="label">Địa điểm</label><input className="input" value={form.venue||''} onChange={e=>sf('venue',e.target.value)} placeholder="VD: Nhà hàng Tịnh Gia Viên, Huế"/></div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={()=>setShowCreate(false)} className="btn-ghost flex-1 justify-center border border-[#E8D5C4]">Hủy</button>
              <button type="submit" disabled={creating} className="btn-primary flex-1 justify-center disabled:opacity-60">{creating?'Đang tạo...':'Tạo dự án'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
