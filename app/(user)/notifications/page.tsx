'use client'
import { useState }                 from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, Heart, MessageCircle, UserPlus, CreditCard, Coins } from 'lucide-react'
import { useRouter }                from 'next/navigation'
import { formatDistanceToNow }      from 'date-fns'
import { de }                       from 'date-fns/locale'
import api                          from '@/lib/api'
import { mediaUrl }                 from '@/lib/utils'
import { useAuthStore }             from '@/store/authStore'
import type { Notification }        from '@/types'

type Tab = 'all' | 'unread' | 'mentions'

function getNotificationText(n: Notification): string {
  if (n.body) return n.body
  switch (n.type) {
    case 'NEW_LIKE':        return 'gefällt dein Beitrag.'
    case 'NEW_COMMENT':     return 'hat deinen Beitrag kommentiert.'
    case 'NEW_FOLLOWER':    return 'folgt dir jetzt.'
    case 'NEW_SUBSCRIBER':  return 'hat deine Inhalte abonniert.'
    case 'NEW_MESSAGE':     return 'hat dir eine Nachricht gesendet.'
    case 'NEW_TIP':         return 'hat dir ein Trinkgeld gesendet.'
    case 'CONTENT_UNLOCK':  return 'hat deinen Beitrag gekauft.'
    case 'PAYOUT_SENT':     return 'Deine Auszahlung wurde gesendet.'
    default:                return 'hat dir eine Benachrichtigung gesendet.'
  }
}

function getNotificationLink(n: Notification): string {
  switch (n.type) {
    case 'NEW_LIKE':
    case 'NEW_COMMENT':     return n.refId ? `/posts/${n.refId}` : '/home'
    case 'NEW_FOLLOWER':    return n.actor ? `/creator/${n.actor.username}` : '/home'
    case 'NEW_SUBSCRIBER':  return '/creator-center'
    case 'NEW_MESSAGE':     return '/messages'
    case 'NEW_TIP':
    case 'CONTENT_UNLOCK':
    case 'PAYOUT_SENT':     return '/creator-center'
    case 'SYSTEM':          return n.refId ? '/creator-center' : '/notifications'
    default:                return '/notifications'
  }
}

function NotifIcon({ type }: { type: Notification['type'] }) {
  const cls = 'w-full h-full flex items-center justify-center rounded-full'
  switch (type) {
    case 'NEW_LIKE':        return <div className={`${cls} bg-red-500/20`}><Heart size={16} className="text-red-400" /></div>
    case 'NEW_COMMENT':     return <div className={`${cls} bg-blue-500/20`}><MessageCircle size={16} className="text-blue-400" /></div>
    case 'NEW_FOLLOWER':    return <div className={`${cls} bg-green-500/20`}><UserPlus size={16} className="text-green-400" /></div>
    case 'NEW_SUBSCRIBER':  return <div className={`${cls} bg-purple-500/20`}><CreditCard size={16} className="text-purple-400" /></div>
    case 'NEW_MESSAGE':     return <div className={`${cls} bg-blue-500/20`}><MessageCircle size={16} className="text-blue-400" /></div>
    case 'NEW_TIP':
    case 'CONTENT_UNLOCK':  return <div className={`${cls} bg-yellow-500/20`}><Coins size={16} className="text-yellow-400" /></div>
    case 'PAYOUT_SENT':     return <div className={`${cls} bg-green-500/20`}><Coins size={16} className="text-green-400" /></div>
    default:                return <div className={`${cls} bg-[#ff0618]/20`}><Bell size={16} className="text-[#ff0618]" /></div>
  }
}

export default function NotificationsPage() {
  const router        = useRouter()
  const qc            = useQueryClient()
  const { user }      = useAuthStore()
  const [tab, setTab] = useState<Tab>('all')

  const { data, isLoading } = useQuery<{ success: boolean; data: Notification[] }>({
    queryKey: ['notifications'],
    queryFn:  () => api.get('/notifications').then(r => r.data),
    refetchInterval: 30_000,
  })

  const all         = data?.data ?? []
  const unreadCount = all.filter(n => !n.isRead).length

  const visible = all.filter(n => {
    if (tab === 'unread')   return !n.isRead
    if (tab === 'mentions') return n.type === 'NEW_COMMENT' || (n.body?.includes(`@${user?.username}`) ?? false)
    return true
  })

  const markAllRead = async () => {
    await api.patch('/notifications/read-all')
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      qc.setQueryData<{ success: boolean; data: Notification[] }>(
        ['notifications'],
        old => old ? { ...old, data: old.data.map(x => x.id === n.id ? { ...x, isRead: true } : x) } : old,
      )
      api.patch(`/notifications/${n.id}/read`).catch(() => {})
    }
    router.push(getNotificationLink(n))
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all',      label: 'Alle' },
    { key: 'unread',   label: 'Ungelesen' },
    { key: 'mentions', label: 'Erwähnungen' },
  ]

  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-white">Benachrichtigungen</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-[#ff0618] hover:text-red-400 transition font-semibold"
          >
            <Check size={13} /> Alle als gelesen markieren
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-5">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              tab === t.key
                ? 'bg-[#ff0618] text-white'
                : 'bg-[#1e1e1e] text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
            {t.key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-white/20 text-white text-xs rounded-full px-1.5">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-[#1a1a1a] animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Bell size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">Keine Benachrichtigungen vorhanden</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map(n => (
            <li key={n.id}>
              <button
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-4 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                  n.isRead
                    ? 'bg-[#181818] hover:bg-[#202020]'
                    : 'bg-[#1c1c1c] border border-[#2a2a2a] hover:bg-[#222]'
                }`}
              >
                <div className="w-11 h-11 rounded-full overflow-hidden shrink-0">
                  {n.actor?.avatarKey ? (
                    <img src={mediaUrl(n.actor.avatarKey)!} alt={n.actor.username} className="w-full h-full object-cover" />
                  ) : (
                    <NotifIcon type={n.type} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white leading-snug">
                    {n.actor && (
                      <span className="font-bold text-[#ff0618]">@{n.actor.username} </span>
                    )}
                    <span className="text-gray-200">{getNotificationText(n)}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: de })}
                  </p>
                </div>

                {!n.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff0618] shrink-0" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
