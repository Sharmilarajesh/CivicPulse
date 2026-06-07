'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ClipboardList, FileText, CheckCircle2, Clock, ChevronLeft, ChevronRight, FilePlus } from 'lucide-react'
import api from '@/lib/axios'
import { IssueCard } from '@/components/IssueCard'
import { SkeletonCard } from '@/components/LoadingSpinner'
import { useCountUp } from '@/hooks/useCountUp'

export default function MyReports() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [stats, setStats] = useState({ total: 0, resolved: 0, active: 0 })

  const countTotal = useCountUp(stats.total)
  const countResolved = useCountUp(stats.resolved)
  const countActive = useCountUp(stats.active)

  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/issues/mine')
        const allIssues = data.issues || []
        
        const resolved = allIssues.filter((i: any) => i.status === 'resolved').length
        setStats({
          total: allIssues.length,
          resolved,
          active: allIssues.length - resolved
        })

        if (activeTab === 'All') {
          setIssues(allIssues)
        } else {
          const statusMap: Record<string, string> = {
            'Reported': 'reported',
            'Under Review': 'under_review',
            'Assigned': 'assigned',
            'In Progress': 'in_progress',
            'Resolved': 'resolved'
          }
          setIssues(allIssues.filter((i: any) => i.status === statusMap[activeTab]))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchIssues()
  }, [activeTab])

  const tabs = ['All', 'Reported', 'Under Review', 'Assigned', 'In Progress', 'Resolved']

  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case 'Reported':
        return { title: 'No New Reports', desc: "You haven't reported any new issues recently. Once you report an issue, it will appear here." };
      case 'Under Review':
        return { title: 'Nothing Under Review', desc: "None of your reported issues are currently being reviewed by admins. They will appear here once an admin starts processing them." };
      case 'Assigned':
        return { title: 'No Issues Assigned', desc: "None of your issues have been assigned to an area officer yet." };
      case 'In Progress':
        return { title: 'No Active Work', desc: "There are currently no issues actively being worked on by officers." };
      case 'Resolved':
        return { title: 'No Resolved Issues', desc: "None of your reported issues have been fully resolved yet. Check back later!" };
      default:
        return { title: 'No issues found', desc: "You haven't reported any civic issues yet. Make your first report to get started!" };
    }
  }

  const emptyState = getEmptyStateMessage();

  return (
    <div className="p-6 md:p-10 max-w-300 mx-auto fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="text-blue-600" size={20} />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">My Reports</h1>
          </div>
          <p className="text-slate-500">Track and manage all your reported civic issues.</p>
        </div>
        <Link href="/report" className="flex items-center gap-2 bg-amber hover:bg-warning text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 hover:shadow-lg">
          <FilePlus size={18} />
          Report New Issue
        </Link>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <FileText className="text-blue-500" size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Reports</p>
            <p className="text-2xl font-bold text-slate-800">{countTotal}</p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="text-green-500" size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-bold text-slate-800">{countResolved}</p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
            <Clock className="text-orange-500" size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active</p>
            <p className="text-2xl font-bold text-slate-800">{countActive}</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex overflow-x-auto pb-4 mb-6 gap-2 hide-scrollbar fade-up" style={{ animationDelay: '0.2s' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === tab 
                ? 'bg-slate-800 text-white shadow-md' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ISSUES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {loading ? (
          Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : issues.length > 0 ? (
          issues.map((issue, index) => (
            <IssueCard key={(issue as any)._id} issue={issue as any} index={index} />
          ))
        ) : (
          <div className="col-span-full -mt-5 text-center flex flex-col items-center justify-center fade-in">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <ClipboardList className="text-slate-300" size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{emptyState.title}</h3>
            <p className="text-slate-500 mb-8 max-w-md">{emptyState.desc}</p>
            {stats.total === 0 && (
              <Link href="/report" className="bg-amber hover:bg-warning text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-md">
                Report your first issue
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
