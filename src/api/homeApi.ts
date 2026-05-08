import { categoryApi } from '@/api/categoryApi'
import { jobApi } from '@/api/jobApi'
import { mentorApi } from '@/api/mentorApi'
import { fetchJobRecommendations, fetchMentorRecommendations } from '@/api/feedApi'
import { CategoryResponse } from '@/types'

export interface HomeStats {
  users: number
  openJobs: number
  mentors: number
  successfulMatches: number
}

export interface HomeData {
  featuredJobs: any[]
  featuredMentors: any[]
  categories: CategoryResponse[]
  stats: HomeStats
}

const DEFAULT_STATS: HomeStats = {
  users: 150000,
  openJobs: 25000,
  mentors: 3000,
  successfulMatches: 45000,
}

export const homeApi = {
  getHomeData: async (isAuthenticated: boolean): Promise<HomeData> => {
    let jobs: any[] = []
    let mentors: any[] = []

    if (isAuthenticated) {
      try {
        const [feedJobs, feedMentors] = await Promise.allSettled([
          fetchJobRecommendations(8),
          fetchMentorRecommendations(4)
        ])
        
        if (feedJobs.status === 'fulfilled' && feedJobs.value) {
          jobs = feedJobs.value
        }
        if (feedMentors.status === 'fulfilled' && feedMentors.value) {
          mentors = feedMentors.value
        }
      } catch (e) {
        console.warn("Could not fetch personalized feeds, falling back to general APIs")
      }
    }

    const promises = []
    
    if (jobs.length === 0) {
      promises.push(jobApi.getOpenJobs({ page: 0, size: 8 }).then(res => res.content))
    } else {
      promises.push(Promise.resolve(jobs))
    }

    if (mentors.length === 0) {
      promises.push(mentorApi.getAllApprovedMentors({ page: 0, size: 4 }).then(res => res.content))
    } else {
      promises.push(Promise.resolve(mentors))
    }

    promises.push(categoryApi.getAllActive())

    const [finalJobs, finalMentors, categoriesResult] = await Promise.all(promises)

    return {
      featuredJobs: finalJobs || [],
      featuredMentors: finalMentors || [],
      categories: Array.isArray(categoriesResult) ? categoriesResult : [],
      stats: DEFAULT_STATS
    }
  },
}
