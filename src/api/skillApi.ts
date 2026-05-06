import apiClient from './client'
import { ApiResponse, SkillResponse, UserSkillRequest, UserSkillResponse } from '@/types'

export const skillApi = {
  // Using categories API temporarily since there is no public skill fetcher,
  // Or assuming we need to fetch all active skills if an endpoint exists.
  // The backend has `SkillController`, let's assume it has `/system/skills/active`
  getAllActive: async (): Promise<SkillResponse[]> => {
    const response = await apiClient.get<ApiResponse<SkillResponse[]>>('/system/skills/active')
    return response.data.data
  },

  updateUserSkills: async (data: UserSkillRequest[]): Promise<UserSkillResponse[]> => {
    const response = await apiClient.post<ApiResponse<UserSkillResponse[]>>('/system/user-skills', data)
    return response.data.data
  },

  getMySkills: async (): Promise<UserSkillResponse[]> => {
    const response = await apiClient.get<ApiResponse<UserSkillResponse[]>>('/system/user-skills/me')
    return response.data.data
  },
}
