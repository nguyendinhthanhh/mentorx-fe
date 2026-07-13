import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  AlertTriangle,
  BadgeDollarSign,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  FileText,
  Landmark,
  ShieldCheck,
} from 'lucide-react'

import { adminMentorVerificationApi } from '@/api/adminMentorVerificationApi'
import { complaintsApi } from '@/api/complaintsApi'
import { walletApi } from '@/api/walletApi'
import { useI18n } from '@/i18n/I18nProvider'
import { useAuthStore } from '@/store/authStore'
import { ComplaintStatus } from '@/types'
import { isAdmin } from '@/utils/roleRedirect'

type QueueItem = {
  id: string
  href: string
  type: string
  title: string
  detail?: string
  tone: 'amber' | 'rose'
  icon: ReactNode
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore()
  const { t } = useI18n()
  const financeAdmin = isAdmin(user)

  const expertiseQuery = useQuery(
    ['admin-dashboard-expertise-queue'],
    () => adminMentorVerificationApi.getExpertiseQueue({ page: 0, size: 5 }),
    { retry: false }
  )
  const complaintQuery = useQuery(
    ['admin-dashboard-open-complaints'],
    () => complaintsApi.getAdminQueue({ status: ComplaintStatus.OPEN, page: 0, size: 5 }),
    { enabled: financeAdmin, retry: false }
  )
  const financialQuery = useQuery(
    ['admin-financial-summary'],
    () => walletApi.getFinancialSummary(),
    { enabled: financeAdmin, retry: false }
  )

  const mentorCount = expertiseQuery.data?.totalElements ?? 0
  const complaintCount = complaintQuery.data?.totalElements ?? 0
  const financialSummary = financialQuery.data

  const mentorQueue: QueueItem[] = (expertiseQuery.data?.content ?? []).map((profile) => ({
    id: `mentor-${profile.userId}`,
    href: '/admin/mentor-applications',
    type: t('admin.dashboard.queue.mentor'),
    title: profile.user?.displayName || profile.user?.fullName || t('admin.dashboard.queue.mentorFallback'),
    detail: profile.headline || profile.primaryDomain,
    tone: 'amber',
    icon: <ShieldCheck className="h-4 w-4" />,
  }))
  const complaintQueue: QueueItem[] = (complaintQuery.data?.content ?? []).map((complaint) => ({
    id: `complaint-${complaint.id}`,
    href: '/admin/complaints',
    type: t('admin.dashboard.queue.complaint'),
    title: complaint.title,
    detail: complaint.complaintCategory,
    tone: 'rose',
    icon: <AlertCircle className="h-4 w-4" />,
  }))
  const queueItems = [...mentorQueue, ...complaintQueue]

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
            {financeAdmin ? t('admin.dashboard.role.admin') : t('admin.dashboard.role.moderator')}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t('admin.dashboard.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t('admin.dashboard.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionLink to="/admin/mentor-applications" icon={<ShieldCheck className="h-4 w-4" />}>
            {t('admin.dashboard.action.reviewMentors')}
          </ActionLink>
          {financeAdmin ? (
            <ActionLink to="/admin/wallet" icon={<Landmark className="h-4 w-4" />}>
              {t('admin.dashboard.action.reviewPayouts')}
            </ActionLink>
          ) : (
            <ActionLink to="/admin/complaints" icon={<AlertCircle className="h-4 w-4" />}>
              {t('admin.dashboard.action.reviewComplaints')}
            </ActionLink>
          )}
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title={t('admin.dashboard.queue.title')}>
          {expertiseQuery.isError || (financeAdmin && complaintQuery.isError) ? (
            <UnavailableState label={t('admin.dashboard.unavailable')} />
          ) : queueItems.length === 0 && !expertiseQuery.isLoading && !complaintQuery.isLoading ? (
            <EmptyQueue />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {expertiseQuery.isLoading || (financeAdmin && complaintQuery.isLoading) ? (
                <QueueSkeleton />
              ) : (
                queueItems.map((item) => <QueueRow key={item.id} item={item} />)
              )}
            </div>
          )}
        </Panel>

        <aside className="space-y-5">
          <Panel title={t('admin.dashboard.overview.title')}>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <QueueCountRow
                label={t('admin.dashboard.metrics.mentorApplications')}
                value={getQueryValue(expertiseQuery.isLoading, expertiseQuery.isError, mentorCount, t)}
                icon={<ShieldCheck className="h-4 w-4" />}
                href="/admin/mentor-applications"
              />
              {financeAdmin ? (
                <>
                  <QueueCountRow
                    label={t('admin.dashboard.metrics.complaints')}
                    value={getQueryValue(complaintQuery.isLoading, complaintQuery.isError, complaintCount, t)}
                    icon={<AlertCircle className="h-4 w-4" />}
                    href="/admin/complaints"
                  />
                  <QueueCountRow
                    label={t('admin.dashboard.metrics.pendingPayouts')}
                    value={getQueryValue(financialQuery.isLoading, financialQuery.isError, financialSummary?.pendingWithdrawals ?? 0, t)}
                    icon={<BadgeDollarSign className="h-4 w-4" />}
                    href="/admin/wallet"
                  />
                  <QueueCountRow
                    label={t('admin.dashboard.metrics.fraudAlerts')}
                    value={getQueryValue(financialQuery.isLoading, financialQuery.isError, financialSummary?.fraudAlerts ?? 0, t)}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    href="/admin/wallet"
                  />
                </>
              ) : (
                <QueueCountRow
                  label={t('admin.dashboard.workflows.reports.title')}
                  value={t('admin.dashboard.action.reviewComplaints')}
                  icon={<FileText className="h-4 w-4" />}
                  href="/admin/reports"
                />
              )}
            </div>
          </Panel>

          {financeAdmin && (
            <Panel title={t('admin.dashboard.finance.title')}>
              {financialQuery.isError ? (
                <UnavailableState label={t('admin.dashboard.unavailable')} />
              ) : financialQuery.isLoading ? (
                <FinancialSkeleton />
              ) : (
                <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                  <FinanceRow label={t('admin.dashboard.finance.totalCirculation')} value={formatMxc(financialSummary?.totalCirculation ?? 0)} />
                  <FinanceRow label={t('admin.dashboard.finance.depositsToday')} value={formatMxc(financialSummary?.totalDepositToday ?? 0)} />
                  <FinanceRow label={t('admin.dashboard.finance.withdrawalsToday')} value={formatMxc(financialSummary?.totalWithdrawToday ?? 0)} />
                  <FinanceRow label={t('admin.dashboard.metrics.unmatchedDeposits')} value={String(financialSummary?.unmatchedDeposits ?? 0)} />
                </dl>
              )}
            </Panel>
          )}
        </aside>
      </section>

      <Panel title={t('admin.dashboard.workflows.title')}>
        <div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-800 md:grid-cols-2 xl:grid-cols-4">
          <WorkflowLink
            to="/admin/mentor-applications"
            icon={<ShieldCheck className="h-4 w-4" />}
            title={t('admin.dashboard.workflows.mentor.title')}
            description={t('admin.dashboard.workflows.mentor.description')}
          />
          <WorkflowLink
            to="/admin/jobs"
            icon={<Briefcase className="h-4 w-4" />}
            title={t('admin.dashboard.workflows.jobs.title')}
            description={t('admin.dashboard.workflows.jobs.description')}
          />
          <WorkflowLink
            to="/admin/courses"
            icon={<BookOpen className="h-4 w-4" />}
            title={t('admin.dashboard.workflows.courses.title')}
            description={t('admin.dashboard.workflows.courses.description')}
          />
          <WorkflowLink
            to="/admin/reports"
            icon={<FileText className="h-4 w-4" />}
            title={t('admin.dashboard.workflows.reports.title')}
            description={t('admin.dashboard.workflows.reports.description')}
          />
        </div>
      </Panel>
    </div>
  )

  function EmptyQueue() {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
        <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{t('admin.dashboard.queue.emptyTitle')}</p>
        <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{t('admin.dashboard.queue.emptyDescription')}</p>
      </div>
    )
  }
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function ActionLink({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 active:translate-y-px dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {icon}
      {children}
    </Link>
  )
}

