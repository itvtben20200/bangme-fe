interface TypingIndicatorProps {
  users?: string[]
  className?: string
}

export function TypingIndicator({ users = [], className = '' }: TypingIndicatorProps) {
  if (users.length === 0) return null

  return (
    <div className={`flex items-center gap-2 text-brand-muted text-sm ${className}`}>
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-brand-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-brand-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-brand-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>
        {users.length === 1 ? 'typing...' : `${users.length} people typing...`}
      </span>
    </div>
  )
}
