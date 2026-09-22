'use client'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { TERMS_SECTIONS, PRIVACY_SECTIONS } from '@/lib/legal-content'
import { useAuthStore } from '@/store/authStore'

const STORAGE_KEY = 'age_verified'
const ANONYMOUS_CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000
const AUTHENTICATED_CONFIRMATION_TTL_MS = 30 * 24 * 60 * 60 * 1000

type LegalDoc = 'terms' | 'privacy' | null

function hasFreshAgeConfirmation(isAuthenticated: boolean): boolean {
  const confirmedAt = Number(localStorage.getItem(STORAGE_KEY))
  if (!Number.isFinite(confirmedAt) || confirmedAt <= 0) return false

  const ttl = isAuthenticated ? AUTHENTICATED_CONFIRMATION_TTL_MS : ANONYMOUS_CONFIRMATION_TTL_MS
  return Date.now() - confirmedAt < ttl
}

export function AgeVerificationModal() {
  const [visible, setVisible] = useState(false)
  const [legalOpen, setLegalOpen] = useState<LegalDoc>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    setVisible(!hasFreshAgeConfirmation(isAuthenticated))
  }, [isAuthenticated])

  useEffect(() => {
    if (legalOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [legalOpen])

  function handleConfirm() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setVisible(false)
  }

  function handleDecline() {
    window.location.href = 'https://www.google.com'
  }

  if (!visible) return null

  const sections = legalOpen === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS
  const legalTitle = legalOpen === 'terms' ? 'Terms of Service' : 'Privacy Policy'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">

      {/* ── Age verification card ── */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <div className="text-4xl mb-4">🔞</div>
        <h2 className="text-2xl font-bold text-white mb-2">Age Verification</h2>
        <p className="text-brand-muted text-sm mb-6">
          This website contains adult content intended for individuals aged{' '}
          <span className="text-white font-semibold">18 years or older</span>.
          Please confirm your age to continue.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            className="w-full py-3 rounded-xl bg-brand-red text-white font-semibold hover:opacity-90 transition-opacity"
          >
            I am 18 or older - Enter
          </button>
          <button
            onClick={handleDecline}
            className="w-full py-3 rounded-xl bg-brand-border text-brand-muted font-semibold hover:text-white transition-colors"
          >
            Exit
          </button>
        </div>
        <p className="text-brand-muted text-xs mt-4">
          By entering you agree to our{' '}
          <button
            onClick={() => setLegalOpen('terms')}
            className="text-brand-red hover:underline cursor-pointer"
          >
            Terms of Service
          </button>{' '}
          and{' '}
          <button
            onClick={() => setLegalOpen('privacy')}
            className="text-brand-red hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>.
        </p>
      </div>

      {/* ── Legal content reader (slides in on top) ── */}
      {legalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
          <div className="bg-brand-dark border border-brand-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
              <h3 className="text-white font-bold text-lg">{legalTitle}</h3>
              <button
                onClick={() => setLegalOpen(null)}
                className="text-brand-muted hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable body */}
            <div ref={scrollRef} className="overflow-y-auto px-6 py-5 space-y-6 flex-1">
              {sections.map((s) => (
                <div key={s.title}>
                  <h4 className="text-white font-semibold text-sm mb-1">{s.title}</h4>
                  <p className="text-brand-muted text-xs leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-brand-border shrink-0">
              <button
                onClick={() => setLegalOpen(null)}
                className="w-full py-2.5 rounded-xl bg-brand-red text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Close &amp; Return to Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
