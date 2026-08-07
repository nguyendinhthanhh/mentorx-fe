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
        return 'Thông tin nhận tiền của bạn đã được duyệt và sẵn sàng cho việc rút tiền.'
      case VerificationStatus.PENDING:
        return 'Thông tin nhận tiền của bạn đang được duyệt. Bạn có thể sử dụng Mentor Mode, nhưng chức năng rút tiền sẽ bị khóa cho đến khi được duyệt.'
      case VerificationStatus.REJECTED:
        return 'Thông tin nhận tiền của bạn đã bị từ chối. Vui lòng cập nhật và gửi lại trước khi yêu cầu rút tiền.'
      default:
        return 'Bạn cần thiết lập thông tin nhận tiền trước khi rút tiền lần đầu.'
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
        <p className="text-sm text-gray-500">Đang tải thông tin nhận tiền...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">Thiết lập nhận tiền</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Thêm thông tin nhận tiền khi bạn đã sẵn sàng rút thu nhập từ việc mentor. Thông tin này tách biệt với việc phê duyệt mentor.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:max-w-xs">
            <p className="font-semibold text-slate-900">Đang chờ duyệt nhận tiền</p>
            <p className="mt-1">{currentPolicyNote}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          <BadgeCheck className="h-4 w-4 text-emerald-600" />
          Trạng thái: {formatVerificationStatus(payoutStatus)}
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Thiết lập nhận tiền
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-950">Thêm thông tin nhận tiền</h3>
              <p className="mt-1 text-sm text-slate-500">
                Chọn phương thức bạn muốn chúng tôi xét duyệt trước khi cho phép rút tiền.
              </p>
            </div>
            <button
              onClick={() => {
                setShowAddForm(false)
                setError('')
              }}
              className="text-sm font-semibold text-slate-500 hover:text-slate-900"
            >
              Hủy
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
              <Field label="Quốc gia">
                <select
                  {...register('payoutCountry', { required: 'Payout country is required' })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 cursor-not-allowed text-slate-500"
                >
                  <option value="VN">Việt Nam</option>
                </select>
              </Field>

              <Field label="Phương thức thanh toán">
                <select
                  {...register('payoutMethod')}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 cursor-not-allowed text-slate-500"
                >
                  <option value={PayoutMethod.LOCAL_BANK}>Ngân hàng nội địa</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tên chủ tài khoản" error={errors.accountHolderName?.message}>
                <input
                  {...register('accountHolderName', { 
                    required: 'Account holder name is required',
                    onChange: (e) => {
                      let val = e.target.value;
                      val = val.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a").replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e").replace(/ì|í|ị|ỉ|ĩ/g, "i").replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o").replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u").replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y").replace(/đ/g, "d");
                      val = val.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A").replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E").replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I").replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O").replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U").replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y").replace(/Đ/g, "D");
                      val = val.toUpperCase().replace(/[^A-Z\s]/g, "");
                      e.target.value = val;
                    }
                  })}
                  placeholder="NGUYEN VAN A"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </Field>

              {payoutMethod === PayoutMethod.LOCAL_BANK && (
                <Field label="Tên ngân hàng" error={errors.bankName?.message}>
                  <select
                    {...register('bankName', { required: 'Bank name is required' })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="">Chọn ngân hàng</option>
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="Techcombank">Techcombank</option>
                    <option value="MBBank">MBBank (Quân Đội)</option>
                    <option value="VietinBank">VietinBank</option>
                    <option value="BIDV">BIDV</option>
                    <option value="ACB">ACB</option>
                    <option value="VPBank">VPBank</option>
                    <option value="Agribank">Agribank</option>
                    <option value="TPBank">TPBank</option>
                    <option value="VIB">VIB</option>
                    <option value="Sacombank">Sacombank</option>
                    <option value="HDBank">HDBank</option>
                    <option value="SeABank">SeABank</option>
                    <option value="SHB">SHB</option>
                    <option value="MSB">MSB (Hàng Hải)</option>
                    <option value="OCB">OCB (Phương Đông)</option>
                  </select>
                </Field>
              )}

              {payoutMethod === PayoutMethod.LOCAL_BANK && (
                <>
                  <Field label="Số tài khoản ngân hàng" error={errors.accountNumber?.message}>
                    <input
                      {...register('accountNumber', { 
                        required: 'Bank account number is required',
                        onChange: (e) => {
                          e.target.value = e.target.value.replace(/[^0-9]/g, "");
                        }
                      })}
                      placeholder="e.g. 1907123456789"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </Field>
                  <Field label="Tên chi nhánh (Tùy chọn)">
                    <input
                      {...register('branchName')}
                      placeholder="e.g. HCM Branch"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </Field>
                </>
              )}

              {payoutMethod === PayoutMethod.INTERNATIONAL_BANK && (
                <>
                  <Field label="Số tài khoản hoặc IBAN" error={errors.accountNumber?.message}>
                    <input
                      {...register('accountNumber', { required: 'Account number or IBAN is required' })}
                      placeholder="Account number or IBAN"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </Field>
                  <Field label="Mã SWIFT" error={errors.swiftCode?.message}>
                    <input
                      {...register('swiftCode', { required: 'SWIFT code is required' })}
                      placeholder="SWIFT / BIC"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </Field>
                  <Field label="IBAN (Tùy chọn)">
                    <input
                      {...register('iban')}
                      placeholder="IBAN"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </Field>
                </>
              )}

              {payoutMethod === PayoutMethod.PAYPAL && (
                <Field label="PayPal email" error={errors.paypalEmail?.message}>
                  <input
                    {...register('paypalEmail', { required: 'PayPal email is required' })}
                    placeholder="mentor@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </Field>
              )}

              {payoutMethod === PayoutMethod.WISE && (
                <Field label="Wise email" error={errors.wiseEmail?.message}>
                  <input
                    {...register('wiseEmail', { required: 'Wise email is required' })}
                    placeholder="mentor@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </Field>
              )}

              {payoutMethod === PayoutMethod.STRIPE_CONNECT && (
                <Field label="Stripe Connect account ID" error={errors.stripeConnectAccountId?.message}>
                  <input
                    {...register('stripeConnectAccountId', { required: 'Stripe Connect account ID is required' })}
                    placeholder="acct_..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </Field>
              )}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              Chúng tôi duyệt thông tin nhận tiền độc lập với việc phê duyệt mentor. Bước này chỉ yêu cầu trước lần rút tiền đầu tiên của bạn.
            </div>

            <button
              disabled={createMutation.isLoading}
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createMutation.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Lưu thông tin nhận tiền
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
                account.isDefault ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    {renderMethodIcon(account.payoutMethod)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-950">{formatPayoutMethod(account.payoutMethod)}</p>
                    <p className="text-xs text-slate-500">{account.payoutCountry || 'Không rõ quốc gia'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {account.isDefault && (
                    <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                      Mặc định
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
                  <p className="text-xs font-semibold text-emerald-600">Đã được duyệt</p>
                ) : (
                  <p className="text-xs font-semibold text-amber-600">Đang chờ duyệt</p>
                )}
              </div>

              {!account.isDefault && (
                <button
                  onClick={() => setDefaultMutation.mutate(account.id)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Đặt làm mặc định
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        !showAddForm && (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <Globe2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 text-sm font-semibold text-slate-700">Chưa có phương thức nhận tiền nào</p>
            <p className="mt-1 text-sm text-slate-500">
              Thêm phương thức nhận tiền khi bạn đã sẵn sàng yêu cầu rút tiền lần đầu.
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
      return 'Đang chờ duyệt'
    case VerificationStatus.APPROVED:
      return 'Đã duyệt'
    case VerificationStatus.REJECTED:
      return 'Bị từ chối'
    case VerificationStatus.NEEDS_MORE_INFO:
      return 'Cần thêm thông tin'
    default:
      return 'Chưa gửi'
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
