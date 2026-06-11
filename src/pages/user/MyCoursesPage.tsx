import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueries, useQuery } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { useAuthStore } from '@/store/authStore'
import { CourseResponse, CourseStatus } from '@/types'
import { AlertTriangle, Award, BookOpen, Clock, Eye, Loader2, PlayCircle } from 'lucide-react'

export default function MyCoursesPage() {
  const { user } = useAuthStore()
  const [viewingCertificateId, setViewingCertificateId] = useState<string | null>(null)

  const { data: enrollmentsData, isLoading } = useQuery(
    ['my-enrollments', user?.userId],
    () => courseApi.getEnrollmentsByStudent(user!.userId, { page: 0, size: 100 }),
    { enabled: !!user?.userId }
  )

  const enrollments = enrollmentsData?.content || []
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

  const completedCount = enrollments.filter((enrollment) => enrollment.isCompleted).length
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">My learning</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            All courses you have enrolled in are available here, including archived courses.
          </p>
        </div>
        <Link
          to="/courses"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          Explore courses
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Enrolled" value={enrollments.length.toString()} />
        <StatCard label="Completed" value={completedCount.toString()} />
        <StatCard label="Average progress" value={`${averageProgress}%`} />
      </div>

      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">No enrolled courses yet</h3>
          <p className="mb-6 max-w-sm text-sm font-medium text-slate-500">
            Browse the marketplace and enroll in a course to start learning.
          </p>
          <Link
            to="/courses"
            className="rounded-xl border border-slate-200 bg-white px-6 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          >
            View marketplace
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {enrollments.map((enrollment) => {
            const course = courseById.get(enrollment.courseId)
            const archived = course?.status === CourseStatus.ARCHIVED
            const progress = Math.min(Math.max(enrollment.progressPercent || 0, 0), 100)
            const canViewCertificate = enrollment.isCompleted && progress >= 100 && course?.isCertificate

            return (
              <div
                key={enrollment.id}
                className="group relative flex min-h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-900"
              >
                <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-900">
                  {course?.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <BookOpen className="h-10 w-10" />
                    </div>
                  )}
                  {archived && (
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-white">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Archived
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-4 min-w-0">
                    <h3 className="truncate text-lg font-black text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                      {course?.title || enrollment.courseTitle}
                    </h3>
                    {course?.instructorName && (
                      <p className="mt-1 text-xs font-bold text-slate-500">By {course.instructorName}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                      </div>
                      {enrollment.isCompleted && (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Award className="h-3.5 w-3.5" />
                          <span>Completed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {archived && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                      This course has been archived. You can still finish it from your library.
                    </div>
                  )}

                  <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 dark:text-slate-400">Learning progress</span>
                      <span className="text-indigo-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className={`grid gap-2 ${canViewCertificate ? 'sm:grid-cols-2' : ''}`}>
                      <Link
                        to={`/courses/${enrollment.courseId}/learn`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-600 dark:bg-indigo-900 dark:hover:bg-indigo-800"
                      >
                        <PlayCircle className="h-4 w-4" />
                        {progress > 0 ? 'Continue learning' : 'Start learning'}
                      </Link>
                      {canViewCertificate && (
                        <button
                          type="button"
                          onClick={() => viewCertificate(enrollment.id)}
                          disabled={viewingCertificateId === enrollment.id}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                        >
                          {viewingCertificateId === enrollment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          View certificate
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
