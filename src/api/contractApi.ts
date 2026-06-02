import apiClient from './client'
import { ApiResponse, ContractResponse, PaginatedResponse } from '@/types'

export const contractApi = {
  getMine: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse<ContractResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ContractResponse>>>('/contracts/mentor/me', { params })
    return response.data.data
  },

  getMineById: async (contractId: string): Promise<ContractResponse> => {
    const response = await apiClient.get<ApiResponse<ContractResponse>>(`/contracts/mentor/me/${contractId}`)
    return response.data.data
  },

  getByJob: async (jobId: string, params?: { page?: number; size?: number }): Promise<PaginatedResponse<ContractResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ContractResponse>>>(`/contracts/job/${jobId}`, { params })
    return response.data.data
  },

  complete: async (contractId: string): Promise<ContractResponse> => {
    const response = await apiClient.post<ApiResponse<ContractResponse>>(`/contracts/${contractId}/complete`)
    return response.data.data
  },

  requestCancellation: async (
    contractId: string,
    requesterId: string,
    reason: string
  ): Promise<ContractResponse> => {
    const response = await apiClient.post<ApiResponse<ContractResponse>>(
      `/contracts/${contractId}/cancellation-request`,
      { requesterId, reason }
    )
    return response.data.data
  },

  approveCancellation: async (
    contractId: string,
    mentorId: string,
    note: string
  ): Promise<ContractResponse> => {
    const response = await apiClient.post<ApiResponse<ContractResponse>>(
      `/contracts/${contractId}/cancellation-request/approve`,
      { mentorId, note }
    )
    return response.data.data
  },

  rejectCancellation: async (
    contractId: string,
    mentorId: string,
    note: string
  ): Promise<ContractResponse> => {
    const response = await apiClient.post<ApiResponse<ContractResponse>>(
      `/contracts/${contractId}/cancellation-request/reject`,
      { mentorId, note }
    )
    return response.data.data
  },
}
