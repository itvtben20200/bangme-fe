'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { ArrowLeft } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

const schema = z.object({
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
})
type FormInput = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormInput>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormInput) {
    try {
      setServerError('')
      await api.post('/auth/forgot-password', { email: data.email })
      setSent(true)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'
      setServerError(msg)
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl p-8">
        <Link href="/login" className="flex items-center gap-2 text-brand-muted hover:text-white text-sm mb-6 transition">
          <ArrowLeft size={16} /> Zurück zum Login
        </Link>

        <div className="text-center mb-6">
          <BrandLogo href="/" className="justify-center mb-2" imageClassName="h-7 w-auto max-w-[130px]" priority />
          <p className="text-brand-muted text-sm">Setze dein Passwort zurück</p>
        </div>

        {sent ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-4 text-center">
            <p className="text-green-400 font-semibold mb-1">Prüfe dein Postfach</p>
            <p className="text-brand-muted text-sm">
              Falls diese E-Mail registriert ist, erhältst du in Kürze einen Link zum Zurücksetzen.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-brand-muted text-sm">
              Gib die E-Mail-Adresse deines Accounts ein und wir senden dir einen Link zum Zurücksetzen.
            </p>

            <div>
              <label className="block text-sm text-brand-muted mb-1">E-Mail</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-brand-red"
                placeholder="du@example.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {serverError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                <p className="text-red-400 text-sm">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-red text-white font-bold py-3 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Wird gesendet...' : 'Link zum Zurücksetzen senden'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
