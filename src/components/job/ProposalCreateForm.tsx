import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { proposalApi } from '@/api/proposalApi'
import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { BudgetType, JobType, ProposalResponse } from '@/types'

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
  onCancel?: () => void // New prop for cancel action
  forceEditMode?: boolean
}

export default function ProposalCreateForm({ jobId, mentorId, jobType, budgetType, onSuccess, onCancel, forceEditMode = false }: Props) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [existingProposal, setExistingProposal] = useState<ProposalResponse | null>(null)
  const [isEditing, setIsEditing] = useState(forceEditMode) // Initialize with forceEditMode
  const [checkingExisting, setCheckingExisting] = useState(true)
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
  })

  // Check for existing proposal on mount
  useEffect(() => {
    const checkExistingProposal = async () => {
      try {
        setCheckingExisting(true)
        const proposal = await proposalApi.getByJobAndMentor(jobId, mentorId)
        if (proposal) {
          setExistingProposal(proposal)
          // Pre-fill form with existing data
          reset({
            coverLetter: proposal.coverLetter,
            proposedAmount: proposal.proposedAmount,
            estimatedDurationDays: proposal.estimatedDurationDays || undefined,
            relevantExperience: proposal.relevantExperience || undefined,
          })
        }
      } catch (err) {
        console.error('Error checking existing proposal:', err)
      } finally {
        setCheckingExisting(false)
      }
    }

    checkExistingProposal()
  }, [jobId, mentorId, reset])

  const onSubmit = async (data: ProposalFormData) => {
    try {
      setLoading(true)
      setError('')
      
      const payload = {
        jobId,
        mentorId,
        coverLetter: data.coverLetter,
        proposedAmount: data.proposedAmount,
        proposedHourlyRate: budgetType === BudgetType.HOURLY ? data.proposedAmount : undefined,
        estimatedDurationDays: data.estimatedDurationDays,
        relevantExperience: data.relevantExperience,
      }
      
      if (existingProposal && isEditing) {
        // Update existing proposal
        await proposalApi.update(existingProposal.id, payload)
        setSuccess(true)
        setIsEditing(false)
        // Refresh existing proposal data
        const updated = await proposalApi.getByJobAndMentor(jobId, mentorId)
        setExistingProposal(updated)
      } else {
        // Create new proposal
        await proposalApi.create(payload)
        setSuccess(true)
      }
      
      if (onSuccess) setTimeout(onSuccess, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi proposal. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!existingProposal) return
    
    try {
      setWithdrawing(true)
      setError('')
      await proposalApi.withdraw(existingProposal.id)
      setExistingProposal(null)
      setShowWithdrawConfirm(false)
      reset()
      if (onSuccess) setTimeout(onSuccess, 1000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể thu hồi proposal. Vui lòng thử lại.')
    } finally {
      setWithdrawing(false)
    }
  }

  if (checkingExisting) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
        <p className="text-sm text-slate-600">Đang kiểm tra proposal hiện có...</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          {existingProposal && isEditing ? 'Đã cập nhật Proposal!' : 'Đã gửi Proposal!'}
        </h3>
        <p className="text-sm text-slate-600">Client sẽ nhận được thông báo về đề xuất của bạn.</p>
      </div>
    )
  }

  // Show existing proposal with edit/withdraw options
  if (existingProposal && !isEditing) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-900 mb-1">Bạn đã gửi proposal cho job này</h3>
              <p className="text-sm text-blue-700">
                Trạng thái: <span className="font-semibold">{existingProposal.status}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Gửi lúc: {new Date(existingProposal.submittedAt || existingProposal.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <p className="text-xs font-bold text-slate-600 mb-1">Cover Letter:</p>
              <p className="text-sm text-slate-800 bg-white rounded-lg p-3 border border-blue-100">
                {existingProposal.coverLetter}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-bold text-slate-600 mb-1">Giá đề xuất:</p>
                <p className="text-sm font-bold text-slate-900">{existingProposal.proposedAmount} MXC</p>
              </div>
              {existingProposal.estimatedDurationDays && (
                <div>
                  <p className="text-xs font-bold text-slate-600 mb-1">Thời gian:</p>
                  <p className="text-sm font-bold text-slate-900">{existingProposal.estimatedDurationDays} ngày</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(true)}
              disabled={existingProposal.status === 'ACCEPTED' || existingProposal.status === 'WITHDRAWN'}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Chỉnh sửa
            </button>
            <button
              onClick={() => setShowWithdrawConfirm(true)}
              disabled={existingProposal.status === 'ACCEPTED' || existingProposal.status === 'WITHDRAWN'}
              className="flex-1 flex items-center justify-center gap-2 bg-rose-600 text-white py-2.5 rounded-lg font-bold hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Thu hồi
            </button>
          </div>
        </div>

        {/* Withdraw Confirmation Modal */}
        {showWithdrawConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Thu hồi Proposal?</h3>
              <p className="text-sm text-slate-600 text-center mb-6">
                Bạn có chắc chắn muốn thu hồi proposal này? Hành động này không thể hoàn tác.
              </p>
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWithdrawConfirm(false)}
                  disabled={withdrawing}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 transition-all text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="flex-1 flex items-center justify-center gap-2 bg-rose-600 text-white py-2.5 rounded-lg font-bold hover:bg-rose-700 disabled:bg-rose-400 transition-all text-sm"
                >
                  {withdrawing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Xác nhận thu hồi'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
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
            {isEditing ? 'Đang cập nhật...' : 'Đang gửi...'}
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            {isEditing ? 'Cập nhật Proposal' : 'Gửi Proposal'}
          </>
        )}
      </button>

      {isEditing && (
        <button
          type="button"
          onClick={() => {
            if (forceEditMode && onCancel) {
              // If opened in force edit mode, call onCancel to close modal
              onCancel()
            } else {
              // Normal flow: go back to "already submitted" view
              setIsEditing(false)
              reset({
                coverLetter: existingProposal?.coverLetter,
                proposedAmount: existingProposal?.proposedAmount,
                estimatedDurationDays: existingProposal?.estimatedDurationDays || undefined,
                relevantExperience: existingProposal?.relevantExperience || undefined,
              })
            }
          }}
          className="w-full flex items-center justify-center gap-2 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 transition-all text-sm"
        >
          Hủy chỉnh sửa
        </button>
      )}
    </form>
  )
}
