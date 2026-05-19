import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { LANGUAGE_STORAGE_KEY, Language, TranslationKey, translations } from './translations'

type TranslateParams = Record<string, string | number>

interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey, params?: TranslateParams) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getInitialLanguage(): Language {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (saved === 'en' || saved === 'vi') return saved

  const browserLanguage = navigator.language.toLowerCase()
  return browserLanguage.startsWith('vi') ? 'vi' : 'en'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
  }

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: TranslationKey, params?: TranslateParams) => {
      const template: string = translations[language][key] || translations.en[key] || key
      if (!params) return template

      return Object.entries(params).reduce<string>(
        (text, [paramKey, paramValue]) => text.split(`{{${paramKey}}}`).join(String(paramValue)),
        template
      )
    }

    return { language, setLanguage, t }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
