import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { courseApi } from '@/api/courseApi'
import { fileApi } from '@/api/fileApi'
import { categoryApi } from '@/api/categoryApi'
import { skillApi } from '@/api/skillApi'
import { CourseMediaDropZone, CourseMediaKind, validateCourseMedia } from './CourseMediaDropZone'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, FileText, Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import { CategoryResponse, CourseProductType, LessonType, QuizQuestionType, SkillResponse, SupportedLanguage } from '@/types'

const courseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').optional().or(z.literal('')),
  categoryId: z.coerce.number().int().positive('Please choose a domain/category'),
  skillIds: z.array(z.number()).min(1, 'Please choose at least one skill'),
  priceMxc: z.coerce.number({
    invalid_type_error: 'Price must be a full number',
  }).int('Price must be a full number').min(0, 'Price cannot be negative'),
  discountPriceMxc: z.preprocess(
    (value) => value === '' || value == null ? undefined : value,
    z.coerce.number().int('Discount price must be a full number').min(0, 'Discount cannot be negative').optional()
  ),
  discountStartAt: z.string().optional(),
  discountEndAt: z.string().optional(),
  language: z.string().optional(),
  level: z.string().optional(),
  isCertificate: z.boolean().optional(),
  productType: z.nativeEnum(CourseProductType),
}).superRefine((data, ctx) => {
  const hasDiscount = data.discountPriceMxc != null || !!data.discountStartAt || !!data.discountEndAt
  if (!hasDiscount) return
  if (data.discountPriceMxc == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountPriceMxc'], message: 'Enter a sale price.' })
  } else if (data.discountPriceMxc >= data.priceMxc) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountPriceMxc'], message: 'Sale price must be lower than base price.' })
  }
  if (!data.discountStartAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountStartAt'], message: 'Choose a sale start time.' })
  }
  if (!data.discountEndAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountEndAt'], message: 'Choose a sale end time.' })
  }
  if (data.discountStartAt && data.discountEndAt && new Date(data.discountStartAt) >= new Date(data.discountEndAt)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountEndAt'], message: 'End time must be after start time.' })
  }
})

type CourseFormData = z.infer<typeof courseSchema>

type CreateLessonDraft = {
  clientId: string
  title: string
  description: string
  lessonType: LessonType.LESSON | LessonType.DOCUMENT | LessonType.QUIZ
  durationMinutes: string
  videoUrl: string
  articleContent: string
  resourceUrl: string
  isFreePreview: boolean
  isMandatory: boolean
  pendingVideoFile: File | null
  pendingResourceFile: File | null
  passingPercent: string
  quizQuestions: CreateQuizQuestionDraft[]
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
}

type CreateSectionDraft = {
  clientId: string
  title: string
  description: string
  lessons: CreateLessonDraft[]
}

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
})

const createLessonDraft = (type: CreateLessonDraft['lessonType'] = LessonType.LESSON, index = 0): CreateLessonDraft => ({
  clientId: newClientId(),
  title: type === LessonType.QUIZ ? `Quiz ${index + 1}` : type === LessonType.DOCUMENT ? 'Document file' : `Lesson ${index + 1}`,
  description: '',
  lessonType: type,
  durationMinutes: '',
  videoUrl: '',
  articleContent: '',
  resourceUrl: '',
  isFreePreview: false,
  isMandatory: true,
  pendingVideoFile: null,
  pendingResourceFile: null,
  passingPercent: type === LessonType.QUIZ ? '50' : '',
  quizQuestions: type === LessonType.QUIZ ? [createQuizQuestionDraft(0)] : [],
})

