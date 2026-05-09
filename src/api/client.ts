import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken
    if (token && token !== 'undefined' && token !== 'null' && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Helper to normalize backend data to frontend types
const normalizeData = (data: any): any => {
  if (!data || typeof data !== 'object') return data

  if (Array.isArray(data)) {
    return data.map(normalizeData)
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
    normalized[key] = normalizeData(normalized[key])
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

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })

          const { accessToken } = response.data.data
          useAuthStore.getState().setTokens(accessToken, refreshToken)

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
          }

          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
