import apiClient from './client'
import { ApiResponse, UserInterestProfileRequest, UserMatchingPreferenceRequest, UserMatchingPreferenceResponse } from '@/types'

export const matchingApi = {
  createUserInterest: async (data: UserInterestProfileRequest): Promise<any> => {
    const response = await apiClient.post<ApiResponse<any>>('/matching/user-interest-profiles', data)
    return response.data.data
  },

  updatePreferences: async (data: UserMatchingPreferenceRequest): Promise<UserMatchingPreferenceResponse> => {
    const response = await apiClient.put<ApiResponse<UserMatchingPreferenceResponse>>('/matching/preferences/me', data)
    return response.data.data
  },

  getPreferences: async (): Promise<UserMatchingPreferenceResponse> => {
    const response = await apiClient.get<ApiResponse<UserMatchingPreferenceResponse>>('/matching/preferences/me')
    return response.data.data
  },
}
