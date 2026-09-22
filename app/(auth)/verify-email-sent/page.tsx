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

        <h1 className="text-xl font-bold text-white mb-2">Prüfe deine E-Mail</h1>
        <p className="text-brand-muted text-sm mb-6">
          Wir haben einen Bestätigungslink an{' '}
          {email && <span className="text-white font-medium">{email}</span>}.
          {' '}gesendet. Klicke auf den Link, um deinen Account zu aktivieren.
        </p>

        {/* DEV ONLY: show the verification link inline */}
        {devVerifyUrl && (
          <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-left">
            <p className="text-yellow-400 text-xs font-semibold mb-1">DEV - Bestätigungslink:</p>
            <a
              href={devVerifyUrl}
              className="text-yellow-300 text-xs break-all hover:underline"
            >
              {devVerifyUrl}
            </a>
          </div>
        )}

        <p className="text-brand-muted text-xs mb-4">
          Nichts erhalten? Prüfe deinen Spam-Ordner oder sende den Link erneut.
        </p>

        {status === 'sent' ? (
          <p className="text-green-400 text-sm font-medium">Ein neuer Link wurde gesendet!</p>
        ) : status === 'error' ? (
          <p className="text-brand-red text-sm">Etwas ist schiefgelaufen. Bitte versuche es erneut.</p>
        ) : (
          <button
            onClick={handleResend}
            disabled={status === 'sending' || !email}
            className="w-full bg-brand-red hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition text-sm"
          >
            {status === 'sending' ? 'Wird gesendet...' : 'Bestätigungs-E-Mail erneut senden'}
          </button>
        )}

        <div className="mt-4 p-3 bg-brand-card border border-brand-border rounded-lg text-left">
          <p className="text-xs text-brand-muted">
            <span className="text-white font-medium">Die Registrierung ist kostenlos.</span>{' '}
            Zahlungsdaten kannst du nach dem Login jederzeit unter{' '}
            <span className="text-brand-red">Einstellungen {'->'} Abrechnung</span> hinzufügen.
          </p>
        </div>

        <div className="mt-6 text-sm text-brand-muted">
          Bereits bestätigt?{' '}
          <Link href="/login" className="text-brand-red hover:underline">
            Einloggen
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
