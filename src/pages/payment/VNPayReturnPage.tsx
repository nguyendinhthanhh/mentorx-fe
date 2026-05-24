import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle, Loader2, Wallet, XCircle } from 'lucide-react'
import { paymentApi } from '@/api/paymentApi'
import { walletApi } from '@/api/walletApi'
import { useAuthStore } from '@/store/authStore'
import { formatFiatCurrency, formatMxc } from '@/utils/formatters'

export default function VNPayReturnPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [updatedBalance, setUpdatedBalance] = useState<number | null>(null)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    orderId?: string
    amount?: number | string
    transactionNo?: string
  } | null>(null)

  useEffect(() => {
    const processPayment = async () => {
      try {
        const params: Record<string, string> = {}
        searchParams.forEach((value, key) => {
          params[key] = value
        })

        const response = await paymentApi.processVNPayCallback(params)

        if (response.code === '00') {
          setResult({
            success: true,
            message: 'Payment confirmed by backend. Your wallet balance will refresh from the latest server state.',
            orderId: response.orderId,
            amount: response.amount,
            transactionNo: response.transactionNo,
          })

          if (user?.userId) {
            const balance = await walletApi.getUserBalance(user.userId)
            setUpdatedBalance(balance.available)
          }
        } else {
          setResult({
            success: false,
            message: getErrorMessage(response.code),
            orderId: response.orderId,
            amount: response.amount,
          })
        }
      } catch (error: any) {
        setResult({
          success: false,
          message: error.response?.data?.message || 'Failed to process payment. Please contact support.',
        })
      } finally {
        setLoading(false)
      }
    }

    processPayment()
  }, [searchParams, user?.userId])

  const getErrorMessage = (code: string): string => {
    const errorMessages: Record<string, string> = {
      '07': 'Transaction completed but flagged for review. Please contact support.',
      '09': 'Card is not registered for internet banking.',
      '10': 'Card authentication failed.',
      '11': 'Payment timed out. Please try again.',
      '12': 'Card is locked.',
      '13': 'Incorrect OTP.',
      '24': 'Transaction was cancelled.',
      '51': 'Insufficient balance.',
      '65': 'Transaction limit exceeded.',
      '75': 'Payment bank is under maintenance.',
      '79': 'Payment timed out. Please retry.',
      '99': 'Unknown error occurred.',
    }
    return errorMessages[code] || 'Payment failed. Please try again.'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Verifying your payment</h2>
          <p className="mt-2 text-sm text-slate-600">Please wait while Mentor X confirms the VNPay callback.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {result?.success ? (
          <>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle className="h-12 w-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Deposit confirmed</h2>
              <p className="mt-2 text-sm text-slate-600">{result.message}</p>
            </div>

            <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4">
              {result.orderId && <ReturnRow label="Order ID" value={result.orderId} />}
              {result.transactionNo && <ReturnRow label="VNPay transaction" value={result.transactionNo} />}
              {result.amount && <ReturnRow label="Original payment" value={formatFiatCurrency(result.amount, 'VND')} />}
              <ReturnRow
                label="Wallet status"
                value={updatedBalance !== null ? `Available balance: ${formatMxc(updatedBalance)}` : 'Balance will refresh from backend in wallet screen'}
              />
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => navigate('/wallet')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600"
              >
                <Wallet className="h-4 w-4" />
                <span>Go to wallet</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to dashboard
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
                <XCircle className="h-12 w-12 text-rose-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Deposit failed</h2>
              <p className="mt-2 text-sm text-slate-600">{result?.message}</p>
            </div>

            <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4">
              {result?.orderId && <ReturnRow label="Order ID" value={result.orderId} />}
              {result?.amount && <ReturnRow label="Attempted amount" value={formatFiatCurrency(result.amount, 'VND')} />}
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => navigate('/wallet')}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600"
              >
                Try again
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ReturnRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  )
}
