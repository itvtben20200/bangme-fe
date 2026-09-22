'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings, Camera, Save, Image as ImageIcon, Lock, Bell, Shield,
  CreditCard, Star, Eye, EyeOff, ChevronRight, Trash2, Copy, Check, LogOut,
} from 'lucide-react'
import { useForm }       from 'react-hook-form'
import { zodResolver }   from '@hookform/resolvers/zod'
import { z }             from 'zod'
import { toast }         from 'sonner'
import { useRouter }     from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import api               from '@/lib/api'
import { mediaUrl }      from '@/lib/utils'
import { useAuthStore }  from '@/store/authStore'
import type { User }     from '@/types'

// ─── Schemas ─────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  displayName: z.string().min(1).max(50),
  bio:         z.string().max(500).optional(),
  email:       z.string().email(),
})
type ProfileForm = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword:     z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof passwordSchema>

const creatorSchema = z.object({
  monthlySubPrice:       z.number({ invalid_type_error: 'Enter a number' }).min(0).max(999),
  messagePrice:          z.number({ invalid_type_error: 'Enter a number' }).min(0).max(999),
  audioCallPricePerMin:  z.number({ invalid_type_error: 'Enter a number' }).min(0).max(999),
  videoCallPricePerMin:  z.number({ invalid_type_error: 'Enter a number' }).min(0).max(999),
  paypalEmail:           z.string().email('Enter a valid email').or(z.literal('')).optional(),
  preferredPayoutMethod: z.enum(['PAYPAL', 'BANK_TRANSFER']),
})
type CreatorForm = z.infer<typeof creatorSchema>

// ─── Privacy/Notification defaults ───────────────────────────────────────────
const PRIVACY_DEFAULTS = {
  privateAccount:    false,
  showOnlineStatus:  true,
  allowMessages:     true,
  allowComments:     true,
  ghostMode:         false,
  defaultVisibility: 'PUBLIC' as 'PUBLIC' | 'FOLLOWERS' | 'SUBSCRIBERS',
}
const NOTIF_DEFAULTS = {
  newFollowers:  true,
  likesComments: true,
  messages:      true,
  liveStreams:   true,
  emailDigest:   false,
  securityAlerts: true,
}

type Tab = 'profile' | 'privacy' | 'notifications' | 'security' | 'billing' | 'creator'

