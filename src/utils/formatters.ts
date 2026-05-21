type DisplayAmount = number | string | null | undefined

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

export const formatMxc = (amount: DisplayAmount): string => {
  const numeric = toNumericValue(amount)
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(numeric)} MXC`
}

export const formatFiatCurrency = (amount: DisplayAmount, currency: string = 'VND'): string => {
  const numeric = toNumericValue(amount)
  const normalizedCurrency = currency.toUpperCase()
  const fractionDigits = normalizedCurrency === 'VND' ? 0 : 2

  return `${new Intl.NumberFormat(normalizedCurrency === 'VND' ? 'vi-VN' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(numeric)} ${normalizedCurrency}`
}

export const formatExchangeRate = (
  rate: DisplayAmount,
  fromCurrency: string,
  toCurrency: string = 'VND'
): string => {
  const numeric = toNumericValue(rate)
  return `1 ${fromCurrency.toUpperCase()} = ${formatFiatCurrency(numeric, toCurrency)}`
}

export const formatCurrency = (amount: DisplayAmount, currency: string = 'MXC'): string => {
  return currency.toUpperCase() === 'MXC'
    ? formatMxc(amount)
    : formatFiatCurrency(amount, currency)
}

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return formatDate(date)
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
