'use client'

import { useEffect, useState, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'
import { getSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/authStore'
import { ConversationItem } from '@/components/chat/ConversationItem'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { TypingIndicator } from '@/components/chat/TypingIndicator'

export default function MessagesPage() {
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
    connectSocket,
    disconnectSocket,
  } = useChatStore()

  const currentUser = useAuthStore((s) => s.user)
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
    connectSocket()
    return () => disconnectSocket()
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
    } catch (error) {
      console.error('Failed to load conversations:', error)
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
    } catch (error) {
      console.error('Failed to send message:', error)
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
  const activeMessages = activeConversationId ? messages[activeConversationId] || [] : []
  const activeTypingUsers = activeConversationId ? typingUsers[activeConversationId] || [] : []

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-dark">
        <p className="text-brand-muted">Loading conversations...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-brand-dark">
      {/* Conversations list */}
      <div className="w-80 border-r border-brand-border flex flex-col">
        <div className="p-4 border-b border-brand-border flex items-center justify-between">
          <h1 className="text-white font-bold text-lg">Messages</h1>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="w-2 h-2 bg-green-500 rounded-full" title="Connected" />
            ) : (
              <span className="w-2 h-2 bg-red-500 rounded-full" title="Disconnected" />
            )}
            <button className="text-brand-muted hover:text-white" title="Mass message">📢</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-center text-brand-muted text-sm p-4">No conversations yet</p>
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
                  @{activeConversation.participant?.username || 'Unknown'}
                </p>
                <p className={`text-xs ${activeConversation.isOnline ? 'text-green-400' : 'text-brand-muted'}`}>
                  {activeConversation.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-sm text-brand-text hover:bg-brand-card" title="Audio Call – 8 BangCoins/min">
                🎧 Audio
              </button>
              <button className="bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-sm text-brand-text hover:bg-brand-card" title="Video Call – 15 BangCoins/min">
                📹 Video
              </button>
            </div>
          </div>

          <div className="bg-brand-surface border-b border-brand-border px-4 py-2 text-xs text-brand-muted flex gap-6">
            <span>💬 Messages: <strong className="text-white">2 coins each</strong></span>
            <span>🎧 Audio: <strong className="text-white">8 coins/min</strong></span>
            <span>📹 Video: <strong className="text-white">15 coins/min</strong></span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeMessages.length === 0 ? (
              <p className="text-center text-brand-muted text-xs">No messages yet. Start the conversation!</p>
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
                <span>Someone is typing...</span>
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
              placeholder="Type a message..."
              className="flex-1 bg-brand-surface border border-brand-border rounded-lg px-4 py-2 text-white placeholder-brand-muted text-sm focus:outline-none focus:border-brand-red"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="bg-brand-red text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-red-600 transition-colors"
            >
              Send
            </button>
          </div>        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-brand-muted">
          <p>Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  )
}
