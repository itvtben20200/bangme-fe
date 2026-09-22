import Sidebar from '@/components/layout/Sidebar'
import SessionGuard from '@/components/layout/SessionGuard'
import ChatProvider from '@/components/layout/ChatProvider'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <ChatProvider>
        <div className="flex min-h-screen bg-brand-dark">
          <Sidebar />
          <main className="flex-1 ml-0 md:ml-64 min-h-screen">
            {children}
          </main>
        </div>
      </ChatProvider>
    </SessionGuard>
  )
}
