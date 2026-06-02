import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import {
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coins,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { jobApi } from '@/api/jobApi'
import { useAuthStore } from '@/store/authStore'
import { JobResponse, JobStatus, JobType } from '@/types'
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/formatters'

const PAGE_SIZE = 12

const statusChipOptions = [
  { value: 'ALL', label: 'Tất cả' },
  { value: JobStatus.OPEN, label: 'Đang mở' },
  { value: JobStatus.IN_PROGRESS, label: 'Đang thực hiện' },
  { value: JobStatus.COMPLETED, label: 'Hoàn thành' },
  { value: JobStatus.CLOSED, label: 'Đã đóng' },
]

const statusSelectOptions = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: JobStatus.OPEN, label: 'Đang mở' },
  { value: JobStatus.IN_PROGRESS, label: 'Đang thực hiện' },
  { value: JobStatus.COMPLETED, label: 'Hoàn thành' },
  { value: JobStatus.CLOSED, label: 'Đã đóng' },
  { value: JobStatus.DRAFT, label: 'Bản nháp' },
  { value: JobStatus.EXPIRED, label: 'Hết hạn' },
]

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'applications', label: 'Nhiều ứng tuyển nhất' },
  { value: 'budget', label: 'Ngân sách cao nhất' },
]

const sortMap: Record<string, string> = {
  newest: 'updatedAt,desc',
  oldest: 'createdAt,asc',
  applications: 'updatedAt,desc',
  budget: 'updatedAt,desc',
}

const jobTypeLabelMap: Record<JobType, string> = {
  [JobType.FREELANCE_PROJECT]: 'Dự án freelance',
  [JobType.LONG_TERM_MENTORING]: 'Mentoring dài hạn',
  [JobType.QUICK_FIX]: 'Hỗ trợ nhanh',
}

export default function MyJobsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sortValue, setSortValue] = useState('newest')
  const [openMenuJobId, setOpenMenuJobId] = useState<string | null>(null)

  const { data, isLoading } = useQuery(
    ['user-requests', user?.userId],
    () =>
      jobApi.getByClient(user!.userId, {
        page: 0,
        size: 1000,
        sort: sortMap.newest,
      }),
    {
      enabled: Boolean(user?.userId),
      keepPreviousData: true,
    }
  )

  const allJobs = data?.content || []
  const hasFilters = searchValue.trim().length > 0 || statusFilter !== 'ALL' || sortValue !== 'newest'

  const publishMutation = useMutation((jobId: string) => jobApi.update(jobId, { status: JobStatus.OPEN }), {
    onSuccess: async () => {
      toast.success('Yêu cầu đã được đăng và sẵn sàng nhận ứng tuyển.')
      await Promise.all([
        queryClient.invalidateQueries(['user-requests', user?.userId]),
        queryClient.invalidateQueries(['my-posted-jobs', user?.userId]),
      ])
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể đăng yêu cầu này lúc này.')
    },
  })

  const closeMutation = useMutation((jobId: string) => jobApi.updateStatus(jobId, JobStatus.CLOSED), {
    onSuccess: async () => {
      toast.success('Yêu cầu đã được đóng.')
      await Promise.all([
        queryClient.invalidateQueries(['user-requests', user?.userId]),
        queryClient.invalidateQueries(['my-posted-jobs', user?.userId]),
      ])
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể đóng yêu cầu này.')
    },
  })

  const filteredJobs = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase()
    const list = allJobs.filter((job) => {
      const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter
      const haystack = [job.title, job.description, ...(job.requiredSkills || [])].join(' ').toLowerCase()
      return matchesStatus && (!keyword || haystack.includes(keyword))
    })

    return [...list].sort((left, right) => {
      if (sortValue === 'applications') {
        return (right.proposalCount || 0) - (left.proposalCount || 0)
      }

      if (sortValue === 'budget') {
        return getBudgetAnchor(right) - getBudgetAnchor(left)
      }

      const leftTime = new Date(left.updatedAt || left.createdAt).getTime()
      const rightTime = new Date(right.updatedAt || right.createdAt).getTime()
      return sortValue === 'oldest' ? leftTime - rightTime : rightTime - leftTime
    })
  }, [allJobs, searchValue, sortValue, statusFilter])

  const totalPages = Math.max(Math.ceil(filteredJobs.length / PAGE_SIZE), 1)
  const paginatedJobs = filteredJobs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => {
    setPage(0)
  }, [searchValue, statusFilter, sortValue])

  const summary = useMemo(() => {
    return allJobs.reduce(
      (accumulator, job) => {
        accumulator.total += 1
        if (job.status === JobStatus.OPEN) accumulator.open += 1
        if (job.status === JobStatus.IN_PROGRESS) accumulator.inProgress += 1
        if (job.status === JobStatus.COMPLETED) accumulator.completed += 1
        return accumulator
      },
      { total: 0, open: 0, inProgress: 0, completed: 0 }
    )
  }, [allJobs])

  const clearFilters = () => {
    setSearchValue('')
    setStatusFilter('ALL')
    setSortValue('newest')
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-center gap-4">
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 sm:flex">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
              Yêu cầu đã đăng
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><strong className="text-slate-900">{summary.total}</strong> tổng cộng</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
              <span className="flex items-center gap-1.5"><strong className="text-emerald-600">{summary.open}</strong> đang mở</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
              <span className="flex items-center gap-1.5"><strong className="text-amber-600">{summary.inProgress}</strong> đang thực hiện</span>
            </div>
          </div>
        </div>

        <Link
          to="/jobs/create"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#6C4DFF] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(108,77,255,0.18)] transition hover:-translate-y-0.5 hover:bg-[#5b3ef0]"
        >
          <Plus className="h-4 w-4" />
          Tạo yêu cầu mới
        </Link>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_220px_220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Tìm kiếm theo tiêu đề, kỹ năng…"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => setSearchValue('')}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>

            <ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={statusSelectOptions} />
            <ToolbarSelect value={sortValue} onChange={setSortValue} options={sortOptions} />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusChipOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    statusFilter === option.value
                      ? 'bg-[#6C4DFF] text-white shadow-[0_12px_24px_rgba(108,77,255,0.2)]'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>
                Hiển thị <span className="font-bold text-slate-700">{filteredJobs.length}</span> yêu cầu · Trang{' '}
                <span className="font-bold text-slate-700">{page + 1}</span> / {Math.max(totalPages, 1)}
              </span>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="font-bold text-indigo-600 transition hover:text-indigo-700"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {isLoading ? (
        <RequestGridSkeleton />
      ) : filteredJobs.length > 0 ? (
        <>
          <section className="flex flex-col gap-4">
            {paginatedJobs.map((job) => (
              <RequestCard
                key={job.jobId}
                job={job}
                menuOpen={openMenuJobId === job.jobId}
                onToggleMenu={() => setOpenMenuJobId((current) => (current === job.jobId ? null : job.jobId))}
                onCloseMenu={() => setOpenMenuJobId(null)}
                onPublish={() => publishMutation.mutate(job.jobId)}
                onCloseRequest={() => closeMutation.mutate(job.jobId)}
                isPublishing={publishMutation.isLoading && publishMutation.variables === job.jobId}
                isClosing={closeMutation.isLoading && closeMutation.variables === job.jobId}
              />
            ))}
          </section>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
      )}
    </div>
  )
}

