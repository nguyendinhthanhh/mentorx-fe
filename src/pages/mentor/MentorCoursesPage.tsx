import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  Archive,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  FileText,
  Loader2,
  MessageSquare,
  Search,
  Settings,
  Star,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'

import { categoryApi } from '@/api/categoryApi'
import { courseApi } from '@/api/courseApi'
import CourseNameConfirmModal from '@/components/course/CourseNameConfirmModal'
import { useI18n } from '@/i18n/I18nProvider'
import type { Language } from '@/i18n/translations'
import { useAuthStore } from '@/store/authStore'
import { CategoryResponse, CourseEnrollmentResponse, CourseProductType, CourseResponse, CourseStatus, LessonProgressResponse, PaginatedResponse } from '@/types'
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/utils/formatters'
import { LoadingRows, SelectInput, StateCard, StatusPill, TextInput, Toolbar } from './shared/MentorHubUI'

type CourseAction = 'delete' | 'archive'

type ConfirmAction = {
  type: CourseAction
  courseId: string
  courseTitle: string
} | null

type CourseFilter = 'ALL' | CourseStatus.PUBLISHED | CourseStatus.ARCHIVED
type ResourceFilter = 'ALL' | CourseProductType.COURSE | CourseProductType.DOCUMENT
type LearnerStatusFilter = 'ALL' | 'LEARNING' | 'COMPLETED'

const statusOptions: CourseFilter[] = ['ALL', CourseStatus.PUBLISHED, CourseStatus.ARCHIVED]
const typeOptions: ResourceFilter[] = ['ALL', CourseProductType.COURSE, CourseProductType.DOCUMENT]
const learnerStatusOptions: LearnerStatusFilter[] = ['ALL', 'LEARNING', 'COMPLETED']
const RESOURCE_PAGE_SIZE = 5
const LEARNER_PAGE_SIZE = 5

