import axios from 'axios'
import { AppointmentResponse } from '@/types'

const API_URL = import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const appointmentApi = {
  bookAppointment: async (data: { mentorId: string; startTime: string; endTime: string; notes?: string }) => {
    const response = await api.post('/api/appointments', data)
    return response.data.data as AppointmentResponse
  },

  getUserAppointments: async (userId: string) => {
    const response = await api.get(`/api/appointments/user/${userId}`)
    return response.data.data as AppointmentResponse[]
  },

  getMentorAppointments: async (mentorId: string) => {
    const response = await api.get(`/api/appointments/mentor/${mentorId}`)
    return response.data.data as AppointmentResponse[]
  },

  cancelAppointment: async (id: string) => {
    const response = await api.put(`/api/appointments/${id}/cancel`)
    return response.data.data as AppointmentResponse
  },

  updateMeetingUrl: async (id: string, meetingUrl: string) => {
    const response = await api.put(`/api/appointments/${id}/meeting-url`, { meetingUrl })
    return response.data.data as AppointmentResponse
  },

  completeAppointment: async (id: string) => {
    const response = await api.put(`/api/appointments/${id}/complete`)
    return response.data.data as AppointmentResponse
  },
}
