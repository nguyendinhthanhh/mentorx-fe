import { categoryApi } from '@/api/categoryApi'
import { jobApi } from '@/api/jobApi'
import { mentorApi } from '@/api/mentorApi'
import { CategoryResponse, JobResponse, MentorProfileResponse } from '@/types'

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

const DEFAULT_STATS: HomeStats = {
  users: 150000,
  openJobs: 0,
  mentors: 0,
  successfulMatches: 45000,
}

const safeArray = <T>(data: T[] | undefined | null): T[] => {
  return Array.isArray(data) ? data : []
}

export const homeApi = {
  getHomeData: async (): Promise<HomeData> => {
    const [jobsResult, mentorsResult, featuredMentorsResult, categoriesResult] = await Promise.allSettled([
      jobApi.getOpenJobs({ page: 0, size: 8 }),
      mentorApi.getAllApprovedMentors({ page: 0, size: 1 }),
      mentorApi.getFeaturedMentors(),
      categoryApi.getAllActive(),
    ])

    const featuredJobs =
      jobsResult.status === 'fulfilled' ? safeArray(jobsResult.value.content).slice(0, 8) : []

    const mentorPool =
      featuredMentorsResult.status === 'fulfilled' && featuredMentorsResult.value.length > 0
        ? featuredMentorsResult.value
        : mentorsResult.status === 'fulfilled'
        ? mentorsResult.value.content
        : []

    const categories =
      categoriesResult.status === 'fulfilled' ? safeArray(categoriesResult.value).slice(0, 8) : []

    const openJobsCount = jobsResult.status === 'fulfilled' ? jobsResult.value.totalElements || 0 : 0
    const mentorsCount = mentorsResult.status === 'fulfilled' ? mentorsResult.value.totalElements || 0 : 0

    return {
      featuredJobs,
      featuredMentors: safeArray(mentorPool).slice(0, 4),
      categories,
      stats: {
        ...DEFAULT_STATS,
        openJobs: openJobsCount,
        mentors: mentorsCount,
      },
    }
  },
}
