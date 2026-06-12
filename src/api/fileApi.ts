import client from './client'
import { ApiResponse, FileResponse } from '@/types'

export const FILE_UPLOAD_DIRS = {
  PUBLIC_AVATAR: 'public/avatar',
  PUBLIC_MENTOR_PROFILE: 'public/mentor-profile',
  PUBLIC_COURSE_THUMBNAIL: 'public/course-thumbnail',
  PUBLIC_MENTOR_ASSET: 'public/mentor-asset',
  PUBLIC_PORTFOLIO: 'public/portfolio',
  PUBLIC_COVER: 'public/cover',
  PUBLIC_CHAT: 'public/chat',
  PRIVATE_DOCUMENT: 'private/document',
  PRIVATE_VIDEO: 'private/video',
  KYC: 'kyc',
} as const

type FileUploadDir = (typeof FILE_UPLOAD_DIRS)[keyof typeof FILE_UPLOAD_DIRS]

type FileUploadOptions = {
  subDirectory?: FileUploadDir
}

export const fileApi = {
  upload: async (file: File, options?: FileUploadOptions): Promise<FileResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    if (options?.subDirectory) {
      formData.append('subDirectory', options.subDirectory)
    }
    
    const response = await client.post<ApiResponse<FileResponse>>('/v1/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },
}
