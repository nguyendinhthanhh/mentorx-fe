import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { proposalApi } from '@/api/proposalApi'
import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'
import { BudgetType, JobType } from '@/types'

const proposalSchema = z.object({
  coverLetter: z.string().min(10, 'Cover letter phải có ít nhất 10 ký tự'),
  proposedAmount: z.coerce.number().min(1, 'Số tiền phải lớn hơn 0'),
  estimatedDurationDays: z.coerce.number().min(1, 'Thời gian phải ít nhất 1 ngày').optional(),
  relevantExperience: z.string().optional(),
})

type ProposalFormData = z.infer<typeof proposalSchema>

interface Props {
  jobId: string
  mentorId: string
  jobType: JobType
  budgetType?: BudgetType
  onSuccess?: () => void
}

export default function ProposalCreateForm({ jobId, mentorId, jobType, budgetType, onSuccess }: Props) {
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
      
      // Always send proposedAmount (required by backend)
      // If hourly rate, calculate estimated amount
      const payload = {
        jobId,
        mentorId,
        coverLetter: data.coverLetter,
        proposedAmount: data.proposedAmount,
        proposedHourlyRate: budgetType === BudgetType.HOURLY ? data.proposedAmount : undefined,
        estimatedDurationDays: data.estimatedDurationDays,
        relevantExperience: data.relevantExperience,
      }
      
      await proposalApi.create(payload)
      setSuccess(true)
      if (onSuccess) setTimeout(onSuccess, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi proposal. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Đã gửi Proposal!</h3>
        <p className="text-sm text-slate-600">Client sẽ nhận được thông báo về đề xuất của bạn.</p>
      </div>
    )
  }

  const inputClass = 'w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium'
  const labelClass = 'block text-sm font-bold text-slate-700 mb-2'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Cover Letter */}
      <div>
        <label className={labelClass}>
          Thư giới thiệu / Cover Message <span className="text-rose-500">*</span>
        </label>
        <textarea
          {...register('coverLetter')}
          rows={6}
          className={inputClass}
          placeholder="Giới thiệu bản thân, kinh nghiệm liên quan và cách bạn sẽ giải quyết vấn đề này..."
        />
        {errors.coverLetter && <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
          {errors.coverLetter.message}
        </p>}
        <p className="text-xs text-slate-500 mt-1.5">Tối thiểu 10 ký tự</p>
      </div>

      {/* Proposed Amount & Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            {budgetType === BudgetType.HOURLY ? 'Giá theo giờ (MXC)' : 'Tổng chi phí đề xuất (MXC)'} <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            {...register('proposedAmount')}
            className={inputClass}
            placeholder="0.00"
          />
          {errors.proposedAmount && <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            {errors.proposedAmount.message}
          </p>}
        </div>
        
        <div>
          <label className={labelClass}>
            Thời gian hoàn thành (Ngày)
          </label>
          <input
            type="number"
            {...register('estimatedDurationDays')}
            className={inputClass}
            placeholder="Ví dụ: 7"
          />
          {errors.estimatedDurationDays && <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            {errors.estimatedDurationDays.message}
          </p>}
        </div>
      </div>

      {/* Relevant Experience */}
      <div>
        <label className={labelClass}>Kinh nghiệm liên quan (Tùy chọn)</label>
        <textarea
          {...register('relevantExperience')}
          rows={4}
          className={inputClass}
          placeholder="Mô tả các dự án tương tự bạn đã hoàn thành, kỹ năng và chứng chỉ liên quan..."
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold">Lỗi khi gửi proposal</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all text-sm shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Đang gửi...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            Gửi Proposal
          </>
        )}
      </button>
    </form>
  )
}
