import { useState, useMemo } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { jobApi } from '@/api/jobApi'
import { mentorApi } from '@/api/mentorApi'
import { categoryApi } from '@/api/categoryApi'
import { useAuthStore } from '@/store/authStore'
import {
  Briefcase,
  DollarSign,
  Clock,
  MapPin,
  Calendar,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Star,
  Zap,
  Target,
  Award,
  Eye,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react'
import { JobType, BudgetType, JobStatus } from '@/types'
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/formatters'

const JOB_TYPE_LABELS: Record<JobType, string> = {
  [JobType.FREELANCE_PROJECT]: 'Dự án Freelance',
  [JobType.LONG_TERM_MENTORING]: 'Mentoring dài hạn',
  [JobType.QUICK_FIX]: 'Giải quyết nhanh',
}

const JOB_TYPE_COLORS: Record<JobType, string> = {
  [JobType.FREELANCE_PROJECT]: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  [JobType.LONG_TERM_MENTORING]: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  [JobType.QUICK_FIX]: 'border-amber-200 bg-amber-50 text-amber-700',
}

export default function MentorJobsPage() {
  const { user } = useAuthStore()
  const [page, setPage] = useState(0)
  const [size] = useState(12)
  const [selectedJobType, setSelectedJobType] = useState<JobType | undefined>()
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')

  // Get mentor profile to know their expertise/category
  const { data: mentorProfile } = useQuery(
    ['mentor-profile', user?.userId],
    () => mentorApi.getMentorProfile(user!.userId),
    { enabled: !!user }
  )

  // Get categories
  const { data: categories } = useQuery('categories', () => categoryApi.getAllActive())

  // Get jobs with filters
  const { data: jobsData, isLoading } = useQuery(
    ['mentor-jobs', page, size, selectedJobType, selectedCategory],
    () =>
      jobApi.getOpenJobs({
        page,
        size,
        jobType: selectedJobType,
        categoryId: selectedCategory,
      }),
    { keepPreviousData: true }
  )

  // Filter jobs by search query
  const filteredJobs = useMemo(() => {
    if (!jobsData?.content) return []
    if (!searchQuery) return jobsData.content

    const query = searchQuery.toLowerCase()
    return jobsData.content.filter(
      (job) =>
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.clientName?.toLowerCase().includes(query)
    )
  }, [jobsData, searchQuery])

  // Get recommended jobs (matching mentor's category)
  const recommendedJobs = useMemo(() => {
    if (!mentorProfile?.user?.categoryId || !jobsData?.content) return []
    return jobsData.content.filter((job) => job.categoryId === mentorProfile.user.categoryId)
  }, [mentorProfile, jobsData])

  const totalPages = jobsData?.totalPages || 0
  const totalJobs = jobsData?.totalElements || 0

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Công việc dành cho bạn</h1>
            <p className="mt-1 text-sm text-slate-600">
              Tìm kiếm và apply vào các dự án phù hợp với chuyên môn của bạn
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-xs font-bold text-indigo-600">Tổng số job</p>
                  <p className="text-lg font-black text-indigo-900">{totalJobs}</p>
                </div>
              </div>
            </div>
            {recommendedJobs.length > 0 && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-emerald-600">Phù hợp</p>
                    <p className="text-lg font-black text-emerald-900">{recommendedJobs.length}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mentor Info Banner */}
        {mentorProfile && (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-black text-white shadow-lg">
                {user.fullName?.charAt(0) || 'M'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">{user.fullName}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                    <Award className="h-3 w-3" />
                    Mentor
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Briefcase className="h-4 w-4" />
                    <span className="font-medium">{mentorProfile.expertise || 'Chưa cập nhật'}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">
                      {mentorProfile.hourlyRateMxc ? `${formatCurrency(mentorProfile.hourlyRateMxc)}/giờ` : 'Chưa cập nhật'}
                    </span>
                  </span>
                  {mentorProfile.averageRating && (
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{mentorProfile.averageRating}/5.0</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, mô tả, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-medium placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <select
            value={selectedJobType || ''}
            onChange={(e) => setSelectedJobType(e.target.value as JobType || undefined)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          >
            <option value="">Tất cả loại job</option>
            {Object.entries(JOB_TYPE_LABELS).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          >
            <option value="">Tất cả lĩnh vực</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Recommended Jobs Section */}
        {recommendedJobs.length > 0 && !searchQuery && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-black text-slate-900">Đề xuất cho bạn</h2>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                {recommendedJobs.length}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedJobs.slice(0, 3).map((job) => (
                <JobCard key={job.jobId} job={job} isRecommended />
              ))}
            </div>
          </div>
        )}

        {/* All Jobs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">
              {searchQuery ? 'Kết quả tìm kiếm' : 'Tất cả công việc'}
            </h2>
            <p className="text-sm text-slate-600">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => (
                <JobCard key={job.jobId} job={job} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Briefcase className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-900">Không tìm thấy job</h3>
              <p className="mt-1 text-sm text-slate-600">
                {searchQuery
                  ? 'Thử tìm kiếm với từ khóa khác'
                  : 'Chưa có job nào phù hợp với bộ lọc của bạn'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-600">
              Trang {page + 1} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function JobCard({ job, isRecommended = false }: { job: any; isRecommended?: boolean }) {
  const budgetDisplay = useMemo(() => {
    if (job.budgetType === BudgetType.HOURLY && job.hourlyRateMxc) {
      return `${formatCurrency(job.hourlyRateMxc)}/giờ`
    }
    if (job.budgetType === BudgetType.FIXED) {
      if (job.budgetMinMxc && job.budgetMaxMxc) {
        return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
      }
      if (job.budgetMinMxc) return `Từ ${formatCurrency(job.budgetMinMxc)}`
      if (job.budgetMaxMxc) return `Tối đa ${formatCurrency(job.budgetMaxMxc)}`
    }
    return 'Thỏa thuận'
  }, [job])

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-100/50">
      {isRecommended && (
        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
            <Sparkles className="h-3 w-3" />
            Đề xuất
          </span>
        </div>
      )}

      <div className="space-y-4">
        {/* Job Type Badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${JOB_TYPE_COLORS[job.jobType]}`}>
            {JOB_TYPE_LABELS[job.jobType]}
          </span>
          {job.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
              <Star className="h-3 w-3 fill-amber-400" />
              Featured
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-900 group-hover:text-indigo-600">
          {job.title}
        </h3>

        {/* Description */}
        <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{job.description}</p>

        {/* Meta Info */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-slate-400" />
            <span className="font-bold text-slate-900">{budgetDisplay}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">Đăng {formatRelativeTime(job.createdAt)}</span>
          </div>
          {job.clientName && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">{job.clientName}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-slate-100 pt-4">
          <Link
            to={`/jobs/${job.jobId}`}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            Xem chi tiết
          </Link>
          <Link
            to={`/jobs/${job.jobId}`}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700"
          >
            <Send className="h-4 w-4" />
            Apply
          </Link>
        </div>
      </div>
    </div>
  )
}
