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

export type DisputeOutcome =
  | 'FAVOR_INITIATOR'
  | 'FAVOR_RESPONDENT'
  | 'COMPROMISE'
  | 'FULL_REFUND'
  | 'PARTIAL_REFUND'
  | 'NO_REFUND'
  | 'CONTRACT_CANCELLED'
  | 'ADDITIONAL_WORK_REQUIRED'
  | 'MUTUAL_AGREEMENT'
  | 'INVALID_DISPUTE'

export interface DisputeResolveRequest {
  outcome: DisputeOutcome
  resolutionDetails: string
  refundAmountMxc?: number
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

  getById: async (disputeId: string): Promise<DisputeResponse> => {
    const response = await apiClient.get<ApiResponse<DisputeResponse>>(`/disputes/${disputeId}`)
    return response.data.data
  },

  getQueue: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse<DisputeResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<DisputeResponse>>>('/disputes/admin/queue', {
      params,
    })
    return response.data.data
  },

  respond: async (disputeId: string, responseText: string, evidenceUrls: string[] = []): Promise<DisputeResponse> => {
    const response = await apiClient.post<ApiResponse<DisputeResponse>>(`/disputes/${disputeId}/respond`, {
      response: responseText,
      evidenceUrls,
    })
    return response.data.data
  },

  assignMediator: async (disputeId: string, mediatorId: string): Promise<DisputeResponse> => {
    const response = await apiClient.post<ApiResponse<DisputeResponse>>(
      `/disputes/${disputeId}/assign-mediator?mediatorId=${encodeURIComponent(mediatorId)}`
    )
    return response.data.data
  },

  resolve: async (disputeId: string, data: DisputeResolveRequest): Promise<DisputeResponse> => {
    const response = await apiClient.post<ApiResponse<DisputeResponse>>(`/disputes/${disputeId}/resolve`, data)
    return response.data.data
  },
}
