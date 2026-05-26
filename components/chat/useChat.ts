import { useEffect, useCallback } from 'react'
import { useChatStore } from '@/store/chatStore'
import { getSocket } from '@/lib/socket'

interface UseChatOptions {
  autoConnect?: boolean
  conversationId?: string | null
}

export function useChat(options: UseChatOptions = {}) {
  const { autoConnect = true, conversationId } = options
  
  const {
    conversations,
    activeConversationId,
    messages,
    typingUsers,
    onlineUsers,
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

  // Auto-connect socket on mount
  useEffect(() => {
    if (autoConnect) {
      connectSocket()
      return () => disconnectSocket()
    }
  }, [autoConnect])

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/conversations`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        setConversations(data.data)
      }
      return data.data
    } catch (error) {
      console.error('Failed to load conversations:', error)
      throw error
    }
  }, [setConversations])

  // Load messages for a conversation
  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${convId}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        setMessages(convId, data.data)
      }
      return data.data
    } catch (error) {
      console.error('Failed to load messages:', error)
      throw error
    }
  }, [setMessages])

  // Join a conversation room
  const joinConversation = useCallback((convId: string) => {
    const socket = getSocket()
    socket?.emit('chat:join', convId)
    setActiveConversation(convId)
    loadMessages(convId)
    markRead(convId)
  }, [setActiveConversation, loadMessages, markRead])

  // Leave a conversation room
  const leaveConversation = useCallback((convId: string) => {
    const socket = getSocket()
    socket?.emit('chat:leave', convId)
  }, [])

  // Start a new conversation
  const startConversation = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/start/${userId}`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        await loadConversations()
        joinConversation(data.data.id)
        return data.data
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      throw error
    }
  }, [loadConversations, joinConversation])

  return {
    // State
    conversations,
    activeConversationId,
    messages: conversationId ? messages[conversationId] || [] : [],
    typingUsers: conversationId ? typingUsers[conversationId] || [] : [],
    onlineUsers,
    isConnected,
    
    // Actions
    loadConversations,
    loadMessages,
    joinConversation,
    leaveConversation,
    startConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markRead,
    setActiveConversation,
  }
}
