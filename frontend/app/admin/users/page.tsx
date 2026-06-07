'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Users, User as UserIcon, Building2, Shield, Search, UserX, UserCheck, Loader2 } from 'lucide-react'
import api from '@/lib/axios'

export default function UserManagementPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/users/all')
      setUsers(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) return
    try {
      await api.delete(`/users/${id}`)
      fetchUsers()
    } catch (err) {
      console.error(err)
    }
  }

  const handleActivate = async (id: string) => {
    try {
      await api.put(`/users/${id}/activate`)
      fetchUsers()
    } catch (err) {
      console.error(err)
    }
  }

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
          <p className="text-slate-500">Only Super Admins can access this page.</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: users.length,
    citizens: users.filter(u => u.role === 'citizen').length,
    officers: users.filter(u => u.role === 'officer').length,
    admins: users.filter(u => u.role === 'admin').length,
  }

  const filteredUsers = users.filter(u => {
    const matchesTab = activeTab === 'All' || u.role + 's' === activeTab.toLowerCase()
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="p-6 md:p-10 fade-in h-[calc(100vh-2rem)] flex flex-col bg-slate-50 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Users className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
            <p className="text-slate-500 text-sm">Manage platform access and roles</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 fade-up shrink-0">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-4">
          <Users className="text-blue-600" />
          <div><p className="text-xs font-bold text-blue-600 uppercase">Total</p><p className="text-2xl font-bold text-blue-900">{stats.total}</p></div>
        </div>
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-4">
          <UserIcon className="text-slate-600" />
          <div><p className="text-xs font-bold text-slate-600 uppercase">Citizens</p><p className="text-2xl font-bold text-slate-900">{stats.citizens}</p></div>
        </div>
        <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-4">
          <Building2 className="text-green-600" />
          <div><p className="text-xs font-bold text-green-600 uppercase">Officers</p><p className="text-2xl font-bold text-green-900">{stats.officers}</p></div>
        </div>
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-4">
          <Shield className="text-red-600" />
          <div><p className="text-xs font-bold text-red-600 uppercase">Admins</p><p className="text-2xl font-bold text-red-900">{stats.admins}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden fade-up flex flex-col flex-1 min-h-0" style={{ animationDelay: '0.1s' }}>
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex gap-6 overflow-x-auto">
            {['All', 'Citizens', 'Officers', 'Admins'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 -mb-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full md:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 outline-none"
            />
          </div>
        </div>

        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm relative">
            <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]">
              <tr>
                <th className="px-4 py-3 w-[35%] min-w-50">User</th>
                <th className="px-4 py-3 w-[15%]">Role</th>
                <th className="px-4 py-3 w-[10%]">Area</th>
                <th className="px-4 py-3 w-[15%]">Status</th>
                <th className="px-4 py-3 w-[15%]">Joined</th>
                <th className="px-4 py-3 w-[10%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-10 w-48 bg-slate-200 rounded"></div></td>
                    <td className="px-4 py-3"><div className="h-6 w-16 bg-slate-200 rounded-full"></div></td>
                    <td className="px-4 py-3"><div className="h-4 w-12 bg-slate-200 rounded"></div></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                    <td className="px-4 py-3"></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-600">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isCurrent = user?.id === u._id
                  const isSuper = u.role === 'super_admin'
                  
                  let roleBadge = 'bg-slate-100 text-slate-700'
                  if (u.role === 'citizen') roleBadge = 'bg-blue-50 text-blue-700'
                  else if (u.role === 'officer') roleBadge = 'bg-green-50 text-green-700'
                  else if (u.role === 'admin') roleBadge = 'bg-red-50 text-red-700'

                  let statusDot = 'bg-slate-300'
                  let statusText = 'Unknown'
                  if (u.isActive && u.isPasswordSet) { statusDot = 'bg-green-500'; statusText = 'Active' }
                  else if (!u.isPasswordSet) { statusDot = 'bg-amber-500'; statusText = 'Invite Pending' }
                  else if (!u.isActive) { statusDot = 'bg-red-500'; statusText = 'Deactivated' }

                  return (
                    <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${roleBadge}`}>
                          {u.role === 'officer' ? 'Area Officer' : u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium text-sm">
                        {u.ward || 'No area'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`}></div>
                          <span className="text-sm font-medium text-slate-700">{statusText}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-sm">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!isCurrent && !isSuper && (
                          u.isActive ? (
                            <button
                              onClick={() => handleDeactivate(u._id, u.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deactivate User"
                            >
                              <UserX size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(u._id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Activate User"
                            >
                              <UserCheck size={18} />
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
