import apiClient from './client'
import {
  ApiResponse,
  PaginatedResponse,
  UserResponse,
  UserCreateRequest,
  UserUpdateRequest,
  UserStatus,
  MentorStatus,
} from '@/types'

export const userApi = {
  createUser: async (data: UserCreateRequest): Promise<UserResponse> => {
    const response = await apiClient.post<ApiResponse<UserResponse>>('/users', data)
    return response.data.data
  },

  getUserById: async (userId: string): Promise<UserResponse> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>(`/users/${userId}`)
    return response.data.data
  },

  getUserByEmail: async (email: string): Promise<UserResponse> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>(`/users/email/${email}`)
    return response.data.data
  },

  updateUser: async (userId: string, data: UserUpdateRequest): Promise<UserResponse> => {
    const response = await apiClient.put<ApiResponse<UserResponse>>(`/users/${userId}`, data)
    return response.data.data
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}`)
  },

  softDeleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/soft`)
  },

  updateUserStatus: async (userId: string, status: UserStatus): Promise<UserResponse> => {
    const response = await apiClient.patch<ApiResponse<UserResponse>>(
      `/users/${userId}/status?status=${status}`
    )
    return response.data.data
  },

  updateMentorStatus: async (userId: string, mentorStatus: MentorStatus): Promise<UserResponse> => {
    const response = await apiClient.patch<ApiResponse<UserResponse>>(
      `/users/${userId}/mentor-status?mentorStatus=${mentorStatus}`
    )
    return response.data.data
  },

  getAllUsers: async (params: {
    status?: UserStatus
    mentorStatus?: MentorStatus
    search?: string
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
  }): Promise<PaginatedResponse<UserResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<UserResponse>>>('/users', {
      params,
    })
    return response.data.data
  },

  searchUsers: async (query: string): Promise<UserResponse[]> => {
    const response = await apiClient.get<ApiResponse<UserResponse[]>>(`/users/search?query=${query}`)
    return response.data.data
  },

  updateLastSeenAt: async (userId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/last-seen`)
  },

  getInactiveUsers: async (days: number = 30): Promise<UserResponse[]> => {
    const response = await apiClient.get<ApiResponse<UserResponse[]>>(`/users/inactive?days=${days}`)
    return response.data.data
  },

  getTotalUsersCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>('/users/statistics/total')
    return response.data.data
  },

  getActiveUsersCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>('/users/statistics/active')
    return response.data.data
  },

  getMentorsCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>('/users/statistics/mentors')
    return response.data.data
  },

  getPendingMentorApplicationsCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>('/users/statistics/pending-mentors')
    return response.data.data
  },

}

