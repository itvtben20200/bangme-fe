'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})
type LoginInput = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, user } = useAuthStore()
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    try {
      setServerError('')
      await login(data.identifier, data.password)
      const role = useAuthStore.getState().user?.role
      if (role === 'admin') {
        // Admin accounts must use the admin portal
        useAuthStore.getState().logout()
        setServerError('Admin accounts must sign in at /admin/login')
        return
      }
      if (role === 'creator') router.push('/creator-center')
      else                    router.push('/home')
    } catch (err: any) {
      const apiMsg: string = err?.response?.data?.message ?? err?.message ?? ''
      const isUnverified = apiMsg.toLowerCase().includes('verify your email')
      if (isUnverified) {
        const identifier: string = (data as any).identifier ?? ''
        const params = new URLSearchParams()
        if (identifier.includes('@')) params.set('email', identifier)
        const devVerifyUrl = err?.response?.data?.devVerifyUrl
        if (devVerifyUrl) params.set('devVerifyUrl', devVerifyUrl)
        router.push(`/verify-email-sent?${params.toString()}`)
        return
      }
      setServerError(apiMsg || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl p-8">
        <div className="text-center mb-6">
          <div className="text-2xl font-black mb-1">
            <span className="text-white">BANG</span><span className="text-brand-red">ME</span>
          </div>
          <p className="text-brand-muted text-sm">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-brand-muted mb-1">Email or Username</label>
            <input
              {...register('identifier')}
              type="text"
              autoComplete="username"
              className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-brand-red"
              placeholder="you@example.com or @username"
            />
            {errors.identifier && <p className="text-red-400 text-xs mt-1">{errors.identifier.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-brand-muted mb-1">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
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

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-brand-muted cursor-pointer">
              <input {...register('remember')} type="checkbox" className="rounded" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-sm text-brand-red hover:underline">
              Forgot Password?
            </Link>
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
            {isSubmitting ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="text-brand-muted text-sm text-center mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="text-brand-red hover:underline">Register now</Link>
        </p>
        <p className="text-gray-600 text-xs text-center mt-3">
          Platform admin?{' '}
          <Link href="/admin/login" className="text-gray-500 hover:text-white transition">Admin portal →</Link>
        </p>
      </div>
    </div>
  )
}

