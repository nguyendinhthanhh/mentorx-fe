import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Timer,
  X,
} from 'lucide-react'
import { Skeleton, SkeletonCircle } from '@/components/ui/Skeleton'
import { jobApi } from '@/api/jobApi'
import { skillApi } from '@/api/skillApi'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'
import { JobResponse, JobType } from '@/types'
import { useI18n } from '@/i18n/I18nProvider'
import { TranslationKey } from '@/i18n/translations'

const PAGE_SIZE = 8

const JOB_TYPE_OPTIONS = [
  { value: 'ALL', labelKey: 'jobs.all' },
  { value: JobType.FREELANCE_PROJECT, labelKey: 'jobs.freelance' },
  { value: JobType.LONG_TERM_MENTORING, labelKey: 'jobs.mentoring' },
  { value: JobType.QUICK_FIX, labelKey: 'jobs.quickFix' },
]

const JOB_TYPE_META: Record<string, { labelKey: TranslationKey; className: string }> = {
  [JobType.FREELANCE_PROJECT]: {
    labelKey: 'jobs.freelance',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  [JobType.LONG_TERM_MENTORING]: {
    labelKey: 'jobs.mentoring',
    className: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  },
  [JobType.QUICK_FIX]: {
    labelKey: 'jobs.quickFix',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
}

export default function JobListPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [jobType, setJobType] = useState<string>('ALL')
  const [skillFilter, setSkillFilter] = useState('')
  const [page, setPage] = useState(0)

  const apiJobType = jobType === 'ALL' ? undefined : (jobType as JobType)
  const { data: skills = [] } = useQuery('job-filter-skills', skillApi.getAllActive, {
    staleTime: 5 * 60 * 1000,
  })

  const { data, isLoading } = useQuery(
    ['jobs', page, apiJobType, skillFilter],
    () =>
      jobApi.getOpenJobs({
        page,
        size: PAGE_SIZE,
        jobType: apiJobType,
        skill: skillFilter.trim() || undefined,
      }),
    { keepPreviousData: true }
  )

  const jobs = data?.content || []
  const filteredJobs = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return jobs

    return jobs.filter((job) => {
      const clientName = getClientName(job).toLowerCase()
      return (
        job.title.toLowerCase().includes(keyword) ||
        job.description.toLowerCase().includes(keyword) ||
        clientName.includes(keyword) ||
        job.jobType.toLowerCase().replace(/_/g, ' ').includes(keyword) ||
        (job.requiredSkills || []).some((skill) => skill.toLowerCase().includes(keyword))
      )
    })
  }, [jobs, search])

  const totalPages = data?.totalPages || 1
  const totalJobs = data?.totalElements || 0
  const hasSearch = search.trim().length > 0
  const hasActiveFilters = hasSearch || jobType !== 'ALL' || !!skillFilter

  const updateType = (value: string) => {
    setJobType(value)
    setPage(0)
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <section className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('jobs.searchPlaceholder')}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-12 text-sm font-medium text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
              {hasSearch && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={t('common.clear')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                {JOB_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateType(option.value)}
                    className={`h-10 rounded-lg px-3 text-xs font-black transition sm:text-sm ${
                      jobType === option.value
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white hover:text-slate-950'
                    }`}
                  >
                    {t(option.labelKey as TranslationKey)}
                  </button>
                ))}
              </div>
              <label className="relative">
                <select
                  value={skillFilter}
                  onChange={(event) => {
                    setSkillFilter(event.target.value)
                    setPage(0)
                  }}
                  className="h-10 appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 text-xs font-bold text-slate-700 outline-none transition hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:h-12 sm:text-sm"
                >
                  <option value="">All skills</option>
                  {skills.slice(0, 80).map((skill) => (
                    <option key={skill.id} value={skill.labelEn}>
                      {skill.labelEn}
                    </option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
              </label>

              <div className="flex items-center gap-2">
                <Link
                  to="/my-jobs"
                  className="inline-flex h-10 sm:h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <Briefcase className="h-4 w-4 text-slate-500" />
                  <span className="hidden sm:inline">Yêu cầu của tôi</span>
                  <span className="sm:hidden">Của tôi</span>
                </Link>

                <Link
                  to="/jobs/create"
                  className="inline-flex h-10 sm:h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 sm:px-4 text-sm font-black text-white transition hover:bg-indigo-700 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('jobs.post')}</span>
                  <span className="sm:hidden">Đăng mới</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">{t('jobs.title')}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {hasSearch
                ? t('jobs.resultsFor', { count: filteredJobs.length, query: search.trim() })
                : t('jobs.openCount', { count: totalJobs })}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
            <SlidersHorizontal className="h-4 w-4" />
            {jobType === 'ALL' ? t('jobs.allOpen') : t(JOB_TYPE_META[jobType]?.labelKey || 'jobs.all')}
          </div>
        </div>

        {isLoading ? (
          <JobListSkeleton />
        ) : filteredJobs.length > 0 ? (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <JobCard key={job.jobId} job={job} />
            ))}
          </div>
        ) : (
          <EmptyState hasSearch={hasActiveFilters} onClear={() => {
            setSearch('')
            updateType('ALL')
            setSkillFilter('')
          }} />
        )}

        <div className="mt-8 border-t border-slate-200 pt-6">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </main>
    </div>
  )
}

