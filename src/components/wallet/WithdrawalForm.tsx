import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { WithdrawCreateRequest } from '@/types'
import { walletApi } from '@/api/walletApi'
import { useState } from 'react'
import { formatCurrency } from '@/utils/formatters'
import { AlertCircle, Landmark } from 'lucide-react'

const withdrawalSchema = z.object({
  mxcAmount: z.number().min(100, 'Minimum withdrawal is 100 MXC'),
  bankName: z.string().min(1, 'Bank name is required'),
  bankAccountNo: z.string().min(1, 'Bank account number is required'),
  bankAccountName: z.string().min(1, 'Bank account name is required'),
})

interface WithdrawalFormProps {
  userId: string
  onSuccess?: () => void
}

export default function WithdrawalForm({ userId, onSuccess }: WithdrawalFormProps) {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<WithdrawCreateRequest>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      mxcAmount: 100,
    }
  })

  const mxcAmount = watch('mxcAmount')
  const feeMxc = mxcAmount ? mxcAmount * 0.02 : 0 // 2% fee as defined in controller
  const netMxc = mxcAmount ? mxcAmount - feeMxc : 0
  const realAmountVnd = netMxc * 1000

  const onSubmit = async (data: WithdrawCreateRequest) => {
    try {
      setLoading(true)
      setError('')
      setSuccess(false)
      await walletApi.createWithdrawal(userId, data)
      setSuccess(true)
      reset()
      onSuccess?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Withdrawal failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Amount Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="mxcAmount" className="block text-sm font-semibold text-gray-700 mb-1">
            Withdraw Amount (MXC) *
          </label>
          <div className="relative">
            <input
              id="mxcAmount"
              type="number"
              step="1"
              {...register('mxcAmount', { valueAsNumber: true })}
              className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="100"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">
              MXC
            </div>
          </div>
          {errors.mxcAmount && <p className="mt-1 text-xs text-red-500">{errors.mxcAmount.message}</p>}
        </div>

        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col justify-center">
          <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold">
            <span>Fee (2%)</span>
            <span className="text-red-500">-{formatCurrency(feeMxc)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-gray-900 mt-1">
            <span>Net Received</span>
            <span className="text-green-600">{formatCurrency(netMxc)}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 text-right italic">
            ≈ {realAmountVnd.toLocaleString()} VND
          </p>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 space-y-4">
        <div className="flex items-center gap-2 text-blue-800 mb-1">
          <Landmark className="w-4 h-4" />
          <h4 className="text-sm font-bold">Bank Account Details</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bankName" className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Bank Name
            </label>
            <input
              id="bankName"
              type="text"
              {...register('bankName')}
              className="block w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              placeholder="e.g. Vietcombank"
            />
            {errors.bankName && <p className="mt-1 text-[10px] text-red-500">{errors.bankName.message}</p>}
          </div>

          <div>
            <label htmlFor="bankAccountNo" className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Account Number
            </label>
            <input
              id="bankAccountNo"
              type="text"
              {...register('bankAccountNo')}
              className="block w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              placeholder="0123456789"
            />
            {errors.bankAccountNo && <p className="mt-1 text-[10px] text-red-500">{errors.bankAccountNo.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="bankAccountName" className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
            Account Holder Name
          </label>
          <input
            id="bankAccountName"
            type="text"
            {...register('bankAccountName')}
            className="block w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            placeholder="NGUYEN VAN A"
          />
          {errors.bankAccountName && <p className="mt-1 text-[10px] text-red-500">{errors.bankAccountName.message}</p>}
        </div>
      </div>

      <div className="flex gap-2 text-[10px] text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <p>Withdrawals are processed within 24-48 hours. Please ensure your bank details are correct.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          Withdrawal request submitted! Our team will review it shortly.
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl shadow-lg transition-all disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Request Withdrawal'}
      </button>
    </form>
  )
}
