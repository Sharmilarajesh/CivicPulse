'use client'

import { useState, useEffect } from 'react'
import { BarChart2, FileText, CheckCircle2, TrendingUp, Timer } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '@/lib/axios'
import { statusConfig, categoryConfig } from '@/types'
import { useCountUp } from '@/hooks/useCountUp'

export default function Analytics() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [sumRes, timeRes] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/resolution-time')
        ])
        
        // Parse backend aggregation data
        const summary = sumRes.data
        const resolvedCount = summary.byStatus.find((s: any) => s._id === 'resolved')?.count || 0
        
        setData({ 
          summary: {
            totalIssues: summary.total,
            totalResolved: resolvedCount,
            byStatus: summary.byStatus,
            byCategory: summary.byCategory
          }, 
          times: timeRes.data.data || []
        })
      } catch (err) { 
        console.error(err)
        setError(true)
      } finally { 
        setLoading(false) 
      }
    }
    fetchAnalytics()
  }, [])

  const rate = data && data.summary.totalIssues > 0 
    ? Math.round((data.summary.totalResolved / data.summary.totalIssues) * 100) 
    : 0

  const cTotal = useCountUp(data?.summary.totalIssues || 0)
  const cResolved = useCountUp(data?.summary.totalResolved || 0)
  const cRate = useCountUp(rate)
  const cTime = useCountUp(24) // Mock average hours

  if (loading) return <div className="p-10 flex justify-center items-center h-full"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
  if (error || !data) return <div className="p-10 text-center text-red-500 font-bold">Failed to load analytics data.</div>

  // Prepare chart data from array of {_id, count}
  const statusData = data.summary.byStatus.map((item: any) => ({
    name: statusConfig[item._id as keyof typeof statusConfig]?.label || (item._id || 'unknown'), 
    value: item.count,
    fill: statusConfig[item._id as keyof typeof statusConfig]?.dot || '#94a3b8'
  }))

  const catColors = ['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#64748b']
  const catData = data.summary.byCategory.map((item: any) => ({ 
    name: categoryConfig[item._id as keyof typeof categoryConfig]?.label || (item._id || 'unknown'), 
    value: item.count 
  }))

  const tooltipStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    color: '#0f172a',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    padding: '12px 16px'
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div style={tooltipStyle} className="fade-in min-w-30">
          <p className="font-bold text-slate-800 mb-2">{label || data.name}</p>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.fill || data.color || '#3b82f6' }} />
            <p className="font-semibold text-slate-600 text-sm">
              Issues: <span className="text-slate-900 font-bold ml-1">{data.value}</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-5 md:p-8 max-w-350 mx-auto fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 rounded-xl"><BarChart2 className="text-blue-600" size={26} /></div>
        <h1 className="text-[28px] font-bold text-slate-800">Analytics Dashboard</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8 fade-up">
        {[
          {t:'Total Issues', c:cTotal, i:FileText, color: 'text-blue-600', bg: 'bg-blue-50'},
          {t:'Resolved', c:cResolved, i:CheckCircle2, color: 'text-green-600', bg: 'bg-green-50'},
          {t:'Resolution Rate', c:`${cRate}%`, i:TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50'},
          {t:'Avg. Resolve Time', c:`${cTime}h`, i:Timer, color: 'text-amber-600', bg: 'bg-amber-50'}
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center gap-4">
            <div className={`p-3.5 rounded-xl ${s.bg} shrink-0`}>
              <s.i className={s.color} size={26} />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold mb-0.5 uppercase tracking-wider">{s.t}</p>
              <p className="text-[28px] font-black text-slate-800">{s.c}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Bar Chart */}
        <div className="card p-6 fade-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-bold text-slate-800 mb-5">Issues by Status</h3>
          <div className="h-70">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="card p-6 fade-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-bold text-slate-800 mb-5">Issues by Category</h3>
          <div className="h-70">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {catData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={catColors[index % catColors.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
