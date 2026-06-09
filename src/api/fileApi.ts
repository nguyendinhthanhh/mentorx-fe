import client from './client'
import { ApiResponse, FileResponse } from '@/types'

type CloudinarySignedUploadResponse = {
  cloudName: string
  apiKey: string
  timestamp: number
  folder: string
  signature: string
  uploadUrl: string
}

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
    const signedResponse = await client.post<ApiResponse<CloudinarySignedUploadResponse>>(
      '/v1/files/course-media/sign',
      null,
      { params: { folder } }
    )
    const signedUpload = signedResponse.data.data
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', signedUpload.apiKey)
    formData.append('timestamp', String(signedUpload.timestamp))
    formData.append('folder', signedUpload.folder)
    formData.append('signature', signedUpload.signature)

    const cloudinaryResponse = await fetch(signedUpload.uploadUrl, {
      method: 'POST',
      body: formData,
    })

    if (!cloudinaryResponse.ok) {
      throw new Error('Cloudinary upload failed.')
    }

    const result = await cloudinaryResponse.json()
    return {
      fileName: result.public_id || file.name,
      fileUrl: result.secure_url,
      fileType: file.type || result.resource_type || 'application/octet-stream',
      size: file.size,
    }
  },

  deleteCourseMedia: async (fileUrl: string): Promise<void> => {
    await client.post('/v1/files/course-media/delete', null, { params: { fileUrl } })
  },
}
