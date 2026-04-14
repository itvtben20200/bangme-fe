'use client'

import { useState } from 'react'
import Link from 'next/link'
import api  from '@/lib/api'

/* ─── Visibility config ─────────────────────────────────────────────────── */

const VISIBILITY_OPTIONS = [
  {
    value: 'PUBLIC',
    label: 'Public 🌐',
    desc:  'Anyone on BANGME can watch — including non-subscribers',
    badge: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  {
    value: 'FOLLOWERS',
    label: 'Followers Only 👥',
    desc:  'Only users who follow you can join the live stream',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    value: 'SUBSCRIBERS',
    label: 'Subscribers Only 💳',
    desc:  'Paying subscribers only — maximum exclusivity',
    badge: 'bg-brand-red/20 text-brand-red border-brand-red/30',
  },
] as const

type Visibility = typeof VISIBILITY_OPTIONS[number]['value']

/* ─── Go Live Modal ─────────────────────────────────────────────────────── */

function GoLiveModal({ onClose }: { onClose: () => void }) {
  const [title,      setTitle]      = useState('')
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [liveData,   setLiveData]   = useState<{ channelId: string; agoraToken: string } | null>(null)

  async function handleStart() {
    if (!title.trim()) { setError('Please enter a title for your live stream'); return }
    setLoading(true); setError(null)
    try {
      const { data } = await api.post('/live/start', { title: title.trim(), visibility })
      setLiveData({ channelId: data.data.channelId, agoraToken: data.data.agoraToken })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Failed to start live stream. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selected = VISIBILITY_OPTIONS.find(o => o.value === visibility)!

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-brand-surface border border-brand-border rounded-2xl w-full max-w-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-white font-black text-lg">Go Live</h2>
          </div>
          <button onClick={onClose} className="text-brand-muted hover:text-white text-xl leading-none">✕</button>
        </div>

        {liveData ? (
          /* ── Success state ── */
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl">🔴</span>
            </div>
            <h3 className="text-white font-black text-xl mb-2">You&apos;re Live!</h3>
            <p className="text-brand-muted text-sm mb-2">{title}</p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${selected.badge}`}>
              {selected.label}
            </span>
            <div className="mt-6 bg-brand-card border border-brand-border rounded-xl p-4 text-left">
              <p className="text-brand-muted text-xs mb-1 font-semibold uppercase tracking-wider">Channel ID</p>
              <p className="text-white text-sm font-mono break-all">{liveData.channelId}</p>
            </div>
            <p className="text-brand-muted text-xs mt-4">
              Your viewers can join from your creator page. End your stream when done.
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full px-6 py-3 bg-brand-card border border-brand-border text-white font-bold rounded-xl hover:border-brand-red transition"
            >
              Close
            </button>
          </div>
        ) : (
          /* ── Setup form ── */
          <div className="px-6 py-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-white font-semibold text-sm mb-2">Stream Title <span className="text-brand-red">*</span></label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Exclusive Q&A with me 🔥"
                maxLength={100}
                className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-white placeholder-brand-muted text-sm focus:outline-none focus:border-brand-red transition"
              />
            </div>

            {/* Visibility picker */}
            <div>
              <label className="block text-white font-semibold text-sm mb-2">Who can watch?</label>
              <div className="space-y-2.5">
                {VISIBILITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value)}
                    className={`w-full flex items-start gap-3 text-left px-4 py-3.5 rounded-xl border transition ${
                      visibility === opt.value
                        ? 'border-brand-red bg-brand-red/10'
                        : 'border-brand-border bg-brand-card hover:border-brand-red/40'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      visibility === opt.value ? 'border-brand-red bg-brand-red' : 'border-brand-muted'
                    }`}>
                      {visibility === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${visibility === opt.value ? 'text-white' : 'text-brand-text'}`}>
                        {opt.label}
                      </p>
                      <p className="text-brand-muted text-xs mt-0.5 leading-relaxed">{opt.desc}</p>
                    </div>
                    {visibility === opt.value && (
                      <span className={`ml-auto shrink-0 px-2 py-0.5 rounded-full border text-xs font-bold ${opt.badge}`}>
                        Selected
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-5 py-3 border border-brand-border bg-brand-card text-white font-bold rounded-xl hover:border-brand-red/40 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStart}
                disabled={loading || !title.trim()}
                className="flex-1 px-5 py-3 bg-brand-red text-white font-black rounded-xl hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Starting…</>
                ) : (
                  <>🔴 Start Live Stream</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function CreatorCenterPage() {
  const [showGoLive, setShowGoLive] = useState(false)

  return (
    <div className="p-6">
      {showGoLive && <GoLiveModal onClose={() => setShowGoLive(false)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white font-bold text-xl">Creator Center</h1>
        <div className="flex gap-2">
          <button className="bg-brand-surface border border-brand-border text-brand-text px-4 py-2 rounded-lg text-sm font-bold">Mass Message</button>
          <button
            onClick={() => setShowGoLive(true)}
            className="bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Go Live
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Earnings (Month)', value: '$1,842', trend: '▲ 12%', up: true },
          { label: 'Subscribers', value: '1,254',    trend: '▲ 4%',  up: true },
          { label: 'Followers',   value: '9,816',    trend: '▲ 2%',  up: true },
          { label: 'Messages (7d)', value: '482',    trend: '▼ 3%',  up: false },
        ].map(kpi => (
          <div key={kpi.label} className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <p className="text-brand-muted text-xs mb-1">{kpi.label}</p>
            <p className="text-white font-black text-2xl">{kpi.value}</p>
            <p className={`text-xs font-bold ${kpi.up ? 'text-green-400' : 'text-red-400'}`}>{kpi.trend}</p>
          </div>
        ))}
      </div>

      {/* Earnings summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-brand-surface border border-brand-border rounded-xl p-5">
          <h3 className="text-white font-bold mb-4">Earnings Breakdown</h3>
          <div className="grid grid-cols-2 gap-3">
            {[['Tips','$426'],['Content Sales','$1,098'],['Subscriptions','$278'],['Other','$40']].map(([label, val]) => (
              <div key={label} className="bg-brand-card border border-brand-border rounded-lg p-3">
                <p className="text-brand-muted text-xs">{label}</p>
                <p className="text-white font-black text-xl">{val}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5">
          <h3 className="text-white font-bold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {['Upload Content','Edit Profile','Creator Pricing','Promos','Billing & Payouts'].map(action => (
              <button key={action} className="w-full bg-brand-card border border-brand-border text-brand-text text-sm py-2 rounded-lg hover:border-brand-red transition text-left px-3">
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Financial table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-5">
        <h3 className="text-white font-bold mb-4">Financial Center</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border">
              {['Date','Type','Gross','Platform Tax (25%)','Net','Note'].map(h => (
                <th key={h} className="text-brand-muted text-left pb-2 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['2025-09-01','Subscription','$20.00','$5.00','$15.00','Monthly sub – @NovaRush'],
              ['2025-09-02','Tip','$10.00','$2.50','$7.50','Tip – @LunaVelvet'],
              ['2025-09-03','Sale','$15.00','$3.75','$11.25','Premium photo'],
            ].map((row, i) => (
              <tr key={i} className="border-b border-brand-border">
                {row.map((cell, j) => (
                  <td key={j} className="py-3 text-brand-text">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
