import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, CreditCard, Info, Loader2, RefreshCw, Wallet } from 'lucide-react'
import { paymentApi } from '@/api/paymentApi'
import { walletApi } from '@/api/walletApi'
import {
  formatExchangeRate,
  formatFiatCurrency,
  formatMxc,
} from '@/utils/formatters'
import type { WalletConversionPreviewResponse } from '@/types'

const CURRENCY_OPTIONS = ['VND', 'USD', 'EUR', 'SGD', 'JPY'] as const
const GATEWAY_OPTIONS = [
  { value: 'VNPAY', label: 'VNPay', description: 'Internet banking, QR, local card' },
  { value: 'MOMO', label: 'MoMo', description: 'MoMo wallet redirect payment' },
] as const

const VNPAY_CHANNELS = [
  { value: '', label: 'Auto select', description: 'Let VNPay show all available methods' },
  { value: 'VNPAYQR', label: 'VNPay QR', description: 'Pay by QR flow in VNPay' },
  { value: 'VNBANK', label: 'Local bank', description: 'Redirect to domestic banking flow' },
  { value: 'INTCARD', label: 'International card', description: 'Use card flow inside VNPay' },
] as const

const quickAmounts = ['50000', '100000', '200000', '500000', '1000000', '2000000']

const isPositiveDecimalString = (value: string) => /^\d+(\.\d{1,6})?$/.test(value.trim()) && Number(value) > 0

const depositSchema = z.object({
  originalAmount: z
    .string()
    .trim()
    .min(1, 'Enter an amount')
    .refine(isPositiveDecimalString, 'Enter a valid amount greater than 0'),
  originalCurrency: z.enum(CURRENCY_OPTIONS, {
    errorMap: () => ({ message: 'Choose a currency' }),
  }),
  gateway: z.enum(['VNPAY', 'MOMO']).optional(),
  bankCode: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.originalCurrency === 'VND' && Number(value.originalAmount) < 10000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['originalAmount'],
      message: 'Minimum deposit is 10,000 VND',
    })
  }
})

type DepositFormData = z.infer<typeof depositSchema>

interface DepositFormProps {
  userId: string
  onSuccess?: () => void
}

