import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { proposalApi } from '@/api/proposalApi'
import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'

const proposalSchema = z.object({
  coverLetter: z.string().min(50, 'Cover letter must be at least 50 characters'),
  proposedAmount: z.coerce.number().min(1, 'Amount must be positive').optional(),
  proposedHourlyRate: z.coerce.number().min(1, 'Rate must be positive').optional(),
  estimatedDurationDays: z.coerce.number().min(1).optional(),
  relevantExperience: z.string().optional(),
})

type ProposalFormData = z.infer<typeof proposalSchema>

interface Props {
  jobId: string
  mentorId: string
  jobType: 'FIXED_PRICE' | 'HOURLY' | 'QUICK_SUPPORT'
  onSuccess?: () => void
}

export default function ProposalCreateForm({ jobId, mentorId, jobType, onSuccess }: Props) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
  })

  const onSubmit = async (data: ProposalFormData) => {
    try {
      setLoading(true)
      setError('')
      await proposalApi.create({
        ...data,
        jobId,
        mentorId,
      })
      setSuccess(true)
      if (onSuccess) setTimeout(onSuccess, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit proposal.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Proposal Submitted!</h3>
        <p className="text-sm text-gray-500">The client will be notified of your application.</p>
      </div>
    )
  }

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className={labelClass}>Cover Letter</label>
        <textarea
          {...register('coverLetter')}
          rows={6}
          className={inputClass}
          placeholder="Explain why you are the best fit for this job..."
        />
        {errors.coverLetter && <p className="text-xs text-red-500 mt-1">{errors.coverLetter.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {jobType === 'HOURLY' ? (
          <div>
            <label className={labelClass}>Proposed Hourly Rate (MXC)</label>
            <input
              type="number"
              step="0.01"
              {...register('proposedHourlyRate')}
              className={inputClass}
              placeholder="0.00"
            />
            {errors.proposedHourlyRate && <p className="text-xs text-red-500 mt-1">{errors.proposedHourlyRate.message}</p>}
          </div>
        ) : (
          <div>
            <label className={labelClass}>Proposed Total Amount (MXC)</label>
            <input
              type="number"
              step="0.01"
              {...register('proposedAmount')}
              className={inputClass}
              placeholder="0.00"
            />
            {errors.proposedAmount && <p className="text-xs text-red-500 mt-1">{errors.proposedAmount.message}</p>}
          </div>
        )}
        <div>
          <label className={labelClass}>Estimated Duration (Days)</label>
          <input
            type="number"
            {...register('estimatedDurationDays')}
            className={inputClass}
            placeholder="e.g., 7"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Relevant Experience</label>
        <textarea
          {...register('relevantExperience')}
          rows={3}
          className={inputClass}
          placeholder="Mention similar projects you've completed..."
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
        className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Proposal'
        )}
      </button>
    </form>
  )
}
