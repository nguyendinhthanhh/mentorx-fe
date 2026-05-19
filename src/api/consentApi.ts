import apiClient from './client'
import { ApiResponse, UserConsentLogRequest, UserConsentLogResponse } from '@/types'

export const consentApi = {
  logConsent: async (data: UserConsentLogRequest): Promise<UserConsentLogResponse> => {
    const response = await apiClient.post<ApiResponse<UserConsentLogResponse>>('/system/consent-logs', data)
    return response.data.data
  },
}
