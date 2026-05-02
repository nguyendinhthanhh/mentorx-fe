import apiClient from './client'
import {
  ApiResponse,
  PaginatedResponse,
  WalletResponse,
  WalletTransactionResponse,
  DepositRequest,
  WithdrawalRequest,
  TransferRequest,
  WalletAccountType,
  TxnType,
} from '@/types'

export const walletApi = {
  createWallet: async (userId: string, accountType: WalletAccountType): Promise<WalletResponse> => {
    const response = await apiClient.post<ApiResponse<WalletResponse>>(
      `/wallets/${userId}?accountType=${accountType}`
    )
    return response.data.data
  },

  getWallet: async (walletId: string): Promise<WalletResponse> => {
    const response = await apiClient.get<ApiResponse<WalletResponse>>(`/wallets/${walletId}`)
    return response.data.data
  },

  getUserWallets: async (userId: string): Promise<WalletResponse[]> => {
    const response = await apiClient.get<ApiResponse<WalletResponse[]>>(`/wallets/user/${userId}`)
    return response.data.data
  },

  deposit: async (userId: string, data: DepositRequest): Promise<WalletTransactionResponse> => {
    const response = await apiClient.post<ApiResponse<WalletTransactionResponse>>(
      `/wallets/${userId}/deposit`,
      data
    )
    return response.data.data
  },

  withdraw: async (userId: string, data: WithdrawalRequest): Promise<WalletTransactionResponse> => {
    const response = await apiClient.post<ApiResponse<WalletTransactionResponse>>(
      `/wallets/${userId}/withdraw`,
      data
    )
    return response.data.data
  },

  transfer: async (userId: string, data: TransferRequest): Promise<WalletTransactionResponse> => {
    const response = await apiClient.post<ApiResponse<WalletTransactionResponse>>(
      `/wallets/${userId}/transfer`,
      data
    )
    return response.data.data
  },

  getWalletTransactions: async (
    walletId: string,
    params: { page?: number; size?: number }
  ): Promise<PaginatedResponse<WalletTransactionResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<WalletTransactionResponse>>>(
      `/wallets/${walletId}/transactions`,
      { params }
    )
    return response.data.data
  },

  getUserTransactions: async (
    userId: string,
    params: { page?: number; size?: number; type?: TxnType }
  ): Promise<PaginatedResponse<WalletTransactionResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<WalletTransactionResponse>>>(
      `/wallets/user/${userId}/transactions`,
      { params }
    )
    return response.data.data
  },

  getTotalBalance: async (userId: string): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>(`/wallets/user/${userId}/balance`)
    return response.data.data
  },
}
