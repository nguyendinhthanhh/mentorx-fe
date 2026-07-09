import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  Clock,
  FileIcon,
  Info,
  Loader2,
  Save,
  Send,
  Upload,
  X,
} from 'lucide-react'
import { categoryApi } from '@/api/categoryApi'
import { fileApi } from '@/api/fileApi'
import { jobApi } from '@/api/jobApi'
import { BudgetType, CategoryResponse, FileResponse, JobResponse, JobStatus, JobType } from '@/types'
import { formatTimeRemaining } from '@/utils/formatters'

const OTHER_CATEGORY_VALUE = -1
const EXPERIENCE_CUSTOM = 'CUSTOM'
const COMMUNICATION_CUSTOM = 'CUSTOM'

const experienceOptions = [
  { value: '', label: 'Open to suggestion' },
  { value: 'INTERMEDIATE', label: 'Intermediate mentor or above' },
  { value: 'SENIOR', label: 'Senior mentor' },
  { value: 'EXPERT', label: 'Domain expert' },
  { value: EXPERIENCE_CUSTOM, label: 'Other' },
]

const communicationOptions = [
  { value: '', label: 'Flexible' },
  { value: 'CHAT', label: 'Chat' },
  { value: 'VIDEO_CALL', label: 'Video call' },
  { value: 'CODE_REVIEW', label: 'Code review' },
  { value: 'MIXED', label: 'Mixed' },
  { value: COMMUNICATION_CUSTOM, label: 'Other' },
]

const optionalNumber = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.number().min(0).optional()
)

const optionalCategory = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}, z.number().optional())

const optionalText = (max = 1200) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) => {
      const trimmed = value?.trim()
      return trimmed ? trimmed : undefined
    })

const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined

  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 19)
}

const normalizeDateTimeLocalValue = (value?: string | null) => {
  if (!value) return undefined
  return value.length === 16 ? `${value}:00` : value
}

const formatDeadlinePreview = (value?: string | null) => {
  if (!value) return 'dd/mm/yyyy --:--:-- --'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'dd/mm/yyyy --:--:-- --'

  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date).replace(', ', ' ')
}

