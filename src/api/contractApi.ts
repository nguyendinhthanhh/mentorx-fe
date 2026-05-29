import apiClient from './client'
import { ApiResponse, ContractResponse, PaginatedResponse } from '@/types'

export const contractApi = {
  getByJob: async (jobId: string, params?: { page?: number; size?: number }): Promise<PaginatedResponse<ContractResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ContractResponse>>>(`/contracts/job/${jobId}`, { params })
    return response.data.data
  },

  complete: async (contractId: string): Promise<ContractResponse> => {
    const response = await apiClient.post<ApiResponse<ContractResponse>>(`/contracts/${contractId}/complete`)
    return response.data.data
  },
}
