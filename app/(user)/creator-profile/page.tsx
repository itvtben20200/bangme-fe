'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm }      from 'react-hook-form'
import { zodResolver }  from '@hookform/resolvers/zod'
import { z }            from 'zod'
import { toast }        from 'sonner'
import {
  Camera, Save, Star, Users, DollarSign,
  TrendingUp, BookMarked, LogOut, ExternalLink,
} from 'lucide-react'
import api              from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import Link             from 'next/link'

const profileSchema = z.object({
  displayName: z.string().min(1, 'Required').max(50),
  bio:         z.string().max(500).optional(),
})
type ProfileForm  = z.infer<typeof profileSchema>

interface MyCreatorProfile {
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
  wallet:        { balance: number }
  creatorProfile: {
    monthlySubPrice:  number
    messagePrice:     number
    totalEarningsUsd: number
    isLive:           boolean
  } | null
  _count: { followers: number; follows: number; posts: number; subscribers: number }
}

export default function CreatorProfilePage() {
  const { user, logout } = useAuthStore()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<{ success: boolean; data: MyCreatorProfile }>({
    queryKey: ['my-creator-profile'],
    queryFn:  () => api.get('/users/me').then(r => r.data),
  })

  const profile = data?.data

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      displayName: profile?.displayName ?? '',
      bio:         profile?.bio ?? '',
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (values: ProfileForm) => api.patch('/users/me', values),
    onSuccess:  () => {
      toast.success('Profile updated')
      qc.invalidateQueries({ queryKey: ['my-creator-profile'] })
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

  const cp = profile?.creatorProfile

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Banner */}
      <div className="h-44 relative bg-gradient-to-r from-[#ff4757]/20 to-[#ff6b6b]/10">
        {profile?.bannerKey && (
          <img src={`https://${cdnBase}/${profile.bannerKey}`} alt="banner"
            className="w-full h-full object-cover" />
        )}
        <button className="absolute bottom-3 right-4 flex items-center gap-1.5 text-xs bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm transition">
          <Camera size={13} /> Change Banner
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* Avatar + Name */}
        <div className="relative -mt-16 mb-6 flex items-end justify-between">
          <div className="flex items-end gap-4">
            <div className="relative">
              {profile?.avatarKey ? (
                <img src={`https://${cdnBase}/${profile.avatarKey}`} alt="avatar"
                  className="w-28 h-28 rounded-full object-cover border-4 border-[#121212]" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-[#ff4757]/20 border-4 border-[#121212] flex items-center justify-center">
                  <span className="text-3xl font-bold text-[#ff4757]">
                    {profile?.username?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <button className="absolute bottom-1 right-1 w-7 h-7 bg-[#ff4757] rounded-full flex items-center justify-center hover:bg-red-500 transition">
                <Camera size={13} className="text-white" />
              </button>
            </div>
            <div className="pb-2">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                {profile?.displayName ?? profile?.username}
                {profile?.isVerified && <Star size={16} className="text-[#ff4757] fill-[#ff4757]" />}
              </h1>
              <p className="text-gray-400">@{profile?.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#ff4757]/20 text-[#ff4757] font-semibold">
                  Creator
                </span>
                {cp?.isLive && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-bold animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="pb-2 flex items-center gap-3">
            <Link href={`/creator/${profile?.username}`}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-[#333] hover:border-[#555] rounded-lg px-3 py-1.5 transition">
              <ExternalLink size={13} /> Public View
            </Link>
            <button onClick={() => logout()}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { icon: <Users size={16} />,      label: 'Followers',   value: profile?._count.followers  ?? 0 },
            { icon: <BookMarked size={16} />, label: 'Subscribers', value: profile?._count.subscribers ?? 0 },
            { icon: <TrendingUp size={16} />, label: 'Posts',       value: profile?._count.posts       ?? 0 },
            { icon: <DollarSign size={16} />, label: 'Earnings',   value: `$${(cp?.totalEarningsUsd ?? 0).toFixed(2)}` },
          ].map(stat => (
            <div key={stat.label} className="bg-[#161616] border border-[#222] rounded-xl p-4 text-center">
              <div className="flex justify-center mb-1 text-[#ff4757]">{stat.icon}</div>
              <p className="text-white font-black text-xl">{stat.value}</p>
              <p className="text-gray-500 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Edit Profile form */}
          <div className="col-span-2 bg-[#161616] border border-[#222] rounded-2xl p-6">
            <h2 className="text-white font-bold mb-4">Edit Profile</h2>
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
                <textarea {...register('bio')} rows={4}
                  className="w-full bg-[#0e0e0e] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#ff4757] resize-none"
                  placeholder="Tell your fans about yourself…" />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input value={profile?.email ?? ''} readOnly
                  className="w-full bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-gray-500 cursor-not-allowed" />
              </div>

              <button type="submit" disabled={isPending || !isDirty}
                className="flex items-center gap-2 bg-[#ff4757] hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-lg transition disabled:opacity-40">
                <Save size={15} />
                {isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Pricing & Quick Links */}
          <div className="space-y-4">
            {/* Pricing summary */}
            <div className="bg-[#161616] border border-[#222] rounded-2xl p-5">
              <h3 className="text-white font-bold mb-3 text-sm">Your Pricing</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly sub</span>
                  <span className="text-white font-semibold">${cp?.monthlySubPrice ?? 9.99}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Message price</span>
                  <span className="text-white font-semibold">{cp?.messagePrice ?? 2} coins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">BangCoins balance</span>
                  <span className="text-white font-semibold">{profile?.wallet?.balance ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-[#161616] border border-[#222] rounded-2xl p-5">
              <h3 className="text-white font-bold mb-3 text-sm">Quick Links</h3>
              <div className="space-y-1.5">
                {[
                  { label: 'Creator Dashboard', href: '/creator-center' },
                  { label: 'Upload Content',    href: '/creator-center' },
                  { label: 'Go Live',           href: '/creator-center' },
                  { label: 'Earnings & Payouts', href: '/creator-center' },
                  { label: 'Notifications',     href: '/notifications' },
                  { label: 'Settings',          href: '/settings' },
                ].map(({ label, href }) => (
                  <Link key={label} href={href}
                    className="block px-3 py-2 rounded-lg bg-[#0e0e0e] hover:bg-[#1a1a1a] text-gray-300 text-xs transition">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
