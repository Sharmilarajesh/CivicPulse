'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import api from '@/lib/axios'
import { useAuth } from '@/context/AuthContext'
import { ButtonSpinner } from '@/components/LoadingSpinner'

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { login } = useAuth()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { data } = await api.post('/auth/accept-invite', { token, password })
      const { token: jwtToken, user, redirectTo } = data
      
      setSuccess('Account activated successfully. Logging you in...')
      
      setTimeout(() => {
        login(jwtToken, user, redirectTo)
        router.push(redirectTo || '/')
      }, 1500)
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept invitation')
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
            <CheckCircle2 className="text-green-500" size={32} /> Accept Invitation
          </h1>
          <p className="text-text-muted">Set your password to activate your official account.</p>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 fade-up" style={{ animationDelay: '0.1s' }}>
          {(!token && error) ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Invalid Link</h2>
              <p className="text-[#8b949e] mb-6">This invitation link is missing or malformed.</p>
              <Link href="/login" className="px-6 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-xl font-medium transition-colors">
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 shake">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
              
              {success && (
                <div className="flex items-center gap-2 bg-green-500/10 text-green-400 p-4 rounded-xl border border-green-500/20 fade-in">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <p className="text-sm font-medium">{success}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#c9d1d9] mb-2">New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[#8b949e] group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3 bg-sidebar-bg border border-[#30363d] rounded-xl text-white placeholder-[#8b949e] focus:bg-sidebar-bg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#8b949e] hover:text-white">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#c9d1d9] mb-2">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[#8b949e] group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-sidebar-bg border border-[#30363d] rounded-xl text-white placeholder-[#8b949e] focus:bg-sidebar-bg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-70 mt-4"
              >
                {loading ? <ButtonSpinner /> : <><CheckCircle2 size={18} /> Activate Account</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvite() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sidebar-bg flex items-center justify-center"><ButtonSpinner /></div>}>
      <AcceptInviteContent />
    </Suspense>
  )
}