export default function MentorCoursesPage() {
  const { user } = useAuthStore()
  const { t, language } = useI18n()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CourseFilter>('ALL')
  const [typeFilter, setTypeFilter] = useState<ResourceFilter>('ALL')
  const [sortBy, setSortBy] = useState('updated')
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const mentorCoursesQuery = useQuery(
    ['mentor-courses', user?.userId],
    async () => {
      if (!user?.userId) return { courses: [] as CourseResponse[], categories: [] as CategoryResponse[] }
      const [coursePage, categoryList] = await Promise.all([
        fetchAllPages<CourseResponse>((page, size) => courseApi.getByInstructor(user.userId, { page, size })),
        categoryApi.getAllActive().catch(() => [] as CategoryResponse[]),
      ])
      return {
        courses: coursePage.content || [],
        categories: categoryList,
      }
    },
    {
      enabled: Boolean(user?.userId),
    }
  )

  const courses = useMemo(() => mentorCoursesQuery.data?.courses ?? [], [mentorCoursesQuery.data?.courses])
  const categories = useMemo(() => mentorCoursesQuery.data?.categories ?? [], [mentorCoursesQuery.data?.categories])

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

  const selectedCourse = useMemo(() => {
    return filteredCourses.find((course) => getCourseId(course) === selectedCourseId) ?? null
  }, [filteredCourses, selectedCourseId])

  useEffect(() => {
    if (filteredCourses.length === 0) {
      setSelectedCourseId(null)
      return
    }
    if (!selectedCourseId || !filteredCourses.some((course) => getCourseId(course) === selectedCourseId)) {
      setSelectedCourseId(getCourseId(filteredCourses[0]))
    }
  }, [filteredCourses, selectedCourseId])

  const learnerQuery = useQuery(
    ['mentor-course-learners', selectedCourseId],
    () => fetchAllPages<CourseEnrollmentResponse>(
      (page, size) => courseApi.getEnrollmentsByCourse(selectedCourseId || '', { page, size })
    ),
    {
      enabled: Boolean(selectedCourseId),
      keepPreviousData: true,
    }
  )

  const refreshCourses = () => {
    void queryClient.invalidateQueries(['mentor-courses', user?.userId])
  }

  const deleteMutation = useMutation((courseId: string) => courseApi.delete(courseId), {
    onSuccess: () => {
      setConfirmAction(null)
      refreshCourses()
    },
  })

  const archiveMutation = useMutation((courseId: string) => courseApi.archive(courseId), {
    onSuccess: () => {
      setConfirmAction(null)
      refreshCourses()
    },
  })

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
      deleteMutation.mutate(confirmAction.courseId)
      return
    }
    archiveMutation.mutate(confirmAction.courseId)
  }

  const publishedCount = courses.filter((course) => course.status === CourseStatus.PUBLISHED).length
  const archivedCount = courses.filter((course) => course.status === CourseStatus.ARCHIVED).length
  const totalLearners = courses.reduce((sum, course) => sum + (course.totalEnrollments || 0), 0)
  const actionLoading = deleteMutation.isLoading || archiveMutation.isLoading

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-12">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">{t('mentorCourses.title')}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{t('mentorCourses.subtitle')}</p>
        </div>
        <Link
          to="/courses/create"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
        >
          <BookOpen className="h-4 w-4" />
          {t('mentorCourses.createCourse')}
        </Link>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <InventoryMetric label={t('mentorCourses.metric.total')} value={formatNumber(courses.length, language)} />
          <InventoryMetric label={t('mentorCourses.metric.published')} value={formatNumber(publishedCount, language)} tone="emerald" />
          <InventoryMetric label={t('mentorCourses.metric.archived')} value={formatNumber(archivedCount, language)} tone="slate" />
          <InventoryMetric label={t('mentorCourses.metric.learners')} value={formatNumber(totalLearners, language)} tone="amber" />
        </div>
      </section>

      {mentorCoursesQuery.isLoading ? (
        <LoadingRows rows={5} />
      ) : mentorCoursesQuery.isError ? (
        <StateCard
          tone="error"
          title={t('mentorCourses.errorTitle')}
          message={getErrorMessage(mentorCoursesQuery.error, t('mentorCourses.errorMessage'))}
          action={<button onClick={() => void mentorCoursesQuery.refetch()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{t('mentorCourses.retry')}</button>}
        />
      ) : courses.length === 0 ? (
        <StateCard
          title={t('mentorCourses.emptyTitle')}
          message={t('mentorCourses.emptyMessage')}
          action={
            <Link to="/courses/create" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{t('mentorCourses.createCourse')}</Link>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <ResourceList
            categoryNameById={categoryNameById}
            courses={filteredCourses}
            selectedCourseId={selectedCourseId}
            totalCourseCount={courses.length}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            sortBy={sortBy}
            onSearchChange={setSearchQuery}
            onStatusChange={setStatusFilter}
            onTypeChange={setTypeFilter}
            onSortChange={setSortBy}
            onSelect={setSelectedCourseId}
          />
          <CourseWorkPanel
            course={selectedCourse}
            categoryNameById={categoryNameById}
            enrollments={learnerQuery.data?.content ?? []}
            learnerTotal={learnerQuery.data?.totalElements ?? selectedCourse?.totalEnrollments ?? 0}
            learnersLoading={learnerQuery.isLoading || learnerQuery.isFetching}
            learnersError={learnerQuery.error}
            archiveLoading={archiveMutation.isLoading}
            deleteLoading={deleteMutation.isLoading}
            onArchive={(course) => requestAction('archive', course)}
            onDelete={(course) => requestAction('delete', course)}
          />
        </div>
      )}

      <CourseNameConfirmModal
        isOpen={!!confirmAction}
        courseName={confirmAction?.courseTitle || ''}
        title={confirmAction?.type === 'delete' ? t('mentorCourses.confirmDeleteTitle') : t('mentorCourses.confirmArchiveTitle')}
        message={confirmAction?.type === 'delete' ? t('mentorCourses.confirmDeleteMessage') : t('mentorCourses.confirmArchiveMessage')}
        confirmText={confirmAction?.type === 'delete' ? t('mentorCourses.delete') : t('mentorCourses.archive')}
        confirmTone={confirmAction?.type === 'delete' ? 'rose' : 'slate'}
        isLoading={actionLoading}
        onClose={() => {
          if (!actionLoading) setConfirmAction(null)
        }}
        onConfirm={confirmCourseAction}
      />
    </div>
  )
}

