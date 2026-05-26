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

  const { mutate: createPost, isPending } = useMutation({
    mutationFn: async (data: { 
      caption: string
      mediaKey?: string
      mediaType?: string
      visibility?: string
      isPremium?: boolean
      premiumPrice?: number
    }) => {
      return api.post('/posts', data)
    },
    onSuccess: () => {
      toast.success('Post created successfully!')
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      resetForm()
      onClose()
    },
    onError: () => {
      toast.error('Failed to create post')
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB')
      return
    }

    // Determine media type
    if (file.type.startsWith('image/')) {
      setMediaType('IMAGE')
    } else if (file.type.startsWith('video/')) {
      setMediaType('VIDEO')
    } else {
      toast.error('Please select an image or video file')
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
      toast.error('Please add a caption or media')
      return
    }

    // Validate premium price
    if (isPremium) {
      const price = parseFloat(premiumPrice)
      if (isNaN(price) || price <= 0) {
        toast.error('Please enter a valid premium price')
        return
      }
      if (price < 1) {
        toast.error('Premium price must be at least $1')
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
      toast.error('Failed to upload media')
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
          <h2 className="text-xl font-bold text-white">Create Post</h2>
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
                <img src={userAvatar} alt={username || 'User'} className="w-full h-full object-cover" />
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
            placeholder="What's on your mind?"
            className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none min-h-[120px] text-lg"
            maxLength={2000}
          />

          {/* Visibility Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Who can see this post?</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('PUBLIC')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  visibility === 'PUBLIC' 
                    ? 'border-[#ff4757] bg-[#ff4757]/10 text-[#ff4757]' 
                    : 'border-gray-700 bg-[#2a2a2a] text-gray-400 hover:border-gray-600'
                }`}
              >
                <Globe size={20} />
                <span className="text-xs font-medium">Public</span>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('FOLLOWERS')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  visibility === 'FOLLOWERS' 
                    ? 'border-[#ff4757] bg-[#ff4757]/10 text-[#ff4757]' 
                    : 'border-gray-700 bg-[#2a2a2a] text-gray-400 hover:border-gray-600'
                }`}
              >
                <Users size={20} />
                <span className="text-xs font-medium">Followers</span>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('SUBSCRIBERS')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  visibility === 'SUBSCRIBERS' 
                    ? 'border-[#ff4757] bg-[#ff4757]/10 text-[#ff4757]' 
                    : 'border-gray-700 bg-[#2a2a2a] text-gray-400 hover:border-gray-600'
                }`}
              >
                <Lock size={20} />
                <span className="text-xs font-medium">Subscribers</span>
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
                className="w-5 h-5 rounded border-gray-600 bg-[#2a2a2a] text-[#ff4757] focus:ring-[#ff4757] focus:ring-offset-0"
              />
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-yellow-500" />
                <span className="text-white font-medium">Make this a premium post</span>
              </div>
            </label>
            
            {isPremium && (
              <div className="ml-8 space-y-2">
                <p className="text-sm text-gray-400">Only paid subscribers can view this content</p>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300">$</span>
                  <input
                    type="number"
                    value={premiumPrice}
                    onChange={(e) => setPremiumPrice(e.target.value)}
                    placeholder="5.00"
                    step="0.01"
                    min="1"
                    className="w-32 bg-[#2a2a2a] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff4757]"
                  />
                  <span className="text-sm text-gray-400">one-time unlock fee</span>
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
              className="px-6 py-2 bg-[#ff4757] text-white rounded-lg hover:bg-[#ff2f43] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2"
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
