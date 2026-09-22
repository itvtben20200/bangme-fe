'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState }  from 'react'
import api           from '@/lib/api'
import { toast }     from 'sonner'
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type PayoutStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'REJECTED'

interface AdminPayout {
  id: string
  amountRequestedUsd: number
  amountUsd?: number
  method: string
  status: PayoutStatus
  createdAt: string
  processedAt: string | null
  creator: { username: string; avatarKey: string | null }
}

const STATUS_STYLE: Record<PayoutStatus, string> = {
  PENDING:    'bg-yellow-500/20 text-yellow-400',
  APPROVED:   'bg-blue-500/20 text-blue-400',
  PROCESSING: 'bg-purple-500/20 text-purple-400',
  PAID:       'bg-green-500/20 text-green-400',
  REJECTED:   'bg-red-500/20 text-red-400',
}

export default function AdminPayoutsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<PayoutStatus | 'all'>('PENDING')

  const { data, isLoading } = useQuery<{ success: boolean; data: AdminPayout[]; meta: { total: number; perPage: number } }>({
    queryKey: ['admin-payouts', page],
    queryFn:  () => api.get(`/admin/payouts?page=${page}`).then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/payouts/${id}`, { status }),
    onSuccess: (_, v) => {
      toast.success(`Payout ${v.status.toLowerCase()}`)
      qc.invalidateQueries({ queryKey: ['admin-payouts'] })
    },
    onError: () => toast.error('Action failed'),
  })

  const payouts    = data?.data ?? []
  const meta       = data?.meta
  const totalPages = meta ? Math.ceil(meta.total / meta.perPage) : 1

  const filtered = filter === 'all' ? payouts : payouts.filter(p => p.status === filter)

  return (
    <div>
      <header className="sticky top-0 z-10 bg-brand-dark border-b border-brand-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">Payout Management</h1>
        <button onClick={() => qc.invalidateQueries({ queryKey: ['admin-payouts'] })}
          className="flex items-center gap-2 bg-brand-surface border border-brand-border text-brand-text px-3 py-1.5 rounded-lg text-sm hover:border-brand-red transition">
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      <div className="p-6 space-y-4">
        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'REJECTED'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === s ? 'bg-brand-red text-white' : 'bg-brand-surface border border-brand-border text-brand-muted hover:border-brand-red'}`}>
              {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border">
                {['Creator', 'Amount', 'Method', 'Status', 'Requested', 'Processed', 'Actions'].map(h => (
                  <th key={h} className="text-brand-muted text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-brand-muted"><RefreshCw size={18} className="inline animate-spin mr-2" />Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-brand-muted">No payouts found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="border-b border-brand-border hover:bg-brand-card transition">
                  <td className="px-5 py-3 text-white font-medium">@{p.creator.username}</td>
                  <td className="px-5 py-3 text-white font-bold">{formatCurrency(p.amountRequestedUsd ?? p.amountUsd ?? 0)}</td>
                  <td className="px-5 py-3 text-brand-muted capitalize">{p.method.toLowerCase().replace('_', ' ')}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_STYLE[p.status]}`}>
                      {p.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-brand-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-brand-muted">
                    {p.processedAt ? new Date(p.processedAt).toLocaleDateString() : <span className="text-gray-600 italic text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    {p.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateMutation.mutate({ id: p.id, status: 'APPROVED' })}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 transition">
                          <CheckCircle size={11} /> Approve
                        </button>
                        <button onClick={() => updateMutation.mutate({ id: p.id, status: 'REJECTED' })}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition">
                          <XCircle size={11} /> Reject
                        </button>
                      </div>
                    )}
                    {p.status === 'APPROVED' && (
                      <button onClick={() => updateMutation.mutate({ id: p.id, status: 'PAID' })}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition">
                        <Clock size={11} /> Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
