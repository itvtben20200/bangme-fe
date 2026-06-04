'use client'
import { useState }           from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Video, UserPlus, MessageSquare, Star, X, Lock } from 'lucide-react'
import { toast }          from 'sonner'
import api                from '@/lib/api'
import { mediaUrl }       from '@/lib/utils'
import { useAuthStore }   from '@/store/authStore'
import PostCard           from '@/components/PostCard'
import type { User, Post } from '@/types'

export default function CreatorProfilePage() {
  const params    = useParams<{ username: string }>()
  const router    = useRouter()
  const username  = params.username
  const { user }  = useAuthStore()
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const { data: profileData } = useQuery<{ success: boolean; data: User & { _count: { followers: number; follows: number; posts: number } } }>({
    queryKey: ['creator', username],
    queryFn:  () => api.get(`/users/${username}`).then((r) => r.data),
  })

  const profile = profileData?.data

  const { data: postsData } = useQuery<{ success: boolean; data: Post[]; isSubscribed?: boolean; isFollowing?: boolean }>({
    queryKey: ['creator-posts', username],
    queryFn:  () => api.get(`/posts?userId=${profile!.id}`).then((r) => r.data),
    enabled:  !!profile?.id,
  })

  const posts      = postsData?.data ?? []
  const isSubscribed = postsData?.isSubscribed ?? false

  const follow  = useMutation({ mutationFn: () => api.post(`/users/${username}/follow`),     onSuccess: () => toast.success('Followed!') })
  const message = useMutation({ 
    mutationFn: () => api.post(`/messages/start/${profile?.id}`), 
    onSuccess: (data) => {
      toast.success('Conversation started')
      router.push('/messages')
    }
  })

  if (!profile) {
    return <div className="text-gray-500 text-center py-20">Loading…</div>
  }

  return (
    <>  
    <div className="min-h-screen bg-[#121212]">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-[#ff4757]/40 to-[#ff6b6b]/10 relative">
        {profile.bannerKey && (
          <img
            src={mediaUrl(profile.bannerKey)!}
            alt="banner"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Profile header */}
        <div className="relative -mt-16 mb-6 flex items-end justify-between">
          <div className="flex items-end gap-4">
            {profile.avatarKey ? (
              <img
                src={mediaUrl(profile.avatarKey)!}
                alt={profile.username}
                className="w-28 h-28 rounded-full object-cover border-4 border-[#121212]"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-[#ff4757]/20 border-4 border-[#121212] flex items-center justify-center">
                <span className="text-3xl font-bold text-[#ff4757]">
                  {profile.username[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="pb-2">
              <h1 className="text-2xl font-bold text-white">
                {profile.displayName ?? profile.username}
                {profile.isVerified && (
                  <Star size={16} className="inline ml-2 text-[#ff4757] fill-[#ff4757]" />
                )}
              </h1>
              <p className="text-gray-400">@{profile.username}</p>
            </div>
          </div>
          <div className="pb-2 flex gap-2">
            <button
              onClick={() => follow.mutate()}
              className="flex items-center gap-2 bg-[#ff4757] hover:bg-red-500 text-white font-semibold px-5 py-2 rounded-full transition"
            >
              <UserPlus size={16} /> Follow
            </button>
            <button
              onClick={() => message.mutate()}
              disabled={!profile || message.isPending}
              className="flex items-center gap-2 bg-[#222] hover:bg-[#333] text-white font-semibold px-5 py-2 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare size={16} /> Message
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mb-6 text-sm text-gray-400">
          <span><strong className="text-white">{profile._count.followers}</strong> followers</span>
          <span><strong className="text-white">{profile._count.follows}</strong> following</span>
          <span><strong className="text-white">{profile._count.posts}</strong> posts</span>
        </div>

        {profile.bio && <p className="text-gray-300 mb-8">{profile.bio}</p>}

        {/* Posts grid */}
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-16">No posts yet</p>
        ) : (
          <div className="grid grid-cols-3 gap-1 pb-8">
            {posts.map((post) => (
              <div key={post.id} onClick={() => setSelectedPost(post)} className="aspect-square bg-[#161616] rounded overflow-hidden relative group cursor-pointer">
                {post.isLocked ? (
                  /* Locked thumbnail — no media key available for this viewer */
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1a1a1a] to-[#111] p-2">
                    <Lock size={22} className="text-[#ff4757]" />
                    <span className="text-xs text-gray-400 text-center leading-tight">
                      {post.visibility === 'FOLLOWERS' ? 'Followers only' : 'Subscribers only'}
                    </span>
                    {post.caption && (
                      <p className="text-gray-500 text-[10px] text-center line-clamp-2 mt-1">{post.caption}</p>
                    )}
                  </div>
                ) : post.mediaKey && post.mediaType === 'VIDEO' ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                    <Video size={32} className="text-gray-400" />
                    {post.caption && <p className="absolute bottom-2 left-2 right-2 text-xs text-gray-300 line-clamp-2">{post.caption}</p>}
                  </div>
                ) : post.mediaKey ? (
                  <img
                    src={mediaUrl(post.mediaKey)!}
                    alt={post.caption ?? ''}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3">
                    <p className="text-gray-400 text-sm text-center line-clamp-4">{post.caption ?? '📝'}</p>
                  </div>
                )}
                {!post.isLocked && post.isPremium && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-[#ff4757] text-xs font-bold">🔒 Premium</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

      {/* ── Post detail modal ──────────────────────────────────────── */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="w-full max-w-xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-400 hover:text-white transition p-1 rounded-full hover:bg-white/10"
              >
                <X size={22} />
              </button>
            </div>
            <PostCard post={selectedPost} currentUserId={user?.username} />
          </div>
        </div>
      )}
    </>
  )
}
