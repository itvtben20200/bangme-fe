'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Star, FileText, CreditCard, Flag, Settings } from 'lucide-react'

const nav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users',     label: 'Users',      icon: Users },
  { href: '/admin/creators',  label: 'Creators',   icon: Star },
  { href: '/admin/content',   label: 'Content',    icon: FileText },
  { href: '/admin/payouts',   label: 'Payouts',    icon: CreditCard },
  { href: '/admin/reports',   label: 'Reports',    icon: Flag },
  { href: '/admin/settings',  label: 'Settings',   icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f0f0f] border-r border-brand-border z-20 flex flex-col">
      <div className="p-5 border-b border-brand-border flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-brand-red inline-block" />
        <span className="text-white font-black">BangMe Admin</span>
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
    </aside>
  )
}
