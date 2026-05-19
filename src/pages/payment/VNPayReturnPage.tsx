import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { paymentApi } from '@/api/paymentApi'
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'

export default function VNPayReturnPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    orderId?: string
    amount?: number
    transactionNo?: string
  } | null>(null)

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Convert URLSearchParams to object
        const params: Record<string, string> = {}
        searchParams.forEach((value, key) => {
          params[key] = value
        })

        // Call backend to process callback
        const response = await paymentApi.processVNPayCallback(params)

        if (response.code === '00') {
          setResult({
            success: true,
            message: 'Payment successful! Your wallet has been credited.',
            orderId: response.orderId,
            amount: response.amount,
            transactionNo: response.transactionNo,
          })
        } else {
          setResult({
            success: false,
            message: getErrorMessage(response.code),
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

  const getErrorMessage = (code: string): string => {
    const errorMessages: Record<string, string> = {
      '07': 'Transaction successful but suspected fraud. Please contact support.',
      '09': 'Card not registered for Internet Banking.',
      '10': 'Card authentication failed.',
      '11': 'Payment timeout. Please try again.',
      '12': 'Card is locked.',
      '13': 'Wrong OTP. Please try again.',
      '24': 'Transaction cancelled.',
      '51': 'Insufficient balance.',
      '65': 'Transaction limit exceeded.',
      '75': 'Payment bank under maintenance.',
      '79': 'Payment timeout. Please retry.',
      '99': 'Unknown error occurred.',
    }
    return errorMessages[code] || 'Payment failed. Please try again.'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
          <p className="text-gray-600">Please wait while we verify your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {result?.success ? (
          <>
            {/* Success State */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600">{result.message}</p>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
              {result.orderId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-semibold text-gray-900">{result.orderId}</span>
                </div>
              )}
              {result.transactionNo && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transaction No:</span>
                  <span className="font-semibold text-gray-900">{result.transactionNo}</span>
                </div>
              )}
              {result.amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-green-600">
                    {result.amount.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                <span className="text-gray-600">MXC Received:</span>
                <span className="font-bold text-primary-600">
                  {result.amount ? (result.amount * 0.0001).toFixed(4) : '0.0000'} MXC
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/wallet')}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Go to Wallet</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Error State */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
              <p className="text-gray-600">{result?.message}</p>
            </div>

            {/* Payment Details */}
            {result?.orderId && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-semibold text-gray-900">{result.orderId}</span>
                </div>
                {result.amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold text-gray-900">
                      {result.amount.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/wallet')}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </>
        )}

        {/* Support Note */}
        <p className="text-xs text-center text-gray-500 mt-6">
          Need help? Contact our support team
        </p>
      </div>
    </div>
  )
}
