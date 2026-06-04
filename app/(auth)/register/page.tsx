'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore, type Role } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

const registerSchema = z.object({
  username:    z.string().min(3, 'Min 3 characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only'),
  email:       z.string().email('Enter a valid email'),
  password:    z.string().min(8, 'At least 8 characters'),
  confirm:     z.string(),
  terms:       z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

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
      const result = await registerUser(data.username, data.email, data.password, selectedRole)
      const params = new URLSearchParams({ email: data.email })
      if (result?.devVerifyUrl) params.set('devVerifyUrl', result.devVerifyUrl)
      router.push(`/verify-email-sent?${params.toString()}`)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Registration failed.'
      setServerError(msg)
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-brand-surface border border-brand-border rounded-2xl p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-2xl font-black mb-1">
            <span className="text-white">BANG</span><span className="text-brand-red">ME</span>
          </div>
          <p className="text-brand-muted text-sm">Create your account</p>
        </div>



        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-brand-muted mb-1">Username</label>
            <input {...register('username')} type="text" autoComplete="username"
              className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-brand-red"
              placeholder="@yourhandle" />
            {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-brand-muted mb-1">Email</label>
            <input {...register('email')} type="email" autoComplete="email"
              className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-brand-red"
              placeholder="you@example.com" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-brand-muted mb-1">Password</label>
            <div className="relative">
              <input {...register('password')} type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-brand-red pr-10"
                placeholder="Min. 8 characters" />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-brand-muted mb-1">Confirm Password</label>
            <input {...register('confirm')} type="password" autoComplete="new-password"
              className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-brand-red"
              placeholder="Repeat password" />
            {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm.message}</p>}
          </div>

          <label className="flex items-start gap-2 text-sm text-brand-muted cursor-pointer">
            <input {...register('terms')} type="checkbox" className="mt-0.5 rounded" />
            <span>I agree to the{' '}
              <Link href="/terms" className="text-brand-red hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-brand-red hover:underline">Privacy Policy</Link>
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
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-brand-muted text-sm text-center mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-red hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}

