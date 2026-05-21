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

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh', {
      refreshToken,
    })
    return response.data.data
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken })
  },

  logoutAll: async (userId: string): Promise<void> => {
    await apiClient.post(`/auth/logout-all?userId=${userId}`)
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post(`/auth/forgot-password?email=${email}`)
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post(`/auth/reset-password?token=${token}&newPassword=${newPassword}`)
  },

  sendEmailVerification: async (email: string): Promise<void> => {
    await apiClient.post(`/auth/send-verification?email=${email}`)
  },

  verifyEmail: async (token: string): Promise<void> => {
    await apiClient.post(`/auth/verify-email?token=${token}`)
  },

  devVerifyEmail: async (email: string): Promise<void> => {
    await apiClient.post(`/auth/dev-verify?email=${email}`)
  },

  enable2FA: async (userId: string): Promise<void> => {
    await apiClient.post(`/auth/2fa/enable?userId=${userId}`)
  },

  disable2FA: async (userId: string): Promise<void> => {
    await apiClient.post(`/auth/2fa/disable?userId=${userId}`)
  },

  verify2FA: async (userId: string, code: string): Promise<boolean> => {
    const response = await apiClient.post<ApiResponse<boolean>>(
      `/auth/2fa/verify?userId=${userId}&code=${code}`
    )
    return response.data.data
  },
  
  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>('/users/me')
    return response.data.data
  },
}
