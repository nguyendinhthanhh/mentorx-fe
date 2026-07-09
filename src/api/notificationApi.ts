import apiClient from './client'
import { ApiResponse, PaginatedResponse, NotificationResponse } from '@/types'

export const notificationApi = {
  getUserNotifications: async (userId: string, params?: { unreadOnly?: boolean; page?: number; size?: number }): Promise<PaginatedResponse<NotificationResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<NotificationResponse>>>('/notifications', { 
      params: { ...params, userId } 
    })
    return response.data.data
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    const response = await apiClient.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count', {
      params: { userId }
    })
    return response.data.data.unreadCount
  },

  markAsRead: async (notificationId: string): Promise<NotificationResponse> => {
    const response = await apiClient.post<ApiResponse<NotificationResponse>>(`/notifications/${notificationId}/read`)
    return response.data.data
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    await apiClient.post(`/notifications/read-all?userId=${userId}`)
  },

  dismiss: async (notificationId: string): Promise<NotificationResponse> => {
    const response = await apiClient.post<ApiResponse<NotificationResponse>>(`/notifications/${notificationId}/dismiss`)
    return response.data.data
  },

  sendNotification: async (data: { userId: string; title: string; message: string; notificationType: string }): Promise<NotificationResponse> => {
    const response = await apiClient.post<ApiResponse<NotificationResponse>>('/notifications/send', data)
    return response.data.data
  }
}
