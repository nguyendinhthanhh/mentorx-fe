import apiClient from './client'
import {
  ApiResponse,
  PaginatedResponse,
  CourseResponse,
  CourseCreateRequest,
  CourseUpdateRequest,
  CourseStatus,
  CourseSectionResponse,
  CourseLessonResponse,
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

  // Admin Methods
  getAllCourses: async (params: {
    status?: CourseStatus
    instructorId?: string
    categoryId?: number
    page?: number
    size?: number
  }): Promise<PaginatedResponse<CourseResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<CourseResponse>>>(
      '/courses/admin/all',
      {
        params,
      }
    )
    return response.data.data
  },

  updateStatus: async (courseId: string, status: CourseStatus): Promise<CourseResponse> => {
    const response = await apiClient.patch<ApiResponse<CourseResponse>>(
      `/courses/${courseId}/status?status=${status}`
    )
    return response.data.data
  },

  isEnrolled: async (courseId: string): Promise<boolean> => {
    const response = await apiClient.get<boolean>(`/v1/course-enrollments/course/${courseId}/me/is-enrolled`)
    return response.data
  },

  getPublishedSections: async (courseId: string): Promise<CourseSectionResponse[]> => {
    const response = await apiClient.get<CourseSectionResponse[]>(
      `/v1/course-sections/course/${courseId}/published`
    )
    return response.data
  },

  getLessonsByCourse: async (courseId: string): Promise<CourseLessonResponse[]> => {
    const response = await apiClient.get<CourseLessonResponse[]>(
      `/v1/course-lessons/course/${courseId}`
    )
    return response.data
  },

  getLessonDocumentPreview: async (
    lessonId: string
  ): Promise<{ blob: Blob; fileName: string }> => {
    const response = await apiClient.get<Blob>(
      `/v1/course-documents/lessons/${lessonId}/preview`,
      { responseType: 'blob' }
    )
    const fileName = extractFileName(response.headers['content-disposition'])
    return { blob: response.data, fileName }
  },

  downloadLessonDocument: async (
    lessonId: string
  ): Promise<{ blob: Blob; fileName: string }> => {
    const response = await apiClient.get<Blob>(
      `/v1/course-documents/lessons/${lessonId}/download`,
      { responseType: 'blob' }
    )
    const fileName = extractFileName(response.headers['content-disposition'])
    return { blob: response.data, fileName }
  },
}

const extractFileName = (contentDisposition?: string) => {
  if (!contentDisposition) return 'mentorx-document.pdf'
  const match = /filename="([^"]+)"/i.exec(contentDisposition)
  if (match?.[1]) return match[1]
  return 'mentorx-document.pdf'
}
