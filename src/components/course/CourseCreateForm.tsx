import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { courseApi } from '@/api/courseApi'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { SupportedLanguage } from '@/types'

const courseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().min(20, 'Description must be at least 20 characters').optional().or(z.literal('')),
  priceMxc: z.coerce.number().min(0).optional(),
  language: z.string().optional(),
  level: z.string().optional(),
  isCertificate: z.boolean().optional(),
  thumbnailUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  previewVideoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type CourseFormData = z.infer<typeof courseSchema>

export default function CourseCreateForm({ instructorId }: { instructorId: string }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    },
  })

  const title = watch('title')

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
      const course = await courseApi.create({
        ...data,
        instructorId,
        description: data.description || undefined,
        language: data.language as SupportedLanguage | undefined,
        thumbnailUrl: data.thumbnailUrl || undefined,
        previewVideoUrl: data.previewVideoUrl || undefined,
      })
      navigate(`/courses/${course.courseId}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create course. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

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
        <label className={labelClass}>Description</label>
        <textarea
          {...register('description')}
          rows={5}
          className={inputClass}
          placeholder="What will students learn in this course? What are the prerequisites?"
        />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Price (MXC)</label>
          <input
            type="number"
            step="0.01"
            {...register('priceMxc')}
            className={inputClass}
            placeholder="0.00 = Free"
          />
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

      <div>
        <label className={labelClass}>Thumbnail URL (optional)</label>
        <input
          {...register('thumbnailUrl')}
          className={inputClass}
          placeholder="https://example.com/image.jpg"
        />
        {errors.thumbnailUrl && <p className="text-xs text-red-500 mt-1">{errors.thumbnailUrl.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Preview Video URL (optional)</label>
        <input
          {...register('previewVideoUrl')}
          className={inputClass}
          placeholder="https://youtube.com/watch?v=..."
        />
        {errors.previewVideoUrl && <p className="text-xs text-red-500 mt-1">{errors.previewVideoUrl.message}</p>}
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
