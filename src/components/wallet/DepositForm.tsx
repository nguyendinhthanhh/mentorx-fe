import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { formatCurrency } from '@/utils/formatters'
import { Info, CreditCard, Wallet } from 'lucide-react'
import { paymentApi } from '@/api/paymentApi'

const depositSchema = z.object({
  amount: z.number().min(10000, 'Minimum deposit is 10,000 VND'),
  bankCode: z.string().optional(),
})

type DepositFormData = z.infer<typeof depositSchema>

interface DepositFormProps {
  userId: string
  onSuccess?: () => void
}

export default function DepositForm({ userId, onSuccess }: DepositFormProps) {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [selectedBank, setSelectedBank] = useState<string>('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 100000,
      bankCode: '',
    }
  })

  const amount = watch('amount')
  const bankCode = watch('bankCode')
  const mxcAmount = amount ? amount * 0.0001 : 0

  const banks = [
    { code: '', name: 'All Banks', icon: '🏦' },
    { code: 'VNPAYQR', name: 'VNPay QR', icon: '📱' },
    { code: 'MOMO', name: 'MoMo Wallet', icon: '💎' },
    { code: 'VNBANK', name: 'Local Bank', icon: '🏛️' },
    { code: 'INTCARD', name: 'International Card', icon: '💳' },
  ]

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000]

  const onSubmit = async (data: DepositFormData) => {
    try {
      setLoading(true)
      setError('')
      
      if (data.bankCode === 'MOMO') {
        const response = await paymentApi.createMomoPayment({
          amount: data.amount,
          orderInfo: `Nap tien vao vi MentorX - ${data.amount.toLocaleString('vi-VN')} VND`,
        })

        if (response.resultCode === '0' && response.payUrl) {
          window.location.href = response.payUrl
        } else {
          setError(response.message || 'Failed to create MoMo payment URL')
          setLoading(false)
        }
      } else {
        // Call VNPay API to create payment URL
        const response = await paymentApi.createVNPayPayment({
          amount: data.amount,
          orderInfo: `Nap tien vao vi MentorX - ${data.amount.toLocaleString('vi-VN')} VND`,
          bankCode: data.bankCode || undefined,
        })

        if (response.code === '00' && response.paymentUrl) {
          window.location.href = response.paymentUrl
        } else {
          setError(response.message || 'Failed to create payment URL')
          setLoading(false)
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      const message = err.response?.data?.message || err.message || 'Payment failed. Please try again.'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
        <div className="text-sm text-primary-900">
          <p className="font-semibold mb-1">💱 Exchange Rate</p>
          <p className="text-primary-700">1 VND = 0.0001 MXC • Minimum: 10,000 VND</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Quick Amount Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Quick Select Amount
          </label>
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setValue('amount', amt)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  amount === amt
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {(amt / 1000).toFixed(0)}K
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div>
          <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
            Or Enter Custom Amount (VND)
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Wallet className="w-5 h-5" />
            </div>
            <input
              id="amount"
              type="number"
              step="1000"
              {...register('amount', { valueAsNumber: true })}
              className="block w-full pl-12 pr-16 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg font-semibold"
              placeholder="100,000"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
              VND
            </div>
          </div>
          {errors.amount && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.amount.message}</p>}
        </div>

        {/* Conversion Display */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700 uppercase tracking-wider font-bold mb-1">You will receive</p>
              <p className="text-3xl font-bold text-green-900">{formatCurrency(mxcAmount)}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-green-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-xs text-green-700">
              <span className="font-semibold">{amount?.toLocaleString('vi-VN')} VND</span> = <span className="font-semibold">{mxcAmount.toFixed(4)} MXC</span>
            </p>
          </div>
        </div>

        {/* Bank Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Payment Method (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {banks.map((bank) => (
              <label
                key={bank.code}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  bankCode === bank.code
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value={bank.code}
                  {...register('bankCode')}
                  className="hidden"
                />
                <span className="text-xl">{bank.icon}</span>
                <span className={`text-xs font-semibold ${
                  bankCode === bank.code ? 'text-primary-700' : 'text-gray-600'
                }`}>
                  {bank.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 text-base"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Redirecting to VNPay...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>Pay with VNPay</span>
            </>
          )}
        </button>

        {/* Security Note */}
        <p className="text-xs text-center text-gray-500">
          🔒 Secured by VNPay • Your payment information is encrypted
        </p>
      </form>
    </div>
  )
}
