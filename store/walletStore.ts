import { create } from 'zustand'
import api from '@/lib/api'

interface WalletState {
  balance:    number
  isLoading:  boolean
  fetchBalance:  () => Promise<void>
  deductCoins:   (amount: number) => void
  addCoins:      (amount: number) => void
}

export const useWalletStore = create<WalletState>((set, get) => ({
  balance:   0,
  isLoading: false,

  fetchBalance: async () => {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/wallet/balance')
      set({ balance: data.data.bangcoinsBalance })
    } finally {
      set({ isLoading: false })
    }
  },

  deductCoins: (amount) => set(s => ({ balance: Math.max(0, s.balance - amount) })),
  addCoins:    (amount) => set(s => ({ balance: s.balance + amount })),
}))
