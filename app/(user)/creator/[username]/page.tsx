'use client'
import { useParams }     from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Video, UserPlus, MessageSquare, Star } from 'lucide-react'
import { toast }          from 'sonner'
import api                from '@/lib/api'
import type { User, Post } from '@/types'

export default function CreatorProfilePage() {
  const params    = useParams<{ username: string }>()
  const username  = params.username

  const { data: profileData } = useQuery<{ success: boolean; data: User & { _count: { followers: number; follows: number; posts: number } } }>({
    queryKey: ['creator', username],
    queryFn:  () => api.get(`/users/${username}`).then((r) => r.data),
  })

  const { data: postsData } = useQuery<{ success: boolean; data: Post[] }>({
    queryKey: ['creator-posts', username],
    queryFn:  () => api.get(`/posts?creatorUsername=${username}`).then((r) => r.data),
    enabled:  !!username,
  })

  const follow  = useMutation({ mutationFn: () => api.post(`/users/${username}/follow`),     onSuccess: () => toast.success('Followed!') })
  const message = useMutation({ mutationFn: () => api.post(`/messages/start`, { username }), onSuccess: () => toast.success('Conversation started') })

  const profile = profileData?.data
  const posts   = postsData?.data ?? []

  if (!profile) {
    return <div className="text-gray-500 text-center py-20">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-[#ff4757]/40 to-[#ff6b6b]/10 relative">
        {profile.bannerKey && (
          <img
            src={`https://${process.env.NEXT_PUBLIC_CDN_DOMAIN}/${profile.bannerKey}`}
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
                src={`https://${process.env.NEXT_PUBLIC_CDN_DOMAIN}/${profile.avatarKey}`}
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
              className="flex items-center gap-2 bg-[#222] hover:bg-[#333] text-white font-semibold px-5 py-2 rounded-full transition"
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
              <div key={post.id} className="aspect-square bg-[#161616] rounded overflow-hidden relative group cursor-pointer">
                {post.mediaKey ? (
                  <img
                    src={`https://${process.env.NEXT_PUBLIC_CDN_DOMAIN}/${post.mediaKey}`}
                    alt={post.caption ?? ''}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video size={32} className="text-gray-600" />
                  </div>
                )}
                {post.isPremium && (
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
  )
}
