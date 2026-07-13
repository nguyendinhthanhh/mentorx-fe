import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserMode, UserResponse } from '@/types'
import { canSwitchToMentorMode, getAvailableModes } from '@/utils/roleRedirect'

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
  isAuthenticated: boolean
  currentMode: UserMode
  skippedOnboardingThisSession: boolean
  setUser: (user: UserResponse) => void
  setCurrentMode: (mode: UserMode) => void
  setTokens: (accessToken: string) => void
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
      isAuthenticated: false,
      currentMode: UserMode.USER,
      skippedOnboardingThisSession: readSkippedOnboardingSession(),

      setUser: (user) =>
        set((state) => {
          const skippedOnboardingThisSession = user.isOnboarded ? false : state.skippedOnboardingThisSession
          const availableModes = getAvailableModes(user)
          const requestedMode = user.currentMode || state.currentMode
          const currentMode =
            requestedMode === UserMode.MENTOR && availableModes.includes(UserMode.MENTOR)
              ? UserMode.MENTOR
              : UserMode.USER
          writeSkippedOnboardingSession(skippedOnboardingThisSession)
          return {
            user: {
              ...user,
              availableModes,
              currentMode,
            },
            isAuthenticated: true,
            currentMode,
            skippedOnboardingThisSession,
          }
        }),

      setCurrentMode: (mode) =>
        set((state) => {
          const availableModes = getAvailableModes(state.user)
          const currentMode =
            mode === UserMode.MENTOR && availableModes.includes(UserMode.MENTOR)
              ? UserMode.MENTOR
              : UserMode.USER

          return {
            currentMode,
            user: state.user
              ? {
                  ...state.user,
                  availableModes,
                  currentMode,
                }
              : state.user,
          }
        }),

      setTokens: (accessToken) => {
        if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
          console.warn('Attempted to set invalid accessToken:', accessToken);
          return;
        }
        console.log('Setting new tokens in authStore')
        writeSkippedOnboardingSession(false)
        set({
          accessToken,
          currentMode: UserMode.USER,
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
          const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
          void fetch(`${apiBase}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
          }).catch(() => undefined)
          writeSkippedOnboardingSession(false)
          return {
            user: null,
            accessToken: null,
            isAuthenticated: false,
            currentMode: UserMode.USER,
            skippedOnboardingThisSession: false,
          }
        }),

      refreshUser: async () => {
        try {
          const { authApi } = await import('@/api/authApi')
          const user = await authApi.getCurrentUser()
          set((state) => {
            const skippedOnboardingThisSession = user.isOnboarded ? false : state.skippedOnboardingThisSession
            const availableModes = getAvailableModes(user)
            const currentMode =
              state.currentMode === UserMode.MENTOR && canSwitchToMentorMode(user)
                ? UserMode.MENTOR
                : UserMode.USER
            writeSkippedOnboardingSession(skippedOnboardingThisSession)
            return {
              user: {
                ...user,
                availableModes,
                currentMode,
              },
              currentMode,
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
        currentMode: state.currentMode,
      }),
    }
  )
)
