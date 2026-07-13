import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { resolveUploadedFileUrl, resolveUploadedFileUrls } from '@/utils/media'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const URL_FIELD_KEYS = new Set([
  'attachmentUrl',
  'avatarUrl',
  'certificateUrl',
  'cvUrl',
  'fileUrl',
  'iconUrl',
  'imageUrl',
  'portfolioEvidenceUrl',
  'portfolioUrl',
  'thumbnailUrl',
  'url',
  'videoIntroUrl',
])
const URL_ARRAY_KEYS = new Set(['attachments', 'evidenceUrls'])

// Do not try to refresh session on auth endpoints (wrong password → 401 is expected)
function isAuthEndpoint(config: InternalAxiosRequestConfig): boolean {
  const path = `${config.baseURL ?? ''}${config.url ?? ''}`.replace(/\\/g, '/')
  return /\/auth\/(login|register|google|github|refresh|forgot-password|reset-password|send-verification|verify-email)(?:\?|$)/i.test(path)
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
  withCredentials: true,
})

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken
    if (token && token !== 'undefined' && token !== 'null' && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // If sending FormData, remove Content-Type header to let axios set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
    }
    
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Helper to normalize backend data to frontend types
const normalizeData = (data: any, parentKey?: string): any => {
  if (!data || typeof data !== 'object') return data

  if (Array.isArray(data)) {
    if (parentKey && URL_ARRAY_KEYS.has(parentKey)) {
      return resolveUploadedFileUrls(data)
    }
    return data.map((item) => normalizeData(item, parentKey))
  }

  const normalized = { ...data }

  // Map 'id' to 'userId', 'jobId', etc. if they are missing
  if (data.id) {
    if (!data.userId && (data.email || data.fullName)) normalized.userId = data.id
    if (!data.jobId && data.title && data.budgetType) normalized.jobId = data.id
    if (!data.courseId && data.slug && data.instructorId) normalized.courseId = data.id
    if (!data.walletId && data.accountType) normalized.walletId = data.id
    if (!data.txnId && data.txnType) normalized.txnId = data.id
  }

  // Recursively normalize children
  Object.keys(normalized).forEach(key => {
    const value = normalized[key]
    if (typeof value === 'string' && URL_FIELD_KEYS.has(key)) {
      normalized[key] = resolveUploadedFileUrl(value) ?? value
      return
    }
    normalized[key] = normalizeData(value, key)
  })

  return normalized
}

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data) {
      response.data.data = normalizeData(response.data.data)
    }
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Refresh only on 401. A 403 is usually a real permission error, not an expired token.
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isAuthEndpoint(originalRequest)) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        if (import.meta.env.DEV) {
          console.debug('401: attempting token refresh...')
        }

        {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, undefined, { withCredentials: true })

          const { accessToken: newAccessToken } = response.data.data || response.data
          if (import.meta.env.DEV) {
            console.debug('Token refreshed')
          }

          useAuthStore.getState().setTokens(newAccessToken)

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          }

          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
