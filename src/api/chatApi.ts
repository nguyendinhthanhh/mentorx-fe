import apiClient from './client'
import { ApiResponse, PaginatedResponse, ChatRoomResponse, MessageResponse } from '@/types'

export const chatApi = {
  createRoom: async (data: { participantIds: string[]; name?: string; type: string }): Promise<ChatRoomResponse> => {
    const response = await apiClient.post<ApiResponse<ChatRoomResponse>>('/chat/rooms', data)
    return response.data.data
  },

  getRoomById: async (roomId: string): Promise<ChatRoomResponse> => {
    const response = await apiClient.get<ApiResponse<ChatRoomResponse>>(`/chat/rooms/${roomId}`)
    return response.data.data
  },

  getUserRooms: async (userId: string, params?: { page?: number; size?: number }): Promise<PaginatedResponse<ChatRoomResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ChatRoomResponse>>>(`/chat/users/${userId}/rooms`, { params })
    return response.data.data
  },

  sendMessage: async (data: { chatRoomId: string; senderId: string; content: string; messageType: string }): Promise<MessageResponse> => {
    const response = await apiClient.post<ApiResponse<MessageResponse>>('/chat/messages', data)
    return response.data.data
  },

  getRoomMessages: async (roomId: string, params?: { page?: number; size?: number }): Promise<PaginatedResponse<MessageResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MessageResponse>>>(`/chat/rooms/${roomId}/messages`, { params })
    return response.data.data
  },

  markAsRead: async (messageId: string, userId: string): Promise<MessageResponse> => {
    const response = await apiClient.post<ApiResponse<MessageResponse>>(`/chat/messages/${messageId}/read?userId=${userId}`)
    return response.data.data
  },
}
