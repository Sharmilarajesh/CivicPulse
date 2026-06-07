'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Mail, User, Building2, Shield, CheckCircle2, AlertCircle, Map } from 'lucide-react'
import api from '@/lib/axios'
import { useAuth } from '@/context/AuthContext'
import { ButtonSpinner } from '@/components/LoadingSpinner'

const TAMIL_NADU_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode",
  "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet",
  "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
]

export default function InviteUsers() {
  const { user } = useAuth()

  const [role, setRole] = useState<'officer' | 'admin'>('officer')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [ward, setWard] = useState('')
  const [district, setDistrict] = useState('')

  useEffect(() => {
    if (user?.role === 'super_admin') {
      setRole('admin')
    }
  }, [user])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (role === 'officer' && !ward) {
      setError('Area name is required for officers')
      setLoading(false)
      return
    }

    if ((role === 'admin' || role === 'officer') && !district) {
      setError('District is required for admins and officers')
      setLoading(false)
      return
    }

    try {
      await api.post('/auth/invite', {
        name,
        email,
        role,
        district: (role === 'admin' || role === 'officer') ? district : undefined,
        ward: role === 'officer' ? ward : undefined
      })

      setSuccess(`Invitation sent successfully to ${email}`)
      setName('')
      setEmail('')
      setWard('')
      setDistrict('')

      setTimeout(() => {
        setSuccess('')
      }, 3000)

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto fade-in pb-20">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <UserPlus className="text-blue-600" size={28} />
          Invite Team Members
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Send invitations to new Area Officers {user?.role === 'super_admin' ? 'and Platform Admins.' : '.'}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 shake">
                <AlertCircle size={18} className="shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 fade-in">
                <CheckCircle2 size={18} className="shrink-0" />
                <p className="text-sm font-medium">{success}</p>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Role</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {user?.role === 'super_admin' && (
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all duration-200
                      ${role === 'admin' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
                    `}
                  >
                    <div className={`p-2.5 rounded-full ${role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Shield size={20} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">Platform Admin</div>
                      <div className={`text-xs ${role === 'admin' ? 'text-purple-600/80' : 'text-slate-500'}`}>Full platform access</div>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setRole('officer')}
                  className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all duration-200
                    ${role === 'officer' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
                  `}
                >
                  <div className={`p-2.5 rounded-full ${role === 'officer' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Building2 size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">Area Officer</div>
                    <div className={`text-xs ${role === 'officer' ? 'text-blue-600/80' : 'text-slate-500'}`}>Manages issues in an area</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
                    placeholder="jane@civicpulse.gov"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* District (Conditional) */}
              {(role === 'admin' || role === 'officer') && (
                <div className="fade-in">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">District Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Map className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <select
                      required value={district} onChange={(e) => setDistrict(e.target.value)}
                      className="block w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
                    >
                      <option value="" disabled>Select District</option>
                      {TAMIL_NADU_DISTRICTS.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">This determines the area of jurisdiction for this role.</p>
                </div>
              )}
              {/* Ward (Conditional) */}
              {role === 'officer' && (
                <div className="fade-in">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Assigned Area Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="text" required value={ward} onChange={(e) => setWard(e.target.value)}
                      className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
                      placeholder="e.g. Anna Nagar, Chennai"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">The officer will only have jurisdiction over this specific area.</p>
                </div>
              )}


            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="submit" disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-70 flex justify-center items-center gap-2 text-sm"
              >
                {loading ? <ButtonSpinner /> : <><Mail size={16} /> Send Invitation</>}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-200 text-xs text-slate-600">
          <strong>Note:</strong> The invitation link sent via email will expire in 72 hours. Once accepted, the user will be prompted to create their secure password and activate their account.
        </div>
      </div>
    </div>
  )
}
