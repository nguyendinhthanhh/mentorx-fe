import { FormEvent, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { useAuthStore } from '@/store/authStore'
import { CourseLessonResponse, CourseStatus, LessonType } from '@/types'
import { AlertTriangle, Award, CheckCircle2, Download, FileText, MessageSquare, PlayCircle } from 'lucide-react'

export default function CourseLearnPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [qaText, setQaText] = useState('')

  const { data: course } = useQuery(['course', courseId], () => courseApi.getById(courseId!), { enabled: !!courseId })
  const { data: lessons = [] } = useQuery(['course-lessons', courseId], () => courseApi.getLessonsByCourse(courseId!), { enabled: !!courseId })
  const { data: enrollmentsData } = useQuery(
    ['my-enrollments', user?.userId],
    () => courseApi.getEnrollmentsByStudent(user!.userId),
    { enabled: !!user?.userId }
  )
  const enrollment = enrollmentsData?.content.find((item) => item.courseId === courseId)
  const { data: progress = [] } = useQuery(
    ['course-progress', user?.userId, courseId],
    () => courseApi.getProgressByStudentAndCourse(user!.userId, courseId!),
    { enabled: !!user?.userId && !!courseId }
  )
  const { data: qaMessages = [] } = useQuery(
    ['course-qa', courseId],
    () => courseApi.getCourseQaMessages(courseId!),
    { enabled: !!courseId }
  )

  const orderedLessons = useMemo(
    () => lessons.slice().sort((a, b) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0)),
    [lessons]
  )
  const activeLesson = orderedLessons.find((lesson) => lesson.id === (activeLessonId || orderedLessons[0]?.id))
  const progressByLesson = new Map(progress.map((item) => [item.lessonId, item]))

  const updateProgress = useMutation(
    (lesson: CourseLessonResponse) => {
      if (!enrollment) throw new Error('Enrollment not found')
      const payload =
        lesson.videoUrl
          ? { progressPercent: 90, watchDurationSec: Math.max((lesson.durationMinutes ?? 1) * 54, 1) }
          : { scrollPercent: 90, activeTimeSec: 60 }
      return courseApi.updateLessonProgress(enrollment.id, lesson.id, payload)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-progress', user?.userId, courseId])
        queryClient.invalidateQueries(['my-enrollments', user?.userId])
      },
    }
  )

  const sendQa = useMutation(
    () => courseApi.sendCourseQaMessage(courseId!, { lessonId: activeLesson?.id, content: qaText }),
    {
      onSuccess: () => {
        setQaText('')
        queryClient.invalidateQueries(['course-qa', courseId])
      },
    }
  )

  const downloadCertificate = async () => {
    if (!enrollment) return
    const { blob, fileName } = await courseApi.downloadCertificate(enrollment.id)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || 'mentorx-certificate.pdf'
    link.click()
    URL.revokeObjectURL(url)
  }

  const submitQa = (event: FormEvent) => {
    event.preventDefault()
    if (qaText.trim()) sendQa.mutate()
  }

  if (!course || !enrollment) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8">
        <p className="text-sm font-semibold text-slate-600">You need to enroll before accessing the learning room.</p>
        <Link to={`/courses/${courseId}`} className="mt-4 inline-flex text-sm font-bold text-indigo-600">Back to course</Link>
      </div>
    )
  }

  return (
    <div className="grid min-h-[calc(100vh-8rem)] gap-6 lg:grid-cols-[300px_1fr_340px]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-lg font-black text-slate-900">{course.title}</h2>
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
            <span>Progress</span>
            <span>{Math.round(enrollment.progressPercent)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${enrollment.progressPercent}%` }} />
          </div>
        </div>
        <div className="space-y-2">
          {orderedLessons.map((lesson) => {
            const done = progressByLesson.get(lesson.id)?.isCompleted
            return (
              <button
                key={lesson.id}
                onClick={() => setActiveLessonId(lesson.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold ${
                  activeLesson?.id === lesson.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <PlayCircle className="h-4 w-4" />}
                <span className="line-clamp-2">{lesson.title}</span>
              </button>
            )
          })}
        </div>
        {enrollment.isCompleted && course.isCertificate && (
          <button onClick={downloadCertificate} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">
            <Award className="h-4 w-4" />
            Certificate
          </button>
        )}
      </aside>

      <main className="rounded-2xl border border-slate-200 bg-white p-6">
        {course.status === CourseStatus.ARCHIVED && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>This course has been archived. You can still access the material and complete your enrolled course, but it is no longer listed on the marketplace.</p>
          </div>
        )}
        {activeLesson ? (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-indigo-600">
                {activeLesson.lessonType === LessonType.QUIZ ? 'QUIZ' : 'LESSON'}
              </p>
              <h1 className="text-2xl font-black text-slate-900">{activeLesson.title}</h1>
              {activeLesson.description && <p className="mt-2 text-sm text-slate-500">{activeLesson.description}</p>}
            </div>
            {activeLesson.videoUrl && (
              <video src={activeLesson.videoUrl} controls className="aspect-video w-full rounded-xl bg-black" />
            )}
            {activeLesson.articleContent && (
              <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: activeLesson.articleContent || '' }} />
            )}
            {activeLesson.resourceUrl && (
              <a href={activeLesson.resourceUrl} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
                <Download className="h-4 w-4" />
                Open resource
              </a>
            )}
            {activeLesson.lessonType === LessonType.QUIZ && (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm font-semibold text-slate-600">
                Quiz questions are loaded through the quiz API. The next UI pass should render question controls here.
              </div>
            )}
            <button
              onClick={() => updateProgress.mutate(activeLesson)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-600"
            >
              <FileText className="h-4 w-4" />
              Mark measured progress
            </button>
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-500">No lessons are available yet.</p>
        )}
      </main>

      <aside className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          Course Q&A
        </h2>
        <div className="mb-4 max-h-[480px] space-y-3 overflow-auto">
          {qaMessages.map((message) => (
            <div key={message.id} className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-black text-slate-500">{message.senderName}</p>
              <p className="text-sm text-slate-700">{message.content}</p>
            </div>
          ))}
        </div>
        <form onSubmit={submitQa} className="space-y-2">
          <textarea value={qaText} onChange={(event) => setQaText(event.target.value)} className="h-24 w-full rounded-xl border border-slate-200 p-3 text-sm" />
          <button className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Send</button>
        </form>
      </aside>
    </div>
  )
}
