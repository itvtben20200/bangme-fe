'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Image from 'next/image'
import api from '@/lib/api'
import { toast } from 'sonner'
import { RefreshCw, ShieldCheck, Ban, Video } from 'lucide-react'

interface AdminCreator {
  id: string
  username: string
  displayName: string | null
  email: string
  avatarKey: string | null
  isBanned: boolean
  createdAt: string
  wallet: { balance: number } | null
  _count: { posts: number; subscribers: number }
  creatorProfile: {
    isVerified: boolean
    monthlySubPrice: number | null
    totalEarningsUsd: number
    preferredPayoutMethod: string | null
  } | null
}

interface TopStream {
  id: string
  title: string
  maxViewers: number
  viewerCount: number
  status: string
  creator: { username: string; avatarKey: string | null; displayName: string | null }
}

type StatusFilter = 'all' | 'verified' | 'unverified' | 'banned'

function Avatar({ src, name, size = 40 }: { src: string | null; name: string; size?: number }) {
  if (src && (src.startsWith('http') || src.startsWith('/'))) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  return (
    <div
      className="rounded-full bg-brand-surface border border-brand-border flex items-center justify-center flex-shrink-0 text-brand-muted font-bold text-sm"
      style={{ width: size, height: size }}
    >
      {name[0]?.toUpperCase()}
    </div>
  )
}

export default function AdminCreatorsPage() {
  const qc = useQueryClient()
  const [page, setPage]           = useState(1)
  const [statusFilter, setStatus] = useState<StatusFilter>('all')

  const { data, isLoading } = useQuery<{
    success: boolean
    data: AdminCreator[]
    meta: { page: number; perPage: number; total: number }
  }>({
    queryKey: ['admin-creators', page],
    queryFn:  () => api.get(`/admin/creators?page=${page}`).then(r => r.data),
  })

  const { data: streamsData } = useQuery<{ success: boolean; data: TopStream[] }>({
    queryKey: ['admin-livestreams-top'],
    queryFn:  () => api.get('/admin/livestreams/top').then(r => r.data),
  })

  const { mutate: toggleBan, isPending: banning } = useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean }) =>
      api.patch(`/admin/users/${id}/ban`, { banned }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['admin-creators'] }) },
    onError:   () => toast.error('Failed'),
  })

  const { mutate: toggleVerify, isPending: verifying } = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      api.patch(`/admin/creators/${id}/verify`, { verified }),
    onSuccess: () => { toast.success('Verification updated'); qc.invalidateQueries({ queryKey: ['admin-creators'] }) },
    onError:   () => toast.error('Failed'),
  })

  const all      = data?.data ?? []
  const meta     = data?.meta
  const streams  = streamsData?.data ?? []
  const totalPages = meta ? Math.ceil(meta.total / meta.perPage) : 1

  const filtered = all.filter(c => {
    if (statusFilter === 'verified')   return c.creatorProfile?.isVerified && !c.isBanned
    if (statusFilter === 'unverified') return !c.creatorProfile?.isVerified && !c.isBanned
    if (statusFilter === 'banned')     return c.isBanned
    return true
  })

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: 'all',        label: 'All' },
    { key: 'verified',   label: 'Verified' },
    { key: 'unverified', label: 'Unverified' },
    { key: 'banned',     label: 'Banned' },
  ]

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-brand-dark border-b border-brand-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">Creators</h1>
          <p className="text-brand-muted text-xs mt-0.5">{meta?.total ?? '—'} total creators</p>
        </div>
        <button
          onClick={() => { qc.invalidateQueries({ queryKey: ['admin-creators'] }); qc.invalidateQueries({ queryKey: ['admin-livestreams-top'] }) }}
          className="flex items-center gap-2 bg-brand-surface border border-brand-border text-brand-text px-3 py-1.5 rounded-lg text-sm hover:border-brand-red transition"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      <div className="p-6 space-y-8">

        {/* ── Top Creators ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-base">Top Creators</h2>
            {/* Status filter tabs */}
            <div className="flex gap-2">
              {STATUS_TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setStatus(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                    statusFilter === t.key
                      ? 'bg-brand-red text-white'
                      : 'bg-brand-surface border border-brand-border text-brand-muted hover:border-brand-red'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="text-brand-muted text-sm py-8 text-center">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-brand-muted text-sm py-8 text-center">No creators found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(c => (
                <div
                  key={c.id}
                  className={`bg-brand-surface border border-brand-border rounded-xl p-4 flex items-center gap-3 hover:border-brand-red/40 transition ${c.isBanned ? 'opacity-50' : ''}`}
                >
                  <Avatar src={c.avatarKey} name={c.username} size={48} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-white font-semibold text-sm truncate">@{c.username}</p>
                      {c.creatorProfile?.isVerified && (
                        <ShieldCheck size={13} className="text-green-400 flex-shrink-0" />
                      )}
                      {c.isBanned && (
                        <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Banned</span>
                      )}
                    </div>
                    <p className="text-brand-muted text-xs mt-0.5">
                      Earnings: <span className="text-white">${(c.creatorProfile?.totalEarningsUsd ?? 0).toLocaleString()}</span>
                      {' • '}
                      Subs: <span className="text-white">{c._count.subscribers.toLocaleString()}</span>
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => toggleVerify({ id: c.id, verified: !c.creatorProfile?.isVerified })}
                      disabled={verifying || !c.creatorProfile}
                      title={c.creatorProfile?.isVerified ? 'Remove verification' : 'Verify'}
                      className={`p-1.5 rounded-lg transition disabled:opacity-40 ${
                        c.creatorProfile?.isVerified
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-brand-border text-brand-muted hover:text-green-400'
                      }`}
                    >
                      <ShieldCheck size={14} />
                    </button>
                    <button
                      onClick={() => toggleBan({ id: c.id, banned: !c.isBanned })}
                      disabled={banning}
                      title={c.isBanned ? 'Unban' : 'Ban'}
                      className={`p-1.5 rounded-lg transition disabled:opacity-40 ${
                        c.isBanned
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          : 'bg-brand-border text-brand-muted hover:text-red-400'
                      }`}
                    >
                      <Ban size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.total > meta.perPage && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-brand-muted">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 bg-brand-surface border border-brand-border rounded-lg text-white disabled:opacity-40 hover:border-brand-red transition">
                  Prev
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                  className="px-3 py-1.5 bg-brand-surface border border-brand-border rounded-lg text-white disabled:opacity-40 hover:border-brand-red transition">
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── Most Viewed Livestreams ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Video size={16} className="text-brand-red" />
            <h2 className="text-white font-bold text-base">Most Viewed Livestreams</h2>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
            {streams.length === 0 ? (
              <div className="px-5 py-8 text-center text-brand-muted text-sm">No livestream data yet</div>
            ) : (
              <div className="divide-y divide-brand-border">
                {streams.map((stream, i) => (
                  <div key={stream.id} className="px-5 py-3 flex items-center gap-4">
                    <span className="text-brand-muted text-sm font-bold w-6 text-center flex-shrink-0">
                      #{i + 1}
                    </span>
                    <Avatar src={stream.creator.avatarKey} name={stream.creator.username} size={38} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">@{stream.creator.username}</p>
                      <p className="text-brand-muted text-xs truncate">{stream.title}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white text-sm font-semibold">{stream.maxViewers.toLocaleString()} views</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        stream.status === 'LIVE'
                          ? 'bg-brand-red/20 text-brand-red'
                          : 'bg-brand-surface2 text-brand-muted'
                      }`}>
                        {stream.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}

