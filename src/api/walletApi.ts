import apiClient from './client'
import {
  ApiResponse,
  PaginatedResponse,
  WalletResponse,
  WalletTransactionResponse,
  DepositCreateRequest,
  DepositOrderResponse,
  WithdrawCreateRequest,
  WithdrawalResponse,
  EscrowRecordResponse,
  TransferRequest,
  WalletAccountType,
  TxnType,
  WithdrawalStatus,
} from '@/types'

export interface FinancialSummary {
  totalCirculation: number
  totalDepositToday: number
  totalWithdrawToday: number
  balanceDelta: number
  pendingWithdrawals: number
  unmatchedDeposits: number
  totalUnmatchedAmount: number
  fraudAlerts: number
  frozenAccountCount: number
  frozenRatio: number
  lastReconciledAt: string
  integrityScore: number
}

export interface AuditLog {
  id: string
  wallet: {
    id: string
    user?: {
      fullName: string
    }
  }
  oldBalanceMxc: number
  newBalanceMxc: number
  deltaMxc: number
  changedAt: string
  changedByTxn: string
}

export const walletApi = {
  // Wallet & Balance APIs
  getUserWallets: async (userId: string): Promise<WalletResponse[]> => {
    const response = await apiClient.get<ApiResponse<WalletResponse[]>>(`/v1/wallet/user/${userId}`)
    return response.data.data
  },

  getUserWallet: async (userId: string, accountType: WalletAccountType): Promise<WalletResponse> => {
    const response = await apiClient.get<ApiResponse<WalletResponse>>(`/v1/wallet/user/${userId}/type/${accountType}`)
    return response.data.data
  },

  getUserBalance: async (userId: string): Promise<{ total: number; available: number; pending: number }> => {
    const response = await apiClient.get<ApiResponse<{ total: number; available: number; pending: number }>>(`/v1/wallet/user/${userId}/balance`)
    return response.data.data
  },

  // Deposit APIs
  createDeposit: async (userId: string, data: DepositCreateRequest): Promise<DepositOrderResponse> => {
    const response = await apiClient.post<ApiResponse<DepositOrderResponse>>(
      `/v1/wallet/deposit?userId=${userId}`,
      data
    )
    return response.data.data
  },

  // Withdrawal APIs
  createWithdrawal: async (userId: string, data: WithdrawCreateRequest): Promise<WithdrawalResponse> => {
    const response = await apiClient.post<ApiResponse<WithdrawalResponse>>(
      `/v1/wallet/withdraw?userId=${userId}`,
      data
    )
    return response.data.data
  },

  transfer: async (userId: string, data: TransferRequest): Promise<WalletTransactionResponse> => {
    const response = await apiClient.post<ApiResponse<WalletTransactionResponse>>(
      `/v1/wallet/transfer?fromUserId=${userId}`,
      data
    )
    return response.data.data
  },

  getWithdrawalStatus: async (requestId: string): Promise<WithdrawalResponse> => {
    const response = await apiClient.get<ApiResponse<WithdrawalResponse>>(`/v1/wallet/withdraw/${requestId}`)
    return response.data.data
  },

  // Transaction APIs
  getUserTransactions: async (
    userId: string,
    params: { page?: number; size?: number; type?: TxnType }
  ): Promise<PaginatedResponse<WalletTransactionResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<WalletTransactionResponse>>>(
      `/v1/wallet/user/${userId}/transactions`,
      { params }
    )
    return response.data.data
  },

  getTransactionById: async (transactionId: string): Promise<WalletTransactionResponse> => {
    const response = await apiClient.get<ApiResponse<WalletTransactionResponse>>(`/v1/wallet/transactions/${transactionId}`)
    return response.data.data
  },

  getTransactionGroup: async (groupId: string): Promise<WalletTransactionResponse[]> => {
    const response = await apiClient.get<ApiResponse<WalletTransactionResponse[]>>(`/v1/wallet/transactions/group/${groupId}`)
    return response.data.data
  },

  // Escrow APIs
  getEscrowsByContract: async (contractId: string): Promise<EscrowRecordResponse[]> => {
    const response = await apiClient.get<ApiResponse<EscrowRecordResponse[]>>(`/v1/wallet/escrow/contract/${contractId}`)
    return response.data.data
  },

  getEscrowById: async (escrowId: string): Promise<EscrowRecordResponse> => {
    const response = await apiClient.get<ApiResponse<EscrowRecordResponse>>(`/v1/wallet/escrow/${escrowId}`)
    return response.data.data
  },

  getEscrowLockedByContract: async (contractId: string): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>(`/v1/wallet/escrow/contract/${contractId}/locked`)
    return response.data.data
  },

  getEscrowReleasedByContract: async (contractId: string): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>(`/v1/wallet/escrow/contract/${contractId}/released`)
    return response.data.data
  },

  getTotalEscrowLocked: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>(`/v1/wallet/escrow/total-locked`)
    return response.data.data
  },

  // Admin APIs
  getAllWithdrawals: async (): Promise<WithdrawalResponse[]> => {
    const response = await apiClient.get<ApiResponse<WithdrawalResponse[]>>('/v1/wallet/admin/withdrawals')
    return response.data.data
  },

  approveWithdrawal: async (requestId: string, gatewayTxnId?: string): Promise<string> => {
    let url = `/v1/wallet/admin/withdraw/${requestId}/approve`
    if (gatewayTxnId) url += `?gatewayTxnId=${gatewayTxnId}`
    const response = await apiClient.post<ApiResponse<string>>(url)
    return response.data.data
  },

  rejectWithdrawal: async (requestId: string, reason: string): Promise<void> => {
    await apiClient.post(`/v1/wallet/admin/withdraw/${requestId}/reject?reason=${encodeURIComponent(reason)}`)
  },

  // Admin Overview & Audit
  getFinancialSummary: async (): Promise<FinancialSummary> => {
    const response = await apiClient.get<ApiResponse<FinancialSummary>>('/v1/wallet/admin/financial-summary')
    return response.data.data
  },

  getAuditLogs: async (page = 0, size = 20): Promise<PaginatedResponse<AuditLog>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<AuditLog>>>(`/v1/wallet/admin/audit-logs?page=${page}&size=${size}`)
    return response.data.data
  }
}
