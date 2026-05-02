import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MentorProfileRequest } from '@/types'
import { mentorApi } from '@/api/mentorApi'
import { useState } from 'react'

const mentorProfileSchema = z.object({
  headline: z.string().max(255, 'Headline must not exceed 255 characters').optional(),
  hourlyRateMxc: z.number().min(0, 'Hourly rate must be positive').optional(),
  yearsOfExperience: z.number().min(0, 'Years of experience cannot be negative').max(50, 'Years of experience cannot exceed 50').optional(),
  availability: z.string().max(50, 'Availability must not exceed 50 characters').optional(),
  responseTimeHours: z.number().min(1, 'Response time must be at least 1 hour').max(168, 'Response time cannot exceed 168 hours').optional(),
  cvUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
})

interface MentorProfileFormProps {
  userId: string
  initialData?: Partial<MentorProfileRequest>
  isEdit?: boolean
  onSuccess?: () => void
}

export default function MentorProfileForm({ userId, initialData, isEdit = false, onSuccess }: MentorProfileFormProps) {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MentorProfileRequest>({
    resolver: zodResolver(mentorProfileSchema),
    defaultValues: initialData,
  })

  const onSubmit = async (data: MentorProfileRequest) => {
    try {
      setLoading(true)
      setError('')
      setSuccess(false)
      
      if (isEdit) {
        await mentorApi.updateMentorProfile(userId, data)
      } else {
        await mentorApi.createMentorProfile(userId, data)
      }
      
      setSuccess(true)
      onSuccess?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="headline" className="label">
          Headline
        </label>
        <input
          id="headline"
          type="text"
          {...register('headline')}
          className="input"
          placeholder="Senior Software Engineer | Full-Stack Developer"
        />
        {errors.headline && <p className="error-message">{errors.headline.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="hourlyRateMxc" className="label">
            Hourly Rate (MXC)
          </label>
          <input
            id="hourlyRateMxc"
            type="number"
            step="0.01"
            {...register('hourlyRateMxc', { valueAsNumber: true })}
            className="input"
            placeholder="50.00"
          />
          {errors.hourlyRateMxc && <p className="error-message">{errors.hourlyRateMxc.message}</p>}
        </div>

        <div>
          <label htmlFor="yearsOfExperience" className="label">
            Years of Experience
          </label>
          <input
            id="yearsOfExperience"
            type="number"
            {...register('yearsOfExperience', { valueAsNumber: true })}
            className="input"
            placeholder="5"
          />
          {errors.yearsOfExperience && <p className="error-message">{errors.yearsOfExperience.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="availability" className="label">
            Availability
          </label>
          <input
            id="availability"
            type="text"
            {...register('availability')}
            className="input"
            placeholder="Full-time, Part-time"
          />
          {errors.availability && <p className="error-message">{errors.availability.message}</p>}
        </div>

        <div>
          <label htmlFor="responseTimeHours" className="label">
            Response Time (Hours)
          </label>
          <input
            id="responseTimeHours"
            type="number"
            {...register('responseTimeHours', { valueAsNumber: true })}
            className="input"
            placeholder="24"
          />
          {errors.responseTimeHours && <p className="error-message">{errors.responseTimeHours.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="cvUrl" className="label">
          CV URL
        </label>
        <input
          id="cvUrl"
          type="url"
          {...register('cvUrl')}
          className="input"
          placeholder="https://example.com/cv.pdf"
        />
        {errors.cvUrl && <p className="error-message">{errors.cvUrl.message}</p>}
      </div>

      <div>
        <label htmlFor="portfolioUrl" className="label">
          Portfolio URL
        </label>
        <input
          id="portfolioUrl"
          type="url"
          {...register('portfolioUrl')}
          className="input"
          placeholder="https://portfolio.example.com"
        />
        {errors.portfolioUrl && <p className="error-message">{errors.portfolioUrl.message}</p>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {isEdit ? 'Profile updated successfully!' : 'Mentor profile created successfully!'}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? 'Saving...' : isEdit ? 'Update Profile' : 'Create Mentor Profile'}
      </button>
    </form>
  )
}
