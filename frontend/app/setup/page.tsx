'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react'
import api from '@/lib/axios'
import { useAuth } from '@/context/AuthContext'
import { ButtonSpinner } from '@/components/LoadingSpinner'

export default function Setup() {
  const router = useRouter()
  const { login } = useAuth()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const { data } = await api.post('/auth/setup', { name, email, password })
      const { token, user, redirectTo } = data
      
      setSuccess('Super Admin created successfully. Logging you in...')
      
      setTimeout(() => {
        login(token, user, redirectTo)
        router.push(redirectTo || '/admin')
      }, 1500)
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete setup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sidebar-bg flex items-center justify-center p-6 text-white fade-in">
      <div className="w-full max-w-120">
        <div className="text-center mb-10 fade-up">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <span className="text-3xl font-bold tracking-tight text-white">
              Civic<span className="text-cyan-500">Pulse</span>
            </span>
          </Link>
          <h1 className="text-3xl font-bold mb-3 flex items-center justify-center gap-3">
            <ShieldCheck className="text-blue-500" size={32} /> Platform Setup
          </h1>
          <p className="text-text-muted">Initialize the Super Admin account for CivicPulse.</p>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 fade-up" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 shake">
                <AlertCircle size={18} className="shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 bg-green-500/10 text-green-400 p-4 rounded-xl border border-green-500/20 fade-in">
                <ShieldCheck size={18} className="shrink-0" />
                <p className="text-sm font-medium">{success}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#c9d1d9] mb-2">Admin Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[#8b949e] group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-sidebar-bg border border-[#30363d] rounded-xl text-white placeholder-[#8b949e] focus:bg-sidebar-bg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Super Admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#c9d1d9] mb-2">Admin Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#8b949e] group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-sidebar-bg border border-[#30363d] rounded-xl text-white placeholder-[#8b949e] focus:bg-sidebar-bg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="admin@civicpulse.gov"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#c9d1d9] mb-2">Secure Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#8b949e] group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-sidebar-bg border border-[#30363d] rounded-xl text-white placeholder-[#8b949e] focus:bg-sidebar-bg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-70 mt-4"
            >
              {loading ? <ButtonSpinner /> : <><ShieldCheck size={18} /> Initialize Platform</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
