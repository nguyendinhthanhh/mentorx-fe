import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CreditCard,
  Globe2,
  Landmark,
  Loader2,
  Mail,
  Plus,
  RefreshCcw,
  Trash2,
} from 'lucide-react'

import { bankAccountApi } from '@/api/bankAccountApi'
import { useAuthStore } from '@/store/authStore'
import { BankAccountRequest, PayoutMethod, VerificationStatus } from '@/types'

interface BankAccountSettingsProps {
  userId: string
}

type PayoutFormValues = BankAccountRequest & {
  countryPreset?: string
}

export default function BankAccountSettings({ userId }: BankAccountSettingsProps) {
  const queryClient = useQueryClient()
  const { user, refreshUser } = useAuthStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')

  const { data: accounts, isLoading } = useQuery(['bankAccounts', userId], () => bankAccountApi.getByUserId(userId), {
    enabled: !!userId,
  })

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PayoutFormValues>({
    defaultValues: {
      payoutCountry: 'VN',
      payoutMethod: PayoutMethod.LOCAL_BANK,
    },
  })

  const payoutMethod = watch('payoutMethod')
  const payoutCountry = watch('payoutCountry')
  const payoutStatus = user?.payoutStatus ?? VerificationStatus.NOT_SUBMITTED

  const createMutation = useMutation(
    (data: BankAccountRequest) => bankAccountApi.create(userId, data),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(['bankAccounts', userId])
        await refreshUser()
        setShowAddForm(false)
        setError('')
        reset({
          payoutCountry: payoutCountry || 'VN',
          payoutMethod: payoutMethod || PayoutMethod.LOCAL_BANK,
        })
      },
      onError: (err: any) => {
        setError(err?.response?.data?.message || 'Failed to save payout details.')
      },
    }
  )

  const deleteMutation = useMutation((accountId: string) => bankAccountApi.delete(userId, accountId), {
    onSuccess: async () => {
      await queryClient.invalidateQueries(['bankAccounts', userId])
      await refreshUser()
    },
  })

  const setDefaultMutation = useMutation((accountId: string) => bankAccountApi.setDefault(userId, accountId), {
    onSuccess: async () => {
      await queryClient.invalidateQueries(['bankAccounts', userId])
      await refreshUser()
    },
  })

  const currentPolicyNote = useMemo(() => {
    switch (payoutStatus) {
      case VerificationStatus.APPROVED:
        return 'Your payout details are approved and ready for withdrawal.'
      case VerificationStatus.PENDING:
        return 'Your payout details are under review. You can use Mentor Mode, but withdrawal stays locked until approval.'
      case VerificationStatus.REJECTED:
        return 'Your payout details were rejected. Update them and resubmit before requesting withdrawal.'
      default:
        return 'Payout setup is required before your first withdrawal.'
    }
  }, [payoutStatus])

  const onSubmit = (values: PayoutFormValues) => {
    setError('')
    createMutation.mutate(buildPayoutPayload(values, accounts?.length === 0))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-sm text-gray-500">Loading payout details...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">Payout setup</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Add payout information when you are ready to withdraw mentor earnings. This is separate from
                  mentor approval.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:max-w-xs">
            <p className="font-semibold text-slate-900">Payout review</p>
            <p className="mt-1">{currentPolicyNote}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          <BadgeCheck className="h-4 w-4 text-indigo-600" />
          Status: {formatVerificationStatus(payoutStatus)}
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Set up payout
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-950">Add payout details</h3>
              <p className="mt-1 text-sm text-slate-500">
                Choose the method you want us to review before enabling withdrawals.
              </p>
            </div>
            <button
              onClick={() => {
                setShowAddForm(false)
                setError('')
              }}
              className="text-sm font-semibold text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            {error && (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Payout country">
                <select
                  {...register('payoutCountry', { required: 'Payout country is required' })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="VN">Vietnam</option>
                  <option value="US">United States</option>
                  <option value="SG">Singapore</option>
                  <option value="JP">Japan</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>

              <Field label="Payout method">
                <select
                  {...register('payoutMethod')}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                >
                  <option value={PayoutMethod.LOCAL_BANK}>Local bank</option>
                  <option value={PayoutMethod.INTERNATIONAL_BANK}>International bank</option>
                  <option value={PayoutMethod.PAYPAL}>PayPal</option>
                  <option value={PayoutMethod.WISE}>Wise</option>
                  <option value={PayoutMethod.STRIPE_CONNECT}>Stripe Connect</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Account holder name" error={errors.accountHolderName?.message}>
                <input
                  {...register('accountHolderName', { required: 'Account holder name is required' })}
                  placeholder="Full legal name"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>

              {(payoutMethod === PayoutMethod.LOCAL_BANK || payoutMethod === PayoutMethod.INTERNATIONAL_BANK) && (
                <Field label="Bank name" error={errors.bankName?.message}>
                  <input
                    {...register('bankName', { required: 'Bank name is required' })}
                    placeholder={payoutMethod === PayoutMethod.LOCAL_BANK ? 'e.g. Vietcombank' : 'e.g. DBS Bank'}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </Field>
              )}

              {payoutMethod === PayoutMethod.LOCAL_BANK && (
                <>
                  <Field label="Bank account number" error={errors.accountNumber?.message}>
                    <input
                      {...register('accountNumber', { required: 'Bank account number is required' })}
                      placeholder="Account number"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </Field>
                  <Field label="Branch name (optional)">
                    <input
                      {...register('branchName')}
                      placeholder="Branch"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </Field>
                </>
              )}

              {payoutMethod === PayoutMethod.INTERNATIONAL_BANK && (
                <>
                  <Field label="Account number or IBAN" error={errors.accountNumber?.message}>
                    <input
                      {...register('accountNumber', { required: 'Account number or IBAN is required' })}
                      placeholder="Account number or IBAN"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </Field>
                  <Field label="SWIFT code" error={errors.swiftCode?.message}>
                    <input
                      {...register('swiftCode', { required: 'SWIFT code is required' })}
                      placeholder="SWIFT / BIC"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </Field>
                  <Field label="IBAN (optional)">
                    <input
                      {...register('iban')}
                      placeholder="IBAN"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </Field>
                </>
              )}

              {payoutMethod === PayoutMethod.PAYPAL && (
                <Field label="PayPal email" error={errors.paypalEmail?.message}>
                  <input
                    {...register('paypalEmail', { required: 'PayPal email is required' })}
                    placeholder="mentor@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </Field>
              )}

              {payoutMethod === PayoutMethod.WISE && (
                <Field label="Wise email" error={errors.wiseEmail?.message}>
                  <input
                    {...register('wiseEmail', { required: 'Wise email is required' })}
                    placeholder="mentor@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </Field>
              )}

              {payoutMethod === PayoutMethod.STRIPE_CONNECT && (
                <Field label="Stripe Connect account ID" error={errors.stripeConnectAccountId?.message}>
                  <input
                    {...register('stripeConnectAccountId', { required: 'Stripe Connect account ID is required' })}
                    placeholder="acct_..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </Field>
              )}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              We review payout details separately from mentor approval. This step is only required before your
              first withdrawal.
            </div>

            <button
              disabled={createMutation.isLoading}
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createMutation.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save payout details
            </button>
          </form>
        </div>
      )}

      {accounts && accounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`rounded-[1.5rem] border p-5 shadow-sm ${
                account.isDefault ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    {renderMethodIcon(account.payoutMethod)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-950">{formatPayoutMethod(account.payoutMethod)}</p>
                    <p className="text-xs text-slate-500">{account.payoutCountry || 'Unknown country'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {account.isDefault && (
                    <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                      Default
                    </span>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(account.id)}
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{account.accountHolderName}</p>
                <p>{getAccountDescriptor(account)}</p>
                {account.isVerified ? (
                  <p className="text-xs font-semibold text-emerald-600">Approved for payout</p>
                ) : (
                  <p className="text-xs font-semibold text-amber-600">Pending payout review</p>
                )}
              </div>

              {!account.isDefault && (
                <button
                  onClick={() => setDefaultMutation.mutate(account.id)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Set as default
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        !showAddForm && (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <Globe2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 text-sm font-semibold text-slate-700">No payout method added yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add a payout method when you are ready to request your first withdrawal.
            </p>
          </div>
        )
      )}
    </div>
  )
}

function Field({
  label,
  children,
  error,
}: {
  label: string
  children: React.ReactNode
  error?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  )
}

function buildPayoutPayload(values: PayoutFormValues, isFirstAccount = false): BankAccountRequest {
  const method = values.payoutMethod ?? PayoutMethod.LOCAL_BANK
  const base: BankAccountRequest = {
    bankName: values.bankName || '',
    bankCode: values.bankCode,
    accountNumber: values.accountNumber || '',
    accountHolderName: values.accountHolderName,
    branchName: values.branchName,
    payoutCountry: values.payoutCountry,
    payoutMethod: method,
    iban: values.iban,
    swiftCode: values.swiftCode,
    paypalEmail: values.paypalEmail,
    wiseEmail: values.wiseEmail,
    stripeConnectAccountId: values.stripeConnectAccountId,
    isDefault: values.isDefault ?? isFirstAccount,
    notes: values.notes,
  }

  if (method === PayoutMethod.PAYPAL) {
    return {
      ...base,
      bankName: 'PayPal',
      accountNumber: values.paypalEmail || '',
    }
  }

  if (method === PayoutMethod.WISE) {
    return {
      ...base,
      bankName: 'Wise',
      accountNumber: values.wiseEmail || values.accountNumber || '',
    }
  }

  if (method === PayoutMethod.STRIPE_CONNECT) {
    return {
      ...base,
      bankName: 'Stripe Connect',
      accountNumber: values.stripeConnectAccountId || '',
    }
  }

  return base
}

function formatVerificationStatus(status?: VerificationStatus) {
  switch (status) {
    case VerificationStatus.PENDING:
      return 'Pending review'
    case VerificationStatus.APPROVED:
      return 'Approved'
    case VerificationStatus.REJECTED:
      return 'Rejected'
    case VerificationStatus.NEEDS_MORE_INFO:
      return 'Needs more info'
    default:
      return 'Not submitted'
  }
}

function formatPayoutMethod(method?: PayoutMethod) {
  switch (method) {
    case PayoutMethod.LOCAL_BANK:
      return 'Local bank'
    case PayoutMethod.INTERNATIONAL_BANK:
      return 'International bank'
    case PayoutMethod.PAYPAL:
      return 'PayPal'
    case PayoutMethod.WISE:
      return 'Wise'
    case PayoutMethod.STRIPE_CONNECT:
      return 'Stripe Connect'
    default:
      return 'Payout method'
  }
}

function renderMethodIcon(method?: PayoutMethod) {
  switch (method) {
    case PayoutMethod.PAYPAL:
    case PayoutMethod.WISE:
      return <Mail className="h-4 w-4" />
    case PayoutMethod.STRIPE_CONNECT:
      return <CreditCard className="h-4 w-4" />
    case PayoutMethod.INTERNATIONAL_BANK:
      return <Globe2 className="h-4 w-4" />
    default:
      return <Building2 className="h-4 w-4" />
  }
}

function getAccountDescriptor(account: {
  payoutMethod?: PayoutMethod
  bankName: string
  accountNumber: string
  paypalEmail?: string
  wiseEmail?: string
  iban?: string
  stripeConnectAccountId?: string
}) {
  switch (account.payoutMethod) {
    case PayoutMethod.PAYPAL:
      return account.paypalEmail || account.accountNumber
    case PayoutMethod.WISE:
      return account.wiseEmail || account.accountNumber
    case PayoutMethod.STRIPE_CONNECT:
      return account.stripeConnectAccountId || account.accountNumber
    case PayoutMethod.INTERNATIONAL_BANK:
      return account.iban || account.accountNumber
    default:
      return `${account.bankName} - ${account.accountNumber}`
  }
}
