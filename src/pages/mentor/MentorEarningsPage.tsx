import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Clock3,
  CreditCard,
  DollarSign,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react'
import { bankAccountApi } from '@/api/bankAccountApi'
import { contractApi } from '@/api/contractApi'
import { mentorApi } from '@/api/mentorApi'
import { walletApi } from '@/api/walletApi'
import { useAuthStore } from '@/store/authStore'
import {
  BankAccountResponse,
  ContractResponse,
  ContractStatus,
  MentorProfileResponse,
  TxnType,
  WalletAccountType,
  WalletResponse,
  WalletTransactionResponse,
} from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { LoadingRows, MetricCard, SelectInput, StateCard, StatusPill, Toolbar } from './shared/MentorHubUI'
import { useEarningsSummary } from '@/hooks/useAnalytics'
import { AnalyticsPeriod, BySourceEntry } from '@/api/analyticsApi'
import EarningsChart from '@/components/analytics/EarningsChart'
import WithdrawalHistory from '@/components/wallet/WithdrawalHistory'

type TabKey = 'overview' | 'transactions' | 'contracts' | 'withdrawals'

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'DAY', label: 'Theo ngày' },
  { value: 'WEEK', label: 'Theo tuần' },
  { value: 'MONTH', label: 'Theo tháng' },
  { value: 'YEAR', label: 'Theo năm' },
]

const revenueTxnTypes = new Set<string>([TxnType.JOB_RELEASE, TxnType.COURSE_PURCHASE, TxnType.APPOINTMENT_RELEASE])