function JobCard({ job }: { job: JobResponse }) {
  const { t } = useI18n()
  const meta = JOB_TYPE_META[job.jobType] || {
    labelKey: 'jobs.all' as TranslationKey,
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  }
  const clientName = getClientName(job)
  const budget = formatBudget(job, t)
  const deadline = job.deadlineAt ? formatDeadline(job.deadlineAt) : t('common.noDeadline')

  return (
    <Link
      to={`/jobs/${job.jobId}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg min-[760px]:flex-row min-[760px]:items-stretch min-[760px]:gap-5 lg:gap-6"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${meta.className}`}>
                {JOB_TYPE_META[job.jobType] ? t(meta.labelKey) : job.jobType.replace(/_/g, ' ')}
              </span>
              {job.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('jobs.featured')}
                </span>
              )}
            </div>
            <h2 className="line-clamp-2 text-xl font-black leading-6 text-slate-950 transition group-hover:text-indigo-700">
              {job.title}
            </h2>
            <p className="mt-2 text-sm font-bold text-slate-500">{clientName}</p>
          </div>
          <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-indigo-600" />
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 min-[760px]:max-w-3xl">{job.description}</p>

        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {job.requiredSkills.slice(0, 4).map((skill) => (
              <span key={skill} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700">
                {skill}
              </span>
            ))}
            {job.requiredSkills.length > 4 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">
                +{job.requiredSkills.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-2 min-[480px]:grid-cols-3 min-[760px]:hidden">
          <JobInfo icon={Briefcase} label={t('jobs.budget')} value={budget} />
          <JobInfo icon={Timer} label={t('jobs.deadline')} value={deadline} />
          <JobInfo icon={Clock3} label={t('jobs.posted')} value={formatRelativeTime(job.createdAt)} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 min-[760px]:border-none min-[760px]:pt-0">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{job.status}</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 min-[760px]:hidden">
            <FileText className="h-4 w-4" />
            {t('jobs.proposalCount', { count: getProposalCount(job) })}
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-black text-indigo-700 sm:ml-auto min-[760px]:ml-0">
            {t('common.viewDetails')}
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div className="mt-5 hidden w-full shrink-0 grid-cols-2 gap-2 border-t border-slate-100 pt-5 min-[760px]:mt-0 min-[760px]:grid min-[760px]:w-[390px] min-[760px]:border-l min-[760px]:border-t-0 min-[760px]:pl-5 min-[760px]:pt-0 lg:w-[440px] lg:pl-6">
        <JobInfo icon={Briefcase} label={t('jobs.budget')} value={budget} />
        <JobInfo icon={Timer} label={t('jobs.deadline')} value={deadline} />
        <JobInfo icon={Clock3} label={t('jobs.posted')} value={formatRelativeTime(job.createdAt)} />
        <JobInfo icon={FileText} label={t('jobs.proposals')} value={t('jobs.proposalCount', { count: getProposalCount(job) })} />
      </div>
    </Link>
  )
}

function JobInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 min-[760px]:p-2.5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400 min-[760px]:text-[11px]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 break-words text-sm font-black leading-5 text-slate-950">{value}</p>
    </div>
  )
}

function JobListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm min-[760px]:flex min-[760px]:gap-5 lg:gap-6">
          <div className="flex-1">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="mt-5 h-6 w-3/4" />
            <Skeleton className="mt-3 h-4 w-1/3" />
            <div className="mt-5 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-2 min-[480px]:grid-cols-3 min-[760px]:mt-0 min-[760px]:w-[390px] min-[760px]:grid-cols-2 min-[760px]:border-l min-[760px]:border-slate-100 min-[760px]:pl-5 lg:w-[440px] lg:pl-6">
            {Array.from({ length: 4 }).map((__, itemIndex) => (
              <Skeleton key={itemIndex} className="h-14 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ hasSearch, onClear }: { hasSearch: boolean; onClear: () => void }) {
  const { t } = useI18n()

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <Briefcase className="mx-auto h-14 w-14 text-slate-300" />
      <h3 className="mt-4 text-xl font-black text-slate-950">{t('jobs.noJobsFound')}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {hasSearch ? t('jobs.emptyWithFilters') : t('jobs.emptyNoJobs')}
      </p>
      {hasSearch ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-700"
        >
          {t('jobs.clearFilters')}
        </button>
      ) : (
        <Link
          to="/jobs/create"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          {t('jobs.post')}
        </Link>
      )}
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm font-bold text-slate-500">
        {t('common.pageOf', { page: page + 1, total: Math.max(totalPages, 1) })}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-indigo-600 px-3 text-sm font-black text-white">
          {page + 1}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function formatBudget(job: JobResponse, t: ReturnType<typeof useI18n>['t']) {
  if (job.budgetMinMxc && job.budgetMaxMxc) {
    return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
  }
  if (job.hourlyRateMxc) return `${formatCurrency(job.hourlyRateMxc)}/hr`
  return t('jobs.budgetTbd')
}

function formatDeadline(deadline: string) {
  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) return 'No deadline'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getClientName(job: JobResponse) {
  return (job as JobResponse & { clientName?: string }).clientName || job.client?.displayName || job.client?.fullName || 'Company'
}

function getProposalCount(job: JobResponse) {
  return (job as JobResponse & { proposalCount?: number }).proposalCount || 0
}
