import apiClient from './client'
import { ApiResponse } from '@/types'

const pendingPaymentKeys = new Map<string, string>()

const createRequestKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

async function createIdempotentPayment<T>(
  endpoint: string,
  data: PayOSPaymentRequest
): Promise<T> {
  const fingerprint = `${endpoint}:${JSON.stringify(data)}`
  const idempotencyKey = pendingPaymentKeys.get(fingerprint) || createRequestKey()
  pendingPaymentKeys.set(fingerprint, idempotencyKey)
  try {
    const response = await apiClient.post<ApiResponse<T>>(endpoint, data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    })
    pendingPaymentKeys.delete(fingerprint)
    return response.data.data
  } catch (error: any) {
    if (error?.response && error.response.status < 500) {
      pendingPaymentKeys.delete(fingerprint)
    }
    throw error
  }
}

export interface PayOSPaymentRequest {
  amount: string
  currency: string
  orderInfo?: string
  returnUrl?: string
  cancelUrl?: string
}

export interface PayOSPaymentResponse {
  code: string
  message: string
  orderCode?: number
  paymentLinkId?: string
  checkoutUrl?: string
  qrCode?: string
  amount?: number
  status?: string
}

export interface PayOSReturnResponse {
  code: string
  message: string
  orderCode?: number
  paymentLinkId?: string
  status?: string
  cancel?: boolean
  amount?: number
  transactionId?: string
}

export const paymentApi = {
  createPayOSPayment: async (data: PayOSPaymentRequest): Promise<PayOSPaymentResponse> => {
    return createIdempotentPayment<PayOSPaymentResponse>(
      '/v1/payment/payos/create',
      data
    )
  },

  processPayOSReturn: async (params: Record<string, string>): Promise<PayOSReturnResponse> => {
    const queryString = new URLSearchParams(params).toString()
    const response = await apiClient.get<ApiResponse<PayOSReturnResponse>>(
      `/v1/payment/payos/return?${queryString}`
    )
    return response.data.data
  },

  checkPayOSStatus: async (orderCode: number): Promise<PayOSReturnResponse> => {
    const response = await apiClient.get<ApiResponse<PayOSReturnResponse>>(
      `/v1/payment/payos/status/${orderCode}`
    )
    return response.data.data
  },
}
