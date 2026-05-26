'use client'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import type { Notification } from '@/types'
import { toast } from 'sonner'

function getNotificationText(notification: Notification) {
  if (notification.body) return notification.body

  switch (notification.type) {
    case 'NEW_LIKE':
      return 'liked your post.'
    case 'NEW_COMMENT':
      return 'commented on your post.'
    case 'NEW_FOLLOWER':
      return 'started following you.'
    case 'NEW_SUBSCRIBER':
      return 'subscribed to your content.'
    case 'NEW_MESSAGE':
      return 'sent you a message.'
    case 'NEW_TIP':
      return 'sent you a tip.'
    default:
      return 'sent you a notification.'
  }
}

function NotificationBridge() {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket()
      return
    }

    const socket = connectSocket()
    const handleNotification = (notification: Notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success(notification.actor ? `@${notification.actor.username} ${getNotificationText(notification)}` : getNotificationText(notification))
    }

    socket.on('notification:new', handleNotification)

    return () => {
      socket.off('notification:new', handleNotification)
    }
  }, [accessToken, isAuthenticated, queryClient])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 1000 * 60, retry: 1 },
      },
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationBridge />
      {children}
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{ style: { background: '#161616', border: '1px solid #222', color: '#fff' } }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
