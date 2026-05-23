import apiClient from './client'
import {
  ApiResponse,
  PaginatedResponse,
  JobResponse,
  JobCreateRequest,
  JobUpdateRequest,
  JobStatus,
  JobType,
} from '@/types'

export const jobApi = {
  create: async (data: JobCreateRequest): Promise<JobResponse> => {
    const response = await apiClient.post<ApiResponse<JobResponse>>('/jobs', data)
    return response.data.data
  },

  getById: async (jobId: string): Promise<JobResponse> => {
    const response = await apiClient.get<ApiResponse<JobResponse>>(`/jobs/${jobId}`)
    return response.data.data
  },

  update: async (jobId: string, data: JobUpdateRequest): Promise<JobResponse> => {
    const response = await apiClient.put<ApiResponse<JobResponse>>(`/jobs/${jobId}`, data)
    return response.data.data
  },

  delete: async (jobId: string): Promise<void> => {
    await apiClient.delete(`/jobs/${jobId}`)
  },

  getOpenJobs: async (params: {
    jobType?: JobType
    categoryId?: number
    skill?: string
    page?: number
    size?: number
  }): Promise<PaginatedResponse<JobResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<JobResponse>>>('/jobs', {
      params,
    })
    return response.data.data
  },

  getByClient: async (
    clientId: string,
    params: { page?: number; size?: number; sort?: string }
  ): Promise<PaginatedResponse<JobResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<JobResponse>>>(
      `/jobs/client/${clientId}`,
      { params }
    )
    return response.data.data
  },

  getByStatus: async (
    status: JobStatus,
    params: { page?: number; size?: number }
  ): Promise<PaginatedResponse<JobResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<JobResponse>>>(
      `/jobs/status/${status}`,
      { params }
    )
    return response.data.data
  },

  // Admin Methods
  getAllJobs: async (params: {
    status?: JobStatus
    jobType?: JobType
    categoryId?: number
    skill?: string
    page?: number
    size?: number
  }): Promise<PaginatedResponse<JobResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<JobResponse>>>('/jobs/admin/all', {
      params,
    })
    return response.data.data
  },

  updateStatus: async (jobId: string, status: JobStatus, reason?: string): Promise<JobResponse> => {
    let url = `/jobs/${jobId}/status?status=${status}`
    if (reason) url += `&reason=${encodeURIComponent(reason)}`
    const response = await apiClient.patch<ApiResponse<JobResponse>>(url)
    return response.data.data
  },
}
