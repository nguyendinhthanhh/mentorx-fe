import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ChevronDown,
  Info,
  Loader2,
  X,
  Send,
  FileIcon,
  Upload,
  Save,
  Clock,
  CalendarDays
} from 'lucide-react'
import { jobApi } from '@/api/jobApi'
import { categoryApi } from '@/api/categoryApi'
import { fileApi } from '@/api/fileApi'
import { BudgetType, CategoryResponse, JobResponse, JobStatus, JobType } from '@/types'

const optionalNumber = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.number().min(0).optional()
)

const optionalText = (max = 1200) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) => {
      const trimmed = value?.trim()
      return trimmed ? trimmed : undefined
    })

const jobSchema = z.object({
  title: z.string().trim().min(5, 'Tiêu đề phải có ít nhất 5 ký tự').max(200),
  description: z.string().trim(),
  categoryId: z.coerce.number().min(1, 'Vui lòng chọn danh mục'),
  
  deadlineDays: z.string().optional(),
  deadlineDate: z.string().optional(),
  isUrgent: z.boolean().default(false),
  
  budgetType: z.enum(['FIXED', 'HOURLY']).default('FIXED'),
  budgetAmount: optionalNumber,
  hourlyRate: optionalNumber,
  estimatedHours: optionalNumber,

  requiredSkillsInput: optionalText(500),
  currentLevel: optionalText(120),
  learningGoals: optionalText(1200),
  successCriteria: optionalText(1200),
  jobType: z.enum(['LONG_TERM_MENTORING', 'FREELANCE_PROJECT', 'QUICK_FIX']).optional(),
  experienceLevel: optionalText(80),
  communicationPreference: optionalText(120),
  availabilityExpectation: optionalText(255),
}).superRefine((data, ctx) => {
  if (data.description) {
    const wordCount = data.description.trim().split(/\s+/).filter((word) => word.length > 0).length
    if (wordCount < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Mô tả cần ít nhất 10 từ. Hiện tại: ${wordCount} từ.`,
        path: ['description'],
      })
    }
  }

  if (data.budgetType === 'FIXED' && !data.budgetAmount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vui lòng nhập ngân sách dự kiến',
      path: ['budgetAmount'],
    })
  }

  if (data.budgetType === 'HOURLY') {
    if (!data.hourlyRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng nhập mức giá theo giờ',
        path: ['hourlyRate'],
      })
    }
    if (!data.estimatedHours) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng nhập số giờ dự kiến',
        path: ['estimatedHours'],
      })
    }
  }

  if (!data.isUrgent && !data.deadlineDate && !data.deadlineDays) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vui lòng chọn thời gian hoàn thành',
      path: ['deadlineDate'],
    })
  }
})

type JobFormData = z.infer<typeof jobSchema>

type JobCreateFormProps = {
  clientId: string
  initialJob?: JobResponse
  mode?: 'create' | 'edit'
}

export default function JobCreateForm({ clientId, initialJob, mode = 'create' }: JobCreateFormProps) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  
  const [uploading, setUploading] = useState(false)
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [fileName, setFileName] = useState('')
  
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  
  // Status is DRAFT when "Lưu nháp" is clicked
  const [submitStatus, setSubmitStatus] = useState<'OPEN' | 'DRAFT'>('OPEN')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      jobType: JobType.FREELANCE_PROJECT,
      budgetType: BudgetType.FIXED,
      isUrgent: true,
      deadlineDays: "7"
    },
  })

  const budgetType = watch('budgetType')
  const isUrgent = watch('isUrgent')
  const isEditing = mode === 'edit' && Boolean(initialJob)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAllActive()
        setCategories(data)
      } catch (err) {
        console.error('Failed to fetch categories', err)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (!initialJob) return

    reset({
      title: initialJob.title || '',
      description: initialJob.description || '',
      categoryId: initialJob.categoryId as any,
      jobType: initialJob.jobType || JobType.FREELANCE_PROJECT,
      budgetType: initialJob.budgetType || BudgetType.FIXED,
      budgetAmount: initialJob.budgetMinMxc,
      hourlyRate: initialJob.hourlyRateMxc,
      estimatedHours: initialJob.estimatedHours,
      requiredSkillsInput: initialJob.requiredSkills?.join(', ') || '',
      currentLevel: initialJob.currentLevel,
      learningGoals: initialJob.learningGoals,
      successCriteria: initialJob.successCriteria,
      experienceLevel: initialJob.experienceLevel,
      communicationPreference: initialJob.communicationPreference,
      availabilityExpectation: initialJob.availabilityExpectation,
      isUrgent: !initialJob.deadlineAt,
      deadlineDate: initialJob.deadlineAt ? initialJob.deadlineAt.slice(0, 16) : undefined,
      deadlineDays: initialJob.deadlineAt ? undefined : '7',
    })

    const existingAttachment = initialJob.attachmentUrl || initialJob.attachments?.[0] || ''
    setAttachmentUrl(existingAttachment)
    setFileName(existingAttachment ? 'Tệp đã đính kèm' : '')
    setSubmitStatus(initialJob.status === JobStatus.DRAFT ? 'DRAFT' : 'OPEN')
  }, [initialJob, reset])

  const buildJobPayload = (data: JobFormData, status: JobStatus) => {
    let deadlineAt: string | undefined = undefined
    if (data.isUrgent) {
      const date = new Date()
      date.setDate(date.getDate() + 7)
      deadlineAt = date.toISOString().slice(0, 16)
    } else if (data.deadlineDate) {
      deadlineAt = new Date(data.deadlineDate).toISOString().slice(0, 16)
    } else if (data.deadlineDays) {
      const days = parseInt(data.deadlineDays, 10)
      if (!Number.isNaN(days)) {
        const date = new Date()
        date.setDate(date.getDate() + days)
        deadlineAt = date.toISOString().slice(0, 16)
      }
    }

    return {
      title: data.title,
      description: data.description || '',
      categoryId: data.categoryId || undefined,
      jobType: (data.jobType || JobType.FREELANCE_PROJECT) as JobType,
      requiredSkills: data.requiredSkillsInput ? data.requiredSkillsInput.split(/[,;\n]/).map((skill) => skill.trim()).filter(Boolean) : [],
      experienceLevel: data.experienceLevel,
      currentLevel: data.currentLevel,
      learningGoals: data.learningGoals,
      successCriteria: data.successCriteria,
      availabilityExpectation: data.availabilityExpectation,
      communicationPreference: data.communicationPreference,
      attachmentUrl: attachmentUrl || undefined,
      attachments: attachmentUrl ? [attachmentUrl] : undefined,
      budgetType: data.budgetType as BudgetType,
      budgetMinMxc: data.budgetType === 'FIXED' ? data.budgetAmount : undefined,
      budgetMaxMxc: data.budgetType === 'FIXED' ? data.budgetAmount : undefined,
      hourlyRateMxc: data.budgetType === 'HOURLY' ? data.hourlyRate : undefined,
      estimatedHours: data.budgetType === 'HOURLY' ? data.estimatedHours : undefined,
      deadlineAt,
      status,
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setError('')
      const res = await fileApi.upload(file)
      setAttachmentUrl(res.fileUrl)
      setFileName(file.name)
    } catch (err) {
      setError('Tải file thất bại. Vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveDraft = async () => {
    const data = getValues()
    
    if (!data.title || data.title.trim().length < 5) {
      setError('Cần ít nhất 5 ký tự tiêu đề để lưu nháp.')
      return
    }
    
    try {
      setSubmitStatus('DRAFT')
      setLoading(true)
      setError('')

      const payload = buildJobPayload(data, JobStatus.DRAFT)
      if (isEditing && initialJob) {
        await jobApi.update(initialJob.jobId, payload)
      } else {
        await jobApi.create({ clientId, ...payload })
      }
      navigate('/my-jobs')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể lưu nháp. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: JobFormData) => {
    if (!agreeTerms && submitStatus !== 'DRAFT') {
      setError('Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const payload = buildJobPayload(data, submitStatus as JobStatus)
      const job = isEditing && initialJob
        ? await jobApi.update(initialJob.jobId, payload)
        : await jobApi.create({ clientId, ...payload })
      navigate(`/jobs/${job.jobId}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tạo công việc. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-[20px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-8">
      
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-800">Tiêu đề yêu cầu</label>
        <input
          {...register('title')}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition"
          placeholder="VD: Cần tìm mentor hướng dẫn UI/UX cho người mới bắt đầu"
        />
        {errors.title && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.title.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">Danh mục</label>
          <div className="relative">
            <select
              {...register('categoryId')}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition"
            >
              <option value="">Chọn lĩnh vực hỗ trợ</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          {errors.categoryId && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.categoryId.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">Thời gian làm việc mong muốn</label>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" {...register('isUrgent')} className="rounded border-slate-300 text-blue-500 focus:ring-blue-500" />
              <Clock className="h-4 w-4 text-amber-500" />
              Làm ngay (Càng sớm càng tốt)
            </label>
            
            {!isUrgent && (
              <div className="relative">
                <input
                  type="datetime-local"
                  {...register('deadlineDate')}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition"
                />
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-800">Mô tả chi tiết</label>
        <textarea
          {...register('description')}
          rows={5}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition"
          placeholder="Hãy mô tả cụ thể vấn đề, mục tiêu và yêu cầu của bạn đối với mentor..."
        />
        {errors.description && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.description.message}</p>}
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50/80 overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold text-slate-700 hover:bg-slate-100/50"
        >
          <span>Tùy chọn chi tiết (Kỹ năng, Brief, Mục tiêu)</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
        
        {showAdvanced && (
          <div className="p-5 pt-2 grid gap-4 border-t border-slate-100 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold text-slate-700">Kỹ năng/chủ đề cần mentor nắm</label>
              <input
                {...register('requiredSkillsInput')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="VD: React, Spring Boot, system design..."
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700">Trình độ hiện tại của bạn</label>
              <input
                {...register('currentLevel')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="VD: Đã biết React cơ bản..."
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700">Trình độ mentor mong muốn</label>
              <select
                {...register('experienceLevel')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Chưa chắc, để mentor đề xuất</option>
                <option value="INTERMEDIATE">Mentor trung cấp trở lên</option>
                <option value="SENIOR">Mentor senior</option>
                <option value="EXPERT">Chuyên gia trong lĩnh vực</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold text-slate-700">Mục tiêu sau khi làm việc</label>
              <textarea
                {...register('learningGoals')}
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="VD: Tự tin deploy MVP..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold text-slate-700">Tiêu chí thành công</label>
              <textarea
                {...register('successCriteria')}
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="VD: Mentor review xong 5 PRs..."
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700">Kênh trao đổi ưu tiên</label>
              <select
                {...register('communicationPreference')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Linh hoạt, để mentor đề xuất</option>
                <option value="CHAT">Chat</option>
                <option value="VIDEO_CALL">Video call</option>
                <option value="CODE_REVIEW">Review code/tài liệu</option>
                <option value="MIXED">Kết hợp nhiều hình thức</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700">Lịch mong muốn</label>
              <input
                {...register('availabilityExpectation')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="VD: Buổi tối T2-T4 hoặc cuối tuần"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <label className="block text-sm font-bold text-slate-800">Ngân sách dự kiến</label>
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setValue('budgetType', 'FIXED')}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${budgetType === 'FIXED' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Cố định
            </button>
            <button
              type="button"
              onClick={() => setValue('budgetType', 'HOURLY')}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${budgetType === 'HOURLY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Theo giờ
            </button>
          </div>
        </div>

        {budgetType === 'FIXED' ? (
          <div className="relative max-w-sm">
            <input
              type="number"
              {...register('budgetAmount')}
              className="w-full rounded-xl border border-slate-200 bg-white pl-4 pr-24 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition"
              placeholder="Tổng ngân sách tối đa"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
              MX COIN
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <input
                type="number"
                {...register('hourlyRate')}
                className="w-full rounded-xl border border-slate-200 bg-white pl-4 pr-24 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition"
                placeholder="Mức giá / giờ"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                MXC/h
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                {...register('estimatedHours')}
                className="w-full rounded-xl border border-slate-200 bg-white pl-4 pr-16 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition"
                placeholder="Số giờ dự kiến"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                Giờ
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-[#f4f8ff] px-4 py-3 text-[13px] leading-relaxed text-blue-900 border border-[#e5eeff]">
        <Info className="mt-[3px] h-4 w-4 shrink-0 text-blue-500" />
        <p>Khoản thanh toán sẽ được hệ thống <strong>tạm giữ (Escrow)</strong> để đảm bảo an toàn cho cả hai bên cho đến khi công việc hoàn thành.</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-800">Đính kèm file (tối đa 25MB)</label>
        
        {attachmentUrl ? (
          <div className="overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/50">
            {attachmentUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
              <div className="relative h-48 w-full bg-slate-100">
                <img src={attachmentUrl} alt="Preview" className="h-full w-full object-contain" />
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-500 shadow-sm border border-indigo-100/50">
                  <FileIcon className="h-5 w-5" />
                </div>
                <span className="truncate text-sm font-bold text-indigo-950">{fileName}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachmentUrl('')
                  setFileName('')
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-400 hover:bg-white hover:text-rose-500 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-[#fafafa] px-6 py-8 transition hover:border-blue-400 hover:bg-blue-50/30">
            <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#94a3b8] group-hover:scale-110 group-hover:text-blue-500 transition-all">
                <Upload className="h-6 w-6" />
              </div>
            )}
            <p className="mt-4 text-[13px] font-medium text-slate-500">
              {uploading ? 'Đang tải file lên...' : (
                <>Kéo và thả file tại đây hoặc <span className="text-blue-600 font-semibold underline decoration-blue-200 underline-offset-2">Duyệt file</span></>
              )}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-400 uppercase tracking-wide">PDF, DOCX, JPG, PNG HOẶC ZIP</p>
          </label>
        )}
      </div>

      <label className="flex items-start gap-3 cursor-pointer group py-2">
        <div className="relative flex h-5 w-5 items-center justify-center shrink-0">
          <input
            type="checkbox"
            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 bg-white transition checked:border-[#3b82f6] checked:bg-[#3b82f6] hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
          />
          <svg className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-[13px] text-slate-600 leading-relaxed">
          Tôi đồng ý với các <a href="#" className="font-semibold text-blue-600 hover:text-blue-700">Điều khoản dịch vụ</a> và <a href="#" className="font-semibold text-blue-600 hover:text-blue-700">Chính sách bảo mật</a> của Mentor X.
        </span>
      </label>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 border border-rose-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-slate-100 pt-6">
        <button
          type="button"
          disabled={loading || uploading}
          onClick={handleSaveDraft}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-[15px] font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow focus:outline-none focus:ring-4 focus:ring-slate-500/10 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:shadow-none"
        >
          {loading && submitStatus === 'DRAFT' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-slate-400" />}
          {isEditing ? 'Cập nhật nháp' : 'Lưu nháp'}
        </button>

        <button
          type="submit"
          disabled={loading || uploading}
          onClick={() => setSubmitStatus('OPEN')}
          className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-[#3b82f6] px-8 py-3.5 text-[15px] font-bold text-white shadow-sm transition-all hover:bg-blue-600 hover:shadow focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:shadow-none"
        >
          {loading && submitStatus === 'OPEN' ? <Loader2 className="h-5 w-5 animate-spin" /> : isEditing ? 'Cập nhật và đăng' : 'Đăng yêu cầu'}
          {(!loading || submitStatus !== 'OPEN') && <Send className="h-[18px] w-[18px] -mr-1" />}
        </button>
      </div>
    </form>
  )
}
