'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Star, FileText, CreditCard, Flag, Settings, LogOut, ClipboardList, MailPlus } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { useAuthStore } from '@/store/authStore'

const nav = [
  { href: '/admin/dashboard',             label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/admin/users',                 label: 'Users',        icon: Users },
  { href: '/admin/creators',              label: 'Creators',     icon: Star },
  { href: '/admin/prelaunch-creators',    label: 'Prelaunch',    icon: MailPlus },
  { href: '/admin/creator-applications',  label: 'Applications', icon: ClipboardList },
  { href: '/admin/content',               label: 'Content',      icon: FileText },
  { href: '/admin/payouts',               label: 'Payouts',      icon: CreditCard },
  { href: '/admin/reports',               label: 'Reports',      icon: Flag },
  { href: '/admin/settings',              label: 'Settings',     icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuthStore()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f0f0f] border-r border-brand-border z-20 flex flex-col">
      <div className="p-5 border-b border-brand-border flex items-center gap-2">
        <BrandLogo href="/admin/dashboard" imageClassName="h-5 w-auto max-w-[104px]" priority />
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted bg-brand-surface border border-brand-border px-1.5 py-0.5 rounded">
          Admin
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(item => {
          const active = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active ? 'bg-brand-surface text-white' : 'text-brand-muted hover:bg-brand-surface hover:text-white'}`}>
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-brand-border">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-brand-muted hover:text-white hover:bg-brand-surface w-full transition">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
