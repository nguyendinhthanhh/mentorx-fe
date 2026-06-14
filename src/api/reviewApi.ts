import apiClient from './client'
import { ApiResponse, PaginatedResponse, ReviewResponse } from '@/types'

export const reviewApi = {
  create: async (data: any): Promise<ReviewResponse> => {
    const response = await apiClient.post<ApiResponse<ReviewResponse>>('/reviews', data)
    return response.data.data
  },

  update: async (reviewId: string, data: any): Promise<ReviewResponse> => {
    const response = await apiClient.put<ApiResponse<ReviewResponse>>(`/reviews/${reviewId}`, data)
    return response.data.data
  },

  respond: async (reviewId: string, responseText: string): Promise<ReviewResponse> => {
    const response = await apiClient.put<ApiResponse<ReviewResponse>>(`/reviews/${reviewId}/response`, { responseText })
    return response.data.data
  },

  getById: async (reviewId: string): Promise<ReviewResponse> => {
    const response = await apiClient.get<ApiResponse<ReviewResponse>>(`/reviews/${reviewId}`)
    return response.data.data
  },

  getByTarget: async (targetType: string, targetId: string, params?: { page?: number; size?: number }): Promise<PaginatedResponse<ReviewResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ReviewResponse>>>(`/reviews/target/${targetType}/${targetId}`, { params })
    return response.data.data
  },

  getByReviewer: async (reviewerId: string, params?: { page?: number; size?: number }): Promise<PaginatedResponse<ReviewResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ReviewResponse>>>(`/reviews/reviewer/${reviewerId}`, { params })
    return response.data.data
  },

  canReviewMentor: async (mentorId: string): Promise<boolean> => {
    const response = await apiClient.get<ApiResponse<boolean>>(`/reviews/eligibility/mentor/${mentorId}`)
    return response.data.data
  },

  vote: async (reviewId: string, isHelpful: boolean): Promise<ReviewResponse> => {
    const response = await apiClient.post<ApiResponse<ReviewResponse>>(`/reviews/${reviewId}/vote?isHelpful=${isHelpful}`)
    return response.data.data
  },

  delete: async (reviewId: string): Promise<void> => {
    await apiClient.delete(`/reviews/${reviewId}`)
  },
}
