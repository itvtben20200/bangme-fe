'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { mediaUrl, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface RelatedUser {
  id: string
  username: string
  displayName: string | null
  avatarKey: string | null
}

interface EarningTransaction {
  id: string
  type: string
  bangcoinsAmount: number
  netUsd: number
  note: string | null
  createdAt: string
  relatedUser: RelatedUser | null
}

interface PayerSummary {
  user: RelatedUser
  message: number
  subscription: number
  call: number
  tip: number
  contentUnlock: number
  total: number
}

interface ApiResponse {
  items: EarningTransaction[]
  meta: { page: number; perPage: number; total: number }
  payerSummary: PayerSummary[]
}

const TYPE_LABEL: Record<string, string> = {
  SUBSCRIPTION:   '⭐ Abonnement',
  MESSAGE:        '💬 Nachricht',
  CALL:           '📞 Anruf',
  TIP:            '🎁 Trinkgeld',
  CONTENT_UNLOCK: '🔒 Freischaltung',
}

const PER_PAGE = 15

export default function CreatorEarningsTab() {
  const [data, setData]     = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage]     = useState(1)
  const [view, setView]     = useState<'summary' | 'detail'>('summary')

  useEffect(() => {
    setLoading(true)
    api.get(`/wallet/creator-earnings?page=${page}&perPage=${PER_PAGE}`)
      .then(r => setData(r.data))
      .catch(() => toast.error('Einnahmen konnten nicht geladen werden'))
      .finally(() => setLoading(false))
  }, [page])

  if (loading && !data) {
    return (
      <div className="p-10 text-center text-brand-muted text-sm">
        <span className="inline-block w-5 h-5 border-2 border-brand-muted/30 border-t-brand-muted rounded-full animate-spin mr-2" />
        Einnahmen werden geladen...
      </div>
    )
  }

  const totalEarned  = data?.payerSummary.reduce((s, p) => s + p.total, 0) ?? 0
  const totalMsg     = data?.payerSummary.reduce((s, p) => s + p.message, 0) ?? 0
  const totalSub     = data?.payerSummary.reduce((s, p) => s + p.subscription, 0) ?? 0
  const totalCall    = data?.payerSummary.reduce((s, p) => s + p.call, 0) ?? 0
  const totalTip     = data?.payerSummary.reduce((s, p) => s + p.tip, 0) ?? 0
  const totalPages   = Math.ceil((data?.meta.total ?? 0) / PER_PAGE)

  return (
    <div className="space-y-5">
      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Gesamt verdient', value: totalEarned, color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30' },
          { label: 'Nachrichten',     value: totalMsg,    color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30'  },
          { label: 'Abonnements',     value: totalSub,    color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
          { label: 'Anrufe & Trinkgeld', value: totalCall + totalTip, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} border rounded-xl p-4`}>
            <p className="text-brand-muted text-xs mb-1">{card.label}</p>
            <p className={`${card.color} font-black text-xl`}>{card.value.toFixed(2)}</p>
            <p className="text-brand-muted text-xs">BangCoins</p>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        {(['summary', 'detail'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
              view === v
                ? 'bg-brand-red text-white'
                : 'bg-brand-surface border border-brand-border text-brand-muted hover:text-white'
            }`}
          >
            {v === 'summary' ? 'Nach Fan' : 'Alle Transaktionen'}
          </button>
        ))}
      </div>

      {/* ── Summary: per-payer breakdown ── */}
      {view === 'summary' && (
        <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
          {!data?.payerSummary.length ? (
            <p className="p-8 text-center text-brand-muted text-sm">Noch keine Einnahmen.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-brand-muted text-left px-5 py-3 font-semibold">Fan</th>
                  <th className="text-brand-muted text-right px-3 py-3 font-semibold hidden sm:table-cell">💬 Msg</th>
                  <th className="text-brand-muted text-right px-3 py-3 font-semibold hidden sm:table-cell">⭐ Sub</th>
                  <th className="text-brand-muted text-right px-3 py-3 font-semibold hidden sm:table-cell">📞 Call</th>
                  <th className="text-brand-muted text-right px-3 py-3 font-semibold hidden sm:table-cell">🎁 Tip</th>
                  <th className="text-brand-muted text-right px-5 py-3 font-semibold">Gesamt BC</th>
                </tr>
              </thead>
              <tbody>
                {data.payerSummary.map(payer => (
                  <tr key={payer.user?.id ?? 'unknown'} className="border-b border-brand-border hover:bg-brand-card transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-card overflow-hidden flex-shrink-0">
                          {payer.user?.avatarKey ? (
                            <img src={mediaUrl(payer.user.avatarKey)!} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-brand-muted text-xs font-bold">
                              {(payer.user?.username?.[0] ?? '?').toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <Link href={payer.user?.username ? `/creator/${payer.user.username}` : '/profile'} className="text-white font-semibold hover:text-brand-red transition text-sm">
                            {payer.user?.displayName ?? payer.user?.username ?? 'Unbekannt'}
                          </Link>
                          <p className="text-brand-muted text-xs">@{payer.user?.username ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-brand-muted hidden sm:table-cell">
                      {payer.message > 0 ? <span className="text-white">{payer.message.toFixed(2)}</span> : '—'}
                    </td>
                    <td className="px-3 py-3 text-right text-brand-muted hidden sm:table-cell">
                      {payer.subscription > 0 ? <span className="text-white">{payer.subscription.toFixed(2)}</span> : '—'}
                    </td>
                    <td className="px-3 py-3 text-right text-brand-muted hidden sm:table-cell">
                      {payer.call > 0 ? <span className="text-white">{payer.call.toFixed(2)}</span> : '—'}
                    </td>
                    <td className="px-3 py-3 text-right text-brand-muted hidden sm:table-cell">
                      {payer.tip > 0 ? <span className="text-white">{payer.tip.toFixed(2)}</span> : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-black text-green-400">
                      +{payer.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Detail: all transactions ── */}
      {view === 'detail' && (
        <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-brand-muted text-sm">Wird geladen...</div>
          ) : !data?.items.length ? (
            <p className="p-8 text-center text-brand-muted text-sm">Noch keine Transaktionen.</p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border">
                    {['Fan', 'Typ', 'Verdient (BC)', 'USD', 'Datum'].map(h => (
                      <th key={h} className="text-brand-muted text-left px-5 py-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map(tx => (
                    <tr key={tx.id} className="border-b border-brand-border hover:bg-brand-card transition">
                      <td className="px-5 py-3">
                        {tx.relatedUser ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-brand-card overflow-hidden flex-shrink-0">
                              {tx.relatedUser.avatarKey ? (
                                <img src={mediaUrl(tx.relatedUser.avatarKey)!} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-brand-muted text-xs font-bold">
                                  {tx.relatedUser.username[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                            <Link href={`/creator/${tx.relatedUser.username}`} className="text-white hover:text-brand-red transition text-xs">
                              @{tx.relatedUser.username}
                            </Link>
                          </div>
                        ) : (
                          <span className="text-brand-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-white">{TYPE_LABEL[tx.type] ?? tx.type}</td>
                      <td className="px-5 py-3 font-bold text-green-400">+{tx.bangcoinsAmount.toFixed(2)}</td>
                      <td className="px-5 py-3 text-green-400 font-semibold">+{formatCurrency(tx.netUsd)}</td>
                      <td className="px-5 py-3 text-brand-muted whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-brand-border">
                  <p className="text-brand-muted text-xs">{data.meta.total} Transaktionen</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="px-3 py-1.5 text-xs bg-brand-card border border-brand-border rounded-lg text-brand-text hover:border-brand-red transition disabled:opacity-40">
                      ← Zurück
                    </button>
                    <span className="px-3 py-1.5 text-xs text-brand-muted">{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="px-3 py-1.5 text-xs bg-brand-card border border-brand-border rounded-lg text-brand-text hover:border-brand-red transition disabled:opacity-40">
                      Weiter →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
