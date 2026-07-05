import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from 'react-query'
import { AlertCircle, ArrowRight, CheckCircle2, ChevronDown, Landmark, Loader2, ShieldCheck } from 'lucide-react'

import { bankAccountApi } from '@/api/bankAccountApi'
import { walletApi } from '@/api/walletApi'
import { useAuthStore } from '@/store/authStore'
import type { BankAccountResponse, WithdrawCreateRequest } from '@/types'
import { MentorStatus, VerificationStatus } from '@/types'
import { formatFiatCurrency, formatMxc } from '@/utils/formatters'

const withdrawalSchema = z.object({
  mxcAmount: z.number().min(100, 'Minimum withdrawal is 100 MXC'),
  bankName: z.string().min(1, 'A payout destination is required'),
  bankAccountNo: z.string().min(1, 'A payout destination is required'),
  bankAccountName: z.string().min(1, 'Account holder name is required'),
})

interface WithdrawalFormProps {
  userId: string
  onSuccess?: () => void
  onOpenPayoutSetup?: () => void
}

export default function WithdrawalForm({ userId, onSuccess, onOpenPayoutSetup }: WithdrawalFormProps) {
  const { user } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showAccountList, setShowAccountList] = useState(false)

  const { data: accounts } = useQuery(['bankAccounts', userId], () => bankAccountApi.getByUserId(userId), {
    enabled: !!userId,
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WithdrawCreateRequest>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      mxcAmount: 100,
    },
  })

  const defaultAccount = useMemo(
    () => accounts?.find((account) => account.isDefault) || accounts?.[0] || null,
    [accounts]
  )

  useEffect(() => {
    if (defaultAccount) {
      hydrateWithdrawalTarget(defaultAccount, setValue)
    }
  }, [defaultAccount, setValue])

  const mxcAmount = watch('mxcAmount')
  const feeMxc = mxcAmount ? mxcAmount * 0.02 : 0
  const netMxc = mxcAmount ? mxcAmount - feeMxc : 0
  const estimatedAmountVnd = netMxc * 1000

  const guard = getWithdrawalGuard({
    mentorStatus: user?.mentorStatus,
    payoutStatus: user?.payoutStatus,
    hasPayoutAccount: !!defaultAccount,
  })

  const onSubmit = async (data: WithdrawCreateRequest) => {
    if (guard.blocked) {
      setError(guard.message)
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess(false)

      await walletApi.createWithdrawal(userId, data)
      setSuccess(true)
      onSuccess?.()
    } catch (err: any) {
      const rawMessage = err?.response?.data?.message || err?.message || 'Withdrawal failed. Please try again.'
      if (/Insufficient MXC balance/i.test(rawMessage)) {
        setError('Your available MXC balance is not enough for this withdrawal.')
      } else if (/payout/i.test(rawMessage) || /identity/i.test(rawMessage) || /mentor/i.test(rawMessage)) {
        setError(rawMessage)
      } else {
        setError(rawMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const selectAccount = (account: BankAccountResponse) => {
    hydrateWithdrawalTarget(account, setValue)
    setShowAccountList(false)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-950">Withdrawal eligibility</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Mentor approval unlocks Mentor Mode. Withdrawal stays locked until payout review is approved.
            </p>
          </div>
          <div
            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
              guard.blocked ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {guard.blocked ? 'Blocked' : 'Ready'}
          </div>
        </div>

        {guard.blocked ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Action needed</p>
            <p className="mt-1 leading-6">{guard.message}</p>
            {guard.action === 'payout' && onOpenPayoutSetup && (
              <button
                type="button"
                onClick={onOpenPayoutSetup}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"
              >
                Set up payout
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Your mentor approval and payout setup meet the current withdrawal policy.</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="mxcAmount" className="mb-1 block text-sm font-semibold text-gray-700">
              Withdraw amount (MXC)
            </label>
            <div className="relative">
              <input
                id="mxcAmount"
                type="number"
                step="1"
                {...register('mxcAmount', { valueAsNumber: true })}
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-primary-500"
                placeholder="100"
                disabled={guard.blocked}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">MXC</div>
            </div>
            {errors.mxcAmount && <p className="mt-1 text-xs text-red-500">{errors.mxcAmount.message}</p>}
          </div>

          <div className="flex flex-col justify-center rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
              <span>Fee (2%)</span>
              <span className="text-red-500">-{formatMxc(feeMxc)}</span>
            </div>
            <div className="mt-1 flex justify-between text-xs font-bold text-gray-900">
              <span>Net amount</span>
              <span className="text-green-600">{formatMxc(netMxc)}</span>
            </div>
            <p className="mt-1 text-right text-[10px] italic text-gray-400">
              Estimated payout: {formatFiatCurrency(estimatedAmountVnd, 'VND')}
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800">
              <Landmark className="h-4 w-4" />
              <h4 className="text-sm font-bold">Selected payout destination</h4>
            </div>

            {accounts && accounts.length > 1 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAccountList(!showAccountList)}
                  className="flex items-center gap-1 rounded-lg border border-primary-100 bg-white px-2 py-1 text-[10px] font-bold text-primary-600 shadow-sm transition-colors hover:bg-primary-50"
                >
                  Saved payout methods
                  <ChevronDown className="h-3 w-3" />
                </button>

                {showAccountList && (
                  <div className="absolute right-0 z-20 mt-1 w-72 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                    <div className="mb-1 border-b border-gray-50 px-3 py-1.5">
                      <p className="text-[10px] font-bold uppercase text-gray-400">Choose payout destination</p>
                    </div>
                    {accounts.map((account) => (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => selectAccount(account)}
                        className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-900">{account.bankName}</span>
                          {account.isDefault && <CheckCircle2 className="h-3 w-3 text-primary-500" />}
                        </div>
                        <span className="text-[10px] text-gray-500">{account.accountNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="bankName" className="mb-1 block text-[10px] font-bold uppercase text-gray-500">
                Payout provider
              </label>
              <input
                id="bankName"
                type="text"
                {...register('bankName')}
                className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                readOnly
              />
              {errors.bankName && <p className="mt-1 text-[10px] text-red-500">{errors.bankName.message}</p>}
            </div>

            <div>
              <label htmlFor="bankAccountNo" className="mb-1 block text-[10px] font-bold uppercase text-gray-500">
                Destination reference
              </label>
              <input
                id="bankAccountNo"
                type="text"
                {...register('bankAccountNo')}
                className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                readOnly
              />
              {errors.bankAccountNo && <p className="mt-1 text-[10px] text-red-500">{errors.bankAccountNo.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="bankAccountName" className="mb-1 block text-[10px] font-bold uppercase text-gray-500">
              Account holder
            </label>
            <input
              id="bankAccountName"
              type="text"
              {...register('bankAccountName')}
              className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              readOnly
            />
            {errors.bankAccountName && (
              <p className="mt-1 text-[10px] text-red-500">{errors.bankAccountName.message}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-[10px] text-amber-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <p>
            Withdrawals are reviewed by Admin. The VND amount shown above is only an estimate based on the
            system rule 1 MXC = 1,000 VND.
          </p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Withdrawal request submitted. Admin will review it shortly.
          </div>
        )}

        <button
          type="submit"
          disabled={loading || guard.blocked}
          className="w-full rounded-xl bg-gray-900 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Request withdrawal'}
        </button>
      </form>
    </div>
  )
}

function hydrateWithdrawalTarget(
  account: BankAccountResponse,
  setValue: (name: keyof WithdrawCreateRequest, value: any) => void
) {
  setValue('bankName', account.bankName)
  setValue('bankAccountNo', account.accountNumber)
  setValue('bankAccountName', account.accountHolderName)
  setValue('payoutCountry', account.payoutCountry)
  setValue('payoutMethod', account.payoutMethod)
  setValue('payoutReference', getPayoutReference(account))
}

function getWithdrawalGuard({
  mentorStatus,
  payoutStatus,
  hasPayoutAccount,
}: {
  mentorStatus?: MentorStatus
  payoutStatus?: VerificationStatus
  hasPayoutAccount: boolean
}) {
  if (mentorStatus !== MentorStatus.APPROVED) {
    return {
      blocked: true,
      action: 'mentor' as const,
      message: 'Withdrawal is only available after your mentor application is approved.',
    }
  }

  if (!hasPayoutAccount || payoutStatus === VerificationStatus.NOT_SUBMITTED) {
    return {
      blocked: true,
      action: 'payout' as const,
      message: 'Set up payout details before requesting your first withdrawal.',
    }
  }

  if (payoutStatus === VerificationStatus.PENDING) {
    return {
      blocked: true,
      action: 'payout' as const,
      message: 'Your payout details are still under review. Withdrawal will unlock after approval.',
    }
  }

  if (payoutStatus === VerificationStatus.REJECTED || payoutStatus === VerificationStatus.NEEDS_MORE_INFO) {
    return {
      blocked: true,
      action: 'payout' as const,
      message: 'Your payout details need updates before withdrawal can be requested.',
    }
  }



  return {
    blocked: false,
    action: null,
    message: '',
  }
}

function getPayoutReference(account: BankAccountResponse) {
  switch (account.payoutMethod) {
    case undefined:
    case null:
      return account.accountNumber
    case 'PAYPAL':
      return account.paypalEmail || account.accountNumber
    case 'WISE':
      return account.wiseEmail || account.accountNumber
    case 'STRIPE_CONNECT':
      return account.stripeConnectAccountId || account.accountNumber
    case 'INTERNATIONAL_BANK':
      return account.iban || account.swiftCode || account.accountNumber
    default:
      return account.accountNumber
  }
}
