'use client'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useWalletStore } from '@/store/walletStore'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import type { Notification } from '@/types'
import { toast } from 'sonner'
import { I18nProvider, useI18n } from '@/lib/i18n'
import { AgeVerificationModal } from '@/components/AgeVerificationModal'

function getNotificationText(notification: Notification, t: ReturnType<typeof useI18n>['t']) {
  if (notification.body) return notification.body

  switch (notification.type) {
    case 'NEW_LIKE':
      return t('notifications.newLike')
    case 'NEW_COMMENT':
      return t('notifications.newComment')
    case 'NEW_FOLLOWER':
      return t('notifications.newFollower')
    case 'NEW_SUBSCRIBER':
      return t('notifications.newSubscriber')
    case 'NEW_MESSAGE':
      return t('notifications.newMessage')
    case 'NEW_TIP':
      return t('notifications.newTip')
    default:
      return t('notifications.default')
  }
}

function getNotificationLink(notification: Notification): string {
  switch (notification.type) {
    case 'NEW_LIKE':
    case 'NEW_COMMENT':
      return notification.refId ? `/posts/${notification.refId}` : '/home'
    case 'NEW_FOLLOWER':
      return notification.actor ? `/creator/${notification.actor.username}` : '/home'
    case 'NEW_SUBSCRIBER':
      return notification.actor ? `/creator/${notification.actor.username}` : '/creator-center'
    case 'NEW_MESSAGE':
      return '/messages'
    case 'NEW_TIP':
    case 'CONTENT_UNLOCK':
      return '/creator-center'
    case 'PAYOUT_SENT':
      return '/creator-center'
    default:
      return '/notifications'
  }
}

function NotificationBridge() {
  const queryClient = useQueryClient()
  const router      = useRouter()
  const { t } = useI18n()
  const accessToken = useAuthStore((state) => state.accessToken)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setBalance = useWalletStore((state) => state.setBalance)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket()
      return
    }

    const socket = connectSocket()
    const handleNotification = (notification: Notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      const link = getNotificationLink(notification)
      toast.success(
        notification.actor
          ? `@${notification.actor.username} ${getNotificationText(notification, t)}`
          : getNotificationText(notification, t),
        {
          action: {
            label: t('common.view'),
            onClick: () => router.push(link),
          },
        },
      )
    }
    const handleWalletBalance = ({ balance }: { balance: number }) => {
      setBalance(balance)
    }

    socket.on('notification:new', handleNotification)
    socket.on('wallet:balance', handleWalletBalance)

    return () => {
      socket.off('notification:new', handleNotification)
      socket.off('wallet:balance', handleWalletBalance)
    }
  }, [accessToken, isAuthenticated, queryClient, router, setBalance, t])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideAgeVerification = pathname === '/for-creators' || pathname === '/for-creators/register'
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 1000 * 60, retry: 1 },
      },
    })
  )

  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationBridge />
        {children}
        {!hideAgeVerification && <AgeVerificationModal />}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{ style: { background: '#161616', border: '1px solid #222', color: '#fff' } }}
        />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </I18nProvider>
  )
}
