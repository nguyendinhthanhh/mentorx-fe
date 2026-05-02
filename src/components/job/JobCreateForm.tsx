import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { JobCreateRequest, JobType, BudgetType } from '@/types'
import { jobApi } from '@/api/jobApi'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const jobCreateSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  categoryId: z.number().optional(),
  jobType: z.nativeEnum(JobType),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  budgetType: z.nativeEnum(BudgetType),
  budgetMinMxc: z.number().min(0).optional(),
  budgetMaxMxc: z.number().min(0).optional(),
  hourlyRateMxc: z.number().min(0).optional(),
  estimatedHours: z.number().min(0).optional(),
  deadlineAt: z.string().optional(),
})

interface JobCreateFormProps {
  clientId: string
}

export default function JobCreateForm({ clientId }: JobCreateFormProps) {
  const navigate = useNavigate()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<JobCreateRequest>({
    resolver: zodResolver(jobCreateSchema),
    defaultValues: {
      clientId,
      jobType: JobType.FIXED_PRICE,
      budgetType: BudgetType.FIXED,
    },
  })

  const budgetType = watch('budgetType')

  const onSubmit = async (data: JobCreateRequest) => {
    try {
      setLoading(true)
      setError('')
      const job = await jobApi.create(data)
      navigate(`/jobs/${job.jobId}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create job. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="title" className="label">
          Job Title *
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className="input"
          placeholder="Full-Stack Developer Needed"
        />
        {errors.title && <p className="error-message">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="label">
          Description *
        </label>
        <textarea
          id="description"
          {...register('description')}
          className="input"
          rows={6}
          placeholder="Describe the job requirements, skills needed, and project details..."
        />
        {errors.description && <p className="error-message">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="jobType" className="label">
            Job Type *
          </label>
          <select id="jobType" {...register('jobType')} className="input">
            {Object.values(JobType).map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
          {errors.jobType && <p className="error-message">{errors.jobType.message}</p>}
        </div>

        <div>
          <label htmlFor="budgetType" className="label">
            Budget Type *
          </label>
          <select id="budgetType" {...register('budgetType')} className="input">
            {Object.values(BudgetType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.budgetType && <p className="error-message">{errors.budgetType.message}</p>}
        </div>
      </div>

      {budgetType === BudgetType.FIXED && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="budgetMinMxc" className="label">
              Minimum Budget (MXC)
            </label>
            <input
              id="budgetMinMxc"
              type="number"
              step="0.01"
              {...register('budgetMinMxc', { valueAsNumber: true })}
              className="input"
              placeholder="1000.00"
            />
            {errors.budgetMinMxc && <p className="error-message">{errors.budgetMinMxc.message}</p>}
          </div>

          <div>
            <label htmlFor="budgetMaxMxc" className="label">
              Maximum Budget (MXC)
            </label>
            <input
              id="budgetMaxMxc"
              type="number"
              step="0.01"
              {...register('budgetMaxMxc', { valueAsNumber: true })}
              className="input"
              placeholder="5000.00"
            />
            {errors.budgetMaxMxc && <p className="error-message">{errors.budgetMaxMxc.message}</p>}
          </div>
        </div>
      )}

      {budgetType === BudgetType.HOURLY && (
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
            <label htmlFor="estimatedHours" className="label">
              Estimated Hours
            </label>
            <input
              id="estimatedHours"
              type="number"
              step="0.5"
              {...register('estimatedHours', { valueAsNumber: true })}
              className="input"
              placeholder="40"
            />
            {errors.estimatedHours && <p className="error-message">{errors.estimatedHours.message}</p>}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="deadlineAt" className="label">
          Deadline
        </label>
        <input
          id="deadlineAt"
          type="datetime-local"
          {...register('deadlineAt')}
          className="input"
        />
        {errors.deadlineAt && <p className="error-message">{errors.deadlineAt.message}</p>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button type="button" onClick={() => navigate('/jobs')} className="btn btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn btn-primary flex-1">
          {loading ? 'Creating...' : 'Create Job'}
        </button>
      </div>
    </form>
  )
}
