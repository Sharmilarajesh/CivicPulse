'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ExternalLink, Clock, CheckCheck, Trash2 } from 'lucide-react'
import api from '@/lib/axios'
import { socket } from '@/lib/socket'
import { timeAgo } from '@/utils/timeAgo'
import { useAuth } from '@/context/AuthContext'

export default function Notifications() {
  const router = useRouter()
  const { user } = useAuth()
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get('/notifications')
        const fetchedNotifs = Array.isArray(data) ? data : (data.notifications || [])
        setNotifs(fetchedNotifs)
      } catch (err) { console.error(err) } finally { setLoading(false) }
    }
    fetchNotifs()

    socket.on('notification', (newNotif) => {
      if (!newNotif || !newNotif.userId || newNotif.userId.toString() === user?.id?.toString()) {
        setNotifs(prev => [newNotif, ...prev])
      }
    })
    return () => { socket.off('notification') }
  }, [user?.id])

  const handleRead = async (id: string, issueId: any) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifs(notifs.map(n => n._id === id ? { ...n, isRead: true } : n))
      window.dispatchEvent(new Event('notifications_updated'))
      const targetId = typeof issueId === 'string' ? issueId : issueId?._id
      if (targetId) router.push(`/issues/${targetId}`)
    } catch (err) {}
  }

  const markAllRead = async () => {
    try {
      await Promise.all(notifs.filter(n => !n.isRead).map(n => api.patch(`/notifications/${n._id}/read`)))
      setNotifs(notifs.map(n => ({ ...n, isRead: true })))
      window.dispatchEvent(new Event('notifications_updated'))
    } catch (err) {}
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    
    setTimeout(() => {
      setNotifs(prev => prev.filter(n => n._id !== id));
      setDeletingId(null);
    }, 300);

    try {
      await api.delete(`/notifications/${id}`);
      window.dispatchEvent(new Event('notifications_updated'))
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  }

  const highlightMessage = (msg: string) => {
    let result = msg;
    const statuses = [
      { key: 'resolved', class: 'text-green-700 bg-green-100 border border-green-200 px-1.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider' },
      { key: 'in progress', class: 'text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider' },
      { key: 'assigned', class: 'text-purple-700 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider' },
      { key: 'under review', class: 'text-blue-700 bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider' },
      { key: 'reported', class: 'text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider' }
    ];

    statuses.forEach(s => {
      const regex = new RegExp(`\\b${s.key}\\b`, 'gi');
      result = result.replace(regex, `<span class="${s.class}">$&</span>`);
    });

    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  }

  const unreadCount = notifs.filter(n => !n.isRead).length

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto fade-in">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={32} className={`text-slate-800 ${unreadCount > 0 ? 'shake' : ''}`} />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />}
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-10 text-slate-500">Loading...</div>
        ) : notifs.length > 0 ? (
          notifs.map((n, i) => (
            <div 
              key={n._id} onClick={() => handleRead(n._id, n.issueId)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 ease-in-out fade-up group
                ${!n.isRead ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'}
                ${deletingId === n._id ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'}
              `}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex gap-4">
                <div className="mt-1 shrink-0">
                  <div className={`w-3 h-3 rounded-full ${!n.isRead ? 'bg-blue-500 pulse-dot' : 'bg-slate-300'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-[15px] mb-2 text-slate-800 ${!n.isRead ? 'font-bold' : 'font-medium'}`}>
                    {highlightMessage(n.message)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <span className="flex items-center gap-1 text-blue-600 group-hover:underline"><ExternalLink size={12} /> {n.issueId?.title || 'View Issue'}</span>
                      <span className="flex items-center gap-1 text-slate-400"><Clock size={12} /> {timeAgo(n.createdAt)}</span>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, n._id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Notification"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 fade-in">
            <Bell size={48} className="mx-auto text-slate-300 mb-4 swing" />
            <p className="text-lg font-bold text-slate-700">No notifications yet</p>
            <p className="text-slate-500">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  )
}