const jobSchema = z
  .object({
    title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200),
    description: z.string().trim(),
    categoryId: optionalCategory,
    customCategoryName: optionalText(120),
    deadlineDate: z.string().optional(),

    budgetType: z.enum(['FIXED', 'HOURLY']).default('FIXED'),
    budgetAmount: optionalNumber,
    hourlyRate: optionalNumber,
    estimatedHours: optionalNumber,

    requiredSkillsInput: optionalText(500),
    currentLevel: optionalText(120),
    learningGoals: optionalText(1200),
    successCriteria: optionalText(1200),
    jobType: z.enum(['LONG_TERM_MENTORING', 'FREELANCE_PROJECT', 'QUICK_FIX']).optional(),

    experiencePreset: optionalText(80),
    customExperienceLevel: optionalText(80),

    communicationPreset: optionalText(120),
    customCommunicationPreference: optionalText(120),

    availabilityExpectation: optionalText(255),
    availabilityStartTime: optionalText(20),
    availabilityEndTime: optionalText(20),
  })
  .superRefine((data, ctx) => {
    if (data.description) {
      const wordCount = data.description.trim().split(/\s+/).filter(Boolean).length
      if (wordCount < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Description needs at least 10 words. Current: ${wordCount}.`,
          path: ['description'],
        })
      }
    }

    if (!data.categoryId && !data.customCategoryName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please choose a category or enter your own category.',
        path: ['categoryId'],
      })
    }

    if (!data.requiredSkillsInput || data.requiredSkillsInput.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please add at least one required skill or topic.',
        path: ['requiredSkillsInput'],
      })
    }

    if (data.categoryId === OTHER_CATEGORY_VALUE && !data.customCategoryName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a custom category.',
        path: ['customCategoryName'],
      })
    }

    if (data.budgetType === 'FIXED' && !data.budgetAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a fixed budget.',
        path: ['budgetAmount'],
      })
    }

    if (data.budgetType === 'HOURLY') {
      if (!data.hourlyRate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter an hourly rate.',
          path: ['hourlyRate'],
        })
      }
      if (!data.estimatedHours) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter estimated hours.',
          path: ['estimatedHours'],
        })
      }
    }

    if (!data.deadlineDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please provide an end date and time.',
        path: ['deadlineDate'],
      })
    }

    if (data.experiencePreset === EXPERIENCE_CUSTOM && !data.customExperienceLevel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter the mentor level you want.',
        path: ['customExperienceLevel'],
      })
    }

    if (data.communicationPreset === COMMUNICATION_CUSTOM && !data.customCommunicationPreference) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a communication preference.',
        path: ['customCommunicationPreference'],
      })
    }

    if ((data.availabilityStartTime && !data.availabilityEndTime) || (!data.availabilityStartTime && data.availabilityEndTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please provide both start and end time.',
        path: ['availabilityEndTime'],
      })
    }
  })

type JobFormData = z.infer<typeof jobSchema>

type JobCreateFormProps = {
  clientId: string
  initialJob?: JobResponse
  mode?: 'create' | 'edit'
}

type UploadedAttachment = FileResponse

export default function JobCreateForm({ clientId, initialJob, mode = 'create' }: JobCreateFormProps) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
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
      experiencePreset: '',
      communicationPreset: '',
    },
  })

  const isEditing = mode === 'edit' && Boolean(initialJob)
  const budgetType = watch('budgetType')
  const selectedCategoryId = Number(watch('categoryId') ?? '')
  const experiencePreset = watch('experiencePreset')
  const communicationPreset = watch('communicationPreset')
  const selectedDeadline = watch('deadlineDate')
  const [deadlineTick, setDeadlineTick] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDeadlineTick(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAllActive()
        setCategories(data)
      } catch (err) {
        console.error('Failed to fetch categories', err)
      }
    }
    void fetchCategories()
  }, [])

  useEffect(() => {
    if (!initialJob) return

    const initialExperiencePreset = isKnownExperienceValue(initialJob.experienceLevel) ? initialJob.experienceLevel : initialJob.experienceLevel ? EXPERIENCE_CUSTOM : ''
    const initialCommunicationPreset = isKnownCommunicationValue(initialJob.communicationPreference)
      ? initialJob.communicationPreference
      : initialJob.communicationPreference
        ? COMMUNICATION_CUSTOM
        : ''

    reset({
      title: initialJob.title || '',
      description: initialJob.description || '',
      categoryId: initialJob.categoryId ?? (initialJob.customCategoryName ? OTHER_CATEGORY_VALUE : undefined),
      customCategoryName: initialJob.customCategoryName,
      jobType: initialJob.jobType || JobType.FREELANCE_PROJECT,
      budgetType: initialJob.budgetType || BudgetType.FIXED,
      budgetAmount: initialJob.budgetMinMxc,
      hourlyRate: initialJob.hourlyRateMxc,
      estimatedHours: initialJob.estimatedHours,
      requiredSkillsInput: initialJob.requiredSkills?.join(', ') || '',
      currentLevel: initialJob.currentLevel,
      learningGoals: initialJob.learningGoals,
      successCriteria: initialJob.successCriteria,
      experiencePreset: initialExperiencePreset,
      customExperienceLevel: initialExperiencePreset === EXPERIENCE_CUSTOM ? initialJob.experienceLevel : undefined,
      communicationPreset: initialCommunicationPreset,
      customCommunicationPreference: initialCommunicationPreset === COMMUNICATION_CUSTOM ? initialJob.communicationPreference : undefined,
      availabilityExpectation: initialJob.availabilityExpectation,
      availabilityStartTime: initialJob.availabilityStartTime,
      availabilityEndTime: initialJob.availabilityEndTime,
      deadlineDate: toDateTimeLocalValue(initialJob.deadlineAt),
    })

    const initialAttachments = [...(initialJob.attachments || []), ...(initialJob.attachmentUrl ? [initialJob.attachmentUrl] : [])]
      .filter((value, index, self) => Boolean(value) && self.indexOf(value) === index)
      .map((fileUrl, index) => ({
        fileName: decodeURIComponent(fileUrl.split('/').pop() || `Attachment ${index + 1}`),
        fileUrl,
        fileType: 'FILE',
        size: 0,
      }))

    setAttachments(initialAttachments)
    setSubmitStatus(initialJob.status === JobStatus.DRAFT ? 'DRAFT' : 'OPEN')
  }, [initialJob, reset])

  const attachmentSummary = useMemo(() => {
    if (attachments.length === 0) return 'No files uploaded yet.'
    return `${attachments.length} file(s) ready to send`
  }, [attachments])

  const buildExperienceLevel = (data: JobFormData) => {
    if (data.experiencePreset === EXPERIENCE_CUSTOM) return data.customExperienceLevel
    return data.experiencePreset || undefined
  }

  const buildCommunicationPreference = (data: JobFormData) => {
    if (data.communicationPreset === COMMUNICATION_CUSTOM) return data.customCommunicationPreference
    return data.communicationPreset || undefined
  }

  const selectedDeadlinePreview = useMemo(() => formatDeadlinePreview(selectedDeadline), [selectedDeadline, deadlineTick])
  const selectedDeadlineRemaining = useMemo(
    () => (selectedDeadline ? formatTimeRemaining(selectedDeadline, 'vi') : 'Chọn deadline để xem thời gian còn lại.'),
    [selectedDeadline, deadlineTick]
  )

  const buildJobPayload = (data: JobFormData, status: JobStatus) => {
    const safeCategoryId =
      data.categoryId && data.categoryId !== OTHER_CATEGORY_VALUE ? data.categoryId : undefined
    const normalizedAttachments = attachments.map((item) => item.fileUrl)

    return {
      title: data.title,
      description: data.description || '',
      categoryId: safeCategoryId,
      customCategoryName: data.categoryId === OTHER_CATEGORY_VALUE || !safeCategoryId ? data.customCategoryName : undefined,
      jobType: (data.jobType || JobType.FREELANCE_PROJECT) as JobType,
      requiredSkills: data.requiredSkillsInput
        ? data.requiredSkillsInput
            .split(/[,;\n]/)
            .map((skill) => skill.trim())
            .filter(Boolean)
        : [],
      experienceLevel: buildExperienceLevel(data),
      currentLevel: data.currentLevel,
      learningGoals: data.learningGoals,
      successCriteria: data.successCriteria,
      availabilityExpectation: data.availabilityExpectation,
      availabilityStartTime: data.availabilityStartTime,
      availabilityEndTime: data.availabilityEndTime,
      communicationPreference: buildCommunicationPreference(data),
      attachmentUrl: normalizedAttachments[0],
      attachments: normalizedAttachments.length > 0 ? normalizedAttachments : undefined,
      budgetType: data.budgetType as BudgetType,
      budgetMinMxc: data.budgetType === 'FIXED' ? data.budgetAmount : undefined,
      budgetMaxMxc: data.budgetType === 'FIXED' ? data.budgetAmount : undefined,
      hourlyRateMxc: data.budgetType === 'HOURLY' ? data.hourlyRate : undefined,
      estimatedHours: data.budgetType === 'HOURLY' ? data.estimatedHours : undefined,
      deadlineAt: normalizeDateTimeLocalValue(data.deadlineDate),
      status,
    }
  }

  const handleFilesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    try {
      setUploading(true)
      setError('')

      const uploaded = await Promise.all(files.map((file) => fileApi.upload(file)))
      setAttachments((current) => {
        const merged = [...current, ...uploaded]
        return merged.filter((item, index, self) => self.findIndex((candidate) => candidate.fileUrl === item.fileUrl) === index)
      })
    } catch {
      setError('File upload failed. Please try again.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleRemoveAttachment = (fileUrl: string) => {
    setAttachments((current) => current.filter((item) => item.fileUrl !== fileUrl))
  }

  const handleSaveDraft = async () => {
    const data = getValues()

    if (!data.title || data.title.trim().length < 5) {
      setError('Please enter at least 5 characters for the title before saving a draft.')
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
      setError(err.response?.data?.message || 'Could not save draft.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: JobFormData) => {
    if (!agreeTerms && submitStatus !== 'DRAFT') {
      setError('Please agree to the terms before posting.')
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
      setError(err.response?.data?.message || 'Could not create job.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 rounded-[24px] border border-white/60 bg-white/70 backdrop-blur-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10 relative overflow-hidden">
      {/* Decorative gradient corner inside form */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-[#4f46e5]/10 to-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
      <div>
        <label className="mb-2 block text-sm font-bold text-[#1b2252]">Job title</label>
        <input
          {...register('title')}
          className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300 transition"
          placeholder="Example: Need a React Native mentor to review booking app architecture"
        />
        {errors.title && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.title.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-[#1b2252]">Category</label>
          <div className="relative">
            <select
              {...register('categoryId')}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300 transition"
            >
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
              <option value={OTHER_CATEGORY_VALUE}>Other</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          {errors.categoryId && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.categoryId.message}</p>}
          {selectedCategoryId === OTHER_CATEGORY_VALUE && (
            <div className="mt-3">
              <input
                {...register('customCategoryName')}
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300 transition"
                placeholder="Enter your own category"
              />
              {errors.customCategoryName && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.customCategoryName.message}</p>}
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-[#1b2252]">End date and time</label>
          <input
            type="datetime-local"
            step={1}
            {...register('deadlineDate')}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-900 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300 transition"
          />
          <div className="mt-2 space-y-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-[#1b2252]/80">
              Selected: <span className="font-bold text-slate-900">{selectedDeadlinePreview}</span>
            </p>
            <p className={`text-xs font-semibold ${selectedDeadline && new Date(selectedDeadline).getTime() > Date.now() ? 'text-emerald-700' : 'text-slate-500'}`}>
              {selectedDeadlineRemaining}
            </p>
          </div>
          {errors.deadlineDate && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.deadlineDate.message}</p>}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-[#1b2252]">Description</label>
        <textarea
          {...register('description')}
          rows={5}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300 transition"
          placeholder="Describe the problem, goal, scope, and what kind of mentor support you need."
        />
        {errors.description && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.description.message}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-[#1b2252]">Required skills or topics</label>
        <input
          {...register('requiredSkillsInput')}
          className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300 transition"
          placeholder="React Native, Expo, performance optimization..."
        />
        {errors.requiredSkillsInput && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.requiredSkillsInput.message}</p>}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80 transition-all">
        <button
          type="button"
          onClick={() => setShowAdvanced((value) => !value)}
          className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold text-[#1b2252]/80 hover:bg-slate-100/50"
        >
          <span>Advanced details</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {showAdvanced && (
          <div className="grid gap-4 border-t border-slate-100 p-5 pt-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold text-[#1b2252]/80">Your current level</label>
              <input
                {...register('currentLevel')}
                className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-900 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300"
                placeholder="Example: I can build screens but need architecture help"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[#1b2252]/80">Preferred mentor level</label>
              <select
                {...register('experiencePreset')}
                className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-900 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300"
              >
                {experienceOptions.map((option) => (
                  <option key={option.value || 'default'} value={option.value}>{option.label}</option>
                ))}
              </select>
              {experiencePreset === EXPERIENCE_CUSTOM && (
                <input
                  {...register('customExperienceLevel')}
                  className="mt-3 w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-900 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300"
                  placeholder="Enter your own preferred mentor level"
                />
              )}
              {errors.customExperienceLevel && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.customExperienceLevel.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold text-[#1b2252]/80">Learning goals</label>
              <textarea
                {...register('learningGoals')}
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300"
                placeholder="What should change after working with the mentor?"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold text-[#1b2252]/80">Success criteria</label>
              <textarea
                {...register('successCriteria')}
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300"
                placeholder="How will you know this job is done well?"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[#1b2252]/80">Preferred communication</label>
              <select
                {...register('communicationPreset')}
                className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-900 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300"
              >
                {communicationOptions.map((option) => (
                  <option key={option.value || 'default'} value={option.value}>{option.label}</option>
                ))}
              </select>
              {communicationPreset === COMMUNICATION_CUSTOM && (
                <input
                  {...register('customCommunicationPreference')}
                  className="mt-3 w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-900 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300"
                  placeholder="Enter your own communication preference"
                />
              )}
              {errors.customCommunicationPreference && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.customCommunicationPreference.message}</p>}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[#1b2252]/80">Availability note</label>
              <input
                {...register('availabilityExpectation')}
                className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-900 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300"
                placeholder="Example: Weeknights or weekends"
              />
            </div>

          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <label className="block text-sm font-bold text-[#1b2252]">Budget</label>
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setValue('budgetType', 'FIXED')}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${budgetType === 'FIXED' ? 'bg-white/80 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-[#1b2252]/80'}`}
            >
              Fixed
            </button>
            <button
              type="button"
              onClick={() => setValue('budgetType', 'HOURLY')}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${budgetType === 'HOURLY' ? 'bg-white/80 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-[#1b2252]/80'}`}
            >
              Hourly
            </button>
          </div>
        </div>

        {budgetType === 'FIXED' ? (
          <div className="relative max-w-sm">
            <input
              type="number"
              {...register('budgetAmount')}
              className="w-full rounded-xl border border-slate-200 bg-white/80 pl-4 pr-24 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300 transition"
              placeholder="Total budget"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#1b2252]/80">
              MXC
            </div>
            {errors.budgetAmount && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.budgetAmount.message}</p>}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <input
                type="number"
                {...register('hourlyRate')}
                className="w-full rounded-xl border border-slate-200 bg-white/80 pl-4 pr-24 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300 transition"
                placeholder="Hourly rate"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#1b2252]/80">
                MXC/h
              </div>
              {errors.hourlyRate && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.hourlyRate.message}</p>}
            </div>

            <div className="relative">
              <input
                type="number"
                {...register('estimatedHours')}
                className="w-full rounded-xl border border-slate-200 bg-white/80 pl-4 pr-16 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/15 shadow-sm hover:border-slate-300 transition"
                placeholder="Estimated hours"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#1b2252]/80">
                hrs
              </div>
              {errors.estimatedHours && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.estimatedHours.message}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-[#e5eeff] bg-[#f4f8ff] px-4 py-3 text-[13px] leading-relaxed text-blue-900">
        <Info className="mt-[3px] h-4 w-4 shrink-0 text-[#4f46e5]" />
        <p>
          Payment stays protected in escrow until the work is completed and accepted.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-[#1b2252]">Attachments (multiple files supported)</label>
        <p className="mb-3 text-xs font-medium text-slate-500">{attachmentSummary}</p>

        <label className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-[#fafafa] px-6 py-8 transition hover:border-[#4f46e5]/50 hover:bg-[#4f46e5]/5">
          <input type="file" multiple onChange={handleFilesUpload} className="hidden" disabled={uploading} />
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-[#4f46e5]" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#94a3b8] transition-all group-hover:scale-110 group-hover:text-[#4f46e5]">
              <Upload className="h-6 w-6" />
            </div>
          )}
          <p className="mt-4 text-[13px] font-medium text-slate-500">
            {uploading ? 'Uploading files...' : 'Drop files here or browse from your device'}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">PDF, DOCX, JPG, PNG, or ZIP</p>
        </label>

        {attachments.length > 0 && (
          <div className="mt-4 space-y-3">
            {attachments.map((attachment) => (
              <div key={attachment.fileUrl} className="flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-indigo-100/50 bg-white/80 text-indigo-500 shadow-sm">
                    <FileIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-indigo-950">{attachment.fileName}</p>
                    <p className="mt-1 text-xs font-medium text-indigo-600/80">
                      {attachment.fileType} {attachment.size ? `- ${Math.max(1, Math.round(attachment.size / 1024))} KB` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(attachment.fileUrl)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-400 transition hover:bg-white/80 hover:text-rose-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <label className="group flex cursor-pointer items-start gap-3 py-2">
        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 bg-white/80 transition checked:border-[#4f46e5] checked:bg-[#4f46e5] hover:border-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
            checked={agreeTerms}
            onChange={(event) => setAgreeTerms(event.target.checked)}
          />
          <svg className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-[13px] leading-relaxed text-slate-600">
          I agree with the Terms of Service and Privacy Policy.
        </span>
      </label>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={loading || uploading}
          onClick={handleSaveDraft}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-6 py-3.5 text-[15px] font-bold text-[#1b2252] shadow-sm transition-all hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-slate-500/10 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading && submitStatus === 'DRAFT' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-slate-400" />}
          {isEditing ? 'Update draft' : 'Save draft'}
        </button>

        <button
          type="submit"
          disabled={loading || uploading}
          onClick={() => setSubmitStatus('OPEN')}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3b82f6] px-8 py-3.5 text-[15px] font-bold text-white shadow-sm transition-all hover:bg-blue-600 hover:shadow focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
        >
          {loading && submitStatus === 'OPEN' ? <Loader2 className="h-5 w-5 animate-spin" /> : isEditing ? 'Update and publish' : 'Post job'}
          {(!loading || submitStatus !== 'OPEN') && <Send className="h-[18px] w-[18px] -mr-1" />}
        </button>
      </div>
    </form>
  )
}

function isKnownExperienceValue(value?: string) {
  return experienceOptions.some((option) => option.value && option.value === value)
}

function isKnownCommunicationValue(value?: string) {
  return communicationOptions.some((option) => option.value && option.value === value)
}
