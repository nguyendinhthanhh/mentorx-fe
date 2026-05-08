import apiClient from './client'
import type {
  ApiResponse,
  OnboardingProgressResponse,
  PersonalizedFeedResponse,
  UserActivityResponse,
  WalletBalanceResponse,
} from '@/types'

/**
 * Dashboard API Service
 * Handles all dashboard-related API calls
 */

/**
 * Fetch personalized feed for the current user
 * @returns Personalized feed with mentors, courses, knowledge, and jobs
 */
export const fetchPersonalizedFeed = async (): Promise<PersonalizedFeedResponse> => {
  try {
    const response = await apiClient.get<ApiResponse<PersonalizedFeedResponse>>(
      '/v1/dashboard/personalized'
    )
    return response.data.data
  } catch (error) {
    console.error('Error fetching personalized feed:', error)
    throw error
  }
}

/**
 * Fetch onboarding progress for the current user
 * @returns Onboarding progress information
 */
export const fetchOnboardingProgress = async (): Promise<OnboardingProgressResponse> => {
  try {
    const response = await apiClient.get<ApiResponse<OnboardingProgressResponse>>(
      '/v1/onboarding/progress'
    )
    return response.data.data
  } catch (error) {
    console.error('Error fetching onboarding progress:', error)
    throw error
  }
}

/**
 * Fetch wallet balance for the current user
 * @returns Wallet balance information
 */
export const fetchWalletBalance = async (): Promise<WalletBalanceResponse> => {
  try {
    const response = await apiClient.get<ApiResponse<WalletBalanceResponse>>(
      '/v1/wallet/balance'
    )
    return response.data.data
  } catch (error) {
    console.error('Error fetching wallet balance:', error)
    throw error
  }
}

/**
 * Fetch user activity summary
 * @returns User activity information
 */
export const fetchUserActivity = async (): Promise<UserActivityResponse> => {
  try {
    const response = await apiClient.get<ApiResponse<UserActivityResponse>>(
      '/v1/user/activity'
    )
    return response.data.data
  } catch (error) {
    console.error('Error fetching user activity:', error)
    throw error
  }
}
