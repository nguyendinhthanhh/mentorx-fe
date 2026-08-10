import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  DollarSign,
  LockKeyhole,
  ReceiptText,
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
import { LoadingRows, SelectInput, StateCard, StatusPill, Toolbar } from './shared/MentorHubUI'
import { useEarningsSummary } from '@/hooks/useAnalytics'
import { AnalyticsPeriod, BySourceEntry } from '@/api/analyticsApi'
import EarningsChart from '@/components/analytics/EarningsChart'
import WithdrawalHistory from '@/components/wallet/WithdrawalHistory'

type TabKey = 'overview' | 'transactions' | 'contracts' | 'withdrawals'

const RECENT_TRANSACTION_PAGE_SIZE = 6
const TRANSACTION_PAGE_SIZE = 10

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
  const [recentTransactionPage, setRecentTransactionPage] = useState(0)
  const [fullTransactionPage, setFullTransactionPage] = useState(0)
  const [earningsPeriod, setEarningsPeriod] = useState<AnalyticsPeriod>('MONTH')
  const { data: earningsSummary } = useEarningsSummary(earningsPeriod)
  const { data: recentTransactionPageData, isFetching: recentTransactionsFetching } = useQuery(
    ['mentor-earnings-recent-transactions', user?.userId, recentTransactionPage],
    () => walletApi.getUserTransactions(user!.userId, {
      page: recentTransactionPage,
      size: RECENT_TRANSACTION_PAGE_SIZE,
    }),
    {
      enabled: !!user?.userId,
      keepPreviousData: true,
      staleTime: 30 * 1000,
    }
  )

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

  useEffect(() => {
    setFullTransactionPage(0)
  }, [transactionFilter])

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
  const fullTransactionTotalPages = Math.max(1, Math.ceil(filteredTransactions.length / TRANSACTION_PAGE_SIZE))
  const pagedFilteredTransactions = filteredTransactions.slice(
    fullTransactionPage * TRANSACTION_PAGE_SIZE,
    fullTransactionPage * TRANSACTION_PAGE_SIZE + TRANSACTION_PAGE_SIZE
  )
  const recentTransactions = recentTransactionPageData?.content ?? transactions.slice(0, RECENT_TRANSACTION_PAGE_SIZE)

  const payoutStatus = profile?.payoutStatus || user?.payoutStatus || 'NOT_SUBMITTED'
  const canWithdraw = payoutStatus === 'APPROVED' && summary.available > 0 && !!defaultPayout
  const sourceBreakdown = (earningsSummary?.bySource || []).filter((source) => sourceAmount(source) > 0)
  const trendTimeline = (earningsSummary?.timeline || []).filter((point) => Number(point.earnedMxc ?? point.value ?? 0) > 0)
  const hasTrendData = sourceBreakdown.length > 0 || trendTimeline.length > 0

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12">
      <header>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">MentorHub</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">Doanh thu & rút tiền</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Quản lý số dư MXC, khoản chờ giải ngân, escrow hợp đồng và lịch sử giao dịch trong một màn hình.
          </p>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Số dư khả dụng</p>
                <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{formatCurrency(summary.available)}</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Đây là khoản mentor có thể rút sau khi tài khoản nhận tiền được duyệt.
                </p>
              </div>
              <StatusPill label={canWithdraw ? 'Có thể rút' : 'Chưa thể rút'} tone={canWithdraw ? 'emerald' : 'amber'} />
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                to={canWithdraw ? '/wallet?tab=withdraw' : '/mentor/settings'}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-emerald-500/10 ${
                  canWithdraw ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                {canWithdraw ? 'Tạo yêu cầu rút tiền' : 'Hoàn tất tài khoản nhận tiền'}
              </Link>
              <button
                type="button"
                onClick={() => setActiveTab('withdrawals')}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Xem lịch sử rút tiền
              </button>
            </div>
          </div>
          <div className="grid divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
            <SettlementFigure
              label="Chờ giải ngân"
              value={summary.pending}
              helper="Doanh thu đã ghi nhận nhưng chưa chuyển sang khả dụng."
              icon={<Clock3 className="h-4 w-4" />}
              tone="amber"
            />
            <SettlementFigure
              label="Escrow hợp đồng"
              value={summary.contractEscrow}
              helper="Tiền hợp đồng còn khóa trước nghiệm thu hoặc xử lý."
              icon={<LockKeyhole className="h-4 w-4" />}
              tone="slate"
            />
            <SettlementFigure
              label="Tháng này"
              value={summary.thisMonth}
              helper="Doanh thu đã giải ngân trong tháng hiện tại."
              icon={<DollarSign className="h-4 w-4" />}
              tone="emerald"
            />
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tổng hợp dòng tiền</p>
              <h2 className="mt-1 text-base font-bold text-slate-950">Sổ cái hiện tại</h2>
            </div>
            <ReceiptText className="h-5 w-5 text-slate-400" />
          </div>
          <dl className="mt-5 space-y-4">
            <CashflowRow label="Khả dụng" value={summary.available} tone="emerald" />
            <CashflowRow label="Chờ giải ngân" value={summary.pending} tone="amber" />
            <CashflowRow label="Escrow hợp đồng" value={summary.contractEscrow} tone="slate" />
            <CashflowRow label="Doanh thu ghi nhận" value={summary.recordedRevenue} tone="slate" />
          </dl>
        </section>
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
            {hasTrendData ? (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-950">Xu hướng doanh thu</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Dữ liệu phân tích được tổng hợp hằng đêm, dùng để xem xu hướng doanh thu.</p>
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
                  <EarningsChart data={trendTimeline} />
                </div>
              </section>
            ) : null}

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-950">Giao dịch gần đây</h2>
                <button type="button" onClick={() => setActiveTab('transactions')} className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">Xem tất cả</button>
              </div>
              <TransactionList
                transactions={recentTransactions}
                loading={recentTransactionsFetching && !recentTransactionPageData}
                pagination={recentTransactionPageData && recentTransactionPageData.totalPages > 1 ? {
                  page: recentTransactionPage,
                  totalPages: recentTransactionPageData.totalPages,
                  totalElements: recentTransactionPageData.totalElements,
                  onPrevious: () => setRecentTransactionPage((current) => Math.max(0, current - 1)),
                  onNext: () => setRecentTransactionPage((current) => Math.min((recentTransactionPageData.totalPages || 1) - 1, current + 1)),
                  previousDisabled: recentTransactionPageData.first,
                  nextDisabled: recentTransactionPageData.last,
                } : undefined}
              />
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
            <TransactionList
              transactions={pagedFilteredTransactions}
              pagination={fullTransactionTotalPages > 1 ? {
                page: fullTransactionPage,
                totalPages: fullTransactionTotalPages,
                totalElements: filteredTransactions.length,
                onPrevious: () => setFullTransactionPage((current) => Math.max(0, current - 1)),
                onNext: () => setFullTransactionPage((current) => Math.min(fullTransactionTotalPages - 1, current + 1)),
                previousDisabled: fullTransactionPage === 0,
                nextDisabled: fullTransactionPage >= fullTransactionTotalPages - 1,
              } : undefined}
            />
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

function SettlementFigure({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string
  value: number
  helper: string
  icon: ReactNode
  tone: 'emerald' | 'amber' | 'slate'
}) {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-600',
  }[tone]

  return (
    <div className="p-5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>{icon}</div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-slate-950">{formatCurrency(value)}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
    </div>
  )
}

