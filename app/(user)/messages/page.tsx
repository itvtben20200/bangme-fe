'use client'

import { useEffect, useState, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'
import { getSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/authStore'
import { ConversationItem } from '@/components/chat/ConversationItem'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { toast } from 'sonner'
import { useCallStore } from '@/store/callStore'
import api from '@/lib/api'
import { useI18n } from '@/lib/i18n'

const COPY = {
  en: {
    loadConversationsError: 'Could not load conversations. Is the server running?',
    sendError: 'Failed to send message',
    callFailed: 'Call failed',
    callStartError: 'Could not initiate call',
    loadingConversations: 'Loading conversations...',
    title: 'Messages',
    connected: 'Connected',
    disconnected: 'Disconnected',
    massMessage: 'Mass message',
    noConversations: 'No conversations yet',
    unknown: 'Unknown',
    audioCallFree: 'Audio Call - Free',
    videoCallFree: 'Video Call - Free',
    audioCallPrice: (price: number) => `Audio Call - ${price} BangCoins/min`,
    videoCallPrice: (price: number) => `Video Call - ${price} BangCoins/min`,
    creatorFreeBanner: '✓ Chatting with your subscriber - messaging is free for you',
    messagesPrice: (price: number) => `${price} coins each`,
    audioPrice: (price: number) => `${price} coins/min`,
    videoPrice: (price: number) => `${price} coins/min`,
    noMessages: 'No messages yet. Start the conversation!',
    typing: 'Someone is typing...',
    inputPlaceholder: 'Type a message...',
    send: 'Send',
    selectConversation: 'Select a conversation to start messaging',
    close: 'Close',
    callTitle: (type: 'audio' | 'video') => `Start ${type === 'audio' ? 'Audio' : 'Video'} Call?`,
    callSubtitle: (type: 'audio' | 'video') => `You're about to start a ${type} call with`,
    freeForCreators: 'Free for creators',
    noCoinsCharged: 'No BangCoins will be charged',
    perMinute: (price: number) => `${price} BangCoins per minute`,
    estimatedCost: 'Estimated cost for 10 minutes:',
    cameraNotice: 'Your browser will ask for camera & microphone access.',
    cancel: 'Cancel',
    startCall: 'Start Call',
  },
  de: {
    loadConversationsError: 'Unterhaltungen konnten nicht geladen werden. Läuft der Server?',
    sendError: 'Nachricht konnte nicht gesendet werden',
    callFailed: 'Anruf fehlgeschlagen',
    callStartError: 'Anruf konnte nicht gestartet werden',
    loadingConversations: 'Unterhaltungen werden geladen...',
    title: 'Nachrichten',
    connected: 'Verbunden',
    disconnected: 'Getrennt',
    massMessage: 'Massen-Nachricht',
    noConversations: 'Noch keine Unterhaltungen',
    unknown: 'Unbekannt',
    audioCallFree: 'Audioanruf - kostenlos',
    videoCallFree: 'Videoanruf - kostenlos',
    audioCallPrice: (price: number) => `Audioanruf - ${price} BangCoins/Min.`,
    videoCallPrice: (price: number) => `Videoanruf - ${price} BangCoins/Min.`,
    creatorFreeBanner: '✓ Chat mit deinem Abonnenten - Nachrichten sind für dich kostenlos',
    messagesPrice: (price: number) => `${price} Coins je Nachricht`,
    audioPrice: (price: number) => `${price} Coins/Min.`,
    videoPrice: (price: number) => `${price} Coins/Min.`,
    noMessages: 'Noch keine Nachrichten. Starte die Unterhaltung!',
    typing: 'Jemand schreibt...',
    inputPlaceholder: 'Nachricht schreiben...',
    send: 'Senden',
    selectConversation: 'Wähle eine Unterhaltung aus, um zu schreiben',
    close: 'Schließen',
    callTitle: (type: 'audio' | 'video') => `${type === 'audio' ? 'Audio' : 'Video'}anruf starten?`,
    callSubtitle: (type: 'audio' | 'video') => `Du startest gleich einen ${type === 'audio' ? 'Audio' : 'Video'}anruf mit`,
    freeForCreators: 'Kostenlos für Creator',
    noCoinsCharged: 'Es werden keine BangCoins berechnet',
    perMinute: (price: number) => `${price} BangCoins pro Minute`,
    estimatedCost: 'Geschätzte Kosten für 10 Minuten:',
    cameraNotice: 'Dein Browser fragt nach Kamera- und Mikrofonzugriff.',
    cancel: 'Abbrechen',
    startCall: 'Anruf starten',
  },
} as const

export default function MessagesPage() {
  const { language } = useI18n()
  const copy = COPY[language]
  const {
    conversations,
    activeConversationId,
    messages,
    typingUsers,
    isConnected,
    setConversations,
    setActiveConversation,
    setMessages,
    sendMessage,
    startTyping,
    stopTyping,
    markRead,
  } = useChatStore()

  const currentUser = useAuthStore((s) => s.user)
  const { setCalling } = useCallStore()
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [pendingCall, setPendingCall] = useState<'audio' | 'video' | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Load conversations on mount and whenever the tab regains focus
  useEffect(() => {
    loadConversations()
    const handleFocus = () => loadConversations()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId)
      joinRoom(activeConversationId)
      markRead(activeConversationId)
    }
  }, [activeConversationId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages[activeConversationId || '']])

  const loadConversations = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/conversations`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        setConversations(data.data)
      }
    } catch {
      toast.error(copy.loadConversationsError)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${conversationId}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        setMessages(conversationId, data.data)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const joinRoom = (conversationId: string) => {
    const socket = getSocket()
    socket?.emit('chat:join', conversationId)
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversationId) return

    try {
      await sendMessage(activeConversationId, messageInput)
      setMessageInput('')
      stopTyping(activeConversationId)
    } catch (error: any) {
      const msg = error?.data?.message ?? (error instanceof Error ? error.message : null)
      toast.error(msg ?? copy.sendError)
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value)

    if (!activeConversationId) return

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Start typing
    startTyping(activeConversationId)

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(activeConversationId)
    }, 2000)
  }

  const activeConversation = conversations.find((c) => c.id === activeConversationId)
  const isCurrentUserCreator = currentUser?.role === 'creator'
  const pricing = activeConversation?.creatorPricing
  const msgPrice   = isCurrentUserCreator ? 0 : (pricing?.messagePrice         ?? 2)
  const audioPrice = isCurrentUserCreator ? 0 : (pricing?.audioCallPricePerMin ?? 8)
  const videoPrice = isCurrentUserCreator ? 0 : (pricing?.videoCallPricePerMin ?? 15)
  const activeMessages = activeConversationId ? messages[activeConversationId] || [] : []
  const activeTypingUsers = activeConversationId ? typingUsers[activeConversationId] || [] : []

  const startCall = async (callType: 'audio' | 'video') => {
    if (!activeConversation || !activeConversationId || !currentUser) return
    const participantId = activeConversation.participant?.id
    if (!participantId) return
    try {
      const { data } = await api.post('/calls/token', { conversationId: activeConversationId })
      const { channel, token, appId } = data.data
      setCalling({ conversationId: activeConversationId, callType, channel, remoteUserId: participantId })
      getSocket().emit('call:invite', {
        targetUserId:   participantId,
        callerUsername: currentUser.username,
        conversationId: activeConversationId,
        callType,
        channel,
      })
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? (err instanceof Error ? err.message : null)
      toast.error(msg ? `${copy.callFailed}: ${msg}` : copy.callStartError)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-dark">
        <p className="text-brand-muted">{copy.loadingConversations}</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-brand-dark">
      {/* Conversations list */}
      <div className="w-80 border-r border-brand-border flex flex-col">
        <div className="p-4 border-b border-brand-border flex items-center justify-between">
          <h1 className="text-white font-bold text-lg">{copy.title}</h1>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="w-2 h-2 bg-green-500 rounded-full" title={copy.connected} />
            ) : (
              <span className="w-2 h-2 bg-red-500 rounded-full" title={copy.disconnected} />
            )}
            <button className="text-brand-muted hover:text-white" title={copy.massMessage}>📢</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-center text-brand-muted text-sm p-4">{copy.noConversations}</p>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={activeConversationId === conv.id}
                onClick={() => setActiveConversation(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Thread */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-card flex items-center justify-center text-white font-bold">
                {activeConversation.participant?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  @{activeConversation.participant?.username || copy.unknown}
                </p>
                <p className={`text-xs ${activeConversation.isOnline ? 'text-green-400' : 'text-brand-muted'}`}>
                  {activeConversation.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                data-testid="call-audio-btn"
                onClick={() => setPendingCall('audio')}
                className="bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-sm text-brand-text hover:bg-brand-card"
                title={isCurrentUserCreator ? copy.audioCallFree : copy.audioCallPrice(audioPrice)}>
                🎧 Audio
              </button>
              <button
                data-testid="call-video-btn"
                onClick={() => setPendingCall('video')}
                className="bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-sm text-brand-text hover:bg-brand-card"
                title={isCurrentUserCreator ? copy.videoCallFree : copy.videoCallPrice(videoPrice)}>
                📹 Video
              </button>
            </div>
          </div>

          <div className="bg-brand-surface border-b border-brand-border px-4 py-2 text-xs text-brand-muted flex gap-6">
            {isCurrentUserCreator ? (
              <span className="text-green-400 font-semibold">{copy.creatorFreeBanner}</span>
            ) : (
              <>
                <span>💬 {language === 'de' ? 'Nachrichten' : 'Messages'}: <strong className="text-white">{copy.messagesPrice(msgPrice)}</strong></span>
                <span>🎧 Audio: <strong className="text-white">{copy.audioPrice(audioPrice)}</strong></span>
                <span>📹 Video: <strong className="text-white">{copy.videoPrice(videoPrice)}</strong></span>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeMessages.length === 0 ? (
              <p className="text-center text-brand-muted text-xs">{copy.noMessages}</p>
            ) : (
              activeMessages.map((msg) => {
                const isOwn = msg.senderId === currentUser?.id
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isOwn
                          ? 'bg-brand-red text-white'
                          : 'bg-brand-card text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.body}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            {activeTypingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-brand-muted text-sm px-4">
                <div className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce animation-delay-200">●</span>
                  <span className="animate-bounce animation-delay-400">●</span>
                </div>
                <span>{copy.typing}</span>
              </div>
            )}
          </div>
          {/* Message input */}
          <div className="p-4 border-t border-brand-border flex gap-3 items-center">
            <input
              type="text"
              value={messageInput}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={copy.inputPlaceholder}
              className="flex-1 bg-brand-surface border border-brand-border rounded-lg px-4 py-2 text-white placeholder-brand-muted text-sm focus:outline-none focus:border-brand-red"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="bg-brand-red text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-red-600 transition-colors"
            >
              {copy.send}
            </button>
          </div>        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-brand-muted">
          <p>{copy.selectConversation}</p>
        </div>
      )}

      {/* ── Call confirmation dialog ── */}
      {pendingCall && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPendingCall(null)}
        >
          <div
            className={`bg-[#1c1c1e] rounded-2xl w-[380px] shadow-2xl relative overflow-hidden
              border ${pendingCall === 'video' ? 'border-indigo-500/30' : 'border-[#2c2c2e]'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Video call — coloured header strip */}
            {pendingCall === 'video' && (
              <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            )}

            <div className="p-7">
              {/* Close */}
              <button
                onClick={() => setPendingCall(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#2c2c2e] hover:bg-[#3a3a3c] flex items-center justify-center text-gray-400 hover:text-white transition text-sm"
                aria-label={copy.close}
              >
                ✕
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-5">
                {pendingCall === 'video' ? (
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-3xl">
                    📹
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#2c2c2e] flex items-center justify-center text-3xl">
                    🎧
                  </div>
                )}
              </div>

              {/* Title */}
              <h2 className="text-white font-bold text-xl text-center mb-2">
                {copy.callTitle(pendingCall)}
              </h2>

              {/* Subtitle */}
              <p className="text-gray-400 text-sm text-center mb-5">
                {copy.callSubtitle(pendingCall)}{' '}
                <span className="text-white font-medium">
                  @{activeConversation?.participant?.username ?? copy.unknown}
                </span>
                .
              </p>

              {/* Cost box */}
              {isCurrentUserCreator ? (
                <div className="rounded-xl bg-green-600/15 border border-green-600/30 px-5 py-4 mb-4 text-center">
                  <p className="text-green-400 font-bold text-base">{copy.freeForCreators}</p>
                  <p className="text-green-400/70 text-xs mt-1">{copy.noCoinsCharged}</p>
                </div>
              ) : pendingCall === 'video' ? (
                <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/25 px-5 py-4 mb-4 text-center">
                  <p className="text-indigo-300 font-bold text-base">
                    {copy.perMinute(videoPrice)}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {copy.estimatedCost}{' '}
                    <strong className="text-gray-300">{videoPrice * 10} BangCoins</strong>
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-[#ff0618]/10 border border-[#ff0618]/30 px-5 py-4 mb-4 text-center">
                  <p className="text-[#ff6b81] font-bold text-base">
                    {copy.perMinute(audioPrice)}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {copy.estimatedCost}{' '}
                    <strong className="text-gray-300">{audioPrice * 10} BangCoins</strong>
                  </p>
                </div>
              )}

              {/* Camera-access notice for video */}
              {pendingCall === 'video' && (
                <p className="text-gray-500 text-xs text-center mb-4 flex items-center justify-center gap-1">
                  <span>🔒</span> {copy.cameraNotice}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingCall(null)}
                  className="flex-1 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-gray-300 font-semibold py-3 text-sm transition"
                >
                  {copy.cancel}
                </button>
                <button
                  data-testid="call-confirm-start"
                  onClick={() => { const t = pendingCall; setPendingCall(null); startCall(t) }}
                  className={`flex-1 rounded-xl text-white font-semibold py-3 text-sm transition
                    ${pendingCall === 'video'
                      ? 'bg-indigo-600 hover:bg-indigo-500'
                      : 'bg-green-600 hover:bg-green-500'}`}
                >
                  {copy.startCall}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
