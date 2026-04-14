import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'

export type Role = 'user' | 'creator' | 'admin'

export interface User {
  id:          string
  username:    string
  email:       string
  displayName: string | null
  avatarKey:   string | null
  role:        Role
  isVerified:  boolean
}

interface AuthState {
  user:            User | null
  accessToken:     string | null
  isAuthenticated: boolean
  login:           (identifier: string, password: string) => Promise<void>
  register:        (username: string, email: string, password: string, role?: Role, adminSecret?: string) => Promise<{ message: string; devVerifyUrl?: string }>
  logout:          () => void
  refreshSession:  () => Promise<void>
  restoreSession:  () => Promise<void>
  updateRole:      (role: Role) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      accessToken:     null,
      isAuthenticated: false,

      login: async (identifier, password) => {
        const { data } = await api.post('/auth/login', { identifier, password })
        set({ user: data.data.user, accessToken: data.data.accessToken, isAuthenticated: true })
      },

      register: async (username, email, password, role = 'user', adminSecret) => {
        const { data } = await api.post('/auth/register', {
          username, email, password, role,
          ...(adminSecret ? { adminSecret } : {}),
        })
        // Registration does not log in — user must verify email first
        return data.data as { message: string; devVerifyUrl?: string }
      },

      logout: () => {
        api.post('/auth/logout').catch(() => {})
        set({ user: null, accessToken: null, isAuthenticated: false })
      },

      refreshSession: async () => {
        const { data } = await api.post('/auth/refresh')
        set({ accessToken: data.data.accessToken, isAuthenticated: true })
      },

      restoreSession: async () => {
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data.data, isAuthenticated: true })
        } catch {
          set({ user: null, accessToken: null, isAuthenticated: false })
        }
      },

      updateRole: (role) =>
        set((s) => ({ user: s.user ? { ...s.user, role } : null })),
    }),
    {
      name: 'bangme-auth',
      partialize: (state) => ({
        accessToken:     state.accessToken,
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
