'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Shield, FileText, Clock, CheckCircle2, Users, Search, UserCheck, Trash2, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/lib/axios'
import { StatusBadge } from '@/components/StatusBadge'
import { timeAgo } from '@/utils/timeAgo'
import { useCountUp } from '@/hooks/useCountUp'
import { categoryConfig } from '@/types'

const IssueMap = dynamic(() => import('@/components/IssueMap'), { ssr: false })

export default function AdminDashboard() {
  const router = useRouter()
  const [issues, setIssues] = useState<any[]>([])
  const [officers, setOfficers] = useState<any[]>([])
  const [modalOfficers, setModalOfficers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedIssue, setSelectedIssue] = useState<any>(null)
  const [assigning, setAssigning] = useState(false)
  const [assignedOfficerId, setAssignedOfficerId] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, officers: 0 })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 10

  const cTotal = useCountUp(stats.total)
  const cPending = useCountUp(stats.pending)
  const cResolved = useCountUp(stats.resolved)
  const cOfficers = useCountUp(stats.officers)

  const fetchIssues = async () => {
    try {
      const [issuesRes, officersRes] = await Promise.all([
        api.get('/issues', { params: { page, limit: LIMIT, search } }),
        api.get('/users/officers')
      ])
      const fetchedIssues = issuesRes.data.issues || []
      const allOfficers = Array.isArray(officersRes.data) ? officersRes.data : officersRes.data.officers || []
      
      setIssues(fetchedIssues)
      setTotalPages(issuesRes.data.pagination.totalPages)
      setTotal(issuesRes.data.pagination.total)
      setOfficers(allOfficers)
      
      setStats({
        total: issuesRes.data.pagination.total,
        pending: fetchedIssues.filter((i: any) => i.status !== 'resolved').length,
        resolved: fetchedIssues.filter((i: any) => i.status === 'resolved').length,
        officers: allOfficers.length
      })
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchIssues()
  }, [page, search])

  useEffect(() => {
    if (selectedIssue) {
      const url = selectedIssue.district 
        ? `/users/officers?district=${selectedIssue.district}`
        : '/users/officers'
      api.get(url)
        .then(res => setModalOfficers(Array.isArray(res.data) ? res.data : res.data.officers || []))
        .catch(console.error)
    } else {
      setModalOfficers([])
    }
  }, [selectedIssue])

  const handleAssign = async (officerId: string) => {
    setAssigning(true)
    try {
      const { data } = await api.patch(`/issues/${selectedIssue._id}/assign`, { officerId })
      setIssues(issues.map(i => i._id === selectedIssue._id ? data.issue : i))
      
      // Show confirmation feedback
      setAssignedOfficerId(officerId)
      setTimeout(() => {
        setAssignedOfficerId(null)
        setSelectedIssue(null)
      }, 1500)
    } catch (err) { console.error(err) } finally { setAssigning(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this issue permanently?')) return
    try {
      await api.delete(`/issues/${id}`)
      setIssues(issues.filter(i => i._id !== id))
    } catch (err) { console.error(err) }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  return (
    <div className="p-6 md:p-10 fade-in h-full flex flex-col">
      <div className="flex items-center gap-3 mb-8 shrink-0">
        <Shield className="text-red-500" size={32} />
        <h1 className="text-3xl font-bold text-slate-800">Admin Control Panel</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 shrink-0 fade-up">
        {[{t:'Total', c:cTotal, i:FileText, b:'bg-slate-900'},{t:'Pending', c:cPending, i:Clock, b:'bg-amber-600'},{t:'Resolved', c:cResolved, i:CheckCircle2, b:'bg-green-600'},{t:'Officers', c:cOfficers, i:Users, b:'bg-blue-600'}].map((s,i) => (
          <div key={i} className={`p-6 rounded-2xl text-white ${s.b} shadow-lg relative overflow-hidden`}>
            <s.i className="absolute -right-2 -bottom-2 opacity-20 w-24 h-24" />
            <p className="text-white/80 text-sm font-semibold uppercase">{s.t}</p>
            <p className="text-4xl font-bold mt-1 relative z-10">{s.c}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        {/* Left: List */}
        <div className="w-full lg:w-[40%] flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="p-4 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input type="text" placeholder="Search issues..." value={search} onChange={handleSearchChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {issues.map(issue => {
              const conf = categoryConfig[issue.category as keyof typeof categoryConfig]
              return (
                <div 
                  key={issue._id} 
                  onClick={() => router.push(`/issues/${issue._id}`)}
                  className="p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2"><span className={`text-xl ${conf?.color}`}>{conf && <conf.Icon size={18} />}</span><h4 className="font-bold text-sm text-slate-800 line-clamp-1">{issue.title}</h4></div>
                    <StatusBadge status={issue.status} size="sm" />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-slate-500">{timeAgo(issue.createdAt)}</span>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedIssue(issue); }} className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"><UserCheck size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(issue._id); }} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="p-4 border-t border-slate-200 shrink-0 bg-slate-50 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {total} total issues · Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                >
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                >
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Map */}
        <div className="w-full lg:w-[60%] card overflow-hidden fade-up" style={{ animationDelay: '0.2s' }}>
          <IssueMap issues={issues} height="100%" />
        </div>
      </div>

      {/* Assign Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm modal-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            <button onClick={() => setSelectedIssue(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-1">Assign Officer</h2>
            <p className="text-sm text-slate-500 mb-6 truncate">{selectedIssue.title}</p>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {modalOfficers.length === 0 ? (
                <p className="text-sm text-slate-500 italic p-4 text-center">No officers found for this district.</p>
              ) : (
                modalOfficers.map(off => {
                const isAssigned = assignedOfficerId === off._id;
                return (
                  <div key={off._id} className={`flex items-center justify-between p-3 border rounded-xl transition-colors ${isAssigned ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-blue-300'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">{off.name.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{off.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          Area: <span className="px-2.5 py-0.5 bg-blue-100/80 text-blue-800 rounded-lg font-extrabold border border-blue-200 text-xs shadow-sm">{off.ward}</span>
                        </p>
                      </div>
                    </div>
                    {isAssigned ? (
                      <button disabled className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold flex items-center gap-1 animate-pulse">
                        <CheckCircle2 size={16} /> Assigned
                      </button>
                    ) : (
                      <button onClick={() => { if(window.confirm(`Are you sure you want to assign this issue to ${off.name}?`)) handleAssign(off._id) }} disabled={assigning} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50">Assign</button>
                    )}
                  </div>
                )
              }))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
