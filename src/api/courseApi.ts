import apiClient from './client'
import {
  ApiResponse,
  PaginatedResponse,
  CourseResponse,
  CourseCreateRequest,
  CourseUpdateRequest,
  CourseStatus,
  CourseProductType,
  SupportedLanguage,
  CourseSectionResponse,
  CourseLessonResponse,
  CourseEnrollmentResponse,
  LessonProgressResponse,
  QuizAttemptResponse,
  QuizQuestionResponse,
  QuizQuestionType,
  CourseQaMessageResponse,
  CourseQaSummaryResponse,
  CourseStatsResponse,
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

  updateDetailsWithMedia: async (
    courseId: string,
    data: CourseUpdateRequest,
    media: {
      thumbnailFile?: File
      previewVideoFile?: File
      removeThumbnail?: boolean
      removePreviewVideo?: boolean
    } = {}
  ): Promise<CourseResponse> => {
    const formData = new FormData()
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    if (media.thumbnailFile) formData.append('thumbnailFile', media.thumbnailFile)
    if (media.previewVideoFile) formData.append('previewVideoFile', media.previewVideoFile)

    const response = await apiClient.put<ApiResponse<CourseResponse>>(
      `/courses/${courseId}/details`,
      formData,
      {
        params: {
          removeThumbnail: media.removeThumbnail === true,
          removePreviewVideo: media.removePreviewVideo === true,
        },
      }
    )
    return response.data.data
  },

  delete: async (courseId: string): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}`)
  },

  archive: async (courseId: string): Promise<CourseResponse> => {
    const response = await apiClient.post<ApiResponse<CourseResponse>>(`/courses/${courseId}/archive`)
    return response.data.data
  },

  getPublished: async (params: {
    page?: number
    size?: number
    categoryId?: number
    skill?: string
    productType?: CourseProductType
    language?: SupportedLanguage
    level?: string
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
    productType?: CourseProductType
    instructorId?: string
    categoryId?: number
    skill?: string
    language?: SupportedLanguage
    level?: string
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

  updateStatus: async (courseId: string, status: CourseStatus, reason?: string): Promise<CourseResponse> => {
    let url = `/courses/${courseId}/status?status=${status}`
    if (reason) url += `&reason=${encodeURIComponent(reason)}`
    const response = await apiClient.patch<ApiResponse<CourseResponse>>(url)
    return response.data.data
  },

  submitForReview: async (courseId: string): Promise<CourseResponse> => {
    const response = await apiClient.post<ApiResponse<CourseResponse>>(`/courses/${courseId}/submit-for-review`)
    return response.data.data
  },

  isEnrolled: async (courseId: string): Promise<boolean> => {
    const response = await apiClient.get<boolean>(`/v1/course-enrollments/course/${courseId}/me/is-enrolled`)
    return response.data
  },

  enrollCurrentUser: async (courseId: string): Promise<CourseEnrollmentResponse> => {
    const response = await apiClient.post<CourseEnrollmentResponse>(`/v1/course-enrollments/course/${courseId}/me`)
    return response.data
  },

  getPublishedSections: async (courseId: string): Promise<CourseSectionResponse[]> => {
    const response = await apiClient.get<CourseSectionResponse[]>(
      `/v1/course-sections/course/${courseId}/published`
    )
    return response.data
  },

  getSections: async (courseId: string): Promise<CourseSectionResponse[]> => {
    const response = await apiClient.get<CourseSectionResponse[]>(
      `/v1/course-sections/course/${courseId}`
    )
    return response.data
  },

  createSection: async (data: {
    courseId: string
    title: string
    description?: string
    sectionOrder: number
    isPublished?: boolean
  }): Promise<CourseSectionResponse> => {
    const response = await apiClient.post<CourseSectionResponse>('/v1/course-sections', data)
    return response.data
  },

  updateSection: async (
    sectionId: string,
    data: Partial<{
      title: string
      description: string
      sectionOrder: number
      isPublished: boolean
    }>
  ): Promise<CourseSectionResponse> => {
    const response = await apiClient.put<CourseSectionResponse>(`/v1/course-sections/${sectionId}`, data)
    return response.data
  },

  deleteSection: async (sectionId: string): Promise<void> => {
    await apiClient.delete(`/v1/course-sections/${sectionId}`)
  },

  saveCurriculum: async (
    courseId: string,
    data: {
      sections: Array<{
        id?: string
        title: string
        description?: string
        sectionOrder: number
        isPublished?: boolean
        lessons: Array<{
          id?: string
          title: string
          description?: string
          lessonType: string
          lessonOrder: number
          durationMinutes?: number
          videoUrl?: string
          articleContent?: string
          resourceUrl?: string
          isFreePreview?: boolean
          isPublished?: boolean
          isMandatory?: boolean
          metadata?: Record<string, unknown>
          quizQuestions?: Array<{
            id?: string
            questionType: QuizQuestionType
            questionText: string
            answerDataJson: string
            points?: number
            explanation?: string
            orderIndex?: number
          }>
        }>
      }>
    }
  ): Promise<{ sections: CourseSectionResponse[]; lessons: CourseLessonResponse[]; quizQuestions: QuizQuestionResponse[] }> => {
    const response = await apiClient.put<{ sections: CourseSectionResponse[]; lessons: CourseLessonResponse[]; quizQuestions: QuizQuestionResponse[] }>(
      `/v1/course-curriculum/courses/${courseId}`,
      data
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

  getEnrollmentsByStudent: async (
    studentId: string,
    params: { page?: number; size?: number } = {}
  ): Promise<PaginatedResponse<CourseEnrollmentResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<CourseEnrollmentResponse>> | PaginatedResponse<CourseEnrollmentResponse>>(
      `/v1/course-enrollments/student/${studentId}`,
      { params }
    )
    return unwrapApiResponse(response.data)
  },

  getCompletedEnrollmentsByStudent: async (
    studentId: string
  ): Promise<CourseEnrollmentResponse[]> => {
    const response = await apiClient.get<CourseEnrollmentResponse[]>(
      `/v1/course-enrollments/student/${studentId}/completed`
    )
    return response.data
  },

  createLesson: async (data: {
    sectionId: string
    title: string
    description?: string
    lessonType: string
    lessonOrder: number
    durationMinutes?: number
    videoUrl?: string
    articleContent?: string
    resourceUrl?: string
    isFreePreview?: boolean
    isPublished?: boolean
    isMandatory?: boolean
    metadata?: Record<string, unknown>
  }): Promise<CourseLessonResponse> => {
    const response = await apiClient.post<CourseLessonResponse>('/v1/course-lessons', data)
    return response.data
  },

  updateLesson: async (
    lessonId: string,
    data: Partial<{
      title: string
      description: string
      lessonType: string
      lessonOrder: number
      durationMinutes: number
      videoUrl: string
      articleContent: string
      resourceUrl: string
      isFreePreview: boolean
      isPublished: boolean
      isMandatory: boolean
      metadata: Record<string, unknown>
    }>
  ): Promise<CourseLessonResponse> => {
    const response = await apiClient.put<CourseLessonResponse>(`/v1/course-lessons/${lessonId}`, data)
    return response.data
  },

  deleteLesson: async (lessonId: string): Promise<void> => {
    await apiClient.delete(`/v1/course-lessons/${lessonId}`)
  },

  updateLessonProgress: async (
    enrollmentId: string,
    lessonId: string,
    data: Partial<LessonProgressResponse>
  ): Promise<LessonProgressResponse> => {
    const response = await apiClient.post<LessonProgressResponse>(
      `/v1/lesson-progress/enrollment/${enrollmentId}/lesson/${lessonId}`,
      data
    )
    return response.data
  },

  getProgressByStudentAndCourse: async (
    studentId: string,
    courseId: string
  ): Promise<LessonProgressResponse[]> => {
    const response = await apiClient.get<LessonProgressResponse[]>(
      `/v1/lesson-progress/student/${studentId}/course/${courseId}`
    )
    return response.data
  },

  downloadCertificate: async (enrollmentId: string): Promise<{ blob: Blob; fileName: string }> => {
    const response = await apiClient.get<Blob>(
      `/v1/course-enrollments/${enrollmentId}/certificate`,
      { responseType: 'blob' }
    )
    return { blob: response.data, fileName: extractFileName(response.headers['content-disposition']) }
  },

  getCourseStats: async (courseId: string): Promise<CourseStatsResponse> => {
    const response = await apiClient.get<CourseStatsResponse>(`/v1/course-enrollments/course/${courseId}/stats`)
    return response.data
  },

  getQuizQuestions: async (lessonId: string): Promise<QuizQuestionResponse[]> => {
    const response = await apiClient.get<QuizQuestionResponse[]>(
      `/v1/course-quizzes/lessons/${lessonId}/questions`
    )
    return response.data
  },

  createQuizQuestion: async (
    lessonId: string,
    data: {
      questionType: QuizQuestionType
      questionText: string
      answerDataJson: string
      points?: number
      explanation?: string
      orderIndex?: number
    }
  ): Promise<QuizQuestionResponse> => {
    const response = await apiClient.post<QuizQuestionResponse>(
      `/v1/course-quizzes/lessons/${lessonId}/questions`,
      data
    )
    return response.data
  },

  submitQuizAttempt: async (data: {
    enrollmentId: string
    lessonId: string
    answers: Array<{ questionId: string; givenAnswerJson: string }>
  }): Promise<QuizAttemptResponse> => {
    const response = await apiClient.post<QuizAttemptResponse>('/v1/course-quizzes/attempts/submit', data)
    return response.data
  },

  getCourseQaMessages: async (courseId: string): Promise<CourseQaMessageResponse[]> => {
    const response = await apiClient.get<CourseQaMessageResponse[]>(`/v1/course-qa/courses/${courseId}/messages`)
    return response.data
  },

  getCourseQaSummary: async (courseId: string): Promise<CourseQaSummaryResponse> => {
    const response = await apiClient.get<CourseQaSummaryResponse>(`/v1/course-qa/courses/${courseId}/summary`)
    return response.data
  },

  getMentorQaSummaries: async (): Promise<CourseQaSummaryResponse[]> => {
    const response = await apiClient.get<CourseQaSummaryResponse[]>('/v1/course-qa/mentor/summaries')
    return response.data
  },

  sendCourseQaMessage: async (
    courseId: string,
    data: { lessonId?: string; recipientId?: string; content: string }
  ): Promise<CourseQaMessageResponse> => {
    const response = await apiClient.post<CourseQaMessageResponse>(`/v1/course-qa/courses/${courseId}/messages`, data)
    return response.data
  },
}

const extractFileName = (contentDisposition?: string) => {
  if (!contentDisposition) return 'mentorx-document.pdf'
  const match = /filename="([^"]+)"/i.exec(contentDisposition)
  if (match?.[1]) return match[1]
  return 'mentorx-document.pdf'
}

const unwrapApiResponse = <T>(payload: ApiResponse<T> | T): T => {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    'success' in payload
  ) {
    return (payload as ApiResponse<T>).data
  }
  return payload as T
}
