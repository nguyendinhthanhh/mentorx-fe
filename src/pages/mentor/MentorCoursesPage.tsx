import { MouseEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from 'react-query'
import { Archive, BookOpen, Plus, Search, Settings, Star, Trash2 } from 'lucide-react'
import { categoryApi } from '@/api/categoryApi'
import { courseApi } from '@/api/courseApi'
import CourseNameConfirmModal from '@/components/course/CourseNameConfirmModal'
import { useAuthStore } from '@/store/authStore'
import { CategoryResponse, CourseProductType, CourseResponse, CourseStatus } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { LoadingRows, PageShell, SelectInput, StateCard, StatusPill, TextInput, Toolbar } from './shared/MentorHubUI'

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
      title="Learning Products"
      description="Manage published and archived courses and documents from one workspace."
      actions={
        <Link to="/courses/create" className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          New product
        </Link>
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
        <StateCard tone="error" title="Unable to load products" message={error} action={<button onClick={loadCourses} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white">Retry</button>} />
      ) : filteredCourses.length === 0 ? (
        <StateCard
          title={courses.length === 0 ? 'No products yet' : 'No products match this filter'}
          message={courses.length === 0 ? 'Create your first course or document.' : 'Adjust search, status, or type filters.'}
          action={<Link to="/courses/create" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white">New product</Link>}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-4 py-3">Product</th>
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
                            <p className="truncate text-sm font-black text-slate-950">{course.title}</p>
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
                      <td className="px-4 py-4 text-sm font-black text-slate-900">
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
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-700 hover:bg-white"
                          >
                            <Settings className="h-3.5 w-3.5" />
                            Manage
                          </Link>
                          {course.status === CourseStatus.PUBLISHED && (
                            <button
                              type="button"
                              onClick={(event) => requestAction('archive', course, event)}
                              disabled={archiveMutation.isLoading}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-700 hover:bg-white disabled:opacity-60"
                            >
                              <Archive className="h-3.5 w-3.5" />
                              Archive
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(event) => requestAction('delete', course, event)}
                            disabled={hasEnrollments || deleteMutation.isLoading}
                            title={hasEnrollments ? 'Products with enrollments cannot be deleted. Archive instead.' : 'Delete product'}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-xs font-black text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
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
        title={confirmAction?.type === 'delete' ? 'Delete product?' : 'Archive product?'}
        message={confirmAction?.type === 'delete'
          ? 'This product will be removed. Deletion is only allowed when it has zero enrollments.'
          : 'This product will leave the marketplace. Enrolled learners can still access it from their library.'}
        confirmText={confirmAction?.type === 'delete' ? 'Delete Product' : 'Archive Product'}
        confirmTone={confirmAction?.type === 'delete' ? 'rose' : 'slate'}
        isLoading={actionLoading}
        onClose={() => {
          if (!actionLoading) setConfirmAction(null)
        }}
        onConfirm={confirmCourseAction}
      />
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
