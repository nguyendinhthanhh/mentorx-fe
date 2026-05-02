import apiClient from './client'
import {
  ApiResponse,
  PaginatedResponse,
  MentorProfileResponse,
  MentorProfileRequest,
} from '@/types'

export const mentorApi = {
  createMentorProfile: async (userId: string, data: MentorProfileRequest): Promise<MentorProfileResponse> => {
    const response = await apiClient.post<ApiResponse<MentorProfileResponse>>(
      `/mentors/${userId}/profile`,
      data
    )
    return response.data.data
  },

  getMentorProfile: async (userId: string): Promise<MentorProfileResponse> => {
    const response = await apiClient.get<ApiResponse<MentorProfileResponse>>(`/mentors/${userId}/profile`)
    return response.data.data
  },

  updateMentorProfile: async (userId: string, data: MentorProfileRequest): Promise<MentorProfileResponse> => {
    const response = await apiClient.put<ApiResponse<MentorProfileResponse>>(
      `/mentors/${userId}/profile`,
      data
    )
    return response.data.data
  },

  deleteMentorProfile: async (userId: string): Promise<void> => {
    await apiClient.delete(`/mentors/${userId}/profile`)
  },

  getAllApprovedMentors: async (params: {
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
  }): Promise<PaginatedResponse<MentorProfileResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MentorProfileResponse>>>(
      '/mentors',
      { params }
    )
    return response.data.data
  },

  getPendingApplications: async (params: {
    page?: number
    size?: number
  }): Promise<PaginatedResponse<MentorProfileResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MentorProfileResponse>>>(
      '/mentors/pending',
      { params }
    )
    return response.data.data
  },

  searchMentors: async (params: {
    minRating?: number
    maxHourlyRate?: number
    availability?: string
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
  }): Promise<PaginatedResponse<MentorProfileResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MentorProfileResponse>>>(
      '/mentors/search',
      { params }
    )
    return response.data.data
  },

  searchMentorsFullText: async (query: string): Promise<MentorProfileResponse[]> => {
    const response = await apiClient.get<ApiResponse<MentorProfileResponse[]>>(
      `/mentors/search/text?query=${query}`
    )
    return response.data.data
  },

  getFeaturedMentors: async (): Promise<MentorProfileResponse[]> => {
    const response = await apiClient.get<ApiResponse<MentorProfileResponse[]>>('/mentors/featured')
    return response.data.data
  },

  getTopRatedMentors: async (params: {
    page?: number
    size?: number
  }): Promise<PaginatedResponse<MentorProfileResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MentorProfileResponse>>>(
      '/mentors/top-rated',
      { params }
    )
    return response.data.data
  },

  approveMentorApplication: async (userId: string, approvedBy: string): Promise<MentorProfileResponse> => {
    const response = await apiClient.post<ApiResponse<MentorProfileResponse>>(
      `/mentors/${userId}/approve?approvedBy=${approvedBy}`
    )
    return response.data.data
  },

  rejectMentorApplication: async (
    userId: string,
    reason: string,
    rejectedBy: string
  ): Promise<MentorProfileResponse> => {
    const response = await apiClient.post<ApiResponse<MentorProfileResponse>>(
      `/mentors/${userId}/reject?reason=${encodeURIComponent(reason)}&rejectedBy=${rejectedBy}`
    )
    return response.data.data
  },

  setFeaturedStatus: async (userId: string, featured: boolean): Promise<void> => {
    await apiClient.patch(`/mentors/${userId}/featured?featured=${featured}`)
  },

  getApprovedMentorsCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>('/mentors/statistics/approved')
    return response.data.data
  },

  getPendingApplicationsCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>('/mentors/statistics/pending')
    return response.data.data
  },
}
