import apiClient from './client'
import { userApi } from './userApi'
import { walletApi } from './walletApi'
import { complaintsApi } from './complaintsApi'
import {
  ApiResponse,
  PaginatedResponse,
  WalletTransactionResponse,
  ReportResponse,
  ComplaintStatus,
} from '@/types'

export const adminDashboardApi = {
  getTotalUsers: () => userApi.getTotalUsersCount(),

  getActiveUsers: () => userApi.getActiveUsersCount(),

  getApprovedMentors: () => userApi.getMentorsCount(),

  getPendingMentors: () => userApi.getPendingMentorApplicationsCount(),

  getTotalEscrowLocked: () => walletApi.getTotalEscrowLocked(),

  getWalletsRequiringReconciliation: () => walletApi.getWalletsRequiringReconciliation(),

  getFinancialSummary: () => walletApi.getFinancialSummary(),

  getPendingWithdrawals: () => walletApi.getAllWithdrawals(),

  getPendingComplaints: () =>
    complaintsApi.getAdminQueue({ status: ComplaintStatus.OPEN, page: 0, size: 5 }),

  getRecentTransactions: (page = 0, size = 10) =>
    walletApi.getAdminTransactions(page, size),

  getRecentReports: async (page = 0, size = 10): Promise<PaginatedResponse<ReportResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ReportResponse>>>(
      `/admin/reports?page=${page}&size=${size}&sort=createdAt,desc`
    )
    return response.data.data
  },

  getReportStats: async (): Promise<{
    byStatus: Record<string, number>
    byCategory: Record<string, number>
    byTargetType: Record<string, number>
    avgResolutionTimeMinutes: number
  }> => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/reports/stats')
    return response.data.data
  },

  getEscalatedReports: async (): Promise<ReportResponse[]> => {
    const response = await apiClient.get<ApiResponse<ReportResponse[]>>('/admin/reports/escalated')
    return response.data.data
  },
}
