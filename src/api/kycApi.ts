import type { AxiosError } from 'axios'
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

/** OCR + nhiều lần FFmpeg/OpenCV + so khớp mặt + liveness — có thể > 30s */
const KYC_SUBMIT_TIMEOUT_MS = 180_000

function messageFromSubmitError(error: unknown): string | undefined {
  const ax = error as AxiosError<{ message?: string; error?: string }>
  const d = ax.response?.data
  if (!d || typeof d !== 'object') return undefined
  if (typeof d.message === 'string' && d.message.trim()) return d.message
  if (typeof (d as { error?: string }).error === 'string') return (d as { error: string }).error
  return undefined
}

export const kycApi = {
  submitKyc: async (formData: FormData): Promise<KycStatusResponse> => {
    try {
      const response = await apiClient.post('/kyc/submit', formData, {
        timeout: KYC_SUBMIT_TIMEOUT_MS,
      })
      return response.data.data || response.data
    } catch (e) {
      const msg = messageFromSubmitError(e)
      const err = e instanceof Error ? e : new Error(msg || 'KYC submit failed')
      if (msg) err.message = msg
      throw err
    }
  },

  getKycStatus: async (): Promise<KycStatusResponse> => {
    const response = await apiClient.get('/kyc/status')
    return response.data.data || response.data
  },
}
