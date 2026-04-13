import AdminSidebar from '@/components/layout/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-brand-dark">
      <AdminSidebar />
      <main className="flex-1 ml-64 min-h-screen bg-brand-dark">
        {children}
      </main>
    </div>
  )
}