const createSectionDraft = (index = 0): CreateSectionDraft => ({
  clientId: newClientId(),
  title: index === 0 ? 'Getting started' : '',
  description: '',
  lessons: [createLessonDraft(LessonType.LESSON, 0)],
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
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [sections, setSections] = useState<CreateSectionDraft[]>([])
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
      isCertificate: false,
      productType: CourseProductType.COURSE,
      skillIds: [],
    },
  })

  const productType = watch('productType')
  const isDocument = productType === CourseProductType.DOCUMENT
  const selectedSkillIds = watch('skillIds') || []
  const selectedSkills = skills.filter((skill) => selectedSkillIds.includes(skill.id))
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

      if (!isDocument && previewVideoFile) {
        const result = await fileApi.uploadCourseMedia(previewVideoFile, 'mentorx/courses/previews/videos')
        previewVideoUrl = result.fileUrl
      }

      if (isDocument) {
        if (!documentFile) {
          throw new Error('Upload the downloadable document file before creating this document.')
        }
        const result = await fileApi.uploadCourseMedia(documentFile, 'mentorx/courses/documents/files')
        curriculum = {
          sections: [{
            title: 'Document',
            description: data.description || undefined,
            sectionOrder: 1,
            isPublished: true,
            lessons: [{
              title: data.title.trim(),
              description: data.description || undefined,
              lessonType: LessonType.DOCUMENT,
              lessonOrder: 1,
              resourceUrl: result.fileUrl,
              isPublished: true,
              isMandatory: true,
              isFreePreview: false,
            }],
          }],
        }
      } else {
        const validationError = validateCourseSections(sections)
        if (validationError) throw new Error(validationError)
        curriculum = await buildCourseCurriculum(sections)
      }

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
          discountPriceMxc: data.discountPriceMxc,
          discountStartAt: data.discountStartAt ? toApiDateTime(data.discountStartAt) : undefined,
          discountEndAt: data.discountEndAt ? toApiDateTime(data.discountEndAt) : undefined,
          language: data.language as SupportedLanguage | undefined,
          productType: data.productType,
          isCertificate: isDocument ? false : data.isCertificate,
        },
        curriculum,
      })
      const createdCourseId = course.courseId || course.id
      navigate(`/mentor/courses/${createdCourseId}/manage`)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || `Failed to create ${isDocument ? 'document' : 'course'}. Please try again.`)
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

  const selectDocumentFile = (file: File) => {
    const validation = validateDocumentFile(file)
    if (validation) {
      setError(validation)
      return
    }
    setDocumentFile(file)
    setError('')
  }

  const updateSection = (sectionId: string, patch: Partial<CreateSectionDraft>) => {
    setSections((current) => current.map((section) => (
      section.clientId === sectionId ? { ...section, ...patch } : section
    )))
  }

  const addSection = () => {
    setSections((current) => [...current, createSectionDraft(current.length)])
  }

  const removeSection = (sectionId: string) => {
    setSections((current) => current.filter((section) => section.clientId !== sectionId))
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
    setSections((current) => current.map((section) => (
      section.clientId === sectionId
        ? { ...section, lessons: [...section.lessons, createLessonDraft(lessonType, section.lessons.length)] }
        : section
    )))
  }

  const removeLesson = (sectionId: string, lessonId: string) => {
    setSections((current) => current.map((section) => {
      if (section.clientId !== sectionId || section.lessons.length <= 1) return section
      return { ...section, lessons: section.lessons.filter((lesson) => lesson.clientId !== lessonId) }
    }))
  }

  const buildCourseCurriculum = async (draftSections: CreateSectionDraft[]) => ({
    sections: await Promise.all(draftSections.map(async (section, sectionIndex) => ({
      title: section.title.trim(),
      description: section.description.trim() || undefined,
      sectionOrder: sectionIndex + 1,
      isPublished: true,
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

        return {
          title: lesson.title.trim(),
          description: lesson.description.trim() || undefined,
          lessonType: lesson.lessonType,
          lessonOrder: lessonIndex + 1,
          durationMinutes: lesson.durationMinutes ? Number(lesson.durationMinutes) : undefined,
          videoUrl,
          articleContent: lesson.articleContent.trim() || undefined,
          resourceUrl,
          isFreePreview: lesson.isFreePreview,
          isPublished: true,
          isMandatory: lesson.isMandatory,
          metadata: lesson.lessonType === LessonType.QUIZ
            ? { passingPercent: clampPercent(Number(lesson.passingPercent || 50)) }
            : undefined,
          quizQuestions: lesson.lessonType === LessonType.QUIZ
            ? lesson.quizQuestions.map((question, questionIndex) => ({
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
          { key: 'content' as const, label: 'Course content', disabled: isDocument },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            disabled={tab.disabled}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black transition ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={activeTab === 'info' ? 'space-y-5 rounded-2xl border border-slate-200 bg-white p-5' : 'hidden'}>
      <div>
        <label className={labelClass}>Product Type</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: CourseProductType.COURSE, label: 'Course', description: 'Lessons, quizzes, and course materials' },
            { value: CourseProductType.DOCUMENT, label: 'Document', description: 'A standalone downloadable resource' },
          ].map((item) => (
            <label
              key={item.value}
              className="cursor-pointer rounded-xl border border-slate-200 p-4 transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
            >
              <input type="radio" value={item.value} {...register('productType')} className="sr-only" />
              <span className="block text-sm font-black text-slate-900">{item.label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span>
            </label>
          ))}
        </div>
        {errors.productType && <p className="text-xs text-red-500 mt-1">{errors.productType.message}</p>}
      </div>

      <div>
        <label className={labelClass}>{isDocument ? 'Document Title' : 'Course Title'}</label>
        <input
          {...register('title')}
          className={inputClass}
          placeholder={isDocument ? 'e.g., React Interview Preparation PDF' : 'e.g., Introduction to Machine Learning'}
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
          label={isDocument ? 'Document cover image' : 'Course thumbnail'}
          kind="image"
          file={thumbnailFile}
          mediaUrl={thumbnailPreviewUrl}
          onFile={(file) => selectCourseMedia('image', file)}
          onClear={() => clearCourseMedia('image')}
        />
        {isDocument ? (
          <DocumentFileDropZone
            file={documentFile}
            onFile={selectDocumentFile}
            onClear={() => setDocumentFile(null)}
          />
        ) : (
          <CourseMediaDropZone
            label="Preview video"
            kind="video"
            file={previewVideoFile}
            mediaUrl={previewVideoPreviewUrl}
            onFile={(file) => selectCourseMedia('video', file)}
            onClear={() => clearCourseMedia('video')}
          />
        )}
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

      <div className="rounded-xl border border-slate-200 p-4">
        <div className="mb-3">
          <p className="text-sm font-black text-gray-900">Scheduled sale price</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className={labelClass}>Sale price (MXC)</label>
            <input type="number" step="1" min="0" inputMode="numeric" {...register('discountPriceMxc')} className={inputClass} placeholder="Lower than base price" />
            {errors.discountPriceMxc && <p className="text-xs text-red-500 mt-1">{errors.discountPriceMxc.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Starts</label>
            <input type="datetime-local" {...register('discountStartAt')} className={inputClass} />
            {errors.discountStartAt && <p className="text-xs text-red-500 mt-1">{errors.discountStartAt.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Ends</label>
            <input type="datetime-local" {...register('discountEndAt')} className={inputClass} />
            {errors.discountEndAt && <p className="text-xs text-red-500 mt-1">{errors.discountEndAt.message}</p>}
          </div>
        </div>
      </div>
      </div>

      {activeTab === 'content' && !isDocument && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-900">Course content</p>
              <p className="mt-1 text-xs text-slate-500">Create the first sections and lessons before publishing.</p>
            </div>
            <button
              type="button"
              onClick={addSection}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Section
            </button>
          </div>

          <div className="space-y-4">
            {sections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-medium text-slate-600">
                Add a section to start building your curriculum.
              </div>
            ) : sections.map((section, sectionIndex) => (
              <div key={section.clientId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="grid flex-1 gap-3 md:grid-cols-[1fr_1fr]">
                    <div>
                      <label className={labelClass}>Section {sectionIndex + 1} title</label>
                      <input
                        value={section.title}
                        onChange={(event) => updateSection(section.clientId, { title: event.target.value })}
                        className={inputClass}
                        placeholder="e.g., Foundations"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Section description</label>
                      <input
                        value={section.description}
                        onChange={(event) => updateSection(section.clientId, { description: event.target.value })}
                        className={inputClass}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSection(section.clientId)}
                    className="mt-7 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Remove section"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {section.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.clientId} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="grid flex-1 gap-3 md:grid-cols-[1.2fr_160px_120px]">
                          <div>
                            <label className={labelClass}>Lesson {lessonIndex + 1} title</label>
                            <input
                              value={lesson.title}
                              onChange={(event) => updateLesson(section.clientId, lesson.clientId, { title: event.target.value })}
                              className={inputClass}
                              placeholder="e.g., What you will build"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Type</label>
                            <select
                              value={lesson.lessonType}
                              onChange={(event) => updateLesson(section.clientId, lesson.clientId, {
                                lessonType: event.target.value as CreateLessonDraft['lessonType'],
                                passingPercent: event.target.value === LessonType.QUIZ ? (lesson.passingPercent || '50') : '',
                                quizQuestions: event.target.value === LessonType.QUIZ && lesson.quizQuestions.length === 0
                                  ? [createQuizQuestionDraft(0)]
                                  : lesson.quizQuestions,
                              })}
                              className={inputClass}
                            >
                              <option value={LessonType.LESSON}>Lesson</option>
                              <option value={LessonType.DOCUMENT}>Document</option>
                              <option value={LessonType.QUIZ}>Quiz</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Minutes</label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={lesson.durationMinutes}
                              onChange={(event) => updateLesson(section.clientId, lesson.clientId, { durationMinutes: event.target.value })}
                              className={inputClass}
                              placeholder="15"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLesson(section.clientId, lesson.clientId)}
                          disabled={section.lessons.length <= 1}
                          className="mt-7 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Remove lesson"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className={labelClass}>Description</label>
                          <input
                            value={lesson.description}
                            onChange={(event) => updateLesson(section.clientId, lesson.clientId, { description: event.target.value })}
                            className={inputClass}
                            placeholder="Optional lesson summary"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Resource URL</label>
                          <input
                            value={lesson.resourceUrl}
                            onChange={(event) => updateLesson(section.clientId, lesson.clientId, { resourceUrl: event.target.value })}
                            className={inputClass}
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      {lesson.lessonType === LessonType.LESSON && (
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div>
                            <label className={labelClass}>Video URL</label>
                            <input
                              value={lesson.videoUrl}
                              onChange={(event) => updateLesson(section.clientId, lesson.clientId, { videoUrl: event.target.value })}
                              className={inputClass}
                              placeholder="https://..."
                            />
                          </div>
                          <InlineFilePicker
                            label="Upload lesson video"
                            accept="video/*"
                            file={lesson.pendingVideoFile}
                            onFile={(file) => {
                              const validation = validateCourseMedia(file, 'video')
                              if (validation) {
                                setError(validation)
                                return
                              }
                              updateLesson(section.clientId, lesson.clientId, { pendingVideoFile: file })
                              setError('')
                            }}
                            onClear={() => updateLesson(section.clientId, lesson.clientId, { pendingVideoFile: null })}
                          />
                        </div>
                      )}

                      {lesson.lessonType !== LessonType.QUIZ && <div className="mt-3">
                        <label className={labelClass}>{lesson.lessonType === LessonType.DOCUMENT ? 'Document notes' : 'Article content'}</label>
                        <textarea
                          value={lesson.articleContent}
                          onChange={(event) => updateLesson(section.clientId, lesson.clientId, { articleContent: event.target.value })}
                          rows={4}
                          className={inputClass}
                          placeholder={lesson.lessonType === LessonType.DOCUMENT ? 'Optional notes for this document' : 'Write the article lesson content here'}
                        />
                      </div>}

                      {lesson.lessonType === LessonType.QUIZ && (
                        <QuizDraftEditor
                          lesson={lesson}
                          inputClass={inputClass}
                          labelClass={labelClass}
                          onChange={(patch) => updateLesson(section.clientId, lesson.clientId, patch)}
                        />
                      )}

                      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                        <InlineFilePicker
                          label={lesson.lessonType === LessonType.DOCUMENT ? 'Upload document' : 'Upload resource'}
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip"
                          file={lesson.pendingResourceFile}
                          onFile={(file) => {
                            const validation = validateDocumentFile(file)
                            if (validation) {
                              setError(validation)
                              return
                            }
                            updateLesson(section.clientId, lesson.clientId, { pendingResourceFile: file })
                            setError('')
                          }}
                          onClear={() => updateLesson(section.clientId, lesson.clientId, { pendingResourceFile: null })}
                        />
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <input
                            type="checkbox"
                            checked={lesson.isMandatory}
                            onChange={(event) => updateLesson(section.clientId, lesson.clientId, { isMandatory: event.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          Mandatory
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <input
                            type="checkbox"
                            checked={lesson.isFreePreview}
                            onChange={(event) => updateLesson(section.clientId, lesson.clientId, { isFreePreview: event.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          Free preview
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { type: LessonType.LESSON, label: 'Lesson' },
                    { type: LessonType.DOCUMENT, label: 'Document' },
                    { type: LessonType.QUIZ, label: 'Quiz' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => addLesson(section.clientId, item.type)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'info' && !isDocument && <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isCertificate"
          {...register('isCertificate')}
          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="isCertificate" className="text-sm text-gray-700">
          Offer certificate upon completion
        </label>
      </div>}

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
            Creating {isDocument ? 'document' : 'course'}...
          </>
        ) : (
          `Create ${isDocument ? 'Document' : 'Course'}`
        )}
      </button>
    </form>
  )
}

function DocumentFileDropZone({ file, onFile, onClear }: {
  file: File | null
  onFile: (file: File) => void
  onClear: () => void
}) {
  const handleFiles = (files: FileList | null) => {
    const selectedFile = files?.[0]
    if (selectedFile) onFile(selectedFile)
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-bold text-slate-700">Downloadable file</p>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          handleFiles(event.dataTransfer.files)
        }}
        className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 transition hover:border-indigo-300"
      >
        {file ? (
          <div className="flex min-h-40 items-center justify-between gap-3 rounded-lg bg-white p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileText className="h-5 w-5" />
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
        ) : (
          <label htmlFor="document-file-upload" className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg bg-white px-4 py-6 text-center">
            <Download className="mb-3 h-8 w-8 text-indigo-500" />
            <span className="text-sm font-semibold text-slate-900">Drop the file here or click to browse</span>
            <span className="mt-1 text-xs text-slate-500">PDF, Word, PowerPoint, or ZIP up to 100 MB</span>
            <span className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">
              <Upload className="h-3.5 w-3.5" />
              Choose file
            </span>
          </label>
        )}
        <input id="document-file-upload" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip" className="hidden" onChange={(event) => handleFiles(event.target.files)} />
      </div>
    </div>
  )
}

function QuizDraftEditor({ lesson, inputClass, labelClass, onChange }: {
  lesson: CreateLessonDraft
  inputClass: string
  labelClass: string
  onChange: (patch: Partial<CreateLessonDraft>) => void
}) {
  const updateQuestion = (questionId: string, patch: Partial<CreateQuizQuestionDraft>) => {
    onChange({
      quizQuestions: lesson.quizQuestions.map((question) => (
        question.clientId === questionId ? { ...question, ...patch } : question
      )),
    })
  }

  const removeQuestion = (questionId: string) => {
    if (lesson.quizQuestions.length <= 1) return
    onChange({ quizQuestions: lesson.quizQuestions.filter((question) => question.clientId !== questionId) })
  }

  const addQuestion = () => {
    onChange({ quizQuestions: [...lesson.quizQuestions, createQuizQuestionDraft(lesson.quizQuestions.length)] })
  }

  return (
    <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
      <div className="mb-3 grid gap-3 md:grid-cols-[180px_1fr]">
        <div>
          <label className={labelClass}>Passing score</label>
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
        </div>
        <div className="flex items-end justify-end">
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Question
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {lesson.quizQuestions.map((question, questionIndex) => (
          <div key={question.clientId} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="grid flex-1 gap-3 md:grid-cols-[1fr_180px_110px]">
                <div>
                  <label className={labelClass}>Question {questionIndex + 1}</label>
                  <textarea
                    value={question.questionText}
                    onChange={(event) => updateQuestion(question.clientId, { questionText: event.target.value })}
                    rows={2}
                    className={inputClass}
                    placeholder="Write the question"
                  />
                </div>
                <div>
                  <label className={labelClass}>Type</label>
                  <select
                    value={question.questionType}
                    onChange={(event) => updateQuestion(question.clientId, applyQuestionTypeDefaults({
                      ...question,
                      questionType: event.target.value as QuizQuestionType,
                    }))}
                    className={inputClass}
                  >
                    <option value={QuizQuestionType.SINGLE_CHOICE}>Single choice</option>
                    <option value={QuizQuestionType.MULTIPLE_CHOICE}>Multiple choice</option>
                    <option value={QuizQuestionType.TRUE_FALSE}>True / False</option>
                    <option value={QuizQuestionType.TEXT_ANSWER}>Text answer</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Points</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={question.points}
                    onChange={(event) => updateQuestion(question.clientId, { points: event.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeQuestion(question.clientId)}
                disabled={lesson.quizQuestions.length <= 1}
                className="mt-7 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                title="Remove question"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {question.questionType === QuizQuestionType.TEXT_ANSWER ? (
              <div>
                <label className={labelClass}>Correct answer</label>
                <input
                  value={question.textAnswer}
                  onChange={(event) => updateQuestion(question.clientId, { textAnswer: event.target.value })}
                  className={inputClass}
                  placeholder="Expected answer"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className={labelClass}>Options</label>
                {question.options.map((option, optionIndex) => {
                  const checked = question.correctAnswers.includes(option)
                  return (
                    <div key={`${question.clientId}-${optionIndex}`} className="flex items-center gap-2">
                      <input
                        type={question.questionType === QuizQuestionType.MULTIPLE_CHOICE ? 'checkbox' : 'radio'}
                        name={`correct-${question.clientId}`}
                        checked={checked}
                        onChange={(event) => {
                          const nextAnswers = question.questionType === QuizQuestionType.MULTIPLE_CHOICE
                            ? event.target.checked
                              ? [...question.correctAnswers, option]
                              : question.correctAnswers.filter((answer) => answer !== option)
                            : [option]
                          updateQuestion(question.clientId, { correctAnswers: nextAnswers })
                        }}
                      />
                      <input
                        value={option}
                        disabled={question.questionType === QuizQuestionType.TRUE_FALSE}
                        onChange={(event) => {
                          const nextOptions = question.options.map((item, index) => index === optionIndex ? event.target.value : item)
                          const nextCorrectAnswers = question.correctAnswers.map((answer) => answer === option ? event.target.value : answer)
                          updateQuestion(question.clientId, { options: nextOptions, correctAnswers: nextCorrectAnswers })
                        }}
                        className={inputClass}
                      />
                    </div>
                  )
                })}
                {question.questionType !== QuizQuestionType.TRUE_FALSE && (
                  <button
                    type="button"
                    onClick={() => updateQuestion(question.clientId, { options: [...question.options, `Option ${question.options.length + 1}`] })}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900"
                  >
                    Add option
                  </button>
                )}
              </div>
            )}

            <div className="mt-3">
              <label className={labelClass}>Explanation</label>
              <input
                value={question.explanation}
                onChange={(event) => updateQuestion(question.clientId, { explanation: event.target.value })}
                className={inputClass}
                placeholder="Optional"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InlineFilePicker({ label, accept, file, onFile, onClear }: {
  label: string
  accept: string
  file: File | null
  onFile: (file: File) => void
  onClear: () => void
}) {
  const [inputId] = useState(() => `file-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${newClientId()}`)

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700">{label}</p>
      {file ? (
        <div className="flex min-h-[42px] items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2">
          <span className="truncate text-sm font-semibold text-gray-700">{file.name}</span>
          <button type="button" onClick={onClear} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Remove file">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label htmlFor={inputId} className="flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:border-indigo-300 hover:bg-indigo-50">
          <Upload className="h-4 w-4" />
          Choose file
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const selectedFile = event.target.files?.[0]
          if (selectedFile) onFile(selectedFile)
          event.currentTarget.value = ''
        }}
      />
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
      const hasResource = !!lesson.resourceUrl.trim() || !!lesson.pendingResourceFile
      if (lesson.lessonType === LessonType.QUIZ) {
        const passingPercent = Number(lesson.passingPercent || 50)
        if (!Number.isInteger(passingPercent) || passingPercent < 0 || passingPercent > 100) {
          return `${label} passing score must be a full number from 0 to 100.`
        }
        if (!lesson.quizQuestions.length) return `${label} needs at least one question.`
        for (const [questionIndex, question] of lesson.quizQuestions.entries()) {
          const questionLabel = `${label}, question ${questionIndex + 1}`
          if (!question.questionText.trim()) return `${questionLabel} needs text.`
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
      if (lesson.lessonType === LessonType.DOCUMENT && !hasResource) {
        return `${label} is a document lesson, so upload a file or enter a resource URL.`
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

function toApiDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value
}