export default function MentorEarningsPage() {
  const { user } = useAuthStore()
  const [wallets, setWallets] = useState<WalletResponse[]>([])
  const [transactions, setTransactions] = useState<WalletTransactionResponse[]>([])
  const [contracts, setContracts] = useState<ContractResponse[]>([])
  const [profile, setProfile] = useState<MentorProfileResponse | null>(null)
  const [defaultPayout, setDefaultPayout] = useState<BankAccountResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [transactionFilter, setTransactionFilter] = useState('ALL')
  const [earningsPeriod, setEarningsPeriod] = useState<AnalyticsPeriod>('MONTH')
  const { data: earningsSummary } = useEarningsSummary(earningsPeriod)

  const loadEarnings = useCallback(async () => {
    if (!user?.userId) return
    try {
      setLoading(true)
      setError('')
      const [walletList, transactionPage, contractPage, mentorProfile, payoutAccount] = await Promise.all([
        walletApi.getUserWallets(user.userId),
        walletApi.getUserTransactions(user.userId, { page: 0, size: 100 }),
        contractApi.getMine({ page: 0, size: 100 }),
        mentorApi.getMentorProfile(user.userId).catch(() => null),
        bankAccountApi.getDefault(user.userId).catch(() => null),
      ])
      setWallets(walletList || [])
      setTransactions(transactionPage.content || [])
      setContracts(contractPage.content || [])
      setProfile(mentorProfile)
      setDefaultPayout(payoutAccount)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu thu nhập.')
    } finally {
      setLoading(false)
    }
  }, [user?.userId])

  useEffect(() => {
    void loadEarnings()
  }, [loadEarnings])

  const summary = useMemo(() => {
    const available = Number(wallets.find((wallet) => wallet.accountType === WalletAccountType.USER_AVAILABLE)?.balanceMxc || 0)
    const pending = Number(wallets.find((wallet) => wallet.accountType === WalletAccountType.USER_PENDING)?.balanceMxc || 0)
    const contractEscrow = contracts
      .filter((contract) => [ContractStatus.ACTIVE, ContractStatus.IN_DISPUTE, ContractStatus.UNDER_REVIEW].includes(contract.status))
      .reduce((sum, contract) => sum + Number(contract.amountInEscrow || 0), 0)
    const now = new Date()
    const thisMonth = transactions
      .filter((txn) => isRevenueCredit(txn) && sameMonth(new Date(txn.createdAt), now))
      .reduce((sum, txn) => sum + Number(txn.amountMxc || 0), 0)
    const recordedRevenue = transactions
      .filter(isRevenueCredit)
      .reduce((sum, txn) => sum + Number(txn.amountMxc || 0), 0)

    return { available, pending, contractEscrow, thisMonth, recordedRevenue }
  }, [contracts, transactions, wallets])

  const filteredTransactions = useMemo(() => {
    if (transactionFilter === 'ALL') return transactions
    if (transactionFilter === 'REVENUE') return transactions.filter(isRevenueCredit)
    if (transactionFilter === 'CONTRACT_LOCK') return transactions.filter((txn) => txn.txnType === TxnType.JOB_PAYMENT)
    if (transactionFilter === 'WITHDRAWAL') return transactions.filter((txn) => txn.txnType === TxnType.WITHDRAWAL)
    if (transactionFilter === 'REFUND') return transactions.filter((txn) => [TxnType.JOB_REFUND, TxnType.COURSE_REFUND, TxnType.APPOINTMENT_REFUND, TxnType.WITHDRAWAL_REFUND].includes(txn.txnType))
    return transactions
  }, [transactionFilter, transactions])

  const payoutStatus = profile?.payoutStatus || user?.payoutStatus || 'NOT_SUBMITTED'
  const canWithdraw = payoutStatus === 'APPROVED' && summary.available > 0 && !!defaultPayout
  const sourceBreakdown = (earningsSummary?.bySource || []).filter((source) => sourceAmount(source) > 0)

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">MentorHub</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">Doanh thu & rút tiền</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Theo dõi số dư MXC, khoản chờ giải ngân và giao dịch từ backend wallet. Doanh thu và số dư là hai nghĩa khác nhau, nên một khoản mới bán có thể vừa được ghi nhận doanh thu vừa đang chờ giải ngân.
          </p>
        </div>
        <Link
          to={canWithdraw ? '/wallet?tab=withdraw' : '/mentor/settings'}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-emerald-500/10 ${
            canWithdraw ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          {canWithdraw ? 'Tạo yêu cầu rút tiền' : 'Cài đặt tài khoản nhận tiền'}
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Khả dụng"
          value={formatCurrency(summary.available)}
          helper="Số dư có thể rút khi tài khoản nhận tiền đã được duyệt."
          icon={<DollarSign className="h-5 w-5" />}
          tone="emerald"
        />
        <MetricCard
          label="Chờ giải ngân"
          value={formatCurrency(summary.pending)}
          helper="Doanh thu đã ghi nhận nhưng còn trong thời gian giữ trước khi chuyển sang khả dụng."
          icon={<Clock3 className="h-5 w-5" />}
          tone="amber"
        />
        <MetricCard
          label="Escrow hợp đồng"
          value={formatCurrency(summary.contractEscrow)}
          helper="Tiền hợp đồng còn khóa trước nghiệm thu, hủy hoặc xử lý tranh chấp."
          icon={<LockKeyhole className="h-5 w-5" />}
          tone="slate"
        />
        <MetricCard
          label="Doanh thu ghi nhận"
          value={formatCurrency(summary.recordedRevenue)}
          helper="Tổng giao dịch doanh thu trong lịch sử gần nhất đang tải."
          icon={<ReceiptText className="h-5 w-5" />}
          tone="slate"
        />
      </section>

      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <BalanceNote
          icon={<ReceiptText className="h-4 w-4" />}
          title="Không phải cộng đôi"
          body="Doanh thu là dòng tiền phát sinh; chờ giải ngân là trạng thái hiện tại của cùng khoản tiền."
        />
        <BalanceNote
          icon={<Clock3 className="h-4 w-4" />}
          title="Pending khác escrow"
          body="Pending là tiền của mentor đang bị giữ tạm thời. Escrow là tiền hợp đồng còn khóa trước khi release."
        />
        <BalanceNote
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Rút tiền theo số khả dụng"
          body="Nút rút tiền chỉ dựa trên số dư khả dụng và tài khoản nhận tiền đã được duyệt."
        />
      </section>

      <Toolbar>
        <div className="scrollbar-hide flex w-full overflow-x-auto rounded-lg bg-slate-100 p-1 lg:w-auto">
          {[
            ['overview', 'Tổng quan'],
            ['transactions', 'Giao dịch'],
            ['contracts', 'Hợp đồng'],
            ['withdrawals', 'Rút tiền'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as TabKey)}
              className={`h-10 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition ${
                activeTab === key ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {activeTab === 'transactions' ? (
          <SelectInput value={transactionFilter} onChange={(event) => setTransactionFilter(event.target.value)} className="w-full lg:ml-auto lg:w-56">
            <option value="ALL">Tất cả giao dịch</option>
            <option value="REVENUE">Doanh thu ghi nhận</option>
            <option value="CONTRACT_LOCK">Thanh toán giữ hợp đồng</option>
            <option value="WITHDRAWAL">Rút tiền</option>
            <option value="REFUND">Hoàn tiền</option>
          </SelectInput>
        ) : null}
      </Toolbar>

      {loading ? (
        <LoadingRows rows={4} />
      ) : error ? (
        <StateCard tone="error" title="Không thể tải dữ liệu" message={error} action={<button onClick={loadEarnings} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Thử lại</button>} />
      ) : activeTab === 'overview' ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5 min-w-0">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-950">Xu hướng doanh thu</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Dữ liệu phân tích được tổng hợp hằng đêm, dùng để xem xu hướng chứ không thay thế số dư ví.</p>
                </div>
                <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEarningsPeriod(opt.value)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${earningsPeriod === opt.value ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {sourceBreakdown.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {sourceBreakdown.map((source) => (
                    <span key={source.source} className="inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                      {formatSourceLabel(source.source)}
                      <span className="text-emerald-700">{formatCurrency(sourceAmount(source))}</span>
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-4">
                <EarningsChart data={earningsSummary?.timeline || []} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-950">Giao dịch gần đây</h2>
                <button type="button" onClick={() => setActiveTab('transactions')} className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">Xem tất cả</button>
              </div>
              <TransactionList transactions={transactions.slice(0, 6)} />
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-950">Điều kiện rút tiền</h2>
              <div className="mt-4 space-y-3">
                <ReadinessItem label="Mentor được duyệt" passed={user?.mentorStatus === 'APPROVED'} />
                <ReadinessItem label="Tài khoản nhận tiền được duyệt" passed={payoutStatus === 'APPROVED'} />
                <ReadinessItem label="Có số dư khả dụng" passed={summary.available > 0} />
              </div>
              {!canWithdraw ? (
                <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-800">
                  <AlertTriangle className="mr-2 inline h-4 w-4" />
                  Chỉ có số dư khả dụng mới được tạo yêu cầu rút tiền.
                </div>
              ) : null}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-950">Tài khoản nhận tiền</h2>
              {defaultPayout ? (
                <div className="mt-4 space-y-2 text-sm font-medium text-slate-600">
                  <p className="font-semibold text-slate-900">{defaultPayout.accountHolderName}</p>
                  <p>{defaultPayout.bankName}</p>
                  <p>{maskAccount(defaultPayout.accountNumber)}</p>
                  <StatusPill label={formatPayoutStatus(payoutStatus)} tone={payoutStatus === 'APPROVED' ? 'emerald' : payoutStatus === 'REJECTED' ? 'rose' : 'amber'} />
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-500">Bạn chưa thêm tài khoản nhận tiền.</p>
              )}
            </section>
          </aside>
        </div>
      ) : activeTab === 'transactions' ? (
        filteredTransactions.length === 0 ? (
          <StateCard title="Không có giao dịch" message="Các khoản doanh thu, rút tiền và hoàn tiền sẽ hiển thị tại đây." />
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <TransactionList transactions={filteredTransactions} />
          </section>
        )
      ) : activeTab === 'contracts' ? (
        contracts.length === 0 ? (
          <StateCard title="Chưa có hợp đồng nào" message="Các hợp đồng đang giữ tiền hoặc đã hoàn thành sẽ hiển thị tại đây." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {contracts.map((contract) => (
              <article key={contract.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-slate-950">{contract.jobTitle || contract.title}</h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">Khách hàng: {contract.clientName}</p>
                  </div>
                  <StatusPill label={formatContractStatus(contract.status)} tone={contract.status === ContractStatus.COMPLETED ? 'emerald' : contract.status === ContractStatus.IN_DISPUTE ? 'rose' : contract.status === ContractStatus.CANCELLED ? 'slate' : 'indigo'} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MiniAmount label="Escrow còn khóa" value={contract.amountInEscrow} />
                  <MiniAmount label="Đã trả" value={contract.amountPaid} />
                  <MiniAmount label="Tổng cộng" value={contract.totalAmount} />
                  <MiniAmount label="Bắt đầu" value={contract.createdAt} isDate />
                </div>
                <Link to={`/mentor/proposals/${contract.proposalId || contract.id}`} className="mt-5 inline-flex rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                  Xem chi tiết
                </Link>
              </article>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900">Lịch sử rút tiền</h2>
            <Link
              to="/wallet?tab=withdraw"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              Tạo yêu cầu rút tiền
            </Link>
          </div>
          {user?.userId && <WithdrawalHistory userId={user.userId} />}
        </div>
      )}
    </div>
  )
}

function BalanceNote({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600 ring-1 ring-slate-200">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{body}</p>
      </div>
    </div>
  )
}

function TransactionList({ transactions }: { transactions: WalletTransactionResponse[] }) {
  if (transactions.length === 0) {
    return <StateCard title="Không có giao dịch" message="Lịch sử thay đổi số dư ví sẽ hiển thị ở đây." />
  }

  return (
    <div className="mt-4 divide-y divide-slate-100">
      {transactions.map((txn) => (
        <div key={txn.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${txn.direction === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
              <ReceiptText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950">{formatTxnType(txn.txnType)}</p>
              <p className="mt-1 truncate text-xs font-medium text-slate-500">{txn.note || txn.referenceType || 'Wallet transaction'}</p>
              <p className="mt-1 text-xs font-medium text-slate-400">{formatDateTime(txn.createdAt)}</p>
            </div>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className={`text-sm font-semibold ${txn.direction === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'}`}>
              {txn.direction === 'CREDIT' ? '+' : '-'}{formatCurrency(txn.amountMxc)}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{formatTxnStatus(txn.txnStatus)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function ReadinessItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <StatusPill label={passed ? 'Sẵn sàng' : 'Còn thiếu'} tone={passed ? 'emerald' : 'amber'} />
    </div>
  )
}

function MiniAmount({ label, value, isDate = false }: { label: string; value?: number | string; isDate?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{isDate && value ? formatDateTime(String(value)) : formatCurrency(value || 0)}</p>
    </div>
  )
}

function isRevenueCredit(txn: WalletTransactionResponse) {
  return txn.direction === 'CREDIT' && revenueTxnTypes.has(String(txn.txnType)) && txn.txnStatus === 'COMPLETED'
}

function sameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

function formatTxnType(type: string) {
  const labels: Record<string, string> = {
    DEPOSIT: 'Nạp ví',
    WITHDRAWAL: 'Rút tiền',
    JOB_PAYMENT: 'Thanh toán giữ hợp đồng',
    JOB_RELEASE: 'Giải ngân hợp đồng',
    JOB_REFUND: 'Hoàn tiền hợp đồng',
    COURSE_PURCHASE: 'Bán khóa học',
    COURSE_REFUND: 'Hoàn tiền khóa học',
    APPOINTMENT_BOOKING: 'Đặt lịch mentoring',
    APPOINTMENT_RELEASE: 'Giải ngân mentoring',
    APPOINTMENT_REFUND: 'Hoàn tiền mentoring',
    PLATFORM_FEE: 'Phí nền tảng',
    WITHDRAWAL_FEE: 'Phí rút tiền',
    BONUS_CREDIT: 'Thưởng',
    PENALTY_DEDUCTION: 'Khấu trừ',
    WITHDRAWAL_REFUND: 'Hoàn yêu cầu rút',
    ADJUSTMENT: 'Điều chỉnh',
  }
  return labels[type] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatTxnStatus(status: string) {
  const labels: Record<string, string> = {
    PENDING: 'Đang xử lý',
    COMPLETED: 'Hoàn tất',
    FAILED: 'Thất bại',
    REVERSED: 'Đã đảo giao dịch',
    FLAGGED: 'Cần kiểm tra',
    CANCELLED: 'Đã hủy',
  }
  return labels[status] || status
}

function formatContractStatus(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: 'Đang hoạt động',
    UNDER_REVIEW: 'Chờ duyệt',
    IN_DISPUTE: 'Tranh chấp',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  }
  return labels[status] || formatTxnType(status)
}

function formatPayoutStatus(status: string) {
  const labels: Record<string, string> = {
    NOT_SUBMITTED: 'Chưa thêm',
    PENDING: 'Đang xét duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Bị từ chối',
  }
  return labels[status] || formatTxnType(status)
}

function maskAccount(account?: string) {
  if (!account) return 'Chưa thêm số tài khoản'
  const last4 = account.slice(-4)
  return `**** ${last4}`
}

function sourceAmount(source: BySourceEntry) {
  return Number(source.earnedMxc ?? source.amountMxc ?? 0)
}

function formatSourceLabel(source: string) {
  const labels: Record<string, string> = {
    LONG_TERM_MENTORING: 'Mentoring dài hạn',
    SINGLE_SESSION_MENTORING: 'Mentoring 1:1',
    FREELANCE_PROJECT: 'Freelance',
    COURSE_SALE: 'Khóa học',
  }
  return labels[source] || source.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}
