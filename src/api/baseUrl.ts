const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const ABSOLUTE_URL_REGEX = /^https?:\/\//i

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, '')
}

function normalizeApiBaseUrl(value: string) {
  const trimmed = trimTrailingSlashes(value.trim())

  if (ABSOLUTE_URL_REGEX.test(trimmed) && !/\/api$/i.test(trimmed)) {
    return `${trimmed}/api`
  }

  return trimmed || '/api'
}

export const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL)

export function getBackendBaseUrl() {
  if (ABSOLUTE_URL_REGEX.test(API_BASE_URL)) {
    return API_BASE_URL.replace(/\/api$/i, '')
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}