function ResourceList({
  categoryNameById,
  courses,
  selectedCourseId,
  totalCourseCount,
  searchQuery,
  statusFilter,
  typeFilter,
  sortBy,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onSortChange,
  onSelect,
}: {
  categoryNameById: Record<number, string>
  courses: CourseResponse[]
  selectedCourseId: string | null
  totalCourseCount: number
  searchQuery: string
  statusFilter: CourseFilter
  typeFilter: ResourceFilter
  sortBy: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: CourseFilter) => void
  onTypeChange: (value: ResourceFilter) => void
  onSortChange: (value: string) => void
  onSelect: (courseId: string) => void
}) {
  const { t, language } = useI18n()
  const [page, setPage] = useState(0)

  const visibleDocumentCount = useMemo(
    () => courses.filter((course) => course.productType === CourseProductType.DOCUMENT).length,
    [courses]
  )
  const totalPages = Math.max(1, Math.ceil(courses.length / RESOURCE_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pageCourses = useMemo(() => {
    const start = currentPage * RESOURCE_PAGE_SIZE
    return courses.slice(start, start + RESOURCE_PAGE_SIZE)
  }, [courses, currentPage])

  useEffect(() => {
    setPage(0)
  }, [searchQuery, sortBy, statusFilter, typeFilter])

  useEffect(() => {
    if (page > totalPages - 1) setPage(totalPages - 1)
  }, [page, totalPages])

  const changePage = (nextPage: number) => {
    const boundedPage = Math.max(0, Math.min(nextPage, totalPages - 1))
    setPage(boundedPage)
    const firstCourse = courses[boundedPage * RESOURCE_PAGE_SIZE]
    if (firstCourse) onSelect(getCourseId(firstCourse))
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">{t('mentorCourses.list.title')}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {t('mentorCourses.list.visible', {
              visible: formatNumber(courses.length, language),
              total: formatNumber(totalCourseCount, language),
              documents: formatNumber(visibleDocumentCount, language),
            })}
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500">{t('mentorCourses.list.selectHint')}</p>
      </div>

      <div className="border-b border-slate-100 p-3">
        <Toolbar>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <TextInput
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t('mentorCourses.searchPlaceholder')}
              className="w-full pl-11"
            />
          </div>
          <SegmentedFilter
            label={t('mentorCourses.statusFilterLabel')}
            options={statusOptions}
            value={statusFilter}
            getLabel={(status) => (status === 'ALL' ? t('mentorCourses.statusAllShort') : getStatusLabel(status, t))}
            onChange={onStatusChange}
          />
          <SegmentedFilter
            label={t('mentorCourses.typeFilterLabel')}
            options={typeOptions}
            value={typeFilter}
            getLabel={(type) => {
              if (type === 'ALL') return t('mentorCourses.typeAllShort')
              return type === CourseProductType.DOCUMENT ? t('courses.typeDocument') : t('courses.typeCourse')
            }}
            onChange={onTypeChange}
          />
          <SelectInput value={sortBy} onChange={(event) => onSortChange(event.target.value)} className="w-full lg:w-48">
            <option value="updated">{t('mentorCourses.sort.updated')}</option>
            <option value="enrolled">{t('mentorCourses.sort.enrolled')}</option>
            <option value="rated">{t('mentorCourses.sort.rated')}</option>
          </SelectInput>
        </Toolbar>
      </div>

      <div className="divide-y divide-slate-100">
        {pageCourses.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-semibold text-slate-900">{t('mentorCourses.filterEmptyTitle')}</p>
            <p className="mt-1 text-sm text-slate-500">{t('mentorCourses.filterEmptyMessage')}</p>
          </div>
        ) : pageCourses.map((course) => {
          const courseId = getCourseId(course)
          const isSelected = selectedCourseId === courseId
          return (
            <CourseListItem
              key={courseId}
              categoryNameById={categoryNameById}
              course={course}
              isSelected={isSelected}
              onSelect={() => onSelect(courseId)}
            />
          )
        })}
      </div>

      {courses.length > 0 ? (
        <Pagination
          page={currentPage}
          pageSize={RESOURCE_PAGE_SIZE}
          totalItems={courses.length}
          onPageChange={changePage}
        />
      ) : null}
    </section>
  )
}

