'use client'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react'
import { useState } from 'react'
import api from '@/lib/api'

interface PrelaunchCreatorSignup {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  street: string
  postalCode: string
  city: string
  country: string
  source: string
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminPrelaunchCreatorsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch, isFetching } = useQuery<{ success: boolean; data: PrelaunchCreatorSignup[]; meta: { page: number; perPage: number; total: number } }>({
    queryKey: ['admin-prelaunch-creators', page, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), perPage: '50' })
      if (search.trim()) params.set('search', search.trim())
      return api.get(`/admin/prelaunch-creators?${params.toString()}`).then(r => r.data)
    },
  })

  const items = data?.data ?? []
  const meta = data?.meta
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.perPage)) : 1

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-border bg-brand-dark px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-white">Prelaunch Creator Signups</h1>
          <p className="mt-1 text-sm text-brand-muted">Marketing leads captured from the standalone Founding 100 landing page.</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-surface px-3 py-1.5 text-sm text-brand-text transition hover:border-brand-red">
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={event => { setSearch(event.target.value); setPage(1) }}
              placeholder="Search email, name, username, city..."
              className="w-80 rounded-lg border border-brand-border bg-brand-surface py-2 pl-8 pr-3 text-sm text-white outline-none focus:border-brand-red"
            />
          </div>
          <span className="ml-auto text-sm text-brand-muted">{meta ? `${meta.total} total signups` : ''}</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border">
                {['Name', 'Email', 'Username', 'Location', 'Status', 'Captured'].map(header => (
                  <th key={header} className="px-5 py-3 text-left font-semibold text-brand-muted">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="py-12 text-center text-brand-muted"><RefreshCw size={18} className="mr-2 inline animate-spin" />Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-brand-muted">No prelaunch signups found.</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="border-b border-brand-border transition hover:bg-brand-card">
                  <td className="px-5 py-3 text-white">
                    <div className="font-semibold">{item.firstName} {item.lastName}</div>
                    <div className="text-xs text-brand-muted">{item.source}</div>
                  </td>
                  <td className="px-5 py-3 text-brand-muted">{item.email}</td>
                  <td className="px-5 py-3 text-brand-muted">@{item.username}</td>
                  <td className="px-5 py-3 text-brand-muted">
                    <div>{item.postalCode} {item.city}</div>
                    <div className="text-xs">{item.country}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-[#ff0618]/15 px-2 py-0.5 text-xs font-semibold uppercase text-[#ff0618]">{item.status}</span>
                  </td>
                  <td className="px-5 py-3 text-brand-muted">{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setPage(current => Math.max(1, current - 1))} disabled={page === 1} className="rounded-lg bg-brand-surface p-1.5 disabled:opacity-40 hover:bg-brand-border">
              <ChevronLeft size={16} className="text-white" />
            </button>
            <span className="text-sm text-brand-muted">Page {page} / {totalPages}</span>
            <button onClick={() => setPage(current => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="rounded-lg bg-brand-surface p-1.5 disabled:opacity-40 hover:bg-brand-border">
              <ChevronRight size={16} className="text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}