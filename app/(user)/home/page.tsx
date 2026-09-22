'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link  from 'next/link'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Flame, Clock } from 'lucide-react'
import api         from '@/lib/api'
import { mediaUrl } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useWalletStore } from '@/store/walletStore'
import PostCard from '@/components/PostCard'
import PostDetailModal from '@/components/PostDetailModal'
import StoryViewerModal from '@/components/StoryViewerModal'
import AddStoryModal from '@/components/AddStoryModal'
import type { Post, StoryGroup } from '@/types'

dayjs.extend(relativeTime)

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Creator {
  id: string
  username: string
  displayName: string | null
  avatarKey: string | null
  bannerKey: string | null
  bio: string | null
  isVerified: boolean
  creatorProfile: { monthlySubPrice: number | null; isLive: boolean } | null
  _count: { followers: number; subscribers: number; posts: number }
}

/* ─── Skeleton ──────────────────────────────────────────────────────────── */

function PostSkeleton() {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-brand-card" />
        <div className="space-y-1.5">
          <div className="w-28 h-3 bg-brand-card rounded" />
          <div className="w-16 h-2.5 bg-brand-card rounded" />
        </div>
      </div>
      <div className="h-52 bg-brand-card rounded-xl mb-3" />
      <div className="w-3/4 h-3 bg-brand-card rounded mb-2" />
      <div className="w-1/2 h-3 bg-brand-card rounded" />
    </div>
  )
}

function CreatorSkeleton() {
  return (
    <div className="flex items-center justify-between py-2.5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-card" />
        <div className="space-y-1.5">
          <div className="w-20 h-3 bg-brand-card rounded" />
          <div className="w-12 h-2.5 bg-brand-card rounded" />
        </div>
      </div>
      <div className="w-16 h-7 rounded-lg bg-brand-card" />
    </div>
  )
}

/* ─── Stories Strip ─────────────────────────────────────────────────────── */

function StoriesStrip({
  groups,
  currentUser,
  onOpenStory,
  onAddStory,
}: {
  groups: StoryGroup[]
  currentUser: { id?: string; username: string; displayName?: string | null; avatarKey?: string | null } | null
  onOpenStory: (groupIndex: number) => void
  onAddStory: () => void
}) {
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(0)
  const PAGE_SIZE   = 6
  const totalPages  = Math.ceil(groups.length / PAGE_SIZE)
  const visible     = groups.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const pageOffset  = page * PAGE_SIZE

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm">Stories</h3>
        {groups.length > 0 && (
          <span className="text-brand-muted text-xs">{groups.length} active</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Prev */}
        <button
          onClick={() => setPage(p => p - 1)}
          disabled={page === 0}
          className="shrink-0 w-8 h-8 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-white hover:bg-brand-red hover:border-brand-red transition disabled:opacity-0 disabled:pointer-events-none"
          aria-label="Previous stories"
        >
          ‹
        </button>

        <div className="flex-1 flex gap-4 items-start">
          {/* Add Story pinned on page 0 */}
          {currentUser && page === 0 && (
            <button
              onClick={onAddStory}
              className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0 focus:outline-none"
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-brand-red flex items-center justify-center bg-brand-card">
                <span className="text-2xl font-bold text-brand-red">+</span>
              </div>
              <span className="text-brand-muted text-xs text-center w-16 truncate">Your Story</span>
            </button>
          )}

          {/* Story group bubbles */}
          {visible.map((g, i) => {
            const globalIdx = pageOffset + i
            const avatar    = mediaUrl(g.user.avatarKey)
            const initials  = (g.user.displayName ?? g.user.username)[0].toUpperCase()
            const allViewed = g.stories.every(s => s.hasViewed)
            const ringClass = allViewed
              ? 'bg-brand-muted/40'
              : 'bg-gradient-to-tr from-brand-red via-pink-500 to-yellow-400'

            return (
              <button
                key={g.user.id}
                onClick={() => onOpenStory(globalIdx)}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
              >
                <div className={`w-16 h-16 rounded-full p-0.5 ${ringClass}`}>
                  <div className="w-full h-full rounded-full border-2 border-brand-surface overflow-hidden">
                    {avatar && !avatarErrors[g.user.id]
                      ? <Image src={avatar} alt={g.user.displayName ?? g.user.username} width={64} height={64} className="object-cover w-full h-full" onError={() => setAvatarErrors(p => ({ ...p, [g.user.id]: true }))} />
                      : <div className="w-full h-full bg-brand-card flex items-center justify-center text-base font-bold text-white">{initials}</div>}
                  </div>
                </div>
                <span className="text-white text-xs text-center w-16 truncate group-hover:text-brand-red transition">
                  {g.user.displayName ?? g.user.username}
                </span>
              </button>
            )
          })}
        </div>

        {/* Next */}
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page >= totalPages - 1}
          className="shrink-0 w-8 h-8 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-white hover:bg-brand-red hover:border-brand-red transition disabled:opacity-0 disabled:pointer-events-none"
          aria-label="Next stories"
        >
          ›
        </button>
      </div>
    </div>
  )
}

