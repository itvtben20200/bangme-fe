'use client'

import { useEffect, useState } from 'react'
import { useWalletStore } from '@/store/walletStore'
import { toast } from 'sonner'
import api from '@/lib/api'
import { StripeCheckoutModal } from '@/components/StripeCheckoutModal'
import { calculateCashoutFees, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import CreatorEarningsTab from '@/components/CreatorEarningsTab'
import SubscriberSpendingTab from '@/components/SubscriberSpendingTab'
import { useI18n } from '@/lib/i18n'

type Tab = 'topup' | 'cashout' | 'transactions' | 'earnings' | 'spending'

interface PkgItem { coins: number; price: number }

interface Transaction {
  id: string
  type: string
  bangcoinsAmount: number
  usdAmount: number
  platformFeeUsd: number
  netUsd: number
  status: string
  note: string | null
  createdAt: string
}

interface CreatorProfile {
  preferredPayoutMethod: string | null
  paypalEmail: string | null
  isCreator: boolean
}

const METHOD_LABELS: Record<string, string> = {
  PAYPAL:        'PayPal',
  BANK_TRANSFER: 'Bank Transfer',
}

const TX_TYPE_LABEL: Record<string, string> = {
  TOPUP:        '💳 Top Up',
  CASHOUT:      '💸 Cash Out',
  SUBSCRIPTION: '⭐ Subscription',
  MESSAGE:      '💬 Message',
  TIP:          '🎁 Tip',
  PPV:          '🔒 Pay-per-view',
}

const COPY = {
  en: {
    loadTransactionsError: 'Failed to load transactions',
    invalidAmount: 'Amount must be between 10 and 10,000 BangCoins',
    unexpectedResponse: 'Unexpected response from server',
    payoutSuccess: 'Payout request submitted! Admin will process it within 3-5 business days.',
    payoutError: 'Failed to submit payout request',
    description: 'Used to unlock content, tip creators, send messages, and make calls.',
    currentBalance: 'Current Balance',
    topup: 'Top Up',
    cashout: 'Cash Out',
    transactions: 'Transactions',
    earnings: '💰 My Earnings',
    spending: '🧾 My Spending',
    selectAmount: 'Select Amount',
    customAmount: 'Custom Amount',
    amountPlaceholder: 'Enter amount (10-10,000)',
    select: 'Select',
    loading: 'Loading...',
    creatorsOnly: 'Creators Only',
    creatorOnlyDescription: 'Cash-out is available for verified creators only.',
    becomeCreator: 'Become a Creator',
    payoutMethod: 'Payout Method',
    notSet: 'Not set',
    change: 'Change',
  },
  de: {
    loadTransactionsError: 'Transaktionen konnten nicht geladen werden',
    invalidAmount: 'Der Betrag muss zwischen 10 und 10.000 BangCoins liegen',
    unexpectedResponse: 'Unerwartete Serverantwort',
    payoutSuccess: 'Auszahlungsanfrage eingereicht! Das Team verarbeitet sie innerhalb von 3-5 Werktagen.',
    payoutError: 'Auszahlungsanfrage konnte nicht eingereicht werden',
    description: 'Zum Freischalten von Content, Trinkgeld für Creator, Nachrichten und Anrufe.',
    currentBalance: 'Aktuelles Guthaben',
    topup: 'Aufladen',
    cashout: 'Auszahlen',
    transactions: 'Transaktionen',
    earnings: '💰 Meine Einnahmen',
    spending: '🧾 Meine Ausgaben',
    selectAmount: 'Betrag auswählen',
    customAmount: 'Eigener Betrag',
    amountPlaceholder: 'Betrag eingeben (10-10.000)',
    select: 'Auswählen',
    loading: 'Wird geladen...',
    creatorsOnly: 'Nur für Creator',
    creatorOnlyDescription: 'Auszahlungen sind nur für verifizierte Creator verfügbar.',
    becomeCreator: 'Creator werden',
    payoutMethod: 'Auszahlungsmethode',
    notSet: 'Nicht festgelegt',
    change: 'Ändern',
  },
} as const

export default function BangCoinsPage() {
  const { language } = useI18n()
  const copy = COPY[language]
  const { balance, isLoading, fetchBalance } = useWalletStore()
  const [activeTab, setActiveTab]   = useState<Tab>('topup')
  const [customAmount, setCustomAmount] = useState('')
  const [checkoutPkg, setCheckoutPkg]   = useState<PkgItem | null>(null)

  // Cashout state
  const [cashoutAmount, setCashoutAmount]   = useState('')
  const [cashoutLoading, setCashoutLoading] = useState(false)
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Transactions state
  const [transactions, setTransactions]   = useState<Transaction[]>([])
  const [txLoading, setTxLoading]         = useState(false)
  const [txPage, setTxPage]               = useState(1)
  const [txTotal, setTxTotal]             = useState(0)
  const TX_PER_PAGE = 10

  const packages: PkgItem[] = [
    { coins: 10,  price: 10  },
    { coins: 30,  price: 30  },
    { coins: 50,  price: 50  },
    { coins: 100, price: 100 },
    { coins: 200, price: 200 },
  ]

  useEffect(() => {
    fetchBalance()
  }, [])

  // Load creator profile when Cash Out tab is opened
  useEffect(() => {
    if (activeTab !== 'cashout' || creatorProfile !== null) return
    setProfileLoading(true)
    api.get('/users/me')
      .then(r => {
        const u  = r.data?.data
        const cp = u?.creatorProfile
        const isCreator = u?.role === 'creator' || !!cp
        setCreatorProfile({
          preferredPayoutMethod: cp?.preferredPayoutMethod ?? null,
          paypalEmail:           cp?.paypalEmail           ?? null,
          isCreator,
        })
      })
      .catch(() => {
        setCreatorProfile({ preferredPayoutMethod: null, paypalEmail: null, isCreator: false })
      })
      .finally(() => setProfileLoading(false))
  }, [activeTab])

  // Load transactions when Transactions tab is opened or page changes
  useEffect(() => {
    if (activeTab !== 'transactions') return
    setTxLoading(true)
    api.get(`/wallet/transactions?page=${txPage}&perPage=${TX_PER_PAGE}`)
      .then(r => {
        setTransactions(r.data?.data?.items ?? [])
        setTxTotal(r.data?.data?.meta?.total ?? 0)
      })
      .catch(() => toast.error(copy.loadTransactionsError))
      .finally(() => setTxLoading(false))
  }, [activeTab, txPage])

  const handleSelectPackage = (pkg: PkgItem) => setCheckoutPkg(pkg)

  const handleCustomAmount = () => {
    const amount = parseInt(customAmount)
    if (isNaN(amount) || amount < 10 || amount > 10000) {
      toast.error(copy.invalidAmount)
      return
    }
    setCheckoutPkg({ coins: amount, price: amount })
  }

  const handleConfirmPayment = async (coins: number): Promise<{ success: boolean; bypassedStripe?: boolean }> => {
    const { data } = await api.post('/wallet/topup', { coins })
    if (data.data.bypassedStripe || data.data.clientSecret) {
      fetchBalance()
      return { success: true, bypassedStripe: !!data.data.bypassedStripe }
    }
    throw new Error(copy.unexpectedResponse)
  }

  const grossUSD   = parseFloat(cashoutAmount) || 0
  const fees       = calculateCashoutFees(grossUSD)
  const canCashout = grossUSD >= 20 && balance >= grossUSD && !cashoutLoading

  const handleCashout = async () => {
    if (!canCashout) return
    setCashoutLoading(true)
    try {
      await api.post('/wallet/cashout', { amountUsd: grossUSD })
      toast.success(copy.payoutSuccess)
      setCashoutAmount('')
      fetchBalance()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? copy.payoutError)
    } finally {
      setCashoutLoading(false)
    }
  }

  const totalTxPages = Math.ceil(txTotal / TX_PER_PAGE)

  return (
    <>
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-white font-bold text-xl mb-1">BangCoins Wallet</h1>
      <p className="text-brand-muted text-sm mb-6">
        {copy.description}
      </p>

      {/* Wallet balance */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-5 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center text-3xl">
          🪙
        </div>
        <div>
          <p className="text-brand-muted text-sm">{copy.currentBalance}</p>
          <p className="text-white text-3xl font-black">
            {isLoading ? '...' : balance.toFixed(2)}{' '}
            <span className="text-brand-muted text-base font-normal">BangCoins</span>
          </p>
          <p className="text-brand-muted text-xs mt-0.5">≈ {formatCurrency(isLoading ? 0 : balance)} USD</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'topup',        label: copy.topup        },
          { id: 'cashout',      label: copy.cashout      },
          { id: 'transactions', label: copy.transactions },
          { id: 'earnings',     label: copy.earnings     },
          { id: 'spending',     label: copy.spending     },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === tab.id
                ? 'bg-brand-red text-white'
                : 'bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-card'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Top Up Tab ── */}
      {activeTab === 'topup' && (
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-3">{copy.selectAmount}</h3>
          <div className="grid grid-cols-3 gap-3">
            {packages.map((pkg) => (
              <button
                key={pkg.coins}
                onClick={() => handleSelectPackage(pkg)}
                className="bg-brand-surface border-2 border-brand-border hover:border-[#635bff] rounded-xl p-4 text-center cursor-pointer transition"
              >
                <p className="text-white font-black text-2xl">{pkg.coins}</p>
                <p className="text-brand-muted text-sm">BangCoins</p>
                <p className="text-[#635bff] font-bold mt-1">${pkg.price}</p>
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="mt-4 p-4 bg-brand-surface border border-dashed border-brand-border rounded-xl">
            <p className="text-white font-semibold mb-2">{copy.customAmount}</p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={copy.amountPlaceholder}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="flex-1 bg-brand-card border border-brand-border rounded-lg px-4 py-2 text-white"
                min="10"
                max="10000"
              />
              <button
                onClick={handleCustomAmount}
                disabled={!customAmount}
                className="bg-[#635bff] hover:bg-[#5249e0] text-white font-bold px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copy.select}
              </button>
            </div>
            <p className="text-xs text-brand-muted mt-2">1 BangCoin = $1 USD</p>
          </div>
        </div>
      )}

      {/* ── Cash Out Tab ── */}
      {activeTab === 'cashout' && (
        <div className="space-y-4">
          {profileLoading ? (
            <div className="bg-brand-surface border border-brand-border rounded-xl p-8 text-center text-brand-muted text-sm">
              {copy.loading}
            </div>
          ) : creatorProfile && !creatorProfile.isCreator ? (
            /* Not a creator */
            <div className="bg-brand-surface border border-brand-border rounded-xl p-8 text-center space-y-3">
              <p className="text-4xl">🔒</p>
              <p className="text-white font-semibold">{copy.creatorsOnly}</p>
              <p className="text-brand-muted text-sm">{copy.creatorOnlyDescription}</p>
              <Link href="/become-creator" className="inline-block mt-2 bg-brand-red text-white font-bold px-6 py-2 rounded-lg hover:bg-red-600 transition text-sm">
                {copy.becomeCreator}
              </Link>
            </div>
          ) : (
            <>
              {/* Payout method banner */}
              {creatorProfile && (
                <div className="bg-brand-card border border-brand-border rounded-xl px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-brand-muted text-xs mb-0.5">{copy.payoutMethod}</p>
                    <p className="text-white font-semibold text-sm">
                      {METHOD_LABELS[creatorProfile.preferredPayoutMethod ?? ''] ?? copy.notSet}
                      {creatorProfile.preferredPayoutMethod === 'PAYPAL' && creatorProfile.paypalEmail && (
                        <span className="text-brand-muted font-normal"> — {creatorProfile.paypalEmail}</span>
                      )}
                    </p>
                  </div>
                  <Link href="/settings?tab=creator" className="text-brand-red text-xs font-bold hover:underline">
                    {copy.change}
                  </Link>
                </div>
              )}

              {/* Cashout form */}
              <div className="bg-brand-surface border border-brand-border rounded-xl p-6 space-y-5">
                <div>
                  <label className="block text-white font-semibold text-sm mb-2">
                    Amount to Cash Out (USD) <span className="text-brand-red">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted font-bold">$</span>
                    <input
                      type="number"
                      min="20"
                      step="1"
                      placeholder="Minimum $20"
                      value={cashoutAmount}
                      onChange={(e) => setCashoutAmount(e.target.value)}
                      className="w-full bg-brand-card border border-brand-border rounded-xl pl-8 pr-4 py-3 text-white placeholder-brand-muted focus:outline-none focus:border-brand-red transition"
                    />
                  </div>
                  <p className="text-brand-muted text-xs mt-1.5">
                    Your balance: <span className="text-white font-semibold">{balance.toFixed(2)} BangCoins</span> ≈ {formatCurrency(balance)}
                  </p>
                </div>

                {/* Fee breakdown — shown only when amount is valid */}
                {grossUSD >= 20 && (
                  <div className="bg-brand-card border border-brand-border rounded-xl p-4 space-y-2 text-sm">
                    <p className="text-white font-semibold mb-3">Fee Breakdown</p>
                    <div className="flex justify-between text-brand-muted">
                      <span>Gross amount</span>
                      <span className="text-white">{formatCurrency(fees.grossUSD)}</span>
                    </div>
                    <div className="flex justify-between text-brand-muted">
                      <span>Platform fee (25%)</span>
                      <span className="text-red-400">− {formatCurrency(fees.platformTax)}</span>
                    </div>
                    <div className="flex justify-between text-brand-muted">
                      <span>Processing fee (2.5%)</span>
                      <span className="text-red-400">− {formatCurrency(fees.processingFee)}</span>
                    </div>
                    <div className="border-t border-brand-border pt-2 flex justify-between font-bold">
                      <span className="text-white">You receive</span>
                      <span className="text-green-400 text-base">{formatCurrency(fees.netAmount)}</span>
                    </div>
                  </div>
                )}

                {/* Validation warnings */}
                {cashoutAmount && grossUSD < 20 && (
                  <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                    Minimum payout is $20.
                  </p>
                )}
                {cashoutAmount && grossUSD > balance && (
                  <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                    Amount exceeds your balance of {balance.toFixed(2)} BangCoins.
                  </p>
                )}

                <button
                  onClick={handleCashout}
                  disabled={!canCashout}
                  className="w-full bg-brand-red text-white font-black py-3 rounded-xl hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cashoutLoading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                  ) : (
                    '💸 Request Payout'
                  )}
                </button>

                <p className="text-brand-muted text-xs text-center">
                  Payouts are reviewed by our team and processed within 3–5 business days.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Transactions Tab ── */}
      {activeTab === 'transactions' && (
        <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
          {txLoading ? (
            <div className="p-8 text-center text-brand-muted text-sm">
              <span className="inline-block w-5 h-5 border-2 border-brand-muted/30 border-t-brand-muted rounded-full animate-spin mr-2" />
              Loading transactions…
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-brand-muted text-sm">No transactions yet.</div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border">
                    {['Type', 'Amount', 'USD', 'Note', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-brand-muted text-left px-5 py-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-brand-border hover:bg-brand-card transition">
                      <td className="px-5 py-3 text-white">{TX_TYPE_LABEL[tx.type] ?? tx.type}</td>
                      <td className={`px-5 py-3 font-bold ${tx.netUsd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.netUsd >= 0 ? '+' : ''}{tx.bangcoinsAmount.toFixed(2)} BC
                      </td>
                      <td className={`px-5 py-3 font-semibold ${tx.netUsd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.netUsd >= 0 ? '+' : ''}{formatCurrency(Math.abs(tx.netUsd))}
                      </td>
                      <td className="px-5 py-3 text-brand-muted max-w-[180px] truncate">{tx.note ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          tx.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                          tx.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {tx.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-brand-muted whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalTxPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-brand-border">
                  <p className="text-brand-muted text-xs">{txTotal} transactions total</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTxPage(p => Math.max(1, p - 1))}
                      disabled={txPage === 1}
                      className="px-3 py-1.5 text-xs bg-brand-card border border-brand-border rounded-lg text-brand-text hover:border-brand-red transition disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <span className="px-3 py-1.5 text-xs text-brand-muted">
                      {txPage} / {totalTxPages}
                    </span>
                    <button
                      onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))}
                      disabled={txPage === totalTxPages}
                      className="px-3 py-1.5 text-xs bg-brand-card border border-brand-border rounded-lg text-brand-text hover:border-brand-red transition disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {/* ── Earnings Tab (creators) ── */}
      {activeTab === 'earnings' && <CreatorEarningsTab />}

      {/* ── Spending Tab (subscribers) ── */}
      {activeTab === 'spending' && <SubscriberSpendingTab />}

    </div>

    {/* Stripe Checkout Modal */}
    {checkoutPkg && (
      <StripeCheckoutModal
        pkg={checkoutPkg}
        onClose={() => { setCheckoutPkg(null); setCustomAmount('') }}
        onConfirm={handleConfirmPayment}
      />
    )}
    </>
  )
}
