'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Pause, Play, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { mediaUrl } from '@/lib/utils'
import type { StoryGroup } from '@/types'

const STORY_DURATION_MS = 5000 // 5 s per story slide

interface Props {
  groups: StoryGroup[]
  initialGroupIndex: number
  currentUserId: string | undefined
  onClose: () => void
  onDeleted?: (storyId: string) => void
}

export default function StoryViewerModal({
  groups,
  initialGroupIndex,
  currentUserId,
  onClose,
  onDeleted,
}: Props) {
  const [groupIdx,  setGroupIdx]  = useState(initialGroupIndex)
  const [storyIdx,  setStoryIdx]  = useState(0)
  const [progress,  setProgress]  = useState(0)        // 0-100
  const [paused,    setPaused]    = useState(false)
  const [avatarErr, setAvatarErr] = useState(false)
  const [mediaErr,  setMediaErr]  = useState(false)

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const viewedRef    = useRef<Set<string>>(new Set())

  const group = groups[groupIdx]
  const story = group?.stories[storyIdx]

  // Mark story as viewed on the backend (once per story)
  const markViewed = useCallback((id: string) => {
    if (viewedRef.current.has(id)) return
    viewedRef.current.add(id)
    api.post(`/stories/${id}/view`).catch(() => {/* ignore */})
  }, [])

  // Advance to next story or next group
  const advance = useCallback(() => {
    setMediaErr(false)
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx(i => i + 1)
      setProgress(0)
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(g => g + 1)
      setStoryIdx(0)
      setProgress(0)
    } else {
      onClose()
    }
  }, [storyIdx, group?.stories.length, groupIdx, groups.length, onClose])

  // Go back
  const retreat = useCallback(() => {
    setMediaErr(false)
    if (storyIdx > 0) {
      setStoryIdx(i => i - 1)
      setProgress(0)
    } else if (groupIdx > 0) {
      setGroupIdx(g => g - 1)
      setStoryIdx(0)
      setProgress(0)
    }
  }, [storyIdx, groupIdx])

  // Progress ticker
  useEffect(() => {
    if (!story) return
    markViewed(story.id)

    if (paused) return

    const tick = 100 / (STORY_DURATION_MS / 100)
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p + tick >= 100) {
          clearInterval(intervalRef.current!)
          advance()
          return 0
        }
        return p + tick
      })
    }, 100)

    return () => clearInterval(intervalRef.current!)
  }, [story, paused, advance, markViewed])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') advance()
      if (e.key === 'ArrowLeft')  retreat()
      if (e.key === 'Escape')     onClose()
      if (e.key === ' ')          setPaused(p => !p)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, retreat, onClose])

  const handleDelete = async () => {
    if (!story) return
    try {
      await api.delete(`/stories/${story.id}`)
      onDeleted?.(story.id)
      advance()
    } catch { /* ignore */ }
  }

  if (!group || !story) return null

  const avatar    = mediaUrl(group.user.avatarKey)
  const mediaSrc  = mediaUrl(story.mediaKey)
  const isVideo   = story.mediaType === 'VIDEO'
  const isOwn     = group.user.id === currentUserId
  const expiresIn = Math.max(0, Math.floor((new Date(story.expiresAt).getTime() - Date.now()) / (60 * 60 * 1000)))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm h-[calc(100dvh-2rem)] sm:h-[600px] bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Progress bars ─────────────────────────────────────────── */}
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-1">
          {group.stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="absolute top-7 left-3 right-3 z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border-2 border-brand-red overflow-hidden shrink-0">
            {avatar && !avatarErr
              ? <Image src={avatar} alt="" width={32} height={32} className="object-cover w-full h-full" onError={() => setAvatarErr(true)} />
              : <div className="w-full h-full bg-brand-card flex items-center justify-center text-xs font-bold text-white">
                  {(group.user.displayName ?? group.user.username)[0].toUpperCase()}
                </div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{group.user.displayName ?? group.user.username}</p>
            <p className="text-white/60 text-[10px]">Expires in {expiresIn}h</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaused(p => !p)}
              className="text-white/70 hover:text-white transition"
              aria-label={paused ? 'Play' : 'Pause'}
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            {isOwn && (
              <button
                onClick={handleDelete}
                className="text-white/70 hover:text-brand-red transition"
                aria-label="Delete story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="text-white/70 hover:text-white transition" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Media ─────────────────────────────────────────────────── */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {mediaSrc && !mediaErr ? (
            isVideo
              ? <video
                  key={story.id}
                  src={mediaSrc}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                  muted={false}
                  onEnded={advance}
                  onError={() => setMediaErr(true)}
                />
              : <Image
                  key={story.id}
                  src={mediaSrc}
                  alt={story.caption ?? 'Story'}
                  fill
                  className="object-contain"
                  onError={() => setMediaErr(true)}
                />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brand-muted text-sm">
              Media unavailable
            </div>
          )}

          {/* Tap zones */}
          <button
            className="absolute left-0 top-0 w-1/3 h-full"
            aria-label="Previous"
            onClick={retreat}
          />
          <button
            className="absolute right-0 top-0 w-1/3 h-full"
            aria-label="Next"
            onClick={advance}
          />
        </div>

        {/* ── Caption ───────────────────────────────────────────────── */}
        {story.caption && (
          <div className="absolute bottom-12 left-4 right-4 z-10">
            <p className="text-white text-sm drop-shadow-lg bg-black/30 rounded-lg px-3 py-2 backdrop-blur-sm">
              {story.caption}
            </p>
          </div>
        )}

        {/* ── Group nav ─────────────────────────────────────────────── */}
        <div className="absolute left-3 right-3 bottom-3 z-10 flex items-center justify-between">
          <button
            onClick={retreat}
            disabled={groupIdx === 0 && storyIdx === 0}
            className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition disabled:opacity-30"
            aria-label="Previous group"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white/50 text-xs">
            {groupIdx + 1} / {groups.length}
          </span>
          <button
            onClick={advance}
            disabled={groupIdx === groups.length - 1 && storyIdx === group.stories.length - 1}
            className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition disabled:opacity-30"
            aria-label="Next group"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
