'use client'
import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Image as ImageIcon, Video, Loader2, Globe, Users, Lock } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { mediaUrl } from '@/lib/utils'

interface EditPostModalProps {
  isOpen: boolean
  onClose: () => void
  post: {
    id: string
    caption?: string | null
    mediaKey?: string | null
    mediaType?: string | null
    visibility?: 'PUBLIC' | 'FOLLOWERS' | 'SUBSCRIBERS'
  }
}

export default function EditPostModal({ isOpen, onClose, post }: EditPostModalProps) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [caption, setCaption] = useState(post.caption ?? '')
  const [visibility, setVisibility] = useState<'PUBLIC' | 'FOLLOWERS' | 'SUBSCRIBERS'>(
    post.visibility ?? 'PUBLIC'
  )
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(
    post.mediaKey ? mediaUrl(post.mediaKey) ?? null : null
  )
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | null>(
    (post.mediaType as 'IMAGE' | 'VIDEO' | null) ?? null
  )
  const [mediaCleared, setMediaCleared] = useState(false)
  const { mutate: updatePost, isPending } = useMutation({
    mutationFn: async (formData: FormData) => {
      // Do NOT set Content-Type manually — axios must auto-include the multipart boundary
      return api.patch(`/posts/${post.id}`, formData)
    },
    onSuccess: () => {
      toast.success('Beitrag aktualisiert!')
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      qc.invalidateQueries({ queryKey: ['creator-posts'] })
      onClose()
    },
    onError: () => {
      toast.error('Beitrag konnte nicht aktualisiert werden')
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Die Datei muss kleiner als 50 MB sein')
      return
    }

    if (file.type.startsWith('image/')) {
      setMediaType('IMAGE')
    } else if (file.type.startsWith('video/')) {
      setMediaType('VIDEO')
    } else {
      toast.error('Bitte wähle eine Bild- oder Videodatei aus')
      return
    }

    setMediaFile(file)
    setMediaCleared(false)

    const reader = new FileReader()
    reader.onloadend = () => setMediaPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    setMediaCleared(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!caption.trim() && !mediaPreview && !mediaFile) {
      toast.error('Bitte füge eine Bildunterschrift oder Medien hinzu')
      return
    }

    const formData = new FormData()
    formData.append('caption', caption.trim())
    formData.append('visibility', visibility)

    if (mediaFile) {
      formData.append('media', mediaFile)
    } else if (mediaCleared) {
      formData.append('mediaKey', '')
    }

    updatePost(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Beitrag bearbeiten</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Caption */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Was möchtest du teilen?"
            className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none min-h-[120px] text-lg"
            maxLength={2000}
          />

          {/* Visibility */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Wer kann diesen Beitrag sehen?</label>
            <div className="grid grid-cols-3 gap-2">
              {(['PUBLIC', 'FOLLOWERS', 'SUBSCRIBERS'] as const).map((opt) => {
                const Icon = opt === 'PUBLIC' ? Globe : opt === 'FOLLOWERS' ? Users : Lock
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setVisibility(opt)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      visibility === opt
                        ? 'border-[#ff0618] bg-[#ff0618]/10 text-[#ff0618]'
                        : 'border-gray-700 bg-[#2a2a2a] text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-medium">{opt === 'PUBLIC' ? 'Öffentlich' : opt === 'FOLLOWERS' ? 'Follower' : 'Abonnenten'}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Media preview */}
          {mediaPreview && (
            <div className="relative rounded-lg overflow-hidden bg-black">
              {mediaType === 'IMAGE' ? (
                <img src={mediaPreview} alt="Preview" className="w-full max-h-96 object-contain" />
              ) : (
                <video src={mediaPreview} controls className="w-full max-h-96" />
              )}
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-black/90"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Replace / add media */}
          {!mediaFile && (
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors"
              >
                <ImageIcon size={20} />
                <span>{post.mediaKey ? 'Foto/Video ersetzen' : 'Foto hinzufügen'}</span>
              </button>
              {!post.mediaKey && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors"
                >
                  <Video size={20} />
                  <span>Video hinzufügen</span>
                </button>
              )}
            </div>
          )}

          {/* Character count */}
          <div className="text-right text-sm text-gray-500">{caption.length} / 2000</div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              disabled={isPending}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2 bg-[#ff0618] text-white rounded-lg hover:bg-[#ff0618] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                'Änderungen speichern'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
