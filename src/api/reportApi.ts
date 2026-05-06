import apiClient from './client'
import {
  ApiResponse,
  PaginatedResponse,
  ReportResponse,
  ReportStatus,
  ReportTargetType,
} from '@/types'

export const reportApi = {
  createReport: async (data: any): Promise<ReportResponse> => {
    const response = await apiClient.post<ApiResponse<ReportResponse>>('/reports', data)
    return response.data.data
  },

  getReportById: async (reportId: string): Promise<ReportResponse> => {
    const response = await apiClient.get<ApiResponse<ReportResponse>>(`/reports/${reportId}`)
    return response.data.data
  },

  getReports: async (params: {
    status?: ReportStatus
    page?: number
    size?: number
  }): Promise<PaginatedResponse<ReportResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ReportResponse>>>('/reports', {
      params,
    })
    return response.data.data
  },

  assignReport: async (reportId: string, adminId: string): Promise<ReportResponse> => {
    const response = await apiClient.post<ApiResponse<ReportResponse>>(`/reports/${reportId}/assign?adminId=${adminId}`)
    return response.data.data
  },

  resolveReport: async (reportId: string, data: { actionTaken: string; moderatorNotes?: string; isUpheld: boolean }): Promise<ReportResponse> => {
    const response = await apiClient.post<ApiResponse<ReportResponse>>(`/reports/${reportId}/resolve`, data)
    return response.data.data
  },

  escalateReport: async (reportId: string, reason: string): Promise<ReportResponse> => {
    const response = await apiClient.post<ApiResponse<ReportResponse>>(`/reports/${reportId}/escalate?reason=${reason}`)
    return response.data.data
  },
}
