import apiClient from './client'
import { ApiResponse } from '@/types'

const pendingPaymentKeys = new Map<string, string>()

const createRequestKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

async function createIdempotentPayment<T>(
  endpoint: string,
  data: VNPayPaymentRequest | MomoPaymentRequest | PayOSPaymentRequest
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

export interface VNPayPaymentRequest {
  amount: string
  currency: string
  orderInfo?: string
  bankCode?: string
}

export interface VNPayPaymentResponse {
  code: string
  message: string
  paymentUrl: string
}

export interface VNPayCallbackResponse {
  code: string
  message: string
  orderId: string
  amount: number | string
  transactionNo?: string
  bankCode?: string
  payDate?: string
}

export interface MomoPaymentRequest {
  amount: string
  currency: string
  orderInfo?: string
  extraData?: string
}

export interface MomoPaymentResponse {
  partnerCode: string
  orderId: string
  requestId: string
  amount: string
  responseTime: string
  message: string
  resultCode: string
  payUrl: string
  qrCodeUrl: string
  deeplink: string
}

export interface PayOSPaymentRequest {
  amount: string
  currency: string
  orderInfo?: string
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

export interface MomoCallbackResponse {
  resultCode: string
  message: string
  orderId: string
  amount: number | string
  transId: string
  payType: string
}

export const paymentApi = {
  // Create VNPay payment URL
  createVNPayPayment: async (data: VNPayPaymentRequest): Promise<VNPayPaymentResponse> => {
    return createIdempotentPayment<VNPayPaymentResponse>(
      '/v1/payment/vnpay/create',
      data
    )
  },

  // Create MoMo payment URL
  createMomoPayment: async (data: MomoPaymentRequest): Promise<MomoPaymentResponse> => {
    return createIdempotentPayment<MomoPaymentResponse>(
      '/v1/payment/momo/create',
      data
    )
  },

  // Create PayOS payment URL
  createPayOSPayment: async (data: PayOSPaymentRequest): Promise<PayOSPaymentResponse> => {
    return createIdempotentPayment<PayOSPaymentResponse>(
      '/v1/payment/payos/create',
      data
    )
  },

  // Process VNPay callback/return
  processVNPayCallback: async (params: Record<string, string>): Promise<VNPayCallbackResponse> => {
    const queryString = new URLSearchParams(params).toString()
    const response = await apiClient.get<ApiResponse<VNPayCallbackResponse>>(
      `/v1/payment/vnpay/return?${queryString}`
    )
    return response.data.data
  },

  // Process MoMo callback/return
  processMomoReturn: async (params: Record<string, string>): Promise<MomoCallbackResponse> => {
    const queryString = new URLSearchParams(params).toString()
    const response = await apiClient.get<ApiResponse<MomoCallbackResponse>>(
      `/v1/payment/momo/return?${queryString}`
    )
    return response.data.data
  },

  // Process PayOS callback/return
  processPayOSReturn: async (params: Record<string, string>): Promise<PayOSReturnResponse> => {
    const queryString = new URLSearchParams(params).toString()
    const response = await apiClient.get<ApiResponse<PayOSReturnResponse>>(
      `/v1/payment/payos/return?${queryString}`
    )
    return response.data.data
  },
}
