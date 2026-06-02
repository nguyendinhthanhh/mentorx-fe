import { isLanguage, LANGUAGE_STORAGE_KEY, Language } from '@/i18n/translations'

type DisplayAmount = number | string | null | undefined

const localeMap: Record<Language, string> = {
  en: 'en-US',
  vi: 'vi-VN',
}

const relativeTimeLabels: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
  { unit: 'year', seconds: 60 * 60 * 24 * 365 },
  { unit: 'month', seconds: 60 * 60 * 24 * 30 },
  { unit: 'week', seconds: 60 * 60 * 24 * 7 },
  { unit: 'day', seconds: 60 * 60 * 24 },
  { unit: 'hour', seconds: 60 * 60 },
  { unit: 'minute', seconds: 60 },
]

const toNumericValue = (value: DisplayAmount): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim()
    if (!normalized) return 0
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

export function resolveLanguage(language?: Language): Language {
  if (language) return language
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isLanguage(stored)) return stored
  }
  if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('vi')) {
    return 'vi'
  }
  return 'en'
}

function getLocale(language?: Language): string {
  return localeMap[resolveLanguage(language)]
}

export const formatNumber = (value: DisplayAmount, language?: Language): string => {
  const numeric = toNumericValue(value)
  return new Intl.NumberFormat(getLocale(language), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(numeric)
}

export const formatMxc = (amount: DisplayAmount, language?: Language): string => {
  return `${formatNumber(amount, language)} MXC`
}

export const formatCurrencyMxc = formatMxc

export const formatFiatCurrency = (
  amount: DisplayAmount,
  currency: string = 'VND',
  language?: Language
): string => {
  const numeric = toNumericValue(amount)
  const normalizedCurrency = currency.toUpperCase()
  const fractionDigits = normalizedCurrency === 'VND' ? 0 : 2

  return `${new Intl.NumberFormat(getLocale(language), {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(numeric)} ${normalizedCurrency}`
}

export const formatExchangeRate = (
  rate: DisplayAmount,
  fromCurrency: string,
  toCurrency: string = 'VND',
  language?: Language
): string => {
  const numeric = toNumericValue(rate)
  return `1 ${fromCurrency.toUpperCase()} = ${formatFiatCurrency(numeric, toCurrency, language)}`
}

export const formatCurrency = (
  amount: DisplayAmount,
  currency: string = 'MXC',
  language?: Language
): string => {
  return currency.toUpperCase() === 'MXC'
    ? formatMxc(amount, language)
    : formatFiatCurrency(amount, currency, language)
}

export const formatDate = (date: string | Date, language?: Language): string => {
  return new Intl.DateTimeFormat(getLocale(language), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export const formatDateTime = (date: string | Date, language?: Language): string => {
  return new Intl.DateTimeFormat(getLocale(language), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export const formatRelativeTime = (date: string | Date, language?: Language): string => {
  const currentLanguage = resolveLanguage(language)
  const locale = getLocale(currentLanguage)
  const now = new Date()
  const target = new Date(date)
  const diffInSeconds = Math.floor((target.getTime() - now.getTime()) / 1000)
  const absoluteSeconds = Math.abs(diffInSeconds)

  if (absoluteSeconds < 45) {
    return currentLanguage === 'vi' ? 'vừa xong' : 'just now'
  }

  for (const entry of relativeTimeLabels) {
    if (absoluteSeconds >= entry.seconds) {
      const value = Math.round(diffInSeconds / entry.seconds)
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, entry.unit)
    }
  }

  return formatDate(date, currentLanguage)
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}
