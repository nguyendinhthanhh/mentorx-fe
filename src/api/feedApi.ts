import apiClient from './client'
import type {
  ApiResponse,
  CourseRecommendationResponse,
  JobRecommendationResponse,
  KnowledgeRecommendationResponse,
  MentorRecommendationResponse,
} from '@/types'

/**
 * Feed API Service
 * Handles all feed recommendation API calls
 */

/**
 * Fetch mentor recommendations for the current user
 * @param limit - Maximum number of mentors to return (default: 10)
 * @returns List of recommended mentors with match scores
 */
export const fetchMentorRecommendations = async (
  limit: number = 10
): Promise<MentorRecommendationResponse[]> => {
  try {
    const response = await apiClient.get<ApiResponse<MentorRecommendationResponse[]>>(
      '/v1/feed/mentors',
      {
        params: { limit },
      }
    )
    return response.data.data
  } catch (error) {
    console.error('Error fetching mentor recommendations:', error)
    throw error
  }
}

/**
 * Fetch course recommendations for the current user
 * @param limit - Maximum number of courses to return (default: 10)
 * @returns List of recommended courses with match scores
 */
export const fetchCourseRecommendations = async (
  limit: number = 10
): Promise<CourseRecommendationResponse[]> => {
  try {
    const response = await apiClient.get<ApiResponse<CourseRecommendationResponse[]>>(
      '/v1/feed/courses',
      {
        params: { limit },
      }
    )
    return response.data.data
  } catch (error) {
    console.error('Error fetching course recommendations:', error)
    throw error
  }
}

/**
 * Fetch knowledge feed recommendations for the current user
 * @param limit - Maximum number of articles to return (default: 10)
 * @returns List of recommended knowledge articles with match scores
 */
export const fetchKnowledgeFeed = async (
  limit: number = 10
): Promise<KnowledgeRecommendationResponse[]> => {
  try {
    const response = await apiClient.get<ApiResponse<KnowledgeRecommendationResponse[]>>(
      '/v1/feed/knowledge',
      {
        params: { limit },
      }
    )
    return response.data.data
  } catch (error) {
    console.error('Error fetching knowledge feed:', error)
    throw error
  }
}

/**
 * Fetch job recommendations for the current user
 * @param limit - Maximum number of jobs to return (default: 10)
 * @returns List of recommended jobs with match scores
 */
export const fetchJobRecommendations = async (
  limit: number = 10
): Promise<JobRecommendationResponse[]> => {
  try {
    const response = await apiClient.get<ApiResponse<JobRecommendationResponse[]>>(
      '/v1/feed/jobs',
      {
        params: { limit },
      }
    )
    return response.data.data
  } catch (error) {
    console.error('Error fetching job recommendations:', error)
    throw error
  }
}
