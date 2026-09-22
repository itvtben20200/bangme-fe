'use client'
import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Image as ImageIcon, Video, Loader2, Globe, Users, Lock, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  userAvatar?: string | null
  username?: string
}

export default function CreatePostModal({ isOpen, onClose, userAvatar, username }: CreatePostModalProps) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [caption, setCaption] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | null>(null)
  const [uploading, setUploading] = useState(false)
  const [visibility, setVisibility] = useState<'PUBLIC' | 'FOLLOWERS' | 'SUBSCRIBERS'>('PUBLIC')
  const [isPremium, setIsPremium] = useState(false)
  const [premiumPrice, setPremiumPrice] = useState('')
  const premiumPriceValue = parseFloat(premiumPrice)
  const contentPrice = Number.isFinite(premiumPriceValue) && premiumPriceValue > 0 ? premiumPriceValue : 0
  const platformTax = contentPrice * 0.25
  const tax = contentPrice * 0.17
  const creatorRevenue = contentPrice - platformTax - tax
  const creatorRevenuePercent = contentPrice > 0 ? Math.round((creatorRevenue / contentPrice) * 100) : 0
  const formatUsd = (amount: number) => `$${amount.toFixed(2)}`

  const { mutate: createPost, isPending } = useMutation({
    mutationFn: async (data: { 
      caption?: string
      mediaKey?: string
      mediaType?: string
      visibility?: string
      isPremium?: boolean
      premiumPrice?: number
    }) => {
      return api.post('/posts', data)
    },
    onSuccess: () => {
      toast.success('Beitrag erfolgreich erstellt!')
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      resetForm()
      onClose()
    },
    onError: () => {
      toast.error('Beitrag konnte nicht erstellt werden')
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Die Datei muss kleiner als 50 MB sein')
      return
    }

    // Determine media type
    if (file.type.startsWith('image/')) {
      setMediaType('IMAGE')
    } else if (file.type.startsWith('video/')) {
      setMediaType('VIDEO')
    } else {
      toast.error('Bitte wähle eine Bild- oder Videodatei aus')
      return
    }

    setMediaFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setMediaPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadMedia = async (file: File): Promise<{ key: string; type: string }> => {
    const formData = new FormData()
    formData.append('media', file)
    
    // Upload to post media endpoint
    const response = await api.post('/posts/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    
    return {
      key: response.data.data.mediaKey,
      type: response.data.data.mediaType
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!caption.trim() && !mediaFile) {
      toast.error('Bitte füge eine Bildunterschrift oder Medien hinzu')
      return
    }

    // Validate premium price
    if (isPremium) {
      const price = parseFloat(premiumPrice)
      if (isNaN(price) || price <= 0) {
        toast.error('Bitte gib einen gültigen Premium-Preis ein')
        return
      }
      if (price < 1) {
        toast.error('Der Premium-Preis muss mindestens $1 betragen')
        return
      }
    }

    try {
      let mediaKey: string | undefined
      let uploadedMediaType: string | undefined

      if (mediaFile) {
        setUploading(true)
        const uploadResult = await uploadMedia(mediaFile)
        mediaKey = uploadResult.key
        uploadedMediaType = uploadResult.type
        setUploading(false)
      }

      createPost({
        caption: caption.trim() || undefined,
        mediaKey,
        mediaType: uploadedMediaType || undefined,
        visibility,
        isPremium,
        premiumPrice: isPremium ? parseFloat(premiumPrice) : undefined,
      })
    } catch (error) {
      setUploading(false)
      toast.error('Medien konnten nicht hochgeladen werden')
    }
  }

  const resetForm = () => {
    setCaption('')
    removeMedia()
    setVisibility('PUBLIC')
    setIsPremium(false)
    setPremiumPrice('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Beitrag erstellen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
              {userAvatar ? (
                <img src={userAvatar} alt={username || 'Nutzer'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                  {username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <span className="text-white font-semibold">{username}</span>
          </div>

          {/* Caption Input */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Was möchtest du teilen?"
            className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none min-h-[120px] text-lg"
            maxLength={2000}
          />

          {/* Visibility Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Wer kann diesen Beitrag sehen?</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('PUBLIC')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  visibility === 'PUBLIC' 
                    ? 'border-[#ff0618] bg-[#ff0618]/10 text-[#ff0618]' 
                    : 'border-gray-700 bg-[#2a2a2a] text-gray-400 hover:border-gray-600'
                }`}
              >
                <Globe size={20} />
                <span className="text-xs font-medium">Öffentlich</span>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('FOLLOWERS')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  visibility === 'FOLLOWERS' 
                    ? 'border-[#ff0618] bg-[#ff0618]/10 text-[#ff0618]' 
                    : 'border-gray-700 bg-[#2a2a2a] text-gray-400 hover:border-gray-600'
                }`}
              >
                <Users size={20} />
                <span className="text-xs font-medium">Follower</span>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('SUBSCRIBERS')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  visibility === 'SUBSCRIBERS' 
                    ? 'border-[#ff0618] bg-[#ff0618]/10 text-[#ff0618]' 
                    : 'border-gray-700 bg-[#2a2a2a] text-gray-400 hover:border-gray-600'
                }`}
              >
                <Lock size={20} />
                <span className="text-xs font-medium">Abonnenten</span>
              </button>
            </div>
          </div>

          {/* Premium Post Option */}
          <div className="space-y-3 border-t border-gray-800 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-[#2a2a2a] text-[#ff0618] focus:ring-[#ff0618] focus:ring-offset-0"
              />
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-yellow-500" />
                <span className="text-white font-medium">Als Premium-Beitrag markieren</span>
              </div>
            </label>
            
            {isPremium && (
              <div className="ml-8 space-y-3">
                <p className="text-sm text-gray-400">Nur zahlende Abonnenten können diesen Inhalt sehen</p>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300" htmlFor="premium-price">
                    Preis (BangCoins)
                  </label>
                  <input
                    id="premium-price"
                    type="number"
                    value={premiumPrice}
                    onChange={(e) => setPremiumPrice(e.target.value)}
                    placeholder="25"
                    step="1"
                    min="1"
                    inputMode="numeric"
                    className="w-full bg-[#161616] text-white rounded-lg border border-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff0618] focus:border-[#ff0618]"
                  />
                  <p className="text-sm italic text-gray-400">1 BangCoin = $1</p>
                </div>

                <div className="rounded-lg bg-gray-100 p-4 text-gray-700 space-y-3">
                  <h3 className="font-bold text-gray-800">Umsatzaufteilung</h3>
                  <div className="space-y-2 text-sm sm:text-base">
                    <div className="flex items-center justify-between gap-4">
                      <span>Inhaltspreis:</span>
                      <span className="font-bold text-gray-800">{formatUsd(contentPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Plattformgebühr (25%):</span>
                      <span className="font-bold text-red-500">-{formatUsd(platformTax)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Steuer (17%):</span>
                      <span className="font-bold text-red-500">-{formatUsd(tax)}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex items-center justify-between gap-4 text-base font-bold">
                      <span>Du erhältst:</span>
                      <span className="text-green-600">{formatUsd(creatorRevenue)}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-300 pt-3 text-center text-sm text-gray-600">
                    <span className="font-bold text-green-600">{creatorRevenuePercent}%</span> des Originalpreises
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Media Preview */}
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

          {/* Media Upload Button */}
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
                <span>Add Photo</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors"
              >
                <Video size={20} />
                <span>Add Video</span>
              </button>
            </div>
          )}

          {/* Character Count */}
          <div className="text-right text-sm text-gray-500">
            {caption.length} / 2000
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              disabled={uploading || isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={(!caption.trim() && !mediaFile) || uploading || isPending}
              className="px-6 py-2 bg-[#ff0618] text-white rounded-lg hover:bg-[#ff0618] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2"
            >
              {uploading || isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {uploading ? 'Uploading...' : 'Posting...'}
                </>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
