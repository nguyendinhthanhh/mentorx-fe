import apiClient from './client'
import { ApiResponse, BankAccountResponse, BankAccountRequest } from '@/types'

export const bankAccountApi = {
  // Get all bank accounts for a user
  getByUserId: async (userId: string): Promise<BankAccountResponse[]> => {
    const response = await apiClient.get<ApiResponse<BankAccountResponse[]>>(`/v1/users/${userId}/bank-accounts`)
    return response.data.data
  },

  // Get default bank account
  getDefault: async (userId: string): Promise<BankAccountResponse | null> => {
    try {
      const response = await apiClient.get<ApiResponse<BankAccountResponse>>(`/v1/users/${userId}/bank-accounts/default`)
      return response.data.data
    } catch (error) {
      return null
    }
  },

  // Create a new bank account
  create: async (userId: string, data: BankAccountRequest): Promise<BankAccountResponse> => {
    const response = await apiClient.post<ApiResponse<BankAccountResponse>>(`/v1/users/${userId}/bank-accounts`, data)
    return response.data.data
  },

  // Update a bank account
  update: async (userId: string, accountId: string, data: BankAccountRequest): Promise<BankAccountResponse> => {
    const response = await apiClient.put<ApiResponse<BankAccountResponse>>(`/v1/users/${userId}/bank-accounts/${accountId}`, data)
    return response.data.data
  },

  // Delete a bank account
  delete: async (userId: string, accountId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/v1/users/${userId}/bank-accounts/${accountId}`)
  },

  // Set as default
  setDefault: async (userId: string, accountId: string): Promise<BankAccountResponse> => {
    const response = await apiClient.post<ApiResponse<BankAccountResponse>>(`/v1/users/${userId}/bank-accounts/${accountId}/set-default`)
    return response.data.data
  }
}