function RequestCard({
  job,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onPublish,
  onCloseRequest,
  isPublishing,
  isClosing,
}: {
  job: JobResponse
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onPublish: () => void
  onCloseRequest: () => void
  isPublishing: boolean
  isClosing: boolean
}) {
  const skillTags = job.requiredSkills?.slice(0, 3) || []
  const additionalSkills = Math.max((job.requiredSkills?.length || 0) - skillTags.length, 0)
  const isDraft = job.status === JobStatus.DRAFT
  const canClose = job.status === JobStatus.OPEN

  return (
    <article className="relative overflow-hidden rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md lg:flex lg:gap-6 lg:p-6">
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#6C4DFF] via-[#8B5CF6] to-[#C084FC]" />
      
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <RequestStatusBadge status={job.status} />
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                  {jobTypeLabelMap[job.jobType] || job.jobType}
                </span>
                <span className="text-[12px] text-slate-400">• Cập nhật {formatRelativeTime(job.updatedAt || job.createdAt)}</span>
              </div>
              <h2 className="mt-2 truncate text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                {job.title}
              </h2>
            </div>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={onToggleMenu}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
              aria-label="Tùy chọn yêu cầu"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <button type="button" className="fixed inset-0 z-10 cursor-default" onClick={onCloseMenu} aria-hidden="true" />
                <div className="absolute right-0 top-12 z-20 min-w-[180px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <Link
                    to={`/my-jobs/${job.jobId}`}
                    className="flex rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600"
                  >
                    Xem chi tiết
                  </Link>
                  <Link
                    to={isDraft ? `/jobs/${job.jobId}/edit` : `/my-jobs/${job.jobId}`}
                    className="flex rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600"
                  >
                    {isDraft ? 'Tiếp tục chỉnh sửa' : 'Quản lý yêu cầu'}
                  </Link>
                  {isDraft && (
                    <button
                      type="button"
                      onClick={onPublish}
                      disabled={isPublishing}
                      className="flex w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50"
                    >
                      Đăng yêu cầu
                    </button>
                  )}
                  {canClose && (
                    <button
                      type="button"
                      onClick={onCloseRequest}
                      disabled={isClosing}
                      className="flex w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      Đóng yêu cầu
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
          {job.description}
        </p>

        {skillTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {skillTags.map((skill) => (
              <span key={skill} className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                {skill}
              </span>
            ))}
            {additionalSkills > 0 && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
                +{additionalSkills}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="my-5 h-px w-full bg-slate-100 lg:my-0 lg:h-auto lg:w-px" />

      <div className="flex shrink-0 flex-col justify-between gap-4 lg:w-[240px]">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Coins className="h-4 w-4" /> Ngân sách:
            </span>
            <span className="font-bold text-slate-900">{formatBudget(job)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Users className="h-4 w-4" /> Ứng tuyển:
            </span>
            <span className="font-bold text-slate-900">{job.proposalCount || 0}</span>
          </div>
          {job.deadlineAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-slate-500">
                <CalendarDays className="h-4 w-4" /> Hạn chót:
              </span>
              <span className="font-medium text-slate-700">{formatDate(job.deadlineAt)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isDraft && (
            <button
              type="button"
              onClick={onPublish}
              disabled={isPublishing}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Đăng
            </button>
          )}
          <Link
            to={`/my-jobs/${job.jobId}`}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#6C4DFF] px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#5b3ef0]"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  )
}

function ToolbarSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}




function RequestStatusBadge({ status }: { status: JobStatus }) {
  const meta =
    status === JobStatus.OPEN
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === JobStatus.IN_PROGRESS
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : status === JobStatus.COMPLETED
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : status === JobStatus.CLOSED
            ? 'border-rose-200 bg-rose-50 text-rose-700'
            : status === JobStatus.DRAFT
              ? 'border-slate-200 bg-slate-100 text-slate-700'
              : 'border-slate-200 bg-slate-50 text-slate-600'

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta}`}>
      {formatStatus(status)}
    </span>
  )
}

function RequestGridSkeleton() {
  return (
    <section className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm lg:flex lg:gap-6 lg:p-6">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-1 gap-4">
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-100" />
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-5 w-20 rounded-full bg-slate-100" />
                    <div className="h-5 w-24 rounded-full bg-slate-100" />
                  </div>
                  <div className="h-6 w-3/4 rounded-xl bg-slate-100" />
                </div>
              </div>
              <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-4/5 rounded bg-slate-100" />
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-6 w-16 rounded-full bg-slate-100" />
              <div className="h-6 w-20 rounded-full bg-slate-100" />
            </div>
          </div>
          
          <div className="my-5 h-px w-full bg-slate-100 lg:my-0 lg:h-auto lg:w-px" />
          
          <div className="flex shrink-0 flex-col justify-between gap-4 lg:w-[240px]">
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
            </div>
            <div className="h-10 w-full rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </section>
  )
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <section className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
        <Briefcase className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">Chưa có yêu cầu phù hợp</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600">
        {hasFilters
          ? 'Hãy thử thay đổi bộ lọc hoặc từ khóa để tìm lại yêu cầu bạn cần quản lý.'
          : 'Bạn chưa có yêu cầu nào trong danh sách này. Tạo một yêu cầu mới để bắt đầu nhận ứng tuyển từ mentor.'}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#6C4DFF] px-5 text-sm font-bold text-white transition hover:bg-[#5b3ef0]"
          >
            Xóa bộ lọc
          </button>
        ) : (
          <Link
            to="/jobs/create"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#6C4DFF] px-5 text-sm font-bold text-white transition hover:bg-[#5b3ef0]"
          >
            <Plus className="h-4 w-4" />
            Tạo yêu cầu mới
          </Link>
        )}
      </div>
    </section>
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
    <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-sm text-slate-500">
        Trang <span className="font-bold text-slate-700">{page + 1}</span> / {Math.max(totalPages, 1)}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function formatBudget(job: JobResponse) {
  if (job.budgetMinMxc && job.budgetMaxMxc) {
    return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
  }

  if (job.hourlyRateMxc) {
    return `${formatCurrency(job.hourlyRateMxc)}/giờ`
  }

  return 'Thỏa thuận thêm'
}

function formatStatus(status: JobStatus) {
  const labels: Record<JobStatus, string> = {
    [JobStatus.DRAFT]: 'Bản nháp',
    [JobStatus.PENDING_APPROVAL]: 'Chờ duyệt',
    [JobStatus.OPEN]: 'Đang mở',
    [JobStatus.IN_PROGRESS]: 'Đang thực hiện',
    [JobStatus.COMPLETED]: 'Hoàn thành',
    [JobStatus.CANCELLED]: 'Đã hủy',
    [JobStatus.CLOSED]: 'Đã đóng',
    [JobStatus.ON_HOLD]: 'Tạm dừng',
    [JobStatus.EXPIRED]: 'Hết hạn',
  }

  return labels[status] || status
}

function getBudgetAnchor(job: JobResponse) {
  return job.budgetMaxMxc || job.budgetMinMxc || job.hourlyRateMxc || 0
}
