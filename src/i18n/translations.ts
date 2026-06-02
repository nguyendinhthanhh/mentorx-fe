import en from './locales/en'
import vi from './locales/vi'

export type Language = 'en' | 'vi'

export const LANGUAGE_STORAGE_KEY = 'mentorx-language'
export const UI_LANGUAGES: Language[] = ['en', 'vi']

export const languages: Array<{
  code: Language
  label: string
  shortLabel: string
}> = [
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'vi', label: 'Tiếng Việt', shortLabel: 'VI' },
]

export const translations = {
  en,
  vi,
} as const

export type TranslationKey = keyof typeof en

export function isLanguage(value: string | null | undefined): value is Language {
  return value === 'en' || value === 'vi'
}
