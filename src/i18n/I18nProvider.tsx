import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { userApi } from '@/api/userApi'
import { useAuthStore } from '@/store/authStore'
import { SupportedLanguage, UserUpdateRequest } from '@/types'

import { isLanguage, LANGUAGE_STORAGE_KEY, Language, TranslationKey, translations } from './translations'

type TranslateParams = Record<string, string | number>

interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey, params?: TranslateParams) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function normalizeLanguage(value?: string | null): Language | null {
  const normalized = value?.toLowerCase()
  return isLanguage(normalized) ? normalized : null
}

function detectBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en'
  return navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en'
}

function readStoredLanguage(): Language | null {
  if (typeof window === 'undefined') return null
  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY))
}

function getInitialLanguage(): Language {
  return readStoredLanguage() || detectBrowserLanguage() || 'en'
}

function toSupportedLanguage(language: Language): SupportedLanguage {
  return language === 'vi' ? SupportedLanguage.VI : SupportedLanguage.EN
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, setUser } = useAuthStore()
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)
  const syncedPreferenceUserIdRef = useRef<string | null>(null)

  const applyLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLanguage
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    if (!user?.userId) {
      syncedPreferenceUserIdRef.current = null
      return
    }

    if (syncedPreferenceUserIdRef.current === user.userId) return
    syncedPreferenceUserIdRef.current = user.userId

    const preferredLanguage = normalizeLanguage(user.preferredLanguage)
    if (preferredLanguage) {
      applyLanguage(preferredLanguage)
    }
  }, [applyLanguage, user?.preferredLanguage, user?.userId])

  const setLanguage = useCallback(
    (nextLanguage: Language) => {
      applyLanguage(nextLanguage)

      if (!isAuthenticated || !user?.userId || normalizeLanguage(user.preferredLanguage) === nextLanguage) {
        return
      }

      const optimisticUser = {
        ...user,
        preferredLanguage: toSupportedLanguage(nextLanguage),
      }
      setUser(optimisticUser)

      void userApi
        .updateUser(
          user.userId,
          {
            preferredLanguage: toSupportedLanguage(nextLanguage),
          } as UserUpdateRequest
        )
        .then((updatedUser) => {
          setUser({
            ...optimisticUser,
            ...updatedUser,
          })
        })
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.error('Failed to persist language preference', error)
          }
        })
    },
    [applyLanguage, isAuthenticated, setUser, user]
  )

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: TranslationKey, params?: TranslateParams) => {
      const selectedTranslation = translations[language][key]
      const fallbackTranslation = translations.en[key]

      if (!selectedTranslation && import.meta.env.DEV) {
        console.warn(`[i18n] Missing translation for "${key}" in "${language}", falling back to English.`)
      }

      const template = selectedTranslation || fallbackTranslation || key
      if (!params) return template

      return Object.entries(params).reduce<string>(
        (text, [paramKey, paramValue]) => text.split(`{{${paramKey}}}`).join(String(paramValue)),
        template
      )
    }

    return { language, setLanguage, t }
  }, [language, setLanguage])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
