'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setErrorMsg('No verification token found.')
      setStatus('error')
      return
    }

    api.post('/auth/verify-email', { token })
      .then(({ data }) => {
        const { user, accessToken } = data.data
        useAuthStore.setState({ user, accessToken, isAuthenticated: true })
        setStatus('success')
        const dest = user.role === 'creator' ? '/creator-center' : '/home'
        setTimeout(() => router.replace(dest), 2000)
      })
      .catch((err) => {
        const msg = err?.response?.data?.message ?? 'Verification failed. The link may have expired.'
        setErrorMsg(msg)
        setStatus('error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl p-8 text-center">
        {status === 'verifying' && (
          <>
            <Loader2 size={48} className="text-brand-red animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Verifying your email…</h1>
            <p className="text-brand-muted text-sm">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Email verified!</h1>
            <p className="text-brand-muted text-sm">Your account is active. Redirecting you now…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} className="text-brand-red mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Verification failed</h1>
            <p className="text-brand-muted text-sm mb-6">{errorMsg}</p>
            <a
              href="/verify-email-sent"
              className="inline-block bg-brand-red hover:bg-red-600 text-white font-semibold py-2.5 px-6 rounded-lg transition text-sm"
            >
              Request a new link
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
