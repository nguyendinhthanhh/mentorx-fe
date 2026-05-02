import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TransferRequest } from '@/types'
import { walletApi } from '@/api/walletApi'
import { useState } from 'react'

const transferSchema = z.object({
  toUserId: z.string().uuid('Invalid user ID'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
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
      <div>
        <label htmlFor="toUserId" className="label">
          Recipient User ID *
        </label>
        <input
          id="toUserId"
          type="text"
          {...register('toUserId')}
          className="input"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        {errors.toUserId && <p className="error-message">{errors.toUserId.message}</p>}
      </div>

      <div>
        <label htmlFor="amount" className="label">
          Amount (MXC) *
        </label>
        <input
          id="amount"
          type="number"
          step="0.01"
          {...register('amount', { valueAsNumber: true })}
          className="input"
          placeholder="100.00"
        />
        {errors.amount && <p className="error-message">{errors.amount.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          className="input"
          rows={3}
          placeholder="Optional note about this transfer..."
        />
        {errors.description && <p className="error-message">{errors.description.message}</p>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Transfer successful!
        </div>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? 'Processing...' : 'Transfer'}
      </button>
    </form>
  )
}
