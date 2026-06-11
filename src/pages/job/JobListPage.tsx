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
  ChevronDown,
  Filter,
  CheckCircle2,
  Code2,
  Lightbulb
} from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
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
    <div className="topcv-job-font min-h-screen bg-[#F5F6FA] pb-12 pt-8">
      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">{t('jobs.title')}</h1>
            <p className="mt-2 text-base font-medium text-[#6B7280]">
              Find the best freelance projects, part-time mentoring, and quick fixes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/my-jobs"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6EAF0] bg-[#FFFFFF] px-5 text-sm font-bold text-[#475569] shadow-sm transition hover:bg-[#F5F6FA] hover:text-[#111827]"
            >
              <Briefcase className="h-4 w-4 text-[#6B7280]" />
              <span className="hidden sm:inline">Yêu cầu của tôi</span>
              <span className="sm:hidden">Của tôi</span>
            </Link>
            <Link
              to="/jobs/create"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-5 text-sm font-bold tracking-wide text-[#FFFFFF] shadow-sm transition hover:bg-[#4338CA] hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>{t('jobs.post')}</span>
            </Link>
          </div>
        </div>

        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('jobs.searchPlaceholder')}
            className="h-14 w-full rounded-2xl border border-[#E6EAF0] bg-[#FFFFFF] pl-14 pr-12 text-base font-semibold text-[#111827] outline-none transition focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 shadow-sm placeholder:text-[#94A3B8] placeholder:font-medium"
          />
          {hasSearch && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[#94A3B8] transition hover:bg-[#F5F6FA] hover:text-[#475569]"
              aria-label={t('common.clear')}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#EEF1F5] pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={jobType}
                onChange={(e) => updateType(e.target.value)}
                className="h-11 appearance-none rounded-xl border border-[#E6EAF0] bg-[#FFFFFF] pl-4 pr-10 text-sm font-semibold text-[#475569] outline-none transition hover:bg-[#F5F6FA] focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 shadow-sm"
              >
                {JOB_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey as TranslationKey)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            </div>

            <div className="relative">
              <select
                value={skillFilter}
                onChange={(e) => {
                  setSkillFilter(e.target.value)
                  setPage(0)
                }}
                className="h-11 appearance-none rounded-xl border border-[#E6EAF0] bg-[#FFFFFF] pl-4 pr-10 text-sm font-semibold text-[#475569] outline-none transition hover:bg-[#F5F6FA] focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 shadow-sm"
              >
                <option value="">All Skills</option>
                {skills.slice(0, 80).map((skill) => (
                  <option key={skill.id} value={skill.labelEn}>
                    {skill.labelEn}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            </div>

            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E6EAF0] bg-[#FFFFFF] px-4 text-sm font-semibold text-[#475569] transition hover:bg-[#F5F6FA] hover:text-[#111827] shadow-sm">
              <Filter className="h-4 w-4 text-[#94A3B8]" />
              More filters
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-[#6B7280]">Sort by:</span>
            <div className="relative">
              <select className="appearance-none bg-transparent font-bold text-[#111827] outline-none pr-4 cursor-pointer">
                <option>Most relevant</option>
                <option>Newest</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#111827]" />
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[#6B7280]">Active filters:</span>
            {jobType !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6EAF0] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#475569] shadow-sm">
                {t(JOB_TYPE_OPTIONS.find((o) => o.value === jobType)?.labelKey as TranslationKey)}
                <X
                  className="h-3 w-3 cursor-pointer text-[#94A3B8] hover:text-[#111827]"
                  onClick={() => updateType('ALL')}
                />
              </span>
            )}
            {skillFilter && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6EAF0] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#475569] shadow-sm">
                {skillFilter}
                <X
                  className="h-3 w-3 cursor-pointer text-[#94A3B8] hover:text-[#111827]"
                  onClick={() => {
                    setSkillFilter('')
                    setPage(0)
                  }}
                />
              </span>
            )}
            <button
              onClick={() => {
                setSearch('')
                updateType('ALL')
                setSkillFilter('')
              }}
              className="ml-2 text-sm font-medium text-[#4F46E5] hover:text-[#4338CA]"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="mb-4 text-sm font-semibold text-[#475569]">
          {isLoading ? 'Loading...' : `${filteredJobs.length} jobs found`}
        </div>

        {isLoading ? (
          <JobListSkeleton />
        ) : filteredJobs.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredJobs.map((job) => (
              <JobCard key={job.jobId} job={job} />
            ))}
          </div>
        ) : (
          <EmptyState
            hasSearch={hasActiveFilters}
            onClear={() => {
              setSearch('')
              updateType('ALL')
              setSkillFilter('')
            }}
          />
        )}

        <div className="mt-8 pt-6">
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
    className: 'border-[#E6EAF0] bg-[#F5F6FA] text-[#475569]',
  }
  const clientName = getClientName(job)
  const budget = formatBudget(job, t)
  const deadline = job.deadlineAt ? formatDeadline(job.deadlineAt) : t('common.noDeadline')

  const initial = clientName.charAt(0).toUpperCase()

  return (
    <article className="group relative flex flex-col rounded-2xl border border-[#E6EAF0] bg-[#FFFFFF] p-6 transition-all hover:-translate-y-1 hover:border-[#4F46E5]/40 hover:shadow-xl hover:shadow-[#4F46E5]/5">
      <div className="flex items-start gap-5">
        {/* Company Logo */}
        <div className="flex h-[64px] w-[64px] sm:h-[72px] sm:w-[72px] shrink-0 items-center justify-center rounded-xl border border-[#EEF1F5] bg-[#F5F6FA] text-2xl font-black text-[#94A3B8] shadow-sm">
          {initial}
        </div>

        {/* Job Title & Salary */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <Link to={`/jobs/${job.jobId}`} className="text-[20px] sm:text-[22px] font-extrabold leading-tight text-[#111827] transition-colors group-hover:text-[#4F46E5] line-clamp-2 pr-4">
              {job.title}
            </Link>
            <div className="shrink-0 sm:text-right mt-1 sm:mt-0">
              <span className="inline-flex items-center text-lg font-black tracking-tight text-[#4F46E5] bg-[#4F46E5]/[0.08] border border-[#4F46E5]/10 px-3.5 py-1.5 rounded-lg shadow-sm">{budget}</span>
            </div>
          </div>
          
          <div className="mt-2.5 flex items-center gap-2 text-sm">
            <span className="font-semibold text-[#6B7280] truncate">{clientName}</span>
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" />
            {job.isFeatured && (
              <span className="ml-1 inline-flex shrink-0 items-center rounded-md bg-[#DC2626]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#DC2626]">
                HOT
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Meta info */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium text-[#6B7280]">
        <div className="flex items-center gap-1.5">
          <Timer className="h-4 w-4 text-[#94A3B8]" />
          <span>Hạn nộp: <strong className="text-[#475569]">{deadline}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-[#94A3B8]" />
          <span><strong className="text-[#475569]">{getProposalCount(job)}</strong> ứng tuyển</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock3 className="h-4 w-4 text-[#94A3B8]" />
          <span>Đăng {formatRelativeTime(job.createdAt)}</span>
        </div>
      </div>

      {/* Footer: Skills and Action */}
      <div className="mt-6 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-t border-[#EEF1F5]">
        <div className="flex-1 min-w-0">
           {job.requiredSkills && job.requiredSkills.length > 0 ? (
             <div className="flex flex-wrap gap-2">
               {job.requiredSkills.slice(0, 4).map((skill) => (
                 <span key={skill} className="rounded-md border border-[#E6EAF0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-bold text-[#475569] shadow-sm">
                   {skill}
                 </span>
               ))}
               {job.requiredSkills.length > 4 && (
                 <span className="rounded-md border border-[#E6EAF0] bg-[#FFFFFF] px-2.5 py-1.5 text-xs font-bold text-[#94A3B8]">
                   +{job.requiredSkills.length - 4}
                 </span>
               )}
             </div>
           ) : (
             <span className="text-xs text-[#94A3B8] italic">Không yêu cầu kỹ năng cụ thể</span>
           )}
        </div>
        <div className="shrink-0 w-full sm:w-auto">
          <Link
            to={`/jobs/${job.jobId}`}
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-[#4F46E5] px-7 py-3 text-sm font-extrabold tracking-wide text-[#FFFFFF] transition hover:bg-[#4338CA] shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            Ứng tuyển ngay
          </Link>
        </div>
      </div>
    </article>
  )
}

function JobListSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-[#E6EAF0] bg-[#FFFFFF] p-5 shadow-sm">
          <div className="flex gap-4">
            <div className="h-[72px] w-[72px] shrink-0 animate-pulse rounded-xl bg-[#F5F6FA]" />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between">
                 <div className="h-5 w-1/2 animate-pulse rounded bg-[#F5F6FA]" />
                 <div className="h-5 w-1/4 animate-pulse rounded bg-[#F5F6FA]" />
              </div>
              <div className="h-4 w-1/3 animate-pulse rounded bg-[#EEF1F5]" />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
             <div className="h-8 w-24 animate-pulse rounded-lg bg-[#F5F6FA]" />
             <div className="h-8 w-24 animate-pulse rounded-lg bg-[#F5F6FA]" />
          </div>
          <div className="mt-5 flex justify-between items-end border-t border-[#EEF1F5] pt-4">
             <div className="flex gap-2">
                <div className="h-6 w-16 animate-pulse rounded border border-[#E6EAF0]" />
                <div className="h-6 w-16 animate-pulse rounded border border-[#E6EAF0]" />
             </div>
             <div className="h-10 w-32 animate-pulse rounded-xl bg-[#F5F6FA]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ hasSearch, onClear }: { hasSearch: boolean; onClear: () => void }) {
  const { t } = useI18n()

  return (
    <div className="rounded-2xl border border-dashed border-[#E6EAF0] bg-[#FFFFFF] px-6 py-16 text-center">
      <Briefcase className="mx-auto h-14 w-14 text-[#94A3B8]" />
      <h3 className="mt-4 text-xl font-bold text-[#111827]">{t('jobs.noJobsFound')}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B7280]">
        {hasSearch ? t('jobs.emptyWithFilters') : t('jobs.emptyNoJobs')}
      </p>
      {hasSearch ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#FFFFFF] border border-[#E6EAF0] px-5 text-sm font-semibold text-[#111827] transition hover:bg-[#F5F6FA] hover:border-[#E6EAF0] shadow-sm"
        >
          {t('jobs.clearFilters')}
        </button>
      ) : (
        <Link
          to="/jobs/create"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-5 text-sm font-semibold text-[#FFFFFF] transition hover:bg-[#4338CA] shadow-sm"
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
  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E6EAF0] bg-[#FFFFFF] text-[#475569] transition hover:bg-[#F5F6FA] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-[#4F46E5] px-3 text-sm font-semibold text-[#FFFFFF] shadow-sm">
          {page + 1}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E6EAF0] bg-[#FFFFFF] text-[#475569] transition hover:bg-[#F5F6FA] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function formatBudget(job: JobResponse, t: ReturnType<typeof useI18n>['t']) {
  if (job.budgetMinMxc && job.budgetMaxMxc) {
    if (job.budgetMinMxc === job.budgetMaxMxc) return formatCurrency(job.budgetMinMxc)
    return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
  }
  if (job.budgetMinMxc) return formatCurrency(job.budgetMinMxc)
  if (job.budgetMaxMxc) return formatCurrency(job.budgetMaxMxc)
  if (job.hourlyRateMxc) return `${formatCurrency(job.hourlyRateMxc)}/hr`
  return t('jobs.budgetTbd')
}

function formatDeadline(deadline: string) {
  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) return 'No deadline'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getClientName(job: JobResponse) {
  return job.clientName || job.client?.displayName || job.client?.fullName || 'Company'
}

function getProposalCount(job: JobResponse) {
  return job.proposalCount || 0
}

