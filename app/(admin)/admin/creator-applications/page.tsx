'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Check, X, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

type AppStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

interface Application {
  id: string
  status: AppStatus
  note: string | null
  adminNote: string | null
  createdAt: string
  user: {
    id: string
    username: string
    displayName: string | null
    email: string
    avatarKey: string | null
    createdAt: string
  }
}

const STATUS_LABELS: Record<AppStatus, string> = {
  PENDING:  'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

const STATUS_COLORS: Record<AppStatus, string> = {
  PENDING:  'text-yellow-400 bg-yellow-400/10',
  APPROVED: 'text-green-400 bg-green-400/10',
  REJECTED: 'text-red-400 bg-red-400/10',
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return <img src={src} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
  }
  return (
    <div className="w-10 h-10 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-muted font-bold text-sm shrink-0">
      {name[0]?.toUpperCase()}
    </div>
  )
}

export default function AdminCreatorApplicationsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<AppStatus | 'all'>('PENDING')
  const [page, setPage]                 = useState(1)
  const [rejectId, setRejectId]         = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const queryKey = ['admin-creator-applications', statusFilter, page]

  const { data, isLoading } = useQuery<{ success: boolean; data: Application[]; meta: { page: number; perPage: number; total: number } }>({
    queryKey,
    queryFn: () => api.get(`/admin/creator-applications?status=${statusFilter}&page=${page}`).then(r => r.data),
  })

  const { mutate: approve, isPending: approving } = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/creator-applications/${id}/approve`),
    onSuccess:  () => { toast.success('Application approved — user is now a creator'); qc.invalidateQueries({ queryKey: ['admin-creator-applications'] }) },
    onError:    () => toast.error('Failed to approve'),
  })

  const { mutate: reject, isPending: rejecting } = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/admin/creator-applications/${id}/reject`, { reason }),
    onSuccess:  () => { toast.success('Application rejected'); setRejectId(null); setRejectReason(''); qc.invalidateQueries({ queryKey: ['admin-creator-applications'] }) },
    onError:    () => toast.error('Failed to reject'),
  })

  const items      = data?.data ?? []
  const meta       = data?.meta
  const totalPages = meta ? Math.ceil(meta.total / meta.perPage) : 1

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Creator Applications</h1>
        <p className="text-brand-muted text-sm">Review and approve or reject user applications to become creators.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['PENDING', 'APPROVED', 'REJECTED', 'all'] as const).map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${statusFilter === s ? 'bg-brand-red text-white' : 'bg-brand-surface text-brand-muted hover:text-white'}`}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-brand-muted">No applications found.</div>
      ) : (
        <div className="space-y-3">
          {items.map(app => (
            <div key={app.id} className="bg-brand-surface border border-brand-border rounded-xl p-5 flex items-start gap-4">
              <Avatar src={app.user.avatarKey} name={app.user.username} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-white">{app.user.displayName ?? app.user.username}</span>
                  <span className="text-brand-muted text-sm">@{app.user.username}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[app.status]}`}>
                    {STATUS_LABELS[app.status]}
                  </span>
                </div>
                <p className="text-brand-muted text-xs mt-0.5">{app.user.email}</p>
                {app.note && (
                  <p className="text-gray-300 text-sm mt-2 bg-[#1a1a1a] rounded-lg p-3 border border-[#333]">
                    <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">Applicant note</span>
                    {app.note}
                  </p>
                )}
                {app.adminNote && app.status === 'REJECTED' && (
                  <p className="text-red-400 text-xs mt-2">Rejection reason: {app.adminNote}</p>
                )}
                <p className="text-brand-muted text-xs mt-2">
                  Applied {new Date(app.createdAt).toLocaleDateString()} · Member since {new Date(app.user.createdAt).toLocaleDateString()}
                </p>
              </div>

              {app.status === 'PENDING' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approve(app.id)}
                    disabled={approving}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    onClick={() => { setRejectId(app.id); setRejectReason('') }}
                    className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg bg-brand-surface disabled:opacity-40 hover:bg-brand-border">
            <ChevronLeft size={16} className="text-white" />
          </button>
          <span className="text-brand-muted text-sm">Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg bg-brand-surface disabled:opacity-40 hover:bg-brand-border">
            <ChevronRight size={16} className="text-white" />
          </button>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-bold text-lg mb-3">Reject Application</h2>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (shown to the applicant — optional)"
              rows={4}
              className="w-full bg-[#111] border border-[#333] rounded-xl p-3 text-sm text-gray-300 placeholder-gray-600 resize-none mb-4 focus:outline-none focus:border-brand-red"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectId(null)} className="px-4 py-2 text-sm text-brand-muted hover:text-white transition">Cancel</button>
              <button
                onClick={() => reject({ id: rejectId, reason: rejectReason })}
                disabled={rejecting}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
              >
                {rejecting ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
