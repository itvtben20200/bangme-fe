'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Home, Compass, User, Bell, MessageSquare, Coins, Star, Settings, LogOut, Video } from 'lucide-react'

const nav = [
  { href: '/home',            label: 'Home',           icon: Home },
  { href: '/explore',         label: 'Discover',       icon: Compass },
  { href: '/profile',         label: 'Profile',        icon: User },
  { href: '/notifications',   label: 'Notifications',  icon: Bell },
  { href: '/messages',        label: 'Messages',       icon: MessageSquare },
  { href: '/bangcoins',       label: 'BangCoins',      icon: Coins },
  { href: '/creator-center',  label: 'Creator Center', icon: Star, creatorOnly: true },
  { href: '/become-creator',  label: 'Become Creator', icon: Video, userOnly: true },
  { href: '/settings',        label: 'Settings',       icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-brand-surface border-r border-brand-border z-20">
        <div className="p-5 border-b border-brand-border">
          <div className="text-xl font-black">
            <span className="text-white">BANG</span><span className="text-brand-red">ME</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(item => {
            if (item.creatorOnly && user?.role !== 'creator') return null
            if (item.userOnly && user?.role !== 'user') return null
            const active = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active ? 'bg-brand-red text-white' : 'text-brand-text hover:bg-brand-card'}`}>
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-brand-border">
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-brand-muted hover:text-white hover:bg-brand-card w-full transition">
            <LogOut size={18} /> Sign Out
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