function CourseListItem({
  categoryNameById,
  course,
  isSelected,
  onSelect,
}: {
  categoryNameById: Record<number, string>
  course: CourseResponse
  isSelected: boolean
  onSelect: () => void
}) {
  const { t, language } = useI18n()
  const ProductIcon = course.productType === CourseProductType.DOCUMENT ? FileText : BookOpen
  const categoryName = course.categoryId ? categoryNameById[course.categoryId] || t('mentorCourses.unknownCategory') : t('mentorCourses.unknownCategory')
  const effectivePrice = course.effectivePriceMxc ?? course.priceMxc ?? 0
  const productTypeLabel = course.productType === CourseProductType.DOCUMENT ? t('courses.typeDocument') : t('courses.typeCourse')

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`block w-full px-4 py-4 text-left transition focus:outline-none focus:ring-4 focus:ring-inset focus:ring-emerald-500/15 ${
        isSelected ? 'bg-emerald-50/80' : 'bg-white hover:bg-slate-50'
      }`}
    >
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <ProductIcon className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill label={getStatusLabel(course.status, t)} tone={course.status === CourseStatus.PUBLISHED ? 'emerald' : 'slate'} />
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{productTypeLabel}</span>
            </div>
            <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-950">{course.title}</h3>
            <p className="mt-1 line-clamp-1 text-xs text-slate-500">{categoryName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:w-[460px] lg:shrink-0">
          <CompactDatum label={t('mentorCourses.column.price')} value={effectivePrice ? formatCurrency(effectivePrice, 'MXC', language) : t('courses.free')} />
          <CompactDatum
            label={t('mentorCourses.column.enrollments')}
            value={
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                {formatNumber(course.totalEnrollments || 0, language)}
              </span>
            }
          />
          <CompactDatum
            label={t('mentorCourses.column.rating')}
            value={
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {Number(course.averageRating || 0).toFixed(1)}
              </span>
            }
          />
          <CompactDatum label={t('mentorCourses.column.updated')} value={formatDate(course.updatedAt || course.createdAt, language)} />
        </div>
      </div>
    </button>
  )
}

