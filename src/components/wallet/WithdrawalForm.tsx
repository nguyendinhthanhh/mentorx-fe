import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { WithdrawalRequest } from '@/types'
import { walletApi } from '@/api/walletApi'
import { useState } from 'react'

const withdrawalSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
  withdrawalMethod: z.string().min(1, 'Withdrawal method is required'),
  bankAccount: z.string().optional(),
  paypalEmail: z.string().email('Invalid email').optional().or(z.literal('')),
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
  } = useForm<WithdrawalRequest>({
    resolver: zodResolver(withdrawalSchema),
  })

  const withdrawalMethod = watch('withdrawalMethod')

  const onSubmit = async (data: WithdrawalRequest) => {
    try {
      setLoading(true)
      setError('')
      setSuccess(false)
      await walletApi.withdraw(userId, data)
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
        <label htmlFor="withdrawalMethod" className="label">
          Withdrawal Method *
        </label>
        <select id="withdrawalMethod" {...register('withdrawalMethod')} className="input">
          <option value="">Select withdrawal method</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="paypal">PayPal</option>
          <option value="crypto">Cryptocurrency</option>
        </select>
        {errors.withdrawalMethod && <p className="error-message">{errors.withdrawalMethod.message}</p>}
      </div>

      {withdrawalMethod === 'bank_transfer' && (
        <div>
          <label htmlFor="bankAccount" className="label">
            Bank Account Number
          </label>
          <input
            id="bankAccount"
            type="text"
            {...register('bankAccount')}
            className="input"
            placeholder="1234567890"
          />
          {errors.bankAccount && <p className="error-message">{errors.bankAccount.message}</p>}
        </div>
      )}

      {withdrawalMethod === 'paypal' && (
        <div>
          <label htmlFor="paypalEmail" className="label">
            PayPal Email
          </label>
          <input
            id="paypalEmail"
            type="email"
            {...register('paypalEmail')}
            className="input"
            placeholder="your@paypal.com"
          />
          {errors.paypalEmail && <p className="error-message">{errors.paypalEmail.message}</p>}
        </div>
      )}

      <div>
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          className="input"
          rows={3}
          placeholder="Optional note about this withdrawal..."
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
          Withdrawal request submitted successfully!
        </div>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? 'Processing...' : 'Withdraw'}
      </button>
    </form>
  )
}
