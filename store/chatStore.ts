import { create }        from 'zustand'
import type { Message, Conversation } from '@/types'
import { getSocket }      from '@/lib/socket'

interface ChatState {
  conversations:       Conversation[]
  activeConversationId: string | null
  messages:            Record<string, Message[]>
  typingUsers:         Record<string, string[]>

  setConversations:    (convs: Conversation[]) => void
  setActiveConversation: (id: string | null) => void
  setMessages:         (conversationId: string, msgs: Message[]) => void
  appendMessage:       (conversationId: string, msg: Message) => void
  setTyping:           (conversationId: string, userId: string, isTyping: boolean) => void
  markRead:            (conversationId: string) => void

  connectSocket:       () => void
  disconnectSocket:    () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations:        [],
  activeConversationId: null,
  messages:             {},
  typingUsers:          {},

  setConversations:     (convs) => set({ conversations: convs }),
  setActiveConversation: (id)   => set({ activeConversationId: id }),

  setMessages: (conversationId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [conversationId]: msgs } })),

  appendMessage: (conversationId, msg) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [...(s.messages[conversationId] ?? []), msg],
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

  markRead: (conversationId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    })),

  connectSocket: () => {
    const socket = getSocket()
    if (!socket) return

    socket.on('chat:message', (msg: Message & { conversationId: string }) => {
      get().appendMessage(msg.conversationId, msg)
    })

    socket.on('chat:typing', ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      get().setTyping(conversationId, userId, true)
      setTimeout(() => get().setTyping(conversationId, userId, false), 3000)
    })
  },

  disconnectSocket: () => {
    const socket = getSocket()
    if (!socket) return
    socket.off('chat:message')
    socket.off('chat:typing')
  },
}))
