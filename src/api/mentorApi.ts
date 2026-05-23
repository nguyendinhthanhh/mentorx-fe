import apiClient from './client'
import {
  ApiResponse,
  PaginatedResponse,
  MentorProfileResponse,
  MentorProfileRequest,
  UserResponse,
  MentorProfileAssetRequest,
  MentorProfileAssetResponse,
  MentorProfileAssetType,
} from '@/types'

export const mentorApi = {
  applyToBecomeMentor: async (data: MentorProfileRequest): Promise<MentorProfileResponse> => {
    const response = await apiClient.post<ApiResponse<MentorProfileResponse>>('/mentors/apply', data)
    return response.data.data
  },

  getCurrentApplicationStatus: async (): Promise<UserResponse> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>('/mentors/application/status')
    return response.data.data
  },

  createMentorProfile: async (userId: string, data: MentorProfileRequest): Promise<MentorProfileResponse> => {
    const response = await apiClient.post<ApiResponse<MentorProfileResponse>>(
      `/mentors/${userId}/profile`,
      data
    )
    return response.data.data
  },

  getMentorProfile: async (userId: string): Promise<MentorProfileResponse> => {
    const response = await apiClient.get<ApiResponse<MentorProfileResponse>>(`/mentors/${userId}/profile`)
    return response.data.data
  },

  isMentorSaved: async (userId: string, mentorUserId: string): Promise<boolean> => {
    const response = await apiClient.get<ApiResponse<boolean>>(
      `/mentors/${mentorUserId}/save-status`,
      { params: { userId } }
    )
    return response.data.data
  },

  saveMentor: async (userId: string, mentorUserId: string): Promise<boolean> => {
    const response = await apiClient.post<ApiResponse<boolean>>(
      `/mentors/${mentorUserId}/save`,
      null,
      { params: { userId } }
    )
    return response.data.data
  },

  unsaveMentor: async (userId: string, mentorUserId: string): Promise<boolean> => {
    const response = await apiClient.delete<ApiResponse<boolean>>(
      `/mentors/${mentorUserId}/save`,
      { params: { userId } }
    )
    return response.data.data
  },

  getSavedMentors: async (userId: string): Promise<MentorProfileResponse[]> => {
    const response = await apiClient.get<ApiResponse<MentorProfileResponse[]>>(
      '/mentors/saved',
      { params: { userId } }
    )
    return response.data.data
  },

  updateMentorProfile: async (userId: string, data: MentorProfileRequest): Promise<MentorProfileResponse> => {
    const response = await apiClient.put<ApiResponse<MentorProfileResponse>>(
      `/mentors/${userId}/profile`,
      data
    )
    return response.data.data
  },

  deleteMentorProfile: async (userId: string): Promise<void> => {
    await apiClient.delete(`/mentors/${userId}/profile`)
  },

  getAllApprovedMentors: async (params: {
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
  }): Promise<PaginatedResponse<MentorProfileResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MentorProfileResponse>>>(
      '/mentors',
      { params }
    )
    return response.data.data
  },

  searchMentors: async (params: {
    minRating?: number
    maxHourlyRate?: number
    availability?: string
    primaryDomain?: string
    skill?: string
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
  }): Promise<PaginatedResponse<MentorProfileResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MentorProfileResponse>>>(
      '/mentors/search',
      { params }
    )
    return response.data.data
  },

  searchMentorsFullText: async (query: string): Promise<MentorProfileResponse[]> => {
    const response = await apiClient.get<ApiResponse<MentorProfileResponse[]>>(
      `/mentors/search/text?query=${query}`
    )
    return response.data.data
  },

  getFeaturedMentors: async (): Promise<MentorProfileResponse[]> => {
    const response = await apiClient.get<ApiResponse<MentorProfileResponse[]>>('/mentors/featured')
    return response.data.data
  },

  getTopRatedMentors: async (params: {
    page?: number
    size?: number
  }): Promise<PaginatedResponse<MentorProfileResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MentorProfileResponse>>>(
      '/mentors/top-rated',
      { params }
    )
    return response.data.data
  },

  approveMentorApplication: async (userId: string, approvedBy?: string): Promise<MentorProfileResponse> => {
    const response = await apiClient.post<ApiResponse<MentorProfileResponse>>(
      approvedBy ? `/mentors/${userId}/approve?approvedBy=${approvedBy}` : `/mentors/${userId}/approve`
    )
    return response.data.data
  },

  rejectMentorApplication: async (
    userId: string,
    reason: string,
    rejectedBy?: string
  ): Promise<MentorProfileResponse> => {
    const query = rejectedBy
      ? `reason=${encodeURIComponent(reason)}&rejectedBy=${rejectedBy}`
      : `reason=${encodeURIComponent(reason)}`
    const response = await apiClient.post<ApiResponse<MentorProfileResponse>>(
      `/mentors/${userId}/reject?${query}`
    )
    return response.data.data
  },

  requestMentorApplicationRevision: async (
    userId: string,
    reason: string,
    requestedBy?: string
  ): Promise<MentorProfileResponse> => {
    const query = requestedBy
      ? `reason=${encodeURIComponent(reason)}&requestedBy=${requestedBy}`
      : `reason=${encodeURIComponent(reason)}`
    const response = await apiClient.post<ApiResponse<MentorProfileResponse>>(
      `/mentors/${userId}/request-revision?${query}`
    )
    return response.data.data
  },

  suspendMentorApplication: async (
    userId: string,
    reason: string,
    suspendedBy?: string
  ): Promise<MentorProfileResponse> => {
    const query = suspendedBy
      ? `reason=${encodeURIComponent(reason)}&suspendedBy=${suspendedBy}`
      : `reason=${encodeURIComponent(reason)}`
    const response = await apiClient.post<ApiResponse<MentorProfileResponse>>(
      `/mentors/${userId}/suspend?${query}`
    )
    return response.data.data
  },

  setFeaturedStatus: async (userId: string, featured: boolean): Promise<void> => {
    await apiClient.patch(`/mentors/${userId}/featured?featured=${featured}`)
  },

  getApprovedMentorsCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>('/mentors/statistics/approved')
    return response.data.data
  },

  getPendingApplicationsCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>('/mentors/statistics/pending')
    return response.data.data
  },

  // Mentor Packages
  getMentorPackages: async (userId: string): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>(`/mentors/${userId}/packages`)
    return response.data.data
  },

  getAllMentorPackages: async (userId: string): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>(`/mentors/${userId}/packages`)
    return response.data.data
  },

  getActiveMentorPackages: async (userId: string): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>(`/mentors/${userId}/packages/active`)
    return response.data.data
  },

  createMentorPackage: async (userId: string, data: any): Promise<any> => {
    const response = await apiClient.post<ApiResponse<any>>(`/mentors/${userId}/packages`, data)
    return response.data.data
  },

  updateMentorPackage: async (_userId: string, packageId: string, data: any): Promise<any> => {
    const response = await apiClient.put<ApiResponse<any>>(`/mentors/packages/${packageId}`, data)
    return response.data.data
  },

  deleteMentorPackage: async (_userId: string, packageId: string): Promise<void> => {
    await apiClient.delete(`/mentors/packages/${packageId}`)
  },

  // Mentor Courses
  getMentorCourses: async (userId: string): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>(`/mentors/${userId}/courses`)
    return response.data.data
  },

  getPublishedMentorCourses: async (userId: string): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>(`/mentors/${userId}/courses/published`)
    return response.data.data
  },

  // Mentor Availability
  getMentorAvailability: async (userId: string): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>(`/mentors/${userId}/availability`)
    return response.data.data
  },

  getWeeklyAvailability: async (userId: string): Promise<any> => {
    const [availabilityResponse, blockedResponse] = await Promise.all([
      apiClient.get<ApiResponse<any[]>>(`/mentors/${userId}/availability`),
      apiClient.get<ApiResponse<any[]>>(`/mentors/${userId}/blocked-dates`),
    ])
    const weeklySchedule = (availabilityResponse.data.data || []).reduce<Record<number, any[]>>((acc, slot) => {
      const day = Number(slot.dayOfWeek)
      acc[day] = acc[day] || []
      acc[day].push(slot)
      return acc
    }, {})
    return {
      weeklySchedule,
      blockedDates: (blockedResponse.data.data || []).map((item) => item.blockedDate),
      blockedDateItems: blockedResponse.data.data || [],
    }
  },

  getBlockedDates: async (userId: string): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>(`/mentors/${userId}/blocked-dates`)
    return response.data.data
  },

  createAvailabilitySlot: async (userId: string, data: any): Promise<any> => {
    const response = await apiClient.post<ApiResponse<any>>(`/mentors/${userId}/availability`, data)
    return response.data.data
  },

  deleteAvailabilitySlot: async (_userId: string, slotId: string): Promise<void> => {
    await apiClient.delete(`/mentors/availability/${slotId}`)
  },

  blockDate: async (userId: string, blockedDate: string): Promise<any> => {
    const response = await apiClient.post<ApiResponse<any>>(`/mentors/${userId}/blocked-dates`, {
      blockedDate,
      reason: 'Mentor unavailable',
    })
    return response.data.data
  },

  unblockDate: async (userId: string, blockedDate: string): Promise<void> => {
    const blockedDates = await mentorApi.getBlockedDates(userId)
    const match = blockedDates.find((item) => item.blockedDate === blockedDate || item.id === blockedDate)
    if (match?.id) {
      await apiClient.delete(`/mentors/blocked-dates/${match.id}`)
    }
  },

  getProfileAssets: async (
    userId: string,
    type?: MentorProfileAssetType
  ): Promise<MentorProfileAssetResponse[]> => {
    const response = await apiClient.get<ApiResponse<MentorProfileAssetResponse[]>>(
      `/mentors/${userId}/profile-assets`,
      { params: type ? { type } : undefined }
    )
    return response.data.data
  },

  createProfileAsset: async (
    userId: string,
    data: MentorProfileAssetRequest
  ): Promise<MentorProfileAssetResponse> => {
    const response = await apiClient.post<ApiResponse<MentorProfileAssetResponse>>(
      `/mentors/${userId}/profile-assets`,
      data
    )
    return response.data.data
  },

  updateProfileAsset: async (
    assetId: string,
    data: MentorProfileAssetRequest
  ): Promise<MentorProfileAssetResponse> => {
    const response = await apiClient.put<ApiResponse<MentorProfileAssetResponse>>(
      `/mentors/profile-assets/${assetId}`,
      data
    )
    return response.data.data
  },

  deleteProfileAsset: async (assetId: string): Promise<void> => {
    await apiClient.delete(`/mentors/profile-assets/${assetId}`)
  },

  getMentorBadges: async (userId: string): Promise<any[]> =>
    mentorApi.getProfileAssets(userId, MentorProfileAssetType.ACHIEVEMENT),

  createBadge: async (userId: string, data: any): Promise<any> =>
    mentorApi.createProfileAsset(userId, {
      type: MentorProfileAssetType.ACHIEVEMENT,
      title: data.badgeName || data.title,
      description: data.description,
      iconUrl: data.iconUrl,
      isFeatured: data.isFeatured,
    }),

  updateBadge: async (_userId: string, badgeId: string, data: any): Promise<any> =>
    mentorApi.updateProfileAsset(badgeId, {
      type: MentorProfileAssetType.ACHIEVEMENT,
      title: data.badgeName || data.title || 'Achievement',
      description: data.description,
      iconUrl: data.iconUrl,
      isFeatured: data.isFeatured,
    }),

  deleteBadge: async (_userId: string, badgeId: string): Promise<void> =>
    mentorApi.deleteProfileAsset(badgeId),
}