// ─── Component ───────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const router   = useRouter()
  const qc       = useQueryClient()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [tab, setTab]   = useState<Tab>('profile')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [copied, setCopied]           = useState(false)

  // ── Preferences: load from API ────────────────────────────────────────────
  const { data: prefsData } = useQuery({
    queryKey: ['preferences'],
    queryFn:  () => api.get('/preferences').then(r => r.data.data),
    enabled:  !!user,
  })

  const [privacy, setPrivacy] = useState(PRIVACY_DEFAULTS)
  const [notifs,  setNotifs]  = useState(NOTIF_DEFAULTS)

  // Sync state once prefs load from API
  useEffect(() => {
    if (!prefsData) return
    setPrivacy({
      privateAccount:    prefsData.privateAccount    ?? PRIVACY_DEFAULTS.privateAccount,
      showOnlineStatus:  prefsData.showOnlineStatus  ?? PRIVACY_DEFAULTS.showOnlineStatus,
      allowMessages:     prefsData.allowMessages     ?? PRIVACY_DEFAULTS.allowMessages,
      allowComments:     prefsData.allowComments     ?? PRIVACY_DEFAULTS.allowComments,
      ghostMode:         prefsData.ghostMode         ?? PRIVACY_DEFAULTS.ghostMode,
      defaultVisibility: prefsData.defaultVisibility ?? PRIVACY_DEFAULTS.defaultVisibility,
    })
    setNotifs({
      newFollowers:   prefsData.notifNewFollowers   ?? NOTIF_DEFAULTS.newFollowers,
      likesComments:  prefsData.notifLikesComments  ?? NOTIF_DEFAULTS.likesComments,
      messages:       prefsData.notifMessages       ?? NOTIF_DEFAULTS.messages,
      liveStreams:     prefsData.notifLiveStreams    ?? NOTIF_DEFAULTS.liveStreams,
      emailDigest:    prefsData.notifEmailDigest    ?? NOTIF_DEFAULTS.emailDigest,
      securityAlerts: prefsData.notifSecurityAlerts ?? NOTIF_DEFAULTS.securityAlerts,
    })
  }, [prefsData])

  const { mutate: savePrefs } = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch('/preferences', body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['preferences'] }),
    onError:    () => toast.error('Failed to save preferences'),
  })

  function savePrivacy(next: typeof privacy) {
    setPrivacy(next)
    savePrefs({
      privateAccount:    next.privateAccount,
      showOnlineStatus:  next.showOnlineStatus,
      allowMessages:     next.allowMessages,
      allowComments:     next.allowComments,
      ghostMode:         next.ghostMode,
      defaultVisibility: next.defaultVisibility,
    })
    toast.success('Privacy settings saved')
  }
  function saveNotifs(next: typeof notifs) {
    setNotifs(next)
    savePrefs({
      notifNewFollowers:   next.newFollowers,
      notifLikesComments:  next.likesComments,
      notifMessages:       next.messages,
      notifLiveStreams:     next.liveStreams,
      notifEmailDigest:    next.emailDigest,
      notifSecurityAlerts: next.securityAlerts,
    })
    toast.success('Notification preferences saved')
  }

  function handleLogout() { logout(); router.push('/login') }

  // ── Profile query ─────────────────────────────────────────────────────────
  const { data } = useQuery<{ success: boolean; data: User & {
    wallet?: { balance: number }
    creatorProfile?: {
      monthlySubPrice: number; messagePrice: number
      audioCallPricePerMin: number; videoCallPricePerMin: number
      paypalEmail: string | null; preferredPayoutMethod: string
    }
  } }>({
    queryKey: ['me'],
    queryFn:  () => api.get('/auth/me').then(r => r.data),
  })
  const profile = data?.data

  // ── Profile form ─────────────────────────────────────────────────────────
  const profileForm = useForm<ProfileForm>({
    resolver:      zodResolver(profileSchema),
    defaultValues: { displayName: profile?.displayName ?? '', bio: profile?.bio ?? '', email: profile?.email ?? '' },
  })
  useEffect(() => {
    if (profile) profileForm.reset({ displayName: profile.displayName ?? '', bio: profile.bio ?? '', email: profile.email })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  const { mutate: saveProfile, isPending: savingProfile } = useMutation({
    mutationFn: (v: ProfileForm) => api.patch('/users/me', v),
    onSuccess:  () => { toast.success('Profile updated'); qc.invalidateQueries({ queryKey: ['me'] }) },
    onError:    () => toast.error('Update failed'),
  })

  // ── Avatar / Banner ───────────────────────────────────────────────────────
  const { mutate: uploadAvatar, isPending: uploadingAvatar } = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData(); fd.append('avatar', file)
      return api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => { toast.success('Avatar updated'); qc.invalidateQueries({ queryKey: ['me'] }) },
    onError:   () => toast.error('Avatar upload failed'),
  })
  const { mutate: uploadBanner, isPending: uploadingBanner } = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData(); fd.append('banner', file)
      return api.post('/users/me/banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => { toast.success('Banner updated'); qc.invalidateQueries({ queryKey: ['me'] }) },
    onError:   () => toast.error('Banner upload failed'),
  })
  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    upload: (f: File) => void,
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP allowed'); return
    }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 MB'); return }
    upload(file)
  }

  // ── Password form ─────────────────────────────────────────────────────────
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })
  const { mutate: changePassword, isPending: changingPw } = useMutation({
    mutationFn: (v: PasswordForm) => api.post('/auth/change-password', {
      currentPassword: v.currentPassword, newPassword: v.newPassword,
    }),
    onSuccess: () => { toast.success('Password changed'); passwordForm.reset() },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to change password'),
  })

  // ── Creator form ──────────────────────────────────────────────────────────
  const cp = profile?.creatorProfile
  const creatorForm = useForm<CreatorForm>({
    resolver:      zodResolver(creatorSchema),
    defaultValues: {
      monthlySubPrice:       cp?.monthlySubPrice      ?? 9.99,
      messagePrice:          cp?.messagePrice         ?? 2,
      audioCallPricePerMin:  cp?.audioCallPricePerMin ?? 8,
      videoCallPricePerMin:  cp?.videoCallPricePerMin ?? 15,
      paypalEmail:           cp?.paypalEmail          ?? '',
      preferredPayoutMethod: (cp?.preferredPayoutMethod as any) ?? 'PAYPAL',
    },
  })
  useEffect(() => {
    if (cp) creatorForm.reset({
      monthlySubPrice:       cp.monthlySubPrice,
      messagePrice:          cp.messagePrice,
      audioCallPricePerMin:  cp.audioCallPricePerMin,
      videoCallPricePerMin:  cp.videoCallPricePerMin,
      paypalEmail:           cp.paypalEmail ?? '',
      preferredPayoutMethod: cp.preferredPayoutMethod as any,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, cp?.audioCallPricePerMin, cp?.videoCallPricePerMin, cp?.messagePrice, cp?.monthlySubPrice])

  const { mutate: saveCreator, isPending: savingCreator } = useMutation({
    mutationFn: (v: CreatorForm) => api.patch('/creators/profile', {
      ...v,
      paypalEmail: v.paypalEmail || null,
    }),
    onSuccess: () => { toast.success('Creator settings saved'); qc.invalidateQueries({ queryKey: ['me'] }) },
    onError:   () => toast.error('Save failed'),
  })

  // ── Transaction query ─────────────────────────────────────────────────────
  const { data: txData } = useQuery<{ success: boolean; data: any[]; total: number }>({
    queryKey: ['transactions'],
    queryFn:  () => api.get('/wallet/transactions?perPage=10').then(r => r.data),
    enabled:  tab === 'billing',
  })

  // ── Affiliate link ────────────────────────────────────────────────────────
  const affiliateLink = typeof window !== 'undefined'
    ? `${window.location.origin}/register?ref=${user?.username}`
    : ''
  function copyAffiliate() {
    navigator.clipboard.writeText(affiliateLink).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── Tabs config ───────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ElementType; creatorOnly?: boolean }[] = [
    { id: 'profile',       label: 'Profile',       icon: Settings },
    { id: 'privacy',       label: 'Privacy',        icon: Eye },
    { id: 'notifications', label: 'Notifications',  icon: Bell },
    { id: 'security',      label: 'Security',       icon: Shield },
    { id: 'billing',       label: 'Billing',        icon: CreditCard },
    { id: 'creator',       label: 'Creator',        icon: Star, creatorOnly: true },
  ]

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Settings size={24} className="text-[#ff0618]" />
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>
        <button
          onClick={() => { logout(); router.push('/login') }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#222] border border-[#333] transition"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 bg-[#161616] p-1 rounded-xl border border-[#222] overflow-x-auto">
        {tabs.map(t => {
          if (t.creatorOnly && profile?.role !== 'creator') return null
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition flex-1 justify-center ${
                active
                  ? 'bg-[#ff0618] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#222]'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── PROFILE tab ──────────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="space-y-6">
          {/* Avatar */}
          <div className="bg-[#161616] rounded-2xl p-6 border border-[#222]">
            <h2 className="text-white font-semibold mb-4">Profile Picture</h2>
            <div className="flex items-center gap-4">
              {profile?.avatarKey ? (
                <img src={mediaUrl(profile.avatarKey)!} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#ff0618]/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#ff0618]">{user?.username?.[0]?.toUpperCase()}</span>
                </div>
              )}
              <input type="file" ref={avatarInputRef} onChange={e => handleFileChange(e, uploadAvatar)} accept="image/jpeg,image/png,image/webp" className="hidden" />
              <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                className="flex items-center gap-2 bg-[#222] hover:bg-[#333] text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50">
                <Camera size={14} />{uploadingAvatar ? 'Uploading…' : 'Change Photo'}
              </button>
            </div>
          </div>

          {/* Banner */}
          <div className="bg-[#161616] rounded-2xl p-6 border border-[#222]">
            <h2 className="text-white font-semibold mb-4">Profile Banner</h2>
            <div className="space-y-4">
              {profile?.bannerKey ? (
                <img src={mediaUrl(profile.bannerKey)!} alt="banner" className="w-full h-32 rounded-lg object-cover" />
              ) : (
                <div className="w-full h-32 rounded-lg bg-[#222] flex items-center justify-center">
                  <ImageIcon size={32} className="text-gray-600" />
                </div>
              )}
              <input type="file" ref={bannerInputRef} onChange={e => handleFileChange(e, uploadBanner)} accept="image/jpeg,image/png,image/webp" className="hidden" />
              <button type="button" onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner}
                className="flex items-center gap-2 bg-[#222] hover:bg-[#333] text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50">
                <ImageIcon size={14} />{uploadingBanner ? 'Uploading…' : 'Change Banner'}
              </button>
            </div>
          </div>

          {/* Profile form */}
          <form onSubmit={profileForm.handleSubmit(v => saveProfile(v))}
            className="bg-[#161616] rounded-2xl p-6 border border-[#222] space-y-4">
            <h2 className="text-white font-semibold">Profile Info</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Display Name</label>
              <input {...profileForm.register('displayName')} className="w-full bg-[#222] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0618]" />
              {profileForm.formState.errors.displayName && <p className="text-red-400 text-xs mt-1">{profileForm.formState.errors.displayName.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input {...profileForm.register('email')} type="email" className="w-full bg-[#222] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0618]" />
              {profileForm.formState.errors.email && <p className="text-red-400 text-xs mt-1">{profileForm.formState.errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bio</label>
              <textarea {...profileForm.register('bio')} rows={3} className="w-full bg-[#222] text-white px-4 py-2.5 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#ff0618]" />
            </div>
            <button type="submit" disabled={savingProfile}
              className="flex items-center gap-2 bg-[#ff0618] hover:bg-red-500 text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50">
              <Save size={16} />{savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </form>

          {/* Affiliate link */}
          <div className="bg-[#161616] rounded-2xl p-6 border border-[#222]">
            <h2 className="text-white font-semibold mb-2">Affiliate Link</h2>
            <p className="text-gray-400 text-sm mb-3">Share your referral link to earn when people join.</p>
            <div className="flex gap-2">
              <input readOnly value={affiliateLink} className="flex-1 bg-[#222] text-gray-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none" />
              <button onClick={copyAffiliate} className="flex items-center gap-2 bg-[#222] hover:bg-[#333] text-white text-sm px-4 py-2.5 rounded-lg transition">
                {copied ? <><Check size={14} className="text-green-400" /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-[#161616] rounded-2xl p-6 border border-red-900/30">
            <h2 className="text-red-400 font-semibold mb-4">Danger Zone</h2>
            <button onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-500 px-4 py-2 rounded-lg transition">
              Log out of all devices
            </button>
          </div>
        </div>
      )}

      {/* ── PRIVACY tab ──────────────────────────────────────────────────── */}
      {tab === 'privacy' && (
        <div className="space-y-6">
          <div className="bg-[#161616] rounded-2xl p-6 border border-[#222] space-y-5">
            <h2 className="text-white font-semibold">Account Privacy</h2>
            {([
              ['privateAccount',   'Private Account',     'Only approved followers can see your content'],
              ['showOnlineStatus', 'Show Online Status',  'Let others see when you are online'],
              ['allowMessages',    'Allow Messages',      'Allow other users to send you messages'],
              ['allowComments',    'Allow Comments',      'Allow comments on your posts'],
            ] as [keyof typeof privacy, string, string][]).map(([key, label, desc]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-gray-400 text-xs">{desc}</p>
                </div>
                <button
                  onClick={() => savePrivacy({ ...privacy, [key]: !privacy[key] })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${privacy[key] ? 'bg-[#ff0618]' : 'bg-[#333]'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${privacy[key] ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-[#161616] rounded-2xl p-6 border border-[#222] space-y-4">
            <div>
              <h2 className="text-white font-semibold">Ghost Mode</h2>
              <p className="text-gray-400 text-sm mt-1">Hide your location from the Nearby tab. Helps protect your privacy.</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Enable Ghost Mode</p>
                <p className="text-gray-400 text-xs">You won't appear in Nearby searches</p>
              </div>
              <button
                onClick={() => savePrivacy({ ...privacy, ghostMode: !privacy.ghostMode })}
                className={`relative w-12 h-6 rounded-full transition-colors ${privacy.ghostMode ? 'bg-[#ff0618]' : 'bg-[#333]'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${privacy.ghostMode ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="bg-[#161616] rounded-2xl p-6 border border-[#222] space-y-3">
            <h2 className="text-white font-semibold">Default Post Visibility</h2>
            <p className="text-gray-400 text-sm">New posts will default to this visibility setting.</p>
            {(['PUBLIC', 'FOLLOWERS', 'SUBSCRIBERS'] as const).map(v => (
              <label key={v} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="visibility" checked={privacy.defaultVisibility === v}
                  onChange={() => savePrivacy({ ...privacy, defaultVisibility: v })}
                  className="accent-[#ff0618]" />
                <span className="text-white text-sm">{v.charAt(0) + v.slice(1).toLowerCase()}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS tab ────────────────────────────────────────────── */}
      {tab === 'notifications' && (
        <div className="bg-[#161616] rounded-2xl p-6 border border-[#222] space-y-5">
          <h2 className="text-white font-semibold">Notification Preferences</h2>
          {([
            ['newFollowers',   'New Followers',         'When someone starts following you'],
            ['likesComments',  'Likes & Comments',      'When someone likes or comments on your posts'],
            ['messages',       'Messages',              'When you receive a new message'],
            ['liveStreams',     'Live Streams',          'When a creator you follow goes live'],
            ['emailDigest',    'Weekly Email Digest',   'Summary of your activity sent weekly'],
            ['securityAlerts', 'Security Alerts',       'Login attempts and account security events'],
          ] as [keyof typeof notifs, string, string][]).map(([key, label, desc]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-gray-400 text-xs">{desc}</p>
              </div>
              <button
                onClick={() => saveNotifs({ ...notifs, [key]: !notifs[key] })}
                className={`relative w-12 h-6 rounded-full transition-colors ${notifs[key] ? 'bg-[#ff0618]' : 'bg-[#333]'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifs[key] ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── SECURITY tab ─────────────────────────────────────────────────── */}
      {tab === 'security' && (
        <div className="space-y-6">
          {/* Change password */}
          <form onSubmit={passwordForm.handleSubmit(v => changePassword(v))}
            className="bg-[#161616] rounded-2xl p-6 border border-[#222] space-y-4">
            <h2 className="text-white font-semibold">Change Password</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Current Password</label>
              <div className="relative">
                <input {...passwordForm.register('currentPassword')} type={showCurrent ? 'text' : 'password'}
                  className="w-full bg-[#222] text-white px-4 py-2.5 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0618]" />
                <button type="button" onClick={() => setShowCurrent(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordForm.formState.errors.currentPassword && <p className="text-red-400 text-xs mt-1">{passwordForm.formState.errors.currentPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">New Password</label>
              <div className="relative">
                <input {...passwordForm.register('newPassword')} type={showNew ? 'text' : 'password'}
                  className="w-full bg-[#222] text-white px-4 py-2.5 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0618]" />
                <button type="button" onClick={() => setShowNew(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordForm.formState.errors.newPassword && <p className="text-red-400 text-xs mt-1">{passwordForm.formState.errors.newPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
              <input {...passwordForm.register('confirmPassword')} type="password"
                className="w-full bg-[#222] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0618]" />
              {passwordForm.formState.errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={changingPw}
              className="flex items-center gap-2 bg-[#ff0618] hover:bg-red-500 text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50">
              <Lock size={16} />{changingPw ? 'Updating…' : 'Update Password'}
            </button>
          </form>

          {/* 2FA placeholder */}
          <div className="bg-[#161616] rounded-2xl p-6 border border-[#222]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-white font-semibold">Two-Factor Authentication</h2>
                <p className="text-gray-400 text-sm mt-1">Add an extra layer of security to your account using an authenticator app.</p>
              </div>
              <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">Coming soon</span>
            </div>
          </div>

          {/* Active sessions info */}
          <div className="bg-[#161616] rounded-2xl p-6 border border-[#222]">
            <h2 className="text-white font-semibold mb-3">Active Sessions</h2>
            <div className="flex items-center justify-between py-3 border-b border-[#222]">
              <div>
                <p className="text-white text-sm">This device</p>
                <p className="text-gray-400 text-xs">Current session • {typeof navigator !== 'undefined' ? navigator.userAgent.split('(')[0].trim() : 'Browser'}</p>
              </div>
              <span className="text-green-400 text-xs font-medium">Active</span>
            </div>
            <button onClick={handleLogout}
              className="mt-4 flex items-center gap-2 text-sm text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-500 px-4 py-2 rounded-lg transition">
              <Trash2 size={14} /> End all other sessions
            </button>
          </div>
        </div>
      )}

      {/* ── BILLING tab ──────────────────────────────────────────────────── */}
      {tab === 'billing' && (
        <div className="space-y-6">
          {/* Balance summary */}
          <div className="bg-[#161616] rounded-2xl p-6 border border-[#222]">
            <h2 className="text-white font-semibold mb-1">Wallet Balance</h2>
            <p className="text-3xl font-bold text-[#ff0618]">
              {profile?.wallet?.balance ?? 0} <span className="text-lg font-normal text-gray-400">BangCoins</span>
            </p>
            <button onClick={() => router.push('/bangcoins')}
              className="mt-3 text-sm bg-[#ff0618] hover:bg-red-500 text-white px-4 py-2 rounded-lg transition">
              Top Up
            </button>
          </div>

          {/* Transaction history */}
          <div className="bg-[#161616] rounded-2xl p-6 border border-[#222]">
            <h2 className="text-white font-semibold mb-4">Recent Transactions</h2>
            {!txData?.data?.length ? (
              <p className="text-gray-500 text-sm">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {txData.data.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium capitalize">{tx.type?.toLowerCase().replace('_', ' ')}</p>
                      <p className="text-gray-400 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} 🪙
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => router.push('/bangcoins')}
              className="mt-4 flex items-center gap-1 text-sm text-gray-400 hover:text-white transition">
              View full history <ChevronRight size={14} />
            </button>
          </div>

          {/* Payment methods placeholder */}
          <div className="bg-[#161616] rounded-2xl p-6 border border-[#222]">
            <h2 className="text-white font-semibold mb-2">Payment Methods</h2>
            <p className="text-gray-400 text-sm">Payment methods are managed through Stripe during checkout.</p>
          </div>
        </div>
      )}

      {/* ── CREATOR tab ──────────────────────────────────────────────────── */}
      {tab === 'creator' && profile?.role === 'creator' && (
        <div className="space-y-6">
          <form onSubmit={creatorForm.handleSubmit(v => saveCreator(v))}
            className="bg-[#161616] rounded-2xl p-6 border border-[#222] space-y-5">
            <h2 className="text-white font-semibold">Subscription & Pricing</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Monthly Sub Price ($)</label>
                <input {...creatorForm.register('monthlySubPrice', { valueAsNumber: true })} type="number" step="0.01" min="0" max="999"
                  className="w-full bg-[#222] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0618]" />
                {creatorForm.formState.errors.monthlySubPrice && <p className="text-red-400 text-xs mt-1">{creatorForm.formState.errors.monthlySubPrice.message}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Message Price (BangCoins)</label>
                <input {...creatorForm.register('messagePrice', { valueAsNumber: true })} type="number" step="0.5" min="0" max="999"
                  className="w-full bg-[#222] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0618]" />
                {creatorForm.formState.errors.messagePrice && <p className="text-red-400 text-xs mt-1">{creatorForm.formState.errors.messagePrice.message}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Audio Call (BangCoins/min)</label>
                <input {...creatorForm.register('audioCallPricePerMin', { valueAsNumber: true })} type="number" step="0.5" min="0" max="999"
                  className="w-full bg-[#222] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0618]" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Video Call (BangCoins/min)</label>
                <input {...creatorForm.register('videoCallPricePerMin', { valueAsNumber: true })} type="number" step="0.5" min="0" max="999"
                  className="w-full bg-[#222] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0618]" />
              </div>
            </div>

            <button type="submit" disabled={savingCreator}
              className="flex items-center gap-2 bg-[#ff0618] hover:bg-red-500 text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50">
              <Save size={16} />{savingCreator ? 'Saving…' : 'Save Pricing'}
            </button>
          </form>

          {/* Payout settings */}
          <form onSubmit={creatorForm.handleSubmit(v => saveCreator(v))}
            className="bg-[#161616] rounded-2xl p-6 border border-[#222] space-y-4">
            <h2 className="text-white font-semibold">Payout Settings</h2>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Preferred Payout Method</label>
              <div className="flex gap-3 flex-wrap">
                {(['PAYPAL', 'BANK_TRANSFER'] as const).map(m => (
                  <label key={m} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition ${
                    creatorForm.watch('preferredPayoutMethod') === m
                      ? 'border-[#ff0618] bg-[#ff0618]/10 text-white'
                      : 'border-[#333] text-gray-400 hover:border-[#555]'
                  }`}>
                    <input type="radio" {...creatorForm.register('preferredPayoutMethod')} value={m} className="hidden" />
                    {m === 'PAYPAL' ? 'PayPal' : 'Bank Transfer'}
                  </label>
                ))}
              </div>
            </div>

            {creatorForm.watch('preferredPayoutMethod') === 'PAYPAL' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">PayPal Email</label>
                <input {...creatorForm.register('paypalEmail')} type="email" placeholder="you@paypal.com"
                  className="w-full bg-[#222] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0618]" />
                {creatorForm.formState.errors.paypalEmail && <p className="text-red-400 text-xs mt-1">{creatorForm.formState.errors.paypalEmail.message}</p>}
              </div>
            )}

            {creatorForm.watch('preferredPayoutMethod') === 'BANK_TRANSFER' && (
              <p className="text-gray-400 text-sm">Bank transfer details are collected when you request a payout through the Creator Center.</p>
            )}


            <button type="submit" disabled={savingCreator}
              className="flex items-center gap-2 bg-[#ff0618] hover:bg-red-500 text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50">
              <Save size={16} />{savingCreator ? 'Saving…' : 'Save Payout Settings'}
            </button>
          </form>

          {/* Promo packages placeholder */}
          <div className="bg-[#161616] rounded-2xl p-6 border border-[#222]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-white font-semibold">Promo Packages</h2>
                <p className="text-gray-400 text-sm mt-1">Create limited-time discount offers for your subscribers.</p>
              </div>
              <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">Coming soon</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
