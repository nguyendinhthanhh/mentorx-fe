import { FormEvent, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import { courseApi } from '@/api/courseApi'
import CourseNameConfirmModal from '@/components/course/CourseNameConfirmModal'
import { CourseLessonResponse, CourseProductType, CourseStatus, LessonType, QuizQuestionResponse, QuizQuestionType } from '@/types'
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Globe,
  Loader2,
  PlayCircle,
  Star,
  XCircle,
} from 'lucide-react'

type AnswerData = {
  options?: string[]
  correctAnswers?: string[]
  correctAnswer?: string
}

type ReviewTab = 'info' | 'content'

export default function AdminCourseReviewPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ReviewTab>('info')
  const [denyOpen, setDenyOpen] = useState(false)
  const [denyReason, setDenyReason] = useState('')
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)

  const { data: course, isLoading: isCourseLoading } = useQuery(
    ['admin-course-review', courseId],
    () => courseApi.getById(courseId!),
    { enabled: !!courseId }
  )
  const { data: sections = [] } = useQuery(
    ['admin-course-review-sections', courseId],
    () => courseApi.getSections(courseId!),
    { enabled: !!courseId }
  )
  const { data: lessons = [], isLoading: isLessonsLoading } = useQuery(
    ['admin-course-review-lessons', courseId],
    () => courseApi.getLessonsByCourse(courseId!),
    { enabled: !!courseId }
  )

  const orderedLessons = useMemo(
    () => lessons.slice().sort((a, b) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0)),
    [lessons]
  )
  const activeLesson = orderedLessons.find((lesson) => lesson.id === (activeLessonId || orderedLessons[0]?.id))
  const activeSection = sections.find((section) => section.id === activeSectionId) || null
  const isDocumentProduct = course?.productType === CourseProductType.DOCUMENT

  const { data: quizQuestions = [], isLoading: isQuizLoading } = useQuery(
    ['admin-course-review-quiz', activeLesson?.id],
    () => courseApi.getQuizQuestions(activeLesson!.id),
    { enabled: activeLesson?.lessonType === LessonType.QUIZ }
  )

  const lessonsBySection = useMemo(() => {
    if (!sections.length) {
      return [{ section: undefined, lessons: orderedLessons }]
    }
    const grouped = new Map<string, CourseLessonResponse[]>()
    sections.forEach((section) => grouped.set(section.id, []))
    orderedLessons.forEach((lesson) => {
      const bucket = grouped.get(lesson.sectionId)
      if (bucket) bucket.push(lesson)
    })
    return sections.map((section) => ({
      section,
      lessons: grouped.get(section.id) || [],
    }))
  }, [orderedLessons, sections])

  const updateStatus = useMutation(
    ({ status, reason }: { status: CourseStatus; reason?: string }) =>
      courseApi.updateStatus(courseId!, status, reason),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries('admin-courses')
        queryClient.invalidateQueries(['admin-course-review', courseId])
        toast.success(variables.status === CourseStatus.PUBLISHED ? 'Course approved' : 'Course returned to draft')
        if (variables.status === CourseStatus.DRAFT) {
          setDenyOpen(false)
          setDenyReason('')
        }
      },
    }
  )

  const archiveCourse = useMutation(() => courseApi.archive(courseId!), {
    onSuccess: () => {
      queryClient.invalidateQueries('admin-courses')
      queryClient.invalidateQueries(['admin-course-review', courseId])
      toast.success('Course archived')
      setArchiveConfirmOpen(false)
    },
  })

  const submitDeny = (event: FormEvent) => {
    event.preventDefault()
    const reason = denyReason.trim()
    if (!reason) {
      toast.error('Add a reason before returning the course to draft')
      return
    }
    updateStatus.mutate({ status: CourseStatus.DRAFT, reason })
  }

  const materialLoading = isCourseLoading || isLessonsLoading

  if (materialLoading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-bold text-slate-500">Loading course material...</div>
  }

  if (!course) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-bold text-slate-600">Product not found.</p>
        <Link to="/admin/courses" className="mt-4 inline-flex text-sm font-black text-indigo-600">Back to courses</Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <button onClick={() => navigate('/admin/courses')} className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Back to courses
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">{course.title}</h1>
            <StatusBadge status={course.status} />
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {isDocumentProduct ? 'Document' : 'Course'} by {course.instructorName || course.instructor?.fullName || 'Unknown instructor'}
          </p>
          {course.rejectionReason && (
            <div className="mt-3 flex max-w-3xl items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{course.rejectionReason}</span>
            </div>
          )}
          {course.status === CourseStatus.ARCHIVED && (
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-600">
              Archived courses are read-only
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {course.status === CourseStatus.PENDING_REVIEW && (
            <button
              onClick={() => updateStatus.mutate({ status: CourseStatus.PUBLISHED })}
              disabled={updateStatus.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {updateStatus.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Approve
            </button>
          )}
          {course.status === CourseStatus.PENDING_REVIEW && (
            <button
              onClick={() => setDenyOpen(true)}
              disabled={updateStatus.isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-black text-rose-600 hover:bg-rose-50 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              Deny
            </button>
          )}
          {course.status === CourseStatus.PUBLISHED && (
            <button
              onClick={() => setArchiveConfirmOpen(true)}
              disabled={archiveCourse.isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {archiveCourse.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
              Archive
            </button>
          )}
        </div>
      </div>

      <div className="flex rounded-2xl border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-black ${activeTab === 'info' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {isDocumentProduct ? 'Document info' : 'Course info'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-black ${activeTab === 'content' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {isDocumentProduct ? 'Document file' : 'Course content'}
        </button>
      </div>

      {activeTab === 'info' && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid gap-0 lg:grid-cols-[420px_1fr]">
          <div className="bg-slate-100">
            {course.previewVideoUrl ? (
              <video src={course.previewVideoUrl} controls className="aspect-video h-full w-full bg-black object-cover" />
            ) : course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title} className="aspect-video h-full w-full object-cover" />
            ) : (
              <div className="flex aspect-video h-full w-full items-center justify-center text-slate-400">
                <BookOpen className="h-14 w-14" />
              </div>
            )}
          </div>
          <div className="space-y-5 p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-indigo-600">{isDocumentProduct ? 'Document overview' : 'Course overview'}</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">{course.title}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{course.description || 'No description provided.'}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <OverviewMetric icon={<Star className="h-4 w-4" />} label="Price" value={course.priceMxc ? `${course.priceMxc} MXC` : 'Free'} />
              <OverviewMetric icon={<Globe className="h-4 w-4" />} label="Language" value={course.language || 'Not set'} />
              <OverviewMetric icon={<BookOpen className="h-4 w-4" />} label="Level" value={course.level || 'Not set'} />
              <OverviewMetric icon={<Award className="h-4 w-4" />} label="Certificate" value={isDocumentProduct ? 'Not applicable' : course.isCertificate ? 'Included' : 'No'} />
            </div>
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Skills</p>
              <div className="flex flex-wrap gap-2">
                {(course.skills || []).length > 0 ? (
                  course.skills?.map((skill) => (
                    <span key={skill} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">{skill}</span>
                  ))
                ) : (
                  <span className="text-sm font-semibold text-slate-400">No skill labels available.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>}

      {activeTab === 'content' && <div className="grid min-h-[calc(100vh-15rem)] gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-400">{isDocumentProduct ? 'Document Material' : 'Course Material'}</h2>
          <div className="space-y-4">
            {lessonsBySection.map(({ section, lessons: sectionLessons }, index) => (
              <div key={section?.id || `section-${index}`}>
                <div className="mb-2 rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-sm font-black text-slate-900">{section?.title || `Section ${index + 1}`}</p>
                  {section?.description && <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500">{section.description}</p>}
                  {section && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSectionId(section.id)
                        setActiveLessonId(null)
                      }}
                      className="mt-2 text-xs font-black text-indigo-600 hover:text-indigo-700"
                    >
                      View summary
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {sectionLessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        setActiveLessonId(lesson.id)
                        setActiveSectionId(null)
                      }}
                      className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                        activeLesson?.id === lesson.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {lesson.lessonType === LessonType.QUIZ ? <CheckCircle className="mt-0.5 h-4 w-4" /> : lesson.lessonType === LessonType.DOCUMENT ? <FileText className="mt-0.5 h-4 w-4" /> : <PlayCircle className="mt-0.5 h-4 w-4" />}
                      <span className="line-clamp-2">{lesson.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6">
          {activeSection && !activeLessonId ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Section summary</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">{activeSection.title}</h2>
                <p className="mt-2 text-sm font-medium text-slate-600">{activeSection.description || 'No section description provided.'}</p>
              </div>
              {(lessonsBySection.find((group) => group.section?.id === activeSection.id)?.lessons || []).map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => {
                    setActiveLessonId(lesson.id)
                    setActiveSectionId(null)
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <span className="text-sm font-black text-slate-900">{lesson.title}</span>
                  <span className="text-xs font-bold text-slate-500">{lesson.lessonType === LessonType.QUIZ ? 'Quiz' : lesson.lessonType === LessonType.DOCUMENT ? 'Document' : 'Lesson'}</span>
                </button>
              ))}
            </div>
          ) : activeLesson ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-indigo-600">
                  {activeLesson.lessonType === LessonType.QUIZ ? 'Quiz' : activeLesson.lessonType === LessonType.DOCUMENT ? 'Document' : 'Lesson'}
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">{activeLesson.title}</h2>
                {activeLesson.description && <p className="mt-2 text-sm font-medium text-slate-500">{activeLesson.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                  {activeLesson.durationMinutes ? <Pill icon={<Clock className="h-3.5 w-3.5" />} label={`${activeLesson.durationMinutes} min`} /> : null}
                  <Pill icon={<BookOpen className="h-3.5 w-3.5" />} label={activeLesson.isPublished === false ? 'Unpublished' : 'Published'} />
                </div>
              </div>

              {activeLesson.videoUrl && <video src={activeLesson.videoUrl} controls className="aspect-video w-full rounded-xl bg-black" />}
              {activeLesson.articleContent && <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: activeLesson.articleContent }} />}
              {activeLesson.resourceUrl && (
                <AdminResourcePanel lesson={activeLesson} />
              )}

              {activeLesson.lessonType === LessonType.QUIZ && (
                <QuizPreview
                  questions={quizQuestions}
                  loading={isQuizLoading}
                  passingPercent={readPassingPercent(activeLesson.metadata)}
                />
              )}
            </div>
          ) : (
            <p className="text-sm font-bold text-slate-500">No lessons have been added to this course.</p>
          )}
        </main>
      </div>}

      {denyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form onSubmit={submitDeny} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-slate-900">Return {isDocumentProduct ? 'document' : 'course'} to draft</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">This reason will be visible to the mentor so they can revise the {isDocumentProduct ? 'document' : 'course'}.</p>
            <textarea
              value={denyReason}
              onChange={(event) => setDenyReason(event.target.value)}
              className="mt-5 h-32 w-full rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              placeholder="Explain what needs to be fixed..."
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDenyOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
                Cancel
              </button>
              <button type="submit" disabled={updateStatus.isLoading} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                {updateStatus.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Deny
              </button>
            </div>
          </form>
        </div>
      )}

      <CourseNameConfirmModal
        isOpen={archiveConfirmOpen}
        courseName={course.title}
        title={`Archive ${isDocumentProduct ? 'document' : 'course'}?`}
        message="This product will leave the marketplace. Enrolled learners can still access it from their library."
        confirmText="Archive Course"
        confirmTone="slate"
        isLoading={archiveCourse.isLoading}
        onClose={() => {
          if (!archiveCourse.isLoading) setArchiveConfirmOpen(false)
        }}
        onConfirm={() => archiveCourse.mutate()}
      />
    </div>
  )
}

function QuizPreview({ questions, loading, passingPercent }: { questions: QuizQuestionResponse[]; loading: boolean; passingPercent: number }) {
  if (loading) {
    return <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm font-bold text-slate-500">Loading quiz questions...</div>
  }
  if (!questions.length) {
    return <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm font-bold text-slate-500">No quiz questions have been added.</div>
  }
  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
        Quiz questions and correct answers for review. Passing score: {passingPercent}%.
      </p>
      {questions
        .slice()
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .map((question, index) => (
          <div key={question.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Question {index + 1}</p>
                <RichContent className="mt-1 font-black text-slate-900" html={question.questionText} />
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{question.points || 1} pt</span>
            </div>
            <QuestionAnswer question={question} />
            {question.explanation && <p className="mt-3 rounded-lg bg-indigo-50 p-3 text-sm font-semibold text-indigo-800">{question.explanation}</p>}
          </div>
        ))}
    </div>
  )
}

function QuestionAnswer({ question }: { question: QuizQuestionResponse }) {
  const data = parseAnswerData(question.answerDataJson)
  if (question.questionType === QuizQuestionType.TEXT_ANSWER) {
    return (
      <div className="mt-3 text-sm font-semibold text-slate-600">
        <span>Correct answer: </span>
        <RichContent className="inline-block align-top" html={data.correctAnswer || data.correctAnswers?.[0] || 'Not set'} />
      </div>
    )
  }
  const options = question.questionType === QuizQuestionType.TRUE_FALSE ? ['True', 'False'] : data.options || []
  const correct = new Set(data.correctAnswers || (data.correctAnswer ? [data.correctAnswer] : []))
  return (
    <div className="mt-3 grid gap-2">
      {options.map((option) => (
        <div key={option} className={`rounded-lg border px-3 py-2 text-sm font-bold ${correct.has(option) ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>
          <RichContent html={option} />
        </div>
      ))}
    </div>
  )
}

function RichContent({ html, className = '' }: { html: string; className?: string }) {
  return (
    <div
      className={`prose prose-sm max-w-none [&_img]:my-3 [&_img]:max-h-80 [&_img]:rounded-xl [&_img]:object-contain ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function parseAnswerData(value?: string): AnswerData {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function readPassingPercent(metadata?: Record<string, unknown>) {
  const value = Number(metadata?.passingPercent ?? 50)
  if (!Number.isFinite(value)) return 50
  return Math.min(Math.max(Math.round(value), 0), 100)
}

function StatusBadge({ status }: { status: CourseStatus }) {
  const className =
    status === CourseStatus.PUBLISHED
      ? 'bg-emerald-50 text-emerald-700'
      : status === CourseStatus.PENDING_REVIEW
        ? 'bg-blue-50 text-blue-700'
        : status === CourseStatus.ARCHIVED
          ? 'bg-slate-100 text-slate-700'
          : 'bg-amber-50 text-amber-700'
  return <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${className}`}>{status}</span>
}

function OverviewMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-black text-slate-900">{value}</p>
    </div>
  )
}

function AdminResourcePanel({ lesson }: { lesson: CourseLessonResponse }) {
  const resourceUrl = lesson.resourceUrl || ''
  const fileName = getResourceFileName(resourceUrl)

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Downloadable material</p>
            <p className="truncate text-sm font-black text-slate-900">{fileName}</p>
          </div>
        </div>
        <a
          href={resourceUrl}
          download={fileName}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      </div>
    </section>
  )
}

function getResourceFileName(resourceUrl: string) {
  try {
    const path = new URL(resourceUrl).pathname
    const fileName = decodeURIComponent(path.split('/').filter(Boolean).pop() || '')
    return fileName || 'Course resource'
  } catch {
    const clean = resourceUrl.split(/[?#]/)[0]
    return decodeURIComponent(clean.split('/').filter(Boolean).pop() || 'Course resource')
  }
}

function Pill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
      {icon}
      {label}
    </span>
  )
}
