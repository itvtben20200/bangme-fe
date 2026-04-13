'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm }       from 'react-hook-form'
import { zodResolver }   from '@hookform/resolvers/zod'
import { z }             from 'zod'
import { toast }         from 'sonner'
import { Camera, Save, Star, Users, BookMarked, LogOut } from 'lucide-react'
import api               from '@/lib/api'
import { useAuthStore }  from '@/store/authStore'
import Link              from 'next/link'

const profileSchema = z.object({
  displayName: z.string().min(1, 'Required').max(50),
  bio:         z.string().max(500).optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

interface MyProfile {
  id:          string
  username:    string
  email:       string
  displayName: string | null
  bio:         string | null
  avatarKey:   string | null
  bannerKey:   string | null
  role:        string
  isVerified:  boolean
  createdAt:   string
  wallet:      { balance: number }
  _count:      { followers: number; follows: number; posts: number; subscribers: number }
}

export default function SubscriberProfilePage() {
  const { user, logout } = useAuthStore()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<{ success: boolean; data: MyProfile }>({
    queryKey: ['my-profile'],
    queryFn:  () => api.get('/users/me').then(r => r.data),
  })

  const profile = data?.data

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver:      zodResolver(profileSchema),
    values: {
      displayName: profile?.displayName ?? '',
      bio:         profile?.bio ?? '',
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (values: ProfileForm) => api.patch('/users/me', values),
    onSuccess:  () => {
      toast.success('Profile updated')
      qc.invalidateQueries({ queryKey: ['my-profile'] })
    },
    onError: () => toast.error('Update failed'),
  })

  const cdnBase = process.env.NEXT_PUBLIC_CDN_DOMAIN

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Banner */}
      <div className="h-40 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] relative">
        {profile?.bannerKey && (
          <img src={`https://${cdnBase}/${profile.bannerKey}`} alt="banner"
            className="w-full h-full object-cover" />
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-12">
        {/* Avatar + Name */}
        <div className="relative -mt-14 mb-6 flex items-end justify-between">
          <div className="flex items-end gap-4">
            {profile?.avatarKey ? (
              <img src={`https://${cdnBase}/${profile.avatarKey}`} alt="avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-[#121212]" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#ff4757]/20 border-4 border-[#121212] flex items-center justify-center">
                <span className="text-2xl font-bold text-[#ff4757]">
                  {profile?.username?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="pb-1">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {profile?.displayName ?? profile?.username}
                {profile?.isVerified && <Star size={14} className="text-[#ff4757] fill-[#ff4757]" />}
              </h1>
              <p className="text-gray-400 text-sm">@{profile?.username}</p>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold">
                Subscriber
              </span>
            </div>
          </div>
          <button onClick={() => logout()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 pb-1">
            <LogOut size={14} /> Sign out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: <Users size={16} />,      label: 'Following',    value: profile?._count.follows    ?? 0 },
            { icon: <Users size={16} />,      label: 'Followers',    value: profile?._count.followers  ?? 0 },
            { icon: <BookMarked size={16} />, label: 'BangCoins',    value: (profile?.wallet?.balance ?? 0).toFixed(0) },
          ].map(stat => (
            <div key={stat.label} className="bg-[#161616] border border-[#222] rounded-xl p-4 text-center">
              <div className="flex justify-center mb-1 text-[#ff4757]">{stat.icon}</div>
              <p className="text-white font-black text-xl">{stat.value}</p>
              <p className="text-gray-500 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Edit Profile */}
        <div className="bg-[#161616] border border-[#222] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold">Edit Profile</h2>
            <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-[#333] hover:border-[#555] rounded-lg px-3 py-1.5 transition">
              <Camera size={14} /> Change Photo
            </button>
          </div>

          <form onSubmit={handleSubmit(v => mutate(v))} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Display Name</label>
              <input {...register('displayName')}
                className="w-full bg-[#0e0e0e] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#ff4757]"
                placeholder="Your display name" />
              {errors.displayName && <p className="text-red-400 text-xs mt-1">{errors.displayName.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Bio</label>
              <textarea {...register('bio')} rows={3}
                className="w-full bg-[#0e0e0e] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#ff4757] resize-none"
                placeholder="Tell people about yourself…" />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input value={profile?.email ?? ''} readOnly
                className="w-full bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-gray-500 cursor-not-allowed" />
              <p className="text-xs text-gray-600 mt-1">Email cannot be changed here</p>
            </div>

            <button type="submit" disabled={isPending || !isDirty}
              className="flex items-center gap-2 bg-[#ff4757] hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-lg transition disabled:opacity-40">
              <Save size={15} />
              {isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Quick Links */}
        <div className="bg-[#161616] border border-[#222] rounded-2xl p-6">
          <h2 className="text-white font-bold mb-4">Account</h2>
          <div className="space-y-2">
            {[
              { label: 'BangCoins Wallet',       href: '/bangcoins' },
              { label: 'Explore Creators',        href: '/explore' },
              { label: 'Notifications',           href: '/notifications' },
              { label: 'Become a Creator',        href: '/become-creator' },
            ].map(({ label, href }) => (
              <Link key={href} href={href}
                className="block w-full text-left px-4 py-2.5 rounded-lg bg-[#0e0e0e] hover:bg-[#1a1a1a] text-gray-300 text-sm transition">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
