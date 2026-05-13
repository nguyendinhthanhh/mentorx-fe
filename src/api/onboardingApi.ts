import apiClient from './client'
import { ApiResponse, OnboardingStepResponse } from '@/types'

function requireOnboardingPayload<T>(response: { data: ApiResponse<T> }): T {
  const body = response.data
  const payload = body?.data
  if (payload === undefined || payload === null) {
    const msg = body?.message?.trim() || 'Phản hồi từ máy chủ không hợp lệ (thiếu dữ liệu).'
    throw new Error(msg)
  }
  return payload
}

/**
 * Onboarding API - matches backend's polymorphic BaseStepRequest pattern.
 * All steps go through POST /onboarding/step with stepEnum discriminator.
 */
export const onboardingApi = {
  /** Get current onboarding progress */
  getProgress: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/onboarding/progress')
    return requireOnboardingPayload(response)
  },

  /** Step 1: ROLE - Choose role: MENTOR, CLIENT, or BOTH */
  submitRole: async (roleChoice: string): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/step', {
      stepEnum: 'ROLE',
      roleChoice
    })
    return requireOnboardingPayload(response)
  },

  /** Step 2: INTERESTS - Select category IDs */
  submitInterests: async (categoryIds: number[]): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/step', {
      stepEnum: 'INTERESTS',
      categoryIds
    })
    return requireOnboardingPayload(response)
  },

  /** Step 3: SKILLS - Add skills with levels */
  submitSkills: async (skills: { skillId: number; level: string }[]): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/step', {
      stepEnum: 'SKILLS',
      skills
    })
    return requireOnboardingPayload(response)
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
    return requireOnboardingPayload(response)
  },

  /** Step 5: GOALS - List of goals */
  submitGoals: async (goals: string[]): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/step', {
      stepEnum: 'GOALS',
      goals
    })
    return requireOnboardingPayload(response)
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
    return requireOnboardingPayload(response)
  },

  /** Finalize onboarding after all steps */
  complete: async () => {
    const response = await apiClient.post<ApiResponse<any>>('/onboarding/complete')
    return requireOnboardingPayload(response)
  },

  /** Skip onboarding entirely */
  skip: async () => {
    const response = await apiClient.post<ApiResponse<any>>('/onboarding/skip')
    return requireOnboardingPayload(response)
  }
}
