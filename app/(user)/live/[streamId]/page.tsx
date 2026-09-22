'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState }  from 'react'
import dynamic from 'next/dynamic'
import Link    from 'next/link'
import api     from '@/lib/api'
import { mediaUrl } from '@/lib/utils'
import type { LiveStream } from '@/types'

const LiveWatchRoom = dynamic(
  () => import('@/components/live/LiveWatchRoom'),
  { ssr: false, loading: () => <WatchSkeleton /> },
)

function WatchSkeleton() {
  return (
    <div className="flex items-center justify-center h-full bg-black rounded-2xl">
      <div className="flex flex-col items-center gap-3">
        <span className="w-10 h-10 border-4 border-white/20 border-t-brand-red rounded-full animate-spin" />
        <p className="text-white font-semibold">Joining stream…</p>
      </div>
    </div>
  )
}

type PageState = 'loading' | 'ready' | 'no-access' | 'not-found' | 'ended' | 'error'

export default function WatchLivePage() {
  const { streamId } = useParams<{ streamId: string }>()
  const router = useRouter()

  const [pageState,  setPageState]  = useState<PageState>('loading')
  const [stream,     setStream]     = useState<LiveStream | null>(null)
  const [agoraToken, setAgoraToken] = useState<string>('')
  const [agoraUid,   setAgoraUid]   = useState<number | null>(null)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    if (!streamId) return
    ;(async () => {
      try {
        // 1. Load stream metadata
        const streamRes = await api.get(`/live/${streamId}`)
        const s: LiveStream & { hasAccess: boolean } = streamRes.data.data

        if (s.status === 'ENDED') { setPageState('ended'); setStream(s); return }
        if (!s.hasAccess) { setPageState('no-access'); setStream(s); return }

        // 2. Fetch viewer token (access-gated)
        const tokenRes = await api.get(`/live/${streamId}/token`)
        setAgoraToken(tokenRes.data.data.agoraToken)
        setAgoraUid(tokenRes.data.data.agoraUid)
        setStream(s)
        setPageState('ready')
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) setPageState('not-found')
        else if (status === 403) setPageState('no-access')
        else if (status === 410) setPageState('ended')
        else {
          setError('Failed to load stream. Please try again.')
          setPageState('error')
        }
      }
    })()
  }, [streamId])

  /* ── Error states ─────────────────────────────────────────────────────── */
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <WatchSkeleton />
      </div>
    )
  }

  if (pageState === 'not-found') {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-8 text-center">
        <div>
          <span className="text-5xl">📡</span>
          <p className="text-white font-bold text-xl mt-4 mb-2">Stream not found</p>
          <p className="text-brand-muted text-sm mb-6">This stream doesn&apos;t exist or has been removed.</p>
          <Link href="/live" className="px-6 py-3 bg-brand-red text-white font-bold rounded-xl hover:bg-red-600 transition">
            Browse Live Streams
          </Link>
        </div>
      </div>
    )
  }

  if (pageState === 'ended') {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-8 text-center">
        <div>
          <span className="text-5xl">🏁</span>
          <p className="text-white font-bold text-xl mt-4 mb-2">Stream Ended</p>
          <p className="text-brand-muted text-sm mb-6">
            {stream ? `${stream.creator.displayName ?? stream.creator.username}'s stream has ended.` : 'This stream has ended.'}
          </p>
          <div className="flex gap-3 justify-center">
            {stream && (
              <Link
                href={`/creator/${stream.creator.username}`}
                className="px-6 py-3 bg-brand-surface border border-brand-border text-white font-bold rounded-xl hover:border-brand-red transition"
              >
                View Profile
              </Link>
            )}
            <Link href="/live" className="px-6 py-3 bg-brand-red text-white font-bold rounded-xl hover:bg-red-600 transition">
              Browse Live Streams
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (pageState === 'no-access' && stream) {
    const visLabel =
      stream.visibility === 'SUBSCRIBERS' ? 'Subscribers only'
      : stream.visibility === 'FOLLOWERS'  ? 'Followers only'
      : 'Restricted'
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-8">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 bg-brand-card">
            {stream.creator.avatarKey && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(stream.creator.avatarKey) ?? undefined} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <p className="text-brand-muted text-xs font-bold uppercase tracking-wider mb-1">{visLabel}</p>
          <h2 className="text-white font-black text-xl mb-1">{stream.title}</h2>
          <p className="text-brand-muted text-sm mb-6">
            {stream.creator.displayName ?? stream.creator.username} is live, but this stream is restricted.
          </p>
          <div className="flex flex-col gap-3">
            {stream.visibility === 'SUBSCRIBERS' && (
              <Link
                href={`/subscribe/${stream.creator.username}`}
                className="w-full px-5 py-3 bg-brand-red text-white font-black rounded-xl hover:bg-red-600 transition"
              >
                Subscribe to Watch 💳
              </Link>
            )}
            {stream.visibility === 'FOLLOWERS' && (
              <Link
                href={`/creator/${stream.creator.username}`}
                className="w-full px-5 py-3 bg-brand-red text-white font-black rounded-xl hover:bg-red-600 transition"
              >
                Follow to Watch 👥
              </Link>
            )}
            <Link
              href="/live"
              className="w-full px-5 py-3 bg-brand-card border border-brand-border text-white font-bold rounded-xl hover:border-brand-red transition"
            >
              Browse Other Streams
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-8 text-center">
        <div>
          <span className="text-5xl">⚠️</span>
          <p className="text-white font-bold text-xl mt-4 mb-2">Something went wrong</p>
          <p className="text-brand-muted text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-brand-red text-white font-bold rounded-xl hover:bg-red-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  /* ── Watch room ───────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-screen bg-brand-dark p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <button
          onClick={() => router.push('/live')}
          className="text-brand-muted hover:text-white transition text-sm"
        >
          ← Live
        </button>
        <span className="text-brand-border">|</span>
        {stream?.creator.avatarKey && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(stream.creator.avatarKey) ?? undefined}
            alt=""
            className="w-7 h-7 rounded-full object-cover"
          />
        )}
        <p className="text-white font-bold text-sm truncate">
          {stream?.creator.displayName ?? stream?.creator.username}
        </p>
      </div>

      {/* Watch room */}
      <div className="flex-1 min-h-0">
        {stream && agoraToken && agoraUid && (
          <LiveWatchRoom
            stream={stream}
            agoraToken={agoraToken}
            agoraUid={agoraUid}
            onLeft={() => router.push('/live')}
          />
        )}
      </div>
    </div>
  )
}
