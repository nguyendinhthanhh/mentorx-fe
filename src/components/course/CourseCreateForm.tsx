import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CourseCreateRequest, SupportedLanguage } from '@/types'
import { courseApi } from '@/api/courseApi'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const courseCreateSchema = z.object({
  instructorId: z.string().uuid('Invalid instructor ID'),
  categoryId: z.number().optional(),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  thumbnailUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  priceMxc: z.number().min(0).optional(),
  language: z.nativeEnum(SupportedLanguage).optional(),
  level: z.string().optional(),
  isCertificate: z.boolean().optional(),
  previewVideoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
})

interface CourseCreateFormProps {
  instructorId: string
}

export default function CourseCreateForm({ instructorId }: CourseCreateFormProps) {
  const navigate = useNavigate()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseCreateRequest>({
    resolver: zodResolver(courseCreateSchema),
    defaultValues: {
      instructorId,
      isCertificate: false,
    },
  })

  const onSubmit = async (data: CourseCreateRequest) => {
    try {
      setLoading(true)
      setError('')
      const course = await courseApi.create(data)
      navigate(`/courses/${course.courseId}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create course. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="title" className="label">
          Course Title *
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className="input"
          placeholder="Complete Web Development Bootcamp"
        />
        {errors.title && <p className="error-message">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="slug" className="label">
          Slug *
        </label>
        <input
          id="slug"
          type="text"
          {...register('slug')}
          className="input"
          placeholder="complete-web-development-bootcamp"
        />
        {errors.slug && <p className="error-message">{errors.slug.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          className="input"
          rows={6}
          placeholder="Describe what students will learn in this course..."
        />
        {errors.description && <p className="error-message">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="priceMxc" className="label">
            Price (MXC)
          </label>
          <input
            id="priceMxc"
            type="number"
            step="0.01"
            {...register('priceMxc', { valueAsNumber: true })}
            className="input"
            placeholder="99.99"
          />
          {errors.priceMxc && <p className="error-message">{errors.priceMxc.message}</p>}
        </div>

        <div>
          <label htmlFor="language" className="label">
            Language
          </label>
          <select id="language" {...register('language')} className="input">
            <option value="">Select language</option>
            {Object.values(SupportedLanguage).map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          {errors.language && <p className="error-message">{errors.language.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="level" className="label">
          Level
        </label>
        <select id="level" {...register('level')} className="input">
          <option value="">Select level</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="All Levels">All Levels</option>
        </select>
        {errors.level && <p className="error-message">{errors.level.message}</p>}
      </div>

      <div>
        <label htmlFor="thumbnailUrl" className="label">
          Thumbnail URL
        </label>
        <input
          id="thumbnailUrl"
          type="url"
          {...register('thumbnailUrl')}
          className="input"
          placeholder="https://example.com/thumbnail.jpg"
        />
        {errors.thumbnailUrl && <p className="error-message">{errors.thumbnailUrl.message}</p>}
      </div>

      <div>
        <label htmlFor="previewVideoUrl" className="label">
          Preview Video URL
        </label>
        <input
          id="previewVideoUrl"
          type="url"
          {...register('previewVideoUrl')}
          className="input"
          placeholder="https://youtube.com/watch?v=..."
        />
        {errors.previewVideoUrl && <p className="error-message">{errors.previewVideoUrl.message}</p>}
      </div>

      <div className="flex items-center">
        <input
          id="isCertificate"
          type="checkbox"
          {...register('isCertificate')}
          className="mr-2"
        />
        <label htmlFor="isCertificate" className="text-sm text-gray-700">
          Offer certificate upon completion
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button type="button" onClick={() => navigate('/courses')} className="btn btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn btn-primary flex-1">
          {loading ? 'Creating...' : 'Create Course'}
        </button>
      </div>
    </form>
  )
}
