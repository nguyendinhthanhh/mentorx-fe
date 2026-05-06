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
  WalletAccountType,
  TxnType,
} from '@/types'

export const walletApi = {
  // Wallet & Balance APIs
  getUserWallets: async (userId: string): Promise<WalletResponse[]> => {
    const response = await apiClient.get<ApiResponse<WalletResponse[]>>(`/wallet/user/${userId}`)
    return response.data.data
  },

  getUserWallet: async (userId: string, accountType: WalletAccountType): Promise<WalletResponse> => {
    const response = await apiClient.get<ApiResponse<WalletResponse>>(`/wallet/user/${userId}/type/${accountType}`)
    return response.data.data
  },

  getUserBalance: async (userId: string): Promise<{ total: number; available: number; pending: number }> => {
    const response = await apiClient.get<ApiResponse<{ total: number; available: number; pending: number }>>(`/wallet/user/${userId}/balance`)
    return response.data.data
  },

  // Deposit APIs
  createDeposit: async (userId: string, data: DepositCreateRequest): Promise<DepositOrderResponse> => {
    const response = await apiClient.post<ApiResponse<DepositOrderResponse>>(
      `/wallet/deposit?userId=${userId}`,
      data
    )
    return response.data.data
  },

  // Withdrawal APIs
  createWithdrawal: async (userId: string, data: WithdrawCreateRequest): Promise<WithdrawalResponse> => {
    const response = await apiClient.post<ApiResponse<WithdrawalResponse>>(
      `/wallet/withdraw?userId=${userId}`,
      data
    )
    return response.data.data
  },

  transfer: async (userId: string, data: TransferRequest): Promise<WalletTransactionResponse> => {
    const response = await apiClient.post<ApiResponse<WalletTransactionResponse>>(
      `/wallet/transfer?fromUserId=${userId}`,
      data
    )
    return response.data.data
  },

  getWithdrawalStatus: async (requestId: string): Promise<WithdrawalResponse> => {
    const response = await apiClient.get<ApiResponse<WithdrawalResponse>>(`/wallet/withdraw/${requestId}`)
    return response.data.data
  },

  // Transaction APIs
  getUserTransactions: async (
    userId: string,
    params: { page?: number; size?: number; type?: TxnType }
  ): Promise<PaginatedResponse<WalletTransactionResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<WalletTransactionResponse>>>(
      `/wallet/user/${userId}/transactions`,
      { params }
    )
    return response.data.data
  },

  getTransactionById: async (transactionId: string): Promise<WalletTransactionResponse> => {
    const response = await apiClient.get<ApiResponse<WalletTransactionResponse>>(`/wallet/transactions/${transactionId}`)
    return response.data.data
  },

  getTransactionGroup: async (groupId: string): Promise<WalletTransactionResponse[]> => {
    const response = await apiClient.get<ApiResponse<WalletTransactionResponse[]>>(`/wallet/transactions/group/${groupId}`)
    return response.data.data
  },

  // Escrow APIs
  getEscrowsByContract: async (contractId: string): Promise<EscrowRecordResponse[]> => {
    const response = await apiClient.get<ApiResponse<EscrowRecordResponse[]>>(`/wallet/escrow/contract/${contractId}`)
    return response.data.data
  },

  getEscrowById: async (escrowId: string): Promise<EscrowRecordResponse> => {
    const response = await apiClient.get<ApiResponse<EscrowRecordResponse>>(`/wallet/escrow/${escrowId}`)
    return response.data.data
  },

  getEscrowLockedByContract: async (contractId: string): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>(`/wallet/escrow/contract/${contractId}/locked`)
    return response.data.data
  },

  getEscrowReleasedByContract: async (contractId: string): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>(`/wallet/escrow/contract/${contractId}/released`)
    return response.data.data
  },

  getTotalEscrowLocked: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>(`/wallet/escrow/total-locked`)
    return response.data.data
  },
}
