import apiClient from './client'
import { ApiResponse, UserMatchingPreferenceRequest, UserMatchingPreferenceResponse } from '@/types'

export const matchingApi = {
  updatePreferences: async (data: UserMatchingPreferenceRequest): Promise<UserMatchingPreferenceResponse> => {
    const response = await apiClient.put<ApiResponse<UserMatchingPreferenceResponse>>('/v1/users/me/preferences', data)
    return response.data.data
  },

  getPreferences: async (): Promise<UserMatchingPreferenceResponse> => {
    const response = await apiClient.get<ApiResponse<UserMatchingPreferenceResponse>>('/v1/users/me/preferences')
    return response.data.data
  },
}
