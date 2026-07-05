import apiClient from './client'
import { ApiResponse, AppointmentCancelRequest, AppointmentCreateRequest, AppointmentResponse, AppointmentSlotResponse } from '@/types'

export const appointmentApi = {
  bookAppointment: async (data: AppointmentCreateRequest) => {
    const response = await apiClient.post<ApiResponse<AppointmentResponse>>('/appointments', data)
    return response.data.data
  },

  getMyAppointments: async () => {
    const response = await apiClient.get<ApiResponse<AppointmentResponse[]>>('/appointments/me')
    return response.data.data
  },

  getMyMentorAppointments: async () => {
    const response = await apiClient.get<ApiResponse<AppointmentResponse[]>>('/appointments/mentor/me')
    return response.data.data
  },

  getUserAppointments: async (userId: string) => {
    const response = await apiClient.get<ApiResponse<AppointmentResponse[]>>(`/appointments/user/${userId}`)
    return response.data.data
  },

  getMentorAppointments: async (mentorId: string) => {
    const response = await apiClient.get<ApiResponse<AppointmentResponse[]>>(`/appointments/mentor/${mentorId}`)
    return response.data.data
  },

  getBookableSlots: async (mentorId: string, mentorPackageId: string, days = 14) => {
    const response = await apiClient.get<ApiResponse<AppointmentSlotResponse[]>>(`/appointments/mentor/${mentorId}/slots`, {
      params: { mentorPackageId, days },
    })
    return response.data.data
  },

  cancelAppointment: async (id: string, data: AppointmentCancelRequest) => {
    const response = await apiClient.put<ApiResponse<AppointmentResponse>>(`/appointments/${id}/cancel`, data)
    return response.data.data
  },

  updateMeetingUrl: async (id: string, meetingUrl: string) => {
    const response = await apiClient.put<ApiResponse<AppointmentResponse>>(`/appointments/${id}/meeting-url`, { meetingUrl })
    return response.data.data
  },

  completeAppointment: async (id: string) => {
    const response = await apiClient.put<ApiResponse<AppointmentResponse>>(`/appointments/${id}/complete`)
    return response.data.data
  },
}
