import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DepositRequest } from '@/types'
import { walletApi } from '@/api/walletApi'
import { useState } from 'react'

const depositSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
  paymentMethod: z.string().optional(),
  externalTxnId: z.string().optional(),
})

interface DepositFormProps {
  userId: string
  onSuccess?: () => void
}

export default function DepositForm({ userId, onSuccess }: DepositFormProps) {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepositRequest>({
    resolver: zodResolver(depositSchema),
  })

  const onSubmit = async (data: DepositRequest) => {
    try {
      setLoading(true)
      setError('')
      setSuccess(false)
      await walletApi.deposit(userId, data)
      setSuccess(true)
      reset()
      onSuccess?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Deposit failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <label htmlFor="paymentMethod" className="label">
          Payment Method
        </label>
        <select id="paymentMethod" {...register('paymentMethod')} className="input">
          <option value="">Select payment method</option>
          <option value="credit_card">Credit Card</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="paypal">PayPal</option>
          <option value="crypto">Cryptocurrency</option>
        </select>
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
          placeholder="Optional note about this deposit..."
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
          Deposit successful!
        </div>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? 'Processing...' : 'Deposit'}
      </button>
    </form>
  )
}
