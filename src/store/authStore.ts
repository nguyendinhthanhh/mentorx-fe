import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserResponse } from '@/types'

interface AuthState {
  user: UserResponse | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setUser: (user: UserResponse) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      setTokens: (accessToken, refreshToken) => {
        if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
          console.warn('Attempted to set invalid accessToken:', accessToken);
          return;
        }
        console.log('Setting new tokens in authStore')
        set({
          accessToken,
          refreshToken,
        })
      },

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      refreshUser: async () => {
        try {
          const { authApi } = await import('@/api/authApi')
          const user = await authApi.getCurrentUser()
          set({ user })
        } catch (error) {
          console.error('Failed to refresh user:', error)
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
