'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState }  from 'react'
import api           from '@/lib/api'
import { toast }     from 'sonner'
import { RefreshCw, CheckCircle, Eye } from 'lucide-react'

type ReportStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED'

interface AdminReport {
  id: string
  category: string
  description: string | null
  status: ReportStatus
  createdAt: string
  targetPostId?: string | null
  reportedBy: { username: string }
  targetUser: { username: string } | null
}

const STATUS_STYLE: Record<ReportStatus, string> = {
  OPEN:          'bg-red-500/20 text-red-400',
  INVESTIGATING: 'bg-yellow-500/20 text-yellow-400',
  RESOLVED:      'bg-green-500/20 text-green-400',
  DISMISSED:     'bg-gray-500/20 text-gray-400',
}

export default function AdminReportsPage() {
  const qc = useQueryClient()
  const [filter, setFilter]       = useState<ReportStatus | 'all'>('OPEN')
  const [expanded, setExpanded]   = useState<string | null>(null)

  const { data, isLoading } = useQuery<{ success: boolean; data: AdminReport[] }>({
    queryKey: ['admin-reports'],
    queryFn:  () => api.get('/admin/reports').then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/reports/${id}`, { status }),
    onSuccess: (_, v) => {
      toast.success(`Report marked as ${v.status.toLowerCase()}`)
      qc.invalidateQueries({ queryKey: ['admin-reports'] })
    },
    onError: () => toast.error('Action failed'),
  })

  const reports  = data?.data ?? []
  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)

  return (
    <div>
      <header className="sticky top-0 z-10 bg-brand-dark border-b border-brand-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">User Reports</h1>
        <button onClick={() => qc.invalidateQueries({ queryKey: ['admin-reports'] })}
          className="flex items-center gap-2 bg-brand-surface border border-brand-border text-brand-text px-3 py-1.5 rounded-lg text-sm hover:border-brand-red transition">
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      <div className="p-6 space-y-4">
        {/* Summary chips */}
        <div className="flex gap-3">
          {(['all', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'] as const).map(s => {
            const count = s === 'all' ? reports.length : reports.filter(r => r.status === s).length
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === s ? 'bg-brand-red text-white' : 'bg-brand-surface border border-brand-border text-brand-muted hover:border-brand-red'}`}>
                {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()} ({count})
              </button>
            )
          })}
        </div>

        {/* Table */}
        <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border">
                {['Reporter', 'Target User', 'Reason', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-brand-muted text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-brand-muted"><RefreshCw size={18} className="inline animate-spin mr-2" />Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-brand-muted">No reports found</td></tr>
              ) : filtered.map(r => (
                <>
                  <tr key={r.id} className="border-b border-brand-border hover:bg-brand-card transition">
                    <td className="px-5 py-3 text-white">@{r.reportedBy.username}</td>
                    <td className="px-5 py-3 text-white">{r.targetUser ? `@${r.targetUser.username}` : <span className="text-gray-600 italic text-xs">—</span>}</td>
                    <td className="px-5 py-3 text-brand-muted max-w-xs truncate">{r.category}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_STYLE[r.status]}`}>
                        {r.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-brand-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {r.description && (
                          <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-brand-muted hover:text-white transition">
                            <Eye size={11} /> {expanded === r.id ? 'Hide' : 'View'}
                          </button>
                        )}
                        {r.status === 'OPEN' && (
                          <button onClick={() => updateMutation.mutate({ id: r.id, status: 'INVESTIGATING' })}
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 transition">
                            Investigate
                          </button>
                        )}
                        {(r.status === 'OPEN' || r.status === 'INVESTIGATING') && (
                          <>
                            <button onClick={() => updateMutation.mutate({ id: r.id, status: 'RESOLVED' })}
                              disabled={updateMutation.isPending}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 transition">
                              <CheckCircle size={11} /> Resolve
                            </button>
                            <button onClick={() => updateMutation.mutate({ id: r.id, status: 'DISMISSED' })}
                              disabled={updateMutation.isPending}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border border-gray-500/30 transition">
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === r.id && r.description && (
                    <tr key={`${r.id}-detail`} className="bg-[#0a0a0a]">
                      <td colSpan={6} className="px-5 py-3">
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{r.description}</p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
