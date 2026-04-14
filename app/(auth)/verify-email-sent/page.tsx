'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail } from 'lucide-react'
import api from '@/lib/api'

function VerifyEmailSentContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(
    searchParams.get('devVerifyUrl')
  )

  async function handleResend() {
    if (!email || status === 'sending') return
    setStatus('sending')
    try {
      const { data } = await api.post('/auth/resend-verification', { email })
      if (data?.devVerifyUrl) setDevVerifyUrl(data.devVerifyUrl)
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-brand-red/10 flex items-center justify-center">
            <Mail size={32} className="text-brand-red" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
        <p className="text-brand-muted text-sm mb-6">
          We sent a verification link to{' '}
          {email && <span className="text-white font-medium">{email}</span>}.
          {' '}Click the link to activate your account.
        </p>

        {/* DEV ONLY: show the verification link inline */}
        {devVerifyUrl && (
          <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-left">
            <p className="text-yellow-400 text-xs font-semibold mb-1">⚡ DEV — Verification link:</p>
            <a
              href={devVerifyUrl}
              className="text-yellow-300 text-xs break-all hover:underline"
            >
              {devVerifyUrl}
            </a>
          </div>
        )}

        <p className="text-brand-muted text-xs mb-4">
          Didn&apos;t receive it? Check your spam folder or resend below.
        </p>

        {status === 'sent' ? (
          <p className="text-green-400 text-sm font-medium">A new link has been sent!</p>
        ) : status === 'error' ? (
          <p className="text-brand-red text-sm">Something went wrong. Please try again.</p>
        ) : (
          <button
            onClick={handleResend}
            disabled={status === 'sending' || !email}
            className="w-full bg-brand-red hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition text-sm"
          >
            {status === 'sending' ? 'Sending…' : 'Resend verification email'}
          </button>
        )}

        <div className="mt-6 text-sm text-brand-muted">
          Already verified?{' '}
          <Link href="/login" className="text-brand-red hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailSentPage() {
  return (
    <Suspense>
      <VerifyEmailSentContent />
    </Suspense>
  )
}
