'use client'

import { useEffect, useState } from 'react'
import { useWalletStore } from '@/store/walletStore'
import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe'
import { CheckoutForm } from '@/components/CheckoutForm'
import { toast } from 'sonner'
import api from '@/lib/api'

type Tab = 'topup' | 'cashout' | 'transactions'

export default function BangCoinsPage() {
  const { balance, isLoading, fetchBalance } = useWalletStore()
  const [activeTab, setActiveTab] = useState<Tab>('topup')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const packages = [
    { coins: 10,  price: 10  },
    { coins: 30,  price: 30  },
    { coins: 50,  price: 50  },
    { coins: 100, price: 100 },
    { coins: 200, price: 200 },
  ]

  useEffect(() => {
    fetchBalance()
  }, [])

  const handleSelectPackage = async (coins: number) => {
    setSelectedAmount(coins)
    setCustomAmount('')
    await createPaymentIntent(coins)
  }

  const handleCustomAmount = async () => {
    const amount = parseInt(customAmount)
    if (isNaN(amount) || amount < 10 || amount > 10000) {
      toast.error('Amount must be between 10 and 10,000 BangCoins')
      return
    }
    setSelectedAmount(amount)
    await createPaymentIntent(amount)
  }

  const createPaymentIntent = async (coins: number) => {
    setProcessing(true)
    try {
      const { data } = await api.post('/wallet/topup', { coins })

      if (data.data.bypassedStripe) {
        toast.success(`${data.data.creditedCoins} BangCoins added successfully!`)
        setClientSecret(null)
        setSelectedAmount(null)
        setCustomAmount('')
        fetchBalance()
        return
      }

      setClientSecret(data.data.clientSecret)
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to create payment intent')
      setSelectedAmount(null)
    } finally {
      setProcessing(false)
    }
  }

  const onPaymentSuccess = () => {
    toast.success('BangCoins added successfully!')
    setClientSecret(null)
    setSelectedAmount(null)
    setCustomAmount('')
    fetchBalance()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-white font-bold text-xl mb-1">BangCoins Wallet</h1>
      <p className="text-brand-muted text-sm mb-6">
        Used to unlock content, tip creators, send messages, and make calls.
      </p>

      {/* Wallet balance */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-5 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center text-3xl">
          🪙
        </div>
        <div>
          <p className="text-brand-muted text-sm">Current Balance</p>
          <p className="text-white text-3xl font-black">
            {isLoading ? '...' : balance.toFixed(2)}{' '}
            <span className="text-brand-muted text-base font-normal">BangCoins</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'topup', label: 'Top Up' },
          { id: 'cashout', label: 'Cash Out' },
          { id: 'transactions', label: 'Transactions' },
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

      {/* Top Up Tab */}
      {activeTab === 'topup' && (
        <>
          {/* Packages */}
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">Select Amount</h3>
            <div className="grid grid-cols-3 gap-3">
              {packages.map((pkg) => (
                <button
                  key={pkg.coins}
                  onClick={() => handleSelectPackage(pkg.coins)}
                  disabled={processing}
                  className={`bg-brand-surface border-2 rounded-xl p-4 text-center cursor-pointer transition ${
                    selectedAmount === pkg.coins
                      ? 'border-brand-red bg-brand-red/10'
                      : 'border-brand-border hover:border-brand-red'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <p className="text-white font-black text-2xl">{pkg.coins}</p>
                  <p className="text-brand-muted text-sm">BangCoins</p>
                  <p className="text-brand-red font-bold mt-1">${pkg.price}</p>
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="mt-4 p-4 bg-brand-surface border border-dashed border-brand-border rounded-xl">
              <p className="text-white font-semibold mb-2">Custom Amount</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Enter amount (10-10,000)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="flex-1 bg-brand-card border border-brand-border rounded-lg px-4 py-2 text-white"
                  min="10"
                  max="10000"
                />
                <button
                  onClick={handleCustomAmount}
                  disabled={processing || !customAmount}
                  className="bg-brand-red text-white font-bold px-6 py-2 rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Select
                </button>
              </div>
              <p className="text-xs text-brand-muted mt-2">1 BangCoin = $1 USD</p>
            </div>
          </div>

          {/* Stripe Checkout */}
          {clientSecret && selectedAmount && (
            <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
              <h3 className="text-white font-bold mb-4 flex items-center justify-between">
                <span>Payment Details</span>
                <span className="text-brand-red text-lg">${selectedAmount}</span>
              </h3>

              <Elements
                stripe={getStripe()}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#ff0050',
                      colorBackground: '#1a1a1a',
                      colorText: '#ffffff',
                      colorDanger: '#ff0050',
                      fontFamily: 'system-ui, sans-serif',
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <CheckoutForm 
                  onSuccess={onPaymentSuccess}
                  amount={selectedAmount}
                />
              </Elements>

              {/* Test card info */}
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 text-xs font-semibold mb-2">💳 Test Card (Development)</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-brand-muted">Card:</span>{' '}
                    <span className="text-white font-mono">4242 4242 4242 4242</span>
                  </div>
                  <div>
                    <span className="text-brand-muted">Expiry:</span>{' '}
                    <span className="text-white font-mono">12/34</span>
                  </div>
                  <div>
                    <span className="text-brand-muted">CVC:</span>{' '}
                    <span className="text-white font-mono">123</span>
                  </div>
                  <div>
                    <span className="text-brand-muted">ZIP:</span>{' '}
                    <span className="text-white font-mono">12345</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {processing && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
              <p className="text-brand-muted text-sm mt-2">Processing...</p>
            </div>
          )}
        </>
      )}

      {/* Cash Out Tab */}
      {activeTab === 'cashout' && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 text-center">
          <p className="text-white font-semibold mb-2">Cash Out (Creators Only)</p>
          <p className="text-brand-muted text-sm">
            This feature is available for verified creators. Convert your earnings to USD.
          </p>
          <button className="mt-4 bg-brand-card border border-brand-border text-brand-text px-6 py-2 rounded-lg hover:bg-brand-surface transition">
            Request Payout
          </button>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
          <p className="text-center text-brand-muted text-sm">No transactions yet</p>
        </div>
      )}
    </div>
  )
}
