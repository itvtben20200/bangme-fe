import { create }        from 'zustand'
import type { Message, Conversation } from '@/types'
import { getSocket }      from '@/lib/socket'

interface ChatState {
  conversations:       Conversation[]
  activeConversationId: string | null
  messages:            Record<string, Message[]>
  typingUsers:         Record<string, string[]>
  onlineUsers:         Set<string>
  isConnected:         boolean

  setConversations:    (convs: Conversation[]) => void
  setActiveConversation: (id: string | null) => void
  setMessages:         (conversationId: string, msgs: Message[]) => void
  appendMessage:       (conversationId: string, msg: Message) => void
  updateMessage:       (conversationId: string, msgId: string, updates: Partial<Message>) => void
  setTyping:           (conversationId: string, userId: string, isTyping: boolean) => void
  setUserOnline:       (userId: string, isOnline: boolean) => void
  markRead:            (conversationId: string) => void
  sendMessage:         (conversationId: string, body: string, mediaKey?: string) => Promise<void>
  startTyping:         (conversationId: string) => void
  stopTyping:          (conversationId: string) => void
  
  connectSocket:       () => void
  disconnectSocket:    () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations:        [],
  activeConversationId: null,
  messages:             {},
  typingUsers:          {},
  onlineUsers:          new Set(),
  isConnected:          false,

  setConversations:     (convs) => set({ conversations: convs }),
  setActiveConversation: (id)   => set({ activeConversationId: id }),

  setMessages: (conversationId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [conversationId]: msgs } })),

  appendMessage: (conversationId, msg) =>
    set((s) => {
      const existing = s.messages[conversationId] ?? []
      if (existing.some((m) => m.id === msg.id)) return s
      return {
        messages: {
          ...s.messages,
          [conversationId]: [...existing, msg],
        },
      }
    }),

  updateMessage: (conversationId, msgId, updates) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] ?? []).map(m =>
          m.id === msgId ? { ...m, ...updates } : m
        ),
      },
    })),

  setTyping: (conversationId, userId, isTyping) =>
    set((s) => {
      const current = s.typingUsers[conversationId] ?? []
      return {
        typingUsers: {
          ...s.typingUsers,
          [conversationId]: isTyping
            ? [...new Set([...current, userId])]
            : current.filter((id) => id !== userId),
        },
      }
    }),

  setUserOnline: (userId, isOnline) =>
    set((s) => {
      const newOnline = new Set(s.onlineUsers)
      if (isOnline) {
        newOnline.add(userId)
      } else {
        newOnline.delete(userId)
      }
      // Update conversations to reflect online status
      const updatedConvs = s.conversations.map(c => 
        c.participant?.id === userId ? { ...c, isOnline } : c
      )
      return { onlineUsers: newOnline, conversations: updatedConvs }
    }),

  markRead: (conversationId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    })),

  sendMessage: async (conversationId, body, mediaKey) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body, mediaKey }),
      })
      if (!response.ok) throw new Error('Failed to send message')
      const data = await response.json()
      if (data.success && data.data) {
        // Optimistically add message; appendMessage deduplicates if socket fires first
        get().appendMessage(conversationId, { ...data.data, conversationId })
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, lastMessage: data.data.body, lastMessageAt: data.data.createdAt }
              : c
          ),
        }))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  },

  startTyping: (conversationId) => {
    const socket = getSocket()
    if (socket?.connected) {
      socket.emit('chat:typing', conversationId)
    }
  },

  stopTyping: (conversationId) => {
    const socket = getSocket()
    if (socket?.connected) {
      socket.emit('chat:stop_typing', conversationId)
    }
  },

  connectSocket: () => {
    const socket = getSocket()
    if (!socket) return

    socket.on('connect', () => {
      set({ isConnected: true })
      console.log('Chat socket connected')
    })

    socket.on('disconnect', () => {
      set({ isConnected: false })
      console.log('Chat socket disconnected')
    })

    socket.on('chat:message', (msg: Message & { conversationId: string }) => {
      get().appendMessage(msg.conversationId, msg)
      
      // Update last message in conversations list
      set((s) => ({
        conversations: s.conversations.map(c =>
          c.id === msg.conversationId
            ? { ...c, lastMessage: msg.body, lastMessageAt: msg.createdAt }
            : c
        ),
      }))
    })

    socket.on('chat:typing', ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      get().setTyping(conversationId, userId, true)
      setTimeout(() => get().setTyping(conversationId, userId, false), 3000)
    })

    socket.on('chat:stop_typing', ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      get().setTyping(conversationId, userId, false)
    })

    socket.on('chat:read', ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      // Handle read receipts - could mark messages as read
      console.log('Messages read by:', userId, 'in', conversationId)
    })

    socket.on('user:online', ({ userId }: { userId: string }) => {
      get().setUserOnline(userId, true)
    })

    socket.on('user:offline', ({ userId }: { userId: string }) => {
      get().setUserOnline(userId, false)
    })

    if (!socket.connected) {
      socket.connect()
    }
  },

  disconnectSocket: () => {
    const socket = getSocket()
    if (!socket) return
    socket.off('connect')
    socket.off('disconnect')
    socket.off('chat:message')
    socket.off('chat:typing')
    socket.off('chat:stop_typing')
    socket.off('chat:read')
    socket.off('user:online')
    socket.off('user:offline')
    if (socket.connected) {
      socket.disconnect()
    }
    set({ isConnected: false })
  },
}))
