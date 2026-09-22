'use client'
import { useEffect } from 'react'
import dynamic        from 'next/dynamic'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useCallStore, type IncomingCall } from '@/store/callStore'
import { getSocket }    from '@/lib/socket'
import MessagesWidget   from '@/components/layout/MessagesWidget'

// Agora accesses `window` at module load time — must be client-only
const CallModal = dynamic(() => import('@/components/CallModal'), { ssr: false })

export default function ChatProvider({ children }: { children: React.ReactNode }) {
  const connectSocket    = useChatStore((s) => s.connectSocket)
  const disconnectSocket = useChatStore((s) => s.disconnectSocket)
  const setConversations = useChatStore((s) => s.setConversations)
  const setIncoming      = useCallStore((s) => s.setIncoming)
  const clearCall        = useCallStore((s) => s.clearCall)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user) return

    connectSocket()

    // Fetch initial conversations so the unread badge is populated on every page
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/conversations`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setConversations(data.data)
      })
      .catch(() => {})

    // ── Incoming call signaling ───────────────────────────────────────────────
    const socket = getSocket()
    const onIncoming = (payload: IncomingCall) => setIncoming(payload)
    const onRejected = () => clearCall()
    const onBusy     = () => { clearCall(); import('sonner').then(({ toast }) => toast.error('User is busy')) }

    socket.on('call:incoming', onIncoming)
    socket.on('call:rejected', onRejected)
    socket.on('call:busy',     onBusy)

    return () => {
      socket.off('call:incoming', onIncoming)
      socket.off('call:rejected', onRejected)
      socket.off('call:busy',     onBusy)
      disconnectSocket()
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {children}
      <CallModal />
      <MessagesWidget />
    </>
  )
}
