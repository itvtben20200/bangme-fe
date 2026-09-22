'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { ToggleLeft, ToggleRight, RefreshCw, Save } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface PlatformSettings {
  id:                   string
  platformFeePercent:   number
  processingFeePercent: number
  minPayoutUsd:         number
  maxPostSizeMb:        number
  maxAvatarSizeMb:      number
  maxBioLength:         number
  supportEmail:         string
  maintenanceMode:      boolean
  registrationsOpen:    boolean
  creatorApplyOpen:     boolean
  liveEnabled:          boolean
  payoutsEnabled:       boolean
  updatedAt:            string
}

const FEATURE_FLAGS: { id: keyof PlatformSettings; label: string; description: string }[] = [
  { id: 'maintenanceMode',   label: 'Maintenance Mode',     description: 'Show a maintenance page to all non-admin users.' },
  { id: 'registrationsOpen', label: 'Open Registrations',   description: 'Allow new users to register. Disable to freeze sign-ups.' },
  { id: 'creatorApplyOpen',  label: 'Creator Applications', description: 'Allow users to apply to become creators.' },
  { id: 'liveEnabled',       label: 'Live Streaming',       description: 'Enable the live streaming feature globally.' },
  { id: 'payoutsEnabled',    label: 'Payouts',              description: 'Allow creators to request payouts.' },
]

const REVENUE_FIELDS = [
  { key: 'platformFeePercent'   as const, label: 'Platform Fee (%)',        min: 0,  max: 100,  step: 0.5 },
  { key: 'processingFeePercent' as const, label: 'Processing Fee (%)',      min: 0,  max: 20,   step: 0.1 },
  { key: 'minPayoutUsd'         as const, label: 'Min Payout (USD)',        min: 1,  max: 500,  step: 1   },
  { key: 'maxPostSizeMb'        as const, label: 'Max Post Size (MB)',      min: 1,  max: 2000, step: 1   },
  { key: 'maxAvatarSizeMb'      as const, label: 'Max Avatar Size (MB)',    min: 1,  max: 50,   step: 1   },
  { key: 'maxBioLength'         as const, label: 'Max Bio Length (chars)',  min: 50, max: 2000, step: 10  },
]

