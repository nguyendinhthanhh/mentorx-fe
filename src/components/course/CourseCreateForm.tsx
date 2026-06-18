import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { courseApi } from '@/api/courseApi'
import { fileApi } from '@/api/fileApi'
import { categoryApi } from '@/api/categoryApi'
import { skillApi } from '@/api/skillApi'
import { CourseMediaDropZone, CourseMediaKind, validateCourseMedia } from './CourseMediaDropZone'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bold, Download, FileText, HelpCircle, Image, Italic, List, ListOrdered, Loader2, Plus, Trash2, Upload, Video, X } from 'lucide-react'
import { CategoryResponse, CourseProductType, LessonType, QuizQuestionType, SkillResponse, SupportedLanguage } from '@/types'

const courseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').optional().or(z.literal('')),
  categoryId: z.coerce.number().int().positive('Please choose a domain/category'),
  skillIds: z.array(z.number()).min(1, 'Please choose at least one skill'),
  priceMxc: z.coerce.number({
    invalid_type_error: 'Price must be a full number',
  }).int('Price must be a full number').min(0, 'Price cannot be negative'),
  language: z.string().optional(),
  level: z.string().optional(),
})

type CourseFormData = z.infer<typeof courseSchema>

type CreateLessonDraft = {
  clientId: string
  title: string
  description: string
  lessonType: LessonType.LESSON | LessonType.QUIZ
  durationMinutes: string
  videoUrl: string
  articleContent: string
  resourceUrl: string
  isFreePreview: boolean
  isMandatory: boolean
  isPublished: boolean
  pendingVideoFile: File | null
  pendingResourceFile: File | null
  pendingImages: PendingImage[]
  passingPercent: string
  quizQuestions: CreateQuizQuestionDraft[]
}

type PendingImage = {
  id: string
  file: File
  previewUrl: string
}

type CreateQuizQuestionDraft = {
  clientId: string
  questionType: QuizQuestionType
  questionText: string
  options: string[]
  correctAnswers: string[]
  textAnswer: string
  points: string
  explanation: string
  pendingImages: PendingImage[]
}

type CreateSectionDraft = {
  clientId: string
  title: string
  description: string
  isPublished: boolean
  lessons: CreateLessonDraft[]
}

type CreateSelection =
  | { type: 'section'; sectionClientId: string }
  | { type: 'lesson'; sectionClientId: string; lessonClientId: string }

const newClientId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const createQuizQuestionDraft = (index = 0): CreateQuizQuestionDraft => ({
  clientId: newClientId(),
  questionType: QuizQuestionType.SINGLE_CHOICE,
  questionText: `Question ${index + 1}`,
  options: ['Option 1', 'Option 2'],
  correctAnswers: ['Option 1'],
  textAnswer: '',
  points: '1',
  explanation: '',
  pendingImages: [],
})

const createLessonDraft = (type: CreateLessonDraft['lessonType'] = LessonType.LESSON, index = 0): CreateLessonDraft => ({
  clientId: newClientId(),
  title: type === LessonType.QUIZ ? `Quiz ${index + 1}` : `Lesson ${index + 1}`,
  description: '',
  lessonType: type,
  durationMinutes: '',
  videoUrl: '',
  articleContent: '',
  resourceUrl: '',
  isFreePreview: false,
  isMandatory: true,
  isPublished: true,
  pendingVideoFile: null,
  pendingResourceFile: null,
  pendingImages: [],
  passingPercent: type === LessonType.QUIZ ? '50' : '',
  quizQuestions: type === LessonType.QUIZ ? [createQuizQuestionDraft(0)] : [],
})

const createSectionDraft = (index = 0): CreateSectionDraft => ({
  clientId: newClientId(),
  title: index === 0 ? 'Getting started' : '',
  description: '',
  isPublished: true,
  lessons: [],
})

