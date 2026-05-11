import apiClient from './client'
import { MentorStatus } from '@/types'

export interface KycStatusResponse {
  mentorStatus: MentorStatus
  livenessResult?: string
  livenessScore?: number
  faceMatchingResult?: string
  faceMatchingSimilarity?: number
  submittedAt?: string
  approvedAt?: string
  rejectionReason?: string
  identityDocumentUrl?: string
  identityDocumentBackUrl?: string
  portraitUrl?: string
  legalName?: string
  dateOfBirth?: string
}

export const kycApi = {
  submitKyc: async (formData: FormData): Promise<KycStatusResponse> => {
    const response = await apiClient.post('/kyc/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data || response.data
  },

  getKycStatus: async (): Promise<KycStatusResponse> => {
    const response = await apiClient.get('/kyc/status')
    return response.data.data || response.data
  },
}
