import apiClient from './client'
import { ApiResponse } from '@/types'

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
    const response = await apiClient.post<ApiResponse<VNPayPaymentResponse>>(
      '/v1/payment/vnpay/create',
      data
    )
    return response.data.data
  },

  // Create MoMo payment URL
  createMomoPayment: async (data: MomoPaymentRequest): Promise<MomoPaymentResponse> => {
    const response = await apiClient.post<ApiResponse<MomoPaymentResponse>>(
      '/v1/payment/momo/create',
      data
    )
    return response.data.data
  },

  // Create PayOS payment URL
  createPayOSPayment: async (data: PayOSPaymentRequest): Promise<PayOSPaymentResponse> => {
    const response = await apiClient.post<ApiResponse<PayOSPaymentResponse>>(
      '/v1/payment/payos/create',
      data
    )
    return response.data.data
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
