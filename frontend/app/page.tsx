'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { FilePlus, MapPin, Camera, Bell, CheckCircle2, Clock, FileText, LayoutDashboard } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import api from '@/lib/axios'
import { IssueCard } from '@/components/IssueCard'
import { SkeletonCard } from '@/components/LoadingSpinner'
import { useAuth } from '@/context/AuthContext'
import { getRedirectPath } from '@/types'

const IssueMap = dynamic(() => import('@/components/IssueMap'), { ssr: false })

export default function Home() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ total: 0, resolved: 0, active: 0 })
  const [recentIssues, setRecentIssues] = useState([])
  const [loading, setLoading] = useState(true)

  const countTotal = useCountUp(stats.total)
  const countResolved = useCountUp(stats.resolved)
  const countActive = useCountUp(stats.active)

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const { data } = await api.get('/issues/public')
        const issues = Array.isArray(data) ? data : (data.issues || [])
        
        const resolved = issues.filter((i: any) => i.status === 'resolved').length
        const active = issues.length - resolved
        
        setStats({ total: issues.length, resolved, active })
        setRecentIssues(issues.slice(0, 6)) // Get latest 6
      } catch (error) {
        console.error("Failed to fetch public data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPublicData()
  }, [])

  return (
    <div className="min-h-screen bg-content-bg pb-20">
      {/* HERO SECTION */}
      <section className="bg-sidebar-bg text-white pt-24 pb-24 px-6 relative overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]"></div>
          <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/20 blur-[100px]"></div>
        </div>

        <div className="max-w-300 mx-auto relative z-10">
          <div className="max-w-2xl fade-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Report. Track. <br/>
              <span className="gradient-text">Resolve.</span>
            </h1>
            <p className="text-text-muted text-lg lg:text-xl mb-10 leading-relaxed">
              India's crowdsourced platform for citizens to report civic issues directly to local authorities. Make your city better, one report at a time.
            </p>
            <div className="flex flex-wrap gap-4">
              {(!user || user.role === 'citizen') ? (
                <Link href="/report" className="flex items-center gap-2 bg-amber hover:bg-warning hover:scale-105 hover:shadow-lg transition-all duration-200 text-white px-8 py-4 rounded-xl font-bold">
                  <FilePlus size={20} />
                  Report an Issue
                </Link>
              ) : (
                <Link href={getRedirectPath(user.role)} className="flex items-center gap-2 bg-[#3b82f6] hover:bg-primary hover:scale-105 hover:shadow-lg transition-all duration-200 text-white px-8 py-4 rounded-xl font-bold">
                  <LayoutDashboard size={20} />
                  Go to Dashboard
                </Link>
              )}
              <button onClick={() => document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-200 text-white px-8 py-4 rounded-xl font-bold">
                View Live Map
              </button>
            </div>
          </div>

          {/* Stats Counters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-5 backdrop-blur-sm">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <FileText className="text-blue-400" size={28} />
              </div>
              <div>
                <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Total Issues</p>
                <p className="text-3xl font-bold text-white">{countTotal.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-5 backdrop-blur-sm">
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="text-green-400" size={28} />
              </div>
              <div>
                <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Resolved</p>
                <p className="text-3xl font-bold text-white">{countResolved.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-5 backdrop-blur-sm">
              <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Clock className="text-amber-400" size={28} />
              </div>
              <div>
                <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Active</p>
                <p className="text-3xl font-bold text-white">{countActive.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 max-w-300 mx-auto">
        <div className="text-center mb-16 fade-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">How It Works</h2>
          <p className="text-slate-500">Three simple steps to resolve civic issues in your neighborhood.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', icon: MapPin, title: 'Drop a Pin', desc: 'Locate the exact issue on the interactive map.', color: 'text-blue-600', bg: 'bg-blue-50' },
            { step: '02', icon: Camera, title: 'Add Photo & Details', desc: 'Upload evidence and describe the problem clearly.', color: 'text-cyan-600', bg: 'bg-cyan-50' },
            { step: '03', icon: Bell, title: 'Track Progress', desc: 'Get real-time updates as authorities resolve it.', color: 'text-amber-600', bg: 'bg-amber-50' }
          ].map((s, i) => (
            <div key={i} className="card p-8 text-center fade-up group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-slate-200 hover:border-blue-400" style={{ animationDelay: `${(i+2)*0.1}s` }}>
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="text-6xl font-black text-slate-50 absolute top-2 right-4 group-hover:text-blue-100 transition-colors duration-300 z-0">{s.step}</span>
              <div className={`relative z-10 w-20 h-20 ${s.bg} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm`}>
                <s.icon size={32} className={s.color} />
              </div>
              <h3 className="relative z-10 text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-700 transition-colors duration-300">{s.title}</h3>
              <p className="relative z-10 text-slate-500 text-sm leading-relaxed group-hover:text-slate-600 transition-colors duration-300">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE MAP SECTION */}
      <section id="map-section" className="py-24 px-6 bg-white border-y border-slate-200">
        <div className="max-w-300 mx-auto">
          <div className="mb-10 fade-up">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Live Issues Map</h2>
            <p className="text-slate-500">Explore reported issues across India in real-time.</p>
          </div>
          <div className="fade-up" style={{ animationDelay: '0.2s' }}>
            <IssueMap issues={recentIssues} height="600px" />
          </div>
        </div>
      </section>

      {/* RECENT ISSUES */}
      <section className="py-24 px-6 max-w-300 mx-auto">
        <div className="flex justify-between items-end mb-10 fade-up">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Recent Reports</h2>
            <p className="text-slate-500">Latest civic issues reported by citizens.</p>
          </div>
          <Link href="/login" className="hidden sm:block text-blue-600 font-semibold hover:text-blue-700">
            View All &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            recentIssues.map((issue, index) => (
              <IssueCard key={(issue as any)._id} issue={issue as any} index={index} />
            ))
          )}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-6 bg-sidebar-bg text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="max-w-2xl mx-auto relative z-10 fade-up">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to <span className="gradient-text">Make an Impact?</span>
          </h2>
          <p className="text-slate-400 mb-10 text-lg">
            {user 
              ? "You are logged in. Head over to your dashboard to manage your civic activities." 
              : "Join thousands of citizens taking responsibility for their neighborhoods. Register now and start reporting."}
          </p>
          <Link href={user ? getRedirectPath(user.role) : "/register"} className="inline-block bg-amber hover:bg-warning hover:scale-105 transition-all duration-200 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg">
            {user ? "Go to Dashboard" : "Register Free"}
          </Link>
        </div>
      </section>
    </div>
  )
}
