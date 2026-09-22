'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import api from '@/lib/api'
import { mediaUrl } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useWalletStore } from '@/store/walletStore'

interface CreatorInfo {
  username:     string
  displayName:  string | null
  avatarKey:    string | null
  bannerKey:    string | null
  bio:          string | null
  isVerified:   boolean
  _count: { subscribers: number }
  creatorProfile: {
    monthlySubPrice: number
  }
}

type PayMethod = 'card' | 'coins'

export default function SubscribePage() {
  const { username } = useParams<{ username: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const { balance, fetchBalance } = useWalletStore()

  const [creator,   setCreator]   = useState<CreatorInfo | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [paying,    setPaying]    = useState(false)
  const [error,     setError]     = useState('')
  const [payMethod, setPayMethod] = useState<PayMethod>('card')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subExpiresAt, setSubExpiresAt] = useState<string | null>(null)

  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // If not logged in, redirect to register with a return URL
  useEffect(() => {
    if (!user) {
      router.replace(`/register?redirect=/subscribe/${username}`)
    }
  }, [user, username, router])

  // Fetch creator info
  useEffect(() => {
    if (!username) return
    api.get(`/users/${username}`)
      .then(r => setCreator(r.data.data))
      .catch(() => setError('Creator nicht gefunden.'))
      .finally(() => setLoading(false))
  }, [username])

  // Fetch wallet balance and subscription status once logged in
  useEffect(() => {
    if (!user || !username) return
    fetchBalance()
    api.get(`/payments/subscription-status/${username}`)
      .then(r => {
        if (r.data.data.isSubscribed) {
          setIsSubscribed(true)
          setSubExpiresAt(r.data.data.subscription?.expiresAt ?? null)
        }
      })
      .catch(() => {}) // non-critical
  }, [user, username, fetchBalance])

  async function handleSubscribe() {
    if (!user) {
      router.push(`/register?redirect=/subscribe/${username}`)
      return
    }
    try {
      setPaying(true)
      setError('')

      if (payMethod === 'coins') {
        const { data } = await api.post(`/payments/subscribe-coins/${username}`)
        setIsSubscribed(true)
        setSubExpiresAt(data.data.expiresAt)
        fetchBalance() // refresh wallet balance
      } else {
        const { data } = await api.post(`/payments/subscribe/${username}`)
        window.location.href = data.data.checkoutUrl
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Das Abonnement konnte nicht abgeschlossen werden. Bitte versuche es erneut.'
      setError(msg)
    } finally {
      setPaying(false)
    }
  }

  async function handleUnsubscribe() {
    try {
      setCancelling(true)
      setError('')
      await api.delete(`/payments/subscription/${username}`)
      setIsSubscribed(false)
      setSubExpiresAt(null)
      setShowCancelConfirm(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Das Abonnement konnte nicht gekündigt werden. Bitte versuche es erneut.'
      setError(msg)
    } finally {
      setCancelling(false)
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-center px-6">
        <div>
          <p className="text-2xl font-bold mb-2">Creator nicht gefunden</p>
          <p className="text-brand-muted mb-6">{error || 'Creator nicht gefunden.'}</p>
          <Link href="/explore" className="px-6 py-3 bg-brand-red text-white rounded-xl font-bold">Creator ansehen</Link>
        </div>
      </div>
    )
  }

  const price     = creator?.creatorProfile.monthlySubPrice ?? 9.99
  const canAfford = balance >= price

  return (
    <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-hidden shadow-2xl shadow-black/40">

          {/* Banner */}
          <div className="relative h-32 bg-brand-card">
            {mediaUrl(creator?.bannerKey) ? (
              <Image src={mediaUrl(creator?.bannerKey)!} alt="banner" fill sizes="100vw" className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-brand-red/30 to-brand-dark" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-surface to-transparent" />
          </div>

          {/* Avatar */}
          <div className="px-6 -mt-12 relative z-10">
            <div className="w-24 h-24 rounded-full border-4 border-brand-surface overflow-hidden bg-brand-card">
              {mediaUrl(creator?.avatarKey) ? (
                <Image src={mediaUrl(creator?.avatarKey)!} alt={creator.username} width={96} height={96} className="object-cover w-full h-full" />
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
              {creator?.isVerified && <span className="text-brand-red text-xs bg-brand-red/10 rounded-full px-2 py-0.5">✓ Verifiziert</span>}
            </div>
            <p className="text-brand-muted text-sm mb-1">@{creator?.username}</p>
            {creator?.bio && <p className="text-brand-text text-sm leading-relaxed mt-3 mb-4">{creator.bio}</p>}

            {/* Already subscribed banner */}
            {isSubscribed && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
                <span>✅</span>
                <span>
                  Du bist abonniert!
                  {subExpiresAt && (
                    <> Verlängert sich am <strong>{new Date(subExpiresAt).toLocaleDateString()}</strong>.</>
                  )}
                </span>
              </div>
            )}

            {/* What you get */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-4 mb-5 space-y-2.5">
              <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold mb-3">Was du freischaltest</p>
              {[
                '🔓 Alle exklusiven Fotos & Videos',
                '💬 Direktnachrichten mit dem Creator',
                '🔴 Private Livestreams & Events',
                '📸 Rabatte auf Pay-per-View-Inhalte',
                '🎁 Tipps & Geschenke nur für Abonnenten',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-brand-text">
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Payment method toggle */}
            {!isSubscribed && (
              <>
                <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold mb-3">Bezahlen mit</p>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {/* Card option */}
                  <button
                    onClick={() => setPayMethod('card')}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition ${
                      payMethod === 'card'
                        ? 'border-brand-red bg-brand-red/10'
                        : 'border-brand-border bg-brand-card hover:border-brand-red/50'
                    }`}
                  >
                    <span className="text-2xl">💳</span>
                    <span className="font-bold text-sm">Karte</span>
                    <span className="text-brand-muted text-xs">${price.toFixed(2)}/mo</span>
                  </button>

                  {/* BangCoins option */}
                  <button
                    onClick={() => setPayMethod('coins')}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition ${
                      payMethod === 'coins'
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-brand-border bg-brand-card hover:border-yellow-500/50'
                    }`}
                  >
                    <span className="text-2xl">🪙</span>
                    <span className="font-bold text-sm">BangCoins</span>
                    <span className="text-brand-muted text-xs">{price} Coins/Monat</span>
                  </button>
                </div>

                {/* BangCoins balance info */}
                {payMethod === 'coins' && (
                  <div className={`rounded-xl px-4 py-3 text-sm mb-5 flex items-center justify-between ${
                    canAfford
                      ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}>
                    <span>Dein Guthaben: <strong>{balance.toFixed(0)} BangCoins</strong></span>
                    {canAfford ? (
                      <span className="text-xs">✓ Ausreichend</span>
                    ) : (
                      <Link href="/bangcoins" className="text-xs underline hover:no-underline">
                        Aufladen →
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
                {error}
              </div>
            )}

            {/* Subscribe CTA */}
            {!isSubscribed ? (
              <>
                <button
                  onClick={handleSubscribe}
                  disabled={paying || (payMethod === 'coins' && !canAfford)}
                  className={`w-full py-4 font-black text-lg rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
                    payMethod === 'coins'
                      ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                      : 'bg-brand-red text-white hover:bg-red-600'
                  }`}
                >
                  {paying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {payMethod === 'coins' ? 'Wird verarbeitet...' : 'Weiterleitung zum Checkout...'}
                    </>
                  ) : payMethod === 'coins' ? (
                    <>🪙 Für {price} BangCoins/Monat abonnieren</>
                  ) : (
                    <>💳 Für ${price.toFixed(2)}/Monat abonnieren</>
                  )}
                </button>

                <p className="text-brand-muted text-xs text-center mt-3">
                  {payMethod === 'coins'
                    ? 'Sofort bezahlt mit deinem BangCoins-Wallet · jederzeit kündbar'
                    : 'Sichere Zahlung über Stripe · jederzeit kündbar'}
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <Link
                  href={`/creator/${username}`}
                  className="w-full py-4 bg-brand-card border border-brand-border text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 hover:bg-brand-surface transition"
                >
                  Inhalte von {creator?.displayName ?? `@${username}`} ansehen
                </Link>
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-2.5 text-brand-muted text-sm font-medium rounded-xl border border-brand-border hover:border-red-500/40 hover:text-red-400 transition"
                  >
                    Abonnement kündigen
                  </button>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
                    <p className="text-red-400 text-sm font-medium text-center">
                      Abonnement kündigen? Du verlierst sofort den Zugriff.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="py-2.5 bg-brand-card border border-brand-border text-white text-sm font-bold rounded-xl hover:bg-brand-surface transition"
                      >
                        Behalten
                      </button>
                      <button
                        onClick={handleUnsubscribe}
                        disabled={cancelling}
                        className="py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {cancelling ? (
                          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Wird gekündigt...</>
                        ) : 'Ja, kündigen'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link href={`/creator/${username}`} className="text-brand-muted text-sm hover:text-white transition">
            ← Zurück zur Seite von {creator?.displayName ?? `@${username}`}
          </Link>
        </div>

      </div>
    </div>
  )
}

