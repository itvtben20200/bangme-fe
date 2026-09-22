'use client'

import { useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import type { LiveBroadcastHandle } from '@/components/live/LiveBroadcastRoom'

// Agora uses browser APIs — must be loaded client-side only
const LiveBroadcastRoom = dynamic(
  () => import('@/components/live/LiveBroadcastRoom'),
  { ssr: false, loading: () => <BroadcastSkeleton /> },
)

function BroadcastSkeleton() {
  return (
    <div className="flex items-center justify-center h-full bg-black rounded-2xl">
      <div className="flex flex-col items-center gap-3">
        <span className="w-10 h-10 border-4 border-white/20 border-t-brand-red rounded-full animate-spin" />
        <p className="text-white font-semibold">Loading broadcast room…</p>
      </div>
    </div>
  )
}

function BroadcastContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const broadcastRef = useRef<LiveBroadcastHandle>(null)

  const streamId   = searchParams.get('streamId')   ?? ''
  const channelId  = searchParams.get('channelId')  ?? ''
  const agoraToken = searchParams.get('token')      ?? ''
  const agoraUid   = Number(searchParams.get('agoraUid'))
  const title      = searchParams.get('title')      ?? 'Live Stream'

  if (!streamId || !channelId || !agoraToken || !Number.isSafeInteger(agoraUid) || agoraUid <= 0) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div>
          <p className="text-white font-bold text-lg mb-2">Missing stream parameters</p>
          <p className="text-brand-muted text-sm mb-6">
            Please start a stream from your Creator Center.
          </p>
          <button
            onClick={() => router.push('/creator-center')}
            className="px-6 py-3 bg-brand-red text-white font-bold rounded-xl hover:bg-red-600 transition"
          >
            Go to Creator Center
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-brand-dark p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <h1 className="text-white font-black text-lg">{title}</h1>
        </div>
        <button
          onClick={() => broadcastRef.current?.end()}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition text-sm"
        >
          ⏹ End Live
        </button>
      </div>

      {/* Broadcast room fills remaining height */}
      <div className="flex-1 min-h-0">
        <LiveBroadcastRoom
          ref={broadcastRef}
          streamId={streamId}
          channelId={channelId}
          agoraToken={agoraToken}
          agoraUid={agoraUid}
          streamTitle={title}
          onEnded={() => router.push('/creator-center')}
        />
      </div>
    </div>
  )
}

export default function BroadcastPage() {
  return (
    <Suspense fallback={<BroadcastSkeleton />}>
      <BroadcastContent />
    </Suspense>
  )
}