function CourseWorkPanel({
  course,
  categoryNameById,
  enrollments,
  learnerTotal,
  learnersLoading,
  learnersError,
  archiveLoading,
  deleteLoading,
  onArchive,
  onDelete,
}: {
  course: CourseResponse | null
  categoryNameById: Record<number, string>
  enrollments: CourseEnrollmentResponse[]
  learnerTotal: number
  learnersLoading: boolean
  learnersError: unknown
  archiveLoading: boolean
  deleteLoading: boolean
  onArchive: (course: CourseResponse) => void
  onDelete: (course: CourseResponse) => void
}) {
  const { t, language } = useI18n()

  if (!course) {
    return (
      <aside className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        <p className="font-semibold text-slate-900">{t('mentorCourses.detail.placeholderTitle')}</p>
        <p className="mt-2 leading-6">{t('mentorCourses.detail.placeholderMessage')}</p>
      </aside>
    )
  }

  const courseId = getCourseId(course)
  const effectivePrice = course.effectivePriceMxc ?? course.priceMxc ?? 0
  const hasDiscount = Boolean(course.activeDiscount && effectivePrice < (course.priceMxc || 0))
  const hasEnrollments = (course.totalEnrollments || 0) > 0
  const categoryName = course.categoryId ? categoryNameById[course.categoryId] || t('mentorCourses.unknownCategory') : t('mentorCourses.unknownCategory')
  const productTypeLabel = course.productType === CourseProductType.DOCUMENT ? t('courses.typeDocument') : t('courses.typeCourse')

  return (
    <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('mentorCourses.detail.eyebrow')}</p>
          <h2 className="mt-1 line-clamp-2 text-base font-semibold leading-6 text-slate-950">{course.title}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill label={getStatusLabel(course.status, t)} tone={course.status === CourseStatus.PUBLISHED ? 'emerald' : 'slate'} />
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{productTypeLabel}</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{categoryName}</span>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-px bg-slate-100 text-sm">
          <DetailMetric
            icon={<Users className="h-4 w-4" />}
            label={t('mentorCourses.column.enrollments')}
            value={formatNumber(course.totalEnrollments || 0, language)}
          />
          <DetailMetric
            icon={<Star className="h-4 w-4" />}
            label={t('mentorCourses.column.rating')}
            value={Number(course.averageRating || 0).toFixed(1)}
          />
          <DetailMetric
            icon={<CalendarClock className="h-4 w-4" />}
            label={t('mentorCourses.column.updated')}
            value={formatDate(course.updatedAt || course.createdAt, language)}
          />
          <DetailMetric
            icon={<CheckCircle2 className="h-4 w-4" />}
            label={t('mentorCourses.detail.priceNow')}
            value={effectivePrice ? formatCurrency(effectivePrice, 'MXC', language) : t('courses.free')}
            helper={hasDiscount ? t('mentorCourses.detail.originalPrice', { price: formatCurrency(course.priceMxc || 0, 'MXC', language) }) : undefined}
          />
        </dl>

        <div className="space-y-3 p-4">
          <Link
            to={`/mentor/courses/${courseId}/manage`}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
          >
            <Settings className="h-4 w-4" />
            {t('mentorCourses.manage')}
          </Link>

          <div className="grid gap-2 sm:grid-cols-2">
            {course.status === CourseStatus.PUBLISHED ? (
              <button
                type="button"
                onClick={() => onArchive(course)}
                disabled={archiveLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-slate-500/10"
              >
                <Archive className="h-4 w-4" />
                {t('mentorCourses.archive')}
              </button>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
                {t('mentorCourses.detail.archivedHint')}
              </div>
            )}
            <button
              type="button"
              onClick={() => onDelete(course)}
              disabled={hasEnrollments || deleteLoading}
              title={hasEnrollments ? t('mentorCourses.deleteDisabled') : t('mentorCourses.delete')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 focus:outline-none focus:ring-4 focus:ring-rose-500/10"
            >
              <Trash2 className="h-4 w-4" />
              {t('mentorCourses.delete')}
            </button>
          </div>
          {hasEnrollments ? <p className="text-xs leading-5 text-slate-500">{t('mentorCourses.deleteDisabled')}</p> : null}
        </div>
      </section>

      <LearnerPanel courseId={courseId} enrollments={enrollments} learnerTotal={learnerTotal} isLoading={learnersLoading} error={learnersError} />
    </aside>
  )
}

function LearnerPanel({
  courseId,
  enrollments,
  learnerTotal,
  isLoading,
  error,
}: {
  courseId: string
  enrollments: CourseEnrollmentResponse[]
  learnerTotal: number
  isLoading: boolean
  error: unknown
}) {
  const { t, language } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<LearnerStatusFilter>('ALL')
  const [page, setPage] = useState(0)
  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<string | null>(null)
  const [certificateDownloadId, setCertificateDownloadId] = useState<string | null>(null)
  const [certificateErrorId, setCertificateErrorId] = useState<string | null>(null)

  const filteredEnrollments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return enrollments.filter((enrollment) => {
      const statusMatches =
        statusFilter === 'ALL'
        || (statusFilter === 'COMPLETED' && enrollment.isCompleted)
        || (statusFilter === 'LEARNING' && !enrollment.isCompleted)
      const haystack = [enrollment.studentName, enrollment.studentId, enrollment.id].join(' ').toLowerCase()
      return statusMatches && (!query || haystack.includes(query))
    })
  }, [enrollments, searchQuery, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredEnrollments.length / LEARNER_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pageEnrollments = useMemo(() => {
    const start = currentPage * LEARNER_PAGE_SIZE
    return filteredEnrollments.slice(start, start + LEARNER_PAGE_SIZE)
  }, [currentPage, filteredEnrollments])
  const expandedEnrollment = useMemo(
    () => enrollments.find((enrollment) => enrollment.id === expandedEnrollmentId) ?? null,
    [enrollments, expandedEnrollmentId]
  )

  const learnerProgressQuery = useQuery(
    ['mentor-course-learner-progress', courseId, expandedEnrollment?.studentId],
    () => courseApi.getProgressByStudentAndCourse(expandedEnrollment!.studentId, courseId),
    {
      enabled: Boolean(courseId && expandedEnrollment?.studentId),
      keepPreviousData: true,
    }
  )

  useEffect(() => {
    setPage(0)
  }, [enrollments, searchQuery, statusFilter])

  useEffect(() => {
    if (page > totalPages - 1) setPage(totalPages - 1)
  }, [page, totalPages])

  useEffect(() => {
    if (expandedEnrollmentId && !filteredEnrollments.some((enrollment) => enrollment.id === expandedEnrollmentId)) {
      setExpandedEnrollmentId(null)
    }
  }, [expandedEnrollmentId, filteredEnrollments])

  const downloadCertificate = async (enrollment: CourseEnrollmentResponse) => {
    if (!canDownloadCertificate(enrollment) || certificateDownloadId) return
    try {
      setCertificateDownloadId(enrollment.id)
      setCertificateErrorId(null)
      const { blob, fileName } = await courseApi.downloadCertificate(enrollment.id)
      downloadBrowserFile(blob, fileName || 'mentorx-certificate.pdf')
    } catch {
      setCertificateErrorId(enrollment.id)
    } finally {
      setCertificateDownloadId(null)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">{t('mentorCourses.learners.title')}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {t('mentorCourses.learners.count', { count: formatNumber(learnerTotal, language) })}
          </p>
        </div>
        <Users className="mt-0.5 h-4 w-4 text-slate-400" />
      </div>

      <div className="space-y-3 border-b border-slate-100 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <TextInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('mentorCourses.learners.searchPlaceholder')}
            className="w-full pl-11"
          />
        </div>
        <SegmentedFilter
          label={t('mentorCourses.learners.statusFilterLabel')}
          options={learnerStatusOptions}
          value={statusFilter}
          getLabel={(status) => {
            if (status === 'ALL') return t('mentorCourses.learners.statusAll')
            return status === 'COMPLETED' ? t('mentorCourses.learners.completed') : t('mentorCourses.learners.learning')
          }}
          onChange={setStatusFilter}
        />
      </div>

      <div className="max-h-[520px] overflow-y-auto p-3">
        {isLoading ? (
          <LoadingRows rows={3} />
        ) : error ? (
          <StateCard tone="error" title={t('mentorCourses.learners.errorTitle')} message={getErrorMessage(error, t('mentorCourses.learners.errorMessage'))} />
        ) : enrollments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-slate-900">{t('mentorCourses.learners.emptyTitle')}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{t('mentorCourses.learners.emptyMessage')}</p>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-slate-900">{t('mentorCourses.learners.filterEmptyTitle')}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{t('mentorCourses.learners.filterEmptyMessage')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pageEnrollments.map((enrollment) => (
              <article key={enrollment.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{enrollment.studentName || t('mentorCourses.learners.unknownLearner')}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(enrollment.enrolledAt, language)}</p>
                  </div>
                  <StatusPill
                    label={enrollment.isCompleted ? t('mentorCourses.learners.completed') : t('mentorCourses.learners.learning')}
                    tone={enrollment.isCompleted ? 'emerald' : 'amber'}
                  />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-slate-500">{t('mentorCourses.learners.paid')}</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{formatCurrency(enrollment.amountPaidMxc || 0, 'MXC', language)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">{t('mentorCourses.learners.progress')}</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{Number(enrollment.progressPercent || 0).toFixed(0)}%</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-500">{t('mentorCourses.learners.lastAccessed')}</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {enrollment.lastAccessedAt ? formatDateTime(enrollment.lastAccessedAt, language) : t('mentorCourses.learners.notAccessed')}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    to={`/users/${enrollment.studentId}`}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-500/10"
                  >
                    <UserRound className="h-3.5 w-3.5" />
                    {t('mentorCourses.learners.actions.profile')}
                  </Link>
                  <Link
                    to={`/mentor/messages?targetUserId=${enrollment.studentId}`}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-slate-500/10"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {t('mentorCourses.learners.actions.message')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setExpandedEnrollmentId(expandedEnrollmentId === enrollment.id ? null : enrollment.id)}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-500/10"
                  >
                    {expandedEnrollmentId === enrollment.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {expandedEnrollmentId === enrollment.id ? t('mentorCourses.learners.actions.hideProgress') : t('mentorCourses.learners.actions.viewProgress')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void downloadCertificate(enrollment)}
                    disabled={!canDownloadCertificate(enrollment) || certificateDownloadId === enrollment.id}
                    title={canDownloadCertificate(enrollment) ? t('mentorCourses.learners.actions.downloadCertificate') : t('mentorCourses.learners.certificateUnavailable')}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-500/10"
                  >
                    {certificateDownloadId === enrollment.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    {t('mentorCourses.learners.actions.downloadCertificate')}
                  </button>
                </div>
                {certificateErrorId === enrollment.id ? (
                  <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{t('mentorCourses.learners.certificateError')}</p>
                ) : null}
                {expandedEnrollmentId === enrollment.id ? (
                  <LearnerProgressDetail
                    progressRows={learnerProgressQuery.data ?? []}
                    isLoading={learnerProgressQuery.isLoading || learnerProgressQuery.isFetching}
                    error={learnerProgressQuery.error}
                  />
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>

      {filteredEnrollments.length > 0 ? (
        <Pagination
          page={currentPage}
          pageSize={LEARNER_PAGE_SIZE}
          totalItems={filteredEnrollments.length}
          onPageChange={setPage}
        />
      ) : null}
    </section>
  )
}

function LearnerProgressDetail({
  progressRows,
  isLoading,
  error,
}: {
  progressRows: LessonProgressResponse[]
  isLoading: boolean
  error: unknown
}) {
  const { t, language } = useI18n()
  const completedCount = progressRows.filter((row) => row.isCompleted).length

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-900">{t('mentorCourses.learners.progressDetailTitle')}</p>
        {progressRows.length > 0 ? (
          <span className="text-[11px] font-semibold text-slate-500">
            {t('mentorCourses.learners.progressDetailSummary', {
              completed: formatNumber(completedCount, language),
              total: formatNumber(progressRows.length, language),
            })}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-3 space-y-2">
          <div className="h-10 animate-pulse rounded-md bg-slate-200/70" />
          <div className="h-10 animate-pulse rounded-md bg-slate-200/70" />
        </div>
      ) : error ? (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{t('mentorCourses.learners.progressDetailError')}</p>
      ) : progressRows.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed border-slate-200 bg-white px-3 py-3 text-xs leading-5 text-slate-500">
          {t('mentorCourses.learners.progressDetailEmpty')}
        </p>
      ) : (
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
          {progressRows.map((row) => (
            <div key={`${row.enrollmentId}-${row.lessonId}`} className="rounded-md border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-950">{row.lessonTitle || t('mentorCourses.learners.untitledLesson')}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {t('mentorCourses.learners.activeTime', { time: formatMinutesFromSeconds(row.activeTimeSec, language) })}
                  </p>
                </div>
                <StatusPill
                  label={row.isCompleted ? t('mentorCourses.learners.completed') : t('mentorCourses.learners.learning')}
                  tone={row.isCompleted ? 'emerald' : 'amber'}
                />
              </div>
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${clampPercent(row.progressPercent)}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>{Number(row.progressPercent || 0).toFixed(0)}%</span>
                  <span>{row.completedAt ? formatDateTime(row.completedAt, language) : t('mentorCourses.learners.notCompletedYet')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
}) {
  const { t, language } = useI18n()
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const start = totalItems === 0 ? 0 : page * pageSize + 1
  const end = Math.min(totalItems, (page + 1) * pageSize)

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-medium text-slate-500">
        {t('mentorCourses.pagination.summary', {
          start: formatNumber(start, language),
          end: formatNumber(end, language),
          total: formatNumber(totalItems, language),
        })}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-500/10"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t('mentorCourses.pagination.previous')}
        </button>
        <span className="min-w-12 text-center text-xs font-semibold text-slate-500">
          {formatNumber(page + 1, language)}/{formatNumber(totalPages, language)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-500/10"
        >
          {t('mentorCourses.pagination.next')}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function SegmentedFilter<T extends string>({
  label,
  options,
  value,
  getLabel,
  onChange,
}: {
  label: string
  options: T[]
  value: T
  getLabel: (option: T) => string
  onChange: (option: T) => void
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <span className="sr-only">{label}</span>
      <div className="flex w-max min-w-full rounded-lg border border-slate-200 bg-slate-50 p-1">
        {options.map((option) => {
          const isActive = option === value
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`h-8 whitespace-nowrap rounded-md px-3 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                isActive ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {getLabel(option)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function InventoryMetric({
  label,
  value,
  tone = 'slate',
}: {
  label: string
  value: string
  tone?: 'slate' | 'emerald' | 'amber'
}) {
  const toneClass = {
    slate: 'text-slate-950',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
  }[tone]

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <p className="truncate text-xs font-semibold text-slate-500">{label}</p>
      <p className={`text-base font-bold ${toneClass}`}>{value}</p>
    </div>
  )
}

function CompactDatum({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 truncate font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function DetailMetric({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode
  label: string
  value: string
  helper?: string
}) {
  return (
    <div className="bg-white p-4">
      <dt className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </dt>
      <dd className="mt-2 text-sm font-semibold text-slate-950">{value}</dd>
      {helper ? <dd className="mt-1 text-xs text-slate-500">{helper}</dd> : null}
    </div>
  )
}

function getCourseId(course: { courseId?: string; id?: string }) {
  return course.courseId || course.id || ''
}

function getStatusLabel(status: string, t: ReturnType<typeof useI18n>['t']) {
  const labels: Record<string, string> = {
    PUBLISHED: t('mentorCourses.status.published'),
    ARCHIVED: t('mentorCourses.status.archived'),
  }
  return labels[status] || status.replace(/_/g, ' ').toLowerCase()
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    return response?.data?.message || fallback
  }
  return fallback
}

function canDownloadCertificate(enrollment: CourseEnrollmentResponse) {
  return Boolean(enrollment.isCompleted || enrollment.certificateIssuedAt || enrollment.certificateUrl)
}

function downloadBrowserFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = sanitizeFileName(fileName) || 'mentorx-certificate.pdf'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[\\/:*?"<>|]+/g, '-').trim()
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function formatMinutesFromSeconds(seconds: number, language: Language) {
  const minutes = Math.max(0, Math.round((seconds || 0) / 60))
  return `${formatNumber(minutes, language)} min`
}

async function fetchAllPages<T>(
  fetchPage: (page: number, size: number) => Promise<PaginatedResponse<T>>,
  size = 100
): Promise<PaginatedResponse<T>> {
  const firstPage = await fetchPage(0, size)
  const totalPages = Math.max(1, firstPage.totalPages || 1)
  if (totalPages === 1) return firstPage

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchPage(index + 1, firstPage.size || size))
  )

  return {
    ...firstPage,
    content: [firstPage, ...remainingPages].flatMap((page) => page.content || []),
    first: true,
    last: true,
    number: 0,
  }
}
