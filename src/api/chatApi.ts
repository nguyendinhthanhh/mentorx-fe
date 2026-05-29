import apiClient from './client'
import { ApiResponse, PaginatedResponse, ChatRoomResponse, MessageResponse } from '@/types'

export const chatApi = {
  createRoom: async (data: {
    participantIds?: string[]
    memberIds?: string[]
    name?: string
    roomName?: string
    type?: string
    roomType?: string
    createdByUserId?: string
    description?: string
    isPrivate?: boolean
    maxMembers?: number
    referenceId?: string
    referenceType?: string
  }): Promise<ChatRoomResponse> => {
    const payload = {
      roomType: data.roomType || data.type || 'DIRECT_MESSAGE',
      roomName: data.roomName || data.name,
      createdByUserId: data.createdByUserId || data.participantIds?.[0] || data.memberIds?.[0],
      description: data.description,
      isPrivate: data.isPrivate,
      maxMembers: data.maxMembers,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      memberIds: data.memberIds || data.participantIds || [],
    }
    const response = await apiClient.post<ApiResponse<ChatRoomResponse>>('/chat/rooms', payload)
    return response.data.data
  },

  getRoomById: async (roomId: string, userId: string): Promise<ChatRoomResponse> => {
    const response = await apiClient.get<ApiResponse<ChatRoomResponse>>(`/chat/rooms/${roomId}`, {
      params: { userId },
    })
    return response.data.data
  },

  getUserRooms: async (userId: string, params?: { page?: number; size?: number }): Promise<PaginatedResponse<ChatRoomResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ChatRoomResponse>>>(`/chat/users/${userId}/rooms`, { params })
    return response.data.data
  },

  sendMessage: async (data: {
    chatRoomId: string
    senderId: string
    content?: string
    messageType: string
    replyToMessageId?: string
    attachmentUrl?: string
    attachmentFilename?: string
    attachmentMimeType?: string
    attachmentSize?: number
    metadata?: Record<string, any>
  }): Promise<MessageResponse> => {
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
