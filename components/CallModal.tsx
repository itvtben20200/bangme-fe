'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng'
import { useCallStore } from '@/store/callStore'
import { getSocket }    from '@/lib/socket'
import api              from '@/lib/api'
import { toast }        from 'sonner'

export default function CallModal() {
  const { status, incoming, active, setActive, endCall, clearCall } = useCallStore()
  const clientRef    = useRef<IAgoraRTCClient | null>(null)
  const localAudio   = useRef<IMicrophoneAudioTrack | null>(null)
  const localVideo   = useRef<ICameraVideoTrack | null>(null)
  const localVideoEl = useRef<HTMLDivElement>(null)
  const [elapsed, setElapsed]   = useState(0)
  const [muted,   setMuted]     = useState(false)
  const [camOff,  setCamOff]    = useState(false)

  // Timer
  useEffect(() => {
    if (status !== 'active') { setElapsed(0); return }
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [status])

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // ── Join Agora channel once the call becomes active ───────────────────────
  const joinChannel = useCallback(async (channel: string, callType: 'audio' | 'video', token: string | null, appId: string, agoraUid: number) => {
    const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    clientRef.current = client

    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType)
      if (mediaType === 'audio') user.audioTrack?.play()
      if (mediaType === 'video' && localVideoEl.current) {
        const remoteEl = document.getElementById('remote-video')
        if (remoteEl) user.videoTrack?.play(remoteEl as HTMLDivElement)
      }
    })

    await client.join(appId, channel, token, agoraUid)

    const tracks: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = []
    const [mic] = await AgoraRTC.createMicrophoneAudioTrack().then(t => { localAudio.current = t; return [t] })
    tracks.push(mic)

    if (callType === 'video') {
      const cam = await AgoraRTC.createCameraVideoTrack().catch(() => null)
      if (cam) {
        localVideo.current = cam
        tracks.push(cam)
        setTimeout(() => {
          if (localVideoEl.current) cam.play(localVideoEl.current)
        }, 100)
      }
    }

    await client.publish(tracks)
    setActive()
  }, [setActive])

  // ── Leave and cleanup ─────────────────────────────────────────────────────
  const leaveChannel = useCallback(async () => {
    localAudio.current?.stop(); localAudio.current?.close(); localAudio.current = null
    localVideo.current?.stop(); localVideo.current?.close(); localVideo.current = null
    if (clientRef.current) {
      await clientRef.current.leave().catch(() => {})
      clientRef.current = null
    }
  }, [])

  // ── Handle call accepted (outgoing) ───────────────────────────────────────
  useEffect(() => {
    const socket = getSocket()
    const onAccepted = async () => {
      if (!active) return
      try {
        const { data } = await api.post('/calls/token', { conversationId: active.conversationId })
        await joinChannel(data.data.channel, active.callType, data.data.token, data.data.appId, data.data.agoraUid)
      } catch {
        toast.error('Could not start call')
        clearCall()
      }
    }
    socket.on('call:accepted', onAccepted)
    return () => { socket.off('call:accepted', onAccepted) }
  }, [active, joinChannel, clearCall])

  // ── End call handler ──────────────────────────────────────────────────────
  const handleEnd = useCallback(async () => {
    const socket = getSocket()
    if (active) {
      socket.emit('call:end', { targetUserId: active.remoteUserId, conversationId: active.conversationId })
      const duration = elapsed
      await leaveChannel()
      // Bill if call was actually active
      if (status === 'active' && duration > 0) {
        api.post('/calls/end', {
          conversationId:  active.conversationId,
          callType:        active.callType,
          durationSeconds: duration,
        }).then((r) => {
          const durationLabel = fmt(duration)
          if (r.data.data?.charged > 0) {
            toast.info(`Call ended · ${durationLabel} · ${r.data.data.charged} BangCoins charged`)
          } else {
            toast.info(`Call ended · ${durationLabel}`)
          }
        }).catch(() => {})
      }
    }
    endCall()
  }, [active, elapsed, status, leaveChannel, endCall])

  // ── Reject incoming ───────────────────────────────────────────────────────
  const handleReject = useCallback(() => {
    if (!incoming) return
    const socket = getSocket()
    socket.emit('call:reject', { callerId: incoming.callerId })
    clearCall()
  }, [incoming, clearCall])

  // ── Accept incoming ───────────────────────────────────────────────────────
  const handleAccept = useCallback(async () => {
    if (!incoming) return
    const socket = getSocket()
    try {
      const { data } = await api.post('/calls/token', { conversationId: incoming.conversationId })
      socket.emit('call:accept', { callerId: incoming.callerId, conversationId: incoming.conversationId })
      // Set active call before joining so remoteUserId is tracked
      useCallStore.setState({
        status: 'active',
        incoming: null,
        active: {
          conversationId: incoming.conversationId,
          callType:       incoming.callType,
          channel:        data.data.channel,
          startedAt:      Date.now(),
          remoteUserId:   incoming.callerId,
        },
      })
      await joinChannel(data.data.channel, incoming.callType, data.data.token, data.data.appId, data.data.agoraUid)
    } catch {
      toast.error('Could not join call')
      clearCall()
    }
  }, [incoming, joinChannel, clearCall])

  // ── Listen for remote call end ────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket()
    const onEnded = async () => {
      const duration = elapsed
      const snap = useCallStore.getState()
      await leaveChannel()
      // Bill for elapsed time when the other party ends the call
      if (snap.status === 'active' && snap.active && duration > 0) {
        api.post('/calls/end', {
          conversationId:  snap.active.conversationId,
          callType:        snap.active.callType,
          durationSeconds: duration,
        }).then((r) => {
          const durationLabel = fmt(duration)
          if (r.data.data?.charged > 0) {
            toast.info(`Call ended · ${durationLabel} · ${r.data.data.charged} BangCoins charged`)
          } else {
            toast.info(`Call ended · ${durationLabel}`)
          }
        }).catch(() => {})
      } else {
        toast.info('Call ended by other party')
      }
      endCall()
    }
    socket.on('call:ended', onEnded)
    return () => { socket.off('call:ended', onEnded) }
  }, [elapsed, leaveChannel, endCall])

  // ── Mic / camera toggles ──────────────────────────────────────────────────
  const toggleMute = () => {
    localAudio.current?.setMuted(!muted)
    setMuted((m) => !m)
  }
  const toggleCam = () => {
    localVideo.current?.setMuted(!camOff)
    setCamOff((c) => !c)
  }

  if (status === 'idle') return null

  return (
    <div data-testid="call-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-80 shadow-2xl overflow-hidden">

        {/* ── Incoming ringing ── */}
        {status === 'ringing' && incoming && (
          <div className="flex flex-col items-center gap-6 p-8">
            <div className="w-16 h-16 rounded-full bg-[#ff0618]/20 flex items-center justify-center text-2xl font-bold text-[#ff0618]">
              {incoming.callerUsername[0]?.toUpperCase()}
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">@{incoming.callerUsername}</p>
              <p data-testid="call-modal-status" className="text-gray-400 text-sm capitalize">{incoming.callType} call incoming…</p>
            </div>
            <div className="flex gap-6">
              <button data-testid="call-modal-reject" onClick={handleReject}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white text-xl transition">
                ✕
              </button>
              <button data-testid="call-modal-accept" onClick={handleAccept}
                className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center text-white text-xl transition">
                ✓
              </button>
            </div>
          </div>
        )}

        {/* ── Outgoing calling ── */}
        {status === 'calling' && active && (
          <div className="flex flex-col items-center gap-6 p-8">
            <div className="w-16 h-16 rounded-full bg-brand-red/20 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p data-testid="call-modal-status" className="text-white font-semibold capitalize">{active.callType} calling…</p>
            </div>
            <button data-testid="call-modal-cancel" onClick={handleEnd}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white text-2xl transition">
              ✕
            </button>
          </div>
        )}

        {/* ── Active call ── */}
        {status === 'active' && active && (
          <div className="flex flex-col">
            {/* Video tiles */}
            {active.callType === 'video' && (
              <div className="relative bg-black h-48">
                <div id="remote-video" className="w-full h-full" />
                <div ref={localVideoEl} className="absolute bottom-2 right-2 w-20 h-14 bg-[#222] rounded border border-[#444]" />
              </div>
            )}
            <div className={`flex flex-col items-center gap-4 p-6 ${active.callType === 'audio' ? 'pt-8' : ''}`}>
              {active.callType === 'audio' && (
                <div className="w-14 h-14 rounded-full bg-green-600/20 flex items-center justify-center">
                  <span className="text-2xl">🎧</span>
                </div>
              )}
              <p data-testid="call-modal-timer" className="text-white font-mono text-xl">{fmt(elapsed)}</p>
              <div className="flex gap-4">
                <button data-testid="call-modal-mute" onClick={toggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition ${muted ? 'bg-red-600 text-white' : 'bg-[#333] text-white hover:bg-[#444]'}`}>
                  {muted ? '🔇' : '🎤'}
                </button>
                {active.callType === 'video' && (
                  <button data-testid="call-modal-cam" onClick={toggleCam}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition ${camOff ? 'bg-red-600 text-white' : 'bg-[#333] text-white hover:bg-[#444]'}`}>
                    {camOff ? '📵' : '📹'}
                  </button>
                )}
                <button data-testid="call-modal-end" onClick={handleEnd}
                  className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white text-xl transition">
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
