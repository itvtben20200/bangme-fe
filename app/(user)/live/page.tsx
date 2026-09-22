'use client'

import { useQuery }    from '@tanstack/react-query'
import Link            from 'next/link'
import { Radio }       from 'lucide-react'
import api             from '@/lib/api'
import { mediaUrl }    from '@/lib/utils'
import type { LiveStream } from '@/types'

const VISIBILITY_BADGE: Record<string, { label: string; cls: string }> = {
  PUBLIC:      { label: 'Öffentlich',  cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  FOLLOWERS:   { label: 'Follower',    cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  SUBSCRIBERS: { label: 'Abonnenten',  cls: 'bg-brand-red/20 text-brand-red border-brand-red/30' },
}

function StreamCard({ stream }: { stream: LiveStream }) {
  const badge = VISIBILITY_BADGE[stream.visibility] ?? VISIBILITY_BADGE.PUBLIC
  const avatar = mediaUrl(stream.creator.avatarKey)

  return (
    <Link
      href={`/live/${stream.id}`}
      className="group bg-brand-surface border border-brand-border rounded-2xl overflow-hidden hover:border-brand-red/60 transition-all"
    >
      {/* Thumbnail / placeholder */}
      <div className="relative aspect-video bg-zinc-900 flex items-center justify-center">
        {stream.thumbnailKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(stream.thumbnailKey) ?? ''}
            alt={stream.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Radio size={32} className="text-brand-muted" />
            <p className="text-brand-muted text-xs">Livestream</p>
          </div>
        )}

        {/* LIVE badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>

        {/* Viewer count */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          👁 {stream.viewerCount}
        </div>

        {/* Visibility badge */}
        <div className={`absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full border text-xs font-bold ${badge.cls}`}>
          {badge.label}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex items-center gap-3">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-brand-card flex items-center justify-center shrink-0">
            <span className="text-brand-muted text-sm">🎭</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">{stream.title}</p>
          <p className="text-brand-muted text-xs truncate">
            {stream.creator.displayName ?? stream.creator.username}
            {stream.creator.isVerified && <span className="ml-1 text-brand-red">✓</span>}
          </p>
        </div>
      </div>
    </Link>
  )
}

export default function LivePage() {
  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: LiveStream[] }>({
    queryKey: ['live-streams'],
    queryFn:  () => api.get('/live').then(r => r.data),
    refetchInterval: 30_000, // refresh every 30s
  })

  const streams = data?.data ?? []

  return (
    <div className="min-h-screen bg-brand-dark px-4 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <h1 className="text-white font-black text-2xl">Jetzt live</h1>
          {!isLoading && (
            <span className="bg-brand-red/20 text-brand-red border border-brand-red/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {streams.length} live
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="text-brand-muted hover:text-white text-sm transition flex items-center gap-1.5"
        >
          Aktualisieren
        </button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-brand-card" />
              <div className="p-4 flex gap-3 items-center">
                <div className="w-9 h-9 rounded-full bg-brand-card" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-brand-card rounded w-3/4" />
                  <div className="h-2 bg-brand-card rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stream grid */}
      {!isLoading && streams.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {streams.map(stream => (
            <StreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && streams.length === 0 && (
        <div className="text-center py-24">
          <span className="text-6xl">📡</span>
          <p className="text-white font-bold text-xl mt-4 mb-2">Gerade keine Livestreams</p>
          <p className="text-brand-muted text-sm mb-8">
            Schau später wieder vorbei oder folge mehr Creatorn, um benachrichtigt zu werden, wenn sie live gehen.
          </p>
          <Link
            href="/explore"
            className="px-6 py-3 bg-brand-red text-white font-bold rounded-xl hover:bg-red-600 transition"
          >
            Creator entdecken
          </Link>
        </div>
      )}
    </div>
  )
}
