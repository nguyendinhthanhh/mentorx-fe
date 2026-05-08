import apiClient from './client'
import { ApiResponse, OnboardingStepResponse } from '@/types'

/**
 * Onboarding API - matches backend's polymorphic BaseStepRequest pattern.
 * All steps go through POST /onboarding/step with stepEnum discriminator.
 */
export const onboardingApi = {
  /** Get current onboarding progress */
  getProgress: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/onboarding/progress')
    return response.data.data
  },

  /** Step 1: ROLE - Choose role: MENTOR, CLIENT, or BOTH */
  submitRole: async (roleChoice: string): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/step', {
      stepEnum: 'ROLE',
      roleChoice
    })
    return response.data.data
  },

  /** Step 2: INTERESTS - Select category IDs */
  submitInterests: async (categoryIds: number[]): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/step', {
      stepEnum: 'INTERESTS',
      categoryIds
    })
    return response.data.data
  },

  /** Step 3: SKILLS - Add skills with levels */
  submitSkills: async (skills: { skillId: number; level: string }[]): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/step', {
      stepEnum: 'SKILLS',
      skills
    })
    return response.data.data
  },

  /** Step 4: PREFERENCES - Notification preferences */
  submitPreferences: async (data: {
    emailEnabled: boolean
    pushEnabled: boolean
    inAppEnabled: boolean
  }): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/step', {
      stepEnum: 'PREFERENCES',
      ...data
    })
    return response.data.data
  },

  /** Step 5: GOALS - List of goals */
  submitGoals: async (goals: string[]): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/step', {
      stepEnum: 'GOALS',
      goals
    })
    return response.data.data
  },

  /** Step 6: PROFILE - Display name and avatar */
  submitProfile: async (data: {
    displayName: string
    avatarUrl?: string
  }): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/step', {
      stepEnum: 'PROFILE',
      ...data
    })
    return response.data.data
  },

  /** Finalize onboarding after all steps */
  complete: async () => {
    const response = await apiClient.post<ApiResponse<any>>('/onboarding/complete')
    return response.data.data
  },

  /** Skip onboarding entirely */
  skip: async () => {
    const response = await apiClient.post<ApiResponse<any>>('/onboarding/skip')
    return response.data.data
  }
}
