import apiClient from './client'
import { ApiResponse, PaginatedResponse, ProposalResponse, ProposalCreateRequest } from '@/types'

export const proposalApi = {
  create: async (data: ProposalCreateRequest): Promise<ProposalResponse> => {
    const response = await apiClient.post<ApiResponse<ProposalResponse>>('/proposals', data)
    return response.data.data
  },

  getById: async (proposalId: string): Promise<ProposalResponse> => {
    const response = await apiClient.get<ApiResponse<ProposalResponse>>(`/proposals/${proposalId}`)
    return response.data.data
  },

  update: async (proposalId: string, data: ProposalCreateRequest): Promise<ProposalResponse> => {
    const response = await apiClient.put<ApiResponse<ProposalResponse>>(`/proposals/${proposalId}`, data)
    return response.data.data
  },

  delete: async (proposalId: string): Promise<void> => {
    await apiClient.delete(`/proposals/${proposalId}`)
  },

  getByJob: async (jobId: string, params?: { page?: number; size?: number }): Promise<PaginatedResponse<ProposalResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ProposalResponse>>>(`/proposals/job/${jobId}`, { params })
    return response.data.data
  },

  getByMentor: async (mentorId: string, params?: { page?: number; size?: number }): Promise<PaginatedResponse<ProposalResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ProposalResponse>>>(`/proposals/mentor/${mentorId}`, { params })
    return response.data.data
  },

  submit: async (proposalId: string): Promise<ProposalResponse> => {
    const response = await apiClient.post<ApiResponse<ProposalResponse>>(`/proposals/${proposalId}/submit`)
    return response.data.data
  },

  accept: async (proposalId: string): Promise<ProposalResponse> => {
    const response = await apiClient.post<ApiResponse<ProposalResponse>>(`/proposals/${proposalId}/accept`)
    return response.data.data
  },

  reject: async (proposalId: string, reason: string): Promise<ProposalResponse> => {
    const response = await apiClient.post<ApiResponse<ProposalResponse>>(`/proposals/${proposalId}/reject?reason=${encodeURIComponent(reason)}`)
    return response.data.data
  },
}
