'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState }  from 'react'
import api           from '@/lib/api'
import { toast }     from 'sonner'
import { RefreshCw, Trash2, Image as ImageIcon, Video, Music } from 'lucide-react'

interface AdminPost {
  id: string
  caption: string | null
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | null
  isPremium: boolean
  visibility: string
  likesCount: number
  commentsCount: number
  createdAt: string
  creator: { username: string; avatarKey: string | null }
}

const MEDIA_ICON = {
  IMAGE: ImageIcon,
  VIDEO: Video,
  AUDIO: Music,
}

export default function AdminContentPage() {
  const qc = useQueryClient()
  const [page, setPage]         = useState(1)
  const [confirmId, setConfirm] = useState<string | null>(null)

  const { data, isLoading } = useQuery<{ success: boolean; data: AdminPost[]; meta: { total: number; perPage: number } }>({
    queryKey: ['admin-posts', page],
    queryFn:  () => api.get(`/admin/posts?page=${page}`).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/posts/${id}`),
    onSuccess: () => {
      toast.success('Post removed')
      setConfirm(null)
      qc.invalidateQueries({ queryKey: ['admin-posts'] })
    },
    onError: () => toast.error('Failed to remove post'),
  })

  const posts      = data?.data ?? []
  const meta       = data?.meta
  const totalPages = meta ? Math.ceil(meta.total / meta.perPage) : 1

  return (
    <div>
      <header className="sticky top-0 z-10 bg-brand-dark border-b border-brand-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">Content Moderation</h1>
        <button onClick={() => qc.invalidateQueries({ queryKey: ['admin-posts'] })}
          className="flex items-center gap-2 bg-brand-surface border border-brand-border text-brand-text px-3 py-1.5 rounded-lg text-sm hover:border-brand-red transition">
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-brand-muted text-sm">{meta ? `${meta.total} total posts` : ''}</p>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border">
                {['Creator', 'Caption', 'Type', 'Visibility', 'Engagement', 'Posted', 'Actions'].map(h => (
                  <th key={h} className="text-brand-muted text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-brand-muted"><RefreshCw size={18} className="inline animate-spin mr-2" />Loading…</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-brand-muted">No posts found</td></tr>
              ) : posts.map(p => {
                const MediaIcon = p.mediaType ? MEDIA_ICON[p.mediaType] : null
                return (
                  <tr key={p.id} className="border-b border-brand-border hover:bg-brand-card transition">
                    <td className="px-5 py-3 text-white font-medium">@{p.creator.username}</td>
                    <td className="px-5 py-3 text-brand-muted max-w-xs truncate">{p.caption ?? <span className="italic text-gray-600">No caption</span>}</td>
                    <td className="px-5 py-3">
                      {MediaIcon
                        ? <div className="flex items-center gap-1.5 text-gray-400"><MediaIcon size={13} /><span className="capitalize">{p.mediaType?.toLowerCase()}</span></div>
                        : <span className="text-gray-600 italic text-xs">Text</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        p.visibility === 'PUBLIC' ? 'bg-green-500/20 text-green-400' :
                        p.visibility === 'FOLLOWERS' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-[#ff0618]/20 text-[#ff0618]'
                      }`}>{p.visibility}</span>
                      {p.isPremium && <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Paid</span>}
                    </td>
                    <td className="px-5 py-3 text-brand-muted text-xs">
                      ♥ {p.likesCount} &nbsp; 💬 {p.commentsCount}
                    </td>
                    <td className="px-5 py-3 text-brand-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      {confirmId === p.id ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => deleteMutation.mutate(p.id)} disabled={deleteMutation.isPending}
                            className="text-xs px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold">
                            Confirm
                          </button>
                          <button onClick={() => setConfirm(null)} className="text-xs px-2.5 py-1.5 bg-brand-surface border border-brand-border text-white rounded-lg transition">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirm(p.id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition">
                          <Trash2 size={11} /> Remove
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
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
