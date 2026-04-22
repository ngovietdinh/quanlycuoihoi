'use client'
import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { getProject  } from '@/lib/api/projects'
import { getTasks    } from '@/lib/api/tasks'
import { getExpenses } from '@/lib/api/expenses'
import type { Project,Task,Expense } from '@/types'
export function useProject(projectId:string) {
  const [project,setProject]=useState<Project|null>(null)
  const [tasks,setTasks]=useState<Task[]>([])
  const [expenses,setExpenses]=useState<Expense[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const refetch=useCallback(async()=>{
    setLoading(true); setError(null)
    const [p,t,e]=await Promise.all([getProject(projectId),getTasks(projectId),getExpenses(projectId)])
    if(p.error) setError(p.error); else setProject(p.data)
    if(t.data) setTasks(t.data); if(e.data) setExpenses(e.data)
    setLoading(false)
  },[projectId])
  useEffect(()=>{refetch()},[refetch])
  useEffect(()=>{
    const sb=getSupabaseClient()
    const tc=sb.channel(`tasks:${projectId}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'tasks',filter:`project_id=eq.${projectId}`},
        async()=>{const r=await getTasks(projectId);if(r.data) setTasks(r.data)}).subscribe()
    const ec=sb.channel(`expenses:${projectId}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'expenses',filter:`project_id=eq.${projectId}`},
        async()=>{const r=await getExpenses(projectId);if(r.data) setExpenses(r.data)}).subscribe()
    return()=>{sb.removeChannel(tc);sb.removeChannel(ec)}
  },[projectId])
  return {project,tasks,expenses,loading,error,refetch}
}
