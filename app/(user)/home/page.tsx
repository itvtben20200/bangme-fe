'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link  from 'next/link'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import api         from '@/lib/api'
import { mediaUrl } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useWalletStore } from '@/store/walletStore'
import PostCard from '@/components/PostCard'

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

interface Post {
  id: string
  caption: string | null
  mediaKey: string | null
  mediaType: string | null
  isPremium: boolean
  likesCount: number
  commentsCount: number
  viewsCount: number
  isLiked: boolean
  createdAt: string
  creator: {
    username: string
    displayName: string | null
    avatarKey: string | null
    isVerified: boolean
    creatorProfile: { monthlySubPrice: number | null; isLive: boolean } | null
  }
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
  const [posts,    setPosts]    = useState<Post[]>([])
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [postsRes, creatorsRes] = await Promise.all([
          api.get<{ data: Post[] }>('/posts?perPage=20'),
          api.get<{ data: Creator[] }>('/creators'),
        ])
        setPosts(postsRes.data.data ?? [])
        setCreators(creatorsRes.data.data ?? [])
      } catch {
        // silently degrade
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const sidebarCreators = creators.slice(0, 5)

  return (
    <div className="flex gap-6 p-4 md:p-6 max-w-6xl mx-auto">

      {/* ── Main Feed ───────────────────────────────────────────────── */}
      <section className="flex-1 min-w-0 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-black text-2xl">
            {user ? `Hey, ${user.displayName ?? user.username} 👋` : 'Discover Creators'}
          </h1>
          <Link href="/explore" className="text-brand-red text-sm font-semibold hover:underline">
            Explore all →
          </Link>
        </div>

        {/* ── Loading skeletons ─────────────────────────────────────── */}
        {loading && (
          <div className="space-y-5">
            <PostSkeleton /><PostSkeleton /><PostSkeleton />
          </div>
        )}

        {/* ── Real posts ───────────────────────────────────────────── */}
        {!loading && posts.length > 0 && posts.map(p => (
          <PostCard 
            key={p.id} 
            post={p}
            currentUserId={user?.username}
          />
        ))}

        {/* ── Suggested creator activity (when no posts yet) ────────── */}
        {!loading && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-brand-border" />
              <p className="text-brand-muted text-xs font-semibold uppercase tracking-widest whitespace-nowrap">
                {posts.length > 0 ? '✨ Suggested Creators' : '✨ Creators to Follow'}
              </p>
              <div className="flex-1 h-px bg-brand-border" />
            </div>

            {creators.length === 0 ? (
              <div className="text-center py-16 text-brand-muted">
                <p className="text-5xl mb-4">🌟</p>
                <p className="font-bold text-white mb-1">No creators yet</p>
                <p className="text-sm">Check back soon — new creators are joining every day.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {creators.map((c, i) => (
                  <CreatorActivityCard key={c.id} creator={c} priority={i === 0} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Right Sidebar ────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 hidden lg:flex flex-col gap-4">

        {/* Suggested Creators */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
          <h3 className="text-white font-bold mb-1 text-sm">Suggested Creators</h3>
          <p className="text-brand-muted text-xs mb-4">Subscribe to unlock their exclusive content</p>

          {loading ? (
            <div className="space-y-1">{[1,2,3].map(i => <CreatorSkeleton key={i} />)}</div>
          ) : sidebarCreators.length === 0 ? (
            <p className="text-brand-muted text-xs py-4 text-center">No creators found</p>
          ) : (
            <div className="divide-y divide-brand-border">
              {sidebarCreators.map(c => (
                <SidebarCreatorRow key={c.id} c={c} />
              ))}
            </div>
          )}

          <Link href="/explore" className="block mt-3 text-center text-brand-red text-xs font-semibold hover:underline">
            See all creators →
          </Link>
        </div>

        {/* BangCoins */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
          <p className="text-brand-muted text-xs mb-1">BangCoins Balance</p>
          <BangCoinsBalance />
          <Link href="/bangcoins" className="block w-full bg-brand-red text-white font-bold py-2 rounded-lg text-sm hover:bg-red-600 transition text-center">
            Recharge
          </Link>
        </div>

        {/* Footer links */}
        <p className="text-brand-muted text-xs text-center leading-relaxed px-2">
          <Link href="/for-creators" className="text-brand-red hover:underline">Become a Creator</Link>
          {' · '}
          <span>Terms</span>{' · '}<span>Privacy</span>
        </p>
      </aside>
    </div>
  )
}

