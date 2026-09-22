'use client'

import { useRef, useState } from 'react'
import { X, Upload, ImageIcon, Video } from 'lucide-react'
import api from '@/lib/api'
import type { StoryGroup } from '@/types'

interface Props {
  onClose:   () => void
  onCreated: (group: StoryGroup) => void
}

export default function AddStoryModal({ onClose, onCreated }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file,     setFile]     = useState<File | null>(null)
  const [preview,  setPreview]  = useState<string | null>(null)
  const [caption,  setCaption]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleFile = (f: File) => {
    if (f.size > 50 * 1024 * 1024) {
      setError('Die Datei muss kleiner als 50 MB sein')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('media', file)
      if (caption.trim()) form.append('caption', caption.trim())

      const res = await api.post<{ success: boolean; data: StoryGroup['stories'][number] & { user: StoryGroup['user'] } }>(
        '/stories',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      const story = res.data.data
      // Wrap into a StoryGroup so the parent can prepend it
      const group: StoryGroup = {
        user:   story.user,
        stories: [story],
      }
      onCreated(group)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Upload fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  const isVideo = file?.type.startsWith('video/')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <h2 className="text-white font-bold text-lg">Story hinzufügen</h2>
          <button onClick={onClose} className="text-brand-muted hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            className="relative border-2 border-dashed border-brand-border rounded-xl overflow-hidden cursor-pointer hover:border-brand-red transition"
            style={{ minHeight: 220 }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            {preview ? (
              isVideo
                ? <video src={preview} className="w-full h-full max-h-64 object-contain rounded-xl" muted playsInline />
                : <img src={preview} alt="Vorschau" className="w-full max-h-64 object-contain rounded-xl" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 gap-3 text-brand-muted">
                <div className="flex gap-3">
                  <ImageIcon className="w-8 h-8" />
                  <Video className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium">Datei hierher ziehen oder klicken</p>
                <p className="text-xs">Bild oder Video · max. 50 MB</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-brand-muted text-xs font-semibold mb-1.5 uppercase tracking-wider">
              Bildunterschrift (optional)
            </label>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Erzähle etwas zu deiner Story..."
              maxLength={200}
              className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-red transition"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <p className="text-brand-muted text-xs text-center">
            Stories laufen automatisch nach 24 Stunden ab
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-brand-border text-brand-muted hover:text-white transition text-sm font-semibold"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!file || loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-red text-white text-sm font-bold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {loading ? 'Wird hochgeladen...' : 'Story posten'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
