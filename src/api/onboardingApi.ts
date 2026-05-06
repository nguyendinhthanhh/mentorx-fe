import apiClient from './client'
import { ApiResponse, OnboardingStepResponse } from '@/types'

export const onboardingApi = {
  completeRole: async (roleChoice: string): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/role', { roleChoice })
    return response.data.data
  },

  completeCategories: async (categoryIds: number[]): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/categories', { categoryIds })
    return response.data.data
  },

  completeSkills: async (skills: {skillId: number, level: string}[]): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/skills', { skills })
    return response.data.data
  },

  completePreferences: async (data: {
    preferredJobTypes: string[],
    budgetMinMxc: number,
    budgetMaxMxc: number,
    preferredMentorLanguages: string[]
  }): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/preferences', data)
    return response.data.data
  },

  completeGoals: async (learningGoals: string): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/goals', { learningGoals })
    return response.data.data
  },

  completeProfile: async (data: {
    displayName: string,
    avatarUrl?: string,
    countryCode?: string,
    preferredLanguage?: string
  }): Promise<OnboardingStepResponse> => {
    const response = await apiClient.post<ApiResponse<OnboardingStepResponse>>('/onboarding/profile', data)
    return response.data.data
  }
}
