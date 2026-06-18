import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueries, useQuery, useQueryClient } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { reviewApi } from '@/api/reviewApi'
import { fileApi } from '@/api/fileApi'
import { categoryApi } from '@/api/categoryApi'
import { skillApi } from '@/api/skillApi'
import CourseNameConfirmModal from '@/components/course/CourseNameConfirmModal'
import { CourseMediaDropZone, CourseMediaKind, validateCourseMedia } from '@/components/course/CourseMediaDropZone'
import { CategoryResponse, CourseProductType, CourseQaMessageResponse, CourseStatus, LessonType, QuizQuestionType, ReviewResponse, ReviewTargetType, SkillResponse, SupportedLanguage } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import {
  ArrowLeft,
  AlertTriangle,
  Archive,
  Bold,
  Calendar,
  CircleDollarSign,
  Download,
  FileText,
  HelpCircle,
  Image,
  Italic,
  List,
  ListOrdered,
  Loader2,
  MessageSquare,
  Plus,
  Save,
  Send,
  Star,
  TrendingUp,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'

const editorInputClass = 'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'

type DraftLesson = {
  clientId: string
  id?: string
  title: string
  description: string
  lessonType: LessonType
  durationMinutes: string
  videoUrl: string
  articleContent: string
  resourceUrl: string
  isFreePreview: boolean
  isMandatory: boolean
  isPublished: boolean
  pendingVideoFile?: File
  pendingVideoPreviewUrl?: string
  pendingResourceFile?: File
  pendingResourceName?: string
  pendingImages: PendingImage[]
  passingPercent: string
  quizQuestions: DraftQuizQuestion[]
}

type PendingImage = {
  id: string
  file: File
  previewUrl: string
}

type DraftQuizQuestion = {
  clientId: string
  id?: string
  questionType: QuizQuestionType
  questionText: string
  options: string[]
  correctAnswers: string[]
  textAnswer: string
  points: string
  explanation: string
  pendingImages: PendingImage[]
}

type DraftSection = {
  clientId: string
  id?: string
  title: string
  description: string
  isPublished: boolean
  lessons: DraftLesson[]
}

type Selection =
  | { type: 'section'; sectionClientId: string }
  | { type: 'lesson'; sectionClientId: string; lessonClientId: string }

type CourseDetailsDraft = {
  title: string
  description: string
  thumbnailUrl: string
  previewVideoUrl: string
  categoryId: string
  skillIds: number[]
  priceMxc: string
  discountPriceMxc: string
  discountStartAt: string
  discountEndAt: string
  clearDiscount: boolean
  language: SupportedLanguage
  level: string
  isCertificate: boolean
  productType: CourseProductType
  pendingThumbnailFile?: File
  pendingThumbnailPreviewUrl?: string
  pendingPreviewVideoFile?: File
  pendingPreviewVideoPreviewUrl?: string
}

type ManageTab = 'content' | 'info' | 'sale' | 'qa' | 'reviews'
type ManageCourseAction = 'archive' | 'delete'

const newId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`

const createSection = (index: number): DraftSection => ({
  clientId: newId(),
  title: `Section ${index + 1}`,
  description: '',
  isPublished: true,
  lessons: [],
})

const createLesson = (type: LessonType, index: number): DraftLesson => ({
  clientId: newId(),
  title: type === LessonType.QUIZ ? `Quiz ${index + 1}` : type === LessonType.DOCUMENT ? 'Document file' : `Lesson ${index + 1}`,
  description: '',
  lessonType: type,
  durationMinutes: '',
  videoUrl: '',
  articleContent: '',
  resourceUrl: '',
  isFreePreview: false,
  isMandatory: true,
  isPublished: true,
  pendingImages: [],
  passingPercent: type === LessonType.QUIZ ? '50' : '',
  quizQuestions: type === LessonType.QUIZ ? [createQuizQuestion(0)] : [],
})

const createQuizQuestion = (index: number): DraftQuizQuestion => ({
  clientId: newId(),
  questionType: QuizQuestionType.SINGLE_CHOICE,
  questionText: '',
  options: ['Option 1', 'Option 2'],
  correctAnswers: ['Option 1'],
  textAnswer: '',
  points: '1',
  explanation: '',
  pendingImages: [],
})

export default function MentorCourseManagePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [sections, setSections] = useState<DraftSection[]>([])
  const [selection, setSelection] = useState<Selection | null>(null)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [uploadingField, setUploadingField] = useState<'videoUrl' | 'resourceUrl' | null>(null)
  const [activeTab, setActiveTab] = useState<ManageTab>('info')
  const [confirmAction, setConfirmAction] = useState<ManageCourseAction | null>(null)
  const [skillQuery, setSkillQuery] = useState('')
  const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false)
  const [qaReplyDrafts, setQaReplyDrafts] = useState<Record<string, string>>({})
  const [reviewResponseDrafts, setReviewResponseDrafts] = useState<Record<string, string>>({})
  const [courseDetails, setCourseDetails] = useState<CourseDetailsDraft>({
    title: '',
    description: '',
    thumbnailUrl: '',
    previewVideoUrl: '',
    categoryId: '',
    skillIds: [],
    priceMxc: '0',
    discountPriceMxc: '',
    discountStartAt: '',
    discountEndAt: '',
    clearDiscount: false,
    language: SupportedLanguage.EN,
    level: 'Beginner',
    isCertificate: false,
    productType: CourseProductType.COURSE,
  })
  const [detailsDirty, setDetailsDirty] = useState(false)
  const sectionsRef = useRef<DraftSection[]>([])
  const hydrationKeyRef = useRef('')

  useEffect(() => {
    sectionsRef.current = sections
  }, [sections])

  const { data: course } = useQuery(['course', courseId], () => courseApi.getById(courseId!), { enabled: !!courseId })
  const coursePublished = course?.status === CourseStatus.PUBLISHED
  const isDocumentProduct = courseDetails.productType === CourseProductType.DOCUMENT
  const { data: courseStats } = useQuery(
    ['course-stats', courseId],
    () => courseApi.getCourseStats(courseId!),
    { enabled: !!courseId && coursePublished, refetchInterval: 30000 }
  )
  const totalEnrollments = course?.totalEnrollments ?? courseStats?.totalEnrollments ?? 0
  const { data: courseReviewsData, isLoading: reviewsLoading } = useQuery(
    ['reviews', ReviewTargetType.COURSE, courseId, 'mentor-manage'],
    () => reviewApi.getByTarget(ReviewTargetType.COURSE, courseId!, { page: 0, size: 100 }),
    { enabled: !!courseId && coursePublished }
  )
  const { data: qaMessages = [], isLoading: qaLoading } = useQuery(
    ['course-qa', courseId, 'mentor-manage'],
    () => courseApi.getCourseQaMessages(courseId!),
    { enabled: !!courseId }
  )
  const { data: qaSummary } = useQuery(
    ['course-qa-summary', courseId],
    () => courseApi.getCourseQaSummary(courseId!),
    { enabled: !!courseId }
  )
  const { data: categories = [] } = useQuery(['course-editor-categories'], () => categoryApi.getAllActive())
  const { data: skills = [] } = useQuery(['course-editor-skills'], () => skillApi.getAllActive())
  const { data: savedSections = [], isLoading: sectionsLoading } = useQuery(
    ['course-sections-edit', courseId],
    () => courseApi.getSections(courseId!),
    { enabled: !!courseId }
  )
  const { data: savedLessons = [], isLoading: lessonsLoading } = useQuery(
    ['course-lessons', courseId],
    () => courseApi.getLessonsByCourse(courseId!),
    { enabled: !!courseId }
  )
  const savedQuizLessons = useMemo(
    () => savedLessons.filter((lesson) => lesson.lessonType === LessonType.QUIZ),
    [savedLessons]
  )
  const quizQuestionQueries = useQueries(
    savedQuizLessons.map((lesson) => ({
      queryKey: ['quiz-questions-edit', lesson.id],
      queryFn: () => courseApi.getQuizQuestions(lesson.id),
      enabled: !!lesson.id,
    }))
  )
  const quizQuestionsLoading = quizQuestionQueries.some((query) => query.isLoading)
  const quizQuestionsHydrationKey = JSON.stringify(
    quizQuestionQueries.map((query, index) => ({
      lessonId: savedQuizLessons[index]?.id,
      dataUpdatedAt: query.dataUpdatedAt || 0,
      isLoading: query.isLoading,
    }))
  )

  useEffect(() => {
    if (!coursePublished && activeTab === 'reviews') {
      setActiveTab('info')
    }
  }, [activeTab, coursePublished])

  useEffect(() => {
    if (isDocumentProduct && activeTab === 'content') {
      setActiveTab('info')
    }
  }, [activeTab, isDocumentProduct])

  useEffect(() => {
    if (!course || detailsDirty) return
    setCourseDetails({
      title: course.title || '',
      description: course.description || '',
      thumbnailUrl: course.thumbnailUrl || '',
      previewVideoUrl: course.previewVideoUrl || '',
      categoryId: course.categoryId ? String(course.categoryId) : '',
      skillIds: course.skillIds || [],
      priceMxc: course.priceMxc != null ? String(course.priceMxc) : '0',
      discountPriceMxc: course.discountPriceMxc != null ? String(course.discountPriceMxc) : '',
      discountStartAt: toDateTimeLocalValue(course.discountStartAt),
      discountEndAt: toDateTimeLocalValue(course.discountEndAt),
      clearDiscount: false,
      language: course.language || SupportedLanguage.EN,
      level: course.level || 'Beginner',
      isCertificate: course.isCertificate === true,
      productType: course.productType || CourseProductType.COURSE,
    })
  }, [course, detailsDirty])

  useEffect(() => {
    if (sectionsLoading || lessonsLoading || quizQuestionsLoading) return
    const quizQuestionData = savedQuizLessons.map((lesson, index) => ({
      lessonId: lesson.id,
      questions: quizQuestionQueries[index]?.data || [],
    }))
    const hydrationKey = buildCurriculumHydrationKey(savedSections, savedLessons, quizQuestionData)
    if (hydrationKeyRef.current === hydrationKey) return
    hydrationKeyRef.current = hydrationKey

    const quizQuestionsByLessonId = new Map(
      quizQuestionData.map(({ lessonId, questions }) => [lessonId, questions])
    )
    let hydrated: DraftSection[] = savedSections.map((section) => ({
      clientId: section.id,
      id: section.id,
      title: section.title,
      description: section.description || '',
      isPublished: section.isPublished !== false,
      lessons: savedLessons
        .filter((lesson) => lesson.sectionId === section.id)
        .sort((a, b) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0))
        .map((lesson) => ({
          clientId: lesson.id,
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || '',
          lessonType: normalizeEditorLessonType(lesson.lessonType),
          durationMinutes: lesson.durationMinutes ? String(lesson.durationMinutes) : '',
          videoUrl: lesson.videoUrl || '',
          articleContent: lesson.articleContent || '',
          resourceUrl: lesson.resourceUrl || '',
          isFreePreview: lesson.isFreePreview === true,
          isMandatory: lesson.isMandatory !== false,
          isPublished: lesson.isPublished !== false,
          pendingImages: [],
          passingPercent: lesson.lessonType === LessonType.QUIZ ? String(readPassingPercent(lesson.metadata)) : '',
          quizQuestions: (quizQuestionsByLessonId.get(lesson.id) || []).map((question) => {
            const answerData = parseAnswerData(question.answerDataJson, question.questionType)
            return {
              clientId: question.id,
              id: question.id,
              questionType: question.questionType,
              questionText: question.questionText || '',
              options: answerData.options,
              correctAnswers: answerData.correctAnswers,
              textAnswer: answerData.textAnswer,
              points: question.points ? String(question.points) : '1',
              explanation: question.explanation || '',
              pendingImages: [],
            }
          }),
        })),
    }))
    let initializedDocumentDraft = false
    if (isDocumentProduct && hydrated.length === 0 && savedSections.length === 0 && savedLessons.length === 0) {
      const section = createSection(0)
      const lesson = createLesson(LessonType.DOCUMENT, 0)
      hydrated = [{
        ...section,
        title: 'Document',
        lessons: [lesson],
      }]
      initializedDocumentDraft = true
    }
    setSections(hydrated)
    setSelection((currentSelection) => {
      if (initializedDocumentDraft && hydrated[0]?.lessons[0]) {
        return {
          type: 'lesson',
          sectionClientId: hydrated[0].clientId,
          lessonClientId: hydrated[0].lessons[0].clientId,
        }
      }
      return preserveSelection(currentSelection, sectionsRef.current, hydrated)
    })
    setDirty(initializedDocumentDraft)
  }, [savedSections, savedLessons, savedQuizLessons, sectionsLoading, lessonsLoading, quizQuestionsLoading, quizQuestionsHydrationKey, isDocumentProduct])

  const selectedSection = useMemo(
    () => sections.find((section) => section.clientId === selection?.sectionClientId),
    [sections, selection]
  )
  const selectedLesson = useMemo(() => {
    if (!selection || selection.type !== 'lesson') return null
    return selectedSection?.lessons.find((lesson) => lesson.clientId === selection.lessonClientId) || null
  }, [selectedSection, selection])
  const documentLesson = useMemo(() => {
    for (const section of sections) {
      const lesson = section.lessons.find((item) => item.lessonType === LessonType.DOCUMENT) || section.lessons[0]
      if (lesson) return { sectionClientId: section.clientId, lesson }
    }
    return null
  }, [sections])
  const selectedCourseSkills = useMemo(
    () => skills.filter((skill: SkillResponse) => courseDetails.skillIds.includes(skill.id)),
    [skills, courseDetails.skillIds]
  )
  const suggestedCourseSkills = useMemo(() => {
    const query = skillQuery.trim().toLowerCase()
    return skills
      .filter((skill: SkillResponse) => !courseDetails.skillIds.includes(skill.id))
      .filter((skill: SkillResponse) => {
        if (!query) return true
        return [
          skill.labelEn,
          skill.labelVi,
          skill.slug,
        ].some((value) => value?.toLowerCase().includes(query))
      })
      .slice(0, 8)
  }, [skills, courseDetails.skillIds, skillQuery])

  const courseReviews = courseReviewsData?.content || []
  const averageReviewRating = courseReviews.length
    ? courseReviews.reduce((sum, review) => sum + (review.overallRating || 0), 0) / courseReviews.length
    : 0
  const qaThreads = useMemo(() => groupQaMessagesByLearner(qaMessages, course?.instructorId), [qaMessages, course?.instructorId])
  const saleStats = useMemo(() => {
    const basePrice = Number(courseDetails.priceMxc || 0)
    const effectivePrice = Number(course?.effectivePriceMxc ?? basePrice)
    const discountPrice = courseDetails.discountPriceMxc ? Number(courseDetails.discountPriceMxc) : undefined
    const discountAmount = discountPrice != null ? Math.max(basePrice - discountPrice, 0) : Math.max(basePrice - effectivePrice, 0)
    const discountPercent = basePrice > 0 && discountAmount > 0 ? Math.round((discountAmount / basePrice) * 100) : 0
    const last7Revenue = Number(courseStats?.last7DaysRevenueMxc || 0)
    const previous7Revenue = Number(courseStats?.previous7DaysRevenueMxc || 0)
    const revenueDelta = last7Revenue - previous7Revenue
    const revenueDeltaPercent = previous7Revenue > 0 ? Math.round((revenueDelta / previous7Revenue) * 100) : null
    return {
      basePrice,
      effectivePrice,
      discountAmount,
      discountPercent,
      last7Revenue,
      previous7Revenue,
      revenueDelta,
      revenueDeltaPercent,
      last7Enrollments: courseStats?.last7DaysEnrollments || 0,
      previous7Enrollments: courseStats?.previous7DaysEnrollments || 0,
      totalRevenue: Number(courseStats?.totalRevenueMxc || 0),
    }
  }, [course, courseDetails.discountPriceMxc, courseDetails.priceMxc, courseStats])

  const saveMutation = useMutation(
    async () => {
      const validation = validateCurriculum(sections)
      if (validation) throw new Error(validation)
      const previousMediaUrls = uniqueMediaUrls([
        ...collectMediaUrlsFromSavedLessons(savedLessons),
        ...collectMediaUrlsFromSavedQuizQuestions(quizQuestionQueries.flatMap((query) => query.data || [])),
      ])
      const preparedSections = await prepareSectionsForSave(sections)
      const response = await courseApi.saveCurriculum(courseId!, {
        sections: preparedSections.map((section, sectionIndex) => ({
          id: section.id,
          title: section.title.trim(),
          description: section.description || undefined,
          sectionOrder: sectionIndex + 1,
          isPublished: section.isPublished,
          lessons: section.lessons.map((lesson, lessonIndex) => ({
            id: lesson.id,
            title: lesson.title.trim(),
            description: lesson.description || undefined,
            lessonType: lesson.lessonType,
            lessonOrder: lessonIndex + 1,
            durationMinutes: lesson.durationMinutes ? Number(lesson.durationMinutes) : undefined,
            videoUrl: lesson.videoUrl || undefined,
            articleContent: lesson.articleContent || undefined,
            resourceUrl: lesson.resourceUrl || undefined,
            isFreePreview: lesson.isFreePreview,
            isPublished: lesson.isPublished,
            isMandatory: lesson.isMandatory,
            metadata: lesson.lessonType === LessonType.QUIZ
              ? { passingPercent: clampPassingPercent(Number(lesson.passingPercent || 50)) }
              : undefined,
            quizQuestions: lesson.lessonType === LessonType.QUIZ
              ? lesson.quizQuestions.map((question, questionIndex) => ({
                  id: question.id,
                  questionType: question.questionType,
                  questionText: question.questionText,
                  answerDataJson: answerDataJsonForQuestion(question),
                  points: question.points ? Number(question.points) : 1,
                  explanation: question.explanation || undefined,
                  orderIndex: questionIndex + 1,
                }))
              : undefined,
          })),
        })),
      })
      const nextMediaUrls = collectMediaUrlsFromDraftSections(preparedSections)
      const removedMediaUrls = previousMediaUrls.filter((url) => !nextMediaUrls.includes(url))
      await Promise.allSettled(removedMediaUrls.map((url) => fileApi.deleteCourseMedia(url)))
      return { response, preparedSections }
    },
    {
      onSuccess: ({ preparedSections }) => {
        setSections(preparedSections)
        setDirty(false)
        setError('')
        queryClient.invalidateQueries(['course-sections-edit', courseId])
        queryClient.invalidateQueries(['course-lessons', courseId])
      },
      onError: (err: any) => setError(err.message || err.response?.data?.message || 'Failed to save curriculum.'),
    }
  )

  const updateCourseDetailsMutation = useMutation(
    async () => {
      const title = courseDetails.title.trim()
      const priceMxc = Number(courseDetails.priceMxc || 0)
      const discountPriceMxc = courseDetails.discountPriceMxc ? Number(courseDetails.discountPriceMxc) : undefined
      const hasDiscount = discountPriceMxc != null || !!courseDetails.discountStartAt || !!courseDetails.discountEndAt
      if (title.length < 5) throw new Error(`${isDocumentProduct ? 'Document' : 'Course'} title must be at least 5 characters.`)
      if (!Number.isInteger(priceMxc) || priceMxc < 0) throw new Error(`${isDocumentProduct ? 'Document' : 'Course'} price must be a full number and cannot be negative.`)
      if (hasDiscount && !courseDetails.clearDiscount) {
        if (discountPriceMxc == null || !Number.isInteger(discountPriceMxc) || discountPriceMxc < 0) throw new Error('Sale price must be a full number and cannot be negative.')
        if (discountPriceMxc >= priceMxc) throw new Error('Sale price must be lower than the base price.')
        if (!courseDetails.discountStartAt || !courseDetails.discountEndAt) throw new Error('Sale start and end time are required.')
        if (new Date(courseDetails.discountStartAt) >= new Date(courseDetails.discountEndAt)) throw new Error('Sale end time must be after start time.')
      }
      if (!courseDetails.categoryId) throw new Error(`Choose a ${isDocumentProduct ? 'document' : 'course'} domain.`)
      if (!courseDetails.skillIds.length) throw new Error('Choose at least one skill.')
      const updatedCourse = await courseApi.updateDetailsWithMedia(courseId!, {
        title,
        description: courseDetails.description.trim() || undefined,
        categoryId: Number(courseDetails.categoryId),
        skillIds: courseDetails.skillIds,
        priceMxc,
        discountPriceMxc: courseDetails.clearDiscount ? undefined : discountPriceMxc,
        discountStartAt: !courseDetails.clearDiscount && courseDetails.discountStartAt ? toApiDateTime(courseDetails.discountStartAt) : undefined,
        discountEndAt: !courseDetails.clearDiscount && courseDetails.discountEndAt ? toApiDateTime(courseDetails.discountEndAt) : undefined,
        clearDiscount: courseDetails.clearDiscount,
        language: courseDetails.language,
        level: courseDetails.level || undefined,
        isCertificate: !isDocumentProduct,
      }, {
        thumbnailFile: courseDetails.pendingThumbnailFile,
        previewVideoFile: courseDetails.pendingPreviewVideoFile,
        removeThumbnail: !courseDetails.pendingThumbnailFile && !!course?.thumbnailUrl && !courseDetails.thumbnailUrl,
        removePreviewVideo: !courseDetails.pendingPreviewVideoFile && !!course?.previewVideoUrl && !courseDetails.previewVideoUrl,
      })

      let preparedSections: DraftSection[] | undefined
      if (isDocumentProduct) {
        const documentSections = ensureDocumentProductSections(sections, courseDetails)
        const validation = validateDocumentProduct(documentSections)
        if (validation) throw new Error(validation)
        const previousMediaUrls = uniqueMediaUrls(collectMediaUrlsFromSavedLessons(savedLessons))
        preparedSections = await prepareSectionsForSave(documentSections)
        await courseApi.saveCurriculum(courseId!, {
          sections: preparedSections.map((section, sectionIndex) => ({
            id: section.id,
            title: 'Document',
            description: courseDetails.description.trim() || undefined,
            sectionOrder: sectionIndex + 1,
            isPublished: true,
            lessons: section.lessons.map((lesson, lessonIndex) => ({
              id: lesson.id,
              title,
              description: courseDetails.description.trim() || undefined,
              lessonType: LessonType.DOCUMENT,
              lessonOrder: lessonIndex + 1,
              resourceUrl: lesson.resourceUrl || undefined,
              isFreePreview: false,
              isPublished: true,
              isMandatory: true,
            })),
          })),
        })
        const nextMediaUrls = collectMediaUrlsFromDraftSections(preparedSections)
        const removedMediaUrls = previousMediaUrls.filter((url) => !nextMediaUrls.includes(url))
        await Promise.allSettled(removedMediaUrls.map((url) => fileApi.deleteCourseMedia(url)))
      }

      return { updatedCourse, preparedSections }
    },
    {
      onSuccess: ({ updatedCourse, preparedSections }) => {
        setCourseDetails((current) => ({
          ...current,
          thumbnailUrl: updatedCourse.thumbnailUrl || '',
          previewVideoUrl: updatedCourse.previewVideoUrl || '',
          discountPriceMxc: updatedCourse.discountPriceMxc != null ? String(updatedCourse.discountPriceMxc) : '',
          discountStartAt: toDateTimeLocalValue(updatedCourse.discountStartAt),
          discountEndAt: toDateTimeLocalValue(updatedCourse.discountEndAt),
          clearDiscount: false,
          pendingThumbnailFile: undefined,
          pendingThumbnailPreviewUrl: undefined,
          pendingPreviewVideoFile: undefined,
          pendingPreviewVideoPreviewUrl: undefined,
        }))
        if (preparedSections) {
          setSections(preparedSections)
          setDirty(false)
          queryClient.invalidateQueries(['course-sections-edit', courseId])
          queryClient.invalidateQueries(['course-lessons', courseId])
        }
        setDetailsDirty(false)
        setError('')
        queryClient.invalidateQueries(['course', courseId])
      },
      onError: (err: any) => setError(err.message || err.response?.data?.message || 'Failed to update course details.'),
    }
  )

  const respondToReviewMutation = useMutation(
    ({ reviewId, responseText }: { reviewId: string; responseText: string }) => reviewApi.respond(reviewId, responseText),
    {
      onSuccess: (_review, variables) => {
        setReviewResponseDrafts((current) => ({ ...current, [variables.reviewId]: '' }))
        queryClient.invalidateQueries(['reviews', ReviewTargetType.COURSE, courseId, 'mentor-manage'])
        queryClient.invalidateQueries(['reviews', ReviewTargetType.COURSE, courseId])
      },
      onError: (err: any) => setError(err.message || err.response?.data?.message || 'Failed to save review response.'),
    }
  )

  const sendQaReplyMutation = useMutation(
    ({ recipientId, content }: { recipientId: string; content: string }) => courseApi.sendCourseQaMessage(courseId!, { recipientId, content }),
    {
      onSuccess: (_message, variables) => {
        setQaReplyDrafts((current) => ({ ...current, [variables.recipientId]: '' }))
        queryClient.invalidateQueries(['course-qa', courseId, 'mentor-manage'])
        queryClient.invalidateQueries(['course-qa-summary', courseId])
        queryClient.invalidateQueries(['mentor-course-qa-summaries'])
      },
      onError: (err: any) => setError(err.message || err.response?.data?.message || 'Failed to send Q&A reply.'),
    }
  )

  const archiveCourseMutation = useMutation(() => courseApi.archive(courseId!), {
    onSuccess: () => {
      setConfirmAction(null)
      setError('')
      queryClient.invalidateQueries(['course', courseId])
      queryClient.invalidateQueries(['course-stats', courseId])
    },
    onError: (err: any) => setError(err.message || err.response?.data?.message || 'Failed to archive product.'),
  })

  const deleteCourseMutation = useMutation(() => courseApi.delete(courseId!), {
    onSuccess: () => {
      setConfirmAction(null)
      navigate('/mentor/courses')
    },
    onError: (err: any) => setError(err.message || err.response?.data?.message || 'Failed to delete product.'),
  })

  const actionLoading = archiveCourseMutation.isLoading || deleteCourseMutation.isLoading

  const confirmCourseAction = () => {
    if (!confirmAction || !courseId) return
    if (confirmAction === 'archive') {
      archiveCourseMutation.mutate()
      return
    }
    deleteCourseMutation.mutate()
  }

  const markDirty = (next: DraftSection[]) => {
    setSections(next)
    setDirty(true)
    setError('')
  }

  const updateCourseDetails = (patch: Partial<CourseDetailsDraft>) => {
    setCourseDetails((current) => ({ ...current, ...patch }))
    setDetailsDirty(true)
    setError('')
  }

  const selectCourseMedia = (kind: CourseMediaKind, file: File) => {
    const validation = validateCourseMedia(file, kind)
    if (validation) {
      setError(validation)
      return
    }
    const previewUrl = URL.createObjectURL(file)
    if (kind === 'image') {
      if (courseDetails.pendingThumbnailPreviewUrl) URL.revokeObjectURL(courseDetails.pendingThumbnailPreviewUrl)
      updateCourseDetails({
        thumbnailUrl: previewUrl,
        pendingThumbnailFile: file,
        pendingThumbnailPreviewUrl: previewUrl,
      })
      return
    }
    if (courseDetails.pendingPreviewVideoPreviewUrl) URL.revokeObjectURL(courseDetails.pendingPreviewVideoPreviewUrl)
    updateCourseDetails({
      previewVideoUrl: previewUrl,
      pendingPreviewVideoFile: file,
      pendingPreviewVideoPreviewUrl: previewUrl,
    })
  }

  const clearCourseMedia = (kind: CourseMediaKind) => {
    if (kind === 'image') {
      if (courseDetails.pendingThumbnailPreviewUrl) URL.revokeObjectURL(courseDetails.pendingThumbnailPreviewUrl)
      updateCourseDetails({
        thumbnailUrl: '',
        pendingThumbnailFile: undefined,
        pendingThumbnailPreviewUrl: undefined,
      })
      return
    }
    if (courseDetails.pendingPreviewVideoPreviewUrl) URL.revokeObjectURL(courseDetails.pendingPreviewVideoPreviewUrl)
    updateCourseDetails({
      previewVideoUrl: '',
      pendingPreviewVideoFile: undefined,
      pendingPreviewVideoPreviewUrl: undefined,
    })
  }

  const addCourseSkill = (skillId: number) => {
    if (!skillId || courseDetails.skillIds.includes(skillId)) return
    updateCourseDetails({ skillIds: [...courseDetails.skillIds, skillId] })
    setSkillQuery('')
    setIsSkillMenuOpen(false)
  }

  const removeCourseSkill = (skillId: number) => {
    updateCourseDetails({ skillIds: courseDetails.skillIds.filter((id) => id !== skillId) })
  }

  const addSection = () => {
    const section = createSection(sections.length)
    markDirty([...sections, section])
    setSelection({ type: 'section', sectionClientId: section.clientId })
  }

  const removeSection = (sectionClientId: string) => {
    const next = sections.filter((section) => section.clientId !== sectionClientId)
    markDirty(next)
    setSelection(next[0] ? { type: 'section', sectionClientId: next[0].clientId } : null)
  }

  const addLesson = (sectionClientId: string, type: LessonType) => {
    const targetSection = sections.find((section) => section.clientId === sectionClientId)
    if (!targetSection) return
    const newLesson = createLesson(type, targetSection.lessons.length)
    const next = sections.map((section) => {
      if (section.clientId !== sectionClientId) return section
      return { ...section, lessons: [...section.lessons, newLesson] }
    })
    markDirty(next)
    setSelection({ type: 'lesson', sectionClientId, lessonClientId: newLesson.clientId })
  }

  const removeLesson = (sectionClientId: string, lessonClientId: string) => {
    const next = sections.map((section) =>
      section.clientId === sectionClientId
        ? { ...section, lessons: section.lessons.filter((lesson) => lesson.clientId !== lessonClientId) }
        : section
    )
    markDirty(next)
    setSelection({ type: 'section', sectionClientId })
  }

  const updateSection = (sectionClientId: string, patch: Partial<DraftSection>) => {
    markDirty(sections.map((section) => (section.clientId === sectionClientId ? { ...section, ...patch } : section)))
  }

  const updateLesson = (sectionClientId: string, lessonClientId: string, patch: Partial<DraftLesson>) => {
    markDirty(
      sections.map((section) =>
        section.clientId === sectionClientId
          ? {
              ...section,
              lessons: section.lessons.map((lesson) => (lesson.clientId === lessonClientId ? { ...lesson, ...patch } : lesson)),
            }
          : section
      )
    )
  }

  const uploadLessonAsset = async (field: 'videoUrl' | 'resourceUrl', file: File) => {
    if (!selectedLesson || !selection || selection.type !== 'lesson') return
    const validation = validateAsset(file, field)
    if (validation) {
      setError(validation)
      return
    }
    const previewUrl = URL.createObjectURL(file)
    updateLesson(
      selection.sectionClientId,
      selection.lessonClientId,
      field === 'videoUrl'
        ? { videoUrl: previewUrl, pendingVideoFile: file, pendingVideoPreviewUrl: previewUrl }
        : { resourceUrl: previewUrl, pendingResourceFile: file, pendingResourceName: file.name }
    )
  }

  const updateDocumentFile = (patch: Partial<DraftLesson>) => {
    const nextSections = ensureDocumentProductSections(sections, courseDetails)
    const firstSection = nextSections[0]
    const firstLesson = firstSection.lessons[0]
    const next = nextSections.map((section) =>
      section.clientId === firstSection.clientId
        ? {
            ...section,
            lessons: section.lessons.map((lesson) => (
              lesson.clientId === firstLesson.clientId ? { ...lesson, ...patch } : lesson
            )),
          }
        : section
    )
    markDirty(next)
  }

  const selectDocumentResourceFile = (file: File) => {
    const validation = validateAsset(file, 'resourceUrl')
    if (validation) {
      setError(validation)
      return
    }
    updateDocumentFile({
      resourceUrl: URL.createObjectURL(file),
      pendingResourceFile: file,
      pendingResourceName: file.name,
    })
  }

  const clearDocumentResourceFile = () => {
    updateDocumentFile({
      resourceUrl: '',
      pendingResourceFile: undefined,
      pendingResourceName: undefined,
    })
  }

  const insertLessonContentImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Lesson content images must be image files.')
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Lesson content images must be 10 MB or smaller.')
    }
    const pendingImage: PendingImage = {
      id: newId(),
      file,
      previewUrl: URL.createObjectURL(file),
    }
    return pendingImage
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] space-y-4">
      <Link to="/mentor/courses" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">{course?.status || 'PUBLISHED'}</p>
          <h1 className="text-2xl font-black text-slate-900">{course?.title || 'Course editor'}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === 'content' && dirty && <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Unsaved changes</span>}
          {(activeTab === 'info' || activeTab === 'sale') && (detailsDirty || (isDocumentProduct && dirty)) && <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Unsaved info</span>}
          {courseId && (
            <Link
              to={`/courses/${courseId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
            >
              View course page
            </Link>
          )}
          {course?.status === CourseStatus.PUBLISHED && (
            <button
              type="button"
              onClick={() => setConfirmAction('archive')}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmAction('delete')}
            disabled={!course || totalEnrollments > 0 || actionLoading}
            title={totalEnrollments > 0 ? 'Products with enrollments cannot be deleted. Archive instead.' : 'Delete product'}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {course?.rejectionReason && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-black">Admin review note</p>
            <p className="mt-1 leading-6">{course.rejectionReason}</p>
          </div>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black ${activeTab === 'info' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {isDocumentProduct ? 'Document info' : 'Course info'}
        </button>
        {!isDocumentProduct && <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black ${activeTab === 'content' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          Course content
        </button>}
        <button
          type="button"
          onClick={() => setActiveTab('sale')}
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black ${activeTab === 'sale' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          Sales
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('qa')}
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black ${activeTab === 'qa' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          Q&A
          {(qaSummary?.unansweredLearners || 0) > 0 && (
            <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${activeTab === 'qa' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-700'}`}>
              {qaSummary?.unansweredLearners}
            </span>
          )}
        </button>
        {coursePublished && !isDocumentProduct && (
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black ${activeTab === 'reviews' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Reviews
          </button>
        )}
      </div>

      {activeTab === 'info' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-5">
            <h2 className="text-base font-black text-slate-900">{isDocumentProduct ? 'Document info' : 'Course info'}</h2>
            <p className="text-sm font-medium text-slate-500">
              {isDocumentProduct
                ? 'Manage the document listing, cover image, and downloadable file.'
                : 'Title, price, domain, skills, level, language, and preview media.'}
            </p>
          </div>
          <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={isDocumentProduct ? 'Document title' : 'Course title'}>
                  <input value={courseDetails.title} onChange={(event) => updateCourseDetails({ title: event.target.value })} className={editorInputClass} />
                </Field>
                <Field label="Price (MXC)">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={courseDetails.priceMxc}
                    onChange={(event) => updateCourseDetails({ priceMxc: event.target.value })}
                    className={editorInputClass}
                    disabled={!!course?.publishedAt}
                  />
                  {!!course?.publishedAt && (
                    <p className="mt-1 text-xs font-semibold text-slate-500">Price is locked after publication.</p>
                  )}
                </Field>
              </div>
              <Field label="Description">
                <textarea value={courseDetails.description} onChange={(event) => updateCourseDetails({ description: event.target.value })} className={`${editorInputClass} min-h-28`} />
              </Field>
              <div className={`grid gap-4 ${isDocumentProduct ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>
                <CourseMediaDropZone
                  label={isDocumentProduct ? 'Document cover image' : 'Course thumbnail'}
                  kind="image"
                  file={courseDetails.pendingThumbnailFile}
                  mediaUrl={courseDetails.thumbnailUrl}
                  onFile={(file) => selectCourseMedia('image', file)}
                  onClear={() => clearCourseMedia('image')}
                />
                {!isDocumentProduct && <CourseMediaDropZone
                  label="Preview video"
                  kind="video"
                  file={courseDetails.pendingPreviewVideoFile}
                  mediaUrl={courseDetails.previewVideoUrl}
                  onFile={(file) => selectCourseMedia('video', file)}
                  onClear={() => clearCourseMedia('video')}
                />}
              </div>
              {isDocumentProduct && (
                <DocumentResourceManager
                  resourceUrl={documentLesson?.lesson.resourceUrl || ''}
                  pendingFileName={documentLesson?.lesson.pendingResourceName}
                  onFile={selectDocumentResourceFile}
                  onClear={clearDocumentResourceFile}
                />
              )}
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Domain">
                  <select value={courseDetails.categoryId} onChange={(event) => updateCourseDetails({ categoryId: event.target.value })} className={editorInputClass}>
                    <option value="">Choose domain</option>
                    {categories.map((category: CategoryResponse) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Language">
                  <select value={courseDetails.language} onChange={(event) => updateCourseDetails({ language: event.target.value as SupportedLanguage })} className={editorInputClass}>
                    <option value={SupportedLanguage.EN}>English</option>
                    <option value={SupportedLanguage.VI}>Vietnamese</option>
                    <option value={SupportedLanguage.ZH}>Chinese</option>
                    <option value={SupportedLanguage.JA}>Japanese</option>
                  </select>
                </Field>
                <Field label="Level">
                  <select value={courseDetails.level} onChange={(event) => updateCourseDetails({ level: event.target.value })} className={editorInputClass}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </Field>
              </div>
              <Field label="Skills">
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="relative">
                    <input
                      value={skillQuery}
                      onChange={(event) => {
                        setSkillQuery(event.target.value)
                        setIsSkillMenuOpen(true)
                      }}
                      onFocus={() => setIsSkillMenuOpen(true)}
                      onBlur={() => window.setTimeout(() => setIsSkillMenuOpen(false), 120)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          const firstSuggestion = suggestedCourseSkills[0]
                          if (firstSuggestion) addCourseSkill(firstSuggestion.id)
                        }
                        if (event.key === 'Escape') {
                          setIsSkillMenuOpen(false)
                        }
                      }}
                      className={editorInputClass}
                      placeholder="Search skills, e.g. React, Java, Data Science"
                      autoComplete="off"
                    />
                    {isSkillMenuOpen && (
                      <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                        {suggestedCourseSkills.length > 0 ? (
                          suggestedCourseSkills.map((skill: SkillResponse) => (
                            <button
                              key={skill.id}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => addCourseSkill(skill.id)}
                              className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-indigo-50"
                            >
                              <span className="text-sm font-semibold text-slate-900">{skill.labelEn}</span>
                              <span className="text-xs text-slate-500">{skill.slug}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-slate-500">No matching active skills.</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedCourseSkills.map((skill: SkillResponse) => (
                      <span key={skill.id} className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                        {skill.labelEn}
                        <button type="button" onClick={() => removeCourseSkill(skill.id)} className="text-indigo-400 hover:text-indigo-700" title="Remove skill">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                    {selectedCourseSkills.length === 0 && <span className="text-sm text-slate-400">No skills selected.</span>}
                  </div>
                </div>
              </Field>
              <div className="space-y-3">
                {!isDocumentProduct && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  Certificate is included upon completion
                </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => updateCourseDetailsMutation.mutate()}
                    disabled={(!detailsDirty && !(isDocumentProduct && dirty)) || updateCourseDetailsMutation.isLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
                  >
                    {updateCourseDetailsMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save {isDocumentProduct ? 'document' : 'course'} details
                  </button>
                </div>
              </div>
          </div>
        </section>
      )}

      {activeTab === 'sale' && (
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Sales</h2>
              <p className="text-sm font-medium text-slate-500">Track course sales performance and manage the scheduled sale window.</p>
            </div>
            {course?.activeDiscount ? (
              <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Sale active</span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">No active sale</span>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SaleMetricCard label="Lifetime revenue" value={formatCurrency(saleStats.totalRevenue)} helper={`${totalEnrollments} total enrollments`} icon={<CircleDollarSign className="h-5 w-5" />} />
            <SaleMetricCard label="Last 7 days" value={formatCurrency(saleStats.last7Revenue)} helper={`${saleStats.last7Enrollments} new enrollments`} icon={<TrendingUp className="h-5 w-5" />} tone="emerald" />
            <SaleMetricCard label="Previous 7 days" value={formatCurrency(saleStats.previous7Revenue)} helper={`${saleStats.previous7Enrollments} enrollments`} icon={<Calendar className="h-5 w-5" />} tone="slate" />
            <SaleMetricCard label="7-day change" value={saleStats.revenueDeltaPercent == null ? 'New' : `${saleStats.revenueDeltaPercent >= 0 ? '+' : ''}${saleStats.revenueDeltaPercent}%`} helper={`${saleStats.revenueDelta >= 0 ? '+' : ''}${formatCurrency(saleStats.revenueDelta)} vs previous period`} icon={<Users className="h-5 w-5" />} tone={saleStats.revenueDelta >= 0 ? 'emerald' : 'rose'} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Current pricing</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <PriceStat label="Base price" value={formatCurrency(saleStats.basePrice)} />
                <PriceStat label="Effective price" value={saleStats.effectivePrice ? formatCurrency(saleStats.effectivePrice) : 'Free'} />
                <PriceStat label="Discount" value={saleStats.discountAmount ? formatCurrency(saleStats.discountAmount) : 'None'} />
                <PriceStat label="Discount rate" value={saleStats.discountPercent ? `${saleStats.discountPercent}%` : '0%'} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900">Sale schedule</p>
                  <p className="text-xs font-semibold text-slate-500">Set or clear the scheduled sale window.</p>
                </div>
                {(courseDetails.discountPriceMxc || courseDetails.discountStartAt || courseDetails.discountEndAt || course?.discountPriceMxc) && (
                  <button
                    type="button"
                    onClick={() => updateCourseDetails({
                      discountPriceMxc: '',
                      discountStartAt: '',
                      discountEndAt: '',
                      clearDiscount: true,
                    })}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                  >
                    Clear sale
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Sale price (MXC)">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={courseDetails.discountPriceMxc}
                    onChange={(event) => updateCourseDetails({ discountPriceMxc: event.target.value, clearDiscount: false })}
                    className={editorInputClass}
                    placeholder="Lower than base price"
                  />
                </Field>
                <Field label="Starts">
                  <input
                    type="datetime-local"
                    value={courseDetails.discountStartAt}
                    onChange={(event) => updateCourseDetails({ discountStartAt: event.target.value, clearDiscount: false })}
                    className={editorInputClass}
                  />
                </Field>
                <Field label="Ends">
                  <input
                    type="datetime-local"
                    value={courseDetails.discountEndAt}
                    onChange={(event) => updateCourseDetails({ discountEndAt: event.target.value, clearDiscount: false })}
                    className={editorInputClass}
                  />
                </Field>
              </div>

              {courseDetails.clearDiscount && (
                <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">Save sale schedule to remove the current sale.</p>
              )}

              <button
                type="button"
                onClick={() => updateCourseDetailsMutation.mutate()}
                disabled={!detailsDirty || updateCourseDetailsMutation.isLoading}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
              >
                {updateCourseDetailsMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save sale schedule
              </button>
            </div>
          </div>
        </section>
      )}

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</p>}

      {activeTab === 'content' && !isDocumentProduct && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid h-[calc(100vh-15rem)] min-h-[520px] overflow-hidden lg:grid-cols-[320px_1fr]">
          <aside className="min-h-0 overflow-y-auto border-r border-slate-200 bg-slate-50">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">{isDocumentProduct ? 'Document' : 'Sections'}</h2>
            {!isDocumentProduct && <button onClick={addSection} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-indigo-600" title="Add section">
              <Plus className="h-5 w-5" />
            </button>}
          </div>
          <div className="space-y-2 p-3">
            {sections.map((section, sectionIndex) => (
              <div key={section.clientId} className="rounded-xl border border-slate-200 bg-white">
                <div
                  className={`flex items-center gap-1 px-2 py-2 ${
                    selection?.type === 'section' && selection.sectionClientId === section.clientId ? 'text-indigo-700' : 'text-slate-800'
                  }`}
                >
                  <button
                    onClick={() => setSelection({ type: 'section', sectionClientId: section.clientId })}
                    className="min-w-0 flex-1 rounded-lg px-1 py-1 text-left hover:bg-slate-50"
                  >
                    <span className="block truncate text-sm font-black">{sectionIndex + 1}. {section.title || 'Untitled section'}</span>
                  </button>
                  {!isDocumentProduct && <button
                    onClick={() => removeSection(section.clientId)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Delete section"
                    aria-label={`Delete ${section.title || 'section'}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>}
                </div>
                <div className="space-y-1 border-t border-slate-100 p-2">
                  {section.lessons.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.clientId}
                      className={`flex items-center gap-1 rounded-lg px-1 py-1 text-sm font-semibold ${
                        selection?.type === 'lesson' && selection.lessonClientId === lesson.clientId
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <button
                        onClick={() => setSelection({ type: 'lesson', sectionClientId: section.clientId, lessonClientId: lesson.clientId })}
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left"
                      >
                        {lesson.lessonType === LessonType.QUIZ ? <HelpCircle className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
                        <span className="truncate">{sectionIndex + 1}.{lessonIndex + 1} {lesson.title || 'Untitled'}</span>
                      </button>
                      {!isDocumentProduct && <button
                        onClick={() => removeLesson(section.clientId, lesson.clientId)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title={lesson.lessonType === LessonType.QUIZ ? 'Delete quiz' : 'Delete lesson'}
                        aria-label={`Delete ${lesson.title || (lesson.lessonType === LessonType.QUIZ ? 'quiz' : 'lesson')}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>}
                    </div>
                  ))}
                  {!isDocumentProduct && <div className="grid grid-cols-2 gap-1 pt-1">
                    <button onClick={() => addLesson(section.clientId, LessonType.LESSON)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">
                      + Lesson
                    </button>
                    <button onClick={() => addLesson(section.clientId, LessonType.QUIZ)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">
                      + Quiz
                    </button>
                  </div>}
                </div>
              </div>
            ))}
            {sections.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-500">Use the plus button to add your first section.</p>}
          </div>
          </aside>

          <main className="min-h-0 overflow-y-auto p-6">
          {!selection && <EmptyEditor onAddSection={addSection} />}
          {selection?.type === 'section' && selectedSection && (
            <SectionEditor
              section={selectedSection}
              onChange={(patch) => updateSection(selectedSection.clientId, patch)}
              onDelete={() => removeSection(selectedSection.clientId)}
            />
          )}
          {selection?.type === 'lesson' && selectedSection && selectedLesson && (
            <LessonEditor
              lesson={selectedLesson}
              uploadingField={uploadingField}
              onChange={(patch) => updateLesson(selectedSection.clientId, selectedLesson.clientId, patch)}
              onDelete={() => removeLesson(selectedSection.clientId, selectedLesson.clientId)}
              onUpload={uploadLessonAsset}
              onImageInsert={insertLessonContentImage}
            />
          )}
          </main>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-xs font-bold text-slate-500">{dirty ? 'You have unsaved course content changes.' : 'Course content is up to date.'}</p>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
          >
            {saveMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save content
          </button>
        </div>
      </section>}

      {activeTab === 'qa' && (
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-black text-slate-900">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                Course Q&A
              </h2>
              <p className="text-sm font-medium text-slate-500">Answer learner questions for this product.</p>
            </div>
            <span className={`rounded-full px-3 py-2 text-xs font-black ${qaSummary?.unansweredLearners ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {qaSummary?.unansweredLearners || 0} unanswered
            </span>
          </div>

          {qaLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            </div>
          ) : qaThreads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No learner questions yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {qaThreads.map((thread) => {
                const draft = qaReplyDrafts[thread.learnerId] || ''
                return (
                  <article key={thread.learnerId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-slate-900">{thread.learnerName}</p>
                        <p className="text-xs font-semibold text-slate-500">{thread.messages.length} message{thread.messages.length === 1 ? '' : 's'}</p>
                      </div>
                      {thread.unanswered && <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">Needs reply</span>}
                    </div>

                    <div className="max-h-96 space-y-3 overflow-auto rounded-xl border border-slate-200 bg-white p-3">
                      {thread.messages.map((message) => {
                        const fromMentor = message.senderId === course?.instructorId
                        return (
                          <div key={message.id} className={`flex ${fromMentor ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[82%] rounded-xl px-3 py-2 ${fromMentor ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                              <p className={`text-[11px] font-black ${fromMentor ? 'text-indigo-100' : 'text-slate-500'}`}>{message.senderName}</p>
                              <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                              <p className={`mt-2 text-[11px] font-semibold ${fromMentor ? 'text-indigo-100' : 'text-slate-400'}`}>{new Date(message.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-3 space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Reply</label>
                      <textarea
                        value={draft}
                        onChange={(event) => setQaReplyDrafts((current) => ({ ...current, [thread.learnerId]: event.target.value }))}
                        className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                        placeholder={`Reply to ${thread.learnerName}`}
                      />
                      <button
                        type="button"
                        disabled={!draft.trim() || sendQaReplyMutation.isLoading}
                        onClick={() => sendQaReplyMutation.mutate({ recipientId: thread.learnerId, content: draft.trim() })}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
                      >
                        {sendQaReplyMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Send reply
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === 'reviews' && coursePublished && (
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-black text-slate-900">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                Course reviews
              </h2>
              <p className="text-sm font-medium text-slate-500">Track learner satisfaction and respond publicly to reviews.</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <ReviewMetric label="Completion rate" value={`${Math.round(courseStats?.completionRate || 0)}%`} helper={`${courseStats?.completedEnrollments || 0}/${courseStats?.totalEnrollments || 0} learners completed`} />
            <ReviewMetric label="Average rating" value={averageReviewRating ? averageReviewRating.toFixed(1) : '0.0'} helper={`${courseReviewsData?.totalElements || 0} reviews`} />
            <ReviewMetric label="Total enrollments" value={String(courseStats?.totalEnrollments || 0)} helper="Learners in this course" />
            <ReviewMetric label="Responses" value={String(courseReviews.filter((review) => review.responseText).length)} helper="Reviews with mentor reply" />
          </div>

          {reviewsLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            </div>
          ) : courseReviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <Star className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-black text-slate-700">No reviews yet</p>
              <p className="mt-1 text-sm font-medium text-slate-500">Completed learners can leave reviews from their course library.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courseReviews.map((review) => {
                const draft = reviewResponseDrafts[review.id] ?? review.responseText ?? ''
                return (
                  <article key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">{review.isAnonymous ? 'Anonymous learner' : review.reviewerName}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`h-4 w-4 ${star <= Math.round(review.overallRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {review.responseText ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Responded</span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Needs response</span>
                      )}
                    </div>
                    {review.reviewTitle && <h3 className="mb-2 text-sm font-black text-slate-900">{review.reviewTitle}</h3>}
                    <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{review.reviewText}</p>
                    <div className="mt-4 space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Mentor response</label>
                      <textarea
                        value={draft}
                        onChange={(event) => setReviewResponseDrafts((current) => ({ ...current, [review.id]: event.target.value }))}
                        className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                        placeholder="Write a public response to this review"
                      />
                      <button
                        type="button"
                        disabled={!draft.trim() || respondToReviewMutation.isLoading}
                        onClick={() => respondToReviewMutation.mutate({ reviewId: review.id, responseText: draft.trim() })}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
                      >
                        {respondToReviewMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Save response
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      <CourseNameConfirmModal
        isOpen={!!confirmAction}
        courseName={course?.title || ''}
        title={confirmAction === 'delete' ? 'Delete product?' : 'Archive product?'}
        message={confirmAction === 'delete'
          ? 'This product will be removed. Deletion is only allowed when it has zero enrollments.'
          : 'This product will leave the marketplace. Enrolled learners can still access it from their library.'}
        confirmText={confirmAction === 'delete' ? 'Delete Product' : 'Archive Product'}
        confirmTone={confirmAction === 'delete' ? 'rose' : 'slate'}
        isLoading={actionLoading}
        onClose={() => {
          if (!actionLoading) setConfirmAction(null)
        }}
        onConfirm={confirmCourseAction}
      />
    </div>
  )
}

function SaleMetricCard({ label, value, helper, icon, tone = 'indigo' }: {
  label: string
  value: string
  helper: string
  icon: React.ReactNode
  tone?: 'indigo' | 'emerald' | 'rose' | 'slate'
}) {
  const toneClass = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
  }[tone]
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
    </div>
  )
}

function PriceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
    </div>
  )
}

function EmptyEditor({ onAddSection }: { onAddSection: () => void }) {
  return (
    <div className="flex h-full min-h-[560px] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Plus className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-black text-slate-900">Start your curriculum</h2>
      <p className="mt-1 max-w-sm text-sm font-medium text-slate-500">Add sections on the left, then add lessons or quizzes inside each section.</p>
      <button onClick={onAddSection} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Add Section</button>
    </div>
  )
}

function SectionEditor({ section, onChange, onDelete }: {
  section: DraftSection
  onChange: (patch: Partial<DraftSection>) => void
  onDelete: () => void
}) {
  return (
    <div className="max-w-3xl space-y-5">
      <EditorHeader title="Section Settings" onDelete={onDelete} />
      <Field label="Section title">
        <input value={section.title} onChange={(event) => onChange({ title: event.target.value })} className={editorInputClass} />
      </Field>
      <Field label="Description">
        <textarea value={section.description} onChange={(event) => onChange({ description: event.target.value })} className={`${editorInputClass} min-h-32`} />
      </Field>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input type="checkbox" checked={section.isPublished} onChange={(event) => onChange({ isPublished: event.target.checked })} />
        Visible when course is published
      </label>
    </div>
  )
}

function LessonEditor({ lesson, uploadingField, onChange, onDelete, onUpload, onImageInsert }: {
  lesson: DraftLesson
  uploadingField: 'videoUrl' | 'resourceUrl' | null
  onChange: (patch: Partial<DraftLesson>) => void
  onDelete: () => void
  onUpload: (field: 'videoUrl' | 'resourceUrl', file: File) => void
  onImageInsert: (file: File) => Promise<PendingImage>
}) {
  return (
    <div className="max-w-3xl space-y-5">
      <EditorHeader title={lesson.lessonType === LessonType.QUIZ ? 'Quiz Settings' : lesson.lessonType === LessonType.DOCUMENT ? 'Document File' : 'Lesson Settings'} onDelete={onDelete} />
      <Field label="Title">
        <input value={lesson.title} onChange={(event) => onChange({ title: event.target.value })} className={editorInputClass} />
      </Field>
      <Field label="Summary">
        <textarea value={lesson.description} onChange={(event) => onChange({ description: event.target.value })} className={`${editorInputClass} min-h-24`} />
      </Field>
      {lesson.lessonType !== LessonType.DOCUMENT && <Field label="Duration minutes">
        <input type="number" min="0" step="1" value={lesson.durationMinutes} onChange={(event) => onChange({ durationMinutes: event.target.value })} className={`${editorInputClass} max-w-xs`} />
      </Field>}

      {lesson.lessonType === LessonType.LESSON && (
        <UploadField
          label="Optional video"
          value={lesson.videoUrl}
          uploading={uploadingField === 'videoUrl'}
          accept="video/*"
          onChange={(value) => onChange({ videoUrl: value })}
          onUpload={(file) => onUpload('videoUrl', file)}
          onClear={() => onChange({ videoUrl: '', pendingVideoFile: undefined, pendingVideoPreviewUrl: undefined })}
          allowManualUrl={false}
          mediaKind="video"
          previewName={lesson.pendingVideoFile?.name || 'Video'}
        />
      )}
      {lesson.lessonType !== LessonType.QUIZ && (
        <UploadField
          label={lesson.lessonType === LessonType.DOCUMENT ? 'Document file' : 'Optional downloadable file'}
          value={lesson.resourceUrl}
          uploading={uploadingField === 'resourceUrl'}
          accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
          onChange={(value) => onChange({ resourceUrl: value })}
          onUpload={(file) => onUpload('resourceUrl', file)}
          onClear={() => onChange({ resourceUrl: '', pendingResourceFile: undefined, pendingResourceName: undefined })}
          allowManualUrl={false}
          mediaKind="resource"
          previewName={lesson.pendingResourceName}
        />
      )}
      {lesson.lessonType === LessonType.LESSON && (
        <RichTextEditor
          label="Lesson content"
          value={lesson.articleContent}
          onChange={(articleContent) => onChange({ articleContent })}
          onImageChange={(articleContent, pendingImage) => onChange({
            articleContent,
            pendingImages: [...lesson.pendingImages, pendingImage],
          })}
          onImageInsert={onImageInsert}
        />
      )}
      {lesson.lessonType === LessonType.QUIZ && (
        <Field label="Passing score (%)">
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={lesson.passingPercent}
            onChange={(event) => onChange({ passingPercent: event.target.value })}
            className={`${editorInputClass} max-w-xs`}
          />
        </Field>
      )}
      {lesson.lessonType === LessonType.QUIZ && (
        <QuizEditor
          questions={lesson.quizQuestions}
          onChange={(quizQuestions) => onChange({ quizQuestions })}
          onImageInsert={onImageInsert}
        />
      )}

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={lesson.isFreePreview} onChange={(event) => onChange({ isFreePreview: event.target.checked })} />
          Free preview
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={lesson.isMandatory} onChange={(event) => onChange({ isMandatory: event.target.checked })} />
          Required
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={lesson.isPublished} onChange={(event) => onChange({ isPublished: event.target.checked })} />
          Visible
        </label>
      </div>
    </div>
  )
}

function EditorHeader({ title, onDelete }: { title: string; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
      <h2 className="text-xl font-black text-slate-900">{title}</h2>
      <button onClick={onDelete} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50">
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  )
}

function ReviewMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
    </div>
  )
}

function UploadField({
  label,
  value,
  uploading,
  accept,
  onChange,
  onUpload,
  onClear,
  allowManualUrl = true,
  mediaKind = 'file',
  previewName,
}: {
  label: string
  value: string
  uploading: boolean
  accept: string
  onChange: (value: string) => void
  onUpload: (file: File) => void
  onClear: () => void
  allowManualUrl?: boolean
  mediaKind?: 'video' | 'resource' | 'file'
  previewName?: string
}) {
  const displayName = previewName || (value ? getResourceFileName(value) : '')

  return (
    <Field label={label}>
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="mb-3 flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Select
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onUpload(file)
                event.currentTarget.value = ''
              }}
            />
          </label>
          {value && (
            <button type="button" onClick={onClear} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50">
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>
        {allowManualUrl && (
          <input value={value} onChange={(event) => onChange(event.target.value)} className={editorInputClass} placeholder="Uploaded or external URL" />
        )}
        {value && mediaKind === 'video' && (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
              <p className="truncate text-sm font-bold text-slate-700">{displayName}</p>
            </div>
            <video src={value} controls className="aspect-video w-full bg-black" />
          </div>
        )}
        {value && mediaKind === 'resource' && (
          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Downloadable material</p>
                <p className="truncate text-sm font-black text-slate-900">{displayName}</p>
              </div>
            </div>
            <a
              href={value}
              download={displayName}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          </div>
        )}
      </div>
    </Field>
  )
}

function DocumentResourceManager({ resourceUrl, pendingFileName, onFile, onClear }: {
  resourceUrl: string
  pendingFileName?: string
  onFile: (file: File) => void
  onClear: () => void
}) {
  const inputId = 'document-resource-file'
  const displayName = pendingFileName || (resourceUrl ? getResourceFileName(resourceUrl) : '')

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) onFile(file)
  }

  return (
    <Field label="Downloadable file">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          handleFiles(event.dataTransfer.files)
        }}
        className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 transition hover:border-indigo-300"
      >
        {resourceUrl ? (
          <div className="flex flex-col gap-3 rounded-lg bg-white p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">{displayName || 'Document file'}</p>
                <p className="text-xs font-semibold text-slate-500">{pendingFileName ? 'Pending upload. Save document details to publish this file.' : 'Current downloadable material.'}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {!resourceUrl.startsWith('blob:') && (
                <a href={resourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700">
                  <Download className="h-4 w-4" />
                  Download
                </a>
              )}
              <label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                <Upload className="h-4 w-4" />
                Replace
              </label>
              <button type="button" onClick={onClear} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50">
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label htmlFor={inputId} className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg bg-white px-4 py-6 text-center">
            <Download className="mb-3 h-8 w-8 text-indigo-500" />
            <span className="text-sm font-semibold text-slate-900">Drop the document here or click to browse</span>
            <span className="mt-1 text-xs text-slate-500">PDF, Word, PowerPoint, or ZIP up to 100 MB</span>
            <span className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">
              <Upload className="h-3.5 w-3.5" />
              Choose file
            </span>
          </label>
        )}
        <input
          id={inputId}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>
    </Field>
  )
}

function RichTextEditor({ label, value, onChange, onImageChange, onImageInsert }: {
  label: string
  value: string
  onChange: (value: string) => void
  onImageChange: (value: string, pendingImage: PendingImage) => void
  onImageInsert: (file: File) => Promise<PendingImage>
}) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const selectionRef = useRef<Range | null>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const saveSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return
    const range = selection.getRangeAt(0)
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange()
    }
  }

  const runCommand = (command: string) => {
    document.execCommand(command)
    editorRef.current?.focus()
    onChange(editorRef.current?.innerHTML || '')
  }

  const insertHtml = (html: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const selection = window.getSelection()
    if (selectionRef.current && editor.contains(selectionRef.current.commonAncestorContainer)) {
      selection?.removeAllRanges()
      selection?.addRange(selectionRef.current)
    }
    if (!document.execCommand('insertHTML', false, html)) {
      editor.insertAdjacentHTML('beforeend', html)
    }
    saveSelection()
  }

  const insertImage = async (file: File) => {
    const pendingImage = await onImageInsert(file)
    insertHtml(`<img src="${pendingImage.previewUrl}" data-pending-image-id="${pendingImage.id}" alt="" style="max-width:100%;border-radius:12px;margin:12px 0;" />`)
    onImageChange(editorRef.current?.innerHTML || '', pendingImage)
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
          <ToolbarButton title="Bold" onClick={() => runCommand('bold')}><Bold className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton title="Italic" onClick={() => runCommand('italic')}><Italic className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton title="Bulleted list" onClick={() => runCommand('insertUnorderedList')}><List className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton title="Numbered list" onClick={() => runCommand('insertOrderedList')}><ListOrdered className="h-4 w-4" /></ToolbarButton>
          <label className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-indigo-600" title="Upload image">
            <Image className="h-4 w-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) insertImage(file)
                event.currentTarget.value = ''
              }}
            />
          </label>
        </div>
        <div
          ref={(node) => { editorRef.current = node }}
          contentEditable
          className="min-h-64 px-4 py-3 text-sm leading-6 text-slate-900 outline-none [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
          onInput={(event) => {
            saveSelection()
            onChange(event.currentTarget.innerHTML)
          }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onBlur={saveSelection}
          suppressContentEditableWarning
        />
      </div>
    </div>
  )
}

function ToolbarButton({ title, onClick, children }: {
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={onClick} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-indigo-600" title={title}>
      {children}
    </button>
  )
}

function QuizEditor({ questions, onChange, onImageInsert }: {
  questions: DraftQuizQuestion[]
  onChange: (questions: DraftQuizQuestion[]) => void
  onImageInsert: (file: File) => Promise<PendingImage>
}) {
  const addQuestion = (questionType: QuizQuestionType) => {
    const question = createQuizQuestion(questions.length)
    onChange([...questions, applyQuestionTypeDefaults({ ...question, questionType })])
  }

  const updateQuestion = (clientId: string, patch: Partial<DraftQuizQuestion>) => {
    onChange(questions.map((question) => {
      if (question.clientId !== clientId) return question
      const next = { ...question, ...patch }
      if (patch.questionType) return applyQuestionTypeDefaults(next)
      return next
    }))
  }

  const removeQuestion = (clientId: string) => {
    onChange(questions.filter((question) => question.clientId !== clientId))
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Questions</h3>
      </div>

      {questions.map((question, index) => (
        <QuizQuestionEditor
          key={question.clientId}
          index={index}
          question={question}
          onChange={(patch) => updateQuestion(question.clientId, patch)}
          onDelete={() => removeQuestion(question.clientId)}
          onImageInsert={onImageInsert}
        />
      ))}

      {questions.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
          Add at least one question before publishing this quiz.
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        <button type="button" onClick={() => addQuestion(QuizQuestionType.SINGLE_CHOICE)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">+ Multiple Choice</button>
        <button type="button" onClick={() => addQuestion(QuizQuestionType.MULTIPLE_CHOICE)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">+ Checkboxes</button>
        <button type="button" onClick={() => addQuestion(QuizQuestionType.TRUE_FALSE)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">+ T/F</button>
        <button type="button" onClick={() => addQuestion(QuizQuestionType.TEXT_ANSWER)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">+ Text</button>
      </div>
    </div>
  )
}

function QuizQuestionEditor({ index, question, onChange, onDelete, onImageInsert }: {
  index: number
  question: DraftQuizQuestion
  onChange: (patch: Partial<DraftQuizQuestion>) => void
  onDelete: () => void
  onImageInsert: (file: File) => Promise<PendingImage>
}) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Question {index + 1}</p>
          <p className="text-sm font-bold text-slate-700">{questionTypeLabel(question.questionType)}</p>
        </div>
        <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50">
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_140px]">
        <Field label="Question type">
          <select value={question.questionType} onChange={(event) => onChange({ questionType: event.target.value as QuizQuestionType })} className={editorInputClass}>
            <option value={QuizQuestionType.SINGLE_CHOICE}>Multiple choice</option>
            <option value={QuizQuestionType.MULTIPLE_CHOICE}>Checkboxes</option>
            <option value={QuizQuestionType.TRUE_FALSE}>True / False</option>
            <option value={QuizQuestionType.TEXT_ANSWER}>Text answer</option>
          </select>
        </Field>
        <Field label="Points">
          <input type="number" min="1" step="1" value={question.points} onChange={(event) => onChange({ points: event.target.value })} className={editorInputClass} />
        </Field>
      </div>

      <RichTextEditor
        label="Question description"
        value={question.questionText}
        onChange={(questionText) => onChange({ questionText })}
        onImageChange={(questionText, pendingImage) => onChange({
          questionText,
          pendingImages: [...question.pendingImages, pendingImage],
        })}
        onImageInsert={onImageInsert}
      />

      {question.questionType === QuizQuestionType.TEXT_ANSWER ? (
        <Field label="Correct text answer">
          <input value={question.textAnswer} onChange={(event) => onChange({ textAnswer: event.target.value })} className={editorInputClass} />
        </Field>
      ) : (
        <QuizOptionsEditor question={question} onChange={onChange} />
      )}

      <Field label="Explanation">
        <textarea value={question.explanation} onChange={(event) => onChange({ explanation: event.target.value })} className={`${editorInputClass} min-h-20`} />
      </Field>
    </div>
  )
}

function QuizOptionsEditor({ question, onChange }: {
  question: DraftQuizQuestion
  onChange: (patch: Partial<DraftQuizQuestion>) => void
}) {
  const isMultiple = question.questionType === QuizQuestionType.MULTIPLE_CHOICE
  const options = question.questionType === QuizQuestionType.TRUE_FALSE ? ['True', 'False'] : question.options

  const updateOption = (index: number, value: string) => {
    const nextOptions = question.options.map((option, optionIndex) => optionIndex === index ? value : option)
    const nextCorrect = question.correctAnswers.map((answer) => answer === question.options[index] ? value : answer)
    onChange({ options: nextOptions, correctAnswers: nextCorrect })
  }

  const addOption = () => {
    onChange({ options: [...question.options, `Option ${question.options.length + 1}`] })
  }

  const removeOption = (index: number) => {
    const removed = question.options[index]
    const nextOptions = question.options.filter((_, optionIndex) => optionIndex !== index)
    onChange({ options: nextOptions, correctAnswers: question.correctAnswers.filter((answer) => answer !== removed) })
  }

  const toggleCorrect = (option: string) => {
    if (isMultiple) {
      const exists = question.correctAnswers.includes(option)
      onChange({ correctAnswers: exists ? question.correctAnswers.filter((answer) => answer !== option) : [...question.correctAnswers, option] })
      return
    }
    onChange({ correctAnswers: [option] })
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-slate-700">Choices</p>
      {options.map((option, index) => (
        <div key={`${option}-${index}`} className="flex items-center gap-2">
          <input
            type={isMultiple ? 'checkbox' : 'radio'}
            checked={question.correctAnswers.includes(option)}
            onChange={() => toggleCorrect(option)}
            className="h-4 w-4"
          />
          {question.questionType === QuizQuestionType.TRUE_FALSE ? (
            <span className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">{option}</span>
          ) : (
            <input value={option} onChange={(event) => updateOption(index, event.target.value)} className={editorInputClass} />
          )}
          {question.questionType !== QuizQuestionType.TRUE_FALSE && question.options.length > 2 && (
            <button type="button" onClick={() => removeOption(index)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Remove choice">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      {question.questionType !== QuizQuestionType.TRUE_FALSE && (
        <button type="button" onClick={addOption} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">
          + Choice
        </button>
      )}
    </div>
  )
}

async function prepareSectionsForSave(sections: DraftSection[]) {
  const preparedSections: DraftSection[] = []
  for (const section of sections) {
    const preparedLessons: DraftLesson[] = []
    for (const lesson of section.lessons) {
      let videoUrl = lesson.videoUrl
      let resourceUrl = lesson.resourceUrl
      let articleContent = lesson.articleContent

      if (lesson.pendingVideoFile && videoUrl) {
        const result = await fileApi.uploadCourseMedia(lesson.pendingVideoFile, 'mentorx/courses/lessons/videos')
        videoUrl = result.fileUrl
      }

      if (lesson.pendingResourceFile && resourceUrl) {
        const result = await fileApi.uploadCourseMedia(lesson.pendingResourceFile, 'mentorx/courses/lessons/files')
        resourceUrl = result.fileUrl
      }

      articleContent = await uploadReferencedPendingImages(articleContent, lesson.pendingImages)
      const quizQuestions: DraftQuizQuestion[] = []
      for (const question of lesson.quizQuestions) {
        quizQuestions.push({
          ...question,
          questionText: await uploadReferencedPendingImages(question.questionText, question.pendingImages),
          pendingImages: [],
        })
      }

      preparedLessons.push({
        ...lesson,
        videoUrl,
        resourceUrl,
        articleContent,
        pendingVideoFile: undefined,
        pendingVideoPreviewUrl: undefined,
        pendingResourceFile: undefined,
        pendingResourceName: undefined,
        pendingImages: [],
        quizQuestions,
      })
    }
    preparedSections.push({ ...section, lessons: preparedLessons })
  }
  return preparedSections
}

async function uploadReferencedPendingImages(html: string, pendingImages: PendingImage[]) {
  if (!html || pendingImages.length === 0) return html
  const parser = new DOMParser()
  const document = parser.parseFromString(html, 'text/html')
  const images = Array.from(document.querySelectorAll<HTMLImageElement>('img[data-pending-image-id]'))

  for (const image of images) {
    const pendingId = image.dataset.pendingImageId
    const pendingImage = pendingImages.find((item) => item.id === pendingId)
    if (!pendingImage) continue
    const result = await fileApi.uploadCourseMedia(pendingImage.file, 'mentorx/courses/lessons/images')
    image.src = result.fileUrl
    image.removeAttribute('data-pending-image-id')
  }

  return document.body.innerHTML
}

function extractImageSources(html: string) {
  if (!html) return []
  const parser = new DOMParser()
  const document = parser.parseFromString(html, 'text/html')
  return Array.from(document.querySelectorAll<HTMLImageElement>('img'))
    .map((image) => image.getAttribute('src') || '')
    .filter(Boolean)
}

function collectMediaUrlsFromSavedLessons(lessons: Array<{ videoUrl?: string; resourceUrl?: string; articleContent?: string }>) {
  return uniqueMediaUrls(
    lessons.flatMap((lesson) => [
      lesson.videoUrl || '',
      lesson.resourceUrl || '',
      ...extractImageSources(lesson.articleContent || ''),
    ])
  )
}

function collectMediaUrlsFromDraftSections(sections: DraftSection[]) {
  return uniqueMediaUrls(
    sections.flatMap((section) =>
      section.lessons.flatMap((lesson) => [
        lesson.videoUrl || '',
        lesson.resourceUrl || '',
        ...extractImageSources(lesson.articleContent || ''),
        ...lesson.quizQuestions.flatMap((question) => extractImageSources(question.questionText || '')),
      ])
    )
  )
}

function collectMediaUrlsFromSavedQuizQuestions(questions: Array<{ questionText?: string }>) {
  return uniqueMediaUrls(questions.flatMap((question) => extractImageSources(question.questionText || '')))
}

function ensureDocumentProductSections(sections: DraftSection[], courseDetails: CourseDetailsDraft) {
  const existingSection = sections[0]
  const existingLesson = sections.flatMap((section) => section.lessons).find((lesson) => lesson.lessonType === LessonType.DOCUMENT)
    || existingSection?.lessons[0]
  const documentLesson: DraftLesson = {
    ...(existingLesson || createLesson(LessonType.DOCUMENT, 0)),
    title: courseDetails.title.trim() || 'Document',
    description: courseDetails.description || '',
    lessonType: LessonType.DOCUMENT,
    durationMinutes: '',
    videoUrl: '',
    articleContent: '',
    isFreePreview: false,
    isMandatory: true,
    isPublished: true,
    passingPercent: '',
    quizQuestions: [],
  }
  return [{
    ...(existingSection || createSection(0)),
    title: 'Document',
    description: courseDetails.description || '',
    isPublished: true,
    lessons: [documentLesson],
  }]
}

function validateDocumentProduct(sections: DraftSection[]) {
  const documentLesson = sections[0]?.lessons[0]
  if (!documentLesson?.resourceUrl) return 'Upload the downloadable document file before saving.'
  return ''
}

function uniqueMediaUrls(urls: string[]) {
  return Array.from(new Set(urls.filter((url) => url.startsWith('http://') || url.startsWith('https://'))))
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

function buildCurriculumHydrationKey(
  sections: unknown[],
  lessons: unknown[],
  quizQuestionData: Array<{ lessonId?: string; questions: unknown[] }>
) {
  return JSON.stringify({ sections, lessons, quizQuestionData })
}

function normalizeEditorLessonType(lessonType?: LessonType) {
  if (lessonType === LessonType.QUIZ) return LessonType.QUIZ
  if (lessonType === LessonType.DOCUMENT) return LessonType.DOCUMENT
  return LessonType.LESSON
}

function readPassingPercent(metadata?: Record<string, unknown>) {
  return clampPassingPercent(Number(metadata?.passingPercent ?? 50))
}

function clampPassingPercent(value: number) {
  if (!Number.isFinite(value)) return 50
  return Math.min(Math.max(Math.round(value), 0), 100)
}

type QuizAnswerData = {
  options: string[]
  correctAnswers: string[]
  textAnswer: string
}

function parseAnswerData(value: string | undefined, questionType: QuizQuestionType): QuizAnswerData {
  const fallback = {
    options: defaultOptionsForType(questionType),
    correctAnswers: questionType === QuizQuestionType.TEXT_ANSWER ? [] : [],
    textAnswer: '',
  }
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value)
    const options = Array.isArray(parsed?.options)
      ? parsed.options.map(String)
      : defaultOptionsForType(questionType)
    const correctAnswers = Array.isArray(parsed?.correctAnswers)
      ? parsed.correctAnswers.map(String)
      : []
    const textAnswer = typeof parsed?.correctAnswer === 'string' ? parsed.correctAnswer : ''
    return { options, correctAnswers, textAnswer }
  } catch {
    return fallback
  }
}

function defaultOptionsForType(questionType: QuizQuestionType) {
  if (questionType === QuizQuestionType.TRUE_FALSE) return ['True', 'False']
  if (questionType === QuizQuestionType.TEXT_ANSWER) return []
  return ['Option 1', 'Option 2']
}

function applyQuestionTypeDefaults(question: DraftQuizQuestion) {
  if (question.questionType === QuizQuestionType.TRUE_FALSE) {
    return { ...question, options: ['True', 'False'], correctAnswers: question.correctAnswers.includes('False') ? ['False'] : ['True'], textAnswer: '' }
  }
  if (question.questionType === QuizQuestionType.TEXT_ANSWER) {
    return { ...question, options: [], correctAnswers: [], textAnswer: question.textAnswer || '', }
  }
  const options = question.options.length >= 2 ? question.options : ['Option 1', 'Option 2']
  const correctAnswers = question.questionType === QuizQuestionType.MULTIPLE_CHOICE
    ? question.correctAnswers.filter((answer) => options.includes(answer))
    : [question.correctAnswers.find((answer) => options.includes(answer)) || options[0]]
  return { ...question, options, correctAnswers, textAnswer: '' }
}

function answerDataJsonForQuestion(question: DraftQuizQuestion) {
  if (question.questionType === QuizQuestionType.TEXT_ANSWER) {
    return JSON.stringify({ correctAnswer: question.textAnswer.trim() })
  }
  const options = question.questionType === QuizQuestionType.TRUE_FALSE ? ['True', 'False'] : question.options
  const correctAnswers = question.questionType === QuizQuestionType.TRUE_FALSE
    ? (question.correctAnswers.length ? question.correctAnswers : ['True'])
    : question.correctAnswers
  return JSON.stringify({ options, correctAnswers })
}

function questionTypeLabel(questionType: QuizQuestionType) {
  switch (questionType) {
    case QuizQuestionType.SINGLE_CHOICE:
      return 'Multiple choice'
    case QuizQuestionType.MULTIPLE_CHOICE:
      return 'Checkboxes'
    case QuizQuestionType.TRUE_FALSE:
      return 'True / False'
    case QuizQuestionType.TEXT_ANSWER:
      return 'Text answer'
    default:
      return 'Question'
  }
}

function preserveSelection(currentSelection: Selection | null, previousSections: DraftSection[], nextSections: DraftSection[]): Selection | null {
  if (!nextSections.length) return null
  if (!currentSelection) return { type: 'section', sectionClientId: nextSections[0].clientId }

  const directSection = nextSections.find((section) => section.clientId === currentSelection.sectionClientId)
  if (currentSelection.type === 'section' && directSection) {
    return { type: 'section', sectionClientId: directSection.clientId }
  }

  if (currentSelection.type === 'lesson' && directSection) {
    const directLesson = directSection.lessons.find((lesson) => lesson.clientId === currentSelection.lessonClientId)
    if (directLesson) {
      return { type: 'lesson', sectionClientId: directSection.clientId, lessonClientId: directLesson.clientId }
    }
  }

  const previousSectionIndex = previousSections.findIndex((section) => section.clientId === currentSelection.sectionClientId)
  const nextSection = nextSections[previousSectionIndex]
  if (!nextSection) return { type: 'section', sectionClientId: nextSections[0].clientId }

  if (currentSelection.type === 'section') {
    return { type: 'section', sectionClientId: nextSection.clientId }
  }

  const previousSection = previousSections[previousSectionIndex]
  const previousLessonIndex = previousSection?.lessons.findIndex((lesson) => lesson.clientId === currentSelection.lessonClientId) ?? -1
  const nextLesson = nextSection.lessons[previousLessonIndex]
  if (nextLesson) {
    return { type: 'lesson', sectionClientId: nextSection.clientId, lessonClientId: nextLesson.clientId }
  }
  return { type: 'section', sectionClientId: nextSection.clientId }
}

function validateCurriculum(sections: DraftSection[]) {
  if (!sections.length) return 'Add at least one section before saving.'
  for (const section of sections) {
    if (section.title.trim().length < 3) return 'Each section needs a title with at least 3 characters.'
    if (section.description.length > 1000) return 'Section descriptions must be 1000 characters or fewer.'
    for (const lesson of section.lessons) {
      if (lesson.title.trim().length < 3) return 'Each lesson needs a title with at least 3 characters.'
      if (lesson.description.length > 2000) return 'Lesson summaries must be 2000 characters or fewer.'
      if (lesson.durationMinutes) {
        const duration = Number(lesson.durationMinutes)
        if (!Number.isInteger(duration) || duration < 0) return 'Lesson duration must be a full number and cannot be negative.'
      }
      if (lesson.lessonType === LessonType.QUIZ) {
        const passingPercent = Number(lesson.passingPercent || 50)
        if (!Number.isInteger(passingPercent) || passingPercent < 0 || passingPercent > 100) return 'Quiz passing score must be a full number from 0 to 100.'
        if (!lesson.quizQuestions.length) return 'Each quiz needs at least one question.'
        for (const question of lesson.quizQuestions) {
          if (stripHtml(question.questionText).length < 3) return 'Each quiz question needs a description.'
          const points = Number(question.points)
          if (!Number.isInteger(points) || points < 1) return 'Quiz question points must be a full number greater than zero.'
          if (question.questionType === QuizQuestionType.TEXT_ANSWER && !question.textAnswer.trim()) return 'Text answer questions need a correct answer.'
          if (question.questionType !== QuizQuestionType.TEXT_ANSWER && question.correctAnswers.length === 0) return 'Choice questions need at least one correct answer.'
          if ((question.questionType === QuizQuestionType.SINGLE_CHOICE || question.questionType === QuizQuestionType.MULTIPLE_CHOICE)
            && question.options.some((option) => !option.trim())) return 'Quiz choices cannot be empty.'
        }
      }
    }
  }
  return ''
}

function stripHtml(html: string) {
  const document = new DOMParser().parseFromString(html || '', 'text/html')
  return document.body.textContent?.trim() || ''
}

function validateAsset(file: File, field: 'videoUrl' | 'resourceUrl') {
  if (field === 'videoUrl') {
    if (!file.type.startsWith('video/')) return 'Lesson video must be a video file.'
    if (file.size > 500 * 1024 * 1024) return 'Lesson video must be 500 MB or smaller.'
  }
  if (field === 'resourceUrl') {
    const allowed = [
      'application/pdf',
      'application/zip',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.ms-powerpoint',
    ]
    if (file.type && !allowed.includes(file.type)) return 'Downloadable file must be PDF, Word, PowerPoint, or ZIP.'
    if (file.size > 100 * 1024 * 1024) return 'Downloadable file must be 100 MB or smaller.'
  }
  return ''
}

type QaThread = {
  learnerId: string
  learnerName: string
  messages: CourseQaMessageResponse[]
  unanswered: boolean
}

function groupQaMessagesByLearner(messages: CourseQaMessageResponse[], instructorId?: string): QaThread[] {
  if (!instructorId) return []
  const byLearner = new Map<string, QaThread>()
  for (const message of messages) {
    const fromMentor = message.senderId === instructorId
    const learnerId = fromMentor ? message.recipientId : message.senderId
    if (!learnerId) continue
    const existing = byLearner.get(learnerId)
    if (existing) {
      existing.messages.push(message)
      if (!fromMentor) existing.learnerName = message.senderName
      continue
    }
    byLearner.set(learnerId, {
      learnerId,
      learnerName: fromMentor ? 'Learner' : message.senderName,
      messages: [message],
      unanswered: false,
    })
  }
  return Array.from(byLearner.values())
    .map((thread) => {
      const sortedMessages = [...thread.messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      const lastLearnerMessage = [...sortedMessages].reverse().find((message) => message.senderId !== instructorId)
      const lastMentorReply = [...sortedMessages].reverse().find((message) => message.senderId === instructorId)
      return {
        ...thread,
        messages: sortedMessages,
        unanswered: !!lastLearnerMessage && (!lastMentorReply || new Date(lastLearnerMessage.createdAt) > new Date(lastMentorReply.createdAt)),
      }
    })
    .sort((a, b) => {
      if (a.unanswered !== b.unanswered) return a.unanswered ? -1 : 1
      const aLast = a.messages[a.messages.length - 1]?.createdAt || ''
      const bLast = b.messages[b.messages.length - 1]?.createdAt || ''
      return new Date(bLast).getTime() - new Date(aLast).getTime()
    })
}

function toApiDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value
}

function toDateTimeLocalValue(value?: string) {
  if (!value) return ''
  return value.slice(0, 16)
}
