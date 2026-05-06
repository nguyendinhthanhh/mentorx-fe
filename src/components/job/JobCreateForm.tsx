import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { jobApi } from '@/api/jobApi'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const jobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  jobType: z.enum(['FIXED_PRICE', 'HOURLY', 'QUICK_SUPPORT']),
  budgetType: z.enum(['FIXED', 'HOURLY']),
  budgetMinMxc: z.coerce.number().min(0).optional(),
  budgetMaxMxc: z.coerce.number().min(0).optional(),
  hourlyRateMxc: z.coerce.number().min(0).optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
  deadlineAt: z.string().optional(),
})

type JobFormData = z.infer<typeof jobSchema>

export default function JobCreateForm({ clientId }: { clientId: string }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      jobType: 'FIXED_PRICE',
      budgetType: 'FIXED',
    },
  })

  const budgetType = watch('budgetType')

  const onSubmit = async (data: JobFormData) => {
    try {
      setLoading(true)
      setError('')
      const job = await jobApi.create({
        ...data,
        clientId,
        budgetMinMxc: data.budgetType === 'FIXED' ? data.budgetMinMxc : undefined,
        budgetMaxMxc: data.budgetType === 'FIXED' ? data.budgetMaxMxc : undefined,
        hourlyRateMxc: data.budgetType === 'HOURLY' ? data.hourlyRateMxc : undefined,
        deadlineAt: data.deadlineAt || undefined,
      })
      navigate(`/jobs/${job.jobId}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create job. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className={labelClass}>Job Title</label>
        <input
          {...register('title')}
          className={inputClass}
          placeholder="e.g., Need React mentor for 3 months"
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          {...register('description')}
          rows={5}
          className={inputClass}
          placeholder="Describe the job requirements, skills needed, and expected deliverables..."
        />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Job Type</label>
          <select {...register('jobType')} className={inputClass}>
            <option value="FIXED_PRICE">Fixed Price</option>
            <option value="HOURLY">Hourly</option>
            <option value="QUICK_SUPPORT">Quick Support</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Budget Type</label>
          <select {...register('budgetType')} className={inputClass}>
            <option value="FIXED">Fixed Budget</option>
            <option value="HOURLY">Hourly Rate</option>
          </select>
        </div>
      </div>

      {budgetType === 'FIXED' ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Min Budget (MXC)</label>
            <input
              type="number"
              step="0.01"
              {...register('budgetMinMxc')}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={labelClass}>Max Budget (MXC)</label>
            <input
              type="number"
              step="0.01"
              {...register('budgetMaxMxc')}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Hourly Rate (MXC)</label>
            <input
              type="number"
              step="0.01"
              {...register('hourlyRateMxc')}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={labelClass}>Estimated Hours</label>
            <input
              type="number"
              {...register('estimatedHours')}
              className={inputClass}
              placeholder="0"
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>Deadline (optional)</label>
        <input
          type="datetime-local"
          {...register('deadlineAt')}
          className={inputClass}
        />
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
            Creating job...
          </>
        ) : (
          'Post Job'
        )}
      </button>
    </form>
  )
}