function QueueCountRow({ label, value, icon, href }: { label: string; value: string | number; icon: ReactNode; href: string }) {
  return (
    <Link to={href} className="group flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-slate-950 dark:text-white">{value}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600 dark:text-slate-600 dark:group-hover:text-slate-300" />
    </Link>
  )
}

function QueueRow({ item }: { item: QueueItem }) {
  const toneClass = item.tone === 'rose'
    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'

  return (
    <Link to={item.href} className="group flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>{item.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.type}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-950 dark:text-white">{item.title}</p>
        {item.detail && <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600 dark:text-slate-600 dark:group-hover:text-slate-300" />
    </Link>
  )
}

function WorkflowLink({ to, icon, title, description }: { to: string; icon: ReactNode; title: string; description: string }) {
  return (
    <Link to={to} className="group block bg-white p-4 transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        {icon}
        <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h3>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
    </Link>
  )
}

function FinanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <dt className="text-sm text-slate-600 dark:text-slate-400">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums text-slate-950 dark:text-white">{value}</dd>
    </div>
  )
}

function QueueSkeleton() {
  return (
    <div className="space-y-0">
      {[0, 1, 2].map((item) => <div key={item} className="h-[76px] animate-pulse border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/30" />)}
    </div>
  )
}

function FinancialSkeleton() {
  return <div className="h-56 animate-pulse bg-slate-50 dark:bg-slate-800/30" />
}

function UnavailableState({ label }: { label: string }) {
  return <p className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">{label}</p>
}

function getQueryValue(
  isLoading: boolean,
  isError: boolean,
  value: number,
  t: (key: 'admin.dashboard.loading' | 'admin.dashboard.unavailable') => string
) {
  if (isLoading) return t('admin.dashboard.loading')
  if (isError) return t('admin.dashboard.unavailable')
  return new Intl.NumberFormat().format(value)
}

function formatMxc(value: number) {
  return `${new Intl.NumberFormat().format(value)} MXC`
}
