import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { paymentApi } from '@/api/paymentApi'
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'

export default function MomoReturnPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    orderId?: string
    amount?: number
    transId?: string
  } | null>(null)

  useEffect(() => {
    const processPayment = async () => {
      try {
        const params: Record<string, string> = {}
        searchParams.forEach((value, key) => {
          params[key] = value
        })

        // Call backend to process return
        const response = await paymentApi.processMomoReturn(params)

        if (response.resultCode === '0') {
          setResult({
            success: true,
            message: 'Payment successful! Your wallet has been credited.',
            orderId: response.orderId,
            amount: response.amount,
            transId: response.transId,
          })
        } else {
          setResult({
            success: false,
            message: response.message || 'Giao dịch bị hủy hoặc thất bại.',
            orderId: response.orderId,
            amount: response.amount,
          })
        }
      } catch (error: any) {
        console.error('Payment processing error:', error)
        setResult({
          success: false,
          message: error.response?.data?.message || 'Failed to process payment. Please contact support.',
        })
      } finally {
        setLoading(false)
      }
    }

    processPayment()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-pink-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đang xử lý thanh toán MoMo</h2>
          <p className="text-gray-600">Vui lòng đợi trong khi chúng tôi xác nhận giao dịch...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {result?.success ? (
          <>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h2>
              <p className="text-gray-600">{result.message}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
              {result.orderId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-semibold text-gray-900">{result.orderId}</span>
                </div>
              )}
              {result.transId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mã giao dịch MoMo:</span>
                  <span className="font-semibold text-gray-900">{result.transId}</span>
                </div>
              )}
              {result.amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-bold text-green-600">
                    {result.amount.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/wallet')}
                className="w-full bg-[#ae2070] hover:bg-[#8e1a5c] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Vào ví của tôi</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all"
              >
                Về bảng điều khiển
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h2>
              <p className="text-gray-600">{result?.message}</p>
            </div>

            {result?.orderId && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-semibold text-gray-900">{result.orderId}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => navigate('/wallet')}
                className="w-full bg-[#ae2070] hover:bg-[#8e1a5c] text-white font-bold py-3 rounded-xl transition-all"
              >
                Thử lại
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all"
              >
                Về bảng điều khiển
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
