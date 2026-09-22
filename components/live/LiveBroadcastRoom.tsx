'use client'

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
} from 'agora-rtc-sdk-ng'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export interface LiveBroadcastHandle {
  end: () => void
}

interface Props {
  streamId:    string
  channelId:   string
  agoraToken:  string
  agoraUid:    number
  streamTitle: string
  onEnded:     () => void
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'ended' | 'error'

const LiveBroadcastRoom = forwardRef<LiveBroadcastHandle, Props>(function LiveBroadcastRoom({
  streamId,
  channelId,
  agoraToken,
  agoraUid,
  streamTitle,
  onEnded,
}, ref) {
  const clientRef    = useRef<IAgoraRTCClient | null>(null)
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null)
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null)
  const previewRef   = useRef<HTMLDivElement>(null)

  const [state,        setState]        = useState<ConnectionState>('idle')
  const [videoMuted,   setVideoMuted]   = useState(false)
  const [audioMuted,   setAudioMuted]   = useState(false)
  const [viewerCount,  setViewerCount]  = useState(0)
  const [duration,     setDuration]     = useState(0)
  const [error,        setError]        = useState<string | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? ''

  /* ── start broadcast ──────────────────────────────────────────────────── */
  const startBroadcast = useCallback(async () => {
    if (!appId) {
      setError('Agora App ID ist nicht konfiguriert. Füge NEXT_PUBLIC_AGORA_APP_ID zu deiner .env.local hinzu.')
      setState('error')
      return
    }
    setState('connecting')
    try {
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
      clientRef.current = client
      await client.setClientRole('host')
      await client.join(appId, channelId, agoraToken, agoraUid)

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
      audioTrackRef.current = audioTrack
      videoTrackRef.current = videoTrack

      await client.publish([audioTrack, videoTrack])

      if (previewRef.current) {
        videoTrack.play(previewRef.current)
      }

      setState('connected')
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (err) {
      console.error('Broadcast error:', err)
      setError('Kamera oder Mikrofon konnte nicht geöffnet werden. Bitte prüfe die Berechtigungen und versuche es erneut.')
      setState('error')
    }
  }, [appId, channelId, agoraToken, agoraUid])

  /* ── end broadcast ────────────────────────────────────────────────────── */
  const endBroadcast = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    videoTrackRef.current?.stop()
    videoTrackRef.current?.close()
    audioTrackRef.current?.stop()
    audioTrackRef.current?.close()
    try { await clientRef.current?.leave() } catch { /* ignore */ }
    clientRef.current = null

    try { await api.post(`/live/${streamId}/end`) } catch { /* ignore */ }

    setState('ended')
    onEnded()
  }, [streamId, onEnded])

  /* ── expose end() to parent via ref ──────────────────────────────────── */
  useImperativeHandle(ref, () => ({ end: endBroadcast }), [endBroadcast])

  /* ── toggle camera ────────────────────────────────────────────────────── */
  const toggleVideo = useCallback(async () => {
    const track = videoTrackRef.current as ILocalVideoTrack | null
    if (!track) return
    await track.setMuted(!videoMuted)
    setVideoMuted(v => !v)
  }, [videoMuted])

  /* ── toggle mic ───────────────────────────────────────────────────────── */
  const toggleAudio = useCallback(async () => {
    if (!audioTrackRef.current) return
    await audioTrackRef.current.setMuted(!audioMuted)
    setAudioMuted(a => !a)
  }, [audioMuted])

  /* ── heartbeat every 30s + end on browser close ──────────────────────── */
  useEffect(() => {
    if (state !== 'connected') return

    // Ping the heartbeat endpoint every 30s to keep the stream alive
    const heartbeatInterval = setInterval(() => {
      api.post(`/live/${streamId}/heartbeat`).catch(() => {})
    }, 30_000)

    // When the tab/browser is closed, fire the end endpoint via keepalive fetch
    const handleBeforeUnload = () => {
      const token = useAuthStore.getState().accessToken
      const base  = process.env.NEXT_PUBLIC_API_URL ?? ''
      // keepalive fetch supports auth headers and survives page unload in modern browsers
      fetch(`${base}/live/${streamId}/end`, {
        method:    'POST',
        headers:   { Authorization: `Bearer ${token ?? ''}`, 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {})
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(heartbeatInterval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [state, streamId])

  /* ── poll viewer count every 15s ──────────────────────────────────────── */
  useEffect(() => {
    if (state !== 'connected') return
    const poll = setInterval(async () => {
      try {
        const res = await api.get(`/live/${streamId}`)
        setViewerCount(res.data.data?.viewerCount ?? 0)
      } catch { /* ignore */ }
    }, 15_000)
    return () => clearInterval(poll)
  }, [state, streamId])

  /* ── auto-start on mount ──────────────────────────────────────────────── */
  useEffect(() => {
    startBroadcast()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      videoTrackRef.current?.stop(); videoTrackRef.current?.close()
      audioTrackRef.current?.stop(); audioTrackRef.current?.close()
      clientRef.current?.leave().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── format duration ──────────────────────────────────────────────────── */
  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col h-full bg-black rounded-2xl overflow-hidden">
      {/* Video preview */}
      <div className="relative flex-1 min-h-0 bg-zinc-900 overflow-hidden">
        <div ref={previewRef} className="w-full h-full" />

        {/* Overlays */}
        {state === 'connecting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <span className="w-10 h-10 border-4 border-white/20 border-t-brand-red rounded-full animate-spin" />
            <p className="text-white font-semibold">Broadcast wird gestartet...</p>
            <p className="text-brand-muted text-sm">Kamera- und Mikrofonzugriff wird angefragt</p>
          </div>
        )}

        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 p-8 text-center">
            <span className="text-4xl">📷</span>
            <p className="text-white font-bold text-lg">Kamerazugriff erforderlich</p>
            <p className="text-brand-muted text-sm leading-relaxed">{error}</p>
            <button
              onClick={startBroadcast}
              className="px-6 py-3 bg-brand-red text-white font-bold rounded-xl hover:bg-red-600 transition"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {state === 'connected' && videoMuted && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            <div className="text-center">
              <span className="text-5xl">📷</span>
              <p className="text-brand-muted text-sm mt-2">Kamera aus</p>
            </div>
          </div>
        )}

        {/* Live badge + stats */}
        {state === 'connected' && (
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
              <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-mono px-3 py-1.5 rounded-full">
                {formatDuration(duration)}
              </span>
            </div>
            <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              👁 {viewerCount}
            </span>
          </div>
        )}

        {/* Stream title */}
        {state === 'connected' && (
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <p className="text-white font-bold text-sm drop-shadow-lg truncate">{streamTitle}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      {state === 'connected' && (
        <div className="shrink-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mic toggle */}
            <button
              onClick={toggleAudio}
              title={audioMuted ? 'Mikrofon einschalten' : 'Mikrofon stummschalten'}
              className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition ${
                audioMuted
                  ? 'bg-red-600/20 border border-red-600 text-red-400'
                  : 'bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700'
              }`}
            >
              {audioMuted ? '🔇' : '🎙'}
            </button>

            {/* Camera toggle */}
            <button
              onClick={toggleVideo}
              title={videoMuted ? 'Kamera einschalten' : 'Kamera ausschalten'}
              className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition ${
                videoMuted
                  ? 'bg-red-600/20 border border-red-600 text-red-400'
                  : 'bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700'
              }`}
            >
              {videoMuted ? '📷' : '🎥'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-brand-muted text-xs">Live-Dauer</p>
            <p className="text-white font-mono font-bold text-sm">{formatDuration(duration)}</p>
          </div>

          {/* End stream */}
          <button
            onClick={endBroadcast}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition text-sm"
          >
            Stream beenden
          </button>
        </div>
      )}
    </div>
  )
})

export default LiveBroadcastRoom
