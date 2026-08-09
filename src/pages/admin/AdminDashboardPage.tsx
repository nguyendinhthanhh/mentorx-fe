import { useQuery } from 'react-query'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BadgeDollarSign,
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Flag,
  Landmark,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'

import { adminDashboardApi } from '@/api/adminDashboardApi'
import { adminMentorVerificationApi } from '@/api/adminMentorVerificationApi'
import { complaintsApi } from '@/api/complaintsApi'
import { walletApi } from '@/api/walletApi'
import DashboardStatCard from '@/components/admin/DashboardStatCard'
import DashboardPendingCard from '@/components/admin/DashboardPendingCard'
import DashboardPanel from '@/components/admin/DashboardPanel'
import DashboardActivityFeed from '@/components/admin/DashboardActivityFeed'
import { useI18n } from '@/i18n/I18nProvider'
import { useAuthStore } from '@/store/authStore'
import { ComplaintStatus } from '@/types'
import { isAdmin } from '@/utils/roleRedirect'

export default function AdminDashboardPage() {
  const { user } = useAuthStore()
  const { t } = useI18n()
  const financeAdmin = isAdmin(user)

  const totalUsers = useQuery(['admin-stat-total-users'], adminDashboardApi.getTotalUsers, { retry: false, staleTime: 60_000 })
  const activeUsers = useQuery(['admin-stat-active-users'], adminDashboardApi.getActiveUsers, { retry: false, staleTime: 60_000 })
  const approvedMentors = useQuery(['admin-stat-approved-mentors'], adminDashboardApi.getApprovedMentors, { retry: false, staleTime: 60_000 })
  const pendingMentors = useQuery(['admin-stat-pending-mentors'], adminDashboardApi.getPendingMentors, { retry: false, staleTime: 60_000 })
  const totalEscrow = useQuery(['admin-stat-total-escrow'], adminDashboardApi.getTotalEscrowLocked, { retry: false, staleTime: 60_000, enabled: financeAdmin })
  const walletsRecon = useQuery(['admin-stat-wallets-recon'], adminDashboardApi.getWalletsRequiringReconciliation, { retry: false, staleTime: 60_000, enabled: financeAdmin })

  const financialSummary = useQuery(['admin-financial-summary'], () => walletApi.getFinancialSummary(), { retry: false, staleTime: 60_000, enabled: financeAdmin })
  const pendingWithdrawals = useQuery(['admin-pending-withdrawals'], adminDashboardApi.getPendingWithdrawals, { retry: false, staleTime: 60_000, enabled: financeAdmin })
  const pendingComplaints = useQuery(['admin-pending-complaints'], adminDashboardApi.getPendingComplaints, { retry: false, staleTime: 60_000, enabled: financeAdmin })
  const expertiseQueue = useQuery(['admin-expertise-queue'], () => adminMentorVerificationApi.getExpertiseQueue({ page: 0, size: 5 }), { retry: false, staleTime: 60_000 })
  const escalatedReports = useQuery(['admin-escalated-reports'], adminDashboardApi.getEscalatedReports, { retry: false, staleTime: 60_000, enabled: financeAdmin })

  const recentReports = useQuery(['admin-recent-reports'], () => adminDashboardApi.getRecentReports(0, 5), { retry: false, staleTime: 60_000 })
  const recentTransactions = useQuery(
    ['admin-recent-transactions'],
    () => adminDashboardApi.getRecentTransactions(0, 5),
    { retry: false, staleTime: 60_000, enabled: financeAdmin }
  )

  const statValue = (query: typeof totalUsers) => {
    if (query.isLoading) return t('admin.dashboard.loading')
    if (query.isError) return t('admin.dashboard.unavailable')
    return new Intl.NumberFormat().format(query.data ?? 0)
  }

  const walletsReconCount = walletsRecon.data?.length ?? 0
  const pendingWithdrawalCount = pendingWithdrawals.data?.length ?? 0
  const complaintsCount = pendingComplaints.data?.totalElements ?? 0
  const escalatedCount = escalatedReports.data?.length ?? 0
  const expertiseCount = expertiseQueue.data?.totalElements ?? 0
  const financialData = financialSummary.data

  return (
    <div className="space-y-4">
      {/* Page Header — Gentelella style */}
      <div className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('admin.dashboard.role.admin')}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t('admin.dashboard.title')}</h1>
          <div className="flex flex-wrap gap-2">
            <a
              href="/admin/complaints"
              className="inline-flex h-8 items-center gap-1.5 rounded border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {t('nav.messages')}
            </a>
            {financeAdmin ? (
              <a
                href="/admin/wallet"
                className="inline-flex h-8 items-center gap-1.5 rounded bg-emerald-600 px-3 text-[12px] font-medium text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Landmark className="h-3.5 w-3.5" />
                {t('admin.dashboard.finance.title')}
              </a>
            ) : (
              <a
                href="/admin/reports"
                className="inline-flex h-8 items-center gap-1.5 rounded bg-emerald-600 px-3 text-[12px] font-medium text-white shadow-sm transition hover:bg-emerald-700"
              >
                <FileText className="h-3.5 w-3.5" />
                {t('admin.dashboard.workflows.reports.title')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* STAT CARDS ROW 1 */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard
          icon={<Users className="h-5 w-5" />}
          label={t('admin.dashboard.stats.totalUsers')}
          value={statValue(totalUsers)}
          iconColor="teal"
          isLoading={totalUsers.isLoading}
          href="/admin/users"
          sparkValues={[35, 45, 40, 55, 48, 62, 58, 72, 68, 82]}
        />
        <DashboardStatCard
          icon={<Activity className="h-5 w-5" />}
          label={t('admin.dashboard.stats.activeUsers')}
          value={statValue(activeUsers)}
          iconColor="blue"
          isLoading={activeUsers.isLoading}
          sparkValues={[50, 40, 65, 55, 70, 60, 80, 75, 85, 90]}
        />
        <DashboardStatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label={t('admin.dashboard.stats.approvedMentors')}
          value={statValue(approvedMentors)}
          iconColor="green"
          isLoading={approvedMentors.isLoading}
          sparkValues={[30, 40, 35, 50, 45, 55, 52, 65, 60, 72]}
        />
      </div>

      {/* STAT CARDS ROW 2 */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard
          icon={<Clock className="h-5 w-5" />}
          label={t('admin.dashboard.stats.pendingMentors')}
          value={statValue(pendingMentors)}
          iconColor="yellow"
          isLoading={pendingMentors.isLoading}
          href="/admin/mentor-applications"
          sparkValues={[80, 70, 75, 60, 65, 50, 55, 45, 40, 35]}
        />
        {financeAdmin && (
          <>
            <DashboardStatCard
              icon={<DollarSign className="h-5 w-5" />}
              label={t('admin.dashboard.stats.totalEscrow')}
              value={totalEscrow.isLoading ? t('admin.dashboard.loading') : totalEscrow.isError ? t('admin.dashboard.unavailable') : `${new Intl.NumberFormat().format(totalEscrow.data ?? 0)} MXC`}
              iconColor="purple"
              isLoading={totalEscrow.isLoading}
              href="/admin/wallet"
            />
            <DashboardStatCard
              icon={<AlertTriangle className="h-5 w-5" />}
              label={t('admin.dashboard.stats.walletsRecon')}
              value={walletsRecon.isLoading ? t('admin.dashboard.loading') : walletsRecon.isError ? t('admin.dashboard.unavailable') : new Intl.NumberFormat().format(walletsReconCount)}
              iconColor="red"
              isLoading={walletsRecon.isLoading}
              href="/admin/wallet"
            />
          </>
        )}
        {!financeAdmin && (
          <DashboardStatCard
            icon={<Flag className="h-5 w-5" />}
            label={t('admin.dashboard.workflows.reports.title')}
            value={recentReports.isLoading ? t('admin.dashboard.loading') : recentReports.isError ? t('admin.dashboard.unavailable') : new Intl.NumberFormat().format(recentReports.data?.totalElements ?? 0)}
            iconColor="red"
            isLoading={recentReports.isLoading}
            href="/admin/reports"
          />
        )}
      </div>

      {/* PENDING APPROVALS */}
      {financeAdmin && (
        <DashboardPendingCard
          title={t('admin.dashboard.pending.title')}
          items={[
            {
              label: t('admin.dashboard.pending.mentors'),
              count: expertiseQueue.isLoading ? '...' : expertiseQueue.isError ? '-' : new Intl.NumberFormat().format(expertiseCount),
              href: '/admin/mentor-applications',
              icon: <ShieldCheck className="h-4 w-4" />,
              tone: 'amber',
            },
            {
              label: t('admin.dashboard.pending.payouts'),
              count: '-',
              href: '/admin/wallet',
              icon: <Landmark className="h-4 w-4" />,
              tone: 'amber',
            },
            {
              label: t('admin.dashboard.pending.withdrawals'),
              count: pendingWithdrawals.isLoading ? '...' : pendingWithdrawals.isError ? '-' : new Intl.NumberFormat().format(pendingWithdrawalCount),
              href: '/admin/wallet',
              icon: <BadgeDollarSign className="h-4 w-4" />,
              tone: 'rose',
            },
            {
              label: t('admin.dashboard.pending.escalatedReports'),
              count: escalatedReports.isLoading ? '...' : escalatedReports.isError ? '-' : new Intl.NumberFormat().format(escalatedCount),
              href: '/admin/reports',
              icon: <Flag className="h-4 w-4" />,
              tone: 'rose',
            },
            {
              label: t('admin.dashboard.pending.complaints'),
              count: pendingComplaints.isLoading ? '...' : pendingComplaints.isError ? '-' : new Intl.NumberFormat().format(complaintsCount),
              href: '/admin/complaints',
              icon: <AlertCircle className="h-4 w-4" />,
              tone: 'rose',
            },
          ]}
          isLoading={false}
        />
      )}

      {/* FINANCIAL OVERVIEW + MODERATION WORKSPACES (8-4 grid) */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {financeAdmin ? (
          <DashboardPanel title={t('admin.dashboard.finance.title')}>
            {financialSummary.isError ? (
              <p className="px-4 py-8 text-sm text-slate-500 dark:text-slate-400">{t('admin.dashboard.unavailable')}</p>
            ) : financialSummary.isLoading ? (
              <div className="h-40 animate-pulse bg-slate-50 dark:bg-slate-800/30" />
            ) : (
              <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                <FinanceRow label={t('admin.dashboard.finance.totalCirculation')} value={formatMxc(financialData?.totalCirculation ?? 0)} />
                <FinanceRow label={t('admin.dashboard.finance.depositsToday')} value={formatMxc(financialData?.totalDepositToday ?? 0)} />
                <FinanceRow label={t('admin.dashboard.finance.withdrawalsToday')} value={formatMxc(financialData?.totalWithdrawToday ?? 0)} />
                <FinanceRow label={t('admin.dashboard.metrics.pendingPayouts')} value={new Intl.NumberFormat().format(financialData?.pendingWithdrawals ?? 0)} />
                <FinanceRow label={t('admin.dashboard.metrics.unmatchedDeposits')} value={new Intl.NumberFormat().format(financialData?.unmatchedDeposits ?? 0)} />
                <FinanceRow label={t('admin.dashboard.metrics.fraudAlerts')} value={new Intl.NumberFormat().format(financialData?.fraudAlerts ?? 0)} />
              </dl>
            )}
          </DashboardPanel>
        ) : (
          <DashboardPanel title={t('admin.dashboard.workflows.title')}>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <WorkflowCell
                to="/admin/mentor-applications"
                icon={<ShieldCheck className="h-4 w-4" />}
                title={t('admin.dashboard.workflows.mentor.title')}
                description={t('admin.dashboard.workflows.mentor.description')}
              />
              <WorkflowCell
                to="/admin/jobs"
                icon={<Briefcase className="h-4 w-4" />}
                title={t('admin.dashboard.workflows.jobs.title')}
                description={t('admin.dashboard.workflows.jobs.description')}
              />
              <WorkflowCell
                to="/admin/courses"
                icon={<CheckCircle2 className="h-4 w-4" />}
                title={t('admin.dashboard.workflows.courses.title')}
                description={t('admin.dashboard.workflows.courses.description')}
              />
              <WorkflowCell
                to="/admin/reports"
                icon={<FileText className="h-4 w-4" />}
                title={t('admin.dashboard.workflows.reports.title')}
                description={t('admin.dashboard.workflows.reports.description')}
              />
            </div>
          </DashboardPanel>
        )}

        {/* Sidebar panel */}
        <DashboardPanel title={t('admin.dashboard.reportStats.title')} subtitle={t('admin.dashboard.workflows.reports.description')}>
          <ReportStatsList items={builtinReportStats(financeAdmin, expertiseCount, complaintsCount, escalatedCount)} />
        </DashboardPanel>
      </div>

      {/* RECENT ACTIVITY (8-4 grid) */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <DashboardActivityFeed
          title={t('admin.dashboard.recent.reports')}
          items={buildRecentReportItems(recentReports.data?.content ?? [])}
          isLoading={recentReports.isLoading}
          emptyLabel={t('admin.dashboard.queue.emptyTitle')}
        />
        {financeAdmin ? (
          <DashboardActivityFeed
            title={t('admin.dashboard.recent.transactions')}
            items={buildRecentTransactionItems(recentTransactions.data?.content ?? [])}
            isLoading={recentTransactions.isLoading}
            emptyLabel={t('admin.dashboard.queue.emptyTitle')}
          />
        ) : (
          <DashboardActivityFeed
            title={t('admin.dashboard.recent.transactions')}
            items={[]}
            emptyLabel="Finance access only"
          />
        )}
      </div>
    </div>
  )
}

/* ── Internal helpers ── */

function FinanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-[13px] text-slate-600 dark:text-slate-400">{label}</dt>
      <dd className="text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">{value}</dd>
    </div>
  )
}

function WorkflowCell({ to, icon, title, description }: { to: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <a
      href={to}
      className="group block border border-slate-100 bg-white p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
    >
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        {icon}
        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
    </a>
  )
}

function ReportStatsList({ items }: { items: { label: string; value: string | number; color: string }[] }) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            {item.label}
          </span>
          <span className="text-[12px] font-semibold tabular-nums text-slate-900 dark:text-white">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function builtinReportStats(financeAdmin: boolean, mentors: number, complaints: number, escalated: number) {
  if (financeAdmin) {
    return [
      { label: 'Open', value: complaints, color: '#f59f00' },
      { label: 'Escalated', value: escalated, color: '#d63939' },
      { label: 'Resolved', value: '-', color: '#2fb344' },
    ]
  }
  return [
    { label: 'Pending Mentors', value: mentors, color: '#f59f00' },
    { label: 'Reports', value: escalated, color: '#d63939' },
  ]
}

function buildRecentReportItems(reports: any[]) {
  return reports.map((r) => ({
    id: r.id,
    avatar: (r.reporter?.fullName || 'U').charAt(0).toUpperCase(),
    avatarColor: '#d63939',
    body: (
      <>
        <strong className="font-medium text-slate-900 dark:text-white">{r.reporter?.fullName || 'User'}</strong>{' '}
        reported — {r.reason || r.category || 'Policy violation'}
      </>
    ),
    time: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '',
  }))
}

function buildRecentTransactionItems(transactions: any[]) {
  const colors = ['#1ABB9C', '#066fd1', '#ae3ec9', '#f59f00', '#d63939']
  return transactions.map((tx, i) => ({
    id: tx.id || tx.transactionId || String(i),
    avatar: (tx.wallet?.user?.fullName || 'S').charAt(0).toUpperCase(),
    avatarColor: colors[i % colors.length],
    body: (
      <>
        <strong className="font-medium text-slate-900 dark:text-white">{tx.type || 'Transaction'}</strong>{' '}
        {tx.amount != null ? `${new Intl.NumberFormat().format(tx.amount)} MXC` : ''} — {tx.wallet?.user?.fullName || 'System'}
      </>
    ),
    time: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '',
  }))
}

function formatMxc(value: number) {
  return `${new Intl.NumberFormat().format(value)} MXC`
}
