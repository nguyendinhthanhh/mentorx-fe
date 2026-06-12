const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const ABSOLUTE_URL_REGEX = /^https?:\/\//i
const LEGACY_UPLOAD_PATH_REGEX = /^\/?uploads\//i

function getBackendBaseUrl() {
  if (ABSOLUTE_URL_REGEX.test(API_BASE_URL)) {
    return API_BASE_URL.replace(/\/api\/?$/i, '')
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:8080'
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}

export function resolveUploadedFileUrl(value?: string | null) {
  const normalized = value?.trim()
  if (!normalized) {
    return undefined
  }

  if (ABSOLUTE_URL_REGEX.test(normalized)) {
    return normalized
  }

  if (LEGACY_UPLOAD_PATH_REGEX.test(normalized)) {
    const backendBaseUrl = getBackendBaseUrl()
    const uploadPath = normalized.startsWith('/') ? normalized : `/${normalized}`
    return backendBaseUrl ? `${backendBaseUrl}${uploadPath}` : uploadPath
  }

  return normalized
}

export function resolveUploadedFileUrls(values?: Array<string | null | undefined>) {
  if (!values?.length) {
    return values
  }

  return values.map((value) => resolveUploadedFileUrl(value) ?? '')
}
