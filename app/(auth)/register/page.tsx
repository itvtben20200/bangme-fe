'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore, type Role } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

const registerSchema = z.object({
  username:    z.string().min(3, 'Mindestens 3 Zeichen').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Nur Buchstaben, Zahlen und Unterstriche'),
  email:       z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
  password:    z.string().min(8, 'Mindestens 8 Zeichen'),
  confirm:     z.string(),
  dateOfBirth: z.string().min(1, 'Geburtsdatum ist erforderlich').refine(val => {
    const dob = new Date(val)
    if (isNaN(dob.getTime())) return false
    const today = new Date()
    const age = today.getFullYear() - dob.getFullYear()
      - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0)
    return age >= 18
  }, 'Du musst mindestens 18 Jahre alt sein'),
  terms:       z.literal(true, { errorMap: () => ({ message: 'Du musst die Bedingungen akzeptieren' }) }),
}).refine(d => d.password === d.confirm, { message: 'Die Passwörter stimmen nicht überein', path: ['confirm'] })

type RegisterInput = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register: registerUser } = useAuthStore()
  const router = useRouter()
  const selectedRole: Role = 'user'
  const [showPassword, setShowPassword]   = useState(false)
  const [serverError, setServerError]     = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterInput) {
    try {
      setServerError('')
      const result = await registerUser(data.username, data.email, data.password, selectedRole, undefined, data.dateOfBirth)
      const params = new URLSearchParams({ email: data.email })
      if (result?.devVerifyUrl) params.set('devVerifyUrl', result.devVerifyUrl)
      router.push(`/verify-email-sent?${params.toString()}`)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Die Registrierung ist fehlgeschlagen.'
      setServerError(msg)
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-brand-surface border border-brand-border rounded-2xl p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <BrandLogo href="/" className="justify-center mb-2" imageClassName="h-7 w-auto max-w-[130px]" priority />
          <p className="text-brand-muted text-sm">Erstelle deinen Account</p>
        </div>



        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-brand-muted mb-1">Benutzername</label>
            <input {...register('username')} type="text" autoComplete="username"
              className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-brand-red"
              placeholder="@deinname" />
            {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-brand-muted mb-1">E-Mail</label>
            <input {...register('email')} type="email" autoComplete="email"
              className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-brand-red"
              placeholder="du@example.com" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-brand-muted mb-1">Geburtsdatum</label>
            <input {...register('dateOfBirth')} type="date" autoComplete="bday"
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-brand-red" />
            {errors.dateOfBirth && <p className="text-red-400 text-xs mt-1">{errors.dateOfBirth.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-brand-muted mb-1">Passwort</label>
            <div className="relative">
              <input {...register('password')} type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-brand-red pr-10"
                placeholder="Mind. 8 Zeichen" />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-brand-muted mb-1">Passwort bestätigen</label>
            <input {...register('confirm')} type="password" autoComplete="new-password"
              className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-brand-red"
              placeholder="Passwort wiederholen" />
            {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm.message}</p>}
          </div>

          <label className="flex items-start gap-2 text-sm text-brand-muted cursor-pointer">
            <input {...register('terms')} type="checkbox" className="mt-0.5 rounded" />
            <span>Ich stimme den{' '}
              <Link href="/terms-of-service" className="text-brand-red hover:underline">Nutzungsbedingungen</Link>
              {' '}und der{' '}
              <Link href="/privacy-policy" className="text-brand-red hover:underline">Datenschutzerklärung</Link>
            </span>
          </label>
          {errors.terms && <p className="text-red-400 text-xs">{errors.terms.message}</p>}

          {serverError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <p className="text-red-400 text-sm">{serverError}</p>
            </div>
          )}

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-brand-red text-white font-bold py-3 rounded-lg hover:bg-red-600 transition disabled:opacity-50">
            {isSubmitting ? 'Account wird erstellt...' : 'Account erstellen'}
          </button>
        </form>

        <p className="text-brand-muted text-sm text-center mt-6">
          Hast du schon einen Account?{' '}
          <Link href="/login" className="text-brand-red hover:underline">Einloggen</Link>
        </p>
      </div>
    </div>
  )
}

