import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { useAuthStore } from '@/store/authStore'
import {
  CourseLessonResponse,
  CourseSectionResponse,
  CourseStatus,
  LessonProgressResponse,
  LessonType,
  QuizAttemptResponse,
  QuizQuestionResponse,
  QuizQuestionType,
} from '@/types'
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Lock,
  Loader2,
  MessageSquare,
  PlayCircle,
  Send,
  X,
} from 'lucide-react'

type QuizAnswer = string | string[]
type QuizQuestionResult = Record<string, boolean>

type ProgressMutationInput = {
  lesson: CourseLessonResponse
  payload: Partial<LessonProgressResponse>
}

interface LessonGroup {
  section: CourseSectionResponse | null
  lessons: CourseLessonResponse[]
}

export default function CourseLearnPage() {
  const { courseId, sectionId, lessonId } = useParams<{ courseId: string; sectionId?: string; lessonId?: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [qaText, setQaText] = useState('')
  const [quizAnswers, setQuizAnswers] = useState<Record<string, QuizAnswer>>({})
  const [latestAttempt, setLatestAttempt] = useState<QuizAttemptResponse | null>(null)
  const [quizResults, setQuizResults] = useState<QuizQuestionResult>({})
  const [lockedLesson, setLockedLesson] = useState<CourseLessonResponse | null>(null)
  const [viewingCertificate, setViewingCertificate] = useState(false)
  const [authHydrated, setAuthHydrated] = useState(useAuthStore.persist.hasHydrated())
  const articleRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const restoredVideoLessonRef = useRef<string | null>(null)
  const restoredArticleLessonRef = useRef<string | null>(null)
  const lastTrackedVideoPercentRef = useRef<Record<string, number>>({})
  const lastTrackedVideoSecondRef = useRef<Record<string, number>>({})
  const lastTrackedArticlePercentRef = useRef<Record<string, number>>({})

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setAuthHydrated(true)
      return
    }
    return useAuthStore.persist.onFinishHydration(() => setAuthHydrated(true))
  }, [])

  const { data: course, isLoading: courseLoading } = useQuery(
    ['course', courseId],
    () => courseApi.getById(courseId!),
    { enabled: !!courseId }
  )
  const { data: sections = [] } = useQuery(
    ['course-sections-learn', courseId],
    () => courseApi.getPublishedSections(courseId!),
    { enabled: !!courseId }
  )
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery(
    ['course-lessons', courseId],
    () => courseApi.getLessonsByCourse(courseId!),
    { enabled: !!courseId }
  )
  const enrollmentQueryKey = ['course-enrollment', courseId, user?.userId]
  const shouldCheckEnrollment = !!courseId && !!user?.userId
  const { data: enrollment = null, isLoading: enrollmentLoading, isFetched: enrollmentFetched } = useQuery(
    enrollmentQueryKey,
    () => courseApi.getEnrollmentByCourseAndStudent(courseId!, user!.userId),
    { enabled: shouldCheckEnrollment }
  )
  const { data: progress = [] } = useQuery(
    ['course-progress', user?.userId, courseId],
    () => courseApi.getProgressByStudentAndCourse(user!.userId, courseId!),
    { enabled: !!user?.userId && !!courseId && !!enrollment }
  )
  const { data: qaMessages = [] } = useQuery(
    ['course-qa', courseId],
    () => courseApi.getCourseQaMessages(courseId!),
    { enabled: !!courseId && !!enrollment }
  )

  const publishedLessons = useMemo(() => lessons.filter((lesson) => lesson.isPublished !== false), [lessons])
  const lessonGroups = useMemo(() => buildLessonGroups(sections, publishedLessons), [sections, publishedLessons])
  const orderedLessons = useMemo(() => lessonGroups.flatMap((group) => group.lessons), [lessonGroups])
  const enrollmentCheckComplete = !shouldCheckEnrollment || enrollmentFetched
  const isPreviewMode = authHydrated && enrollmentCheckComplete && !enrollment
  const firstPreviewLesson = useMemo(() => orderedLessons.find((lesson) => lesson.isFreePreview), [orderedLessons])
  const activeLesson = orderedLessons.find((lesson) => lesson.id === lessonId)
  const activeLessonLocked = !!activeLesson && isPreviewMode && !activeLesson.isFreePreview
  const activeSection = useMemo(() => {
    if (activeLesson) {
      return sections.find((section) => section.id === activeLesson.sectionId) || null
    }
    return sections.find((section) => section.id === sectionId) || null
  }, [activeLesson, sectionId, sections])
  const activeIndex = activeLesson ? orderedLessons.findIndex((lesson) => lesson.id === activeLesson.id) : -1
  const previousLesson = activeIndex > 0 ? orderedLessons[activeIndex - 1] : null
  const nextLesson = activeIndex >= 0 && activeIndex < orderedLessons.length - 1 ? orderedLessons[activeIndex + 1] : null
  const progressByLesson = useMemo(
    () => new Map(progress.map((item) => [item.lessonId, item])),
    [progress]
  )
  const activeProgress = activeLesson ? progressByLesson.get(activeLesson.id) : undefined

  const { data: quizQuestions = [], isLoading: quizLoading } = useQuery(
    ['quiz-questions-learn', activeLesson?.id],
    () => courseApi.getQuizQuestions(activeLesson!.id),
    { enabled: !!activeLesson?.id && activeLesson.lessonType === LessonType.QUIZ && !activeLessonLocked }
  )

  useEffect(() => {
    if (!courseId || orderedLessons.length === 0) return
    if (lessonId && orderedLessons.some((lesson) => lesson.id === lessonId)) return
    if (sectionId && sections.some((section) => section.id === sectionId)) return

    const rememberedLessonId = enrollment ? window.localStorage.getItem(lastLessonKey(courseId)) : null
    const rememberedLesson = enrollment ? orderedLessons.find((lesson) => lesson.id === rememberedLessonId) : undefined
    const firstIncomplete = enrollment ? orderedLessons.find((lesson) => !progressByLesson.get(lesson.id)?.isCompleted) : undefined
    const previewTarget = !enrollment ? firstPreviewLesson : undefined
    const target = rememberedLesson || firstIncomplete || orderedLessons[0]
    if (previewTarget) {
      navigate(lessonPath(courseId, previewTarget), { replace: true })
      return
    }
    navigate(lessonPath(courseId, target), { replace: true })
  }, [courseId, enrollment, firstPreviewLesson, lessonId, navigate, orderedLessons, progressByLesson, sectionId, sections])

  useEffect(() => {
    if (activeLessonLocked && activeLesson) {
      setLockedLesson(activeLesson)
    }
  }, [activeLesson, activeLessonLocked])

  useEffect(() => {
    if (enrollment) {
      setLockedLesson(null)
    }
  }, [enrollment])

  useEffect(() => {
    if (courseId && enrollment && activeLesson?.lessonType === LessonType.QUIZ) {
      setQuizAnswers(readQuizDraft(courseId, enrollment.id, activeLesson.id))
    } else {
      setQuizAnswers({})
    }
    setLatestAttempt(null)
    setQuizResults({})
    restoredVideoLessonRef.current = null
    restoredArticleLessonRef.current = null
  }, [activeLesson?.id, activeLesson?.lessonType, courseId, enrollment?.id])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !activeLesson || restoredVideoLessonRef.current === activeLesson.id) return
    const lastPosition = activeProgress?.lastPositionSec || 0
    if (lastPosition > 0 && Number.isFinite(video.duration) && video.duration > lastPosition) {
      video.currentTime = lastPosition
      restoredVideoLessonRef.current = activeLesson.id
    }
  }, [activeLesson, activeProgress?.lastPositionSec])

  useEffect(() => {
    if (!courseId || !activeLesson?.id || !enrollment || activeLessonLocked) return
    window.localStorage.setItem(lastLessonKey(courseId), activeLesson.id)
  }, [activeLesson?.id, activeLessonLocked, courseId, enrollment])

  const updateProgress = useMutation(
    ({ lesson, payload }: ProgressMutationInput) => {
      if (!enrollment) throw new Error('Enrollment not found')
      return courseApi.updateLessonProgress(enrollment.id, lesson.id, payload)
    },
    {
      onSuccess: (savedProgress) => {
        queryClient.setQueryData<LessonProgressResponse[]>(
          ['course-progress', user?.userId, courseId],
          (current = []) => {
            const next = current.filter((item) => item.lessonId !== savedProgress.lessonId)
            return [...next, savedProgress]
          }
        )
        if (savedProgress.isCompleted) {
          queryClient.invalidateQueries(enrollmentQueryKey)
          queryClient.invalidateQueries(['my-enrollments', user?.userId])
        }
      },
    }
  )

  const submitQuiz = useMutation(
    () => {
      if (!enrollment || !activeLesson) throw new Error('Quiz cannot be submitted')
      return courseApi.submitQuizAttempt({
        enrollmentId: enrollment.id,
        lessonId: activeLesson.id,
        answers: quizQuestions.map((question) => ({
          questionId: question.id,
          givenAnswerJson: serializeQuizAnswer(question, quizAnswers[question.id] ?? emptyAnswerFor(question.questionType)),
        })),
      })
    },
    {
      onSuccess: (attempt) => {
        setLatestAttempt(attempt)
        setQuizResults(buildQuizResults(quizQuestions, quizAnswers))
        if (attempt.passed && courseId && enrollment && activeLesson) {
          window.localStorage.removeItem(quizDraftKey(courseId, enrollment.id, activeLesson.id))
        }
        queryClient.invalidateQueries(['course-progress', user?.userId, courseId])
        queryClient.invalidateQueries(enrollmentQueryKey)
        queryClient.invalidateQueries(['my-enrollments', user?.userId])
      },
    }
  )

  useEffect(() => {
    if (!activeLesson || !enrollment || activeLesson.lessonType === LessonType.QUIZ) return

    const restoreScroll = window.setTimeout(() => {
      const element = articleRef.current
      if (!element || restoredArticleLessonRef.current === activeLesson.id) return
      const savedPercent = activeProgress?.scrollPercent || 0
      if (savedPercent <= 0) return
      const rect = element.getBoundingClientRect()
      const articleTop = window.scrollY + rect.top
      const targetY = articleTop + (element.scrollHeight * savedPercent) / 100 - window.innerHeight * 0.35
      window.scrollTo({ top: Math.max(targetY, 0), behavior: 'auto' })
      restoredArticleLessonRef.current = activeLesson.id
      lastTrackedArticlePercentRef.current[activeLesson.id] = savedPercent
    }, 120)

    const trackScroll = (force = false) => {
      const element = articleRef.current
      if (!element) return
      const percent = getArticleScrollPercent(element)
      const previous = lastTrackedArticlePercentRef.current[activeLesson.id] ?? activeProgress?.scrollPercent ?? 0
      if (force || percent >= 95 || Math.abs(percent - previous) >= 5) {
        lastTrackedArticlePercentRef.current[activeLesson.id] = percent
        updateProgress.mutate({
          lesson: activeLesson,
          payload: {
            scrollPercent: percent,
            progressPercent: activeLesson.videoUrl ? undefined : percent,
            activeTimeSec: Math.max((activeLesson.durationMinutes ?? 1) * 30, 30),
          },
        })
      }
    }

    const handleScroll = () => trackScroll(false)
    const handleHidden = () => {
      if (document.visibilityState === 'hidden') trackScroll(true)
    }
    const handleBeforeUnload = () => trackScroll(true)

    trackScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    document.addEventListener('visibilitychange', handleHidden)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.clearTimeout(restoreScroll)
      trackScroll(true)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      document.removeEventListener('visibilitychange', handleHidden)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [
    activeLesson?.id,
    activeLesson?.lessonType,
    activeLesson?.videoUrl,
    activeProgress?.scrollPercent,
    enrollment?.id,
  ])

  const sendQa = useMutation(
    () => {
      if (!enrollment) throw new Error('Enrollment required')
      return courseApi.sendCourseQaMessage(courseId!, { lessonId: activeLesson?.id, content: qaText.trim() })
    },
    {
      onSuccess: () => {
        setQaText('')
        queryClient.invalidateQueries(['course-qa', courseId])
      },
    }
  )

  const viewCertificate = async () => {
    if (!enrollment) return
    try {
      setViewingCertificate(true)
      const { blob } = await courseApi.downloadCertificate(enrollment.id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 30000)
    } finally {
      setViewingCertificate(false)
    }
  }

  const downloadResource = async (lesson: CourseLessonResponse) => {
    if (!enrollment) return
    try {
      const { blob, fileName } = await courseApi.downloadLessonDocument(lesson.id)
      downloadBlob(blob, fileName)
      if (lesson.lessonType === LessonType.DOCUMENT) {
        updateProgress.mutate({ lesson, payload: buildCompletionPayload(lesson) })
      }
    } catch {
      if (lesson.resourceUrl) {
        downloadUrl(lesson.resourceUrl, getResourceFileName(lesson.resourceUrl))
        if (lesson.lessonType === LessonType.DOCUMENT) {
          updateProgress.mutate({ lesson, payload: buildCompletionPayload(lesson) })
        }
      }
    }
  }

  const previewResource = async (lesson: CourseLessonResponse) => {
    if (!lesson.isFreePreview) return
    const { blob } = await courseApi.getLessonDocumentPreview(lesson.id)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  const submitQa = (event: FormEvent) => {
    event.preventDefault()
    if (qaText.trim()) sendQa.mutate()
  }

  const selectLesson = (lessonId: string) => {
    const lesson = orderedLessons.find((item) => item.id === lessonId)
    if (lesson && isPreviewMode && !lesson.isFreePreview) {
      setLockedLesson(lesson)
      return
    }
    if (courseId && lesson) {
      navigate(lessonPath(courseId, lesson))
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectSection = (targetSectionId: string) => {
    if (courseId) navigate(sectionPath(courseId, targetSectionId))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const trackVideoProgress = (lesson: CourseLessonResponse, video: HTMLVideoElement, force = false) => {
    if (!enrollment) return
    if (!Number.isFinite(video.duration) || video.duration <= 0) return
    const currentSecond = Math.round(video.currentTime)
    const percent = Math.min(Math.max(Math.round((video.currentTime / video.duration) * 100), 0), 100)
    const previousPercent = lastTrackedVideoPercentRef.current[lesson.id] || 0
    const previousSecond = lastTrackedVideoSecondRef.current[lesson.id] ?? activeProgress?.lastPositionSec ?? 0
    if (force || percent >= 95 || percent - previousPercent >= 5 || Math.abs(currentSecond - previousSecond) >= 5) {
      lastTrackedVideoPercentRef.current[lesson.id] = percent
      lastTrackedVideoSecondRef.current[lesson.id] = currentSecond
      updateProgress.mutate({
        lesson,
        payload: {
          progressPercent: percent,
          watchDurationSec: currentSecond,
          lastPositionSec: currentSecond,
        },
      })
    }
  }

  useEffect(() => {
    if (!activeLesson?.videoUrl || !enrollment) return

    const saveCurrentVideo = () => {
      const video = videoRef.current
      if (video) trackVideoProgress(activeLesson, video, true)
    }
    const handleHidden = () => {
      if (document.visibilityState === 'hidden') saveCurrentVideo()
    }

    document.addEventListener('visibilitychange', handleHidden)
    window.addEventListener('beforeunload', saveCurrentVideo)
    return () => {
      saveCurrentVideo()
      document.removeEventListener('visibilitychange', handleHidden)
      window.removeEventListener('beforeunload', saveCurrentVideo)
    }
  }, [activeLesson?.id, activeLesson?.videoUrl, enrollment?.id])

  const updateQuizAnswer = (questionId: string, answer: QuizAnswer) => {
    setQuizAnswers((current) => {
      const next = { ...current, [questionId]: answer }
      if (courseId && enrollment && activeLesson?.lessonType === LessonType.QUIZ) {
        window.localStorage.setItem(quizDraftKey(courseId, enrollment.id, activeLesson.id), JSON.stringify(next))
      }
      return next
    })
  }

  if (courseLoading || lessonsLoading || !authHydrated || (shouldCheckEnrollment && enrollmentLoading)) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Course not found.
        </p>
        <Link to="/courses" className="mt-4 inline-flex text-sm font-bold text-indigo-600">
          Back to courses
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1)
                  return
                }
                navigate('/profile/courses')
              }}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Mentor X home">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white">MX</span>
              <span className="hidden text-sm font-black text-slate-950 dark:text-white sm:inline">Mentor X</span>
            </Link>
            <div className="hidden min-w-0 border-l border-slate-200 pl-3 dark:border-slate-800 md:block">
              <p className="truncate text-sm font-black text-slate-900 dark:text-white">{course.title}</p>
              <p className="text-xs font-semibold text-slate-500">{isPreviewMode ? 'Course preview' : 'Learning room'}</p>
            </div>
          </div>
          <Link to={isPreviewMode ? `/courses/${courseId}` : '/profile/courses'} className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900">
            {isPreviewMode ? 'Course details' : 'My learning'}
          </Link>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-65px)] gap-6 p-4 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
      <aside className="h-max rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 xl:sticky xl:top-20">
        <div className="mb-4">
          <Link to={isPreviewMode ? `/courses/${courseId}` : '/profile/courses'} className="text-xs font-black uppercase tracking-widest text-indigo-600">
            {isPreviewMode ? 'Preview mode' : 'My learning'}
          </Link>
          <h2 className="mt-1 line-clamp-2 text-lg font-black text-slate-900 dark:text-white">{course.title}</h2>
        </div>

        <div className="mb-5 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
          {isPreviewMode ? (
            <div className="flex items-start gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p>Preview free lessons. Buy the course to unlock progress, Q&A, quizzes, and certificates.</p>
            </div>
          ) : (
            <>
              <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                <span>Progress</span>
                <span>{Math.round(enrollment?.progressPercent || 0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full bg-indigo-600"
                  style={{ width: `${Math.min(Math.max(enrollment?.progressPercent || 0, 0), 100)}%` }}
                />
              </div>
            </>
          )}
        </div>

        {isPreviewMode && !firstPreviewLesson && (
          <div className="mb-5 rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-950">
            This course has no free preview lessons yet.
            <Link to={`/courses/${courseId}`} className="mt-2 block font-black text-indigo-600">Back to course details</Link>
          </div>
        )}

        <div className="max-h-[58vh] space-y-4 overflow-auto pr-1">
          {lessonGroups.map((group, groupIndex) => (
            <div key={group.section?.id || `ungrouped-${groupIndex}`} className="space-y-2">
              <div>
                {group.section ? (
                  <button
                    onClick={() => selectSection(group.section!.id)}
                    className={`w-full rounded-xl px-3 py-2 text-left transition ${
                      activeSection?.id === group.section.id && !activeLesson
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800'
                    }`}
                  >
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Section {groupIndex + 1}</p>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">{group.section.title}</h3>
                  </button>
                ) : (
                  <p className="px-3 text-xs font-black uppercase tracking-widest text-slate-400">Lessons</p>
                )}
              </div>
              {group.lessons.map((lesson) => {
                const done = progressByLesson.get(lesson.id)?.isCompleted
                const selected = activeLesson?.id === lesson.id
                const locked = isPreviewMode && !lesson.isFreePreview
                return (
                  <button
                    key={lesson.id}
                    onClick={() => selectLesson(lesson.id)}
                    className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                      selected
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200'
                        : locked
                          ? 'text-slate-400 hover:bg-slate-50 dark:text-slate-500 dark:hover:bg-slate-900'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                    }`}
                  >
                    {locked ? (
                      <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : done ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : lesson.lessonType === LessonType.QUIZ ? (
                      <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : lesson.lessonType === LessonType.DOCUMENT ? (
                      <Download className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <PlayCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2">{lesson.title}</span>
                      {lesson.isFreePreview && (
                        <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Free
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {enrollment?.isCompleted && course.isCertificate && (
          <button
            onClick={viewCertificate}
            disabled={viewingCertificate}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
          >
            {viewingCertificate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
            {viewingCertificate ? 'Opening...' : 'Certificate'}
          </button>
        )}
      </aside>

      <main className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        {course.status === CourseStatus.ARCHIVED && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              This course has been archived. You can still access the material and complete your enrolled course, but it
              is no longer listed on the marketplace.
            </p>
          </div>
        )}

        {isPreviewMode && !firstPreviewLesson ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
            <Lock className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">This course does not have free preview lessons yet.</p>
            <Link to={`/courses/${courseId}`} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white">
              View course details
            </Link>
          </div>
        ) : activeLessonLocked && activeLesson ? (
          <LockedLessonPanel lesson={activeLesson} courseId={courseId!} onOpenModal={() => setLockedLesson(activeLesson)} />
        ) : activeLesson ? (
          <div className="space-y-6">
            <LessonHeader lesson={activeLesson} progress={activeProgress} isPreviewMode={isPreviewMode} />

            {activeLesson.videoUrl && (
              <video
                ref={videoRef}
                src={activeLesson.videoUrl}
                controls
                onTimeUpdate={(event) => trackVideoProgress(activeLesson, event.currentTarget)}
                onPause={(event) => trackVideoProgress(activeLesson, event.currentTarget, true)}
                onSeeked={(event) => trackVideoProgress(activeLesson, event.currentTarget, true)}
                onLoadedMetadata={(event) => {
                  const lastPosition = activeProgress?.lastPositionSec || 0
                  if (lastPosition > 0 && event.currentTarget.duration > lastPosition) {
                    event.currentTarget.currentTime = lastPosition
                    lastTrackedVideoSecondRef.current[activeLesson.id] = Math.round(lastPosition)
                    lastTrackedVideoPercentRef.current[activeLesson.id] = Math.round(
                      (lastPosition / event.currentTarget.duration) * 100
                    )
                  }
                }}
                onEnded={(event) => {
                  if (!enrollment) return
                  const duration = Number.isFinite(event.currentTarget.duration)
                    ? Math.round(event.currentTarget.duration)
                    : Math.max((activeLesson.durationMinutes ?? 1) * 60, 1)
                  updateProgress.mutate({
                    lesson: activeLesson,
                    payload: {
                      progressPercent: 100,
                      watchDurationSec: duration,
                      lastPositionSec: duration,
                    },
                  })
                }}
                className="aspect-video w-full rounded-xl bg-black"
              />
            )}

            {activeLesson.articleContent && (
              <article
                ref={articleRef}
                className="prose max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeLesson.articleContent || '') }}
              />
            )}

            {activeLesson.lessonType === LessonType.QUIZ && (
              <QuizPanel
                questions={quizQuestions}
                answers={quizAnswers}
                loading={quizLoading}
                latestAttempt={latestAttempt}
                results={quizResults}
                passingPercent={readPassingPercent(activeLesson.metadata)}
                submitting={submitQuiz.isLoading}
                disabled={!enrollment}
                onAnswerChange={updateQuizAnswer}
                onSubmit={() => submitQuiz.mutate()}
              />
            )}

            {activeLesson.resourceUrl && (
              <ResourcePanel
                lesson={activeLesson}
                canDownload={!!enrollment}
                canPreview={!enrollment && !!activeLesson.isFreePreview}
                onDownload={() => downloadResource(activeLesson)}
                onPreview={() => previewResource(activeLesson)}
              />
            )}

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => previousLesson && selectLesson(previousLesson.id)}
                disabled={!previousLesson}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-40 dark:border-slate-800 dark:text-slate-200"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() => nextLesson && selectLesson(nextLesson.id)}
                disabled={!nextLesson}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                Next {nextLesson?.lessonType === LessonType.DOCUMENT ? 'document' : 'lesson'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : activeSection ? (
          <SectionSummary
            section={activeSection}
            lessons={orderedLessons.filter((lesson) => lesson.sectionId === activeSection.id)}
            progressByLesson={progressByLesson}
            onStart={(lesson) => selectLesson(lesson.id)}
          />
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
            <BookOpen className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">No lessons are available yet.</p>
          </div>
        )}
      </main>

      <aside className="h-max rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 xl:sticky xl:top-20">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          Course Q&A
        </h2>
        {isPreviewMode ? (
          <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            Buy this course to ask questions, track progress, submit quizzes, and unlock every lesson.
            <Link to={`/courses/${courseId}`} className="mt-4 flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white">
              Buy course
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 max-h-[440px] space-y-3 overflow-auto">
              {qaMessages.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500 dark:bg-slate-900">
                  No questions yet. Ask about this course or the current lesson.
                </p>
              ) : (
                qaMessages.map((message) => (
                  <div key={message.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                    <p className="text-xs font-black text-slate-500">{message.senderName}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{message.content}</p>
                    <p className="mt-2 text-[11px] font-semibold text-slate-400">
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={submitQa} className="space-y-2">
              <textarea
                value={qaText}
                onChange={(event) => setQaText(event.target.value)}
                placeholder="Ask a question"
                className="h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-indigo-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
              <button
                disabled={sendQa.isLoading || !qaText.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {sendQa.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </form>
          </>
        )}
      </aside>
      </div>
      {lockedLesson && (
        <LockedLessonModal
          lesson={lockedLesson}
          courseId={courseId!}
          onClose={() => setLockedLesson(null)}
        />
      )}
    </div>
  )
}

function LessonHeader({ lesson, progress, isPreviewMode }: { lesson: CourseLessonResponse; progress?: LessonProgressResponse; isPreviewMode?: boolean }) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
          {lesson.lessonType === LessonType.QUIZ ? 'Quiz' : lesson.lessonType === LessonType.DOCUMENT ? 'Document' : 'Lesson'}
        </span>
        {lesson.durationMinutes ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5" />
            {lesson.durationMinutes} min
          </span>
        ) : null}
        {progress?.isCompleted && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed
          </span>
        )}
        {isPreviewMode && lesson.isFreePreview && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-700">
            <PlayCircle className="h-3.5 w-3.5" />
            Free preview
          </span>
        )}
      </div>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">{lesson.title}</h1>
      {lesson.description && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{lesson.description}</p>}
    </div>
  )
}

function LockedLessonPanel({ lesson, courseId, onOpenModal }: { lesson: CourseLessonResponse; courseId: string; onOpenModal: () => void }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm dark:bg-slate-950">
        <Lock className="h-7 w-7" />
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Locked lesson</p>
      <h1 className="mt-2 max-w-xl text-2xl font-black text-slate-900 dark:text-white">{lesson.title}</h1>
      <p className="mt-3 max-w-lg text-sm font-semibold leading-6 text-slate-500 dark:text-slate-300">
        Buy this course to unlock this lesson and continue with the full curriculum.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={onOpenModal} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-950">
          View details
        </button>
        <Link to={`/courses/${courseId}`} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700">
          Buy course
        </Link>
      </div>
    </div>
  )
}

function LockedLessonModal({ lesson, courseId, onClose }: { lesson: CourseLessonResponse; courseId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-950">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Course required</p>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Buy this course to unlock</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
          <span className="font-black text-slate-900 dark:text-white">{lesson.title}</span> is part of the paid curriculum. You can keep previewing free lessons or buy the course for full access.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900">
            Continue preview
          </button>
          <Link to={`/courses/${courseId}`} className="rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-black text-white hover:bg-indigo-700">
            Buy course
          </Link>
        </div>
      </div>
    </div>
  )
}

function ResourcePanel({
  lesson,
  canDownload,
  canPreview,
  onDownload,
  onPreview,
}: {
  lesson: CourseLessonResponse
  canDownload: boolean
  canPreview: boolean
  onDownload: () => void
  onPreview: () => void
}) {
  const resourceUrl = lesson.resourceUrl || ''
  const fileName = getResourceFileName(resourceUrl)

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Downloadable material</p>
            <p className="truncate text-sm font-black text-slate-900 dark:text-white">{fileName}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={canDownload ? onDownload : onPreview}
            disabled={!canDownload && !canPreview}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Download className="h-4 w-4" />
            {canDownload ? 'Download' : canPreview ? 'Preview document' : 'Enroll to download'}
          </button>
        </div>
      </div>
    </section>
  )
}

function SectionSummary({
  section,
  lessons,
  progressByLesson,
  onStart,
}: {
  section: CourseSectionResponse
  lessons: CourseLessonResponse[]
  progressByLesson: Map<string, LessonProgressResponse>
  onStart: (lesson: CourseLessonResponse) => void
}) {
  const completed = lessons.filter((lesson) => progressByLesson.get(lesson.id)?.isCompleted).length
  const firstOpen = lessons.find((lesson) => !progressByLesson.get(lesson.id)?.isCompleted) || lessons[0]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Section summary</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{section.title}</h1>
        {section.description && (
          <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
            {section.description}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
          <span className="rounded-full bg-white px-3 py-1 dark:bg-slate-950">{lessons.length} lessons</span>
          <span className="rounded-full bg-white px-3 py-1 dark:bg-slate-950">{completed} completed</span>
        </div>
        {firstOpen && (
          <button
            onClick={() => onStart(firstOpen)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700"
          >
            <PlayCircle className="h-4 w-4" />
            {completed > 0 ? 'Continue section' : 'Start section'}
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {lessons.map((lesson) => {
          const done = progressByLesson.get(lesson.id)?.isCompleted
          return (
            <button
              key={lesson.id}
              onClick={() => onStart(lesson)}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 text-left hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:bg-indigo-950/20"
            >
              <div className="flex min-w-0 items-center gap-3">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : lesson.lessonType === LessonType.QUIZ ? (
                  <FileText className="h-5 w-5 shrink-0 text-indigo-600" />
                ) : (
                  <PlayCircle className="h-5 w-5 shrink-0 text-indigo-600" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900 dark:text-white">{lesson.title}</p>
                  <p className="text-xs font-semibold text-slate-500">
                    {lesson.lessonType === LessonType.QUIZ ? 'Quiz' : 'Lesson'}
                    {lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ''}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function QuizPanel({
  questions,
  answers,
  loading,
  latestAttempt,
  results,
  passingPercent,
  submitting,
  disabled,
  onAnswerChange,
  onSubmit,
}: {
  questions: QuizQuestionResponse[]
  answers: Record<string, QuizAnswer>
  loading: boolean
  latestAttempt: QuizAttemptResponse | null
  results: QuizQuestionResult
  passingPercent: number
  submitting: boolean
  disabled?: boolean
  onAnswerChange: (questionId: string, answer: QuizAnswer) => void
  onSubmit: () => void
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 p-8 dark:border-slate-800">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
        No quiz questions are available for this lesson.
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Quiz</h2>
        <p className="text-sm font-medium text-slate-500">
          Answer every question and submit when you are ready. Passing score: {passingPercent}%.
        </p>
      </div>

      {questions
        .slice()
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
        .map((question, index) => (
          <QuestionControl
            key={question.id}
            question={question}
            index={index}
            value={answers[question.id]}
            result={results[question.id]}
            submitted={!!latestAttempt}
            onChange={(answer) => onAnswerChange(question.id, answer)}
          />
        ))}

      {latestAttempt && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-bold ${
            latestAttempt.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
          }`}
        >
          Score: {latestAttempt.score} / {latestAttempt.maxScore}. {latestAttempt.passed ? 'Passed.' : 'Try again to pass.'}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={submitting || disabled}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-600 disabled:opacity-60 dark:bg-indigo-900 dark:hover:bg-indigo-800"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {disabled ? 'Enroll to submit quiz' : 'Submit quiz'}
      </button>
    </div>
  )
}

function QuestionControl({
  question,
  index,
  value,
  result,
  submitted,
  onChange,
}: {
  question: QuizQuestionResponse
  index: number
  value?: QuizAnswer
  result?: boolean
  submitted: boolean
  onChange: (answer: QuizAnswer) => void
}) {
  const data = parseQuestionData(question)
  const options =
    question.questionType === QuizQuestionType.TRUE_FALSE
      ? ['True', 'False']
      : data.options.length > 0
        ? data.options
        : ['Option 1', 'Option 2']

  return (
    <div className={`rounded-xl border p-4 ${
      submitted
        ? result
          ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
          : 'border-rose-200 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20'
        : 'border-slate-200 dark:border-slate-800'
    }`}>
      <div className="mb-3">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Question {index + 1}</p>
        <div
          className="prose prose-sm mt-1 max-w-none font-semibold text-slate-900 dark:prose-invert dark:text-white"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.questionText) }}
        />
        <p className="mt-1 text-xs font-bold text-slate-400">{question.points} point{question.points === 1 ? '' : 's'}</p>
        {submitted && (
          <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-black ${
            result ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {result ? 'Correct' : 'Incorrect'}
          </p>
        )}
      </div>

      {question.questionType === QuizQuestionType.TEXT_ANSWER ? (
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          className="h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-800 dark:bg-slate-950"
          placeholder="Type your answer"
        />
      ) : question.questionType === QuizQuestionType.MULTIPLE_CHOICE ? (
        <div className="space-y-2">
          {options.map((option) => {
            const selected = Array.isArray(value) && value.includes(option)
            return (
              <label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(event) => {
                    const current = Array.isArray(value) ? value : []
                    onChange(event.target.checked ? [...current, option] : current.filter((item) => item !== option))
                  }}
                  className="h-4 w-4"
                />
                <span>{option}</span>
              </label>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {options.map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900">
              <input
                type="radio"
                name={question.id}
                checked={value === normalizeSingleAnswer(option, question.questionType)}
                onChange={() => onChange(normalizeSingleAnswer(option, question.questionType))}
                className="h-4 w-4"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function buildLessonGroups(sections: CourseSectionResponse[], lessons: CourseLessonResponse[]): LessonGroup[] {
  const orderedSections = sections.slice().sort((a, b) => (a.sectionOrder ?? 0) - (b.sectionOrder ?? 0))
  const remaining = new Set(lessons.map((lesson) => lesson.id))
  const groups: LessonGroup[] = orderedSections
    .map((section) => {
      const sectionLessons = lessons
        .filter((lesson) => lesson.sectionId === section.id)
        .sort((a, b) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0))
      sectionLessons.forEach((lesson) => remaining.delete(lesson.id))
      return { section, lessons: sectionLessons }
    })
    .filter((group) => group.lessons.length > 0)

  const ungrouped = lessons
    .filter((lesson) => remaining.has(lesson.id))
    .sort((a, b) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0))

  if (ungrouped.length > 0) groups.push({ section: null, lessons: ungrouped })
  return groups
}

function buildCompletionPayload(lesson: CourseLessonResponse): Partial<LessonProgressResponse> {
  if (lesson.lessonType === LessonType.DOCUMENT) {
    return {
      isCompleted: true,
      progressPercent: 100,
      scrollPercent: 100,
      activeTimeSec: Math.max((lesson.durationMinutes ?? 1) * 60, 60),
    }
  }

  if (lesson.videoUrl) {
    return {
      progressPercent: 100,
      watchDurationSec: Math.max((lesson.durationMinutes ?? 1) * 60, 1),
      lastPositionSec: Math.max((lesson.durationMinutes ?? 1) * 60, 1),
    }
  }

  return {
    progressPercent: 100,
    scrollPercent: 100,
    activeTimeSec: Math.max((lesson.durationMinutes ?? 1) * 60, 60),
  }
}

function parseQuestionData(question: QuizQuestionResponse): { options: string[]; correctAnswers: string[]; correctAnswer: string } {
  try {
    const parsed = JSON.parse(question.answerDataJson || '{}') as {
      options?: unknown
      correctAnswers?: unknown
      correctAnswer?: unknown
    }
    const options = Array.isArray(parsed.options)
      ? parsed.options.map((option) => String(option)).filter(Boolean)
      : []
    const correctAnswers = Array.isArray(parsed.correctAnswers)
      ? parsed.correctAnswers.map((answer) => String(answer))
      : []
    const correctAnswer = typeof parsed.correctAnswer === 'string' ? parsed.correctAnswer : ''
    return { options, correctAnswers, correctAnswer }
  } catch {
    return { options: [], correctAnswers: [], correctAnswer: '' }
  }
}

function emptyAnswerFor(type: QuizQuestionType): QuizAnswer {
  if (type === QuizQuestionType.MULTIPLE_CHOICE) return []
  if (type === QuizQuestionType.TRUE_FALSE) return 'False'
  return ''
}

function normalizeSingleAnswer(option: string, type: QuizQuestionType): QuizAnswer {
  return option
}

function serializeQuizAnswer(question: QuizQuestionResponse, answer: QuizAnswer) {
  if (question.questionType === QuizQuestionType.TEXT_ANSWER) {
    return JSON.stringify(String(answer || '').trim())
  }
  if (question.questionType === QuizQuestionType.MULTIPLE_CHOICE) {
    return JSON.stringify(Array.isArray(answer) ? answer : [])
  }
  return JSON.stringify(answer ? [String(answer)] : [])
}

function buildQuizResults(questions: QuizQuestionResponse[], answers: Record<string, QuizAnswer>): QuizQuestionResult {
  return questions.reduce<QuizQuestionResult>((result, question) => {
    const data = parseQuestionData(question)
    const answer = answers[question.id] ?? emptyAnswerFor(question.questionType)
    if (question.questionType === QuizQuestionType.TEXT_ANSWER) {
      result[question.id] = normalizeTextAnswer(String(answer)) === normalizeTextAnswer(data.correctAnswer)
      return result
    }

    const given = Array.isArray(answer) ? answer : answer ? [String(answer)] : []
    result[question.id] = sameAnswerSet(given, data.correctAnswers)
    return result
  }, {})
}

function normalizeTextAnswer(value: string) {
  return value.trim().toLowerCase()
}

function sameAnswerSet(left: string[], right: string[]) {
  const normalizedLeft = left.map((item) => item.trim()).sort()
  const normalizedRight = right.map((item) => item.trim()).sort()
  return normalizedLeft.length === normalizedRight.length
    && normalizedLeft.every((item, index) => item === normalizedRight[index])
}

function readPassingPercent(metadata?: Record<string, unknown>) {
  const value = Number(metadata?.passingPercent ?? 50)
  if (!Number.isFinite(value)) return 50
  return Math.min(Math.max(Math.round(value), 0), 100)
}

function getArticleScrollPercent(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const articleTop = window.scrollY + rect.top
  const readerPosition = window.scrollY + window.innerHeight * 0.7
  const scrolled = readerPosition - articleTop
  return Math.min(Math.max(Math.round((scrolled / Math.max(element.scrollHeight, 1)) * 100), 0), 100)
}

function readQuizDraft(courseId: string, enrollmentId: string, lessonId: string): Record<string, QuizAnswer> {
  try {
    const raw = window.localStorage.getItem(quizDraftKey(courseId, enrollmentId, lessonId))
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, QuizAnswer>
      : {}
  } catch {
    return {}
  }
}

function lastLessonKey(courseId: string) {
  return `mentorx:last-lesson:${courseId}`
}

function quizDraftKey(courseId: string, enrollmentId: string, lessonId: string) {
  return `mentorx:quiz-draft:${courseId}:${enrollmentId}:${lessonId}`
}

function lessonPath(courseId: string, lesson: CourseLessonResponse) {
  return `/courses/${courseId}/learn/sections/${lesson.sectionId}/lessons/${lesson.id}`
}

function sectionPath(courseId: string, sectionId: string) {
  return `/courses/${courseId}/learn/sections/${sectionId}`
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

function downloadUrl(url: string, fileName: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noreferrer'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
