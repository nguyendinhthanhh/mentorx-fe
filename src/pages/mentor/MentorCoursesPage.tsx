import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Edit3, Eye, GraduationCap, Plus, Search, Star } from 'lucide-react'
import { categoryApi } from '@/api/categoryApi'
import { courseApi } from '@/api/courseApi'
import { useAuthStore } from '@/store/authStore'
import { CategoryResponse, CourseResponse } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { LoadingRows, MetricCard, PageShell, SelectInput, StateCard, StatusPill, TextInput, Toolbar } from './shared/MentorHubUI'

const statusOptions = ['ALL', 'PUBLISHED', 'DRAFT', 'PENDING_REVIEW', 'REJECTED', 'ARCHIVED']

export default function MentorCoursesPage() {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('updated')

  useEffect(() => {
    void loadCourses()
  }, [user?.userId])

  const loadCourses = async () => {
    if (!user?.userId) return
    try {
      setLoading(true)
      setError('')
      const [coursePage, categoryList] = await Promise.all([
        courseApi.getByInstructor(user.userId, { page: 0, size: 100 }),
        categoryApi.getAllActive().catch(() => [] as CategoryResponse[]),
      ])
      setCourses(coursePage.content || [])
      setCategories(categoryList)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load mentor courses.')
    } finally {
      setLoading(false)
    }
  }

  const categoryNameById = useMemo(() => {
    return categories.reduce<Record<number, string>>((acc, category) => {
      acc[category.categoryId || category.id] = category.name
      return acc
    }, {})
  }, [categories])

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return courses
      .filter((course) => {
        const status = String(course.status)
        const categoryName = course.categoryId ? categoryNameById[course.categoryId] || '' : ''
        const haystack = [course.title, course.description, categoryName, ...(course.skills || [])].join(' ').toLowerCase()
        return (statusFilter === 'ALL' || status === statusFilter) && (!query || haystack.includes(query))
      })
      .sort((a, b) => {
        if (sortBy === 'enrolled') return (b.totalEnrollments || 0) - (a.totalEnrollments || 0)
        if (sortBy === 'rated') return Number(b.averageRating || 0) - Number(a.averageRating || 0)
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      })
  }, [categoryNameById, courses, searchQuery, sortBy, statusFilter])

  const summary = useMemo(() => {
    return {
      total: courses.length,
      published: courses.filter((course) => String(course.status) === 'PUBLISHED').length,
      drafts: courses.filter((course) => ['DRAFT', 'PENDING_REVIEW'].includes(String(course.status))).length,
      enrollments: courses.reduce((sum, course) => sum + (course.totalEnrollments || 0), 0),
    }
  }, [courses])

  return (
    <PageShell
      eyebrow="MentorHub"
      title="My Courses"
      description="Create, manage, and track your learning products without mixing course data with jobs or contracts."
      actions={
        <Link to="/courses/create" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          Create course
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total courses" value={summary.total} helper="Courses owned by your mentor account." icon={<BookOpen className="h-5 w-5" />} />
        <MetricCard label="Published" value={summary.published} helper="Visible to learners." icon={<Eye className="h-5 w-5" />} tone="emerald" />
        <MetricCard label="Drafts / review" value={summary.drafts} helper="Not public yet." icon={<Edit3 className="h-5 w-5" />} tone="amber" />
        <MetricCard label="Course revenue" value="Not tracked" helper="No mentor course revenue endpoint is available yet." icon={<GraduationCap className="h-5 w-5" />} tone="slate" />
      </div>

      <Toolbar>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <TextInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by course title, domain, or skill"
            className="w-full pl-11"
          />
        </div>
        <SelectInput value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full lg:w-48">
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status === 'ALL' ? 'All statuses' : formatStatusLabel(status)}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="w-full lg:w-48">
          <option value="updated">Recently updated</option>
          <option value="enrolled">Most enrolled</option>
          <option value="rated">Highest rated</option>
        </SelectInput>
      </Toolbar>

      {loading ? (
        <LoadingRows rows={5} />
      ) : error ? (
        <StateCard tone="error" title="Unable to load courses" message={error} action={<button onClick={loadCourses} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-black text-white">Retry</button>} />
      ) : filteredCourses.length === 0 ? (
        <StateCard
          title={courses.length === 0 ? 'No courses yet' : 'No courses match this filter'}
          message={courses.length === 0 ? 'Create your first course and start sharing your expertise.' : 'Adjust the search or status filter to find another course.'}
          action={<Link to="/courses/create" className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-black text-white">Create course</Link>}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredCourses.map((course) => (
            <article key={course.courseId} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex gap-4 p-5">
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-[22px] bg-slate-100">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-indigo-500">
                      <BookOpen className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill label={formatStatusLabel(String(course.status))} tone={courseStatusTone(String(course.status))} />
                    {course.categoryId ? <span className="text-xs font-bold text-slate-400">{categoryNameById[course.categoryId] || `Category ${course.categoryId}`}</span> : null}
                  </div>
                  <h2 className="mt-3 line-clamp-2 text-lg font-black leading-6 text-slate-950">{course.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-500">{course.description || 'No course description provided yet.'}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(course.skills || []).slice(0, 3).map((skill) => (
                      <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{skill}</span>
                    ))}
                    {(course.skills?.length || 0) > 3 ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">+{(course.skills?.length || 0) - 3}</span> : null}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 px-5 py-4 text-sm md:grid-cols-4">
                <MiniStat label="Price" value={formatCurrency(course.priceMxc || 0)} />
                <MiniStat label="Enrollments" value={String(course.totalEnrollments || 0)} />
                <MiniStat label="Rating" value={`${Number(course.averageRating || 0).toFixed(1)} / 5`} icon={<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />} />
                <MiniStat label="Updated" value={formatDate(course.updatedAt || course.createdAt)} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
                {course.rejectionReason ? <p className="text-xs font-semibold text-rose-600">{course.rejectionReason}</p> : <p className="text-xs font-semibold text-slate-400">Revenue is only shown when a real revenue endpoint exists.</p>}
                <div className="flex gap-2">
                  <Link to={`/courses/${course.courseId}`} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">View course</Link>
                  <button type="button" disabled className="cursor-not-allowed rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-400" title="Course edit page is not implemented yet.">
                    Edit
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  )
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 flex items-center gap-1 text-sm font-black text-slate-900">
        {icon}
        {value}
      </p>
    </div>
  )
}

function formatStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_REVIEW: 'Pending review',
    PUBLISHED: 'Published',
    REJECTED: 'Rejected',
    ARCHIVED: 'Archived',
  }
  return labels[status] || status.replace(/_/g, ' ').toLowerCase()
}

function courseStatusTone(status: string) {
  if (status === 'PUBLISHED') return 'emerald'
  if (status === 'DRAFT' || status === 'PENDING_REVIEW') return 'amber'
  if (status === 'REJECTED') return 'rose'
  return 'slate'
}
