'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState }      from 'react'
import api               from '@/lib/api'
import { toast }         from 'sonner'
import { RefreshCw, ShieldOff, ShieldCheck, Search, UserCheck } from 'lucide-react'

type Role = 'user' | 'creator' | 'admin'
interface AdminUser {
  id: string; username: string; email: string; role: Role; isBanned: boolean; createdAt: string
}
const ROLE_BADGE: Record<Role, string> = {
  user:    'bg-blue-500/20 text-blue-400',
  creator: 'bg-[#ff0618]/20 text-[#ff0618]',
  admin:   'bg-purple-500/20 text-purple-400',
}

export default function AdminUsersPage() {
  const qc = useQueryClient()
  const [page, setPage]       = useState(1)
  const [role, setRole]       = useState<Role | 'all'>('all')
  const [search, setSearch]   = useState('')

  const { data, isLoading } = useQuery<{ success: boolean; data: AdminUser[]; meta: { total: number; page: number; perPage: number } }>({
    queryKey: ['admin-users', page],
    queryFn:  () => api.get(`/admin/users?page=${page}&perPage=30`).then(r => r.data),
  })

  const banMutation = useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean }) =>
      api.patch(`/admin/users/${id}/ban`, { banned }),
    onSuccess: (_, v) => {
      toast.success(v.banned ? 'User banned' : 'User unbanned')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Action failed'),
  })

  const roleUpMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }) },
    onError: () => toast.error('Failed to update role'),
  })

  const users = data?.data ?? []
  const meta  = data?.meta
  const totalPages = meta ? Math.ceil(meta.total / meta.perPage) : 1

  const filtered = users.filter(u => {
    const matchRole   = role === 'all' || u.role === role
    const matchSearch = !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  return (
    <div>
      <header className="sticky top-0 z-10 bg-brand-dark border-b border-brand-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">User Management</h1>
        <button onClick={() => qc.invalidateQueries({ queryKey: ['admin-users'] })}
          className="flex items-center gap-2 bg-brand-surface border border-brand-border text-brand-text px-3 py-1.5 rounded-lg text-sm hover:border-brand-red transition">
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search username or email…"
              className="bg-brand-surface border border-brand-border rounded-lg pl-8 pr-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red w-64" />
          </div>
          <div className="flex gap-2">
            {(['all', 'user', 'creator', 'admin'] as const).map(r => (
              <button key={r} onClick={() => { setRole(r); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${role === r ? 'bg-brand-red text-white' : 'bg-brand-surface border border-brand-border text-brand-muted hover:border-brand-red'}`}>
                {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          <span className="text-brand-muted text-sm ml-auto">{meta ? `${meta.total} total users` : ''}</span>
        </div>

        {/* Table */}
        <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border">
                {['Username', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-brand-muted text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-brand-muted"><RefreshCw size={18} className="inline animate-spin mr-2" />Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-brand-muted">No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b border-brand-border hover:bg-brand-card transition">
                  <td className="px-5 py-3 text-white font-medium">@{u.username}</td>
                  <td className="px-5 py-3 text-brand-muted">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${ROLE_BADGE[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {u.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-brand-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    {u.role !== 'admin' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => banMutation.mutate({ id: u.id, banned: !u.isBanned })}
                          disabled={banMutation.isPending}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition font-semibold ${
                            u.isBanned
                              ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                          {u.isBanned ? <><ShieldCheck size={11} /> Unban</> : <><ShieldOff size={11} /> Ban</>}
                        </button>
                        {u.role === 'user' && (
                          <button onClick={() => roleUpMutation.mutate({ id: u.id, role: 'creator' })}
                            disabled={roleUpMutation.isPending}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition font-semibold bg-[#ff0618]/10 hover:bg-[#ff0618]/20 text-[#ff0618] border border-[#ff0618]/30">
                            <UserCheck size={11} /> Make Creator
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 bg-brand-surface border border-brand-border text-white text-sm rounded-lg disabled:opacity-40 hover:border-brand-red transition">
              ← Prev
            </button>
            <span className="text-brand-muted text-sm">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 bg-brand-surface border border-brand-border text-white text-sm rounded-lg disabled:opacity-40 hover:border-brand-red transition">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
