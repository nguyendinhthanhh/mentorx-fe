import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { proposalApi } from '@/api/proposalApi'
import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, Edit2, Trash2, AlertCircle, FileText, Bookmark, Save } from 'lucide-react'
import { BudgetType, JobType, ProposalResponse } from '@/types'

const proposalSchema = z.object({
  coverLetter: z.string().min(10, 'Cover letter pháº£i cÃ³ Ã­t nháº¥t 10 kÃ½ tá»±'),
  proposedAmount: z.coerce.number().min(1, 'Sá»‘ tiá»n pháº£i lá»›n hÆ¡n 0'),
  estimatedDurationDays: z.coerce.number().min(1, 'Thá»i gian pháº£i Ã­t nháº¥t 1 ngÃ y').optional(),
  relevantExperience: z.string().optional(),
})

type ProposalFormData = z.infer<typeof proposalSchema>

interface Props {
  jobId: string
  mentorId: string
  jobType: JobType
  budgetType?: BudgetType
  clientBudget?: number
  clientDeadline?: string
  onSuccess?: () => void
  onCancel?: () => void
  forceEditMode?: boolean
}

export default function ProposalCreateForm({
  jobId,
  mentorId,
  jobType,
  budgetType,
  clientBudget,
  clientDeadline,
  onSuccess,
  onCancel,
  forceEditMode = false,
}: Props) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingProposal, setExistingProposal] = useState<ProposalResponse | null>(null)
  const [isEditing, setIsEditing] = useState(forceEditMode)
  const [checkingExisting, setCheckingExisting] = useState(true)
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
  })
  

  const handleUseSuggestedTemplate = () => {
    const template = `Chào bạn, \n\nMình thấy yêu cầu của bạn rất phù hợp với chuyên môn của mình.\n\n1. Kinh nghiệm liên quan:\n- [Liệt kê 1-2 dự án tương tự bạn từng làm]\n\n2. Phương án mình định triển khai:\n- [Nêu ngắn gọn 1-2 bước bạn sẽ làm để giải quyết vấn đề này]\n\nRất mong được trao đổi chi tiết hơn với bạn!`;
    setValue('coverLetter', template, { shouldValidate: true });
    toast.success('Đã áp dụng dàn ý gợi ý');
  };

  const handleSaveMyTemplate = () => {
    const currentText = watch('coverLetter');
    if (!currentText || currentText.length < 10) {
      toast.error('Vui lòng viết nội dung dài hơn trước khi lưu mẫu');
      return;
    }
    localStorage.setItem('mentorx_my_proposal_template', currentText);
    toast.success('Đã lưu thành mẫu của bạn');
  };

  const handleUseMyTemplate = () => {
    const saved = localStorage.getItem('mentorx_my_proposal_template');
    if (saved) {
      setValue('coverLetter', saved, { shouldValidate: true });
      toast.success('Đã áp dụng mẫu của bạn');
    } else {
      toast.error('Bạn chưa có mẫu nào được lưu');
    }
  };

  const currentAmount = watch('proposedAmount') || 0
  
  const calculateFee = (amount: number) => {
    if (!amount || amount <= 0) return { fee: 0, label: 'Phí dịch vụ nền tảng (0%)' }
    if (amount < 100) return { fee: 5, label: 'Phí cố định (5 MXC)' }
    if (amount < 300) return { fee: amount * 0.09, label: 'Phí nền tảng (9%)' }
    if (amount < 800) return { fee: amount * 0.08, label: 'Phí nền tảng (8%)' }
    if (amount < 1500) return { fee: amount * 0.07, label: 'Phí nền tảng (7%)' }
    if (amount < 3000) return { fee: amount * 0.06, label: 'Phí nền tảng (6%)' }
    
    let fee = amount * 0.05
    let label = 'Phí nền tảng (5%)'
    if (fee > 300) {
      fee = 300
      label = 'Phí nền tảng (Tối đa 300 MXC)'
    }
    return { fee, label }
  }

  const feeInfo = calculateFee(currentAmount)
  const platformFee = feeInfo.fee
  const netAmount = currentAmount - platformFee

  useEffect(() => {
    const checkExistingProposal = async () => {
      try {
        setCheckingExisting(true)
        const proposal = await proposalApi.getByJobAndMentor(jobId, mentorId)
        if (proposal) {
          setExistingProposal(proposal)
          reset({
            coverLetter: proposal.coverLetter,
            proposedAmount: proposal.proposedAmount,
            estimatedDurationDays: proposal.estimatedDurationDays || undefined,
            relevantExperience: proposal.relevantExperience || undefined,
          })
        } else {
          let calcDays = undefined;
          if (clientDeadline) {
             const d = new Date(clientDeadline);
             const today = new Date();
             const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 3600 * 24));
             if (diff > 0) calcDays = diff;
          }
          reset({
            proposedAmount: clientBudget || undefined,
            estimatedDurationDays: calcDays
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

      const isDraftLikeStatus = existingProposal?.status === 'DRAFT' || existingProposal?.status === 'WITHDRAWN'

      if (existingProposal && isEditing) {
        await proposalApi.update(existingProposal.id, payload)

        if (isDraftLikeStatus) {
          await proposalApi.submit(existingProposal.id)
        }

        setIsEditing(false)
        const updated = await proposalApi.getByJobAndMentor(jobId, mentorId)
        setExistingProposal(updated)
        toast.success(isDraftLikeStatus ? 'Đã gửi proposal.' : 'Đã cập nhật proposal.')
      } else {
        const newProposal = await proposalApi.create(payload)
        await proposalApi.submit(newProposal.id)

        const submitted = await proposalApi.getByJobAndMentor(jobId, mentorId)
        setExistingProposal(submitted)
        toast.success('Đã gửi proposal.')
      }

      onSuccess?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'KhÃ´ng thá»ƒ gá»­i proposal. Vui lÃ²ng thá»­ láº¡i.')
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
      toast.success('Đã thu hồi proposal.')
      onSuccess?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'KhÃ´ng thá»ƒ thu há»“i proposal. Vui lÃ²ng thá»­ láº¡i.')
    } finally {
      setWithdrawing(false)
    }
  }

  if (checkingExisting) {
    return (
      <div className="text-center py-8">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#4f46e5]" />
        <p className="text-sm text-slate-600">Äang kiá»ƒm tra proposal hiá»‡n cÃ³...</p>
      </div>
    )
  }

  if (existingProposal && !isEditing) {
    const canEditProposal = existingProposal.status === 'DRAFT' || existingProposal.status === 'WITHDRAWN'

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-900 mb-1">Báº¡n Ä‘Ã£ gá»­i proposal cho job nÃ y</h3>
              <p className="text-sm text-blue-700">
                Tráº¡ng thÃ¡i: <span className="font-semibold">{existingProposal.status}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Gá»­i lÃºc: {new Date(existingProposal.submittedAt || existingProposal.createdAt).toLocaleString('vi-VN')}
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
                <p className="text-xs font-bold text-slate-600 mb-1">GiÃ¡ Ä‘á» xuáº¥t:</p>
                <p className="text-sm font-bold text-slate-900">{existingProposal.proposedAmount} MXC</p>
              </div>
              {existingProposal.estimatedDurationDays && (
                <div>
                  <p className="text-xs font-bold text-slate-600 mb-1">Thá»i gian:</p>
                  <p className="text-sm font-bold text-slate-900">{existingProposal.estimatedDurationDays} ngÃ y</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(true)}
              disabled={!canEditProposal}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-lg font-bold hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all text-sm"
            >
              <Edit2 className="w-4 h-4" />
              {existingProposal.status === 'WITHDRAWN' ? 'Apply láº¡i' : 'Chá»‰nh sá»­a'}
            </button>
            <button
              onClick={() => setShowWithdrawConfirm(true)}
              disabled={existingProposal.status === 'ACCEPTED' || existingProposal.status === 'WITHDRAWN'}
              className="flex-1 flex items-center justify-center gap-2 bg-rose-600 text-white py-2.5 rounded-lg font-bold hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Thu há»“i
            </button>
          </div>
        </div>

        {showWithdrawConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Thu há»“i Proposal?</h3>
              <p className="text-sm text-slate-600 text-center mb-6">
                Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n thu há»“i proposal nÃ y? HÃ nh Ä‘á»™ng nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c.
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
                  Há»§y
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="flex-1 flex items-center justify-center gap-2 bg-rose-600 text-white py-2.5 rounded-lg font-bold hover:bg-rose-700 disabled:bg-rose-400 transition-all text-sm"
                >
                  {withdrawing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Äang xá»­ lÃ½...
                    </>
                  ) : (
                    'XÃ¡c nháº­n thu há»“i'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const inputClass = 'w-full rounded-xl border border-[#e2e6f5] px-4 py-3 text-sm font-medium transition-all focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#c7d2fe]/40'
  const labelClass = 'block text-sm font-bold text-slate-700 mb-2'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            {budgetType === BudgetType.HOURLY ? 'Giá theo giờ (MXC)' : 'Tổng chi phí đề xuất (MXC)'} <span className="text-rose-500">*</span>
          </label>
          {clientBudget && (
            <p className="text-[13px] text-slate-500 mb-2 mt-[-4px]">Ngân sách khách hàng đưa ra: <span className="font-bold text-emerald-600">{clientBudget.toLocaleString()} MXC</span></p>
          )}
          <div className="relative">
            <input
              type="number"
              step="0.01"
              {...register('proposedAmount')}
              className={`${inputClass} pr-14`}
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 font-medium text-sm">
              MXC
            </div>
          </div>
          {errors.proposedAmount && <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            {errors.proposedAmount.message}
          </p>}
          <div className="mt-3 rounded-xl bg-slate-50/50 p-3 text-[13px] border border-slate-200/60">
             <div className="flex justify-between text-slate-500 mb-2">
                <span>{feeInfo.label}</span>
                <span className="font-medium">- {platformFee.toLocaleString()} MXC</span>
             </div>
             <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200/60">
                <span>Bạn sẽ thực nhận</span>
                <span className="text-emerald-600">{netAmount.toLocaleString()} MXC</span>
             </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Thời gian hoàn thành (Ngày)
          </label>
          {clientDeadline && (
            <p className="text-[13px] text-slate-500 mb-2 mt-[-4px]">Khách cần xong trước: <span className="font-bold text-blue-600">{new Date(clientDeadline).toLocaleDateString('vi-VN')}</span></p>
          )}
          <div className="relative">
            <input
              type="number"
              {...register('estimatedDurationDays')}
              className={`${inputClass} pr-14`}
              placeholder="Ví dụ: 7"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 font-medium text-sm">
              Ngày
            </div>
          </div>
          {errors.estimatedDurationDays && <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            {errors.estimatedDurationDays.message}
          </p>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold text-slate-700">
            Thư giới thiệu / Cover Message <span className="text-rose-500">*</span>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleUseSuggestedTemplate}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 transition"
            >
              <FileText className="w-3.5 h-3.5" /> Dàn ý gợi ý
            </button>
            <button
              type="button"
              onClick={handleUseMyTemplate}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition"
            >
              <Bookmark className="w-3.5 h-3.5" /> Mẫu của tôi
            </button>
          </div>
        </div>
        <textarea
          {...register('coverLetter')}
          rows={8}
          className={inputClass}
          placeholder="Giới thiệu bản thân, kinh nghiệm liên quan và cách bạn sẽ giải quyết vấn đề này..."
        />
        {errors.coverLetter && <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
          {errors.coverLetter.message}
        </p>}
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-slate-500">Tối thiểu 10 ký tự</p>
          <button
            type="button"
            onClick={handleSaveMyTemplate}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition"
          >
            <Save className="w-3 h-3" /> Lưu làm mẫu của tôi
          </button>
        </div>
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
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
              onCancel()
            } else {
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
