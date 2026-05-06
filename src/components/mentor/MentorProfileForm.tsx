import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { mentorApi } from '@/api/mentorApi'
import { MentorProfileRequest } from '@/types'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle } from 'lucide-react'

const mentorSchema = z.object({
  headline: z.string().min(10, 'Headline must be at least 10 characters').max(200),
  hourlyRateMxc: z.coerce.number().min(0, 'Rate must be positive').optional(),
  yearsOfExperience: z.coerce.number().min(0).max(50).optional(),
  availability: z.string().optional(),
  responseTimeHours: z.coerce.number().min(1).max(72).optional(),
  cvUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type MentorFormData = z.infer<typeof mentorSchema>

interface Props {
  userId: string
  initialData?: MentorProfileRequest
  isEdit: boolean
}

export default function MentorProfileForm({ userId, initialData, isEdit }: Props) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MentorFormData>({
    resolver: zodResolver(mentorSchema),
    defaultValues: {
      headline: initialData?.headline || '',
      hourlyRateMxc: initialData?.hourlyRateMxc || undefined,
      yearsOfExperience: initialData?.yearsOfExperience || undefined,
      availability: initialData?.availability || 'Part-time',
      responseTimeHours: initialData?.responseTimeHours || undefined,
      cvUrl: initialData?.cvUrl || '',
      portfolioUrl: initialData?.portfolioUrl || '',
    },
  })

  const onSubmit = async (data: MentorFormData) => {
    try {
      setLoading(true)
      setError('')
      const payload: MentorProfileRequest = {
        ...data,
        cvUrl: data.cvUrl || undefined,
        portfolioUrl: data.portfolioUrl || undefined,
      }

      if (isEdit) {
        await mentorApi.updateMentorProfile(userId, payload)
      } else {
        await mentorApi.createMentorProfile(userId, payload)
      }
      setSuccess(true)
      setTimeout(() => navigate('/mentors'), 1500)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save mentor profile.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {isEdit ? 'Profile Updated!' : 'Application Submitted!'}
        </h3>
        <p className="text-sm text-gray-500">
          {isEdit ? 'Your mentor profile has been updated.' : 'Your mentor application is under review.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className={labelClass}>Professional Headline</label>
        <input
          {...register('headline')}
          className={inputClass}
          placeholder="e.g., Senior Full-Stack Developer | 10+ Years in React & Node.js"
        />
        {errors.headline && <p className="text-xs text-red-500 mt-1">{errors.headline.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Hourly Rate (MXC)</label>
          <input
            type="number"
            step="0.01"
            {...register('hourlyRateMxc')}
            className={inputClass}
            placeholder="50.00"
          />
        </div>
        <div>
          <label className={labelClass}>Years of Experience</label>
          <input
            type="number"
            {...register('yearsOfExperience')}
            className={inputClass}
            placeholder="5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Availability</label>
          <select {...register('availability')} className={inputClass}>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Weekends">Weekends only</option>
            <option value="Flexible">Flexible</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Response Time (hours)</label>
          <input
            type="number"
            {...register('responseTimeHours')}
            className={inputClass}
            placeholder="24"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>CV / Resume URL (optional)</label>
        <input
          {...register('cvUrl')}
          className={inputClass}
          placeholder="https://drive.google.com/your-cv"
        />
        {errors.cvUrl && <p className="text-xs text-red-500 mt-1">{errors.cvUrl.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Portfolio URL (optional)</label>
        <input
          {...register('portfolioUrl')}
          className={inputClass}
          placeholder="https://github.com/username"
        />
        {errors.portfolioUrl && <p className="text-xs text-red-500 mt-1">{errors.portfolioUrl.message}</p>}
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
        className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : isEdit ? (
          'Update Profile'
        ) : (
          'Submit Application'
        )}
      </button>
    </form>
  )
}
