import apiClient from './client'
import {
  ApiResponse,
  ComplaintResponse,
  ComplaintStatus,
  PaginatedResponse,
} from '@/types'

export interface ComplaintListParams {
  status?: ComplaintStatus
  page?: number
  size?: number
  sort?: string[]
}

export interface ComplaintCreateRequest {
  complainantId: string
  respondentId: string
  title: string
  description: string
  complaintCategory: string
  priorityLevel: number
  sessionId?: string
  bookingId?: string
  jobId?: string
}

const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_COMPLAINTS === 'true'

export const complaintsApi = {
  getMyComplaints: async (
    userId: string,
    params?: ComplaintListParams,
  ): Promise<PaginatedResponse<ComplaintResponse>> => {
    const { status, page = 0, size = 10, sort } = params ?? {}

    if (USE_MOCK_FALLBACK) {
      const items = await loadMockComplaints()
      const own = items.filter((item) => item.complainantId === userId)
      const filtered = status
        ? own.filter((item) => item.status === status)
        : own
      return paginate(filtered, page, size)
    }

    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<ComplaintResponse>>
    >(`/complaints/user/${userId}`, {
      params: {
        page: String(page),
        size: String(size),
        ...(sort?.length ? { sort: sort.join(',') } : {}),
        ...(status ? { status } : {}),
      },
    })
    return response.data.data
  },

  getAdminQueue: async (
    params?: ComplaintListParams,
  ): Promise<PaginatedResponse<ComplaintResponse>> => {
    const { status, page = 0, size = 10, sort } = params ?? {}

    if (USE_MOCK_FALLBACK) {
      const items = await loadMockComplaints()
      const filtered = status
        ? items.filter((item) => item.status === status)
        : items
      return paginate(filtered, page, size)
    }

    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<ComplaintResponse>>
    >('/admin/complaints', {
      params: {
        page: String(page),
        size: String(size),
        ...(sort?.length ? { sort: sort.join(',') } : {}),
        ...(status ? { status } : {}),
      },
    })
    return response.data.data
  },

  create: async (
    data: ComplaintCreateRequest,
  ): Promise<ComplaintResponse> => {
    const response = await apiClient.post<ApiResponse<ComplaintResponse>>(
      '/complaints',
      data,
    )
    return response.data.data
  },

  getComplaintById: async (id: string): Promise<ComplaintResponse> => {
    if (USE_MOCK_FALLBACK) {
      const items = await loadMockComplaints()
      const found = items.find((item) => item.id === id)
      if (!found) throw new Error('Complaint not found')
      return found
    }
    const response = await apiClient.get<ApiResponse<ComplaintResponse>>(
      `/complaints/${id}`,
    )
    return response.data.data
  },
}

function paginate(
  items: ComplaintResponse[],
  page = 0,
  size = 10,
): PaginatedResponse<ComplaintResponse> {
  const totalElements = items.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const safePage = Math.min(Math.max(page, 0), totalPages - 1)
  const start = safePage * size
  const content = items.slice(start, start + size)
  return {
    content,
    totalElements,
    totalPages,
    size,
    number: safePage,
    first: safePage === 0,
    last: safePage >= totalPages - 1,
  }
}

async function loadMockComplaints(): Promise<ComplaintResponse[]> {
  const response = await fetch('/mocks/complaints-mock.json', {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Failed to load complaints mock (${response.status})`)
  }
  const payload = await response.json()
  if (!payload?.success || !Array.isArray(payload.data)) {
    throw new Error('Complaints mock payload is invalid')
  }
  return payload.data as ComplaintResponse[]
}
