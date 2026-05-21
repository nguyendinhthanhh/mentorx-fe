import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserResponse } from '@/types'

const ONBOARDING_SKIP_SESSION_KEY = 'mentorx-onboarding-skipped-session'

function readSkippedOnboardingSession(): boolean {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(ONBOARDING_SKIP_SESSION_KEY) === 'true'
}

function writeSkippedOnboardingSession(value: boolean) {
  if (typeof window === 'undefined') return
  if (value) {
    window.sessionStorage.setItem(ONBOARDING_SKIP_SESSION_KEY, 'true')
  } else {
    window.sessionStorage.removeItem(ONBOARDING_SKIP_SESSION_KEY)
  }
}

interface AuthState {
  user: UserResponse | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  skippedOnboardingThisSession: boolean
  setUser: (user: UserResponse) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  skipOnboardingForSession: () => void
  clearSkippedOnboarding: () => void
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
      skippedOnboardingThisSession: readSkippedOnboardingSession(),

      setUser: (user) =>
        set((state) => {
          const skippedOnboardingThisSession = user.isOnboarded ? false : state.skippedOnboardingThisSession
          writeSkippedOnboardingSession(skippedOnboardingThisSession)
          return {
            user,
            isAuthenticated: true,
            skippedOnboardingThisSession,
          }
        }),

      setTokens: (accessToken, refreshToken) => {
        if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
          console.warn('Attempted to set invalid accessToken:', accessToken);
          return;
        }
        console.log('Setting new tokens in authStore')
        writeSkippedOnboardingSession(false)
        set({
          accessToken,
          refreshToken,
          skippedOnboardingThisSession: false,
        })
      },

      skipOnboardingForSession: () =>
        set(() => {
          writeSkippedOnboardingSession(true)
          return {
            skippedOnboardingThisSession: true,
          }
        }),

      clearSkippedOnboarding: () =>
        set(() => {
          writeSkippedOnboardingSession(false)
          return {
            skippedOnboardingThisSession: false,
          }
        }),

      logout: () =>
        set(() => {
          writeSkippedOnboardingSession(false)
          return {
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            skippedOnboardingThisSession: false,
          }
        }),

      refreshUser: async () => {
        try {
          const { authApi } = await import('@/api/authApi')
          const user = await authApi.getCurrentUser()
          set((state) => {
            const skippedOnboardingThisSession = user.isOnboarded ? false : state.skippedOnboardingThisSession
            writeSkippedOnboardingSession(skippedOnboardingThisSession)
            return {
              user,
              skippedOnboardingThisSession,
            }
          })
        } catch (error) {
          console.error('Failed to refresh user:', error)
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
