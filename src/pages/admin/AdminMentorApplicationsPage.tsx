import { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { adminMentorVerificationApi } from '@/api/adminMentorVerificationApi'
import { useAuthStore } from '@/store/authStore'
import { useI18n } from '@/i18n/I18nProvider'
import { MentorProfileResponse, PaginatedResponse, VerificationStatus } from '@/types'
import { TranslationKey } from '@/i18n/translations'
import { formatDateTime } from '@/utils/formatters'
import { hasRole } from '@/utils/roleRedirect'
import MentorStatusChip from '@/components/admin/MentorStatusChip'
import {
  DEFAULT_SORT,
  DOMAIN_OPTIONS,
  DomainFilter,
  PAGE_SIZE,
  ProofFilter,
  QueueStatusFilter,
  QueueTab,
  SortOption,
  filterProfiles,
  getPayoutMethodLabel,
  getProofSummary,
  getQueueStatus,
  matchesDomainFilter,
  matchesProofFilter,
  matchesStatusFilter,
  proofFilterOptions,
  queueTabs,
  sortOptions,
  sortProfiles,
  statusFilterOptions,
} from './mentorVerification.helpers'

export default function AdminMentorApplicationsPage() {
  const { user } = useAuthStore()
  const { t } = useI18n()
  const isAdmin = hasRole(user, 'ADMIN')
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab: QueueTab = searchParams.get('tab') === 'payout' ? 'payout' : 'expertise'
  const [activeTab, setActiveTab] = useState<QueueTab>(initialTab)
  const [statusFilter, setStatusFilter] = useState<QueueStatusFilter>('all')
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('all')
  const [proofFilter, setProofFilter] = useState<ProofFilter>('any')
  const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT)
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const changeTab = (tab: QueueTab) => {
    setActiveTab(tab)
    setStatusFilter('all')
    setDomainFilter('all')
    setProofFilter('any')
    setSortOption(DEFAULT_SORT)
    setPage(0)
    setSearchParams({ tab })
  }

  const expertiseQuery = useQuery(['admin-mentor-expertise', page], () =>
    adminMentorVerificationApi.getExpertiseQueue({ page, size: PAGE_SIZE })
  )

  const payoutQuery = useQuery(
    ['admin-mentor-payouts', page],
    () => adminMentorVerificationApi.getPayoutQueue({ page, size: PAGE_SIZE }),
    { enabled: isAdmin }
  )

  const queueMap: Record<QueueTab, PaginatedResponse<MentorProfileResponse> | undefined> = {
    expertise: expertiseQuery.data,
    payout: payoutQuery.data,
  }

  const queueErrors: Record<QueueTab, any> = {
    expertise: expertiseQuery.error,
    payout: payoutQuery.error,
  }

  const queueLoading: Record<QueueTab, boolean> = {
    expertise: expertiseQuery.isLoading,
    payout: payoutQuery.isLoading,
  }

  const availableTabs = useMemo(
    () => queueTabs.filter((tab) => !tab.adminOnly || isAdmin),
    [isAdmin]
  )

  useEffect(() => {
    if (!availableTabs.some((tab) => tab.key === activeTab)) {
      changeTab('expertise')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, availableTabs])

  const activeQueue = queueMap[activeTab]
  const hasCustomFilters =
    searchQuery.trim().length > 0
    || statusFilter !== 'all'
    || domainFilter !== 'all'
    || proofFilter !== 'any'
    || sortOption !== DEFAULT_SORT

  const activeItems = useMemo(
    () => {
      let items = activeQueue?.content ?? []

      if (activeTab === 'expertise') {
        items = items.filter(
          (profile) => getQueueStatus(profile, activeTab) !== VerificationStatus.NOT_SUBMITTED
        )
      }

      items = filterProfiles(items, searchQuery)
      items = items.filter((profile) => matchesStatusFilter(profile, activeTab, statusFilter))
      items = items.filter((profile) => matchesDomainFilter(profile, domainFilter))
      items = items.filter((profile) => matchesProofFilter(profile, proofFilter))

      return sortProfiles(items, activeTab, sortOption)
    },
    [activeQueue?.content, activeTab, searchQuery, statusFilter, domainFilter, proofFilter, sortOption]
  )

  return (
    <div className="relative min-h-screen max-w-[1600px] mx-auto w-full space-y-6">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/40 bg-white dark:bg-slate-950/60 backdrop-blur-2xl shadow-xl shadow-slate-200/40 dark:border-slate-800/60 dark:bg-slate-900/40 dark:shadow-none transition-all">
        <div className="absolute inset-0 bg-gradient-to-b from-white dark:from-slate-950/40 to-transparent pointer-events-none dark:from-white/5" />
        <div className="relative z-10 px-6 py-6 lg:px-8">
          {/* ── Queue Tabs ── */}
          <div className="grid gap-3 sm:grid-cols-3">
            {availableTabs.map((tab) => {
              const total = tab.key === 'expertise'
                ? expertiseQuery.data?.totalElements ?? 0
                : payoutQuery.data?.totalElements ?? 0
              const isActive = activeTab === tab.key
              const iconMap: Record<string, typeof ShieldCheck> = {
                expertise: ShieldCheck,
                payout: Banknote,
              }
              const TabIcon = iconMap[tab.key] || ShieldCheck

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => changeTab(tab.key)}
                  className={`group relative flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-300 ${
                    isActive
                      ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50  shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10'
                      : 'border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950/50 hover:border-slate-300 dark:border-slate-700 hover:bg-white dark:bg-slate-950 hover:shadow-sm dark:border-slate-800/60 dark:bg-slate-900/30 dark:hover:border-slate-700 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                      : 'bg-slate-100 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700'
                  }`}>
                    <TabIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`block text-sm font-bold ${isActive ? 'text-emerald-900 dark:text-emerald-100 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-300 dark:text-slate-300'}`}>{t(`admin.mentorVerif.queue.${tab.key}.label` as TranslationKey)}</span>
                    <span className={`mt-0.5 block text-[11px] leading-snug ${isActive ? 'text-emerald-600 dark:text-emerald-500/70 dark:text-emerald-300/60' : 'text-slate-400 dark:text-slate-500'}`}>
                      {t(`admin.mentorVerif.queue.${tab.key}.desc` as TranslationKey)}
                    </span>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black tabular-nums transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-700'
                  }`}>
                    {total}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── Search & Filters ── */}
          <div className="mt-5 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setPage(0)
                }}
                placeholder="{t('admin.mentorVerif.searchPlaceholder')}"
                className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950 pl-11 pr-4 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none transition-all hover:border-slate-300 dark:border-slate-700 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-white dark:hover:border-slate-700 dark:focus:border-emerald-500/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ToolbarSelect
                label={t('admin.mentorVerif.status')}
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value as QueueStatusFilter)
                  setPage(0)
                }}
                options={statusFilterOptions.map(opt => ({
                  ...opt,
                  label: t(`admin.mentorVerif.filter.status.${opt.value === 'all' ? 'all' : opt.value === 'PENDING' ? 'pending' : opt.value === 'NEEDS_MORE_INFO' ? 'needsMoreInfo' : opt.value.toLowerCase()}` as TranslationKey)
                }))}
              />
              <ToolbarSelect
                label={t('admin.mentorVerif.domain')}
                value={domainFilter}
                onChange={(value) => {
                  setDomainFilter(value)
                  setPage(0)
                }}
                options={[
                  { label: t('admin.mentorVerif.filter.domain.all' as TranslationKey), value: 'all' },
                  ...DOMAIN_OPTIONS.map((domain) => ({ label: domain, value: domain })),
                ]}
              />
              <ToolbarSelect
                label={t('admin.mentorVerif.proof')}
                value={proofFilter}
                onChange={(value) => {
                  setProofFilter(value as ProofFilter)
                  setPage(0)
                }}
                options={proofFilterOptions.map(opt => ({
                  ...opt,
                  label: t(`admin.mentorVerif.filter.proof.${opt.value}` as TranslationKey)
                }))}
              />
              <ToolbarSelect
                label={t('admin.mentorVerif.sort')}
                value={sortOption}
                onChange={(value) => setSortOption(value as SortOption)}
                options={sortOptions.map(opt => ({
                  ...opt,
                  label: t(`admin.mentorVerif.sort.${opt.value.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); })}` as TranslationKey)
                }))}
              />

              {hasCustomFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setDomainFilter('all')
                    setProofFilter('any')
                    setSortOption(DEFAULT_SORT)
                    setPage(0)
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200/80 bg-rose-50/60 px-3 text-xs font-bold text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {t('admin.mentorVerif.clearFilters')}
                </button>
              )}

              <span className="w-full text-xs font-medium text-slate-400 dark:text-slate-500 sm:ml-auto sm:w-auto">
                {activeItems.length} of {activeQueue?.totalElements ?? 0} · {t('admin.mentorVerif.page')} {page + 1}/{Math.max(activeQueue?.totalPages ?? 1, 1)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 dark:bg-slate-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t('admin.mentorVerif.table.applicant')}</th>
                  {activeTab === 'expertise' ? (
                    <>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t('admin.mentorVerif.table.domainAndSkills')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t('admin.mentorVerif.table.evidence')}</th>
                    </>
                  ) : (
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t('admin.mentorVerif.table.payoutDestination')}</th>
                  )}
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t('admin.mentorVerif.table.status')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t('admin.mentorVerif.table.submitted')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider text-right">{t('admin.mentorVerif.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                {queueLoading[activeTab] ? (
                  <QueueTableSkeleton columns={activeTab === 'expertise' ? 6 : 5} />
                ) : queueErrors[activeTab] ? (
                  <tr>
                    <td colSpan={6}>
                      <QueueError tab={activeTab} />
                    </td>
                  </tr>
                ) : activeItems.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <QueueEmptyState
                        title={t('admin.mentorVerif.empty.title')}
                        description={t('admin.mentorVerif.empty.desc')}
                      />
                    </td>
                  </tr>
                ) : (
                  activeItems.map((profile) => (
                    <QueueRow key={profile.userId} activeTab={activeTab} profile={profile} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {activeQueue && activeQueue.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 px-6 py-4 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-400">
                {t('admin.mentorVerif.page')} {page + 1} {t('admin.mentorVerif.of')} {activeQueue.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition hover:border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:text-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(activeQueue.totalPages - 1, current + 1))}
                  disabled={page >= activeQueue.totalPages - 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition hover:border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:text-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function QueueRow({ activeTab, profile }: { activeTab: QueueTab; profile: MentorProfileResponse }) {
  const { t } = useI18n()
  const user = profile.user
  const queueStatus = getQueueStatus(profile, activeTab)
  const skillsPreview = profile.skills?.slice(0, 2) ?? []
  const hasMoreSkills = (profile.skills?.length ?? 0) > skillsPreview.length
  const submittedLabel = profile.submittedAt
    ? formatDateTime(profile.submittedAt)
    : formatDateTime(profile.updatedAt || profile.createdAt)
  const detailHref = `/admin/mentor-applications/${profile.userId}?tab=${activeTab}`
  const proofSummary = getProofSummary(profile)

  return (
    <tr className="group cursor-pointer hover:bg-slate-50 dark:bg-slate-900/30 dark:hover:bg-slate-800/80 transition-colors">
      <td className="px-6 py-4">
        <Link to={detailHref} className="flex items-center gap-3 min-w-0">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white overflow-hidden dark:bg-white dark:text-slate-950">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              user?.fullName?.charAt(0)?.toUpperCase() || 'M'
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
              {user?.fullName || 'Mentor applicant'}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-400 dark:text-slate-500">
              <Mail className="h-3 w-3" />
              {user?.email}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
              {profile.headline || profile.currentTitle || ''}
            </p>
          </div>
        </Link>
      </td>

      {activeTab === 'expertise' ? (
        <>
          <td className="px-6 py-4">
            <div className="flex flex-wrap gap-1.5 max-w-xs">
              {profile.primaryDomain && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 dark:bg-slate-900 dark:text-slate-300">
                  {profile.primaryDomain}
                </span>
              )}
              {skillsPreview.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 dark:bg-slate-900 dark:text-slate-300"
                >
                  {skill}
                </span>
              ))}
              {hasMoreSkills && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 dark:bg-slate-900 dark:text-slate-400">
                  +{(profile.skills?.length ?? 0) - skillsPreview.length}
                </span>
              )}
            </div>
          </td>
          <td className="px-6 py-4">
            {proofSummary.length > 0 ? (
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 dark:text-slate-300">{proofSummary.join(', ')}</p>
            ) : (
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-600 italic">{t('admin.mentorVerif.filter.proof.missing')}</span>
            )}
          </td>
        </>
      ) : (
        <td className="px-6 py-4">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 dark:text-slate-300">
            {t(`admin.mentorVerif.payoutMethod.${profile.payoutMethod === 'LOCAL_BANK' ? 'localBank' : profile.payoutMethod === 'INTERNATIONAL_BANK' ? 'intlBank' : profile.payoutMethod === 'PAYPAL' ? 'paypal' : profile.payoutMethod === 'WISE' ? 'wise' : profile.payoutMethod === 'STRIPE_CONNECT' ? 'stripe' : 'default'}` as TranslationKey)}
          </p>
          {(profile.payoutAccountNumberMasked || profile.payoutCountry) && (
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
              {[profile.payoutAccountNumberMasked, profile.payoutCountry].filter(Boolean).join(' · ')}
            </p>
          )}
        </td>
      )}

      <td className="px-6 py-4">
        <MentorStatusChip status={queueStatus} />
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 dark:text-slate-400">{submittedLabel}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <Link
          to={detailHref}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 opacity-100 transition-all hover:border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:bg-emerald-900/30 hover:text-emerald-700 dark:text-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 lg:opacity-0 lg:group-hover:opacity-100 dark:hover:bg-emerald-900/20"
        >
          <Eye className="h-3.5 w-3.5" />{t('admin.mentorVerif.action.view')}</Link>
      </td>
    </tr>
  )
}

function QueueTableSkeleton({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="animate-pulse">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-2">
                <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-40 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </td>
          <td colSpan={columns - 1} />
        </tr>
      ))}
    </>
  )
}

function QueueEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 px-8 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-black text-gray-950 dark:text-white">{title}</h3>
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </div>
  )
}

function QueueError({ tab }: { tab: QueueTab }) {
  const { t } = useI18n()
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 px-8 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-black text-gray-950 dark:text-white">{t('admin.mentorVerif.error.title')}</h3>
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{t('admin.mentorVerif.error.desc')}</p>
      </div>
    </div>
  )
}

function ToolbarSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
}) {
  return (
    <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950 px-3 transition-colors hover:border-slate-300 dark:border-slate-700 dark:border-slate-800/60 dark:bg-slate-900/60 dark:hover:border-slate-700">
      <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 cursor-pointer bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none dark:text-slate-300"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
