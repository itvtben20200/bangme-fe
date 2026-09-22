'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Eye, EyeOff, Lock, Mail, MapPin, User, Users } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

type FormState = {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
  street: string
  postalCode: string
  city: string
  country: string
}

const initialForm: FormState = {
  email: '',
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  street: '',
  postalCode: '',
  city: '',
  country: '',
}

const fieldClass = 'w-full rounded-md border border-white/15 bg-black/50 px-11 py-3.5 text-sm text-white outline-none transition placeholder:text-white/38 focus:border-[#ff0618] focus:ring-2 focus:ring-[#ff0618]/20'

export default function CreatorPrelaunchRegisterPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')
    setMessage('')

    try {
      const response = await fetch('/api/prelaunch-creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setStatus('error')
        setMessage(typeof data.message === 'string' ? data.message : 'Die Anmeldung konnte nicht gespeichert werden.')
        return
      }

      setStatus('success')
      setForm(initialForm)
      setMessage('Du hast dich erfolgreich vorangemeldet. Wir benachrichtigen dich, sobald BangMe verfügbar ist.')
    } catch {
      setStatus('error')
      setMessage('Die Anmeldung konnte nicht gespeichert werden. Bitte versuche es erneut.')
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_14%,rgba(255,6,24,0.3),transparent_28%),linear-gradient(180deg,#060606,#000)] px-5 py-6 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-start justify-between gap-4">
          <BrandLogo href="/" imageClassName="h-8 sm:h-9 w-auto max-w-[150px]" priority />
          <Link href="/for-creators" className="rounded-md border border-[#ff0618] px-5 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#ff0618]">
            Zurück
          </Link>
        </header>

        <section className="grid gap-10 py-14 lg:grid-cols-[1fr_0.78fr] lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.45em] text-white/70">Sichere dir jetzt deinen Platz</p>
            <h1 className="mt-7 text-5xl font-black uppercase leading-[0.95] sm:text-6xl lg:text-7xl">
              Werde <span className="text-[#ff0618]">BangMe</span> Creator
            </h1>
            <p className="mt-5 max-w-2xl text-xl uppercase tracking-[0.24em] text-white/75">
              Von Anfang an dabei. Nur 100 Plätze.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 rounded-lg border border-white/15 bg-black/48 p-5 shadow-[0_0_70px_rgba(255,6,24,0.1)] sm:p-7">
              <h2 className="text-3xl font-black uppercase">Dein <span className="text-[#ff0618]">BangMe</span> Account</h2>

              <div className="mt-6 space-y-4">
                <label className="relative block">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/80" strokeWidth={1.6} />
                  <input className={fieldClass} type="email" autoComplete="email" placeholder="E-Mail-Adresse" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
                </label>
                <label className="relative block">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/80" strokeWidth={1.6} />
                  <input className={fieldClass} type="text" autoComplete="username" placeholder="Benutzername" value={form.username} onChange={(event) => updateField('username', event.target.value)} required minLength={3} />
                </label>
                <label className="relative block">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/80" strokeWidth={1.6} />
                  <input className="w-full rounded-md border border-white/15 bg-black/50 py-3.5 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-white/38 focus:border-[#ff0618] focus:ring-2 focus:ring-[#ff0618]/20" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Passwort" value={form.password} onChange={(event) => updateField('password', event.target.value)} required minLength={8} />
                  <button type="button" aria-label={showPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'} onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 transition hover:text-white">
                    {showPassword ? <EyeOff className="h-5 w-5" strokeWidth={1.6} /> : <Eye className="h-5 w-5" strokeWidth={1.6} />}
                  </button>
                </label>
                <p className="text-xs text-white/58">Mindestens 8 Zeichen.</p>
              </div>

              <div className="mt-7 border-t border-white/20 pt-7">
                <h2 className="text-3xl font-black uppercase">Deine <span className="text-[#ff0618]">Daten</span></h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="relative block">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/80" strokeWidth={1.6} />
                    <input className={fieldClass} type="text" autoComplete="given-name" placeholder="Vorname" value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} required />
                  </label>
                  <label className="relative block">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/80" strokeWidth={1.6} />
                    <input className={fieldClass} type="text" autoComplete="family-name" placeholder="Nachname" value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} required />
                  </label>
                  <label className="relative block sm:col-span-2">
                    <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/80" strokeWidth={1.6} />
                    <input className={fieldClass} type="text" autoComplete="street-address" placeholder="Straße / Hausnummer" value={form.street} onChange={(event) => updateField('street', event.target.value)} required />
                  </label>
                  <label className="relative block">
                    <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/80" strokeWidth={1.6} />
                    <input className={fieldClass} type="text" autoComplete="postal-code" placeholder="PLZ" value={form.postalCode} onChange={(event) => updateField('postalCode', event.target.value)} required />
                  </label>
                  <label className="relative block">
                    <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/80" strokeWidth={1.6} />
                    <input className={fieldClass} type="text" autoComplete="address-level2" placeholder="Stadt" value={form.city} onChange={(event) => updateField('city', event.target.value)} required />
                  </label>
                  <label className="relative block sm:col-span-2">
                    <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/80" strokeWidth={1.6} />
                    <input className={fieldClass} type="text" autoComplete="country-name" placeholder="Land" value={form.country} onChange={(event) => updateField('country', event.target.value)} required />
                  </label>
                </div>
              </div>

              {message && (
                <div className={status === 'success' ? 'mt-6 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100' : 'mt-6 rounded-md border border-[#ff0618]/50 bg-[#ff0618]/10 px-4 py-3 text-sm text-red-100'}>
                  {message}
                </div>
              )}

              <button type="submit" disabled={status === 'submitting'} className="mt-7 w-full rounded-full bg-[#ff0618] px-8 py-5 text-xl font-black uppercase text-white shadow-[0_0_40px_rgba(255,6,24,0.3)] transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70">
                {status === 'submitting' ? 'Wird gespeichert...' : 'Absenden'}
              </button>
              <p className="mt-4 text-center text-xs text-white/58">Deine Daten werden sicher gespeichert und vertraulich behandelt.</p>
            </form>
          </div>

          <aside className="space-y-5 lg:pt-32">
            <img
              src="/images/cards.png"
              alt="BangMe Founding Creator Card"
              className="w-full rounded-lg object-contain"
            />

            <div className="rounded-lg border border-white/15 bg-black/45 p-6">
              <h2 className="text-3xl font-black uppercase leading-none">Deine exklusive <span className="text-[#ff0618]">Founder Card</span></h2>
              <p className="mt-4 text-white/75">Eine limitierte, nummerierte Karte für die ersten 100 BangMe Creator.</p>
              <ul className="mt-6 space-y-5">
                {['Founding Creator Status', 'Limitierte Founder Card', 'Einladungen zu Events', 'Besondere Founder-Aktionen', 'Mehr Möglichkeiten'].map((item) => (
                  <li key={item} className="flex items-center gap-4 text-sm font-semibold text-white/86">
                    <CheckCircle2 className="h-6 w-6 text-[#ff0618]" strokeWidth={1.8} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-white/15 bg-black/45 p-6">
              <div className="flex gap-4">
                <Users className="h-10 w-10 shrink-0 text-[#ff0618]" strokeWidth={1.8} />
                <div>
                  <h2 className="text-xl font-black uppercase">Wir halten dich auf dem Laufenden</h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">Sobald BangMe verfügbar ist, erhältst du eine Benachrichtigung per E-Mail.</p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}