function CashflowRow({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'amber' | 'slate' }) {
  const dotClass = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-400',
  }[tone]

  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex min-w-0 items-center gap-3 text-sm font-semibold text-slate-600">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="shrink-0 text-sm font-bold text-slate-950">{formatCurrency(value)}</dd>
    </div>
  )
}

type TransactionPagination = {
  page: number
  totalPages: number
  totalElements: number
  onPrevious: () => void
  onNext: () => void
  previousDisabled: boolean
  nextDisabled: boolean
}

function TransactionList({
  transactions,
  loading = false,
  pagination,
}: {
  transactions: WalletTransactionResponse[]
  loading?: boolean
  pagination?: TransactionPagination
}) {
  if (loading) {
    return (
      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <div className="divide-y divide-slate-100 bg-white">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.4fr)_160px_130px_140px] md:items-center">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-100" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-44 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-56 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
              <div className="ml-auto h-4 w-24 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return <StateCard title="Không có giao dịch" message="Lịch sử thay đổi số dư ví sẽ hiển thị ở đây." />
  }

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
      <div className="hidden grid-cols-[minmax(0,1.4fr)_160px_130px_140px] gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 md:grid">
        <span>Giao dịch</span>
        <span>Thời gian</span>
        <span>Trạng thái</span>
        <span className="text-right">Số tiền</span>
      </div>
      <div className="divide-y divide-slate-100 bg-white">
        {transactions.map((txn) => (
          <div key={txn.id} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.4fr)_160px_130px_140px] md:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${txn.direction === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                <ReceiptText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950">{formatTxnType(txn.txnType)}</p>
                <p className="mt-1 truncate text-xs font-medium text-slate-500">{formatTxnNote(txn.note, txn.referenceType)}</p>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 md:text-sm">{formatDateTime(txn.createdAt)}</p>
            <div>
              <StatusPill label={formatTxnStatus(txn.txnStatus)} tone={txnStatusTone(txn.txnStatus)} />
            </div>
            <div className="shrink-0 text-left md:text-right">
              <p className={`text-sm font-semibold ${txn.direction === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'}`}>
                {txn.direction === 'CREDIT' ? '+' : '-'}{formatCurrency(txn.amountMxc)}
              </p>
            </div>
          </div>
        ))}
      </div>
      {pagination ? <TransactionPaginationControls pagination={pagination} /> : null}
    </div>
  )
}

