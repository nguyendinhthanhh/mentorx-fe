import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  FileText,
  Globe,
  HelpCircle,
  Loader2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  User,
  Video,
} from 'lucide-react'

import { FILE_UPLOAD_DIRS, fileApi } from '@/api/fileApi'
import { mentorApi } from '@/api/mentorApi'
import { userApi } from '@/api/userApi'
import { useAuthStore } from '@/store/authStore'
import { MentorProfileRequest } from '@/types'
import { deriveLegacyProofFields, getMentorProofLinks, normalizeProofLinks } from '@/utils/proofLinks'

const isDevEnvironment = import.meta.env.DEV

const DOMAIN_OPTIONS = [
  { value: 'Software Engineering', label: 'Kỹ thuật phần mềm' },
  { value: 'Data Science & AI', label: 'Khoa học dữ liệu & AI' },
  { value: 'Product Management', label: 'Quản lý sản phẩm' },
  { value: 'Design', label: 'Thiết kế (Design)' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Business & Finance', label: 'Kinh doanh & Tài chính' },
  { value: 'Career Coaching', label: 'Huấn luyện sự nghiệp (Career Coaching)' },
  { value: 'Education', label: 'Giáo dục' },
  { value: 'Sales', label: 'Bán hàng (Sales)' },
  { value: 'Human Resources', label: 'Nhân sự (HR)' },
  { value: 'Operations', label: 'Vận hành (Operations)' },
  { value: 'Healthcare', label: 'Chăm sóc sức khỏe' },
  { value: 'Other', label: 'Khác' },
] as const

const LOCATION_OPTIONS = [
  { value: 'Ho Chi Minh City, GMT+7', label: 'Hồ Chí Minh (GMT+7)' },
  { value: 'Ha Noi, GMT+7', label: 'Hà Nội (GMT+7)' },
  { value: 'Da Nang, GMT+7', label: 'Đà Nẵng (GMT+7)' },
  { value: 'Bangkok, GMT+7', label: 'Băng Cốc (GMT+7)' },
  { value: 'Singapore, GMT+8', label: 'Singapore (GMT+8)' },
  { value: 'Tokyo, GMT+9', label: 'Tokyo (GMT+9)' },
  { value: 'Remote / Flexible', label: 'Làm việc từ xa / Linh hoạt' },
  { value: 'Other', label: 'Khác' },
] as const

const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'Tiếng Anh' },
  { value: 'Vietnamese', label: 'Tiếng Việt' },
  { value: 'Japanese', label: 'Tiếng Nhật' },
  { value: 'English, Vietnamese', label: 'Anh, Việt' },
  { value: 'English, Japanese', label: 'Anh, Nhật' },
  { value: 'Vietnamese, Japanese', label: 'Việt, Nhật' },
  { value: 'English, Vietnamese, Japanese', label: 'Anh, Việt, Nhật' },
  { value: 'Other', label: 'Khác' },
] as const

const SKILL_SUGGESTIONS = [
  'Frontend',
  'Backend',
  'Mobile',
  'Data Analysis',
  'Machine Learning',
  'UI/UX Design',
  'Product Strategy',
  'Marketing',
  'Career Coaching',
  'Public Speaking',
]

const EXPERIENCE_OPTIONS = [
  { value: '0.5', label: 'Dưới 1 năm' },
  { value: '1', label: '1 - 3 năm' },
  { value: '3', label: '3 - 5 năm' },
  { value: '5', label: '5 - 8 năm' },
  { value: '8', label: '8 - 12 năm' },
  { value: '12', label: '12+ năm' },
] as const

const AVAILABILITY_OPTIONS = [
  { value: 'Flexible', label: 'Linh hoạt' },
  { value: 'Weekdays', label: 'Ngày thường' },
  { value: 'Evenings', label: 'Buổi tối' },
  { value: 'Weekends', label: 'Cuối tuần' },
] as const

const RATE_SUGGESTIONS = [150, 250, 500, 800] as const

const PROOF_PRESETS = [
  { label: 'LinkedIn', icon: Briefcase },
  { label: 'GitHub', icon: Globe },
  { label: 'Portfolio', icon: Sparkles },
  { label: 'Behance', icon: Sparkles },
  { label: 'Kaggle', icon: GraduationCap },
  { label: 'Medium', icon: FileText },
  { label: 'Intro Video', icon: Video },
]

