import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DepositCreateRequest } from '@/types'
import { walletApi } from '@/api/walletApi'
import { useState } from 'react'
import { formatCurrency } from '@/utils/formatters'
import { Info } from 'lucide-react'

const depositSchema = z.object({
  amountVnd: z.number().min(10000, 'Minimum deposit is 10,000 VND'),
  gateway: z.string().min(1, 'Gateway is required'),
})

interface DepositFormProps {
  userId: string
  onSuccess?: () => void
}

export default function DepositForm({ userId, onSuccess }: DepositFormProps) {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string>('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DepositCreateRequest>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      gateway: 'VNPAY',
      amountVnd: 50000,
    }
  })

  const amountVnd = watch('amountVnd')
  const mxcAmount = amountVnd ? amountVnd / 1000 : 0

  const onSubmit = async (data: DepositCreateRequest) => {
    try {
      setLoading(true)
      setError('')
      console.log('Creating deposit order for userId:', userId, 'data:', data)
      const response = await walletApi.createDeposit(userId, data)
      console.log('Deposit order response:', response)
      
      // In a real app, the response might contain a redirect URL to the payment gateway
      // For now we simulate success
      alert(`Deposit order created: ${response.gatewayOrderId}. You would be redirected to ${data.gateway} now.`)
      onSuccess?.()
    } catch (err: any) {
      console.error('Deposit error:', err)
      const message = err.response?.data?.message || err.message || 'Deposit failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
        <div className="text-sm text-primary-800">
          <p className="font-semibold">Exchange Rate</p>
          <p>1 MXC = 1,000 VND. Your deposit will be converted to MXC automatically.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="amountVnd" className="block text-sm font-semibold text-gray-700 mb-1">
            Amount (VND) *
          </label>
          <div className="relative">
            <input
              id="amountVnd"
              type="number"
              step="1000"
              {...register('amountVnd', { valueAsNumber: true })}
              className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="50,000"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
              VND
            </div>
          </div>
          {errors.amountVnd && <p className="mt-1 text-xs text-red-500">{errors.amountVnd.message}</p>}
        </div>

        <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">You will receive</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(mxcAmount)}</p>
        </div>

        <div>
          <label htmlFor="gateway" className="block text-sm font-semibold text-gray-700 mb-1">
            Payment Gateway
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['VNPAY', 'STRIPE'].map((gw) => (
              <label
                key={gw}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  watch('gateway') === gw
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  value={gw}
                  {...register('gateway')}
                  className="hidden"
                />
                <span className={`text-sm font-bold ${watch('gateway') === gw ? 'text-primary-700' : 'text-gray-600'}`}>
                  {gw}
                </span>
              </label>
            ))}
          </div>
          {errors.gateway && <p className="mt-1 text-xs text-red-500">{errors.gateway.message}</p>}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-200 transition-all disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? 'Processing...' : 'Go to Payment'}
        </button>
      </form>
    </div>
  )
}
