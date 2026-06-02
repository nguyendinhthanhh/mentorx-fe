import apiClient from './client'
import { ApiResponse } from '@/types'

export interface NotificationPreferenceResponse {
  userId: string
  userFullName?: string
  emailEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  emailTypeSettings?: string
  pushTypeSettings?: string
  updatedAt?: string
}

export interface NotificationPreferenceRequest {
  userId: string
  emailEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  emailTypeSettings?: string
  pushTypeSettings?: string
}

export const notificationPreferenceApi = {
  getOrCreateForUser: async (userId: string): Promise<NotificationPreferenceResponse> => {
    const response = await apiClient.get<ApiResponse<NotificationPreferenceResponse>>(
      `/system/notification-preferences/user/${userId}/get-or-create`
    )
    return response.data.data
  },

  updateByUserId: async (
    userId: string,
    data: NotificationPreferenceRequest
  ): Promise<NotificationPreferenceResponse> => {
    const response = await apiClient.put<ApiResponse<NotificationPreferenceResponse>>(
      `/system/notification-preferences/user/${userId}`,
      data
    )
    return response.data.data
  },
}