interface Props {
  userId: string
  userEmail: string
  isEmailVerified?: boolean
  initialData?: MentorProfileRequest
  isEdit: boolean
  isLocked?: boolean
  lockedMessage?: string
  headingTitle?: string
  headingDescription?: string
  submitButtonLabel?: string
  successTitle?: string
  successDescription?: string
  successRedirectTo?: string
  onSaved?: () => void | Promise<void>
}

const inputClass =
  'w-full rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-white backdrop-blur-md'

const textareaClass = `${inputClass} min-h-[100px] resize-y`
const sectionClass = 'rounded-[2rem] border border-white/60 bg-white/40 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-2xl sm:p-7'

function isUrlLike(value?: string) {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('www.')
}

function parseUrl(value?: string) {
  if (!value?.trim()) return null
  try {
    return new URL(value.trim())
  } catch {
    return null
  }
}

function countWords(value?: string) {
  return (value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function getResolvedOptionValue(option?: string, custom?: string) {
  if (option === 'Other') return custom?.trim() || ''
  return option?.trim() || ''
}

const schema = z
  .object({
    headline: z
      .string()
      .trim()
      .min(20, 'Vui lòng nhập ít nhất 20 ký tự.')
      .max(120, 'Tiêu đề không được vượt quá 120 ký tự.'),
    currentTitle: z.string().optional(),
    currentCompany: z.string().optional(),
    primaryDomain: z.string().min(2, 'Vui lòng chọn lĩnh vực chuyên môn chính.'),
    primaryDomainCustom: z.string().optional(),
    skills: z
      .array(z.string().trim().min(1).max(60))
      .min(3, 'Vui lòng thêm ít nhất 3 kỹ năng.')
      .max(15, 'Bạn chỉ có thể thêm tối đa 15 kỹ năng.'),
    professionalBio: z.string().trim(),
    helpDescription: z
      .string()
      .trim()
      .min(40, 'Vui lòng thêm tóm tắt về những gì học viên có thể kỳ vọng.')
      .max(500, 'Nội dung này không được vượt quá 500 ký tự.'),
    yearsOfExperience: z.coerce.number().positive('Vui lòng chọn số năm kinh nghiệm.'),
    hourlyRateMxc: z.coerce.number().positive('Mức phí theo giờ phải lớn hơn 0.').optional(),
    availability: z.string().min(1, 'Vui lòng chọn khung giờ trống.'),
    locationOption: z.string().min(1, 'Vui lòng chọn múi giờ.'),
    locationCustom: z.string().optional(),
    languagesOption: z.string().min(1, 'Vui lòng chọn ít nhất một ngôn ngữ.'),
    languagesCustom: z.string().optional(),
    proofLinks: z.array(
      z.object({
        label: z.string().optional(),
        url: z.string().optional(),
      })
    ).default([]),
    avatarUrl: z.string().optional(),
    coverUrl: z.string().optional(),
    cvUrl: z.string().optional(),
    certificateUrl: z.string().optional(),
    mentorAgreementAccepted: z.boolean().refine(Boolean, 'Vui lòng xác nhận thông tin là chính xác.'),
    disputePolicyAccepted: z.boolean().refine(Boolean, 'Vui lòng đồng ý với chính sách kiểm duyệt.'),
  })
  .superRefine((value, context) => {
    if (value.primaryDomain === 'Other' && (!value.primaryDomainCustom || value.primaryDomainCustom.trim().length < 2)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng nhập lĩnh vực chuyên môn của bạn.',
        path: ['primaryDomainCustom'],
      })
    }

    if (value.locationOption === 'Other' && (!value.locationCustom || value.locationCustom.trim().length < 2)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng nhập múi giờ của bạn.',
        path: ['locationCustom'],
      })
    }

    if (value.languagesOption === 'Other' && (!value.languagesCustom || value.languagesCustom.trim().length < 2)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng nhập ngôn ngữ của bạn.',
        path: ['languagesCustom'],
      })
    }

    if (isUrlLike(value.headline)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tiêu đề phải là văn bản thông thường, không được chứa URL.',
        path: ['headline'],
      })
    }

    if (isUrlLike(value.currentTitle)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Chức danh phải là văn bản thông thường, không được chứa URL.',
        path: ['currentTitle'],
      })
    }

    if (isUrlLike(value.currentCompany)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tên công ty phải là văn bản thông thường, không được chứa URL.',
        path: ['currentCompany'],
      })
    }

    const bioWordCount = countWords(value.professionalBio)
    if (bioWordCount < 150 || bioWordCount > 500) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Giới thiệu bản thân nên từ 150 đến 500 từ.',
        path: ['professionalBio'],
      })
    }

    const normalizedProofLinks = normalizeProofLinks(value.proofLinks)
    for (let index = 0; index < value.proofLinks.length; index += 1) {
      const item = value.proofLinks[index]
      const label = item.label?.trim() || ''
      const url = item.url?.trim() || ''

      if (!label && !url) continue

      if (!label) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng nhập tên nhãn.',
          path: ['proofLinks', index, 'label'],
        })
      }

      if (!url) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng nhập URL.',
          path: ['proofLinks', index, 'url'],
        })
        continue
      }

      const parsed = parseUrl(url)
      if (!parsed) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng nhập URL hợp lệ.',
          path: ['proofLinks', index, 'url'],
        })
      } else if (!isDevEnvironment && ['localhost', '127.0.0.1'].includes(parsed.hostname.toLowerCase())) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Localhost URL không được phép.',
          path: ['proofLinks', index, 'url'],
        })
      }
    }

    const hasProof = normalizedProofLinks.length > 0 || Boolean(value.cvUrl?.trim() || value.certificateUrl?.trim())
    if (!hasProof) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng thêm ít nhất một liên kết năng lực, CV, hoặc chứng chỉ.',
        path: ['proofLinks'],
      })
    }
  })

