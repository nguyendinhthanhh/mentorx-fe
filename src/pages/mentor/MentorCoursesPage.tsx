import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { courseApi } from '@/api/courseApi'
import { useAuthStore } from '@/store/authStore'
import { CourseResponse, CourseStatus } from '@/types'
import { Archive, BookOpen, Loader2, Plus, Send, Trash2, X } from 'lucide-react'

type CourseAction = 'delete' | 'archive'

type ConfirmAction = {
  type: CourseAction
  courseId: string
  courseTitle: string
} | null

export default function MentorCoursesPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

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
                      onClick={() => requestAction('delete', course)}
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
                    onClick={() => requestAction('archive', course)}
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

      <CourseActionDialog
        action={confirmAction}
        loading={actionLoading}
        onOpenChange={(open) => {
          if (!open && !actionLoading) setConfirmAction(null)
        }}
        onConfirm={confirmCourseAction}
      />
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
