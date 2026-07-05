import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, Briefcase, CreditCard, DollarSign, LockKeyhole, ReceiptText } from 'lucide-react'
import { bankAccountApi } from '@/api/bankAccountApi'
import { contractApi } from '@/api/contractApi'
import { mentorApi } from '@/api/mentorApi'
import { walletApi } from '@/api/walletApi'
import { useAuthStore } from '@/store/authStore'
import { BankAccountResponse, ContractResponse, ContractStatus, MentorProfileResponse, TxnType, WalletAccountType, WalletResponse, WalletTransactionResponse } from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { LoadingRows, MetricCard, PageShell, SelectInput, StateCard, StatusPill, Toolbar } from './shared/MentorHubUI'
import { useEarningsSummary } from '@/hooks/useAnalytics'
import { AnalyticsPeriod } from '@/api/analyticsApi'
import EarningsChart from '@/components/analytics/EarningsChart'

type TabKey = 'overview' | 'transactions' | 'contracts' | 'withdrawals'

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'DAY', label: 'Daily' },
  { value: 'WEEK', label: 'Weekly' },
  { value: 'MONTH', label: 'Monthly' },
  { value: 'YEAR', label: 'Yearly' },
]

const releasedTxnTypes = new Set<string>([TxnType.JOB_RELEASE, TxnType.COURSE_PURCHASE, TxnType.APPOINTMENT_RELEASE])

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

  useEffect(() => {
    void loadEarnings()
  }, [user?.userId])

  const loadEarnings = async () => {
    if (!user?.userId) return
    try {
      setLoading(true)
      setError('')
      const [walletList, transactionPage, contractPage, mentorProfile, payoutAccount] = await Promise.all([
        walletApi.getUserWallets(user.userId),
        walletApi.getUserTransactions(user.userId, { page: 0, size: 100 }),
        contractApi.getMine({ page: 0, size: 100 }),
        mentorApi.getMentorProfile(user.userId).catch(() => null),
        bankAccountApi.getDefault(user.userId),
      ])
      setWallets(walletList || [])
      setTransactions(transactionPage.content || [])
      setContracts(contractPage.content || [])
      setProfile(mentorProfile)
      setDefaultPayout(payoutAccount)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load earnings data.')
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => {
    const available = Number(wallets.find((wallet) => wallet.accountType === WalletAccountType.USER_AVAILABLE)?.balanceMxc || 0)
    const pending = Number(wallets.find((wallet) => wallet.accountType === WalletAccountType.USER_PENDING)?.balanceMxc || 0)
    const inEscrow = contracts
      .filter((contract) => [ContractStatus.ACTIVE, ContractStatus.IN_DISPUTE, ContractStatus.UNDER_REVIEW].includes(contract.status))
      .reduce((sum, contract) => sum + Number(contract.amountInEscrow || 0), 0)
    const now = new Date()
    const thisMonth = transactions
      .filter((txn) => isReleasedCredit(txn) && sameMonth(new Date(txn.createdAt), now))
      .reduce((sum, txn) => sum + Number(txn.amountMxc || 0), 0)
    const lifetime = transactions
      .filter(isReleasedCredit)
      .reduce((sum, txn) => sum + Number(txn.amountMxc || 0), 0)

    return { available, pending, inEscrow, thisMonth, lifetime }
  }, [contracts, transactions, wallets])

  const filteredTransactions = useMemo(() => {
    if (transactionFilter === 'ALL') return transactions
    if (transactionFilter === 'RELEASED') return transactions.filter(isReleasedCredit)
    if (transactionFilter === 'ESCROW') return transactions.filter((txn) => txn.txnType === TxnType.JOB_PAYMENT)
    if (transactionFilter === 'WITHDRAWAL') return transactions.filter((txn) => txn.txnType === TxnType.WITHDRAWAL)
    if (transactionFilter === 'REFUND') return transactions.filter((txn) => [TxnType.JOB_REFUND, TxnType.COURSE_REFUND, TxnType.APPOINTMENT_REFUND, TxnType.WITHDRAWAL_REFUND].includes(txn.txnType))
    return transactions
  }, [transactionFilter, transactions])

  const payoutStatus = profile?.payoutStatus || user?.payoutStatus || 'NOT_SUBMITTED'
  const canWithdraw = payoutStatus === 'APPROVED' && summary.available > 0 && !!defaultPayout

  return (
    <PageShell
      eyebrow="MentorHub"
      title="Earnings"
      description="Track released earnings, escrow, withdrawals, and payment history. Escrow is locked money, not earned balance."
      actions={
        <Link
          to={canWithdraw ? '/wallet' : '/mentor/settings'}
          className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold transition ${canWithdraw ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          <CreditCard className="h-4 w-4" />
          {canWithdraw ? 'Request withdrawal' : 'Set up payout'}
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Available balance" value={formatCurrency(summary.available)} helper="Withdrawable after payout approval." icon={<DollarSign className="h-5 w-5" />} tone="emerald" />
        <MetricCard label="In escrow" value={formatCurrency(summary.inEscrow)} helper="Released only after client confirms completion." icon={<LockKeyhole className="h-5 w-5" />} tone="amber" />
        <MetricCard label="This month" value={formatCurrency(summary.thisMonth)} helper="Released credits found in wallet transactions." icon={<ArrowUpRight className="h-5 w-5" />} />
        <MetricCard label="Lifetime earnings" value={formatCurrency(summary.lifetime)} helper="Based on loaded release/course sale transactions." icon={<ReceiptText className="h-5 w-5" />} tone="slate" />
      </div>

      <Toolbar>
        <div className="flex w-full overflow-x-auto rounded-2xl bg-slate-100 p-1 lg:w-auto">
          {[
            ['overview', 'Overview'],
            ['transactions', 'Transactions'],
            ['contracts', 'Contracts'],
            ['withdrawals', 'Withdrawals'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as TabKey)}
              className={`h-10 whitespace-nowrap rounded-xl px-4 text-sm font-bold transition ${activeTab === key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {activeTab === 'transactions' ? (
          <SelectInput value={transactionFilter} onChange={(event) => setTransactionFilter(event.target.value)} className="w-full lg:ml-auto lg:w-48">
            <option value="ALL">All transactions</option>
            <option value="RELEASED">Released</option>
            <option value="ESCROW">Escrow</option>
            <option value="WITHDRAWAL">Withdrawal</option>
            <option value="REFUND">Refund</option>
          </SelectInput>
        ) : null}
      </Toolbar>

      {loading ? (
        <LoadingRows rows={4} />
      ) : error ? (
        <StateCard tone="error" title="Unable to load earnings" message={error} action={<button onClick={loadEarnings} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Retry</button>} />
      ) : activeTab === 'overview' ? (
        <div className="space-y-5">
          {/* Analytics Earnings Summary */}
          {earningsSummary ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-slate-950">Earnings Overview</h2>
                <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEarningsPeriod(opt.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${earningsPeriod === opt.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Total earned" value={formatCurrency(earningsSummary.totalEarnedMxc)} tone="indigo" />
                <MetricCard label="Available" value={formatCurrency(earningsSummary.availableBalanceMxc)} tone="emerald" />
                <MetricCard label="In escrow" value={formatCurrency(earningsSummary.escrowBalanceMxc)} tone="amber" />
                <MetricCard label="Withdrawn" value={formatCurrency(earningsSummary.withdrawnMxc)} tone="slate" />
              </div>
              {earningsSummary.bySource.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {earningsSummary.bySource.map((src) => (
                    <span key={src.source} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                      {formatSourceLabel(src.source)}
                      <span className="text-indigo-500">{formatCurrency(src.amountMxc)}</span>
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-5">
                <EarningsChart data={earningsSummary.timeline} />
              </div>
            </section>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-950">Recent transactions</h2>
              <button type="button" onClick={() => setActiveTab('transactions')} className="text-sm font-bold text-indigo-600">View all</button>
            </div>
            <TransactionList transactions={transactions.slice(0, 6)} />
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Withdrawal readiness</h2>
              <div className="mt-4 space-y-3">
                <ReadinessItem label="Mentor approved" passed={user?.mentorStatus === 'APPROVED'} />
                <ReadinessItem label="Payout account approved" passed={payoutStatus === 'APPROVED'} />
                <ReadinessItem label="Available balance" passed={summary.available > 0} />
              </div>
              {!canWithdraw ? (
                <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
                  <AlertTriangle className="mr-2 inline h-4 w-4" />
                  Withdrawal is disabled until payout is approved and available balance is greater than zero.
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Payout account</h2>
              {defaultPayout ? (
                <div className="mt-4 space-y-2 text-sm font-semibold text-slate-600">
                  <p>{defaultPayout.accountHolderName}</p>
                  <p>{defaultPayout.bankName}</p>
                  <p>{maskAccount(defaultPayout.accountNumber)}</p>
                  <StatusPill label={formatPayoutStatus(payoutStatus)} tone={payoutStatus === 'APPROVED' ? 'emerald' : payoutStatus === 'REJECTED' ? 'rose' : 'amber'} />
                </div>
              ) : (
                <p className="mt-3 text-sm font-medium leading-6 text-slate-500">No payout account submitted yet.</p>
              )}
            </section>
          </aside>
        </div>
        </div>
      ) : activeTab === 'transactions' ? (
        filteredTransactions.length === 0 ? (
          <StateCard title="No transactions yet" message="Released earnings, escrow movements, withdrawals, and refunds will appear here when they exist." />
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <TransactionList transactions={filteredTransactions} />
          </section>
        )
      ) : activeTab === 'contracts' ? (
        contracts.length === 0 ? (
          <StateCard title="No earning contracts yet" message="Active escrow and completed contracts will appear here after clients accept your proposals." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {contracts.map((contract) => (
              <article key={contract.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">{contract.jobTitle || contract.title}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">Client: {contract.clientName}</p>
                  </div>
                  <StatusPill label={formatContractStatus(contract.status)} tone={contract.status === ContractStatus.COMPLETED ? 'emerald' : contract.status === ContractStatus.IN_DISPUTE ? 'rose' : contract.status === ContractStatus.CANCELLED ? 'slate' : 'indigo'} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MiniAmount label="In escrow" value={contract.amountInEscrow} />
                  <MiniAmount label="Paid" value={contract.amountPaid} />
                  <MiniAmount label="Total" value={contract.totalAmount} />
                  <MiniAmount label="Started" value={contract.createdAt} isDate />
                </div>
                <Link to="/mentor/contracts" className="mt-5 inline-flex rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
                  View contract
                </Link>
              </article>
            ))}
          </div>
        )
      ) : (
        <StateCard title="No withdrawal list endpoint" message="Withdrawal creation exists, but the backend currently exposes withdrawal listing only to admins. Mentor withdrawal history is not shown to avoid fake data." />
      )}
    </PageShell>
  )
}

function TransactionList({ transactions }: { transactions: WalletTransactionResponse[] }) {
  if (transactions.length === 0) {
    return <StateCard title="No transactions yet" message="Wallet transactions will appear here once money moves through your account." />
  }

  return (
    <div className="mt-4 divide-y divide-slate-100">
      {transactions.map((txn) => (
        <div key={txn.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${txn.direction === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
              <ReceiptText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">{formatTxnType(txn.txnType)}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{txn.note || txn.referenceType || 'Wallet transaction'}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{formatDateTime(txn.createdAt)}</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className={`text-sm font-bold ${txn.direction === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'}`}>
              {txn.direction === 'CREDIT' ? '+' : '-'}{formatCurrency(txn.amountMxc)}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{txn.txnStatus}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function ReadinessItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <StatusPill label={passed ? 'Ready' : 'Missing'} tone={passed ? 'emerald' : 'amber'} />
    </div>
  )
}

function MiniAmount({ label, value, isDate = false }: { label: string; value?: number | string; isDate?: boolean }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{isDate && value ? formatDateTime(String(value)) : formatCurrency(value || 0)}</p>
    </div>
  )
}

function isReleasedCredit(txn: WalletTransactionResponse) {
  return txn.direction === 'CREDIT' && releasedTxnTypes.has(String(txn.txnType)) && txn.txnStatus === 'COMPLETED'
}

function sameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

function formatTxnType(type: string) {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatContractStatus(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: 'Active',
    UNDER_REVIEW: 'Completion requested',
    IN_DISPUTE: 'In dispute',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  }
  return labels[status] || formatTxnType(status)
}

function formatPayoutStatus(status: string) {
  const labels: Record<string, string> = {
    NOT_SUBMITTED: 'Not submitted',
    PENDING: 'Pending review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  }
  return labels[status] || formatTxnType(status)
}

function maskAccount(account?: string) {
  if (!account) return 'Account not provided'
  const last4 = account.slice(-4)
  return `**** ${last4}`
}

function formatSourceLabel(source: string) {
  const labels: Record<string, string> = {
    LONG_TERM_MENTORING: 'Mentoring',
    SINGLE_SESSION_MENTORING: '1:1 sessions',
    FREELANCE_PROJECT: 'Freelance',
    COURSE_SALE: 'Courses',
  }
  return labels[source] || source.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}
