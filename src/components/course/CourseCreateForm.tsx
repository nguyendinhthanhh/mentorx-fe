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
import { Loader2, X } from 'lucide-react'
import { CategoryResponse, SkillResponse, SupportedLanguage } from '@/types'

const courseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().min(20, 'Description must be at least 20 characters').optional().or(z.literal('')),
  categoryId: z.coerce.number().int().positive('Please choose a domain/category'),
  skillIds: z.array(z.number()).min(1, 'Please choose at least one skill'),
  priceMxc: z.coerce.number({
    invalid_type_error: 'Price must be a full number',
  }).int('Price must be a full number').min(0, 'Price cannot be negative'),
  language: z.string().optional(),
  level: z.string().optional(),
  isCertificate: z.boolean().optional(),
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
      skillIds: [],
    },
  })

  const title = watch('title')
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

  const generateSlug = () => {
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setValue('slug', slug)
    }
  }

  const onSubmit = async (data: CourseFormData) => {
    try {
      setLoading(true)
      setError('')
      let thumbnailUrl: string | undefined
      let previewVideoUrl: string | undefined

      if (thumbnailFile) {
        const result = await fileApi.uploadCourseMedia(thumbnailFile, 'mentorx/courses/previews/images')
        thumbnailUrl = result.fileUrl
      }

      if (previewVideoFile) {
        const result = await fileApi.uploadCourseMedia(previewVideoFile, 'mentorx/courses/previews/videos')
        previewVideoUrl = result.fileUrl
      }

      const course = await courseApi.create({
        ...data,
        instructorId,
        categoryId: data.categoryId,
        skillIds: data.skillIds,
        description: data.description || undefined,
        thumbnailUrl,
        previewVideoUrl,
        language: data.language as SupportedLanguage | undefined,
      })
      navigate(`/mentor/courses/${course.courseId || course.id}/manage`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create course. Please try again.')
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
        <label className={labelClass}>
          URL Slug
          <button type="button" onClick={generateSlug} className="ml-2 text-xs text-primary-600 hover:text-primary-700">
            Auto-generate from title
          </button>
        </label>
        <input
          {...register('slug')}
          className={inputClass}
          placeholder="introduction-to-machine-learning"
        />
        {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>}
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

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isCertificate"
          {...register('isCertificate')}
          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="isCertificate" className="text-sm text-gray-700">
          Offer certificate upon completion
        </label>
      </div>

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
            Creating course...
          </>
        ) : (
          'Create Course'
        )}
      </button>
    </form>
  )
}
