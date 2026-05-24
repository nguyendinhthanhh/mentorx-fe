import apiClient from './client'
import { ApiResponse, BankAccountResponse, MentorProfileResponse, PaginatedResponse } from '@/types'

type PageParams = {
  page?: number
  size?: number
}

type ModerationReasonPayload = {
  reason: string
}

export const adminMentorVerificationApi = {
  getExpertiseQueue: async (params: PageParams = {}): Promise<PaginatedResponse<MentorProfileResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MentorProfileResponse>>>(
      '/v1/admin/mentor-applications',
      { params }
    )
    return response.data.data
  },

  getExpertiseApplication: async (userId: string): Promise<MentorProfileResponse> => {
    const response = await apiClient.get<ApiResponse<MentorProfileResponse>>(`/v1/admin/mentor-applications/${userId}`)
    return response.data.data
  },

  getIdentityQueue: async (params: PageParams = {}): Promise<PaginatedResponse<MentorProfileResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MentorProfileResponse>>>(
      '/v1/admin/mentor-identity',
      { params }
    )
    return response.data.data
  },

  getPayoutQueue: async (params: PageParams = {}): Promise<PaginatedResponse<MentorProfileResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MentorProfileResponse>>>(
      '/v1/admin/mentor-payouts',
      { params }
    )
    return response.data.data
  },

  approveExpertise: async (userId: string): Promise<MentorProfileResponse> => {
    const response = await apiClient.post<ApiResponse<MentorProfileResponse>>(
      `/v1/admin/mentor-applications/${userId}/approve-expertise`
    )
    return response.data.data
  },

  rejectExpertise: async (userId: string, reason: string): Promise<MentorProfileResponse> => {
    const response = await apiClient.post<ApiResponse<MentorProfileResponse>>(
      `/v1/admin/mentor-applications/${userId}/reject-expertise`,
      { reason } satisfies ModerationReasonPayload
    )
    return response.data.data
  },

  requestMoreInfo: async (userId: string, reason: string): Promise<MentorProfileResponse> => {
    const response = await apiClient.post<ApiResponse<MentorProfileResponse>>(
      `/v1/admin/mentor-applications/${userId}/request-more-info`,
      { reason } satisfies ModerationReasonPayload
    )
    return response.data.data
  },

  suspendMentor: async (userId: string, reason: string): Promise<MentorProfileResponse> => {
    const response = await apiClient.post<ApiResponse<MentorProfileResponse>>(
      `/v1/admin/mentors/${userId}/suspend`,
      { reason } satisfies ModerationReasonPayload
    )
    return response.data.data
  },

  approveIdentity: async (userId: string): Promise<void> => {
    await apiClient.post(`/v1/admin/mentor-identity/${userId}/approve`)
  },

  rejectIdentity: async (userId: string, reason: string): Promise<void> => {
    await apiClient.post(`/v1/admin/mentor-identity/${userId}/reject`, {
      reason,
    } satisfies ModerationReasonPayload)
  },

  approvePayout: async (userId: string): Promise<BankAccountResponse> => {
    const response = await apiClient.post<ApiResponse<BankAccountResponse>>(`/v1/admin/mentor-payouts/${userId}/approve`)
    return response.data.data
  },

  rejectPayout: async (userId: string, reason: string): Promise<BankAccountResponse> => {
    const response = await apiClient.post<ApiResponse<BankAccountResponse>>(
      `/v1/admin/mentor-payouts/${userId}/reject`,
      { reason } satisfies ModerationReasonPayload
    )
    return response.data.data
  },
}
