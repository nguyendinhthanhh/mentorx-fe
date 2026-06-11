import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from 'react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { Archive, BookOpen, Edit3, Eye, GraduationCap, Loader2, Plus, Search, Send, Star, Trash2, X } from 'lucide-react'
import { categoryApi } from '@/api/categoryApi'
import { courseApi } from '@/api/courseApi'
import { useAuthStore } from '@/store/authStore'
import { CategoryResponse, CourseResponse, CourseStatus } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { LoadingRows, MetricCard, PageShell, SelectInput, StateCard, StatusPill, TextInput, Toolbar } from './shared/MentorHubUI'

const statusOptions = ['ALL', 'PUBLISHED', 'DRAFT', 'PENDING_REVIEW', 'REJECTED', 'ARCHIVED']

type CourseAction = 'delete' | 'archive'

type ConfirmAction = {
  type: CourseAction
  courseId: string
  courseTitle: string
} | null

export default function MentorCoursesPage() {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
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

  const submitMutation = useMutation((courseId: string) => courseApi.submitForReview(courseId), {
    onSuccess: () => loadCourses(),
  })

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
      published: courses.filter((course) => String(course.status) === CourseStatus.PUBLISHED).length,
      drafts: courses.filter((course) => [CourseStatus.DRAFT, CourseStatus.PENDING_REVIEW].includes(course.status)).length,
      enrollments: courses.reduce((sum, course) => sum + (course.totalEnrollments || 0), 0),
    }
  }, [courses])

  const getCourseId = (course: { courseId?: string; id?: string }) => course.courseId || course.id || ''

  const requestAction = (type: CourseAction, course: CourseResponse) => {
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
        <MetricCard label="Course enrollments" value={summary.enrollments} helper="Total learner enrollments across your courses." icon={<GraduationCap className="h-5 w-5" />} tone="slate" />
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
          {filteredCourses.map((course) => {
            const courseId = getCourseId(course)
            return (
              <article key={courseId} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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
                  {course.rejectionReason ? <p className="text-xs font-semibold text-rose-600">{course.rejectionReason}</p> : <p className="text-xs font-semibold text-slate-400">Manage content, media, pricing, and review status from this course.</p>}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link to={`/courses/${courseId}`} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">View course</Link>
                    <Link to={`/mentor/courses/${courseId}/manage`} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">Manage</Link>
                    {(course.status === CourseStatus.DRAFT || course.status === CourseStatus.REJECTED) && (
                      <>
                        <button
                          type="button"
                          onClick={() => requestAction('delete', course)}
                          disabled={deleteMutation.isLoading}
                          className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-200 px-4 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => submitMutation.mutate(courseId)}
                          disabled={submitMutation.isLoading}
                          className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                        >
                          {submitMutation.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          Submit
                        </button>
                      </>
                    )}
                    {course.status === CourseStatus.PUBLISHED && (
                      <button
                        type="button"
                        onClick={() => requestAction('archive', course)}
                        disabled={archiveMutation.isLoading}
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <CourseActionDialog
        action={confirmAction}
        loading={actionLoading}
        onOpenChange={(open) => {
          if (!open && !actionLoading) setConfirmAction(null)
        }}
        onConfirm={confirmCourseAction}
      />
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

function CourseActionDialog({ action, loading, onOpenChange, onConfirm }: {
  action: ConfirmAction
  loading: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const isDelete = action?.type === 'delete'
  const title = isDelete ? 'Delete course?' : 'Archive course?'
  const description = isDelete
    ? 'This course is still a draft or rejected, so it will be deleted from your course list. This action cannot be undone.'
    : 'This course will be removed from the marketplace. Enrolled learners can still access and complete it from their course library.'

  return (
    <Dialog.Root open={!!action} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl outline-none">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-black text-slate-900">{title}</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm font-medium leading-6 text-slate-500">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button disabled={loading} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50" aria-label="Close dialog">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {action?.courseTitle && (
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Course</p>
              <p className="mt-1 text-sm font-bold text-slate-800">{action.courseTitle}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Dialog.Close asChild>
              <button disabled={loading} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60 ${
                isDelete ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isDelete ? <Trash2 className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              {isDelete ? 'Delete Course' : 'Archive Course'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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

function courseStatusTone(status: string): 'emerald' | 'amber' | 'rose' | 'slate' {
  if (status === 'PUBLISHED') return 'emerald'
  if (status === 'DRAFT' || status === 'PENDING_REVIEW') return 'amber'
  if (status === 'REJECTED') return 'rose'
  return 'slate'
}
