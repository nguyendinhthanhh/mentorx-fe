import client from './client'
import { ApiResponse, FileResponse } from '@/types'

export const fileApi = {
  upload: async (file: File): Promise<FileResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await client.post<ApiResponse<FileResponse>>('/v1/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },

  uploadCourseMedia: async (file: File, folder = 'mentorx/courses'): Promise<FileResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const response = await client.post<ApiResponse<FileResponse>>('/v1/files/course-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },
}
