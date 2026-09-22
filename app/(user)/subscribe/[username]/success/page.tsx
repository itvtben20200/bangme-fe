'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

export default function SubscribeSuccessPage() {
  const { username }   = useParams<{ username: string }>()
  const searchParams   = useSearchParams()
  const sessionId      = searchParams.get('session_id')
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Small delay so the webhook has time to process
    const t = setTimeout(() => setDone(true), 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">

        {!done ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
            <p className="text-brand-muted">Confirming your subscription…</p>
          </div>
        ) : (
          <div className="bg-brand-surface border border-brand-border rounded-3xl p-10">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-black mb-3">You&apos;re subscribed!</h1>
            <p className="text-brand-text mb-8">
              Welcome! You now have full access to <span className="text-white font-bold">@{username}</span>&apos;s exclusive content.
            </p>

            <div className="space-y-3">
              <Link
                href={`/creator/${username}`}
                className="block w-full py-4 bg-brand-red text-white font-black text-lg rounded-xl hover:bg-red-600 transition"
              >
                Go to Creator Page →
              </Link>
              <Link
                href="/home"
                className="block w-full py-4 bg-brand-card border border-brand-border text-white font-bold rounded-xl hover:bg-brand-surface transition"
              >
                Back to Feed
              </Link>
            </div>

            <p className="text-brand-muted text-xs mt-6">
              {sessionId
                ? <>Receipt confirmation ID: <span className="font-mono text-brand-text">{sessionId.slice(0, 20)}…</span></>
                : <>Paid with BangCoins · Expires in 30 days</>
              }
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
