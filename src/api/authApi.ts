import apiClient from './client'
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '@/types'

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data)
    return response.data.data
  },

  googleLogin: async (credential: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/google', { credential })
    return response.data.data
  },

  githubLogin: async (code: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/github', { code })
    return response.data.data
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data)
    return response.data.data
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh')
    return response.data.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  logoutAll: async (userId: string): Promise<void> => {
    await apiClient.post(`/auth/admin/users/${encodeURIComponent(userId)}/logout-all`)
  },

  changePassword: async (_userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword })
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post(`/auth/forgot-password?email=${encodeURIComponent(email)}`)
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, newPassword })
  },

  sendEmailVerification: async (email: string): Promise<void> => {
    await apiClient.post(`/auth/send-verification?email=${encodeURIComponent(email)}`)
  },

  verifyEmail: async (token: string): Promise<void> => {
    await apiClient.post(`/auth/verify-email?token=${encodeURIComponent(token)}`)
  },

  setup2FA: async (): Promise<string> => {
    const response = await apiClient.post<ApiResponse<string>>('/auth/2fa/setup')
    return response.data.data
  },

  enable2FA: async (_userId: string, code: string): Promise<void> => {
    await apiClient.post(`/auth/2fa/enable?code=${encodeURIComponent(code)}`)
  },

  disable2FA: async (_userId: string, code: string): Promise<void> => {
    await apiClient.post(`/auth/2fa/disable?code=${encodeURIComponent(code)}`)
  },

  verify2FA: async (_userId: string, code: string): Promise<boolean> => {
    const response = await apiClient.post<ApiResponse<boolean>>(
      `/auth/2fa/verify?code=${encodeURIComponent(code)}`
    )
    return response.data.data
  },
  
  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>('/users/me')
    return response.data.data
  },
}
