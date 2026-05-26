'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface CreatorInfo {
  username:     string
  displayName:  string | null
  avatarUrl:    string | null
  bannerUrl:    string | null
  bio:          string | null
  isVerified:   boolean
  subscribersCount: number
  creatorProfile: {
    monthlySubPrice: number
  }
}

export default function SubscribePage() {
  const { username } = useParams<{ username: string }>()
  const router = useRouter()
  const { user } = useAuthStore()

  const [creator, setCreator]   = useState<CreatorInfo | null>(null)
  const [loading, setLoading]   = useState(true)
  const [paying,  setPaying]    = useState(false)
  const [error,   setError]     = useState('')

  // If not logged in, redirect to register with a return URL
  useEffect(() => {
    if (!user) {
      router.replace(`/register?redirect=/subscribe/${username}`)
    }
  }, [user, username, router])

  useEffect(() => {
    if (!username) return
    api.get(`/users/${username}/public`)
      .then(r => setCreator(r.data.data))
      .catch(() => setError('Creator not found.'))
      .finally(() => setLoading(false))
  }, [username])

  async function handleSubscribe() {
    if (!user) {
      router.push(`/register?redirect=/subscribe/${username}`)
      return
    }
    try {
      setPaying(true)
      setError('')
      const { data } = await api.post(`/payments/subscribe/${username}`)
      window.location.href = data.data.checkoutUrl
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Could not start checkout. Please try again.'
      setError(msg)
      setPaying(false)
    }
  }

  if (!user) return null // waiting for redirect

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !creator) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-center px-6">
        <div>
          <p className="text-2xl font-bold mb-2">Creator not found</p>
          <p className="text-brand-muted mb-6">{error}</p>
          <Link href="/explore" className="px-6 py-3 bg-brand-red text-white rounded-xl font-bold">Browse Creators</Link>
        </div>
      </div>
    )
  }

  const price = creator?.creatorProfile.monthlySubPrice ?? 9.99

  return (
    <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-hidden shadow-2xl shadow-black/40">

          {/* Banner */}
          <div className="relative h-32 bg-brand-card">
            {creator?.bannerUrl ? (
              <Image src={creator.bannerUrl} alt="banner" fill sizes="100vw" className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-brand-red/30 to-brand-dark" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-surface to-transparent" />
          </div>

          {/* Avatar */}
          <div className="px-6 -mt-12 relative z-10">
            <div className="w-24 h-24 rounded-full border-4 border-brand-surface overflow-hidden bg-brand-card">
              {creator?.avatarUrl ? (
                <Image src={creator.avatarUrl} alt={creator.username} width={96} height={96} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-brand-red">
                  {creator?.username[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Creator info */}
          <div className="px-6 pt-3 pb-6">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-black">{creator?.displayName ?? creator?.username}</h1>
              {creator?.isVerified && <span className="text-brand-red text-xs bg-brand-red/10 rounded-full px-2 py-0.5">✓ Verified</span>}
            </div>
            <p className="text-brand-muted text-sm mb-1">@{creator?.username}</p>
            {creator?.bio && <p className="text-brand-text text-sm leading-relaxed mt-3 mb-4">{creator.bio}</p>}

            {/* What you get */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-6 space-y-2.5">
              <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold mb-3">What you unlock</p>
              {[
                '🔓 All exclusive photos & videos',
                '💬 Direct messages with the creator',
                '🔴 Private live streams & events',
                '📸 Pay-per-view content discounts',
                '🎁 Subscriber-only tips & gifts',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-brand-text">
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
                {error}
              </div>
            )}

            {/* Subscribe CTA */}
            <button
              onClick={handleSubscribe}
              disabled={paying}
              className="w-full py-4 bg-brand-red text-white font-black text-lg rounded-xl hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {paying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Redirecting to checkout…
                </>
              ) : (
                <>
                  💳 Subscribe for ${price.toFixed(2)}/mo
                </>
              )}
            </button>

            <p className="text-brand-muted text-xs text-center mt-3">
              Secure payment via Stripe · Cancel any time
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link href={`/creator/${username}`} className="text-brand-muted text-sm hover:text-white transition">
            ← Back to {creator?.displayName ?? `@${username}`}&apos;s page
          </Link>
        </div>

      </div>
    </div>
  )
}
