import apiClient from './client'
import { ApiResponse, PaginatedResponse } from '@/types'

export interface PlatformSettingResponse {
  key: string
  value: string
  description?: string
  updatedBy?: string
  updatedByName?: string
  updatedAt?: string
}

export interface PlatformSettingRequest {
  key: string
  value: string
  description?: string
  updatedBy?: string
}

export const platformSettingApi = {
  getAll: async (): Promise<PlatformSettingResponse[]> => {
    const response = await apiClient.get<ApiResponse<PlatformSettingResponse[]>>('/system/platform-settings/list')
    return response.data.data
  },

  getPage: async (page = 0, size = 20): Promise<PaginatedResponse<PlatformSettingResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<PlatformSettingResponse>>>(
      '/system/platform-settings',
      { params: { page, size } }
    )
    return response.data.data
  },

  create: async (request: PlatformSettingRequest): Promise<PlatformSettingResponse> => {
    const response = await apiClient.post<ApiResponse<PlatformSettingResponse>>('/system/platform-settings', request)
    return response.data.data
  },

  update: async (key: string, request: PlatformSettingRequest): Promise<PlatformSettingResponse> => {
    const response = await apiClient.put<ApiResponse<PlatformSettingResponse>>(
      `/system/platform-settings/${encodeURIComponent(key)}`,
      request
    )
    return response.data.data
  },

  delete: async (key: string): Promise<void> => {
    await apiClient.delete(`/system/platform-settings/${encodeURIComponent(key)}`)
  },
}
