'use client'
import { usePathname } from 'next/navigation'
import AdminSidebar from '@/components/layout/AdminSidebar'

const AUTH_PATHS = ['/admin/login', '/admin/register']

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = AUTH_PATHS.includes(pathname)

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-brand-dark">
      <AdminSidebar />
      <main className="flex-1 ml-64 min-h-screen bg-brand-dark">
        {children}
      </main>
    </div>
  )
}

