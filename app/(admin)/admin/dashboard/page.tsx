'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState }       from 'react'
import api                from '@/lib/api'
import { toast }          from 'sonner'
import { Users, Star, DollarSign, AlertTriangle, RefreshCw, ShieldOff, ShieldCheck } from 'lucide-react'

type Role = 'user' | 'creator' | 'admin'

interface AdminUser {
  id:        string
  username:  string
  email:     string
  role:      Role
  isBanned:  boolean
  createdAt: string
}

interface AdminStats {
  totalUsers:    number
  activeCreators: number
  revenue30d:    number
  chargebacks:   number
}

interface UsersResponse {
  success: boolean
  data:    AdminUser[]
  meta:    { page: number; perPage: number; total: number }
}

const ROLE_BADGE: Record<Role, string> = {
  user:    'bg-blue-500/20 text-blue-400',
  creator: 'bg-[#ff4757]/20 text-[#ff4757]',
  admin:   'bg-purple-500/20 text-purple-400',
}

export default function AdminDashboardPage() {
  const qc = useQueryClient()
  const [page, setPage]         = useState(1)
  const [roleFilter, setRole]   = useState<Role | 'all'>('all')
  const [search, setSearch]     = useState('')

  const { data: statsData } = useQuery<{ success: boolean; data: AdminStats }>({
    queryKey: ['admin-stats'],
    queryFn:  () => api.get('/admin/stats').then(r => r.data),
    refetchInterval: 30_000,
  })

  const { data: usersData, isLoading: usersLoading } = useQuery<UsersResponse>({
    queryKey: ['admin-users', page],
    queryFn:  () => api.get(`/admin/users?page=${page}&perPage=20`).then(r => r.data),
  })

  const banMutation = useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean }) =>
      api.patch(`/admin/users/${id}/ban`, { banned }),
    onSuccess: (_, vars) => {
      toast.success(vars.banned ? 'User banned' : 'User unbanned')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Action failed'),
  })

  const stats = statsData?.data
  const users  = usersData?.data ?? []
  const meta   = usersData?.meta
  const totalPages = meta ? Math.ceil(meta.total / meta.perPage) : 1

  // Client-side filter by role and search
  const filtered = users.filter(u => {
    const matchRole   = roleFilter === 'all' || u.role === roleFilter
    const matchSearch = !search || u.username.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  const kpis = [
    { label: 'Total Users',      value: stats?.totalUsers     ?? '–', icon: <Users size={20} />,        color: 'text-blue-400' },
    { label: 'Active Creators',  value: stats?.activeCreators ?? '–', icon: <Star size={20} />,         color: 'text-[#ff4757]' },
    { label: 'Revenue (30d)',    value: stats ? `$${stats.revenue30d.toFixed(2)}` : '–', icon: <DollarSign size={20} />, color: 'text-green-400' },
    { label: 'Chargebacks',      value: stats?.chargebacks    ?? '–', icon: <AlertTriangle size={20} />, color: 'text-yellow-400' },
  ]

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-brand-dark border-b border-brand-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">Admin — Accounts Monitor</h1>
        <button
          onClick={() => {
            qc.invalidateQueries({ queryKey: ['admin-stats'] })
            qc.invalidateQueries({ queryKey: ['admin-users'] })
          }}
          className="flex items-center gap-2 bg-brand-surface border border-brand-border text-brand-text px-3 py-1.5 rounded-lg text-sm hover:border-brand-red transition"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label} className="bg-brand-surface border border-brand-border rounded-xl p-4 flex items-start gap-3">
              <span className={k.color}>{k.icon}</span>
              <div>
                <p className="text-brand-muted text-xs mb-0.5">{k.label}</p>
                <p className="text-white font-black text-2xl">{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search username or email…"
            className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red w-64"
          />
          <div className="flex gap-2">
            {(['all', 'user', 'creator', 'admin'] as const).map(r => (
              <button
                key={r}
                onClick={() => { setRole(r); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                  roleFilter === r
                    ? 'bg-brand-red text-white'
                    : 'bg-brand-surface border border-brand-border text-brand-muted hover:border-brand-red'
                }`}
              >
                {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          <span className="text-brand-muted text-sm ml-auto">
            {meta ? `${meta.total} total accounts` : ''}
          </span>
        </div>

        {/* Users table */}
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
              {usersLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-brand-muted">
                    <RefreshCw size={18} className="inline animate-spin mr-2" /> Loading accounts…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-brand-muted">No accounts found</td>
                </tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b border-brand-border hover:bg-brand-card transition">
                  <td className="px-5 py-3 text-white font-medium">@{u.username}</td>
                  <td className="px-5 py-3 text-brand-muted">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${ROLE_BADGE[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      u.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {u.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-brand-muted">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => banMutation.mutate({ id: u.id, banned: !u.isBanned })}
                        disabled={banMutation.isPending}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition font-semibold ${
                          u.isBanned
                            ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {u.isBanned
                          ? <><ShieldCheck size={12} /> Unban</>
                          : <><ShieldOff size={12} /> Ban</>
                        }
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-brand-border">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="text-sm text-brand-muted hover:text-white disabled:opacity-40 transition"
              >
                ← Previous
              </button>
              <span className="text-brand-muted text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="text-sm text-brand-muted hover:text-white disabled:opacity-40 transition"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