function TransactionPaginationControls({ pagination }: { pagination: TransactionPagination }) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-semibold text-slate-500">
        Trang {pagination.page + 1} / {pagination.totalPages} · {pagination.totalElements} giao dịch
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={pagination.onPrevious}
          disabled={pagination.previousDisabled}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Trước
        </button>
        <button
          type="button"
          onClick={pagination.onNext}
          disabled={pagination.nextDisabled}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sau
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
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

function formatTxnNote(note?: string, referenceType?: string) {
  if (!note && referenceType) return formatReferenceType(referenceType)
  if (!note) return 'Giao dịch ví'

  const trimmed = note.trim()
  const normalized = trimmed.toLowerCase()
  const exactLabels: Record<string, string> = {
    'instructor net amount': 'Doanh thu khóa học sau phí nền tảng',
    'course instructor net amount': 'Doanh thu khóa học sau phí nền tảng',
    'course purchase instructor net amount': 'Doanh thu khóa học sau phí nền tảng',
    'platform fee': 'Phí nền tảng',
    'deposit credited to user wallet': 'Tiền nạp đã cộng vào ví',
  }
  if (exactLabels[normalized]) return exactLabels[normalized]

  const replacements: Array<[string, string]> = [
    ['Refund mentor session payment', 'Hoàn tiền thanh toán buổi mentoring'],
    ['Mentor session payment', 'Thanh toán buổi mentoring'],
    ['Mentor session release', 'Giải ngân buổi mentoring'],
    ['Job payment', 'Thanh toán công việc'],
    ['Job release', 'Giải ngân công việc'],
    ['Job refund', 'Hoàn tiền công việc'],
    ['Course purchase', 'Thanh toán khóa học'],
    ['Course refund', 'Hoàn tiền khóa học'],
    ['Instructor net amount', 'Doanh thu khóa học sau phí nền tảng'],
  ]

  return replacements.reduce((text, [source, target]) => text.replace(source, target), trimmed)
}

function formatReferenceType(referenceType: string) {
  const labels: Record<string, string> = {
    COURSE: 'Khóa học',
    COURSE_ENROLLMENT: 'Ghi danh khóa học',
    JOB: 'Công việc',
    CONTRACT: 'Hợp đồng',
    APPOINTMENT: 'Lịch mentoring',
    WITHDRAWAL: 'Yêu cầu rút tiền',
    DEPOSIT: 'Lệnh nạp tiền',
  }
  return labels[referenceType] || referenceType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
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

function txnStatusTone(status: string): 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' {
  if (status === 'COMPLETED') return 'emerald'
  if (status === 'PENDING' || status === 'FLAGGED') return 'amber'
  if (status === 'FAILED') return 'rose'
  return 'slate'
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
