import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TransferRequest } from '@/types'
import { walletApi } from '@/api/walletApi'
import { useState } from 'react'
import { Send, User as UserIcon } from 'lucide-react'

const transferSchema = z.object({
  toUserId: z.string().uuid('Invalid user ID'),
  amount: z.number().min(0.1, 'Minimum transfer is 0.1 MXC'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
})

interface TransferFormProps {
  userId: string
  onSuccess?: () => void
}

export default function TransferForm({ userId, onSuccess }: TransferFormProps) {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransferRequest>({
    resolver: zodResolver(transferSchema),
  })

  const onSubmit = async (data: TransferRequest) => {
    try {
      setLoading(true)
      setError('')
      setSuccess(false)
      await walletApi.transfer(userId, data)
      setSuccess(true)
      reset()
      onSuccess?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Transfer failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 space-y-4">
        <div className="flex items-center gap-2 text-blue-800 mb-1">
          <Send className="w-4 h-4" />
          <h4 className="text-sm font-bold">Transfer Funds</h4>
        </div>

        <div>
          <label htmlFor="toUserId" className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
            Recipient User ID *
          </label>
          <div className="relative">
            <input
              id="toUserId"
              type="text"
              {...register('toUserId')}
              className="block w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {errors.toUserId && <p className="mt-1 text-[10px] text-red-500">{errors.toUserId.message}</p>}
        </div>

        <div>
          <label htmlFor="amount" className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
            Amount (MXC) *
          </label>
          <input
            id="amount"
            type="number"
            step="0.1"
            {...register('amount', { valueAsNumber: true })}
            className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm font-bold"
            placeholder="0.00"
          />
          {errors.amount && <p className="mt-1 text-[10px] text-red-500">{errors.amount.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
            Note (Optional)
          </label>
          <textarea
            id="description"
            {...register('description')}
            className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
            rows={2}
            placeholder="What is this for?"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          Transfer successful! Funds have been sent.
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send MXC Now'}
      </button>
    </form>
  )
}
