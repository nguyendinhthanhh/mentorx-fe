import { useQuery } from 'react-query'
import { useAuthStore } from '@/store/authStore'
import { courseApi } from '@/api/courseApi'
import { BookOpen, Clock, Award, PlayCircle, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function MyCoursesPage() {
  const { user } = useAuthStore()

  const { data: enrollmentsData, isLoading } = useQuery(
    ['my-enrollments', user?.userId],
    () => courseApi.getEnrollmentsByStudent(user!.userId),
    { enabled: !!user?.userId }
  )

  const enrollments = enrollmentsData?.content || []

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Khóa học của tôi</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Bạn đang tham gia {enrollments.length} khóa học
          </p>
        </div>
        <Link
          to="/courses"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          Khám phá thêm
        </Link>
      </div>

      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Chưa có khóa học nào</h3>
          <p className="mb-6 max-w-sm text-sm font-medium text-slate-500">
            Bạn chưa đăng ký khóa học nào. Hãy khám phá kho tàng kiến thức từ các chuyên gia hàng đầu.
          </p>
          <Link
            to="/courses"
            className="rounded-xl border border-slate-200 bg-white px-6 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          >
            Xem danh sách khóa học
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-900"
            >
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-lg font-black text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                      {enrollment.courseTitle}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Đã tham gia {new Date(enrollment.enrolledAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {enrollment.isCompleted && (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Award className="h-3.5 w-3.5" />
                          <span>Đã hoàn thành</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Tiến độ học tập</span>
                    <span className="text-indigo-600">{Math.round(enrollment.progressPercent)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${enrollment.progressPercent}%` }}
                    />
                  </div>
                  <Link
                    to={`/courses/${enrollment.courseId}/learn`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-600 dark:bg-indigo-900 dark:hover:bg-indigo-800"
                  >
                    <PlayCircle className="h-4 w-4" />
                    {enrollment.progressPercent > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
