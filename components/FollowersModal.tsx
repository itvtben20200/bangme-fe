'use client'
import { useQuery }    from '@tanstack/react-query'
import { X, Star }     from 'lucide-react'
import api             from '@/lib/api'
import { mediaUrl }    from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface UserRow {
  id:          string
  username:    string
  displayName: string | null
  avatarKey:   string | null
  isVerified:  boolean
  role:        string
  followedAt?:    string
  subscribedAt?:  string
  expiresAt?:     string
  price?:         number
}

interface Props {
  mode:    'followers' | 'following' | 'subscribers'
  isOpen:  boolean
  onClose: () => void
}

export default function FollowersModal({ mode, isOpen, onClose }: Props) {
  const endpoint = mode === 'followers' ? '/users/me/followers'
                 : mode === 'following' ? '/users/me/following'
                 :                        '/users/me/subscribers'
  const title    = mode === 'followers' ? 'Follower'
                 : mode === 'following' ? 'Folge ich'
                 :                        'Abonnenten'

  const { data, isLoading } = useQuery<{ success: boolean; data: UserRow[] }>({
    queryKey: ['me', mode],
    queryFn:  () => api.get(endpoint).then(r => r.data),
    enabled:  isOpen,
  })

  if (!isOpen) return null

  const rows = data?.data ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222]">
          <h2 className="text-white font-bold text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1 rounded-lg hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-2 border-[#ff0618] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              {mode === 'followers'  ? 'Noch keine Follower.'
             : mode === 'following'  ? 'Du folgst noch niemandem.'
             :                        'Noch keine Abonnenten.'}
            </div>
          ) : (
            rows.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition"
              >
                {/* Avatar */}
                {user.avatarKey ? (
                  <img
                    src={mediaUrl(user.avatarKey)!}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#ff0618]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[#ff0618]">
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Name / meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-white font-semibold text-sm truncate">
                      {user.displayName ?? user.username}
                    </span>
                    {user.isVerified && (
                      <Star size={11} className="text-[#ff0618] fill-[#ff0618] flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-gray-500 text-xs truncate">@{user.username}</p>
                  {mode === 'subscribers' && user.expiresAt && (
                    <p className="text-gray-600 text-xs">
                      Läuft {formatDistanceToNow(new Date(user.expiresAt), { addSuffix: true, locale: de })} ab
                      {user.price !== undefined && ` · $${user.price.toFixed(2)}/mo`}
                    </p>
                  )}
                  {(mode === 'followers' || mode === 'following') && user.followedAt && (
                    <p className="text-gray-600 text-xs">
                      {mode === 'following' ? 'Folgt seit' : 'Folgt dir seit'}{' '}
                      {formatDistanceToNow(new Date(user.followedAt), { addSuffix: true, locale: de })}
                    </p>
                  )}
                </div>

                {/* Role badge */}
                {user.role === 'CREATOR' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#ff0618]/20 text-[#ff0618] font-semibold flex-shrink-0">
                    Creator
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
