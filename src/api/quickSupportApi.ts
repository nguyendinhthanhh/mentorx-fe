import apiClient from './client'
import {
  ApiResponse,
  PaginatedResponse,
  QuickSupportResponse,
  QuickSupportCreateRequest,
  QuickSupportRatingRequest,
  QuickSupportCompleteRequest,
  QuickMatchQueueResponse,
  QuickMatchJoinRequest,
} from '@/types'

const BASE = '/quick-support'

export const quickSupportApi = {
  // ─── Requests ──────────────────────────────────────────

  create: async (data: QuickSupportCreateRequest): Promise<QuickSupportResponse> => {
    const res = await apiClient.post<ApiResponse<QuickSupportResponse>>(`${BASE}/requests`, data)
    return res.data.data
  },

  getById: async (requestId: string): Promise<QuickSupportResponse> => {
    const res = await apiClient.get<ApiResponse<QuickSupportResponse>>(`${BASE}/requests/${requestId}`)
    return res.data.data
  },

  getMyRequests: async (
    clientId: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<QuickSupportResponse>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<QuickSupportResponse>>>(
      `${BASE}/requests/my`,
      { params: { clientId, ...params } }
    )
    return res.data.data
  },

  getMentorRequests: async (
    mentorId: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<QuickSupportResponse>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<QuickSupportResponse>>>(
      `${BASE}/requests/mentor`,
      { params: { mentorId, ...params } }
    )
    return res.data.data
  },

  getAvailable: async (
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<QuickSupportResponse>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<QuickSupportResponse>>>(
      `${BASE}/requests/available`,
      { params }
    )
    return res.data.data
  },

  getByStatus: async (
    status: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<QuickSupportResponse>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<QuickSupportResponse>>>(
      `${BASE}/requests/status/${status}`,
      { params }
    )
    return res.data.data
  },

  acceptRequest: async (
    requestId: string,
    mentorId: string,
    agreedRate?: number
  ): Promise<QuickSupportResponse> => {
    const res = await apiClient.post<ApiResponse<QuickSupportResponse>>(
      `${BASE}/requests/${requestId}/accept`,
      null,
      { params: { mentorId, agreedRate } }
    )
    return res.data.data
  },

  startSession: async (requestId: string): Promise<QuickSupportResponse> => {
    const res = await apiClient.post<ApiResponse<QuickSupportResponse>>(
      `${BASE}/requests/${requestId}/start-session`
    )
    return res.data.data
  },

  completeRequest: async (
    requestId: string,
    data: QuickSupportCompleteRequest
  ): Promise<QuickSupportResponse> => {
    const res = await apiClient.post<ApiResponse<QuickSupportResponse>>(
      `${BASE}/requests/${requestId}/complete`,
      data
    )
    return res.data.data
  },

  rateRequest: async (
    requestId: string,
    data: QuickSupportRatingRequest
  ): Promise<QuickSupportResponse> => {
    const res = await apiClient.post<ApiResponse<QuickSupportResponse>>(
      `${BASE}/requests/${requestId}/rate`,
      data
    )
    return res.data.data
  },

  releasePayment: async (requestId: string): Promise<QuickSupportResponse> => {
    const res = await apiClient.post<ApiResponse<QuickSupportResponse>>(
      `${BASE}/requests/${requestId}/payment/release`
    )
    return res.data.data
  },

  cancelRequest: async (requestId: string, reason?: string): Promise<QuickSupportResponse> => {
    const res = await apiClient.post<ApiResponse<QuickSupportResponse>>(
      `${BASE}/requests/${requestId}/cancel`,
      null,
      { params: { reason } }
    )
    return res.data.data
  },

  // ─── Queue ──────────────────────────────────────────────

  joinQueue: async (data: QuickMatchJoinRequest): Promise<QuickMatchQueueResponse> => {
    const res = await apiClient.post<ApiResponse<QuickMatchQueueResponse>>(`${BASE}/queue/join`, data)
    return res.data.data
  },

  leaveQueue: async (userId: string): Promise<void> => {
    await apiClient.post(`${BASE}/queue/leave`, null, { params: { userId } })
  },

  getQueueStatus: async (userId: string): Promise<QuickMatchQueueResponse> => {
    const res = await apiClient.get<ApiResponse<QuickMatchQueueResponse>>(`${BASE}/queue/status`, {
      params: { userId },
    })
    return res.data.data
  },
}
