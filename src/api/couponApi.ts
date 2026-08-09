import apiClient from './client'
import {
  ApiResponse,
  PaginatedResponse,
  CouponResponse,
  CouponCreateRequest,
  CouponUpdateRequest,
  CouponValidationResponse,
} from '@/types'

export const couponApi = {
  create: async (data: CouponCreateRequest): Promise<CouponResponse> => {
    const response = await apiClient.post<ApiResponse<CouponResponse>>('/v1/coupons', data)
    return response.data.data
  },

  update: async (couponId: string, data: CouponUpdateRequest): Promise<CouponResponse> => {
    const response = await apiClient.put<ApiResponse<CouponResponse>>(`/v1/coupons/${couponId}`, data)
    return response.data.data
  },

  remove: async (couponId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/v1/coupons/${couponId}`)
  },

  getById: async (couponId: string): Promise<CouponResponse> => {
    const response = await apiClient.get<ApiResponse<CouponResponse>>(`/v1/coupons/${couponId}`)
    return response.data.data
  },

  getMine: async (params: { page?: number; size?: number } = {}): Promise<PaginatedResponse<CouponResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<CouponResponse>>>('/v1/coupons/mine', {
      params,
    })
    return response.data.data
  },

  validate: async (code: string, courseId: string): Promise<CouponValidationResponse> => {
    const response = await apiClient.post<ApiResponse<CouponValidationResponse>>('/v1/coupons/validate', {
      code,
      courseId,
    })
    return response.data.data
  },
}
