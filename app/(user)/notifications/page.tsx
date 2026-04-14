'use client'
import { useQuery }     from '@tanstack/react-query'
import { Bell, Check }  from 'lucide-react'
import api              from '@/lib/api'
import { mediaUrl }     from '@/lib/utils'
import type { Notification } from '@/types'

export default function NotificationsPage() {
  const { data, isLoading } = useQuery<{ success: boolean; data: Notification[] }>({
    queryKey: ['notifications'],
    queryFn:  () => api.get('/notifications').then((r) => r.data),
  })

  const markAllRead = async () => {
    await api.patch('/notifications/read-all')
  }

  const notifications = data?.data ?? []
  const unread        = notifications.filter((n) => !n.isRead).length

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bell size={24} className="text-[#ff4757]" />
          Notifications
          {unread > 0 && (
            <span className="ml-2 bg-[#ff4757] text-white text-xs rounded-full px-2 py-0.5">
              {unread}
            </span>
          )}
        </h1>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-sm text-[#ff4757] hover:text-red-400 transition"
          >
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-center py-12">Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Bell size={48} className="mx-auto mb-4 opacity-30" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`p-4 rounded-xl flex items-start gap-3 transition ${
                n.isRead ? 'bg-[#161616]' : 'bg-[#1e1e1e] border border-[#ff4757]/20'
              }`}
            >
              {n.actor?.avatarKey ? (
                <img
                  src={mediaUrl(n.actor.avatarKey)!}
                  alt={n.actor.username}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#ff4757]/20 flex items-center justify-center shrink-0">
                  <Bell size={16} className="text-[#ff4757]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">
                  {n.actor && (
                    <span className="font-semibold">@{n.actor.username} </span>
                  )}
                  {n.body}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {!n.isRead && (
                <div className="w-2 h-2 rounded-full bg-[#ff4757] shrink-0 mt-2" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
