'use client'
import { useState }             from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Video, Lock, Music, Coins, X } from 'lucide-react'
import { toast }                from 'sonner'
import api                      from '@/lib/api'
import { mediaUrl }             from '@/lib/utils'
import { useAuthStore }         from '@/store/authStore'
import { useWalletStore }       from '@/store/walletStore'
import Link                     from 'next/link'
import PostDetailModal          from '@/components/PostDetailModal'
import type { User, Post }      from '@/types'

export default function CreatorProfilePage() {
  const params    = useParams<{ username: string }>()
  const router    = useRouter()
  const username  = params.username
  const { user }  = useAuthStore()
  const { balance, fetchBalance, deductCoins } = useWalletStore()
  const qc        = useQueryClient()
  const [selectedPost,   setSelectedPost]   = useState<Post | null>(null)
  const [unlockTarget,   setUnlockTarget]   = useState<Post | null>(null)
  const [activeTab, setActiveTab]           = useState<'followers' | 'subscribers'>('followers')

  const { data: profileData } = useQuery<{ success: boolean; data: User & { isFollowing: boolean; _count: { followers: number; subscribers: number; posts: number } } }>({
    queryKey: ['creator', username],
    queryFn:  () => api.get(`/users/${username}`).then((r) => r.data),
  })

  const profile = profileData?.data

  const isFollowing = profile?.isFollowing ?? false

  const follow = useMutation({
    mutationFn: () => isFollowing
      ? api.delete(`/users/${username}/follow`)
      : api.post(`/users/${username}/follow`),
    onSuccess: () => {
      toast.success(isFollowing ? 'Unfollowed' : 'Followed!')
      qc.invalidateQueries({ queryKey: ['creator', username] })
    },
    onError: () => toast.error('Could not update follow status'),
  })

  const { data: postsData } = useQuery<{ success: boolean; data: Post[] }>({
    queryKey: ['creator-posts', username],
    queryFn:  () => api.get(`/posts?userId=${profile!.id}`).then((r) => r.data),
    enabled:  !!profile?.id,
  })

  const posts = postsData?.data ?? []

  const { data: subStatusData } = useQuery<{ success: boolean; data: { isSubscribed: boolean; subscription: { expiresAt: string; paymentMethod: string; price: number } | null } }>({
    queryKey: ['sub-status', username],
    queryFn:  () => api.get(`/payments/subscription-status/${username}`).then(r => r.data),
    enabled:  !!user && !!username,
  })
  const isSubscribed = subStatusData?.data?.isSubscribed ?? false
  // Viewer is the creator — their own content is never locked
  const isOwnProfile  = !!user && user.username === username

  const message = useMutation({
    mutationFn: () => api.post(`/messages/start/${profile?.id}`),
    onSuccess: () => { toast.success('Conversation started'); router.push('/messages') },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Could not start conversation'),
  })

  // BangCoin unlock for premium posts
  const { mutate: doUnlock, isPending: isUnlocking } = useMutation({
    mutationFn: (postId: string) => api.post(`/posts/${postId}/unlock`),
    onSuccess: (res) => {
      deductCoins(unlockTarget?.premiumPrice ?? 0)
      toast.success(`Unlocked! ${unlockTarget?.premiumPrice} BangCoins charged.`)
      setUnlockTarget(null)
      qc.invalidateQueries({ queryKey: ['creator-posts', username] })
      qc.invalidateQueries({ queryKey: ['wallet'] })
    },
    onError: (err: any) => {
      if (err?.response?.status === 402) {
        toast.error('Not enough BangCoins — top up your wallet.')
      } else {
        toast.error(err?.response?.data?.message ?? 'Unlock failed')
      }
    },
  })

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#121212]">
        <div className="w-8 h-8 border-2 border-[#ff0618] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const followerPosts    = posts.filter(p => p.visibility !== 'SUBSCRIBERS')
  const subscriberPosts  = posts.filter(p => p.visibility === 'SUBSCRIBERS')

  return (
    <>
    <div className="min-h-screen bg-[#121212]">
      {/* Banner */}
      <div className="h-48 md:h-56 bg-gradient-to-r from-[#ff0618]/30 to-[#ff0618]/10 relative overflow-hidden">
        {profile.bannerKey && (
          <img
            src={mediaUrl(profile.bannerKey)!}
            alt="banner"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* ── Profile header ── */}
        <div className="relative -mt-14 mb-4">
          {/* Avatar */}
          <div className="mb-3">
            {profile.avatarKey ? (
              <img
                src={mediaUrl(profile.avatarKey)!}
                alt={profile.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#121212]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#ff0618]/20 border-4 border-[#121212] flex items-center justify-center">
                <span className="text-3xl font-bold text-[#ff0618]">
                  {profile.username[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Username + action buttons */}
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="text-white text-xl font-bold">@{profile.username}</h1>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => follow.mutate()}
                disabled={follow.isPending || !user}
                className="px-4 py-1.5 rounded-full text-sm font-semibold border border-[#555] text-white hover:bg-[#222] transition disabled:opacity-50"
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <Link
                href={`/subscribe/${username}`}
                className="px-4 py-1.5 rounded-full text-sm font-semibold border border-[#555] text-white hover:bg-[#222] transition"
              >
                {isSubscribed ? '✓ Subscribed' : 'Subscribe'}
              </Link>
              <button
                onClick={() => message.mutate()}
                disabled={message.isPending}
                className="px-4 py-1.5 rounded-full text-sm font-semibold border border-[#555] text-white hover:bg-[#222] transition disabled:opacity-50"
              >
                Message
              </button>
            </div>
          </div>

          {/* Subscriber / follower counts */}
          <p className="text-sm text-gray-400 mb-2">
            <span className="text-gray-200 hover:underline cursor-pointer">
              {profile._count.subscribers.toLocaleString()} subscribers
            </span>
            <span className="mx-2">•</span>
            <span className="text-gray-200 hover:underline cursor-pointer">
              {profile._count.followers.toLocaleString()} followers
            </span>
          </p>

          {/* Bio + Play Bio Audio */}
          {(profile.bio || true) && (
            <div className="flex items-center gap-3 flex-wrap">
              {profile.bio && (
                <p className="text-gray-300 text-sm italic">"{profile.bio}"</p>
              )}
              <button className="flex items-center gap-1.5 bg-[#ff0618] hover:bg-red-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition">
                <Music size={13} />
                Play Bio Audio
              </button>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-[#2a2a2a] mb-1">
          {(['followers', 'subscribers'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'text-[#ff0618] border-b-2 border-[#ff0618]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        {activeTab === 'followers' ? (
          followerPosts.length === 0 ? (
            <p className="text-gray-500 text-center py-16">No posts yet</p>
          ) : (
            <div className="grid grid-cols-3 gap-1 pb-8 mt-1">
              {followerPosts.map(post => {
                const premiumLock = !isOwnProfile && post.isPremium && !post.mediaKey
                return (
                  <PostGridItem
                    key={post.id}
                    post={premiumLock ? { ...post, isLocked: true } : post}
                    onClick={premiumLock
                      ? () => { fetchBalance(); setUnlockTarget(post) }
                      : () => setSelectedPost(post)}
                  />
                )
              })}
            </div>
          )
        ) : subscriberPosts.length === 0 ? (
          <p className="text-gray-500 text-center py-16">No exclusive posts yet</p>
        ) : (
          <div className="grid grid-cols-3 gap-1 pb-8 mt-1">
            {subscriberPosts.map(post => {
              const notSubscribed = !isSubscribed
              const premiumLock = isSubscribed && !isOwnProfile && post.isPremium && !post.mediaKey
              const needsLock = notSubscribed || premiumLock
              return (
                <PostGridItem
                  key={post.id}
                  post={needsLock ? { ...post, isLocked: true } : post}
                  subscribeHref={notSubscribed ? `/subscribe/${username}` : undefined}
                  onClick={needsLock
                    ? premiumLock ? () => { fetchBalance(); setUnlockTarget(post) } : undefined
                    : () => setSelectedPost(post)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>

    {/* ── Post detail modal ── */}
    {selectedPost && (
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        currentUserId={user?.username}
      />
    )}

    {/* ── BangCoin unlock modal ── */}
    {unlockTarget && (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80" onClick={() => setUnlockTarget(null)}>
        <div
          className="relative bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => setUnlockTarget(null)} className="absolute top-3 right-3 text-gray-400 hover:text-white"><X size={18} /></button>

          {/* Blurred preview */}
          {(unlockTarget.previewKey ?? unlockTarget.mediaKey) && (
            <div className="w-full h-40 rounded-xl overflow-hidden mb-4 relative">
              <img
                src={mediaUrl(unlockTarget.previewKey ?? unlockTarget.mediaKey)!}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: 'blur(12px)', transform: 'scale(1.12)' }}
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Lock size={28} className="text-white/70" />
              </div>
            </div>
          )}

          <h3 className="text-white font-bold text-lg mb-1 text-center">Unlock this post</h3>
          <p className="text-gray-400 text-sm text-center mb-4">One-time payment — yours forever</p>

          {/* Price + balance */}
          <div className="bg-[#1f1f1f] rounded-xl p-4 mb-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Price</span>
              <span className="text-white font-bold flex items-center gap-1">
                <Coins size={14} className="text-yellow-400" />
                {unlockTarget.premiumPrice} BangCoins
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Your balance</span>
              <span className={`font-bold flex items-center gap-1 ${
                balance >= (unlockTarget.premiumPrice ?? 0) ? 'text-green-400' : 'text-red-400'
              }`}>
                <Coins size={14} className="text-yellow-400" />
                {balance} BangCoins
              </span>
            </div>
            {balance < (unlockTarget.premiumPrice ?? 0) && (
              <p className="text-red-400 text-xs pt-1">Insufficient balance — top up first.</p>
            )}
          </div>

          {balance >= (unlockTarget.premiumPrice ?? 0) ? (
            <button
              onClick={() => doUnlock(unlockTarget.id)}
              disabled={isUnlocking}
              className="w-full py-3 bg-[#ff0618] hover:bg-red-500 disabled:opacity-60 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Coins size={16} />
              {isUnlocking ? 'Processing…' : `Pay ${unlockTarget.premiumPrice} BangCoins`}
            </button>
          ) : (
            <Link
              href="/bangcoins"
              className="block w-full py-3 bg-[#ff0618] hover:bg-red-500 text-white font-bold rounded-xl transition text-center"
              onClick={() => setUnlockTarget(null)}
            >
              Buy BangCoins
            </Link>
          )}
        </div>
      </div>
    )}
    </>
  )
}

function PostGridItem({
  post, onClick, subscribeHref,
}: {
  post: Post
  onClick?: () => void
  subscribeHref?: string
}) {
  const subPrice = post.creator.creatorProfile?.monthlySubPrice
  const isSubscriberLocked = post.isLocked && !post.isPremium && post.visibility === 'SUBSCRIBERS'

  return (
    <div
      onClick={onClick}
      className={`aspect-square bg-[#161616] rounded overflow-hidden relative group ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      {post.isLocked ? (
        <>
          {/* Blurred preview — or gradient fallback */}
          {post.previewKey ? (
            post.mediaType === 'VIDEO' ? (
              <video
                src={mediaUrl(post.previewKey)!}
                className="w-full h-full object-cover block"
                style={{ filter: 'blur(10px)', transform: 'scale(1.12)', transformOrigin: 'center' }}
                muted playsInline preload="metadata"
                aria-hidden="true"
              />
            ) : (
              <img
                src={mediaUrl(post.previewKey)!}
                alt=""
                className="w-full h-full object-cover block"
                style={{ filter: 'blur(10px)', transform: 'scale(1.12)', transformOrigin: 'center' }}
                aria-hidden="true"
              />
            )
          ) : post.mediaKey ? (
            <img
              src={mediaUrl(post.mediaKey)!}
              alt=""
              className="w-full h-full object-cover block"
              style={{ filter: 'blur(14px)', transform: 'scale(1.15)', transformOrigin: 'center' }}
              aria-hidden="true"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-[#1a1a1a]" />
          )}

          {/* Overlay — matches mockup style */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center px-3 text-center">
            {isSubscriberLocked && subscribeHref ? (
              <Link
                href={subscribeHref}
                onClick={e => e.stopPropagation()}
                className="flex flex-col items-center gap-1.5 group/sub"
              >
                <Lock size={20} className="text-white/80" />
                <span className="text-white text-sm font-bold drop-shadow-lg leading-tight">
                  Subscribe{subPrice ? `\n$${subPrice}/mo` : ''}
                </span>
              </Link>
            ) : (
              <span className="text-white text-sm font-bold drop-shadow-lg">
                {post.premiumPrice
                  ? `${post.premiumPrice} BangCoin${post.premiumPrice !== 1 ? 's' : ''}`
                  : 'Locked'}
              </span>
            )}
          </div>
        </>
      ) : post.mediaKey && post.mediaType === 'VIDEO' ? (
        <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
          <Video size={32} className="text-gray-400" />
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
    </div>
  )
}