export default function AdminSettingsPage() {
  const qc = useQueryClient()

  const { data: settings, isLoading, isError } = useQuery<PlatformSettings>({
    queryKey: ['admin', 'settings'],
    queryFn:  () => api.get('/admin/settings').then(r => r.data.data),
  })

  const [form, setForm] = useState({
    platformFeePercent: 20, processingFeePercent: 2.9, minPayoutUsd: 50,
    maxPostSizeMb: 500, maxAvatarSizeMb: 5, maxBioLength: 500,
    supportEmail: 'support@bangme.app',
  })

  useEffect(() => {
    if (!settings) return
    setForm({
      platformFeePercent:   settings.platformFeePercent,
      processingFeePercent: settings.processingFeePercent,
      minPayoutUsd:         settings.minPayoutUsd,
      maxPostSizeMb:        settings.maxPostSizeMb,
      maxAvatarSizeMb:      settings.maxAvatarSizeMb,
      maxBioLength:         settings.maxBioLength,
      supportEmail:         settings.supportEmail,
    })
  }, [settings])

  const patchMutation = useMutation({
    mutationFn: (patch: Partial<PlatformSettings>) => api.patch('/admin/settings', patch),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'settings'] }); toast.success('Settings saved') },
    onError:    () => toast.error('Failed to save settings'),
  })

  function toggleFlag(id: keyof PlatformSettings) {
    if (!settings) return
    patchMutation.mutate({ [id]: !settings[id] })
  }

  return (
    <div>
      {/* Header — matches all other admin pages */}
      <header className="sticky top-0 z-10 bg-brand-dark border-b border-brand-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">Platform Settings</h1>
          {settings && (
            <p className="text-brand-muted text-xs mt-0.5">
              Last updated: {new Date(settings.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['admin', 'settings'] })}
            className="flex items-center gap-2 bg-brand-surface border border-brand-border text-brand-text px-3 py-1.5 rounded-lg text-sm hover:border-brand-red transition"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => patchMutation.mutate(form)}
            disabled={patchMutation.isPending || isLoading}
            className="flex items-center gap-2 bg-brand-red hover:bg-brand-red/90 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition"
          >
            <Save size={14} />
            {patchMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </header>

      {isLoading && (
        <div className="p-6 flex items-center gap-2 text-brand-muted text-sm">
          <RefreshCw size={14} className="animate-spin" /> Loading settings…
        </div>
      )}

      {isError && (
        <div className="p-6 text-red-400 text-sm">
          Failed to load platform settings. Check the API connection.
        </div>
      )}

      {settings && (
        <div className="p-6 space-y-6">

          {/* Revenue & Limits */}
          <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-brand-border">
              <p className="text-white font-semibold text-sm">Revenue &amp; Limits</p>
              <p className="text-brand-muted text-xs mt-0.5">
                Creator share: <span className="text-white font-semibold">{(100 - form.platformFeePercent).toFixed(1)}%</span>
              </p>
            </div>
            <div className="divide-y divide-brand-border">
              {REVENUE_FIELDS.map(({ key, label, min, max, step }) => (
                <div key={key} className="px-5 py-3 flex items-center justify-between gap-6">
                  <span className="text-brand-muted text-sm w-48 flex-shrink-0">{label}</span>
                  <input
                    type="number"
                    min={min} max={max} step={step}
                    value={form[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="bg-brand-dark border border-brand-border rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-brand-red w-36 text-right"
                  />
                </div>
              ))}
              <div className="px-5 py-3 flex items-center justify-between gap-6">
                <span className="text-brand-muted text-sm w-48 flex-shrink-0">Support Email</span>
                <input
                  type="email"
                  value={form.supportEmail}
                  onChange={e => setForm(prev => ({ ...prev, supportEmail: e.target.value }))}
                  className="bg-brand-dark border border-brand-border rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-brand-red w-64 text-right"
                />
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-brand-border">
              <p className="text-white font-semibold text-sm">Feature Flags</p>
              <p className="text-brand-muted text-xs mt-0.5">Changes persist to the database immediately on toggle.</p>
            </div>
            <div className="divide-y divide-brand-border">
              {FEATURE_FLAGS.map(({ id, label, description }) => {
                const active = settings[id] as boolean
                return (
                  <div key={id} className="px-5 py-3 flex items-center justify-between gap-6">
                    <div>
                      <p className="text-white text-sm">{label}</p>
                      <p className="text-brand-muted text-xs mt-0.5">{description}</p>
                    </div>
                    <button
                      onClick={() => toggleFlag(id)}
                      disabled={patchMutation.isPending}
                      aria-label={active ? `Disable ${label}` : `Enable ${label}`}
                      className="flex-shrink-0 disabled:opacity-50 transition"
                    >
                      {active
                        ? <ToggleRight size={30} className="text-brand-red" />
                        : <ToggleLeft  size={30} className="text-brand-muted" />
                      }
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Security Overview */}
          <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-brand-border">
              <p className="text-white font-semibold text-sm">Security Overview</p>
              <p className="text-brand-muted text-xs mt-0.5">Read-only — controlled via environment variables.</p>
            </div>
            <div className="divide-y divide-brand-border">
              {[
                { label: 'JWT Access Token TTL',  value: '1 day' },
                { label: 'JWT Refresh Token TTL', value: '7 days' },
                { label: 'Cookie SameSite',        value: 'Strict (dev) / None (prod)' },
                { label: 'Cookie Secure',          value: 'No (dev) / Yes (prod)' },
                { label: 'Rate Limiting',          value: '100 req / 15 min per IP' },
                { label: 'Password Hashing',       value: 'bcrypt (12 rounds)' },
                { label: 'Stripe Mode',            value: process.env.NEXT_PUBLIC_STRIPE_MODE === 'live' ? '🟢 Live' : '🟡 Test' },
              ].map(row => (
                <div key={row.label} className="px-5 py-3 flex items-center justify-between">
                  <span className="text-brand-muted text-sm">{row.label}</span>
                  <span className="text-white text-sm font-mono">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