/* ─── Activity card (used when creator has no posts yet) ────────────────── */

function CreatorActivityCard({ creator, priority }: { creator: Creator; priority?: boolean }) {
  const [avatarErr, setAvatarErr] = useState(false)
  const [bannerErr, setBannerErr] = useState(false)
  const avatar   = mediaUrl(creator.avatarKey)
  const banner   = mediaUrl(creator.bannerKey)
  const price    = creator.creatorProfile?.monthlySubPrice
  const postsCnt = creator._count.posts
  const subsCnt  = creator._count.subscribers
  const profileHref = `/creator/${creator.username}`

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden hover:border-brand-red/40 transition">
      <Link href={profileHref} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface">
        {/* Banner */}
        <div className="relative h-28 bg-brand-card overflow-hidden">
          {banner && !bannerErr && (
            <Image src={banner} alt="" fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" priority={priority} onError={() => setBannerErr(true)} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-surface/80 to-transparent" />
          {creator.creatorProfile?.isLive && (
            <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
              LIVE
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-5 pt-0 pb-5 -mt-6 relative">
          <div className="w-14 h-14 rounded-full border-4 border-brand-surface overflow-hidden mb-3">
            {avatar && !avatarErr
              ? <Image src={avatar} alt={creator.displayName ?? creator.username} width={56} height={56} className="object-cover w-full h-full" onError={() => setAvatarErr(true)} />
              : <div className="w-full h-full bg-brand-card flex items-center justify-center text-xl">{(creator.displayName ?? creator.username)[0].toUpperCase()}</div>
            }
          </div>

          <div className="pr-28">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm hover:text-brand-red transition">{creator.displayName ?? creator.username}</span>
              {creator.isVerified && <span className="text-brand-red text-xs">✓</span>}
            </div>
            <p className="text-brand-muted text-xs">@{creator.username}</p>
          </div>

          {creator.bio && (
            <p className="text-brand-muted text-xs mt-2 leading-relaxed line-clamp-2">{creator.bio}</p>
          )}

          <div className="flex gap-4 mt-3 text-xs text-brand-muted">
            <span><span className="text-white font-semibold">{subsCnt.toLocaleString()}</span> subscribers</span>
            <span><span className="text-white font-semibold">{postsCnt}</span> posts</span>
          </div>

          <p className="mt-3 text-xs text-brand-muted bg-brand-card rounded-lg px-3 py-2">
            🔒 Subscribe to unlock all exclusive content
          </p>
        </div>
      </Link>

      <div className="px-5 pb-5 -mt-[7.75rem] relative flex justify-end pointer-events-none">
        <div className="pointer-events-auto">
          <Link
            href={`/subscribe/${creator.username}`}
            className="shrink-0 px-3.5 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg hover:bg-red-600 transition"
          >
            💳 {price ? `$${price}/mo` : 'Subscribe'}
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── Sidebar creator row ───────────────────────────────────────────────── */

function SidebarCreatorRow({ c }: { c: Creator }) {
  const [avatarErr, setAvatarErr] = useState(false)
  const avatar      = mediaUrl(c.avatarKey)
  const price       = c.creatorProfile?.monthlySubPrice
  const profileHref = `/creator/${c.username}`
  const initials    = (c.displayName ?? c.username)[0].toUpperCase()

  return (
    <div className="flex items-center justify-between py-3 gap-2">
      <Link href={profileHref} className="flex items-center gap-2.5 min-w-0 flex-1 hover:text-brand-red transition">
        <span className="shrink-0">
          {avatar && !avatarErr
            ? <Image src={avatar} alt={c.displayName ?? c.username} width={36} height={36} className="rounded-full object-cover w-9 h-9 shrink-0" onError={() => setAvatarErr(true)} />
            : <div className="w-9 h-9 rounded-full bg-brand-card shrink-0 flex items-center justify-center text-sm font-bold">{initials}</div>
          }
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-white text-sm font-semibold truncate hover:text-brand-red transition">{c.displayName ?? c.username}</p>
            {c.isVerified && <span className="text-brand-red text-xs shrink-0">✓</span>}
          </div>
          <p className="text-brand-muted text-xs truncate">
            {c._count.posts} posts · {c._count.subscribers} subs
          </p>
        </div>
      </Link>
      <Link
        href={`/subscribe/${c.username}`}
        className="shrink-0 text-xs bg-brand-red text-white font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-600 transition whitespace-nowrap"
      >
        {price ? `$${price}` : 'Sub'}
      </Link>
    </div>
  )
}

/* ─── BangCoins balance (right sidebar) ────────────────────────────────── */

function BangCoinsBalance() {
  const { balance, isLoading, fetchBalance } = useWalletStore()
  useEffect(() => { fetchBalance() }, [fetchBalance])
  return (
    <p className="text-white text-2xl font-black mb-3">
      {isLoading ? '…' : balance.toFixed(0)}
    </p>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const { user } = useAuthStore()
  const [posts,           setPosts]           = useState<Post[]>([])
  const [creators,        setCreators]        = useState<Creator[]>([])
  const [storyGroups,     setStoryGroups]     = useState<StoryGroup[]>([])
  const [loading,         setLoading]         = useState(true)
  const [selectedPost,    setSelectedPost]    = useState<Post | null>(null)
  const [feedTab,         setFeedTab]         = useState<'latest' | 'popular'>('latest')
  const [viewerGroupIdx,  setViewerGroupIdx]  = useState<number | null>(null)
  const [showAddStory,    setShowAddStory]    = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [postsRes, creatorsRes, storiesRes] = await Promise.all([
          api.get<{ data: Post[] }>('/posts?perPage=20'),
          api.get<{ data: Creator[] }>('/creators'),
          api.get<{ data: StoryGroup[] }>('/stories/feed').catch(() => ({ data: { data: [] } })),
        ])
        setPosts(postsRes.data.data ?? [])
        setCreators(creatorsRes.data.data ?? [])
        setStoryGroups(storiesRes.data.data ?? [])
      } catch {
        // silently degrade
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleStoryDeleted = (storyId: string) => {
    setStoryGroups(prev => prev
      .map(g => ({ ...g, stories: g.stories.filter(s => s.id !== storyId) }))
      .filter(g => g.stories.length > 0)
    )
  }

  const handleStoryCreated = (newGroup: StoryGroup) => {
    setStoryGroups(prev => {
      // If user already has a group, prepend the new story to it
      const existing = prev.find(g => g.user.id === newGroup.user.id)
      if (existing) {
        return [
          { ...existing, stories: [...newGroup.stories, ...existing.stories] },
          ...prev.filter(g => g.user.id !== newGroup.user.id),
        ]
      }
      return [newGroup, ...prev]
    })
  }

  const sidebarCreators = creators.slice(0, 5)

  const visiblePosts = feedTab === 'popular'
    ? [...posts].sort((a, b) => b.likesCount - a.likesCount)
    : posts

  return (
    <>
    <div className="flex gap-6 p-4 md:p-6 max-w-6xl mx-auto">

      {/* ── Main Feed ───────────────────────────────────────────────── */}
      <section className="flex-1 min-w-0 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-black text-2xl">
            Discover Creators
          </h1>
          <Link href="/explore" className="text-brand-red text-sm font-semibold hover:underline">
            Explore all →
          </Link>
        </div>

        {/* ── Stories ──────────────────────────────────────────────── */}
        {!loading && (
          <StoriesStrip
            groups={storyGroups}
            currentUser={user}
            onOpenStory={idx => setViewerGroupIdx(idx)}
            onAddStory={() => setShowAddStory(true)}
          />
        )}
        {loading && (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 animate-pulse">
            <div className="flex gap-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="w-16 h-16 rounded-full bg-brand-card" />
                  <div className="w-14 h-2.5 bg-brand-card rounded" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Feed tabs ────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-brand-surface border border-brand-border rounded-xl p-1 w-fit">
          <button
            onClick={() => setFeedTab('latest')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${feedTab === 'latest' ? 'bg-brand-red text-white' : 'text-brand-muted hover:text-white'}`}
          >
            <Clock className="w-3.5 h-3.5" /> Latest
          </button>
          <button
            onClick={() => setFeedTab('popular')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${feedTab === 'popular' ? 'bg-brand-red text-white' : 'text-brand-muted hover:text-white'}`}
          >
            <Flame className="w-3.5 h-3.5" /> Popular
          </button>
        </div>

        {/* ── Loading skeletons ─────────────────────────────────────── */}
        {loading && (
          <div className="space-y-5">
            <PostSkeleton /><PostSkeleton /><PostSkeleton />
          </div>
        )}

        {/* ── Real posts ───────────────────────────────────────────── */}
        {!loading && posts.length > 0 && visiblePosts.map(p => (
          <PostCard 
            key={p.id} 
            post={p}
            currentUserId={user?.username}
            onPostClick={(post) => setSelectedPost(post as Post)}
          />
        ))}


      </section>

      {/* ── Right Sidebar ────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 hidden lg:flex flex-col gap-4">


        {/* BangCoins */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
          <p className="text-brand-muted text-xs mb-1">BangCoins Balance</p>
          <BangCoinsBalance />
          <Link href="/bangcoins" className="block w-full bg-brand-red text-white font-bold py-2 rounded-lg text-sm hover:bg-red-600 transition text-center">
            Recharge
          </Link>
        </div>

        {/* Profile Activity */}
        {user && (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
            <h3 className="text-white font-bold text-sm mb-3">Profile Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-brand-muted text-xs">Following</span>
                <Link href="/profile" className="text-white text-sm font-bold hover:text-brand-red transition">View</Link>
              </div>
              <div className="h-px bg-brand-border" />
              <p className="text-brand-muted text-xs leading-relaxed">
                The perfect time for{' '}
                <Link href="/for-creators" className="text-brand-red hover:underline">updating your profile</Link>
                {' '}and growing your audience.
              </p>
            </div>
          </div>
        )}

        {/* Footer links */}
        <p className="text-brand-muted text-xs text-center leading-relaxed px-2">
          <Link href="/for-creators" className="text-brand-red hover:underline">Become a Creator</Link>
          {' · '}
          <span>Terms</span>{' · '}<span>Privacy</span>
        </p>
      </aside>
    </div>

    {selectedPost && (
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        currentUserId={user?.username}
      />
    )}

    {viewerGroupIdx !== null && (
      <StoryViewerModal
        groups={storyGroups}
        initialGroupIndex={viewerGroupIdx}
        currentUserId={user?.id}
        onClose={() => setViewerGroupIdx(null)}
        onDeleted={handleStoryDeleted}
      />
    )}

    {showAddStory && (
      <AddStoryModal
        onClose={() => setShowAddStory(false)}
        onCreated={handleStoryCreated}
      />
    )}
    </>
  )
}

