'use client'
import { useState }     from 'react'
import { useForm }       from 'react-hook-form'
import { zodResolver }   from '@hookform/resolvers/zod'
import { z }             from 'zod'
import { useAuthStore }  from '@/store/authStore'
import { useRouter }     from 'next/navigation'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type LoginInput = z.infer<typeof schema>

export default function AdminLoginPage() {
  const { login, user } = useAuthStore()
  const router          = useRouter()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: LoginInput) {
    try {
      setServerError('')
      await login(data.email, data.password)
      const role = useAuthStore.getState().user?.role
      if (role !== 'admin') {
        useAuthStore.getState().logout()
        setServerError('Access denied. This portal is for admin accounts only.')
        return
      }
      router.push('/admin/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Login failed.'
      setServerError(msg)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 mb-4">
            <ShieldCheck size={30} className="text-purple-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1">Admin Portal</h1>
          <p className="text-gray-500 text-sm">Restricted access — authorised personnel only</p>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-purple-500"
                placeholder="admin@example.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-purple-500 pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                <p className="text-red-400 text-sm">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {isSubmitting ? 'Verifying…' : 'Sign In to Admin Portal'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Not an admin?{' '}
          <a href="/login" className="text-gray-500 hover:text-white transition">
            Go to user login →
          </a>
        </p>
      </div>
    </div>
  )
}
