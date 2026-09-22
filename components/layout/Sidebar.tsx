'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { BalanceWidget } from '@/components/BalanceWidget'
import { Home, Compass, User, Bell, MessageSquare, Coins, Star, Settings, LogOut, Video, Radio, type LucideIcon } from 'lucide-react'
import api from '@/lib/api'
import { mediaUrl } from '@/lib/utils'
import { BrandLogo } from '@/components/BrandLogo'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useI18n, type TranslationKey } from '@/lib/i18n'

const nav: { href: string; labelKey: TranslationKey; icon: LucideIcon; creatorOnly?: boolean; userOnly?: boolean }[] = [
  { href: '/home',            labelKey: 'nav.home',           icon: Home },
  { href: '/explore',         labelKey: 'nav.discover',       icon: Compass },
  { href: '/live',            labelKey: 'nav.live',           icon: Radio },
  { href: '/profile',         labelKey: 'nav.profile',        icon: User },
  { href: '/notifications',   labelKey: 'nav.notifications',  icon: Bell },
  { href: '/messages',        labelKey: 'nav.messages',       icon: MessageSquare },
  { href: '/bangcoins',       labelKey: 'nav.bangcoins',      icon: Coins },
  { href: '/creator-center',  labelKey: 'nav.creatorCenter',  icon: Star, creatorOnly: true },
  { href: '/become-creator',  labelKey: 'nav.becomeCreator',  icon: Video, userOnly: true },
  { href: '/settings',        labelKey: 'nav.settings',       icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout } = useAuthStore()
  const { t } = useI18n()
  const conversations = useChatStore((s) => s.conversations)
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)
  const [avatarErr, setAvatarErr] = useState(false)
  const [counts, setCounts] = useState<{ posts: number; followers: number; follows: number } | null>(null)

  useEffect(() => {
    if (!user) return
    api.get<{ data: { _count: { posts: number; followers: number; follows: number } } }>('/users/me')
      .then(r => setCounts(r.data.data._count))
      .catch(() => {})
  }, [user])

  const avatar = mediaUrl(user?.avatarKey ?? null)
  const initials = ((user?.displayName ?? user?.username ?? '?')[0]).toUpperCase()

  function fmt(n: number) {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
  }

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-brand-surface border-r border-brand-border z-20">
        <div className="p-5 border-b border-brand-border">
          <BrandLogo href="/home" className="mb-4" imageClassName="h-6 w-auto max-w-[118px]" priority />
          {user && (
            <Link href="/profile" className="flex flex-col items-center text-center gap-2 group">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-red shrink-0">
                {avatar && !avatarErr
                  ? <Image src={avatar} alt={user.displayName ?? user.username} width={64} height={64} className="object-cover w-full h-full" onError={() => setAvatarErr(true)} />
                  : <div className="w-full h-full bg-brand-card flex items-center justify-center text-xl font-bold text-white">{initials}</div>}
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight group-hover:text-brand-red transition">
                  {user.displayName ?? user.username}
                  {user.isVerified && <span className="text-brand-red ml-1 text-xs">✓</span>}
                </p>
                <p className="text-brand-muted text-xs">@{user.username}</p>
              </div>
              {counts && (
                <div className="flex gap-4 text-xs w-full justify-center">
                  <div className="text-center">
                    <p className="text-white font-bold">{fmt(counts.posts)}</p>
                    <p className="text-brand-muted">{t('nav.posts')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold">{fmt(counts.followers)}</p>
                    <p className="text-brand-muted">{t('nav.followers')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold">{fmt(counts.follows)}</p>
                    <p className="text-brand-muted">{t('nav.following')}</p>
                  </div>
                </div>
              )}
            </Link>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(item => {
            if (item.creatorOnly && user?.role !== 'creator') return null
            if (item.userOnly && user?.role !== 'user') return null
            const active = pathname.startsWith(item.href)
            const Icon = item.icon
            const isMessages = item.href === '/messages'
            return (
              <Link key={item.href} href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active ? 'bg-brand-red text-white' : 'text-brand-text hover:bg-brand-card'}`}>
                <span className="relative flex-shrink-0">
                  <Icon size={18} />
                  {isMessages && totalUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-brand-red text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center leading-none">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </span>
                {t(item.labelKey)}
              </Link>
            )
          })}
        </nav>
        <BalanceWidget />
        <div className="p-3 border-t border-brand-border">
          <div className="mb-3">
            <LanguageSelector />
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-brand-muted hover:text-white hover:bg-brand-card w-full transition">
            <LogOut size={18} /> {t('common.signOut')}
          </button>
        </div>
        <div className="px-5 pb-4 text-xs text-brand-muted">© 2025 BangMe</div>
      </aside>

      {/* Mobile hamburger */}
      <button className="md:hidden fixed top-4 left-4 z-30 bg-brand-surface border border-brand-border rounded-lg p-2">
        <span className="block w-5 h-0.5 bg-white mb-1" />
        <span className="block w-5 h-0.5 bg-white mb-1" />
        <span className="block w-5 h-0.5 bg-white" />
      </button>
    </>
  )
}
