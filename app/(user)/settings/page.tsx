'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Camera, Save }                from 'lucide-react'
import { useForm }                               from 'react-hook-form'
import { zodResolver }                           from '@hookform/resolvers/zod'
import { z }                                     from 'zod'
import { toast }                                 from 'sonner'
import { useRouter }                             from 'next/navigation'
import api                                       from '@/lib/api'
import { mediaUrl }                              from '@/lib/utils'
import { useAuthStore }                          from '@/store/authStore'
import type { User }                             from '@/types'

const settingsSchema = z.object({
  displayName: z.string().min(1).max(50),
  bio:         z.string().max(500).optional(),
  email:       z.string().email(),
})
type SettingsForm = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  const { data } = useQuery<{ success: boolean; data: User }>({
    queryKey: ['me'],
    queryFn:  () => api.get('/auth/me').then((r) => r.data),
  })

  const profile = data?.data

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsForm>({
    resolver:      zodResolver(settingsSchema),
    defaultValues: { displayName: profile?.displayName ?? '', bio: profile?.bio ?? '', email: profile?.email ?? '' },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (values: SettingsForm) => api.patch('/users/me', values),
    onSuccess:  () => { toast.success('Profile updated'); qc.invalidateQueries({ queryKey: ['me'] }) },
    onError:    () => toast.error('Update failed'),
  })

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={24} className="text-[#ff4757]" />
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      {/* Avatar */}
      <div className="bg-[#161616] rounded-2xl p-6 mb-6 border border-[#222]">
        <h2 className="text-white font-semibold mb-4">Profile Picture</h2>
        <div className="flex items-center gap-4">
          {profile?.avatarKey ? (
            <img
              src={mediaUrl(profile.avatarKey)!}
              alt="avatar"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#ff4757]/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-[#ff4757]">
                {user?.username?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <button className="flex items-center gap-2 bg-[#222] hover:bg-[#333] text-white text-sm px-4 py-2 rounded-lg transition">
            <Camera size={14} /> Change Photo
          </button>
        </div>
      </div>

      {/* Profile form */}
      <form
        onSubmit={handleSubmit((v) => mutate(v))}
        className="bg-[#161616] rounded-2xl p-6 mb-6 border border-[#222] space-y-4"
      >
        <h2 className="text-white font-semibold">Profile Info</h2>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Display Name</label>
          <input
            {...register('displayName')}
            className="w-full bg-[#222] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4757]"
          />
          {errors.displayName && <p className="text-red-400 text-xs mt-1">{errors.displayName.message}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full bg-[#222] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4757]"
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Bio</label>
          <textarea
            {...register('bio')}
            rows={3}
            className="w-full bg-[#222] text-white px-4 py-2.5 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#ff4757]"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-[#ff4757] hover:bg-red-500 text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50"
        >
          <Save size={16} />
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* Danger zone */}
      <div className="bg-[#161616] rounded-2xl p-6 border border-red-900/30">
        <h2 className="text-red-400 font-semibold mb-4">Danger Zone</h2>
        <button
          onClick={handleLogout}
          className="text-sm text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-500 px-4 py-2 rounded-lg transition"
        >
          Log out of all devices
        </button>
      </div>
    </div>
  )
}
