import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from 'react-query'
import { AlertCircle, CheckCircle2, ChevronDown, Landmark } from 'lucide-react'

import { bankAccountApi } from '@/api/bankAccountApi'
import { walletApi } from '@/api/walletApi'
import { useI18n } from '@/i18n/I18nProvider'
import type { BankAccountResponse, WithdrawCreateRequest } from '@/types'
import { formatFiatCurrency, formatMxc } from '@/utils/formatters'

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
  const { t } = useI18n()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showAccountList, setShowAccountList] = useState(false)

  const { data: accounts } = useQuery(
    ['bankAccounts', userId],
    () => bankAccountApi.getByUserId(userId),
    { enabled: !!userId }
  )

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

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const defaultAccount = accounts.find((account) => account.isDefault) || accounts[0]
      if (defaultAccount) {
        setValue('bankName', defaultAccount.bankName)
        setValue('bankAccountNo', defaultAccount.accountNumber)
        setValue('bankAccountName', defaultAccount.accountHolderName)
      }
    }
  }, [accounts, setValue])

  const selectAccount = (account: BankAccountResponse) => {
    setValue('bankName', account.bankName)
    setValue('bankAccountNo', account.accountNumber)
    setValue('bankAccountName', account.accountHolderName)
    setShowAccountList(false)
  }

  const mxcAmount = watch('mxcAmount')
  const feeMxc = mxcAmount ? mxcAmount * 0.02 : 0
  const netMxc = mxcAmount ? mxcAmount - feeMxc : 0
  const estimatedAmountVnd = netMxc * 1000

  const onSubmit = async (data: WithdrawCreateRequest) => {
    try {
      setLoading(true)
      setError('')
      setSuccess(false)

      await walletApi.createWithdrawal(userId, data)
      setSuccess(true)
      onSuccess?.()
    } catch (err: any) {
      const rawMessage = err?.response?.data?.message || err?.message || ''
      if (
        rawMessage.includes('Số dư MXC không đủ') ||
        rawMessage.includes('Sá»‘ dÆ° MXC khÃ´ng Ä‘á»§') ||
        rawMessage.includes('Insufficient MXC balance')
      ) {
        setError(t('wallet.error.insufficientBalance'))
      } else {
        setError(rawMessage || 'Withdrawal failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="mxcAmount" className="mb-1 block text-sm font-semibold text-gray-700">
            Withdraw Amount (MXC) *
          </label>
          <div className="relative">
            <input
              id="mxcAmount"
              type="number"
              step="1"
              {...register('mxcAmount', { valueAsNumber: true })}
              className="block w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-primary-500"
              placeholder="100"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
              MXC
            </div>
          </div>
          {errors.mxcAmount && <p className="mt-1 text-xs text-red-500">{errors.mxcAmount.message}</p>}
        </div>

        <div className="flex flex-col justify-center rounded-xl border border-gray-100 bg-gray-50 p-3">
          <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
            <span>Fee (2%)</span>
            <span className="text-red-500">-{formatMxc(feeMxc)}</span>
          </div>
          <div className="mt-1 flex justify-between text-xs font-bold text-gray-900">
            <span>Net Received</span>
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
            <h4 className="text-sm font-bold">Bank Account Details</h4>
          </div>

          {accounts && accounts.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAccountList(!showAccountList)}
                className="flex items-center gap-1 rounded-lg border border-primary-100 bg-white px-2 py-1 text-[10px] font-bold text-primary-600 shadow-sm transition-colors hover:bg-primary-50"
              >
                Saved Accounts <ChevronDown className="h-3 w-3" />
              </button>

              {showAccountList && (
                <div className="absolute right-0 z-20 mt-1 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                  <div className="mb-1 border-b border-gray-50 px-3 py-1.5">
                    <p className="text-[10px] font-bold uppercase text-gray-400">Choose Account</p>
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
              Bank Name
            </label>
            <input
              id="bankName"
              type="text"
              {...register('bankName')}
              className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="e.g. Vietcombank"
            />
            {errors.bankName && <p className="mt-1 text-[10px] text-red-500">{errors.bankName.message}</p>}
          </div>

          <div>
            <label htmlFor="bankAccountNo" className="mb-1 block text-[10px] font-bold uppercase text-gray-500">
              Account Number
            </label>
            <input
              id="bankAccountNo"
              type="text"
              {...register('bankAccountNo')}
              className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="0123456789"
            />
            {errors.bankAccountNo && <p className="mt-1 text-[10px] text-red-500">{errors.bankAccountNo.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="bankAccountName" className="mb-1 block text-[10px] font-bold uppercase text-gray-500">
            Account Holder Name
          </label>
          <input
            id="bankAccountName"
            type="text"
            {...register('bankAccountName')}
            className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="NGUYEN VAN A"
          />
          {errors.bankAccountName && <p className="mt-1 text-[10px] text-red-500">{errors.bankAccountName.message}</p>}
        </div>
      </div>

      <div className="flex gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-[10px] text-amber-600">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <p>
          Withdrawals are processed within 24-48 hours. The VND amount above is an estimate based on the fixed system rule 1 MXC = 1,000 VND.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Withdrawal request submitted. Our team will review it shortly.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gray-900 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-black disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Request Withdrawal'}
      </button>
    </form>
  )
}
