'use client'

import { useEffect } from 'react'
import { useWalletStore } from '@/store/walletStore'
import { useRouter } from 'next/navigation'
import { Coins, Plus } from 'lucide-react'

export function BalanceWidget() {
  const { balance, isLoading, fetchBalance } = useWalletStore()
  const router = useRouter()

  useEffect(() => {
    fetchBalance()
    // Refresh balance every 30 seconds
    const interval = setInterval(() => {
      fetchBalance()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchBalance])

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => router.push('/bangcoins')}
        className="flex items-center gap-2 bg-brand-surface border border-brand-border hover:border-yellow-500/50 rounded-lg px-3 py-1.5 transition group"
        title="Your BangCoins balance"
      >
        <Coins size={16} className="text-yellow-500 group-hover:animate-bounce" />
        <span className="text-white font-semibold text-sm">
          {isLoading ? '...' : balance.toFixed(0)}
        </span>
        <span className="text-brand-muted text-xs">BangCoins</span>
      </button>
      <button
        onClick={() => router.push('/bangcoins')}
        className="bg-brand-red hover:bg-red-600 text-white rounded-lg p-1.5 transition"
        title="Top up BangCoins"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