type FormValues = z.infer<typeof schema>
type UploadField = 'cvUrl' | 'certificateUrl'

export default function MentorProfileForm({
  userId,
  initialData,
  isEdit,
  isLocked = false,
  lockedMessage,
  submitButtonLabel,
  successTitle,
  successDescription,
  successRedirectTo = '/become-a-mentor',
  onSaved,
}: Props) {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuthStore()
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')

  const initialDomain = initialData?.primaryDomain || ''
  const initialLocation = initialData?.location || ''
  const initialLanguagesText = initialData?.languages?.join(', ') || ''
  const resolvedDomain = DOMAIN_OPTIONS.some(o => o.value === initialDomain) ? initialDomain : (initialDomain ? 'Other' : '')
  const resolvedLocation = LOCATION_OPTIONS.some(o => o.value === initialLocation) ? initialLocation : (initialLocation ? 'Other' : '')
  const resolvedLanguages = LANGUAGE_OPTIONS.some(o => o.value === initialLanguagesText)
    ? initialLanguagesText
    : (initialLanguagesText ? 'Other' : '')

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      headline: initialData?.headline || '',
      currentTitle: initialData?.currentTitle || '',
      currentCompany: initialData?.currentCompany || '',
      primaryDomain: resolvedDomain,
      primaryDomainCustom: resolvedDomain === 'Other' ? initialDomain : '',
      skills: initialData?.skills || [],
      professionalBio: initialData?.professionalBio || '',
      helpDescription: initialData?.helpDescription || '',
      yearsOfExperience: initialData?.yearsOfExperience || undefined,
      hourlyRateMxc: initialData?.hourlyRateMxc || undefined,
      availability: initialData?.availability || 'Flexible',
      locationOption: resolvedLocation,
      locationCustom: resolvedLocation === 'Other' ? initialLocation : '',
      languagesOption: resolvedLanguages,
      languagesCustom: resolvedLanguages === 'Other' ? initialLanguagesText : '',
      proofLinks: getMentorProofLinks(initialData).map((item) => ({ label: item.label, url: item.url })),
      avatarUrl: user?.avatarUrl || '',
      coverUrl: initialData?.coverUrl || '',
      cvUrl: initialData?.cvUrl || '',
      certificateUrl: initialData?.certificateUrl || '',
      mentorAgreementAccepted: Boolean(initialData?.mentorAgreementAccepted),
      disputePolicyAccepted: Boolean(initialData?.disputePolicyAccepted),
    },
  })

  const { fields: proofLinkFields, append: appendProofLink, remove: removeProofLink } = useFieldArray({
    control,
    name: 'proofLinks',
  })

  const values = watch()
  const bioWordCount = countWords(values.professionalBio)
  const maxUploadBytes = 10 * 1024 * 1024
  const allowedMimeTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ])
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp']
  const imageUploadDirectories = {
    avatarUrl: FILE_UPLOAD_DIRS.PUBLIC_AVATAR,
    coverUrl: FILE_UPLOAD_DIRS.PUBLIC_COVER,
  } as const

  const getApiErrorMessage = (err: any, fallback: string) => {
    const isNetworkError =
      err?.code === 'ERR_NETWORK' ||
      (!err?.response && typeof err?.message === 'string' && err.message.toLowerCase().includes('network error'))

    if (isNetworkError) {
      return 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
    }

    const status = err?.response?.status
    if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    if (status === 403) return 'Bạn không có quyền tải lên tệp này.'
    if (status === 413) return 'Tệp quá lớn. Kích thước tối đa là 10MB.'
    if (status === 415) return 'Loại tệp không được hỗ trợ. Vui lòng tải lên PDF, JPG, JPEG, PNG, hoặc WEBP.'

    return (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.response?.data?.errors?.[0]?.message ||
      err?.message ||
      fallback
    )
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: 'avatarUrl' | 'coverUrl') => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!allowedMimeTypes.has(file.type)) {
      setError(`Loại hình ảnh không được hỗ trợ.`)
      return
    }

    const previewUrl = URL.createObjectURL(file)
    const previousValue = values[fieldName]

    try {
      setUploading((prev) => ({ ...prev, [fieldName]: true }))
      setError('')
      setValue(fieldName, previewUrl, { shouldValidate: true, shouldDirty: true })
      const response = await fileApi.upload(file, { subDirectory: imageUploadDirectories[fieldName] })
      setValue(fieldName, response.fileUrl, { shouldValidate: true, shouldDirty: true })
    } catch (err) {
      setValue(fieldName, previousValue || '', { shouldValidate: true, shouldDirty: true })
      setError(getApiErrorMessage(err, 'Lỗi khi tải ảnh lên.'))
    } finally {
      URL.revokeObjectURL(previewUrl)
      setUploading((prev) => ({ ...prev, [fieldName]: false }))
      event.target.value = ''
    }
  }

  const uploadFile = async (field: UploadField, file?: File) => {
    if (isLocked || !file) return

    const extension = file.name?.toLowerCase().slice(file.name.lastIndexOf('.')) || ''
    if (!allowedMimeTypes.has(file.type) || !allowedExtensions.includes(extension)) {
      setError('Định dạng tệp không được hỗ trợ. Vui lòng chọn PDF, JPG, PNG, hoặc WEBP.')
      return
    }

    if (file.size > maxUploadBytes) {
      setError('Tệp quá lớn. Kích thước tối đa là 10MB.')
      return
    }

    setUploading((prev) => ({ ...prev, [field]: true }))
    setError('')
    try {
      const response = await fileApi.upload(file, { subDirectory: FILE_UPLOAD_DIRS.PRIVATE_DOCUMENT })
      setValue(field, response.fileUrl, { shouldDirty: true, shouldValidate: true })
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Không thể tải tệp lên. Vui lòng thử lại.'))
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }))
    }
  }

  const addSkill = (rawSkill: string) => {
    if (isLocked) return
    const normalizedSkill = rawSkill.trim()
    if (!normalizedSkill) return

    const currentSkills = values.skills || []
    if (currentSkills.some((item) => item.toLowerCase() === normalizedSkill.toLowerCase())) {
      setSkillInput('')
      return
    }

    if (currentSkills.length >= 15) {
      setError('Bạn chỉ có thể thêm tối đa 15 kỹ năng.')
      return
    }

    setValue('skills', [...currentSkills, normalizedSkill], { shouldDirty: true, shouldValidate: true })
    setSkillInput('')
    setError('')
  }

  const removeSkill = (skillToRemove: string) => {
    if (isLocked) return
    const nextSkills = (values.skills || []).filter((item) => item !== skillToRemove)
    setValue('skills', nextSkills, { shouldDirty: true, shouldValidate: true })
  }

  const addProofLinkTemplate = (label = '') => {
    if (isLocked) return
    appendProofLink({ label, url: '' })
  }

  const onSubmit = async (data: FormValues) => {
    if (isLocked) return

    try {
      setLoading(true)
      setError('')

      const resolvedLocationValue = getResolvedOptionValue(data.locationOption, data.locationCustom)
      const resolvedLanguagesValue = getResolvedOptionValue(data.languagesOption, data.languagesCustom)
      const proofLinks = normalizeProofLinks(data.proofLinks)
      const legacyProofFields = deriveLegacyProofFields(proofLinks)

      const payload: MentorProfileRequest = {
        headline: data.headline.trim(),
        currentTitle: data.currentTitle?.trim() || undefined,
        currentCompany: data.currentCompany?.trim() || undefined,
        primaryDomain: data.primaryDomain === 'Other' ? (data.primaryDomainCustom || '').trim() : data.primaryDomain,
        skills: data.skills,
        professionalBio: data.professionalBio.trim(),
        helpDescription: data.helpDescription.trim(),
        yearsOfExperience: Number(data.yearsOfExperience),
        hourlyRateMxc: data.hourlyRateMxc ? Number(data.hourlyRateMxc) : undefined,
        availability: data.availability || undefined,
        location: resolvedLocationValue || undefined,
        languages: resolvedLanguagesValue
          ? resolvedLanguagesValue.split(',').map((item) => item.trim()).filter(Boolean)
          : undefined,
        linkedinUrl: legacyProofFields.linkedinUrl,
        githubUrl: legacyProofFields.githubUrl,
        portfolioUrl: legacyProofFields.portfolioUrl,
        portfolioEvidenceUrl: legacyProofFields.portfolioEvidenceUrl,
        videoIntroUrl: legacyProofFields.videoIntroUrl,
        proofLinks: proofLinks.length > 0 ? proofLinks : undefined,
        cvUrl: data.cvUrl || undefined,
        certificateUrl: data.certificateUrl || undefined,
        coverUrl: data.coverUrl || undefined,
        mentorAgreementAccepted: data.mentorAgreementAccepted,
        disputePolicyAccepted: data.disputePolicyAccepted,
      }

      if (isEdit) {
        await mentorApi.updateMentorProfile(userId, payload)
      } else {
        await mentorApi.createMentorProfile(userId, payload)
      }

      if (data.avatarUrl) {
        await userApi.updateUser(userId, { avatarUrl: data.avatarUrl })
      }

      await refreshUser()
      setSuccess(true)
      setTimeout(async () => {
        await onSaved?.()
        if (successRedirectTo) {
          navigate(successRedirectTo)
        }
      }, 900)
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Không thể gửi hồ sơ của bạn lúc này.'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-[2rem] border border-emerald-200/60 bg-emerald-50/50 p-10 text-center backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl shadow-emerald-500/30">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-900">
          {successTitle || (isEdit ? 'Đã cập nhật hồ sơ' : 'Đã gửi hồ sơ ứng tuyển')}
        </h3>
        <p className="mx-auto mt-3 max-w-lg text-sm font-semibold text-slate-600">
          {successDescription || 'Hồ sơ của bạn đã được gửi. Chúng tôi sẽ phản hồi trong vòng 2-5 ngày làm việc.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
      {isLocked && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900 shadow-sm">
          {lockedMessage || 'Hồ sơ của bạn đang được xét duyệt. Không thể chỉnh sửa lúc này.'}
        </section>
      )}

      <fieldset disabled={isLocked} className="space-y-6 disabled:cursor-not-allowed disabled:opacity-75">
        
        {/* Ảnh đại diện & Khởi đầu */}
        <section className={sectionClass}>
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex flex-col items-center shrink-0">
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-slate-100 ring-4 ring-white shadow-lg">
                {values.avatarUrl ? (
                  <img src={values.avatarUrl} alt="Mentor avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-slate-400" />
                )}
              </div>

              <label className="mt-4 cursor-pointer rounded-xl bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 flex items-center gap-2">
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => handleImageUpload(event, 'avatarUrl')}
                  disabled={uploading.avatarUrl || isLocked}
                />
                {uploading.avatarUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                {values.avatarUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
              </label>

              {values.avatarUrl && (
                <button
                  type="button"
                  onClick={() => setValue('avatarUrl', '', { shouldDirty: true, shouldValidate: true })}
                  className="mt-2 text-[10px] font-bold text-slate-400 hover:text-slate-600"
                >
                  Gỡ ảnh
                </button>
              )}
            </div>

            <div className="md:pl-6 md:border-l border-slate-200/60">
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">
                <CheckCircle2 className="w-3 h-3" />
                Ấn tượng đầu tiên
              </div>
              <h3 className="text-xl font-black text-slate-900">Hình ảnh chuyên nghiệp, dễ nhận diện</h3>
              <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed max-w-lg">
                Ảnh đại diện rõ nét, khuôn mặt thân thiện sẽ giúp học viên tin tưởng bạn hơn và tăng tỷ lệ booking. File hỗ trợ: JPG, PNG, WEBP (tối đa 10MB).
              </p>
            </div>
          </div>
        </section>

        {/* Thông tin chuyên môn */}
        <SectionCard
          eyebrow="Thông tin cá nhân"
          title="Định vị chuyên môn của bạn"
          description="Giới thiệu nhanh về bạn, lĩnh vực mạnh nhất và các kỹ năng cốt lõi."
          icon={<Sparkles className="h-5 w-5" />}
          tone="indigo"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Tiêu đề (Headline)"
              description="Một câu ngắn gọn tóm tắt vị thế của bạn."
              error={errors.headline?.message}
            >
              <input
                {...register('headline')}
                className={inputClass}
                placeholder="VD: Senior Backend Engineer giúp bạn master Spring Boot"
              />
            </Field>

            <Field
              label="Lĩnh vực chính"
              description="Hỗ trợ phân loại hồ sơ của bạn."
              error={errors.primaryDomain?.message}
            >
              <select {...register('primaryDomain')} className={inputClass}>
                <option value="">Chọn lĩnh vực của bạn</option>
                {DOMAIN_OPTIONS.map((domain) => (
                  <option key={domain.value} value={domain.value}>
                    {domain.label}
                  </option>
                ))}
              </select>
            </Field>

            {values.primaryDomain === 'Other' && (
              <div className="md:col-span-2">
                <Field
                  label="Lĩnh vực khác"
                  error={errors.primaryDomainCustom?.message}
                >
                  <input {...register('primaryDomainCustom')} className={inputClass} placeholder="VD: Luật, Kiến trúc, Nha khoa" />
                </Field>
              </div>
            )}

            <div className="md:col-span-2">
              <Field
                label="Kỹ năng (Skills)"
                description="Thêm 3 - 15 kỹ năng cốt lõi mà bạn tự tin mentor."
                error={errors.skills?.message as string | undefined}
              >
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(values.skills || []).map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="group flex items-center gap-1.5 rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-200"
                      >
                        {skill}
                        <span className="text-indigo-400 group-hover:text-indigo-600">&times;</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={skillInput}
                      onChange={(event) => setSkillInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ',') {
                          event.preventDefault()
                          addSkill(skillInput)
                        }
                      }}
                      className={inputClass}
                      placeholder="Nhập tên kỹ năng và nhấn Enter..."
                    />
                    <button
                      type="button"
                      onClick={() => addSkill(skillInput)}
                      className="shrink-0 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-indigo-600"
                    >
                      Thêm
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs font-semibold text-slate-400">Gợi ý:</span>
                    {SKILL_SUGGESTIONS.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className="rounded-md border border-slate-200/80 px-2.5 py-1 text-[10px] font-bold text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* Giới thiệu chi tiết */}
        <SectionCard
          eyebrow="Giới thiệu bản thân"
          title="Kể câu chuyện nghề nghiệp của bạn"
          description="Cho học viên biết phong cách mentor của bạn và họ sẽ đạt được gì khi làm việc với bạn."
          icon={<FileText className="h-5 w-5" />}
          tone="emerald"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field
                label="Tiểu sử chuyên môn"
                description="Kể về kinh nghiệm, ngành nghề đã làm và những ai bạn thích giúp đỡ."
                hint={`${bioWordCount} từ · đề xuất 150-500 từ`}
                error={errors.professionalBio?.message}
              >
                <textarea
                  {...register('professionalBio')}
                  rows={6}
                  className={textareaClass}
                  placeholder="Chia sẻ về con đường sự nghiệp của bạn..."
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field
                label="Học viên sẽ nhận được gì?"
                description="VD: Luyện phỏng vấn, Review CV, Roadmap nghề nghiệp..."
                error={errors.helpDescription?.message}
              >
                <textarea
                  {...register('helpDescription')}
                  rows={4}
                  className={textareaClass}
                  placeholder="Mô tả cụ thể những giá trị bạn mang lại sau khóa học..."
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* Thông tin cơ bản */}
        <SectionCard
          eyebrow="Kinh nghiệm & Dịch vụ"
          title="Chức danh và Mức phí"
          description="Bổ sung chức danh hiện tại và thiết lập mức phí cơ bản cho các buổi học."
          icon={<Briefcase className="h-5 w-5" />}
          tone="amber"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Chức vụ hiện tại" error={errors.currentTitle?.message}>
              <input {...register('currentTitle')} className={inputClass} placeholder="VD: Senior Product Designer" />
            </Field>

            <Field label="Công ty" error={errors.currentCompany?.message}>
              <input {...register('currentCompany')} className={inputClass} placeholder="VD: FPT Software, Tự do..." />
            </Field>

            <Field label="Số năm kinh nghiệm" error={errors.yearsOfExperience?.message}>
              <select {...register('yearsOfExperience')} className={inputClass}>
                <option value="">Chọn số năm</option>
                {EXPERIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Phí dự kiến (MXC/Giờ)" description="Bạn có thể thay đổi sau." error={errors.hourlyRateMxc?.message}>
              <div className="space-y-3">
                <input type="number" step="1" {...register('hourlyRateMxc')} className={inputClass} placeholder="VD: 250" />
                <div className="flex flex-wrap gap-2">
                  {RATE_SUGGESTIONS.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setValue('hourlyRateMxc', rate, { shouldDirty: true, shouldValidate: true })}
                      className="rounded-lg border border-slate-200/80 px-3 py-1 text-xs font-bold text-slate-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                    >
                      {rate} MXC
                    </button>
                  ))}
                </div>
              </div>
            </Field>

            <Field label="Múi giờ (Khu vực)" error={errors.locationOption?.message}>
              <select {...register('locationOption')} className={inputClass}>
                <option value="">Chọn múi giờ</option>
                {LOCATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Ngôn ngữ" error={errors.languagesOption?.message}>
              <select {...register('languagesOption')} className={inputClass}>
                <option value="">Chọn ngôn ngữ giao tiếp</option>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>
            
            {values.locationOption === 'Other' && (
              <Field label="Múi giờ khác" error={errors.locationCustom?.message}>
                <input {...register('locationCustom')} className={inputClass} placeholder="Nhập múi giờ tự do..." />
              </Field>
            )}

            {values.languagesOption === 'Other' && (
              <Field label="Ngôn ngữ khác" error={errors.languagesCustom?.message}>
                <input {...register('languagesCustom')} className={inputClass} placeholder="VD: Tiếng Hàn..." />
              </Field>
            )}

            <Field label="Khung giờ hoạt động" error={errors.availability?.message}>
              <select {...register('availability')} className={inputClass}>
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>
          </div>
        </SectionCard>

        {/* Năng lực & Bằng chứng */}
        <SectionCard
          eyebrow="Hồ sơ năng lực"
          title="Minh chứng kỹ năng của bạn"
          description="Cung cấp các link profile (LinkedIn, GitHub) hoặc CV để tăng độ uy tín."
          icon={<ShieldCheck className="h-5 w-5" />}
          tone="sky"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {PROOF_PRESETS.map((preset) => {
                const Icon = preset.icon
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => addProofLinkTemplate(preset.label)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/50 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 shadow-sm"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {preset.label}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => addProofLinkTemplate()}
                className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:border-slate-400 hover:bg-slate-50"
              >
                + Thêm link tùy chỉnh
              </button>
            </div>

            {proofLinkFields.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-5 py-6 text-center text-sm font-semibold text-slate-400">
                Chưa có liên kết nào. Hãy thêm LinkedIn, GitHub, hoặc Portfolio của bạn.
              </div>
            ) : (
              <div className="space-y-3">
                {proofLinkFields.map((field, index) => (
                  <div key={field.id} className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-xl border border-slate-200/60 bg-white/60 p-3 shadow-sm">
                    <div className="w-full sm:w-1/3">
                      <input
                        {...register(`proofLinks.${index}.label` as const)}
                        className={inputClass}
                        placeholder="Tên nhãn (VD: LinkedIn)"
                      />
                      {errors.proofLinks?.[index]?.label?.message && (
                        <p className="mt-1 text-xs font-bold text-rose-500">{errors.proofLinks[index]?.label?.message}</p>
                      )}
                    </div>

                    <div className="w-full sm:flex-1">
                      <input
                        {...register(`proofLinks.${index}.url` as const)}
                        className={inputClass}
                        placeholder="https://..."
                      />
                      {errors.proofLinks?.[index]?.url?.message && (
                        <p className="mt-1 text-xs font-bold text-rose-500">{errors.proofLinks[index]?.url?.message}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeProofLink(index)}
                      className="shrink-0 rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors h-10"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {typeof errors.proofLinks?.message === 'string' && (
              <p className="text-sm font-bold text-rose-500">{errors.proofLinks.message}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100/80">
              <UploadFieldCard
                title="Sơ yếu lý lịch (CV)"
                description="Đề xuất PDF. Tối đa 10MB."
                busy={Boolean(uploading.cvUrl)}
                value={values.cvUrl}
                disabled={isLocked}
                onSelect={(file) => uploadFile('cvUrl', file)}
              />
              <UploadFieldCard
                title="Chứng chỉ (Tùy chọn)"
                description="Hình ảnh hoặc PDF. Tối đa 10MB."
                busy={Boolean(uploading.certificateUrl)}
                value={values.certificateUrl}
                disabled={isLocked}
                onSelect={(file) => uploadFile('certificateUrl', file)}
              />
            </div>
          </div>
        </SectionCard>

        {/* Cam kết & Submit */}
        <div className="rounded-[2rem] border border-indigo-100/50 bg-gradient-to-b from-white/70 to-indigo-50/30 p-6 shadow-lg shadow-indigo-100/30 backdrop-blur-md sm:p-8">
          <div className="mb-6 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                {...register('mentorAgreementAccepted')}
                className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                Tôi cam kết những thông tin trên là chính xác và phản ánh đúng kinh nghiệm thực tế của bản thân.
              </span>
            </label>
            {errors.mentorAgreementAccepted && <p className="ml-8 text-xs font-bold text-rose-500">{errors.mentorAgreementAccepted.message}</p>}

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                {...register('disputePolicyAccepted')}
                className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                Tôi đồng ý với chính sách của Mentor X về việc kiểm duyệt hồ sơ và đảm bảo chất lượng mentor.
              </span>
            </label>
            {errors.disputePolicyAccepted && <p className="ml-8 text-xs font-bold text-rose-500">{errors.disputePolicyAccepted.message}</p>}
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700 shadow-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200/60 pt-6">
            <p className="text-sm font-medium text-slate-500">
              Thời gian xét duyệt thông thường từ <span className="font-bold text-slate-900">2-5 ngày làm việc</span>.
            </p>
            <button
              type="submit"
              disabled={loading || isLocked}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
              {submitButtonLabel || (isEdit ? 'Cập nhật hồ sơ' : 'Gửi hồ sơ đăng ký')}
            </button>
          </div>
        </div>

      </fieldset>
    </form>
  )
}

function SectionCard({
  eyebrow,
  title,
  description,
  icon,
  children,
  tone = 'indigo',
}: {
  eyebrow: string
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
  tone?: 'indigo' | 'emerald' | 'amber' | 'sky'
}) {
  const toneMap = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
  }

  return (
    <section className={sectionClass}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6 pb-5 border-b border-slate-100/80">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${toneMap[tone]} shadow-sm`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-1.5 text-sm font-semibold text-slate-500">{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </section>
  )
}

function Field({
  label,
  description,
  hint,
  error,
  children,
}: {
  label: string
  description?: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-xs font-bold text-slate-700">{label}</label>
        {hint && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{hint}</span>}
      </div>
      {description && <p className="mb-2 text-[13px] font-medium text-slate-500">{description}</p>}
      {children}
      {error && <p className="mt-1.5 text-xs font-bold text-rose-500">{error}</p>}
    </div>
  )
}

function UploadFieldCard({
  title,
  description,
  value,
  busy,
  disabled,
  onSelect,
}: {
  title: string
  description: string
  value?: string
  busy: boolean
  disabled?: boolean
  onSelect: (file?: File) => void
}) {
  return (
    <label
      className={`group flex min-h-[160px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/80 bg-slate-50/50 p-5 text-center transition-all ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-lg hover:shadow-indigo-100/30'}`}
    >
      <input
        type="file"
        disabled={disabled}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={(event) => onSelect(event.target.files?.[0])}
      />
      {busy ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          <p className="mt-3 text-[13px] font-bold text-indigo-700">Đang tải tệp lên...</p>
        </div>
      ) : value ? (
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-900">Đã đính kèm {title}</p>
          <p className="mt-1 break-all text-[11px] font-semibold text-slate-500 line-clamp-1">{value}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200/60 text-slate-400 shadow-sm transition-colors group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-600">
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-900">{title}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">{description}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white group-hover:bg-indigo-600 transition-colors">
            <FileText className="h-3 w-3" />
            Chọn tệp
          </div>
        </div>
      )}
    </label>
  )
}
