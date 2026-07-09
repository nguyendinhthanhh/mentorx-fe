import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueries, useQuery } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { categoryApi } from '@/api/categoryApi'
import { reviewApi } from '@/api/reviewApi'
import { useAuthStore } from '@/store/authStore'
import { CategoryResponse, CourseProductType, CourseResponse, CourseStatus, ReviewResponse, ReviewTargetType } from '@/types'
import ReviewForm from '@/components/review/ReviewForm'
import { AlertTriangle, Award, BookOpen, Clock, Eye, FileText, Loader2, PlayCircle, Star, Tag, X } from 'lucide-react'
import { categoryLabel } from '@/utils/freeFormTaxonomy'

export default function MyCoursesPage() {
  const { user } = useAuthStore()
  const [viewingCertificateId, setViewingCertificateId] = useState<string | null>(null)
  const [reviewingCourseId, setReviewingCourseId] = useState<string | null>(null)

  const { data: enrollmentsData, isLoading } = useQuery(
    ['my-enrollments', user?.userId],
    () => courseApi.getEnrollmentsByStudent(user!.userId, { page: 0, size: 100 }),
    { enabled: !!user?.userId }
  )

  const enrollments = enrollmentsData?.content || []
  const sortedEnrollments = useMemo(
    () => enrollments.slice().sort((a, b) => {
      const aAccessed = new Date(a.lastAccessedAt || a.enrolledAt).getTime()
      const bAccessed = new Date(b.lastAccessedAt || b.enrolledAt).getTime()
      return bAccessed - aAccessed
    }),
    [enrollments]
  )
  const { data: categories = [] } = useQuery('my-course-categories', categoryApi.getAllActive, {
    staleTime: 5 * 60 * 1000,
  })
  const latestEnrollments = useMemo(
    () => enrollments.slice().sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()).slice(0, 6),
    [enrollments]
  )
  const recentlyLearned = sortedEnrollments.slice(0, 6)
  const { data: myReviewsData } = useQuery(
    ['my-reviews', user?.userId],
    () => reviewApi.getByReviewer(user!.userId, { page: 0, size: 100 }),
    { enabled: !!user?.userId }
  )
  const courseQueries = useQueries(
    enrollments.map((enrollment) => ({
      queryKey: ['course', enrollment.courseId],
      queryFn: () => courseApi.getById(enrollment.courseId),
      enabled: !!enrollment.courseId,
    }))
  )

  const courseById = useMemo(() => {
    const map = new Map<string, CourseResponse>()
    courseQueries.forEach((query) => {
      const course = query.data as CourseResponse | undefined
      if (course) map.set(course.courseId, course)
    })
    return map
  }, [courseQueries])
  const categoryNameById = useMemo(() => {
    return categories.reduce<Record<number, string>>((acc, category: CategoryResponse) => {
      acc[category.id] = categoryLabel(category)
      return acc
    }, {})
  }, [categories])

  const completedCount = enrollments.filter((enrollment) => enrollment.isCompleted).length
  const reviewByCourseId = useMemo(() => {
    const map = new Map<string, ReviewResponse>()
    ;(myReviewsData?.content || [])
      .filter((review) => review.targetType === ReviewTargetType.COURSE)
      .forEach((review) => map.set(review.targetId, review))
    return map
  }, [myReviewsData])
  const averageProgress =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, enrollment) => sum + (enrollment.progressPercent || 0), 0) / enrollments.length)
      : 0

  const viewCertificate = async (enrollmentId: string) => {
    try {
      setViewingCertificateId(enrollmentId)
      const { blob } = await courseApi.downloadCertificate(enrollmentId)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 30000)
    } finally {
      setViewingCertificateId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Học tập của tôi</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Tất cả các khóa học và tài liệu bạn đã đăng ký đều có ở đây, bao gồm cả tài nguyên đã lưu trữ.
          </p>
        </div>
        <Link
          to="/courses"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 sm:h-auto sm:py-2"
        >
          Khám phá khóa học
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Đã đăng ký" value={enrollments.length.toString()} />
        <StatCard label="Đã hoàn thành" value={completedCount.toString()} />
        <StatCard label="Tiến độ trung bình" value={`${averageProgress}%`} />
      </div>

      {enrollments.length > 0 && (
        <div className="space-y-5">
          <CourseRow title="Khóa học mới nhất" enrollments={latestEnrollments} courseById={courseById} categoryNameById={categoryNameById} />
          <CourseRow title="Học gần đây" enrollments={recentlyLearned} courseById={courseById} categoryNameById={categoryNameById} />
        </div>
      )}

      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Chưa có tài nguyên nào</h3>
          <p className="mb-6 max-w-sm text-sm font-medium text-slate-500">
            Hãy khám phá thị trường và đăng ký một khóa học hoặc tài liệu để bắt đầu học.
          </p>
          <Link
            to="/courses"
            className="rounded-xl border border-slate-200 bg-white px-6 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          >
            Xem thị trường
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedEnrollments.map((enrollment) => {
            const course = courseById.get(enrollment.courseId)
            const archived = course?.status === CourseStatus.ARCHIVED
            const isDocumentProduct = course?.productType === CourseProductType.DOCUMENT
            const progress = Math.min(Math.max(enrollment.progressPercent || 0, 0), 100)
            const canViewCertificate = enrollment.isCompleted && progress >= 100 && course?.isCertificate
            const canReview = enrollment.isCompleted && progress >= 100
            const existingReview = reviewByCourseId.get(enrollment.courseId)
            const domainName = course?.categoryId ? categoryNameById[course.categoryId] : ''

            return (
              <div
                key={enrollment.id}
                className="group relative flex min-h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-900"
              >
                <div className={`relative aspect-[16/9] ${isDocumentProduct ? 'bg-amber-50' : 'bg-indigo-50'} dark:bg-slate-900`}>
                  {course?.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      {isDocumentProduct ? (
                        <FileText className="h-10 w-10 text-amber-300" />
                      ) : (
                        <BookOpen className="h-10 w-10 text-indigo-300" />
                      )}
                    </div>
                  )}
                  {archived && (
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-white">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Đã lưu trữ
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-3 min-w-0">
                    <h3 className="line-clamp-2 text-base font-black leading-5 text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                      {course?.title || enrollment.courseTitle}
                    </h3>
                    {course?.instructorName && (
                      <p className="mt-1 text-xs font-bold text-slate-500">Bởi {course.instructorName}</p>
                    )}
                    <CourseMetadata domainName={domainName} skills={course?.skills || []} />
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Đã đăng ký {new Date(enrollment.enrolledAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {enrollment.isCompleted && (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Award className="h-3.5 w-3.5" />
                          <span>Đã hoàn thành</span>
                        </div>
                      )}
                    </div>
                  </div>

                    {archived && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                      {isDocumentProduct ? 'Tài liệu' : 'Khóa học'} này đã bị lưu trữ. Bạn vẫn có thể truy cập từ thư viện của mình.
                    </div>
                    )}

                  <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 dark:text-slate-400">Tiến độ học</span>
                      <span className="text-indigo-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className={`grid gap-2 ${canViewCertificate || canReview ? 'sm:grid-cols-2' : ''}`}>
                      <Link
                        to={`/courses/${enrollment.courseId}/learn`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white transition hover:bg-indigo-600 dark:bg-indigo-900 dark:hover:bg-indigo-800"
                      >
                        {isDocumentProduct ? <Eye className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                        {isDocumentProduct ? 'Xem tài liệu' : progress > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
                      </Link>
                      {canViewCertificate && (
                        <button
                          type="button"
                          onClick={() => viewCertificate(enrollment.id)}
                          disabled={viewingCertificateId === enrollment.id}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                        >
                          {viewingCertificateId === enrollment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          Xem chứng chỉ
                        </button>
                      )}
                      {canReview && (
                        <button
                          type="button"
                          onClick={() => setReviewingCourseId(enrollment.courseId)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                        >
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          {existingReview ? 'Sửa đánh giá' : `Đánh giá ${isDocumentProduct ? 'tài liệu' : 'khóa học'}`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {reviewingCourseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white p-2 shadow-2xl dark:bg-slate-950">
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => setReviewingCourseId(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close review form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ReviewForm
              targetType={ReviewTargetType.COURSE}
              targetId={reviewingCourseId}
              initialReview={reviewByCourseId.get(reviewingCourseId)}
              onClose={() => setReviewingCourseId(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function CourseRow({
  title,
  enrollments,
  courseById,
  categoryNameById,
}: {
  title: string
  enrollments: Array<{
    id: string
    courseId: string
    courseTitle: string
    progressPercent: number
    enrolledAt: string
    lastAccessedAt?: string
  }>
  courseById: Map<string, CourseResponse>
  categoryNameById: Record<number, string>
}) {
  if (enrollments.length === 0) return null
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {enrollments.map((enrollment) => (
          <CompactCourseCard
            key={`${title}-${enrollment.id}`}
            enrollment={enrollment}
            course={courseById.get(enrollment.courseId)}
            categoryNameById={categoryNameById}
          />
        ))}
      </div>
    </section>
  )
}

function CompactCourseCard({
  enrollment,
  course,
  categoryNameById,
}: {
  enrollment: {
    courseId: string
    courseTitle: string
    progressPercent: number
    enrolledAt: string
    lastAccessedAt?: string
  }
  course?: CourseResponse
  categoryNameById: Record<number, string>
}) {
  const isDocumentProduct = course?.productType === CourseProductType.DOCUMENT
  const progress = Math.min(Math.max(enrollment.progressPercent || 0, 0), 100)
  const title = course?.title || enrollment.courseTitle
  const domainName = course?.categoryId ? categoryNameById[course.categoryId] : ''

  return (
    <Link
      to={`/courses/${enrollment.courseId}/learn`}
      className="group w-56 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
    >
      <div className={`relative aspect-[16/9] ${isDocumentProduct ? 'bg-amber-50' : 'bg-indigo-50'} dark:bg-slate-900`}>
        {course?.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {isDocumentProduct ? (
              <FileText className="h-9 w-9 text-amber-300" />
            ) : (
              <BookOpen className="h-9 w-9 text-indigo-300" />
            )}
          </div>
        )}
        <span className={`absolute right-2 top-2 rounded-lg px-2 py-1 text-[10px] font-black ${isDocumentProduct ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
          {isDocumentProduct ? 'Tài liệu' : 'Khóa học'}
        </span>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-slate-900 group-hover:text-indigo-700 dark:text-white">
          {title}
        </h3>
        <p className="mt-1 text-[11px] font-semibold text-slate-500">
          {enrollment.lastAccessedAt ? `Học lần cuối ${new Date(enrollment.lastAccessedAt).toLocaleDateString('vi-VN')}` : `Đã đăng ký ${new Date(enrollment.enrolledAt).toLocaleDateString('vi-VN')}`}
        </p>
        <CourseMetadata domainName={domainName} skills={course?.skills || []} compact />
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] font-bold text-slate-500">
            <span>Tiến độ</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
            <div className="h-full bg-indigo-600" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </Link>
  )
}

function CourseMetadata({ domainName, skills, compact = false }: { domainName?: string; skills: string[]; compact?: boolean }) {
  if (!domainName && skills.length === 0) return null
  return (
    <div className={compact ? 'mt-2 space-y-1.5' : 'mt-2 space-y-2'}>
      {domainName && (
        <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          <Tag className="h-3 w-3 shrink-0 text-slate-400" />
          <span className="truncate">{domainName}</span>
        </div>
      )}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, compact ? 2 : 3).map((skill) => (
            <span key={skill} className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
              {skill}
            </span>
          ))}
          {skills.length > (compact ? 2 : 3) && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-900">
              +{skills.length - (compact ? 2 : 3)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
