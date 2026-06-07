'use client'

import { useState, useEffect } from 'react'
import { Building2, FileText, Wrench, CheckCircle2, MapPin, Clock, X, ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react'
import api from '@/lib/axios'
import { useAuth } from '@/context/AuthContext'
import { StatusBadge } from '@/components/StatusBadge'
import { timeAgo } from '@/utils/timeAgo'
import { categoryConfig, statusConfig } from '@/types'
import { useCountUp } from '@/hooks/useCountUp'

export default function OfficerDashboard() {
  const { user } = useAuth()
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  
  const [selectedIssue, setSelectedIssue] = useState<any>(null)
  const [newStatus, setNewStatus] = useState('')
  const [resolutionNote, setResolutionNote] = useState('')
  const [resolutionPhoto, setResolutionPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [updating, setUpdating] = useState(false)

  const stats = {
    total: issues.length,
    inProgress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length
  }
  
  const countTotal = useCountUp(stats.total)
  const countInProgress = useCountUp(stats.inProgress)
  const countResolved = useCountUp(stats.resolved)

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const { data } = await api.get('/issues/assigned')
        setIssues(data.issues || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchIssues()
  }, [])

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
      let payload: any = { newStatus }
      let headers = {}
      
      if (newStatus === 'resolved') {
        if (resolutionPhoto) {
          const fd = new FormData()
          fd.append('newStatus', newStatus)
          fd.append('resolutionNote', resolutionNote)
          fd.append('resolutionPhoto', resolutionPhoto)
          payload = fd
          headers = { 'Content-Type': 'multipart/form-data' }
        } else {
          payload.resolutionNote = resolutionNote
        }
      }
      
      const { data } = await api.patch(`/issues/${selectedIssue._id}/status`, payload, { headers })
      setIssues(issues.map(i => i._id === selectedIssue._id ? data.issue : i))
      setSelectedIssue(null)
      setResolutionPhoto(null)
      setPhotoPreview('')
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  const filteredIssues = issues.filter(issue => {
    if (activeTab === 'Active') return issue.status !== 'resolved'
    if (activeTab === 'Resolved') return issue.status === 'resolved'
    return true
  })

  const statuses = ['reported', 'under_review', 'assigned', 'in_progress', 'resolved']
  const getAvailableStatuses = (current: string) => {
    const idx = statuses.indexOf(current)
    return statuses.slice(Math.max(0, idx)) // Allow current or forward
  }

  return (
    <div className="p-6 md:p-10 max-w-300 mx-auto fade-in">
      <div className="flex items-center gap-3 mb-8 shrink-0">
        <Building2 className="text-blue-600" size={32} />
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Area Officer Dashboard</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
            Your Area: <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold border border-blue-200 text-sm shadow-sm">{user?.ward}</span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 shrink-0 fade-up">
        {[
          { t: 'Assigned', c: countTotal, i: FileText, b: 'bg-slate-900' },
          { t: 'In Progress', c: countInProgress, i: Wrench, b: 'bg-amber-600' },
          { t: 'Resolved', c: countResolved, i: CheckCircle2, b: 'bg-green-600' }
        ].map((s, i) => (
          <div key={i} className={`p-6 rounded-2xl text-white ${s.b} shadow-lg relative overflow-hidden`}>
            <s.i className="absolute -right-2 -bottom-2 opacity-20 w-24 h-24" />
            <p className="text-white/80 text-sm font-semibold uppercase">{s.t}</p>
            <p className="text-4xl font-bold mt-1 relative z-10">{s.c}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 fade-up" style={{ animationDelay: '0.1s' }}>
        {['All', 'Active', 'Resolved'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === tab ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>{tab}</button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden fade-up" style={{ animationDelay: '0.2s' }}>
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
        ) : filteredIssues.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredIssues.map((issue) => {
              const conf = categoryConfig[issue.category as keyof typeof categoryConfig]
              return (
                <div key={issue._id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0 ${conf?.color}`}>{conf && <conf.Icon size={20} />}</div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-slate-800">{issue.title}</h3>
                        <StatusBadge status={issue.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {issue.location.address}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(issue.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  {issue.status !== 'resolved' && (
                    <button onClick={() => { setSelectedIssue(issue); setNewStatus(issue.status); }} className="shrink-0 px-4 py-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 font-semibold rounded-lg text-sm transition-all flex items-center gap-2 group/btn">
                      <Wrench size={16} /> Update Status <ArrowRight size={16} className="opacity-0 -ml-4 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-20 text-center text-slate-500">No issues found.</div>
        )}
      </div>

      {/* Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 modal-in shadow-2xl relative">
            <button onClick={() => setSelectedIssue(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Update Status</h2>
            <p className="text-slate-500 text-sm mb-6 line-clamp-1">{selectedIssue.title}</p>
            
            <form onSubmit={handleUpdateStatus} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">New Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                  {getAvailableStatuses(selectedIssue.status).map(s => (
                    <option key={s} value={s}>{statusConfig[s as keyof typeof statusConfig]?.label || s}</option>
                  ))}
                </select>
              </div>

              {newStatus === 'resolved' && (
                <div className="fade-in space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Resolution Note (Required)</label>
                    <textarea required value={resolutionNote} onChange={e => setResolutionNote(e.target.value)} rows={3} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Explain how it was resolved..."></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Resolution Photo (Optional)</label>
                    <div className="flex items-center gap-4">
                      {photoPreview ? (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => { setResolutionPhoto(null); setPhotoPreview(''); }} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors shrink-0">
                          <ImageIcon size={24} className="text-slate-400 mb-1" />
                          <span className="text-xs font-semibold text-slate-500">Upload</span>
                          <input 
                            type="file" accept="image/*" className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setResolutionPhoto(file);
                                const reader = new FileReader();
                                reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                        </label>
                      )}
                      <p className="text-xs text-slate-500">Add a photo to show citizens the completed work.</p>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" disabled={updating || (newStatus === 'resolved' && !resolutionNote)} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex justify-center items-center gap-2 disabled:opacity-50">
                {updating ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> Confirm Update</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
