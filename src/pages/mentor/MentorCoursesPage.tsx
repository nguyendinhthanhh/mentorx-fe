import { MouseEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from 'react-query'
import { Archive, BookOpen, FileText, Search, Settings, Star, Trash2 } from 'lucide-react'
import { categoryApi } from '@/api/categoryApi'
import { courseApi } from '@/api/courseApi'
import CourseNameConfirmModal from '@/components/course/CourseNameConfirmModal'
import { useAuthStore } from '@/store/authStore'
import { CategoryResponse, CourseProductType, CourseResponse, CourseStatus } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { LoadingRows, PageShell, SelectInput, StateCard, StatusPill, TextInput, Toolbar } from './shared/MentorHubUI'
import { useCourseStats } from '@/hooks/useAnalytics'

type CourseAction = 'delete' | 'archive'

type ConfirmAction = {
  type: CourseAction
  courseId: string
  courseTitle: string
} | null

const statusOptions = ['ALL', CourseStatus.PUBLISHED, CourseStatus.ARCHIVED] as const
const typeOptions = ['ALL', CourseProductType.COURSE, CourseProductType.DOCUMENT] as const

export default function MentorCoursesPage() {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>('ALL')
  const [typeFilter, setTypeFilter] = useState<(typeof typeOptions)[number]>('ALL')
  const [sortBy, setSortBy] = useState('updated')
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

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

  const deleteMutation = useMutation((courseId: string) => courseApi.delete(courseId), {
    onSuccess: () => loadCourses(),
  })

  const archiveMutation = useMutation((courseId: string) => courseApi.archive(courseId), {
    onSuccess: () => loadCourses(),
  })

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
        const categoryName = course.categoryId ? categoryNameById[course.categoryId] || '' : ''
        const haystack = [course.title, course.description, categoryName, ...(course.skills || [])].join(' ').toLowerCase()
        return (statusFilter === 'ALL' || course.status === statusFilter)
          && (typeFilter === 'ALL' || course.productType === typeFilter)
          && (!query || haystack.includes(query))
      })
      .sort((a, b) => {
        if (sortBy === 'enrolled') return (b.totalEnrollments || 0) - (a.totalEnrollments || 0)
        if (sortBy === 'rated') return Number(b.averageRating || 0) - Number(a.averageRating || 0)
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      })
  }, [categoryNameById, courses, searchQuery, sortBy, statusFilter, typeFilter])

  const getCourseId = (course: { courseId?: string; id?: string }) => course.courseId || course.id || ''

  const requestAction = (type: CourseAction, course: CourseResponse, event: MouseEvent) => {
    event.stopPropagation()
    setConfirmAction({
      type,
      courseId: getCourseId(course),
      courseTitle: course.title,
    })
  }

  const confirmCourseAction = () => {
    if (!confirmAction) return
    if (confirmAction.type === 'delete') {
      deleteMutation.mutate(confirmAction.courseId, { onSuccess: () => setConfirmAction(null) })
      return
    }
    archiveMutation.mutate(confirmAction.courseId, { onSuccess: () => setConfirmAction(null) })
  }

  const actionLoading = deleteMutation.isLoading || archiveMutation.isLoading

  return (
    <PageShell
      eyebrow="MentorHub"
      title="Courses and Documents"
      description="Manage published and archived courses and documents from one workspace."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link to="/courses/create" className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">
            <BookOpen className="h-4 w-4" />
            Create course
          </Link>
          <Link to="/documents/create" className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700">
            <FileText className="h-4 w-4" />
            Create document
          </Link>
        </div>
      }
    >
      <Toolbar>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <TextInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by title, domain, or skill"
            className="w-full pl-11"
          />
        </div>
        <SelectInput value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as (typeof statusOptions)[number])} className="w-full lg:w-44">
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status === 'ALL' ? 'All statuses' : formatStatusLabel(status)}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as (typeof typeOptions)[number])} className="w-full lg:w-40">
          <option value="ALL">All types</option>
          <option value={CourseProductType.COURSE}>Course</option>
          <option value={CourseProductType.DOCUMENT}>Document</option>
        </SelectInput>
        <SelectInput value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="w-full lg:w-48">
          <option value="updated">Recently updated</option>
          <option value="enrolled">Enrollments</option>
          <option value="rated">Rating</option>
        </SelectInput>
      </Toolbar>

      {loading ? (
        <LoadingRows rows={5} />
      ) : error ? (
        <StateCard tone="error" title="Unable to load courses and documents" message={error} action={<button onClick={loadCourses} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Retry</button>} />
      ) : filteredCourses.length === 0 ? (
        <StateCard
          title={courses.length === 0 ? 'No courses or documents yet' : 'No courses or documents match this filter'}
          message={courses.length === 0 ? 'Create your first course or document.' : 'Adjust search, status, or type filters.'}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/courses/create" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Create course</Link>
              <Link to="/documents/create" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">Create document</Link>
            </div>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Course / document</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Enrollments</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Last updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.map((course) => {
                  const courseId = getCourseId(course)
                  const hasEnrollments = (course.totalEnrollments || 0) > 0
                  const effectivePrice = course.effectivePriceMxc ?? course.priceMxc ?? 0
                  const hasDiscount = course.activeDiscount && effectivePrice < (course.priceMxc || 0)
                  return (
                    <tr
                      key={courseId}
                      className="transition hover:bg-indigo-50/40"
                    >
                      <td className="px-4 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {course.thumbnailUrl ? (
                              <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-indigo-500">
                                <BookOpen className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-950">{course.title}</p>
                            <p className="mt-1 text-xs font-bold text-slate-500">
                              {course.productType === CourseProductType.DOCUMENT ? 'Document' : 'Course'}
                              {course.categoryId ? ` - ${categoryNameById[course.categoryId] || `Category ${course.categoryId}`}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill label={formatStatusLabel(course.status)} tone={course.status === CourseStatus.PUBLISHED ? 'emerald' : 'slate'} />
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-900">
                        {hasDiscount ? (
                          <span className="flex flex-col">
                            <span>{formatCurrency(effectivePrice)}</span>
                            <span className="text-xs font-bold text-slate-400 line-through">{formatCurrency(course.priceMxc || 0)}</span>
                          </span>
                        ) : (
                          <span>{effectivePrice ? formatCurrency(effectivePrice) : 'Free'}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-700">{course.totalEnrollments || 0}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-700">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {Number(course.averageRating || 0).toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-500">{formatDate(course.updatedAt || course.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/mentor/courses/${courseId}/manage`}
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-white"
                          >
                            <Settings className="h-3.5 w-3.5" />
                            Manage
                          </Link>
                          {course.status === CourseStatus.PUBLISHED && (
                            <button
                              type="button"
                              onClick={(event) => requestAction('archive', course, event)}
                              disabled={archiveMutation.isLoading}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-white disabled:opacity-60"
                            >
                              <Archive className="h-3.5 w-3.5" />
                              Archive
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(event) => requestAction('delete', course, event)}
                            disabled={hasEnrollments || deleteMutation.isLoading}
                            title={hasEnrollments ? 'Courses or documents with enrollments cannot be deleted. Archive instead.' : 'Delete'}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CourseNameConfirmModal
        isOpen={!!confirmAction}
        courseName={confirmAction?.courseTitle || ''}
        title={confirmAction?.type === 'delete' ? 'Delete item?' : 'Archive item?'}
        message={confirmAction?.type === 'delete'
          ? 'This course or document will be removed. Deletion is only allowed when it has zero enrollments.'
          : 'This course or document will leave the marketplace. Enrolled learners can still access it from their library.'}
        confirmText={confirmAction?.type === 'delete' ? 'Delete' : 'Archive'}
        confirmTone={confirmAction?.type === 'delete' ? 'rose' : 'slate'}
        isLoading={actionLoading}
        onClose={() => {
          if (!actionLoading) setConfirmAction(null)
        }}
        onConfirm={confirmCourseAction}
      />
      <CourseAnalyticsSection />
    </PageShell>
  )
}

function formatStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PUBLISHED: 'Published',
    ARCHIVED: 'Archived',
  }
  return labels[status] || status.replace(/_/g, ' ').toLowerCase()
}

function CourseAnalyticsSection() {
  const { data: courseStats } = useCourseStats()
  if (!courseStats || courseStats.courses.length === 0) return null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">Course Analytics</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total courses</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{courseStats.totalCourses}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total revenue</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{courseStats.totalRevenueMxc.toLocaleString()} MXC</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total enrollments</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{courseStats.totalEnrollments}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Avg completion</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{(courseStats.averageCompletionRate * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
              <th className="pb-2 pr-4">Course</th>
              <th className="pb-2 pr-4">Revenue</th>
              <th className="pb-2 pr-4">Enrollments</th>
              <th className="pb-2 pr-4">Completion</th>
              <th className="pb-2 pr-4">Views</th>
              <th className="pb-2">Rating</th>
            </tr>
          </thead>
          <tbody>
            {courseStats.courses.map((course) => (
              <tr key={course.courseId} className="border-b border-slate-50">
                <td className="py-2 pr-4 font-semibold text-slate-900">{course.courseTitle}</td>
                <td className="py-2 pr-4 text-slate-600">{(course.totalRevenueMxc || 0).toLocaleString()} MXC</td>
                <td className="py-2 pr-4 text-slate-600">{course.totalEnrollments}</td>
                <td className="py-2 pr-4 text-slate-600">{(course.completionRate * 100).toFixed(1)}%</td>
                <td className="py-2 pr-4 text-slate-600">{(course.lessonViews || 0).toLocaleString()}</td>
                <td className="py-2 text-slate-600">{course.averageRating > 0 ? course.averageRating.toFixed(1) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