export default function DepositForm({ userId: _userId, onSuccess }: DepositFormProps) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<WalletConversionPreviewResponse | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    resetField,
    formState: { errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      originalAmount: '100000',
      originalCurrency: 'VND',
      gateway: 'VNPAY',
      bankCode: '',
    },
  })

  const originalAmount = watch('originalAmount')
  const originalCurrency = watch('originalCurrency')
  const selectedGateway = watch('gateway')
  const bankCode = watch('bankCode')

  const isForeignCurrency = originalCurrency !== 'VND'
  const hasValidAmount = isPositiveDecimalString(originalAmount || '')

  useEffect(() => {
    if (originalCurrency !== 'VND') {
      resetField('gateway', { defaultValue: undefined })
      resetField('bankCode', { defaultValue: '' })
    } else if (!selectedGateway) {
      setValue('gateway', 'VNPAY')
    }
  }, [originalCurrency, resetField, selectedGateway, setValue])

  useEffect(() => {
    if (!hasValidAmount || !originalCurrency) {
      setPreview(null)
      setPreviewError('')
      setPreviewLoading(false)
      return
    }

    const timer = window.setTimeout(async () => {
      try {
        setPreviewLoading(true)
        setPreviewError('')
        const result = await walletApi.getConversionPreview({
          originalAmount: originalAmount.trim(),
          originalCurrency,
        })
        setPreview(result)
      } catch (_err: any) {
        setPreview(null)
        setPreviewError('Exchange rate is temporarily unavailable. Please try again later.')
      } finally {
        setPreviewLoading(false)
      }
    }, 450)

    return () => window.clearTimeout(timer)
  }, [hasValidAmount, originalAmount, originalCurrency])

  const canSubmit = useMemo(() => {
    if (loading || previewLoading || !hasValidAmount) return false
    if (!originalCurrency) return false
    if (isForeignCurrency) return false
    if (!selectedGateway) return false
    if (previewError) return false
    return Boolean(preview)
  }, [
    hasValidAmount,
    isForeignCurrency,
    loading,
    originalCurrency,
    preview,
    previewError,
    previewLoading,
    selectedGateway,
  ])

  const onSubmit = async (data: DepositFormData) => {
    try {
      setLoading(true)
      setError('')

      const orderInfo = `MentorX wallet top-up - ${formatFiatCurrency(data.originalAmount, data.originalCurrency)}`

      if (data.gateway === 'MOMO') {
        const response = await paymentApi.createMomoPayment({
          amount: data.originalAmount.trim(),
          currency: data.originalCurrency,
          orderInfo,
        })

        if (response.resultCode === '0' && response.payUrl) {
          onSuccess?.()
          window.location.href = response.payUrl
          return
        }

        setError(response.message || 'Failed to create MoMo payment URL')
        return
      }

      const response = await paymentApi.createVNPayPayment({
        amount: data.originalAmount.trim(),
        currency: data.originalCurrency,
        orderInfo,
        bankCode: data.bankCode || undefined,
      })

      if (response.code === '00' && response.paymentUrl) {
        onSuccess?.()
        window.location.href = response.paymentUrl
        return
      }

      setError(response.message || 'Failed to create payment URL')
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message
      setError(backendMessage || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const previewRateLabel = preview?.originalCurrency === 'VND' ? 'MXC rate' : 'Exchange rate'
  const previewRateValue = preview
    ? preview.originalCurrency === 'VND'
      ? `1 MXC = ${formatFiatCurrency('1000', 'VND')}`
      : formatExchangeRate(preview.exchangeRateToVnd, preview.originalCurrency, 'VND')
    : ''

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-white p-2 shadow-sm">
            <Info className="h-4 w-4 text-slate-600" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Backend-settled deposit flow</p>
            <p className="text-sm text-slate-600">
              You enter the original amount and currency. Mentor X backend computes the exchange rate, converted VND amount, and final MXC credit.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-[1.35fr_0.65fr]">
          <div>
            <label htmlFor="originalAmount" className="mb-2 block text-sm font-semibold text-slate-700">
              Amount
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Wallet className="h-5 w-5" />
              </div>
              <input
                id="originalAmount"
                inputMode="decimal"
                autoComplete="off"
                {...register('originalAmount')}
                className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-base font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                placeholder={originalCurrency === 'VND' ? '100000' : '10'}
              />
            </div>
            {errors.originalAmount && (
              <p className="mt-2 text-xs font-medium text-rose-600">{errors.originalAmount.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="originalCurrency" className="mb-2 block text-sm font-semibold text-slate-700">
              Currency
            </label>
            <select
              id="originalCurrency"
              {...register('originalCurrency')}
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              {CURRENCY_OPTIONS.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            {errors.originalCurrency && (
              <p className="mt-2 text-xs font-medium text-rose-600">{errors.originalCurrency.message}</p>
            )}
          </div>
        </div>

        {originalCurrency === 'VND' && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Quick amounts</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setValue('originalAmount', amount, { shouldValidate: true })}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    originalAmount === amount
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {formatFiatCurrency(amount, 'VND')}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Conversion preview</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Settlement handled by backend</h3>
            </div>
            {previewLoading && <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />}
          </div>

          <div className="mt-4">
            {previewLoading ? (
              <div className="grid gap-3">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : preview ? (
              <div className="grid gap-3">
                <PreviewRow label="You pay" value={formatFiatCurrency(preview.originalAmount, preview.originalCurrency)} />
                <PreviewRow label={previewRateLabel} value={previewRateValue} />
                <PreviewRow label="Converted amount" value={formatFiatCurrency(preview.convertedAmountVnd, 'VND')} />
                <PreviewRow label="You receive" value={formatMxc(preview.amountMxc)} highlight />
              </div>
            ) : previewError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {previewError}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Enter an amount and select a currency to load the backend conversion preview.
              </div>
            )}
          </div>
        </div>

        {isForeignCurrency ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Current online gateways still support VND only</p>
                <p className="mt-1 text-amber-700">
                  This frontend now sends only the original amount and currency, but the current backend payment gateways are VNPay and MoMo, both VND-only. Foreign-currency deposits still need an international gateway before this flow can complete end-to-end.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Payment gateway</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {GATEWAY_OPTIONS.map((gateway) => (
                  <label
                    key={gateway.value}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      selectedGateway === gateway.value
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input type="radio" value={gateway.value} {...register('gateway')} className="hidden" />
                    <p className="text-sm font-semibold text-slate-900">{gateway.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{gateway.description}</p>
                  </label>
                ))}
              </div>
            </div>

            {selectedGateway === 'VNPAY' && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">VNPay channel</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {VNPAY_CHANNELS.map((channel) => (
                    <label
                      key={channel.value || 'AUTO'}
                      className={`cursor-pointer rounded-2xl border p-4 transition ${
                        bankCode === channel.value
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input type="radio" value={channel.value} {...register('bankCode')} className="hidden" />
                      <p className={`text-sm font-semibold ${bankCode === channel.value ? 'text-white' : 'text-slate-900'}`}>
                        {channel.label}
                      </p>
                      <p className={`mt-1 text-xs ${bankCode === channel.value ? 'text-slate-200' : 'text-slate-500'}`}>
                        {channel.description}
                      </p>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirecting to payment gateway...</span>
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              <span>Confirm deposit</span>
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-500">
          Wallet balances are refreshed from backend after payment confirmation. Frontend never calculates or credits MXC directly.
        </p>
      </form>
    </div>
  )
}

function PreviewRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={`flex items-center justify-between rounded-2xl px-4 py-3 ${highlight ? 'bg-indigo-50' : 'bg-slate-50'}`}>
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-indigo-700' : 'text-slate-900'}`}>{value}</span>
    </div>
  )
}