export default function CourseCreateForm({ instructorId }: { instructorId: string }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [skills, setSkills] = useState<SkillResponse[]>([])
  const [skillQuery, setSkillQuery] = useState('')
  const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState('')
  const [previewVideoFile, setPreviewVideoFile] = useState<File | null>(null)
  const [previewVideoPreviewUrl, setPreviewVideoPreviewUrl] = useState('')
  const [sections, setSections] = useState<CreateSectionDraft[]>([])
  const [selection, setSelection] = useState<CreateSelection | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'content'>('info')

  useEffect(() => {
    void categoryApi.getAllActive().then(setCategories).catch(() => setCategories([]))
    void skillApi.getAllActive().then(setSkills).catch(() => setSkills([]))
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      language: SupportedLanguage.EN,
      level: 'Beginner',
      skillIds: [],
    },
  })

  const selectedSkillIds = watch('skillIds') || []
  const selectedSkills = skills.filter((skill) => selectedSkillIds.includes(skill.id))
  const selectedSection = sections.find((section) => section.clientId === selection?.sectionClientId)
  const selectedLesson = selection?.type === 'lesson'
    ? selectedSection?.lessons.find((lesson) => lesson.clientId === selection.lessonClientId)
    : null
  const availableSkills = skills.filter((skill) => !selectedSkillIds.includes(skill.id))
  const suggestedSkills = availableSkills
    .filter((skill) => {
      const query = skillQuery.trim().toLowerCase()
      if (!query) return true
      return [
        skill.labelEn,
        skill.labelVi,
        skill.slug,
      ].some((value) => value?.toLowerCase().includes(query))
    })
    .slice(0, 8)

  const buildSlug = (value: string) => value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  const onSubmit = async (data: CourseFormData) => {
    try {
      setLoading(true)
      setError('')
      let thumbnailUrl: string | undefined
      let previewVideoUrl: string | undefined
      let curriculum: Parameters<typeof courseApi.createWithCurriculum>[0]['curriculum'] | undefined

      if (thumbnailFile) {
        const result = await fileApi.uploadCourseMedia(thumbnailFile, 'mentorx/courses/previews/images')
        thumbnailUrl = result.fileUrl
      }

      if (previewVideoFile) {
        const result = await fileApi.uploadCourseMedia(previewVideoFile, 'mentorx/courses/previews/videos')
        previewVideoUrl = result.fileUrl
      }

      const validationError = validateCourseSections(sections)
      if (validationError) throw new Error(validationError)
      curriculum = await buildCourseCurriculum(sections)

      const course = await courseApi.createWithCurriculum({
        course: {
          ...data,
          slug: buildSlug(data.title),
          instructorId,
          categoryId: data.categoryId,
          skillIds: data.skillIds,
          description: data.description || undefined,
          thumbnailUrl,
          previewVideoUrl,
          language: data.language as SupportedLanguage | undefined,
          productType: CourseProductType.COURSE,
          isCertificate: true,
        },
        curriculum,
      })
      const createdCourseId = course.courseId || course.id
      navigate(`/mentor/courses/${createdCourseId}/manage`)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create course. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'
  const labelClass = 'mb-1.5 block text-sm font-bold text-slate-700'

  const addSkill = (id: number) => {
    if (!id || selectedSkillIds.includes(id)) return
    setValue('skillIds', [...selectedSkillIds, id], { shouldValidate: true, shouldDirty: true })
    setSkillQuery('')
    setIsSkillMenuOpen(false)
  }

  const removeSkill = (id: number) => {
    setValue('skillIds', selectedSkillIds.filter((skillId) => skillId !== id), { shouldValidate: true, shouldDirty: true })
  }

  const selectCourseMedia = (kind: CourseMediaKind, file: File) => {
    const validation = validateCourseMedia(file, kind)
    if (validation) {
      setError(validation)
      return
    }
    const previewUrl = URL.createObjectURL(file)
    if (kind === 'image') {
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl)
      setThumbnailFile(file)
      setThumbnailPreviewUrl(previewUrl)
    } else {
      if (previewVideoPreviewUrl) URL.revokeObjectURL(previewVideoPreviewUrl)
      setPreviewVideoFile(file)
      setPreviewVideoPreviewUrl(previewUrl)
    }
    setError('')
  }

  const clearCourseMedia = (kind: CourseMediaKind) => {
    if (kind === 'image') {
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl)
      setThumbnailFile(null)
      setThumbnailPreviewUrl('')
    } else {
      if (previewVideoPreviewUrl) URL.revokeObjectURL(previewVideoPreviewUrl)
      setPreviewVideoFile(null)
      setPreviewVideoPreviewUrl('')
    }
  }

  const updateSection = (sectionId: string, patch: Partial<CreateSectionDraft>) => {
    setSections((current) => current.map((section) => (
      section.clientId === sectionId ? { ...section, ...patch } : section
    )))
  }

  const addSection = () => {
    const section = createSectionDraft(sections.length)
    setSections((current) => [...current, section])
    setSelection({ type: 'section', sectionClientId: section.clientId })
  }

  const removeSection = (sectionId: string) => {
    const next = sections.filter((section) => section.clientId !== sectionId)
    setSections(next)
    setSelection((currentSelection) => {
      if (currentSelection?.sectionClientId !== sectionId) return currentSelection
      return next[0] ? { type: 'section', sectionClientId: next[0].clientId } : null
    })
  }

  const updateLesson = (sectionId: string, lessonId: string, patch: Partial<CreateLessonDraft>) => {
    setSections((current) => current.map((section) => {
      if (section.clientId !== sectionId) return section
      return {
        ...section,
        lessons: section.lessons.map((lesson) => (
          lesson.clientId === lessonId ? { ...lesson, ...patch } : lesson
        )),
      }
    }))
  }

  const addLesson = (sectionId: string, lessonType: CreateLessonDraft['lessonType'] = LessonType.LESSON) => {
    const targetSection = sections.find((section) => section.clientId === sectionId)
    if (!targetSection) return
    const lesson = createLessonDraft(lessonType, targetSection.lessons.length)
    setSections((current) => current.map((section) => {
      if (section.clientId !== sectionId) return section
      return { ...section, lessons: [...section.lessons, lesson] }
    }))
    setSelection({ type: 'lesson', sectionClientId: sectionId, lessonClientId: lesson.clientId })
  }

  const removeLesson = (sectionId: string, lessonId: string) => {
    let nextLessonsForSection: CreateLessonDraft[] = []
    setSections((current) => current.map((section) => {
      if (section.clientId !== sectionId) return section
      const nextLessons = section.lessons.filter((lesson) => lesson.clientId !== lessonId)
      nextLessonsForSection = nextLessons
      return { ...section, lessons: nextLessons }
    }))
    setSelection((currentSelection) => {
      if (currentSelection?.type !== 'lesson' || currentSelection.lessonClientId !== lessonId) return currentSelection
      return nextLessonsForSection[0]
        ? { type: 'lesson', sectionClientId: sectionId, lessonClientId: nextLessonsForSection[0].clientId }
        : { type: 'section', sectionClientId: sectionId }
    })
  }

  const buildCourseCurriculum = async (draftSections: CreateSectionDraft[]) => ({
    sections: await Promise.all(draftSections.map(async (section, sectionIndex) => ({
      title: section.title.trim(),
      description: section.description.trim() || undefined,
      sectionOrder: sectionIndex + 1,
      isPublished: section.isPublished,
      lessons: await Promise.all(section.lessons.map(async (lesson, lessonIndex) => {
        let videoUrl = lesson.videoUrl.trim() || undefined
        let resourceUrl = lesson.resourceUrl.trim() || undefined

        if (lesson.pendingVideoFile) {
          const result = await fileApi.uploadCourseMedia(lesson.pendingVideoFile, 'mentorx/courses/lessons/videos')
          videoUrl = result.fileUrl
        }

        if (lesson.pendingResourceFile) {
          const result = await fileApi.uploadCourseMedia(lesson.pendingResourceFile, 'mentorx/courses/lessons/files')
          resourceUrl = result.fileUrl
        }

        const articleContent = await uploadReferencedPendingImages(lesson.articleContent.trim(), lesson.pendingImages)
        const quizQuestions: CreateQuizQuestionDraft[] = []
        if (lesson.lessonType === LessonType.QUIZ) {
          for (const question of lesson.quizQuestions) {
            quizQuestions.push({
              ...question,
              questionText: await uploadReferencedPendingImages(question.questionText.trim(), question.pendingImages),
              pendingImages: [],
            })
          }
        }

        return {
          title: lesson.title.trim(),
          description: lesson.description.trim() || undefined,
          lessonType: lesson.lessonType,
          lessonOrder: lessonIndex + 1,
          durationMinutes: lesson.durationMinutes ? Number(lesson.durationMinutes) : undefined,
          videoUrl,
          articleContent: articleContent || undefined,
          resourceUrl,
          isFreePreview: lesson.isFreePreview,
          isPublished: lesson.isPublished,
          isMandatory: lesson.isMandatory,
          metadata: lesson.lessonType === LessonType.QUIZ
            ? { passingPercent: clampPercent(Number(lesson.passingPercent || 50)) }
            : undefined,
          quizQuestions: lesson.lessonType === LessonType.QUIZ
            ? quizQuestions.map((question, questionIndex) => ({
                questionType: question.questionType,
                questionText: question.questionText,
                answerDataJson: answerDataJsonForQuestion(question),
                points: question.points ? Number(question.points) : 1,
                explanation: question.explanation || undefined,
                orderIndex: questionIndex + 1,
              }))
            : undefined,
        }
      })),
    }))),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1">
        {[
          { key: 'info' as const, label: 'Course info' },
          { key: 'content' as const, label: 'Course content' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black transition ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={activeTab === 'info' ? 'space-y-5 rounded-2xl border border-slate-200 bg-white p-5' : 'hidden'}>
      <div>
        <label className={labelClass}>Course Title</label>
        <input
          {...register('title')}
          className={inputClass}
          placeholder="e.g., Introduction to Machine Learning"
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Domain</label>
        <select {...register('categoryId')} className={inputClass}>
          <option value="">Select a domain</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Skills</label>
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
                  const firstSuggestion = suggestedSkills[0]
                  if (firstSuggestion) addSkill(firstSuggestion.id)
                }
                if (event.key === 'Escape') {
                  setIsSkillMenuOpen(false)
                }
              }}
              className={inputClass}
              placeholder="Search skills, e.g. React, Java, Data Science"
              autoComplete="off"
            />
            {isSkillMenuOpen && (
              <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                {suggestedSkills.length > 0 ? (
                  suggestedSkills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => addSkill(skill.id)}
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
            {selectedSkills.map((skill) => (
              <span key={skill.id} className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                {skill.labelEn}
                <button type="button" onClick={() => removeSkill(skill.id)} className="text-indigo-400 hover:text-indigo-700">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {selectedSkills.length === 0 && <span className="text-sm text-slate-400">No skills selected.</span>}
          </div>
        </div>
        {errors.skillIds && <p className="text-xs text-red-500 mt-1">{errors.skillIds.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          {...register('description')}
          rows={5}
          className={inputClass}
          placeholder="What will students learn in this course? What are the prerequisites?"
        />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CourseMediaDropZone
          label="Course thumbnail"
          kind="image"
          file={thumbnailFile}
          mediaUrl={thumbnailPreviewUrl}
          onFile={(file) => selectCourseMedia('image', file)}
          onClear={() => clearCourseMedia('image')}
        />
        <CourseMediaDropZone
          label="Preview video"
          kind="video"
          file={previewVideoFile}
          mediaUrl={previewVideoPreviewUrl}
          onFile={(file) => selectCourseMedia('video', file)}
          onClear={() => clearCourseMedia('video')}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Price (MXC)</label>
          <input
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            {...register('priceMxc')}
            className={inputClass}
            placeholder="0 = Free"
          />
          {errors.priceMxc && <p className="text-xs text-red-500 mt-1">{errors.priceMxc.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Language</label>
          <select {...register('language')} className={inputClass}>
            <option value={SupportedLanguage.EN}>English</option>
            <option value={SupportedLanguage.VI}>Vietnamese</option>
            <option value={SupportedLanguage.ZH}>Chinese</option>
            <option value={SupportedLanguage.JA}>Japanese</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Level</label>
          <select {...register('level')} className={inputClass}>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
      </div>

      </div>

      {activeTab === 'content' && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid h-[calc(100vh-15rem)] min-h-[520px] overflow-hidden lg:grid-cols-[320px_1fr]">
            <aside className="min-h-0 overflow-y-auto border-r border-slate-200 bg-slate-50">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Sections</h2>
                <button type="button" onClick={addSection} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-indigo-600" title="Add section">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2 p-3">
                {sections.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-500">Use the plus button to add your first section.</p>
                )}
                {sections.map((section, sectionIndex) => (
                  <div key={section.clientId} className="rounded-xl border border-slate-200 bg-white">
                    <div className={`flex items-center gap-1 px-2 py-2 ${
                      selection?.type === 'section' && selection.sectionClientId === section.clientId ? 'text-indigo-700' : 'text-slate-800'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setSelection({ type: 'section', sectionClientId: section.clientId })}
                        className="min-w-0 flex-1 rounded-lg px-1 py-1 text-left hover:bg-slate-50"
                      >
                        <span className="block truncate text-sm font-black">{sectionIndex + 1}. {section.title || 'Untitled section'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(section.clientId)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Delete section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
                            type="button"
                            onClick={() => setSelection({ type: 'lesson', sectionClientId: section.clientId, lessonClientId: lesson.clientId })}
                            className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left"
                          >
                            {lesson.lessonType === LessonType.QUIZ ? <HelpCircle className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
                            <span className="truncate">{sectionIndex + 1}.{lessonIndex + 1} {lesson.title || 'Untitled'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLesson(section.clientId, lesson.clientId)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title={lesson.lessonType === LessonType.QUIZ ? 'Delete quiz' : 'Delete lesson'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-1 pt-1">
                        <button type="button" onClick={() => addLesson(section.clientId, LessonType.LESSON)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">
                          + Lesson
                        </button>
                        <button type="button" onClick={() => addLesson(section.clientId, LessonType.QUIZ)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">
                          + Quiz
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <main className="min-h-0 overflow-y-auto p-6">
              {!selection && (
                <div className="flex h-full min-h-[460px] flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Plus className="h-7 w-7" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Start your curriculum</h2>
                  <p className="mt-1 max-w-sm text-sm font-medium text-slate-500">Add sections on the left, then add lessons or quizzes inside each section.</p>
                  <button type="button" onClick={addSection} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Add Section</button>
                </div>
              )}

              {selection?.type === 'section' && selectedSection && (
                <div className="max-w-3xl space-y-5">
                  <CreateEditorHeader title="Section Settings" onDelete={() => removeSection(selectedSection.clientId)} />
                  <CreateField label="Section title">
                    <input value={selectedSection.title} onChange={(event) => updateSection(selectedSection.clientId, { title: event.target.value })} className={inputClass} />
                  </CreateField>
                  <CreateField label="Description">
                    <textarea value={selectedSection.description} onChange={(event) => updateSection(selectedSection.clientId, { description: event.target.value })} className={`${inputClass} min-h-32`} />
                  </CreateField>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" checked={selectedSection.isPublished} onChange={(event) => updateSection(selectedSection.clientId, { isPublished: event.target.checked })} />
                    Visible when course is published
                  </label>
                </div>
              )}

              {selection?.type === 'lesson' && selectedSection && selectedLesson && (
                <CreateLessonEditor
                  lesson={selectedLesson}
                  inputClass={inputClass}
                  onChange={(patch) => updateLesson(selectedSection.clientId, selectedLesson.clientId, patch)}
                  onDelete={() => removeLesson(selectedSection.clientId, selectedLesson.clientId)}
                  onFileError={setError}
                />
              )}
            </main>
          </div>
        </section>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating course...
          </>
        ) : (
          'Create Course'
        )}
      </button>
    </form>
  )
}

function CreateEditorHeader({ title, onDelete }: { title: string; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
      <h2 className="text-xl font-black text-slate-900">{title}</h2>
      <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50">
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  )
}

function CreateField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  )
}

function CreateLessonEditor({ lesson, inputClass, onChange, onDelete, onFileError }: {
  lesson: CreateLessonDraft
  inputClass: string
  onChange: (patch: Partial<CreateLessonDraft>) => void
  onDelete: () => void
  onFileError: (message: string) => void
}) {
  const title = lesson.lessonType === LessonType.QUIZ
    ? 'Quiz Settings'
    : 'Lesson Settings'

  const updateLessonType = (lessonType: CreateLessonDraft['lessonType']) => {
    onChange({
      lessonType,
      passingPercent: lessonType === LessonType.QUIZ ? (lesson.passingPercent || '50') : '',
      quizQuestions: lessonType === LessonType.QUIZ && lesson.quizQuestions.length === 0
        ? [createQuizQuestionDraft(0)]
        : lesson.quizQuestions,
    })
  }

  return (
    <div className="max-w-3xl space-y-5">
      <CreateEditorHeader title={title} onDelete={onDelete} />
      <CreateField label="Type">
        <select value={lesson.lessonType} onChange={(event) => updateLessonType(event.target.value as CreateLessonDraft['lessonType'])} className={`${inputClass} max-w-xs`}>
          <option value={LessonType.LESSON}>Lesson</option>
          <option value={LessonType.QUIZ}>Quiz</option>
        </select>
      </CreateField>
      <CreateField label="Title">
        <input value={lesson.title} onChange={(event) => onChange({ title: event.target.value })} className={inputClass} />
      </CreateField>
      <CreateField label="Summary">
        <textarea value={lesson.description} onChange={(event) => onChange({ description: event.target.value })} className={`${inputClass} min-h-24`} />
      </CreateField>

      {lesson.lessonType === LessonType.LESSON && (
        <CreateField label="Duration minutes">
          <input type="number" min="0" step="1" value={lesson.durationMinutes} onChange={(event) => onChange({ durationMinutes: event.target.value })} className={`${inputClass} max-w-xs`} />
        </CreateField>
      )}

      {lesson.lessonType === LessonType.LESSON && (
        <CreateFileDropZone
          label="Lesson video"
          accept="video/*"
          file={lesson.pendingVideoFile}
          kind="video"
          previewUrl={lesson.videoUrl}
          helper="Video up to 200 MB"
          onFile={(file) => {
            const validation = validateCourseMedia(file, 'video')
            if (validation) {
              onFileError(validation)
              return
            }
            if (lesson.videoUrl?.startsWith('blob:')) URL.revokeObjectURL(lesson.videoUrl)
            onChange({ pendingVideoFile: file, videoUrl: URL.createObjectURL(file) })
            onFileError('')
          }}
          onClear={() => {
            if (lesson.videoUrl?.startsWith('blob:')) URL.revokeObjectURL(lesson.videoUrl)
            onChange({ pendingVideoFile: null, videoUrl: '' })
          }}
        />
      )}

      {lesson.lessonType === LessonType.LESSON && (
        <CreateRichTextEditor
          label="Lesson content"
          value={lesson.articleContent}
          onChange={(articleContent) => onChange({ articleContent })}
          onImageChange={(articleContent, pendingImage) => onChange({
            articleContent,
            pendingImages: [...lesson.pendingImages, pendingImage],
          })}
        />
      )}

      {lesson.lessonType === LessonType.LESSON && (
        <CreateFileDropZone
          label="Downloadable material"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip"
          file={lesson.pendingResourceFile}
          kind="resource"
          helper="PDF, Word, PowerPoint, or ZIP up to 100 MB"
          onFile={(file) => {
            const validation = validateDocumentFile(file)
            if (validation) {
              onFileError(validation)
              return
            }
            onChange({ pendingResourceFile: file })
            onFileError('')
          }}
          onClear={() => onChange({ pendingResourceFile: null, resourceUrl: '' })}
        />
      )}

      {lesson.lessonType === LessonType.QUIZ && (
        <CreateField label="Passing score (%)">
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={lesson.passingPercent}
            onChange={(event) => onChange({ passingPercent: event.target.value })}
            className={`${inputClass} max-w-xs`}
          />
        </CreateField>
      )}
      {lesson.lessonType === LessonType.QUIZ && (
        <QuizDraftEditor lesson={lesson} inputClass={inputClass} onChange={onChange} />
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

function CreateFileDropZone({ label, accept, file, kind, helper, previewUrl, onFile, onClear }: {
  label: string
  accept: string
  file: File | null
  kind: 'video' | 'resource'
  helper: string
  previewUrl?: string
  onFile: (file: File) => void
  onClear: () => void
}) {
  const [inputId] = useState(() => `create-file-${kind}-${newClientId()}`)

  const handleFiles = (files: FileList | null) => {
    const selectedFile = files?.[0]
    if (selectedFile) onFile(selectedFile)
  }

  return (
    <CreateField label={label}>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          handleFiles(event.dataTransfer.files)
        }}
        className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 transition hover:border-indigo-300"
      >
        {file ? (
          <div className="rounded-lg bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  {kind === 'video' ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">{file.name}</p>
                  <p className="text-xs font-semibold text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button type="button" onClick={onClear} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Remove file">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {kind === 'video' && previewUrl && (
              <video key={previewUrl} src={previewUrl} controls preload="metadata" playsInline className="mt-4 aspect-video w-full rounded-xl bg-black object-contain" />
            )}
          </div>
        ) : (
          <label htmlFor={inputId} className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg bg-white px-4 py-6 text-center">
            {kind === 'video' ? <Video className="mb-3 h-8 w-8 text-indigo-500" /> : <Download className="mb-3 h-8 w-8 text-indigo-500" />}
            <span className="text-sm font-semibold text-slate-900">Drop a file here or click to browse</span>
            <span className="mt-1 text-xs text-slate-500">{helper}</span>
            <span className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">
              <Upload className="h-3.5 w-3.5" />
              Choose file
            </span>
          </label>
        )}
        <input
          id={inputId}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files)
            event.currentTarget.value = ''
          }}
        />
      </div>
    </CreateField>
  )
}

function CreateRichTextEditor({ label, value, onChange, onImageChange }: {
  label: string
  value: string
  onChange: (value: string) => void
  onImageChange: (value: string, pendingImage: PendingImage) => void
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

  const insertImage = (file: File) => {
    const pendingImage = {
      id: newClientId(),
      file,
      previewUrl: URL.createObjectURL(file),
    }
    insertHtml(`<img src="${pendingImage.previewUrl}" data-pending-image-id="${pendingImage.id}" alt="" style="max-width:100%;border-radius:12px;margin:12px 0;" />`)
    onImageChange(editorRef.current?.innerHTML || '', pendingImage)
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
          <CreateToolbarButton title="Bold" onClick={() => runCommand('bold')}><Bold className="h-4 w-4" /></CreateToolbarButton>
          <CreateToolbarButton title="Italic" onClick={() => runCommand('italic')}><Italic className="h-4 w-4" /></CreateToolbarButton>
          <CreateToolbarButton title="Bulleted list" onClick={() => runCommand('insertUnorderedList')}><List className="h-4 w-4" /></CreateToolbarButton>
          <CreateToolbarButton title="Numbered list" onClick={() => runCommand('insertOrderedList')}><ListOrdered className="h-4 w-4" /></CreateToolbarButton>
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

function CreateToolbarButton({ title, onClick, children }: {
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

function QuizDraftEditor({ lesson, inputClass, onChange }: {
  lesson: CreateLessonDraft
  inputClass: string
  onChange: (patch: Partial<CreateLessonDraft>) => void
}) {
  const updateQuestion = (questionId: string, patch: Partial<CreateQuizQuestionDraft>) => {
    onChange({
      quizQuestions: lesson.quizQuestions.map((question) => {
        if (question.clientId !== questionId) return question
        const next = { ...question, ...patch }
        if (patch.questionType) return applyQuestionTypeDefaults(next)
        return next
      }),
    })
  }

  const removeQuestion = (questionId: string) => {
    onChange({ quizQuestions: lesson.quizQuestions.filter((question) => question.clientId !== questionId) })
  }

  const addQuestion = (questionType: QuizQuestionType) => {
    const question = createQuizQuestionDraft(lesson.quizQuestions.length)
    onChange({
      quizQuestions: [...lesson.quizQuestions, applyQuestionTypeDefaults({ ...question, questionType })],
    })
  }

  return (
    <div className="mt-3 space-y-4">
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[180px_1fr]">
        <CreateField label="Passing score">
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={lesson.passingPercent}
            onChange={(event) => onChange({ passingPercent: event.target.value })}
            className={inputClass}
            placeholder="50"
          />
        </CreateField>
        <div className="flex items-end">
          <p className="text-sm font-semibold text-slate-500">Learners must meet this score to complete the quiz.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Questions</h3>
        </div>

        {lesson.quizQuestions.map((question, questionIndex) => (
          <CreateQuizQuestionEditor
            key={question.clientId}
            index={questionIndex}
            question={question}
            inputClass={inputClass}
            onChange={(patch) => updateQuestion(question.clientId, patch)}
            onDelete={() => removeQuestion(question.clientId)}
          />
        ))}

        {lesson.quizQuestions.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
            Add at least one question before creating this quiz.
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          <button type="button" onClick={() => addQuestion(QuizQuestionType.SINGLE_CHOICE)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">+ Multiple Choice</button>
          <button type="button" onClick={() => addQuestion(QuizQuestionType.MULTIPLE_CHOICE)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">+ Checkboxes</button>
          <button type="button" onClick={() => addQuestion(QuizQuestionType.TRUE_FALSE)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">+ T/F</button>
          <button type="button" onClick={() => addQuestion(QuizQuestionType.TEXT_ANSWER)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">+ Text</button>
        </div>
      </div>
    </div>
  )
}

function CreateQuizQuestionEditor({ index, question, inputClass, onChange, onDelete }: {
  index: number
  question: CreateQuizQuestionDraft
  inputClass: string
  onChange: (patch: Partial<CreateQuizQuestionDraft>) => void
  onDelete: () => void
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
        <CreateField label="Question type">
          <select value={question.questionType} onChange={(event) => onChange({ questionType: event.target.value as QuizQuestionType })} className={inputClass}>
            <option value={QuizQuestionType.SINGLE_CHOICE}>Multiple choice</option>
            <option value={QuizQuestionType.MULTIPLE_CHOICE}>Checkboxes</option>
            <option value={QuizQuestionType.TRUE_FALSE}>True / False</option>
            <option value={QuizQuestionType.TEXT_ANSWER}>Text answer</option>
          </select>
        </CreateField>
        <CreateField label="Points">
          <input type="number" min="1" step="1" value={question.points} onChange={(event) => onChange({ points: event.target.value })} className={inputClass} />
        </CreateField>
      </div>

      <CreateRichTextEditor
        label="Question description"
        value={question.questionText}
        onChange={(questionText) => onChange({ questionText })}
        onImageChange={(questionText, pendingImage) => onChange({
          questionText,
          pendingImages: [...question.pendingImages, pendingImage],
        })}
      />

      {question.questionType === QuizQuestionType.TEXT_ANSWER ? (
        <CreateField label="Correct text answer">
          <input value={question.textAnswer} onChange={(event) => onChange({ textAnswer: event.target.value })} className={inputClass} />
        </CreateField>
      ) : (
        <CreateQuizOptionsEditor question={question} inputClass={inputClass} onChange={onChange} />
      )}

      <CreateField label="Explanation">
        <textarea value={question.explanation} onChange={(event) => onChange({ explanation: event.target.value })} className={`${inputClass} min-h-20`} />
      </CreateField>
    </div>
  )
}

function CreateQuizOptionsEditor({ question, inputClass, onChange }: {
  question: CreateQuizQuestionDraft
  inputClass: string
  onChange: (patch: Partial<CreateQuizQuestionDraft>) => void
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
        <div key={`${question.clientId}-${index}`} className="flex items-center gap-2">
          <input
            type={isMultiple ? 'checkbox' : 'radio'}
            name={`correct-${question.clientId}`}
            checked={question.correctAnswers.includes(option)}
            onChange={() => toggleCorrect(option)}
            className="h-4 w-4"
          />
          {question.questionType === QuizQuestionType.TRUE_FALSE ? (
            <span className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">{option}</span>
          ) : (
            <input value={option} onChange={(event) => updateOption(index, event.target.value)} className={inputClass} />
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

function validateCourseSections(sections: CreateSectionDraft[]) {
  if (sections.length === 0) return 'Add at least one course section.'
  for (const [sectionIndex, section] of sections.entries()) {
    if (!section.title.trim()) return `Section ${sectionIndex + 1} needs a title.`
    if (section.lessons.length === 0) return `Section ${sectionIndex + 1} needs at least one lesson.`
    for (const [lessonIndex, lesson] of section.lessons.entries()) {
      const label = `Section ${sectionIndex + 1}, lesson ${lessonIndex + 1}`
      if (!lesson.title.trim()) return `${label} needs a title.`
      if (lesson.durationMinutes && Number(lesson.durationMinutes) < 0) return `${label} duration cannot be negative.`
      const hasArticle = !!lesson.articleContent.trim()
      const hasVideo = !!lesson.videoUrl.trim() || !!lesson.pendingVideoFile
      const hasResource = !!lesson.pendingResourceFile
      if (lesson.lessonType === LessonType.QUIZ) {
        const passingPercent = Number(lesson.passingPercent || 50)
        if (!Number.isInteger(passingPercent) || passingPercent < 0 || passingPercent > 100) {
          return `${label} passing score must be a full number from 0 to 100.`
        }
        if (!lesson.quizQuestions.length) return `${label} needs at least one question.`
        for (const [questionIndex, question] of lesson.quizQuestions.entries()) {
          const questionLabel = `${label}, question ${questionIndex + 1}`
          if (!htmlTextContent(question.questionText)) return `${questionLabel} needs text.`
          const points = Number(question.points)
          if (!Number.isInteger(points) || points < 1) return `${questionLabel} points must be a full number greater than zero.`
          if (question.questionType === QuizQuestionType.TEXT_ANSWER && !question.textAnswer.trim()) {
            return `${questionLabel} needs a correct answer.`
          }
          if (question.questionType !== QuizQuestionType.TEXT_ANSWER && question.correctAnswers.length === 0) {
            return `${questionLabel} needs at least one correct answer.`
          }
          if ((question.questionType === QuizQuestionType.SINGLE_CHOICE || question.questionType === QuizQuestionType.MULTIPLE_CHOICE)
            && question.options.some((option) => !option.trim())) {
            return `${questionLabel} options cannot be empty.`
          }
        }
        continue
      }
      if (lesson.lessonType === LessonType.LESSON && !hasArticle && !hasVideo && !hasResource) {
        return `${label} needs article content, a video, or a resource.`
      }
    }
  }
  return ''
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 50
  return Math.min(Math.max(Math.round(value), 0), 100)
}

function htmlTextContent(html: string) {
  if (!html.trim()) return ''
  const document = new DOMParser().parseFromString(html, 'text/html')
  return document.body.textContent?.trim() || ''
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

function answerDataJsonForQuestion(question: CreateQuizQuestionDraft) {
  if (question.questionType === QuizQuestionType.TEXT_ANSWER) {
    return JSON.stringify({ correctAnswer: question.textAnswer.trim() })
  }
  const options = question.questionType === QuizQuestionType.TRUE_FALSE ? ['True', 'False'] : question.options
  const correctAnswers = question.questionType === QuizQuestionType.TRUE_FALSE
    ? (question.correctAnswers.length ? question.correctAnswers : ['True'])
    : question.correctAnswers
  return JSON.stringify({ options, correctAnswers })
}

function applyQuestionTypeDefaults(question: CreateQuizQuestionDraft): CreateQuizQuestionDraft {
  if (question.questionType === QuizQuestionType.TRUE_FALSE) {
    return { ...question, options: ['True', 'False'], correctAnswers: question.correctAnswers.includes('False') ? ['False'] : ['True'], textAnswer: '' }
  }
  if (question.questionType === QuizQuestionType.TEXT_ANSWER) {
    return { ...question, options: [], correctAnswers: [], textAnswer: question.textAnswer || '' }
  }
  const options = question.options.length >= 2 ? question.options : ['Option 1', 'Option 2']
  const correctAnswers = question.questionType === QuizQuestionType.MULTIPLE_CHOICE
    ? question.correctAnswers.filter((answer) => options.includes(answer))
    : [question.correctAnswers.find((answer) => options.includes(answer)) || options[0]]
  return { ...question, options, correctAnswers, textAnswer: '' }
}

async function uploadReferencedPendingImages(html: string, pendingImages: PendingImage[]) {
  if (!html || pendingImages.length === 0) return html
  const parser = new DOMParser()
  const document = parser.parseFromString(html, 'text/html')
  const images = Array.from(document.querySelectorAll<HTMLImageElement>('img[data-pending-image-id]'))

  for (const image of images) {
    const pendingImageId = image.getAttribute('data-pending-image-id')
    const pendingImage = pendingImages.find((item) => item.id === pendingImageId)
    if (!pendingImage) continue
    const result = await fileApi.uploadCourseMedia(pendingImage.file, 'mentorx/courses/lessons/images')
    image.setAttribute('src', result.fileUrl)
    image.removeAttribute('data-pending-image-id')
  }

  return document.body.innerHTML
}

function validateDocumentFile(file: File) {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
  ]
  if (file.type && !allowed.includes(file.type)) return 'Downloadable file must be PDF, Word, PowerPoint, or ZIP.'
  if (file.size > 100 * 1024 * 1024) return 'Downloadable file must be 100 MB or smaller.'
  return ''
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${size} B`
}
