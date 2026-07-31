import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, CreditCard, Info, Loader2, Wallet } from 'lucide-react'
import { paymentApi } from '@/api/paymentApi'
import { walletApi } from '@/api/walletApi'
import {
  formatExchangeRate,
  formatFiatCurrency,
  formatMxc,
} from '@/utils/formatters'
import type { WalletConversionPreviewResponse } from '@/types'

const CURRENCY_OPTIONS = ['VND', 'USD', 'EUR', 'SGD', 'JPY'] as const
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
    formState: { errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      originalAmount: '100000',
      originalCurrency: 'VND',
    },
  })

  const originalAmount = watch('originalAmount')
  const originalCurrency = watch('originalCurrency')

  const isForeignCurrency = originalCurrency !== 'VND'
  const hasValidAmount = isPositiveDecimalString(originalAmount || '')

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

  const canSubmit =
    !loading &&
    !previewLoading &&
    hasValidAmount &&
    Boolean(originalCurrency) &&
    !isForeignCurrency &&
    !previewError &&
    Boolean(preview)

  const onSubmit = async (data: DepositFormData) => {
    try {
      setLoading(true)
      setError('')

      const orderInfo = `MentorX wallet top-up - ${formatFiatCurrency(data.originalAmount, data.originalCurrency)}`
      const response = await paymentApi.createPayOSPayment({
        amount: data.originalAmount.trim(),
        currency: data.originalCurrency,
        orderInfo,
      })

      if (response.code === '00' && response.checkoutUrl) {
        onSuccess?.()
        window.location.href = response.checkoutUrl
        return
      }

      setError(response.message || 'Failed to create PayOS payment URL')
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
                className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-base font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
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
            {previewLoading && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
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
                <p className="font-semibold">Current PayOS top-up flow supports VND only</p>
                <p className="mt-1 text-amber-700">
                  Mentor X now keeps only the real PayOS checkout on web. Foreign-currency deposits still need a separate supported gateway before this flow can complete end-to-end.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">Payment method</p>
              <p className="mt-1 text-sm text-slate-600">
                PayOS is the only supported web checkout. You will be redirected to the PayOS hosted payment page after confirmation.
              </p>
            </div>
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
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
    <div className={`flex items-center justify-between rounded-2xl px-4 py-3 ${highlight ? 'bg-emerald-50' : 'bg-slate-50'}`}>
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-emerald-700' : 'text-slate-900'}`}>{value}</span>
    </div>
  )
}
