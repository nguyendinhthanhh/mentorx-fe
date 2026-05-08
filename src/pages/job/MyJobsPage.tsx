import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react'
import { jobApi } from '@/api/jobApi'
import { useAuthStore } from '@/store/authStore'
import { JobResponse, JobStatus, JobType } from '@/types'
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/formatters'
import ProposalList from '@/components/job/ProposalList'

const PAGE_SIZE = 8

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: JobStatus.OPEN, label: 'Open' },
  { value: JobStatus.IN_PROGRESS, label: 'In progress' },
  { value: JobStatus.COMPLETED, label: 'Completed' },
  { value: JobStatus.CLOSED, label: 'Closed' },
]

const JOB_TYPE_LABELS: Record<JobType, string> = {
  [JobType.FREELANCE_PROJECT]: 'Freelance',
  [JobType.LONG_TERM_MENTORING]: 'Mentoring',
  [JobType.QUICK_FIX]: 'Quick fix',
}

export default function MyJobsPage() {
  const { user } = useAuthStore()
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<string>('ALL')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  const { data, isLoading } = useQuery(
    ['my-posted-jobs', user?.userId, page],
    () => jobApi.getByClient(user!.userId, { page, size: PAGE_SIZE }),
    { enabled: Boolean(user?.userId), keepPreviousData: true }
  )

  const jobs = data?.content || []
  const filteredJobs = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return jobs.filter((job) => {
      const matchesStatus = status === 'ALL' || job.status === status
      const matchesKeyword =
        !keyword ||
        job.title.toLowerCase().includes(keyword) ||
        job.description.toLowerCase().includes(keyword) ||
        job.jobType.toLowerCase().replace(/_/g, ' ').includes(keyword)

      return matchesStatus && matchesKeyword
    })
  }, [jobs, query, status])

  useEffect(() => {
    if (filteredJobs.length === 0) {
      setSelectedJobId(null)
      return
    }
    if (!selectedJobId || !filteredJobs.some((job) => job.jobId === selectedJobId)) {
      setSelectedJobId(filteredJobs[0].jobId)
    }
  }, [filteredJobs, selectedJobId])

  const selectedJob = filteredJobs.find((job) => job.jobId === selectedJobId) || null
  const totalJobs = data?.totalElements || 0
  const totalPages = data?.totalPages || 1
  const hasFilters = query.trim().length > 0 || status !== 'ALL'

  const statusCounts = useMemo(() => {
    return jobs.reduce(
      (counts, job) => {
        counts[job.status] = (counts[job.status] || 0) + 1
        return counts
      },
      {} as Record<string, number>
    )
  }, [jobs])

  const clearFilters = () => {
    setQuery('')
    setStatus('ALL')
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-950 dark:text-white">My Posted Jobs</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Manage the jobs you posted, review mentors who applied, and choose the best mentor for each request.
            </p>
          </div>
          <Link
            to="/jobs/create"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Post new job
          </Link>
        </div>

        <div className="mt-6 grid gap-3 min-[520px]:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Briefcase} label="Posted jobs" value={`${totalJobs}`} />
          <MetricCard icon={Users} label="Open jobs" value={`${statusCounts[JobStatus.OPEN] || 0}`} />
          <MetricCard icon={Clock3} label="In progress" value={`${statusCounts[JobStatus.IN_PROGRESS] || 0}`} />
          <MetricCard icon={FileText} label="Completed" value={`${statusCounts[JobStatus.COMPLETED] || 0}`} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your posted jobs..."
              className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-12 text-sm font-bold text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-indigo-950"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="inline-flex w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900 xl:w-auto">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatus(filter.value)}
                className={`h-10 whitespace-nowrap rounded-lg px-3 text-xs font-black transition sm:text-sm ${
                  status === filter.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-950 dark:hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,430px)_1fr]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase text-slate-500 dark:text-slate-400">Posted jobs</h2>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400">
              <SlidersHorizontal className="h-4 w-4" />
              {filteredJobs.length} shown
            </span>
          </div>

          {isLoading ? (
            <JobListSkeleton />
          ) : filteredJobs.length > 0 ? (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <PostedJobCard
                  key={job.jobId}
                  job={job}
                  selected={job.jobId === selectedJobId}
                  onSelect={() => setSelectedJobId(job.jobId)}
                />
              ))}
            </div>
          ) : (
            <EmptyJobs hasFilters={hasFilters} onClear={clearFilters} />
          )}

          {filteredJobs.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          {selectedJob ? (
            <>
              <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 min-[760px]:flex-row min-[760px]:items-start min-[760px]:justify-between dark:border-slate-800">
                <div className="min-w-0">
                  <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">Applicants for</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{selectedJob.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
                    <span>{getProposalCount(selectedJob)} proposal(s)</span>
                    <span>{formatBudget(selectedJob)}</span>
                    <span>{selectedJob.deadlineAt ? formatDate(selectedJob.deadlineAt) : 'Flexible deadline'}</span>
                  </div>
                </div>
                <Link
                  to={`/jobs/${selectedJob.jobId}`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Open detail
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <ProposalList jobId={selectedJob.jobId} />
            </>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <Users className="h-14 w-14 text-slate-300 dark:text-slate-600" />
              <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">Select a job to review mentors</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                Choose one of your posted jobs on the left to see mentor applications and pick the right mentor.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function PostedJobCard({ job, selected, onSelect }: { job: JobResponse; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
        selected
          ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100 dark:border-indigo-700 dark:bg-indigo-950/30 dark:ring-indigo-950'
          : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {JOB_TYPE_LABELS[job.jobType]}
            </span>
            <StatusBadge status={job.status} />
          </div>
          <h3 className="line-clamp-2 text-lg font-black text-slate-950 dark:text-white">{job.title}</h3>
        </div>
        <ArrowRight className={`mt-1 h-5 w-5 shrink-0 ${selected ? 'text-indigo-600' : 'text-slate-300'}`} />
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{job.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniFact icon={FileText} label="Proposals" value={`${getProposalCount(job)}`} />
        <MiniFact icon={CalendarDays} label="Deadline" value={job.deadlineAt ? formatDate(job.deadlineAt) : 'Flexible'} />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
        <span>Posted {formatRelativeTime(job.createdAt)}</span>
        <span>{formatBudget(job)}</span>
      </div>
    </button>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
      <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      <p className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

function MiniFact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: JobStatus }) {
  const className =
    status === JobStatus.OPEN
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
      : status === JobStatus.IN_PROGRESS
        ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300'
        : status === JobStatus.COMPLETED
          ? 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
          : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${className}`}>{status.replace(/_/g, ' ')}</span>
}

function JobListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" />
      ))}
    </div>
  )
}

function EmptyJobs({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-950">
      <Briefcase className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
      <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">No jobs found</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
        {hasFilters ? 'Try clearing filters or searching with a broader keyword.' : 'Post a job to start receiving mentor applications.'}
      </p>
      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-black text-white hover:bg-indigo-700"
        >
          Clear filters
        </button>
      ) : (
        <Link
          to="/jobs/create"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Post job
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
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
        Page {page + 1} of {Math.max(totalPages, 1)}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function formatBudget(job: JobResponse) {
  if (job.budgetMinMxc && job.budgetMaxMxc) return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
  if (job.hourlyRateMxc) return `${formatCurrency(job.hourlyRateMxc)}/hr`
  return 'Budget TBD'
}

function getProposalCount(job: JobResponse) {
  return (job as JobResponse & { proposalCount?: number }).proposalCount || 0
}
