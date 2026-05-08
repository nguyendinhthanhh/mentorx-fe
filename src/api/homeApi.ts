import apiClient from './client'
import { ApiResponse, CategoryResponse, JobResponse, MentorProfileResponse } from '@/types'

export interface HomeStats {
  users: number
  openJobs: number
  mentors: number
  successfulMatches: number
}

export interface HomeData {
  featuredJobs: JobResponse[]
  featuredMentors: MentorProfileResponse[]
  categories: CategoryResponse[]
  stats: HomeStats
}

export const homeApi = {
  getHomeData: async (): Promise<HomeData> => {
    const response = await apiClient.get<ApiResponse<HomeData>>('/home')
    return response.data.data
  },
}
