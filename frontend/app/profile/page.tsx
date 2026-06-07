'use client'

import { useAuth } from '@/context/AuthContext'
import { User, Mail, Building2, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import api from '@/lib/axios'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/users/profile')
        setProfileData(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchProfile()
  }, [])

  if (!user) return <div className="p-10 text-center">Loading...</div>

  const displayUser = profileData || user

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto fade-in">
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
            <User size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Account <span className="gradient-text">Settings</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">View your personal information</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden fade-up" style={{ animationDelay: '0.1s' }}>
        {/* Top Dark Banner */}
        <div className="h-32 bg-sidebar-bg relative overflow-hidden">
          {/* Abstract background blobs to match home page */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-50%] left-[-10%] w-[50%] h-[150%] rounded-full bg-blue-600/20 blur-[60px]"></div>
            <div className="absolute top-[10%] right-[-10%] w-[40%] h-[150%] rounded-full bg-cyan-500/20 blur-[60px]"></div>
          </div>
          <div className="absolute inset-0 opacity-10 bg-[url('/grid.svg')]" />
        </div>
        
        <div className="px-6 md:px-10 pb-10 relative">
          {/* Avatar pulled up */}
          <div className="flex justify-between items-end -mt-12 mb-10">
            <div className="w-24 h-24 rounded-full bg-blue-600 border-4 border-white flex items-center justify-center text-white text-4xl font-bold shadow-lg relative z-10">
              {displayUser.name?.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                  <User size={16} className="text-slate-400" /> Full Name
                </label>
                <p className="text-lg font-bold text-slate-800">{displayUser.name}</p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                  <Mail size={16} className="text-slate-400" /> Email Address
                </label>
                <p className="text-lg font-bold text-slate-800">{displayUser.email}</p>
              </div>

            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Role */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                  <Shield size={16} className="text-slate-400" /> Account Type
                </label>
                <div className="inline-flex">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider
                    ${displayUser.role === 'citizen' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}
                    ${displayUser.role === 'officer' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
                    ${displayUser.role === 'admin' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
                    ${displayUser.role === 'super_admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : ''}
                  `}>
                    {displayUser.role === 'officer' ? 'Area Officer' : displayUser.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Area (If officer) */}
              {displayUser.role === 'officer' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                    <Building2 size={16} className="text-slate-400" /> Assigned Area
                  </label>
                  <p className="text-lg font-bold text-slate-800">{displayUser.ward}</p>
                </div>
              )}

              {/* District (If admin or officer and has district) */}
              {(displayUser.role === 'admin' || displayUser.role === 'officer' || displayUser.role === 'super_admin') && displayUser.district && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                    <Building2 size={16} className="text-slate-400" /> Assigned District
                  </label>
                  <p className="text-lg font-bold text-slate-800">{displayUser.district}</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
