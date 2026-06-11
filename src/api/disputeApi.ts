import apiClient from './client'
import { ApiResponse, DisputeResponse, PaginatedResponse } from '@/types'

export interface DisputeCreateRequest {
  initiatorId: string
  respondentId: string
  contractId?: string
  jobId?: string
  title: string
  description: string
  disputeCategory: string
  disputedAmountMxc?: number
  refundRequestedMxc?: number
  evidenceUrls?: string[]
}

export const disputeApi = {
  create: async (data: DisputeCreateRequest): Promise<DisputeResponse> => {
    const response = await apiClient.post<ApiResponse<DisputeResponse>>('/disputes', data)
    return response.data.data
  },

  getByUser: async (
    userId: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<DisputeResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<DisputeResponse>>>(`/disputes/user/${userId}`, {
      params,
    })
    return response.data.data
  },
}
