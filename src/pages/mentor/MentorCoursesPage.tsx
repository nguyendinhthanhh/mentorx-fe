import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { useAuthStore } from '@/store/authStore'
import { CourseStatus } from '@/types'
import { Archive, BookOpen, Plus, Send, Trash2 } from 'lucide-react'

export default function MentorCoursesPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(
    ['mentor-courses', user?.userId],
    () => courseApi.getByInstructor(user!.userId, { page: 0, size: 50 }),
    { enabled: !!user?.userId }
  )

  const submitMutation = useMutation((courseId: string) => courseApi.submitForReview(courseId), {
    onSuccess: () => queryClient.invalidateQueries(['mentor-courses', user?.userId]),
  })

  const deleteMutation = useMutation((courseId: string) => courseApi.delete(courseId), {
    onSuccess: () => queryClient.invalidateQueries(['mentor-courses', user?.userId]),
  })

  const archiveMutation = useMutation((courseId: string) => courseApi.archive(courseId), {
    onSuccess: () => queryClient.invalidateQueries(['mentor-courses', user?.userId]),
  })

  const getCourseId = (course: { courseId?: string; id?: string }) => course.courseId || course.id || ''

  const handleDelete = (courseId: string) => {
    if (window.confirm('Delete this draft course? This cannot be undone.')) {
      deleteMutation.mutate(courseId)
    }
  }

  const handleArchive = (courseId: string) => {
    if (window.confirm('Archive this published course? Students will no longer see it in published listings.')) {
      archiveMutation.mutate(courseId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Courses</h1>
          <p className="text-sm font-medium text-slate-500">Create, manage, and submit courses for admin review.</p>
        </div>
        <Link to="/courses/create" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">
          <Plus className="h-4 w-4" />
          New Course
        </Link>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500">Loading courses...</div>
        ) : (
          data?.content.map((course) => (
            <div key={getCourseId(course)} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900">{course.title}</h2>
                  <p className="text-xs font-bold text-slate-500">{course.status}</p>
                  {course.rejectionReason && <p className="text-xs font-semibold text-rose-600">{course.rejectionReason}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/mentor/courses/${getCourseId(course)}/manage`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
                  Manage
                </Link>
                {(course.status === CourseStatus.DRAFT || course.status === CourseStatus.REJECTED) && (
                  <>
                    <button
                      onClick={() => handleDelete(getCourseId(course))}
                      disabled={deleteMutation.isLoading}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                    <button
                      onClick={() => submitMutation.mutate(getCourseId(course))}
                      disabled={submitMutation.isLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
                    >
                      <Send className="h-4 w-4" />
                      Submit
                    </button>
                  </>
                )}
                {course.status === CourseStatus.PUBLISHED && (
                  <button
                    onClick={() => handleArchive(getCourseId(course))}
                    disabled={archiveMutation.isLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
