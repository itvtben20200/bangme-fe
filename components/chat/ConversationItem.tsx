import type { Conversation } from '@/types'
import { mediaUrl } from '@/lib/utils'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const participant = conversation.participant
  const avatarUrl = mediaUrl(participant?.avatarKey)

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 hover:bg-brand-surface cursor-pointer border-b border-brand-border transition-colors ${
        isActive ? 'bg-brand-surface' : ''
      }`}
    >
      <div className="relative flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={participant.username || 'User'}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-brand-card flex items-center justify-center text-white font-bold">
            {participant?.username?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        {conversation.isOnline && (
          <span
            className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-brand-dark"
            title="Online"
          />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-white text-sm font-semibold truncate">
            @{participant?.username || 'Unknown'}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="bg-brand-red text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-bold ml-2">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-brand-muted text-xs truncate flex-1">
            {conversation.lastMessage || 'No messages yet'}
          </p>
          {conversation.lastMessageAt && (
            <span className="text-brand-muted text-xs flex-shrink-0">
              {formatTimestamp(conversation.lastMessageAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
