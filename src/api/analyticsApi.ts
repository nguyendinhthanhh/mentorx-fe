import apiClient from './client'
import { ApiResponse } from '@/types'

// ─── Request Types ───────────────────────────────────────────────────────────

export interface ViewEventRequest {
  targetType: string
  targetId: string
}

// ─── Response Types ──────────────────────────────────────────────────────────

export interface ViewCountResponse {
  viewCount: number
}

export interface EarningsSnapshotResponse {
  id: string
  userId: string
  snapshotDate: string
  earnedMxc: number
  withdrawnMxc: number
  platformFeeMxc: number
  jobsCompleted: number
  coursesSold: number
  escrowBalanceMxc: number
  availableBalanceMxc: number
  earnedFromMentoringMxc: number
  earnedFromFreelanceMxc: number
  earnedFromCoursesMxc: number
  proposalsSent: number
  proposalsAccepted: number
  contractsActive: number
  contractsCompleted: number
  courseEnrollments: number
}

export interface TimelinePoint {
  date: string
  value: number
}

export interface BySourceEntry {
  source: string
  amountMxc: number
}

export interface EarningsSummaryResponse {
  userId: string
  period: string
  startDate: string
  endDate: string
  totalEarnedMxc: number
  availableBalanceMxc: number
  escrowBalanceMxc: number
  withdrawnMxc: number
  bySource: BySourceEntry[]
  timeline: TimelinePoint[]
}

export interface JobStatsResponse {
  userId: string
  role: string
  proposalsSent: number
  proposalsAccepted: number
  proposalsRejected: number
  proposalAcceptanceRate: number
  contractsActive: number
  contractsCompleted: number
  contractsCancelled: number
  contractCompletionRate: number
  jobsPosted: number
  averageProposalsPerJob: number
}

export interface CourseStatItem {
  courseId: string
  courseTitle: string
  totalRevenueMxc: number
  totalEnrollments: number
  completionRate: number
  lessonViews: number
  averageRating: number
}

export interface CourseStatsAnalyticsResponse {
  userId: string
  totalCourses: number
  totalRevenueMxc: number
  totalEnrollments: number
  averageCompletionRate: number
  courses: CourseStatItem[]
}

export interface ConversionResponse {
  userId: string
  funnelType: string
  rate: number
  numerator: number
  denominator: number
  trend: TimelinePoint[]
}

export interface ViewTimelineBucket {
  date: string
  totalViews: number
  uniqueViewers: number
}

export interface ViewTimelineResponse {
  targetType: string
  targetId: string
  granularity: string
  totalViews: number
  uniqueViewers: number
  timeline: ViewTimelineBucket[]
}

export interface DashboardTile {
  label: string
  value: number | string
  helper?: string
}

export interface DashboardSection {
  section: string
  tiles: DashboardTile[]
}

export interface DashboardResponse {
  userId: string
  sections: DashboardSection[]
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export type AnalyticsPeriod = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
export type FunnelType = 'VIEW_TO_MESSAGE' | 'PROPOSAL_TO_CONTRACT' | 'VIEW_TO_PURCHASE' | 'CHAT_TO_DEAL'
export type ViewGranularity = 'DAY' | 'WEEK' | 'MONTH'
export type JobStatsRole = 'MENTOR' | 'CLIENT'

// ─── API Methods ─────────────────────────────────────────────────────────────

export const analyticsApi = {
  recordView: async (data: ViewEventRequest): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/v1/analytics/views', data)
  },

  getViewCount: async (targetType: string, targetId: string): Promise<ViewCountResponse> => {
    const response = await apiClient.get<ApiResponse<ViewCountResponse>>('/v1/analytics/views/count', {
      params: { targetType, targetId },
    })
    return response.data.data
  },

  getEarningsDaily: async (
    userId: string,
    page = 0,
    size = 30
  ): Promise<{ content: EarningsSnapshotResponse[]; totalElements: number; totalPages: number }> => {
    const response = await apiClient.get<ApiResponse<{ content: EarningsSnapshotResponse[]; totalElements: number; totalPages: number }>>(
      '/v1/analytics/earnings/daily',
      { params: { userId, page, size } }
    )
    return response.data.data
  },

  getEarningsSummary: async (
    userId: string,
    period: AnalyticsPeriod,
    startDate?: string,
    endDate?: string
  ): Promise<EarningsSummaryResponse> => {
    const response = await apiClient.get<ApiResponse<EarningsSummaryResponse>>('/v1/analytics/earnings/summary', {
      params: { userId, period, startDate, endDate },
    })
    return response.data.data
  },

  getJobStats: async (userId: string, role: JobStatsRole): Promise<JobStatsResponse> => {
    const response = await apiClient.get<ApiResponse<JobStatsResponse>>('/v1/analytics/jobs/stats', {
      params: { userId, role },
    })
    return response.data.data
  },

  getCourseStats: async (userId: string, courseId?: string): Promise<CourseStatsAnalyticsResponse> => {
    const response = await apiClient.get<ApiResponse<CourseStatsAnalyticsResponse>>('/v1/analytics/courses/stats', {
      params: { userId, courseId },
    })
    return response.data.data
  },

  getConversion: async (
    userId: string,
    funnelType: FunnelType,
    startDate?: string,
    endDate?: string
  ): Promise<ConversionResponse> => {
    const response = await apiClient.get<ApiResponse<ConversionResponse>>('/v1/analytics/conversion', {
      params: { userId, funnelType, startDate, endDate },
    })
    return response.data.data
  },

  getViewTimeline: async (
    targetType: string,
    targetId: string,
    granularity: ViewGranularity,
    startDate?: string,
    endDate?: string
  ): Promise<ViewTimelineResponse> => {
    const response = await apiClient.get<ApiResponse<ViewTimelineResponse>>('/v1/analytics/views/timeline', {
      params: { targetType, targetId, granularity, startDate, endDate },
    })
    return response.data.data
  },

  getDashboard: async (userId: string): Promise<DashboardResponse> => {
    const response = await apiClient.get<ApiResponse<DashboardResponse>>('/v1/analytics/dashboard', {
      params: { userId },
    })
    return response.data.data
  },
}
