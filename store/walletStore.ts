import { create } from 'zustand'
import api from '@/lib/api'

interface WalletState {
  balance:    number
  isLoading:  boolean
  error:      string | null
  fetchBalance:  () => Promise<void>
  deductCoins:   (amount: number) => void
  addCoins:      (amount: number) => void
  hasEnoughBalance: (amount: number) => boolean
}

export const useWalletStore = create<WalletState>((set, get) => ({
  balance:   0,
  isLoading: false,
  error:     null,

  fetchBalance: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get('/wallet/balance')
      set({ balance: data.data.balance || 0 })
    } catch (err: any) {
      set({ error: err.message })
    } finally {
      set({ isLoading: false })
    }
  },

  deductCoins: (amount) => set(s => ({ balance: Math.max(0, s.balance - amount) })),
  addCoins:    (amount) => set(s => ({ balance: s.balance + amount })),
  hasEnoughBalance: (amount) => get().balance >= amount,
}))
