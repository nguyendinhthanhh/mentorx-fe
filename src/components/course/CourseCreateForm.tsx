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
import { Download, FileText, Loader2, Trash2, Upload, X } from 'lucide-react'
import { CategoryResponse, CourseProductType, LessonType, SkillResponse, SupportedLanguage } from '@/types'

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
  isCertificate: z.boolean().optional(),
  productType: z.nativeEnum(CourseProductType),
})

type CourseFormData = z.infer<typeof courseSchema>

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
      let documentUrl: string | undefined

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
        documentUrl = result.fileUrl
      }

      const course = await courseApi.create({
        ...data,
        slug: buildSlug(data.title),
        instructorId,
        categoryId: data.categoryId,
        skillIds: data.skillIds,
        description: data.description || undefined,
        thumbnailUrl,
        previewVideoUrl,
        language: data.language as SupportedLanguage | undefined,
        productType: data.productType,
        isCertificate: isDocument ? false : data.isCertificate,
      })
      const createdCourseId = course.courseId || course.id
      if (isDocument && createdCourseId && documentUrl) {
        await courseApi.saveCurriculum(createdCourseId, {
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
              resourceUrl: documentUrl,
              isPublished: true,
              isMandatory: true,
              isFreePreview: false,
            }],
          }],
        })
      }
      navigate(`/mentor/courses/${createdCourseId}/manage`)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || `Failed to create ${isDocument ? 'document' : 'course'}. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className={labelClass}>Product Type</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: CourseProductType.COURSE, label: 'Course', description: 'Lessons, quizzes, and course materials' },
            { value: CourseProductType.DOCUMENT, label: 'Document', description: 'A standalone downloadable resource' },
          ].map((item) => (
            <label
              key={item.value}
              className="cursor-pointer rounded-xl border border-gray-200 p-4 transition has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
            >
              <input type="radio" value={item.value} {...register('productType')} className="sr-only" />
              <span className="block text-sm font-black text-gray-900">{item.label}</span>
              <span className="mt-1 block text-xs leading-5 text-gray-500">{item.description}</span>
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
        <div className="rounded-xl border border-gray-200 p-3">
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
              <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                {suggestedSkills.length > 0 ? (
                  suggestedSkills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => addSkill(skill.id)}
                      className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-indigo-50"
                    >
                      <span className="text-sm font-semibold text-gray-900">{skill.labelEn}</span>
                      <span className="text-xs text-gray-500">{skill.slug}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">No matching active skills.</div>
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
            {selectedSkills.length === 0 && <span className="text-sm text-gray-400">No skills selected.</span>}
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

      {!isDocument && <div className="flex items-center gap-3">
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
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
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
