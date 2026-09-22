'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquare, X, ChevronDown, ChevronUp, Send, Pencil } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { getSocket } from '@/lib/socket'

interface OpenChat {
  conversationId: string
  minimized: boolean
}

export default function MessagesWidget() {
  const pathname = usePathname()
  const {
    conversations,
    messages,
    typingUsers,
    isConnected,
    setMessages,
    sendMessage,
    startTyping,
    stopTyping,
    markRead,
    setActiveConversation,
  } = useChatStore()
  const currentUser = useAuthStore((s) => s.user)

  const [isListOpen, setIsListOpen] = useState(false)
  const [isListMinimized, setIsListMinimized] = useState(false)
  const [openChats, setOpenChats] = useState<OpenChat[]>([])
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const bottomRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount ?? 0), 0)

  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${convId}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) setMessages(convId, data.data)
    } catch {}
  }

  const openChat = (convId: string) => {
    setActiveConversation(convId)
    markRead(convId)
    getSocket()?.emit('chat:join', convId)
    loadMessages(convId)
    setOpenChats((prev) => {
      if (prev.find((c) => c.conversationId === convId)) {
        return prev.map((c) =>
          c.conversationId === convId ? { ...c, minimized: false } : c
        )
      }
      // keep max 2 open chat windows
      const trimmed = prev.length >= 2 ? prev.slice(1) : prev
      return [...trimmed, { conversationId: convId, minimized: false }]
    })
  }

  const closeChat = (convId: string) =>
    setOpenChats((prev) => prev.filter((c) => c.conversationId !== convId))

  const toggleChat = (convId: string) =>
    setOpenChats((prev) =>
      prev.map((c) =>
        c.conversationId === convId ? { ...c, minimized: !c.minimized } : c
      )
    )

  const handleSend = async (convId: string) => {
    const text = inputs[convId]?.trim()
    if (!text) return
    try {
      await sendMessage(convId, text)
      setInputs((p) => ({ ...p, [convId]: '' }))
      stopTyping(convId)
    } catch {}
  }

  const handleInput = (convId: string, value: string) => {
    setInputs((p) => ({ ...p, [convId]: value }))
    clearTimeout(typingTimers.current[convId])
    startTyping(convId)
    typingTimers.current[convId] = setTimeout(() => stopTyping(convId), 2000)
  }

  useEffect(() => {
    openChats.forEach(({ conversationId, minimized }) => {
      if (!minimized) {
        bottomRefs.current[conversationId]?.scrollIntoView({ behavior: 'smooth' })
      }
    })
  }, [messages, openChats])

  // hide on the dedicated full-screen messages page
  if (pathname === '/messages' || !currentUser) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-end gap-2 pointer-events-none">
      {/* ── open chat windows (left of the list) ── */}
      {openChats.map(({ conversationId, minimized }) => {
        const conv = conversations.find((c) => c.id === conversationId)
        if (!conv) return null
        const convMsgs = messages[conversationId] ?? []
        const convTyping = typingUsers[conversationId] ?? []
        const input = inputs[conversationId] ?? ''

        return (
          <div
            key={conversationId}
            className="pointer-events-auto w-72 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
            style={{
              background: 'linear-gradient(180deg,#1e1e1e 0%,#161616 100%)',
              height: minimized ? 'auto' : '400px',
            }}
          >
            {/* header */}
            <button
              onClick={() => toggleChat(conversationId)}
              className="flex items-center gap-2.5 px-3 py-2.5 bg-[#222] border-b border-white/10 w-full text-left hover:bg-[#2a2a2a] transition-colors"
            >
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-white text-xs font-bold">
                  {conv.participant?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                {conv.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border-2 border-[#222]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate leading-tight">
                  @{conv.participant?.username}
                </p>
                <p className={`text-xs ${conv.isOnline ? 'text-green-400' : 'text-zinc-500'}`}>
                  {conv.isOnline ? 'Jetzt aktiv' : 'Offline'}
                </p>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <span className="text-zinc-400 hover:text-white p-1">
                  {minimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); closeChat(conversationId) }}
                  className="text-zinc-400 hover:text-white p-1"
                >
                  <X size={14} />
                </span>
              </div>
            </button>

            {!minimized && (
              <>
                {/* messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700">
                  {convMsgs.length === 0 ? (
                    <p className="text-center text-zinc-600 text-xs pt-8">Noch keine Nachrichten</p>
                  ) : (
                    convMsgs.map((msg) => {
                      const isOwn = msg.senderId === currentUser.id
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm leading-snug ${
                              isOwn
                                ? 'bg-brand-red text-white rounded-br-sm'
                                : 'bg-zinc-800 text-white rounded-bl-sm'
                            }`}
                          >
                            <p>{msg.body}</p>
                            <p className="text-[10px] opacity-50 text-right mt-0.5">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  {convTyping.length > 0 && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-800 rounded-2xl px-3 py-2.5 flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                      </div>
                    </div>
                  )}
                  <div
                    ref={(el) => {
                      bottomRefs.current[conversationId] = el
                    }}
                  />
                </div>

                {/* input */}
                <div className="px-3 py-2.5 border-t border-white/10 flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => handleInput(conversationId, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(conversationId)}
                    placeholder="Nachricht..."
                    className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-brand-red transition-colors"
                  />
                  <button
                    onClick={() => handleSend(conversationId)}
                    disabled={!input.trim()}
                    className="text-brand-red hover:text-red-400 disabled:opacity-30 transition-colors flex-shrink-0"
                    aria-label="Senden"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        )
      })}

      {/* ── conversation list panel ── */}
      {isListOpen && (
        <div
          className="pointer-events-auto w-72 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
          style={{
            background: 'linear-gradient(180deg,#1e1e1e 0%,#161616 100%)',
            height: isListMinimized ? 'auto' : '420px',
          }}
        >
          {/* header */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-[#222] border-b border-white/10 cursor-pointer hover:bg-[#2a2a2a] transition-colors"
            onClick={() => setIsListMinimized((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">Nachrichten</span>
              {!isConnected && (
                <span className="w-2 h-2 rounded-full bg-red-500" title="Getrennt" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setIsListMinimized((v) => !v) }}
                className="text-zinc-400 hover:text-white p-1"
                aria-label={isListMinimized ? 'Erweitern' : 'Minimieren'}
              >
                {isListMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsListOpen(false) }}
                className="text-zinc-400 hover:text-white p-1"
                aria-label="Schließen"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {!isListMinimized && (
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
              {conversations.length === 0 ? (
                <p className="text-center text-zinc-600 text-sm p-6">Noch keine Unterhaltungen</p>
              ) : (
                conversations.map((conv) => {
                  const isActive = openChats.some((c) => c.conversationId === conv.id)
                  return (
                    <button
                      key={conv.id}
                      onClick={() => openChat(conv.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/60 transition-colors text-left ${
                        isActive ? 'bg-zinc-800/40' : ''
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center text-white text-sm font-bold">
                          {conv.participant?.username?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        {conv.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#1e1e1e]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate leading-tight">
                          @{conv.participant?.username}
                        </p>
                        <p className="text-zinc-500 text-xs truncate mt-0.5">
                          {conv.lastMessage ?? 'Noch keine Nachrichten'}
                        </p>
                      </div>
                      {(conv.unreadCount ?? 0) > 0 && (
                        <span className="bg-brand-red text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
                          {(conv.unreadCount ?? 0) > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ── toggle button ── */}
      <button
        onClick={() => {
          setIsListOpen((v) => !v)
          setIsListMinimized(false)
        }}
        className="pointer-events-auto w-14 h-14 bg-brand-red rounded-full flex items-center justify-center shadow-2xl hover:bg-red-600 active:scale-95 transition-all relative flex-shrink-0"
        aria-label="Nachrichten ein- oder ausblenden"
      >
        <MessageSquare size={22} className="text-white" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-brand-red text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>
    </div>
  )
}
