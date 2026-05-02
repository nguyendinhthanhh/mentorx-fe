import apiClient from './client'
import {
  ApiResponse,
  PaginatedResponse,
  CourseResponse,
  CourseCreateRequest,
  CourseUpdateRequest,
  CourseStatus,
} from '@/types'

export const courseApi = {
  create: async (data: CourseCreateRequest): Promise<CourseResponse> => {
    const response = await apiClient.post<ApiResponse<CourseResponse>>('/courses', data)
    return response.data.data
  },

  getById: async (courseId: string): Promise<CourseResponse> => {
    const response = await apiClient.get<ApiResponse<CourseResponse>>(`/courses/${courseId}`)
    return response.data.data
  },

  update: async (courseId: string, data: CourseUpdateRequest): Promise<CourseResponse> => {
    const response = await apiClient.put<ApiResponse<CourseResponse>>(`/courses/${courseId}`, data)
    return response.data.data
  },

  delete: async (courseId: string): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}`)
  },

  getPublished: async (params: {
    page?: number
    size?: number
  }): Promise<PaginatedResponse<CourseResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<CourseResponse>>>(
      '/courses/published',
      { params }
    )
    return response.data.data
  },

  getByInstructor: async (
    instructorId: string,
    params: { page?: number; size?: number }
  ): Promise<PaginatedResponse<CourseResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<CourseResponse>>>(
      `/courses/instructor/${instructorId}`,
      { params }
    )
    return response.data.data
  },

  getByStatus: async (
    status: CourseStatus,
    params: { page?: number; size?: number }
  ): Promise<PaginatedResponse<CourseResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<CourseResponse>>>(
      `/courses/status/${status}`,
      { params }
    )
    return response.data.data
  },
}
