'use client'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import PostCard from '@/components/PostCard'
import { useAuthStore } from '@/store/authStore'

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const postId = params.id as string

  const { data, isLoading, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => api.get(`/posts/${postId}`).then(r => r.data),
  })

  const post = data?.data

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 size={32} className="text-[#ff4757] animate-spin" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-400 text-lg">Post not found</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-[#ff4757] text-white rounded-lg hover:bg-[#ff2f43] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Post */}
        <PostCard
          post={post}
          currentUserId={user?.username}
          onDelete={() => router.push('/profile')}
        />
      </div>
    </div>
  )
}
