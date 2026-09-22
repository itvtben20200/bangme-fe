'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng'
import Link from 'next/link'
import api  from '@/lib/api'
import type { LiveStream } from '@/types'

interface Props {
  stream:    LiveStream
  agoraToken: string
  agoraUid:   number
  onLeft:    () => void
}

type ConnectionState = 'connecting' | 'connected' | 'ended' | 'error'

export default function LiveWatchRoom({ stream, agoraToken, agoraUid, onLeft }: Props) {
  const clientRef  = useRef<IAgoraRTCClient | null>(null)
  const videoRef   = useRef<HTMLDivElement>(null)

  const [state,       setState]      = useState<ConnectionState>('connecting')
  const [audioMuted,  setAudioMuted] = useState(false)
  const [viewerCount, setViewerCount] = useState(stream.viewerCount)
  const [error,       setError]      = useState<string | null>(null)

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? ''

  /* ── join channel ─────────────────────────────────────────────────────── */
  const joinChannel = useCallback(async () => {
    if (!appId) {
      setError('Agora App ID ist nicht konfiguriert.')
      setState('error')
      return
    }
    setState('connecting')
    try {
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
      clientRef.current = client
      await client.setClientRole('audience')
      await client.join(appId, stream.agoraChannelId, agoraToken, agoraUid)

      // Track viewer join in backend
      try { await api.post(`/live/${stream.id}/join`) } catch { /* best-effort */ }

      // Subscribe to remote video/audio as the host publishes tracks
      client.on('user-published', async (remoteUser: IAgoraRTCRemoteUser, mediaType) => {
        await client.subscribe(remoteUser, mediaType)
        if (mediaType === 'video' && videoRef.current) {
          remoteUser.videoTrack?.play(videoRef.current)
        }
        if (mediaType === 'audio') {
          remoteUser.audioTrack?.play()
        }
      })

      client.on('user-unpublished', (remoteUser: IAgoraRTCRemoteUser, mediaType) => {
        if (mediaType === 'video') remoteUser.videoTrack?.stop()
        if (mediaType === 'audio') remoteUser.audioTrack?.stop()
      })

      client.on('user-left', () => {
        // Host left — stream ended
        setState('ended')
      })

      setState('connected')
    } catch (err) {
      console.error('Watch error:', err)
      setError('Dem Livestream konnte nicht beigetreten werden. Bitte versuche es erneut.')
      setState('error')
    }
  }, [appId, stream.agoraChannelId, stream.id, agoraToken, agoraUid])

  /* ── leave channel ────────────────────────────────────────────────────── */
  const leaveChannel = useCallback(async () => {
    try { await clientRef.current?.leave() } catch { /* ignore */ }
    try { await api.post(`/live/${stream.id}/leave`) } catch { /* best-effort */ }
    clientRef.current = null
    onLeft()
  }, [stream.id, onLeft])

  /* ── toggle mute ──────────────────────────────────────────────────────── */
  const toggleAudio = useCallback(() => {
    if (!clientRef.current) return
    const remoteUsers = clientRef.current.remoteUsers
    remoteUsers.forEach(user => {
      if (user.audioTrack) {
        audioMuted ? user.audioTrack.play() : user.audioTrack.stop()
      }
    })
    setAudioMuted(m => !m)
  }, [audioMuted])

  /* ── poll viewer count every 20s ──────────────────────────────────────── */
  useEffect(() => {
    if (state !== 'connected') return
    const poll = setInterval(async () => {
      try {
        const res = await api.get(`/live/${stream.id}`)
        setViewerCount(res.data.data?.viewerCount ?? 0)
      } catch { /* ignore */ }
    }, 20_000)
    return () => clearInterval(poll)
  }, [state, stream.id])

  /* ── auto-join on mount, leave on unmount ─────────────────────────────── */
  useEffect(() => {
    joinChannel()
    return () => {
      clientRef.current?.leave().catch(() => {})
      api.post(`/live/${stream.id}/leave`).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col h-full bg-black rounded-2xl overflow-hidden">
      {/* Video area */}
      <div className="relative flex-1 bg-zinc-900">
        <div ref={videoRef} className="w-full h-full" />

        {/* Connecting overlay */}
        {state === 'connecting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <span className="w-10 h-10 border-4 border-white/20 border-t-brand-red rounded-full animate-spin" />
            <p className="text-white font-semibold">Stream wird betreten...</p>
          </div>
        )}

        {/* Error overlay */}
        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 p-8 text-center">
            <span className="text-4xl">📡</span>
            <p className="text-white font-bold text-lg">Verbindung fehlgeschlagen</p>
            <p className="text-brand-muted text-sm">{error}</p>
            <button
              onClick={joinChannel}
              className="px-6 py-3 bg-brand-red text-white font-bold rounded-xl hover:bg-red-600 transition"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {/* Stream ended overlay */}
        {state === 'ended' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 p-8 text-center">
            <span className="text-4xl">🏁</span>
            <p className="text-white font-bold text-xl">Stream beendet</p>
            <p className="text-brand-muted text-sm">
              {stream.creator.displayName ?? stream.creator.username} hat den Livestream beendet.
            </p>
            <Link
              href="/explore"
              className="px-6 py-3 bg-brand-red text-white font-bold rounded-xl hover:bg-red-600 transition"
            >
              Creator entdecken
            </Link>
          </div>
        )}

        {/* Live badge + viewer count */}
        {state === 'connected' && (
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
            </div>
            <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              👁 {viewerCount}
            </span>
          </div>
        )}

        {/* Stream title + creator */}
        {state === 'connected' && (
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <p className="text-white font-bold text-sm drop-shadow-lg">{stream.title}</p>
            <p className="text-white/70 text-xs mt-0.5">
              {stream.creator.displayName ?? stream.creator.username}
            </p>
          </div>
        )}
      </div>

      {/* Controls bar */}
      {state === 'connected' && (
        <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex items-center justify-between">
          <button
            onClick={toggleAudio}
            title={audioMuted ? 'Ton einschalten' : 'Stummschalten'}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition ${
              audioMuted
                ? 'bg-red-600/20 border border-red-600 text-red-400'
                : 'bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700'
            }`}
          >
            {audioMuted ? '🔇' : '🔊'}
          </button>

          <div className="text-center">
            <p className="text-white font-semibold text-sm">{stream.title}</p>
            <p className="text-brand-muted text-xs">
              {stream.creator.displayName ?? stream.creator.username}
            </p>
          </div>

          <button
            onClick={leaveChannel}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold rounded-xl transition text-sm"
          >
            Verlassen
          </button>
        </div>
      )}
    </div>
  )
}
