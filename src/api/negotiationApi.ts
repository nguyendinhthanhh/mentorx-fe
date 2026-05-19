import apiClient from './client'
import { ApiResponse } from '@/types'

export interface NegotiationRequest {
  proposalId: string
  senderId: string
  message: string
  proposedAmount?: number
  proposedHourlyRate?: number
  estimatedDurationDays?: number
  proposedStartDate?: string
  proposedDeliveryDate?: string
}

export interface NegotiationResponse {
  id: string
  proposalId: string
  senderId: string
  senderName: string
  senderType: 'CLIENT' | 'MENTOR'
  message: string
  proposedAmount?: number
  proposedHourlyRate?: number
  estimatedDurationDays?: number
  proposedStartDate?: string
  proposedDeliveryDate?: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED'
  createdAt: string
  respondedAt?: string
}

export const negotiationApi = {
  /**
   * Client sends counter-offer to mentor
   */
  clientCounterOffer: async (data: NegotiationRequest): Promise<NegotiationResponse> => {
    const response = await apiClient.post<ApiResponse<NegotiationResponse>>(
      '/negotiations/client-counter',
      data
    )
    return response.data.data
  },

  /**
   * Mentor sends counter-offer to client
   */
  mentorCounterOffer: async (data: NegotiationRequest): Promise<NegotiationResponse> => {
    const response = await apiClient.post<ApiResponse<NegotiationResponse>>(
      '/negotiations/mentor-counter',
      data
    )
    return response.data.data
  },

  /**
   * Accept a negotiation offer
   */
  acceptNegotiation: async (negotiationId: string, userId: string): Promise<NegotiationResponse> => {
    const response = await apiClient.post<ApiResponse<NegotiationResponse>>(
      `/negotiations/${negotiationId}/accept?userId=${userId}`
    )
    return response.data.data
  },

  /**
   * Reject a negotiation offer
   */
  rejectNegotiation: async (negotiationId: string, userId: string): Promise<void> => {
    await apiClient.post(`/negotiations/${negotiationId}/reject?userId=${userId}`)
  },

  /**
   * Get all negotiations for a proposal
   */
  getByProposal: async (proposalId: string): Promise<NegotiationResponse[]> => {
    const response = await apiClient.get<ApiResponse<NegotiationResponse[]>>(
      `/negotiations/proposal/${proposalId}`
    )
    return response.data.data
  },

  /**
   * Get latest negotiation for a proposal
   */
  getLatest: async (proposalId: string): Promise<NegotiationResponse> => {
    const response = await apiClient.get<ApiResponse<NegotiationResponse>>(
      `/negotiations/proposal/${proposalId}/latest`
    )
    return response.data.data
  },
}
