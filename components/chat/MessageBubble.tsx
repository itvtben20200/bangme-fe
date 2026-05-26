import type { Message } from '@/types'
import { mediaUrl } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showSender?: boolean
  senderName?: string
}

export function MessageBubble({ message, isOwn, showSender = false, senderName }: MessageBubbleProps) {
  const mediaSrc = mediaUrl(message.mediaKey)

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="flex flex-col gap-1 max-w-[70%]">
        {showSender && !isOwn && senderName && (
          <span className="text-xs text-brand-muted px-2">{senderName}</span>
        )}
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwn
              ? 'bg-brand-red text-white rounded-br-none'
              : 'bg-brand-card text-white rounded-bl-none'
          }`}
        >
          {mediaSrc && (
            <div className="mb-2">
              {message.type === 'IMAGE' ? (
                <img
                  src={mediaSrc}
                  alt="Attachment"
                  className="rounded max-w-full"
                />
              ) : message.type === 'VIDEO' ? (
                <video
                  src={mediaSrc}
                  controls
                  className="rounded max-w-full"
                />
              ) : null}
            </div>
          )}
          {message.body && <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>}
          <div className="flex items-center justify-between gap-3 mt-1">
            <p className="text-xs opacity-70">
              {new Date(message.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
            {message.bangcoinsCharged > 0 && (
              <span className="text-xs opacity-70">🪙 {message.bangcoinsCharged}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
