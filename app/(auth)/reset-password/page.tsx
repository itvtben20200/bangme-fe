'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { Eye, EyeOff } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

const schema = z.object({
  password: z.string().min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein'),
  confirm:  z.string().min(1, 'Bitte bestätige dein Passwort'),
}).refine((d) => d.password === d.confirm, {
  message: 'Die Passwörter stimmen nicht überein',
  path:    ['confirm'],
})
type FormInput = z.infer<typeof schema>

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token  = params.get('token') ?? ''

  const [done, setDone]             = useState(false)
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormInput>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormInput) {
    try {
      setServerError('')
      await api.post('/auth/reset-password', { token, password: data.password })
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'
      setServerError(msg)
    }
  }

  if (!token) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-4 text-center">
        <p className="text-red-400 font-semibold mb-1">Ungültiger Link</p>
        <p className="text-brand-muted text-sm">
          Diesem Link zum Zurücksetzen fehlt ein Token.{' '}
          <Link href="/forgot-password" className="text-brand-red hover:underline">Fordere einen neuen Link an</Link>.
        </p>
      </div>
    )
  }

  return done ? (
    <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-4 text-center">
      <p className="text-green-400 font-semibold mb-1">Passwort aktualisiert!</p>
      <p className="text-brand-muted text-sm">Du wirst zum Login weitergeleitet...</p>
    </div>
  ) : (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm text-brand-muted mb-1">Neues Passwort</label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-brand-red pr-10"
            placeholder="••••••••"
          />
          <button type="button" onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-sm text-brand-muted mb-1">Passwort bestätigen</label>
        <input
          {...register('confirm')}
          type="password"
          autoComplete="new-password"
          className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-brand-red"
          placeholder="••••••••"
        />
        {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm.message}</p>}
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
        {isSubmitting ? 'Wird aktualisiert...' : 'Neues Passwort setzen'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl p-8">
        <div className="text-center mb-6">
          <BrandLogo href="/" className="justify-center mb-2" imageClassName="h-7 w-auto max-w-[130px]" priority />
          <p className="text-brand-muted text-sm">Wähle ein neues Passwort</p>
        </div>

        <Suspense fallback={<p className="text-brand-muted text-sm text-center">Wird geladen...</p>}>
          <ResetPasswordForm />
        </Suspense>

        <p className="text-brand-muted text-xs text-center mt-6">
          Erinnerst du dich an dein Passwort?{' '}
          <Link href="/login" className="text-brand-red hover:underline">Einloggen</Link>
        </p>
      </div>
    </div>
  )
}
