'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Lock, CreditCard, Check, AlertCircle } from 'lucide-react'

interface Package {
  coins: number
  price: number
}

interface StripeCheckoutModalProps {
  pkg: Package
  onClose: () => void
  onConfirm: (coins: number) => Promise<{ success: boolean; bypassedStripe?: boolean }>
}

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown'
type ModalState = 'form' | 'processing' | 'success' | 'error'

function detectBrand(number: string): CardBrand {
  const n = number.replace(/\s/g, '')
  if (/^4/.test(n)) return 'visa'
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  if (/^6(?:011|5)/.test(n)) return 'discover'
  return 'unknown'
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)} / ${digits.slice(2)}`
  if (digits.length === 2 && value.endsWith('/')) return `${digits} / `
  return digits
}

function CardBrandIcon({ brand }: { brand: CardBrand }) {
  if (brand === 'visa') {
    return (
      <div className="flex items-center justify-center w-10 h-6 rounded bg-white">
        <span className="text-[#1a1f71] font-black text-sm italic tracking-tight">VISA</span>
      </div>
    )
  }
  if (brand === 'mastercard') {
    return (
      <div className="flex items-center justify-center w-10 h-6 rounded">
        <div className="flex -space-x-2">
          <div className="w-5 h-5 rounded-full bg-[#EB001B] opacity-90" />
          <div className="w-5 h-5 rounded-full bg-[#F79E1B] opacity-90" />
        </div>
      </div>
    )
  }
  if (brand === 'amex') {
    return (
      <div className="flex items-center justify-center w-10 h-6 rounded bg-[#016FD0]">
        <span className="text-white font-black text-[10px] tracking-tight">AMEX</span>
      </div>
    )
  }
  if (brand === 'discover') {
    return (
      <div className="flex items-center justify-center w-10 h-6 rounded bg-white">
        <span className="text-[#e65c1c] font-black text-[9px] tracking-tight">DISCOVER</span>
      </div>
    )
  }
  return <CreditCard size={20} className="text-gray-400" />
}

export function StripeCheckoutModal({ pkg, onClose, onConfirm }: StripeCheckoutModalProps) {
  const [modalState, setModalState] = useState<ModalState>('form')
  const [errorMsg, setErrorMsg] = useState('')

  // Form fields
  const [email, setEmail] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [cardName, setCardName] = useState('')

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const cardBrand = detectBrand(cardNumber)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Gültige E-Mail erforderlich'
    const rawCard = cardNumber.replace(/\s/g, '')
    if (rawCard.length < 15) errors.cardNumber = 'Gib eine gültige Kartennummer ein'
    const expiryDigits = expiry.replace(/\D/g, '')
    if (expiryDigits.length < 4) errors.expiry = 'MM / JJ erforderlich'
    const [mm] = [parseInt(expiryDigits.slice(0, 2))]
    if (mm < 1 || mm > 12) errors.expiry = 'Ungültiger Monat'
    const cvcMin = cardBrand === 'amex' ? 4 : 3
    if (cvc.length < cvcMin) errors.cvc = `${cvcMin} Ziffern erforderlich`
    if (!cardName.trim()) errors.cardName = 'Name erforderlich'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setModalState('processing')
    setErrorMsg('')

    try {
      const result = await onConfirm(pkg.coins)
      if (result.success) {
        setModalState('success')
      } else {
        setErrorMsg('Zahlung fehlgeschlagen. Bitte versuche es erneut.')
        setModalState('error')
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Zahlung fehlgeschlagen. Bitte versuche es erneut.')
      setModalState('error')
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="w-full max-w-md bg-[#0d0d0d] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            {/* Stripe-style logo */}
            <div className="w-8 h-8 rounded-lg bg-[#635bff] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
              </svg>
            </div>
            <span className="text-white font-bold text-base">BangMe Pay</span>
          </div>
          {modalState === 'form' && (
            <button onClick={onClose} className="text-gray-500 hover:text-white transition rounded-full p-1 hover:bg-white/10">
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── Order Summary ── */}
        <div className="px-6 py-4 bg-[#111] border-b border-white/8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-xl">
                🪙
              </div>
              <div>
                <p className="text-white font-semibold">{pkg.coins} BangCoins</p>
                <p className="text-gray-400 text-xs">Einmaliger Kauf · sofort verfügbar</p>
              </div>
            </div>
            <p className="text-white font-black text-xl">${pkg.price}<span className="text-gray-400 text-sm font-normal"> USD</span></p>
          </div>
        </div>

        {/* ── Processing ── */}
        {modalState === 'processing' && (
          <div className="px-6 py-14 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-[#635bff]/30 border-t-[#635bff] animate-spin" />
            <p className="text-white font-semibold">Zahlung wird verarbeitet...</p>
            <p className="text-gray-400 text-sm text-center">Bitte warte und schließe dieses Fenster nicht.</p>
          </div>
        )}

        {/* ── Success ── */}
        {modalState === 'success' && (
          <div className="px-6 py-14 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
              <Check size={32} className="text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">Zahlung erfolgreich!</p>
              <p className="text-gray-400 text-sm mt-1">{pkg.coins} BangCoins wurden deinem Wallet hinzugefügt.</p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-8 py-2.5 bg-[#635bff] hover:bg-[#5249e0] text-white font-bold rounded-lg transition"
            >
              Fertig
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {modalState === 'error' && (
          <div className="px-6 py-10 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold">Zahlung fehlgeschlagen</p>
              <p className="text-gray-400 text-sm mt-1">{errorMsg}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-5 py-2 rounded-lg border border-white/15 text-gray-300 hover:bg-white/5 transition text-sm">Abbrechen</button>
              <button onClick={() => setModalState('form')} className="px-5 py-2 rounded-lg bg-[#635bff] hover:bg-[#5249e0] text-white font-bold transition text-sm">Erneut versuchen</button>
            </div>
          </div>
        )}

        {/* ── Form ── */}
        {modalState === 'form' && (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="du@example.com"
                className={`w-full bg-[#1a1a1a] border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#635bff] transition ${fieldErrors.email ? 'border-red-500' : 'border-white/15'}`}
              />
              {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Card info box */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Kartendaten</label>
              <div className={`rounded-lg border overflow-hidden ${fieldErrors.cardNumber || fieldErrors.expiry || fieldErrors.cvc ? 'border-red-500' : 'border-white/15'}`}>
                {/* Card number row */}
                <div className="flex items-center bg-[#1a1a1a] px-4 py-2.5 border-b border-white/10">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 1234 1234 1234"
                    maxLength={19}
                    className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
                  />
                  <div className="ml-2 flex-shrink-0">
                    <CardBrandIcon brand={cardBrand} />
                  </div>
                </div>
                {/* Expiry + CVC row */}
                <div className="flex">
                  <div className="flex-1 flex items-center bg-[#1a1a1a] px-4 py-2.5 border-r border-white/10">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM / YY"
                      maxLength={7}
                      className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 flex items-center bg-[#1a1a1a] px-4 py-2.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder={cardBrand === 'amex' ? '4-stellige CVC' : 'CVC'}
                      maxLength={4}
                      className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
                    />
                    <svg className="w-6 h-6 text-gray-500 ml-2 flex-shrink-0" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0.5" y="0.5" width="37" height="23" rx="3.5" fill="#1a1a1a" stroke="currentColor" strokeOpacity="0.3"/>
                      <rect y="6" width="38" height="6" fill="currentColor" fillOpacity="0.3"/>
                      <rect x="21" y="14" width="12" height="4" rx="1" fill="currentColor" fillOpacity="0.5"/>
                    </svg>
                  </div>
                </div>
              </div>
              {(fieldErrors.cardNumber || fieldErrors.expiry || fieldErrors.cvc) && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.cardNumber || fieldErrors.expiry || fieldErrors.cvc}</p>
              )}
            </div>

            {/* Name on card */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Name auf der Karte</label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Vollständiger Name"
                className={`w-full bg-[#1a1a1a] border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#635bff] transition ${fieldErrors.cardName ? 'border-red-500' : 'border-white/15'}`}
              />
              {fieldErrors.cardName && <p className="text-red-400 text-xs mt-1">{fieldErrors.cardName}</p>}
            </div>

            {/* Test card hint */}
            <div className="p-3 bg-[#635bff]/10 border border-[#635bff]/25 rounded-lg">
              <p className="text-[#a29fff] text-xs font-semibold mb-1.5">Testkarte (Dev-Modus)</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-gray-400">Karte: <span className="text-white font-mono">4242 4242 4242 4242</span></span>
                <span className="text-gray-400">Ablauf: <span className="text-white font-mono">12 / 34</span></span>
                <span className="text-gray-400">CVC: <span className="text-white font-mono">123</span></span>
                <span className="text-gray-400">ZIP: <span className="text-white font-mono">12345</span></span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-[#635bff] hover:bg-[#5249e0] text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 text-sm"
            >
              <Lock size={15} />
              ${pkg.price} zahlen · {pkg.coins} BangCoins erhalten
            </button>

            {/* Footer */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <svg className="w-9 h-auto text-[#635bff]" viewBox="0 0 60 25" fill="currentColor">
                <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a14.21 14.21 0 0 1-4.55.74c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.07 1.84zm-5.88-5.15c-1.03 0-2.14.73-2.14 2.58h4.2c0-1.85-1.07-2.58-2.06-2.58zM40.95 20.44c-1.14 0-1.86-.49-2.27-1.12l-.09 1h-3.32V.1l3.77-.8.01 5.21c.37-.47 1.18-.86 2.29-.86 2.71 0 5.18 2.18 5.18 7.64 0 5.39-2.48 7.15-5.57 7.15zM40 17.03c1.16 0 1.97-.83 1.97-3.77 0-2.91-.81-3.74-1.97-3.74-1.14 0-1.96.84-1.96 3.74 0 2.94.82 3.77 1.96 3.77zM28.24 5.1l3.78-.81V20h-3.78V5.1zm0-4.01L32.02 0v3.06l-3.78.81V1.09zM21.29 6.43h.09l.23-1.12h3.32V20h-3.77v-9.69c-.55.74-1.58 1.24-2.93 1.24-2.68 0-5.15-2.2-5.15-7.64C13.08 2.55 15.55.8 18.64.8c1.11 0 1.92.39 2.29.86l.01 4.77h.35zm-1.62 10.6c1.16 0 1.97-.83 1.97-3.77 0-2.91-.81-3.74-1.97-3.74-1.14 0-1.96.84-1.96 3.74 0 2.94.82 3.77 1.96 3.77zM6.22 12.6c0 1.29.96 1.86 2.06 1.86.77 0 1.37-.19 1.97-.44v3.1c-.74.4-1.72.69-3.07.69C3.7 17.81 2 16.12 2 12.6V2.88h4.22V12.6z"/>
              </svg>
              <p className="text-gray-500 text-xs">Zahlungen gesichert durch Stripe</p>
              <Lock size={11} className="text-gray-500" />
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
