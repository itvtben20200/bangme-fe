'use client'
import { useRef, useState }                       from 'react'
import { useQuery, useMutation, useQueryClient }  from '@tanstack/react-query'
import { useForm }                                from 'react-hook-form'
import { zodResolver }                            from '@hookform/resolvers/zod'
import { z }                                      from 'zod'
import { toast }                                  from 'sonner'
import { Camera, Save, Star, Users, BookMarked, LogOut, ImagePlus, Loader2, Plus } from 'lucide-react'
import api                                        from '@/lib/api'
import { mediaUrl }                               from '@/lib/utils'
import { useAuthStore }                           from '@/store/authStore'
import Link                                       from 'next/link'
import PostCard                                   from '@/components/PostCard'
import CreatePostModal                            from '@/components/CreatePostModal'
import FollowersModal                             from '@/components/FollowersModal'

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

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const postsRef = useRef<HTMLDivElement>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [listModal, setListModal] = useState<'followers' | 'following' | 'subscribers' | null>(null)

  const { data, isLoading } = useQuery<{ success: boolean; data: MyProfile }>({
    queryKey: ['my-profile'],
    queryFn:  () => api.get('/users/me').then(r => r.data),
  })

  const profile = data?.data

  // Fetch user's posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'user', profile?.id],
    queryFn: () => api.get(`/posts?userId=${profile?.id}`).then(r => r.data),
    enabled: !!profile?.id,
  })

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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('avatar', file)
    setAvatarUploading(true)
    try {
      await api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Avatar updated')
      qc.invalidateQueries({ queryKey: ['my-profile'] })
    } catch {
      toast.error('Avatar upload failed')
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('banner', file)
    setBannerUploading(true)
    try {
      await api.post('/users/me/banner', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Cover photo updated')
      qc.invalidateQueries({ queryKey: ['my-profile'] })
    } catch {
      toast.error('Cover photo upload failed')
    } finally {
      setBannerUploading(false)
      e.target.value = ''
    }
  }

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
      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarChange}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleBannerChange}
      />

      {/* Banner */}
      <div
        className="h-40 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] relative group cursor-pointer"
        onClick={() => !bannerUploading && bannerInputRef.current?.click()}
        title="Click to change cover photo"
      >
        {profile?.bannerKey && (
          <img src={mediaUrl(profile.bannerKey)!} alt="banner"
            className="w-full h-full object-cover" />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {bannerUploading
            ? <Loader2 size={28} className="text-white animate-spin" />
            : <div className="flex flex-col items-center gap-1 text-white">
                <ImagePlus size={24} />
                <span className="text-xs font-medium">Change cover photo</span>
              </div>
          }
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-12">
        {/* Avatar + Name */}
        <div className="relative -mt-14 mb-6 flex items-end justify-between">
          <div className="flex items-end gap-4">
            {/* Clickable avatar */}
            <button
              type="button"
              onClick={() => !avatarUploading && avatarInputRef.current?.click()}
              className="relative group w-24 h-24 rounded-full border-4 border-[#121212] overflow-hidden flex-shrink-0 focus:outline-none"
              title="Click to change avatar"
            >
              {profile?.avatarKey ? (
                <img src={mediaUrl(profile.avatarKey)!} alt="avatar"
                  className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#ff0618]/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#ff0618]">
                    {profile?.username?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarUploading
                  ? <Loader2 size={18} className="text-white animate-spin" />
                  : <Camera size={18} className="text-white" />
                }
              </div>
            </button>
            <div className="pb-1">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {profile?.displayName ?? profile?.username}
                {profile?.isVerified && <Star size={14} className="text-[#ff0618] fill-[#ff0618]" />}
              </h1>
              <p className="text-gray-400 text-sm">@{profile?.username}</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
                profile?.role === 'CREATOR' || profile?.role === 'creator'
                  ? 'bg-[#ff0618]/20 text-[#ff0618]'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {profile?.role === 'CREATOR' || profile?.role === 'creator' ? 'Creator' : 'Subscriber'}
              </span>
            </div>
          </div>
          <button onClick={() => logout()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 pb-1">
            <LogOut size={14} /> Sign out
          </button>
        </div>

        {/* Stats */}
        <div className={`grid gap-3 mb-6 ${
          profile?.role === 'CREATOR' || profile?.role === 'creator' ? 'grid-cols-4' : 'grid-cols-3'
        }`}>
          {[
            { icon: <Users size={16} />,      label: 'Following',    value: profile?._count.follows      ?? 0, onClick: () => setListModal('following')        },
            { icon: <Users size={16} />,      label: 'Followers',    value: profile?._count.followers    ?? 0, onClick: () => setListModal('followers')        },
            { icon: <BookMarked size={16} />, label: 'Posts',        value: profile?._count.posts        ?? 0, onClick: () => postsRef.current?.scrollIntoView({ behavior: 'smooth' }) },
            ...((profile?.role === 'CREATOR' || profile?.role === 'creator') ? [
              { icon: <Star size={16} />,     label: 'Subscribers',  value: profile?._count.subscribers  ?? 0, onClick: () => setListModal('subscribers')      },
            ] : []),
          ].map(stat => (
            <div
              key={stat.label}
              onClick={stat.onClick}
              className="bg-[#161616] border border-[#222] rounded-xl p-4 text-center cursor-pointer hover:border-[#ff0618]/40 hover:bg-[#1a1a1a] transition"
            >
              <div className="flex justify-center mb-1 text-[#ff0618]">{stat.icon}</div>
              <p className="text-white font-black text-xl">{stat.value}</p>
              <p className="text-gray-500 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* My Wall / Posts Section */}
        <div ref={postsRef} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-2xl">My Wall</h2>
            <button
              onClick={() => setShowCreatePost(true)}
              className="flex items-center gap-2 bg-[#ff0618] hover:bg-[#ff0618] text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Create Post
            </button>
          </div>

          {postsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#ff0618] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : postsData?.data && postsData.data.length > 0 ? (
            <div className="space-y-4">
              {postsData.data.map((post: any) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={profile?.username}
                  onDelete={() => qc.invalidateQueries({ queryKey: ['posts'] })}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#161616] border border-[#222] rounded-2xl p-12 text-center">
              <p className="text-gray-400 mb-4">You haven't posted anything yet</p>
              <button
                onClick={() => setShowCreatePost(true)}
                className="inline-flex items-center gap-2 bg-[#ff0618] hover:bg-[#ff0618] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                <Plus size={20} />
                Create Your First Post
              </button>
            </div>
          )}
        </div>

        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          userAvatar={profile?.avatarKey ? mediaUrl(profile.avatarKey)! : undefined}
          username={profile?.displayName || profile?.username}
        />

        {/* Followers / Subscribers modal */}
        <FollowersModal
          mode={listModal ?? 'followers'}
          isOpen={listModal !== null}
          onClose={() => setListModal(null)}
        />


        {/* Edit Profile */}
        <div className="bg-[#161616] border border-[#222] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold">Edit Profile</h2>
            <button
              type="button"
              onClick={() => !bannerUploading && bannerInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-[#333] hover:border-[#555] rounded-lg px-3 py-1.5 transition"
            >
              <ImagePlus size={14} /> Change Cover
            </button>
          </div>

          <form onSubmit={handleSubmit(v => mutate(v))} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Display Name</label>
              <input {...register('displayName')}
                className="w-full bg-[#0e0e0e] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#ff0618]"
                placeholder="Your display name" />
              {errors.displayName && <p className="text-red-400 text-xs mt-1">{errors.displayName.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Bio</label>
              <textarea {...register('bio')} rows={3}
                className="w-full bg-[#0e0e0e] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#ff0618] resize-none"
                placeholder="Tell people about yourself…" />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input value={profile?.email ?? ''} readOnly
                className="w-full bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-gray-500 cursor-not-allowed" />
              <p className="text-xs text-gray-600 mt-1">Email cannot be changed here</p>
            </div>

            <button type="submit" disabled={isPending || !isDirty}
              className="flex items-center gap-2 bg-[#ff0618] hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-lg transition disabled:opacity-40">
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
