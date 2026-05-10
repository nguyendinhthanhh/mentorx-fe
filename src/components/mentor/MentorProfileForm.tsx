import { useState } from 'react'
import { FieldErrors, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  Banknote,
  Briefcase,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react'
import { fileApi } from '@/api/fileApi'
import { mentorApi } from '@/api/mentorApi'
import { MentorProfileRequest } from '@/types'
import { useAuthStore } from '@/store/authStore'

const urlField = z.string().url('URL chưa hợp lệ').optional().or(z.literal(''))

const mentorSchema = z.object({
  legalName: z.string().min(2, 'Nhập họ tên thật'),
  dateOfBirth: z.string().min(1, 'Chọn ngày sinh'),
  countryOfResidence: z.string().min(2, 'Nhập quốc gia cư trú'),
  identityDocumentType: z.string().min(1, 'Chọn loại giấy tờ'),
  identityDocumentUrl: z.string().min(1, 'Tải lên giấy tờ tùy thân'),
  portraitUrl: z.string().min(1, 'Tải lên ảnh chân dung'),
  phoneNumber: z.string().min(8, 'Nhập số điện thoại'),
  headline: z.string().min(10, 'Headline cần tối thiểu 10 ký tự').max(255),
  hourlyRateMxc: z.coerce.number().min(0, 'Rate phải là số dương').optional(),
  yearsOfExperience: z.coerce.number().min(0).max(50),
  availability: z.string().optional(),
  responseTimeHours: z.coerce.number().min(1).max(168).optional(),
  currentTitle: z.string().min(2, 'Nhập chức danh hiện tại'),
  currentCompany: z.string().min(2, 'Nhập công ty/tổ chức'),
  primaryDomain: z.string().min(2, 'Nhập lĩnh vực chính'),
  linkedinUrl: z.string().url('LinkedIn URL chưa hợp lệ'),
  githubUrl: urlField,
  portfolioUrl: urlField,
  portfolioEvidenceUrl: urlField,
  cvUrl: z.string().optional(),
  certificateUrl: z.string().optional(),
  bankAccountName: z.string().min(2, 'Nhập tên chủ tài khoản'),
  bankName: z.string().min(2, 'Nhập tên ngân hàng'),
  bankAccountNumber: z.string().min(4, 'Nhập số tài khoản'),
  bankBranch: z.string().min(2, 'Nhập chi nhánh'),
  taxId: z.string().optional(),
  mentorAgreementAccepted: z.boolean().refine(Boolean, 'Bạn cần đồng ý thỏa thuận mentor'),
  disputePolicyAccepted: z.boolean().refine(Boolean, 'Bạn cần đồng ý chính sách xử lý tranh chấp'),
})

type MentorFormData = z.infer<typeof mentorSchema>
type UploadField = 'identityDocumentUrl' | 'portraitUrl' | 'certificateUrl' | 'cvUrl'
type UploadMeta = Partial<Record<UploadField, { fileName: string; fileType: string; url: string }>>

const stepFields: Record<number, (keyof MentorFormData)[]> = {
  1: [
    'legalName',
    'dateOfBirth',
    'countryOfResidence',
    'identityDocumentType',
    'identityDocumentUrl',
    'portraitUrl',
    'phoneNumber',
  ],
  2: [
    'headline',
    'yearsOfExperience',
    'currentTitle',
    'currentCompany',
    'primaryDomain',
    'linkedinUrl',
    'githubUrl',
    'portfolioUrl',
    'portfolioEvidenceUrl',
  ],
  3: [
    'bankAccountName',
    'bankName',
    'bankAccountNumber',
    'bankBranch',
    'mentorAgreementAccepted',
    'disputePolicyAccepted',
  ],
}

interface Props {
  userId: string
  userEmail: string
  isEmailVerified?: boolean
  initialData?: MentorProfileRequest
  isEdit: boolean
}

const steps = [
  { key: 1, title: 'Danh tính', icon: ShieldCheck },
  { key: 2, title: 'Chuyên môn', icon: Award },
  { key: 3, title: 'Thanh toán', icon: Banknote },
]

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50/30 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white dark:focus:border-indigo-400'
const labelClass = 'mb-2.5 block text-[13px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400'

export default function MentorProfileForm({ userId, userEmail, isEmailVerified, initialData, isEdit }: Props) {
  const navigate = useNavigate()
  const { refreshUser } = useAuthStore()
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [uploadMeta, setUploadMeta] = useState<UploadMeta>({})

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<MentorFormData>({
    resolver: zodResolver(mentorSchema),
    defaultValues: {
      legalName: initialData?.legalName || '',
      dateOfBirth: initialData?.dateOfBirth || '',
      countryOfResidence: initialData?.countryOfResidence || 'Việt Nam',
      identityDocumentType: initialData?.identityDocumentType || 'CCCD/CMND',
      identityDocumentUrl: initialData?.identityDocumentUrl || '',
      portraitUrl: initialData?.portraitUrl || '',
      phoneNumber: initialData?.phoneNumber || '',
      headline: initialData?.headline || '',
      hourlyRateMxc: initialData?.hourlyRateMxc || undefined,
      yearsOfExperience: initialData?.yearsOfExperience || 0,
      availability: initialData?.availability || 'Linh hoạt',
      responseTimeHours: initialData?.responseTimeHours || 12,
      currentTitle: initialData?.currentTitle || '',
      currentCompany: initialData?.currentCompany || '',
      primaryDomain: initialData?.primaryDomain || '',
      linkedinUrl: initialData?.linkedinUrl || '',
      githubUrl: initialData?.githubUrl || '',
      portfolioUrl: initialData?.portfolioUrl || '',
      portfolioEvidenceUrl: initialData?.portfolioEvidenceUrl || '',
      cvUrl: initialData?.cvUrl || '',
      certificateUrl: initialData?.certificateUrl || '',
      bankAccountName: initialData?.bankAccountName || initialData?.legalName || '',
      bankName: initialData?.bankName || '',
      bankAccountNumber: initialData?.bankAccountNumber || '',
      bankBranch: initialData?.bankBranch || '',
      taxId: initialData?.taxId || '',
      mentorAgreementAccepted: Boolean(initialData?.mentorAgreementAccepted),
      disputePolicyAccepted: Boolean(initialData?.disputePolicyAccepted),
    },
  })

  const uploadedValues = watch()

  const uploadFile = async (field: UploadField, file?: File) => {
    if (!file) return
    setUploading((prev) => ({ ...prev, [field]: true }))
    setError('')
    try {
      const response = await fileApi.upload(file)
      setValue(field, response.fileUrl, { shouldDirty: true, shouldValidate: true })
      setUploadMeta((prev) => ({
        ...prev,
        [field]: {
          fileName: response.fileName || file.name,
          fileType: response.fileType || file.type,
          url: response.fileUrl,
        },
      }))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải file lên. Vui lòng thử lại.')
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }))
    }
  }

  const goToStep = async (targetStep: number) => {
    if (targetStep <= step) {
      setStep(targetStep)
      setError('')
      return
    }

    for (let currentStep = step; currentStep < targetStep; currentStep += 1) {
      const valid = await trigger(stepFields[currentStep], { shouldFocus: true })
      if (!valid) {
        setStep(currentStep)
        setError('Vui lòng hoàn tất đúng thông tin ở level hiện tại trước khi tiếp tục.')
        return
      }
    }

    setError('')
    setStep(targetStep)
  }

  const onInvalid = (formErrors: FieldErrors<MentorFormData>) => {
    const firstInvalidStep = steps.find((item) =>
      stepFields[item.key].some((field) => Boolean(formErrors[field]))
    )?.key

    if (firstInvalidStep) {
      setStep(firstInvalidStep)
    }
    setError('Hồ sơ còn thiếu hoặc sai thông tin. Mình đã chuyển về level cần bổ sung.')
  }

  const onSubmit = async (data: MentorFormData) => {
    try {
      setLoading(true)
      setError('')
      const payload: MentorProfileRequest = {
        ...data,
        dateOfBirth: data.dateOfBirth,
        githubUrl: data.githubUrl || undefined,
        portfolioUrl: data.portfolioUrl || undefined,
        portfolioEvidenceUrl: data.portfolioEvidenceUrl || undefined,
        cvUrl: data.cvUrl || undefined,
        taxId: data.taxId || undefined,
        phoneVerified: false,
      }

      if (isEdit) {
        await mentorApi.updateMentorProfile(userId, payload)
      } else {
        await mentorApi.createMentorProfile(userId, payload)
      }
      await refreshUser()
      setSuccess(true)
      setTimeout(() => navigate('/profile'), 1200)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi hồ sơ mentor.')
    } finally {
      setLoading(false)
    }
  }

  const UploadBox = ({ field, title, description }: { field: UploadField; title: string; description: string }) => {
    const value = uploadedValues[field]
    const busy = uploading[field]
    const meta = uploadMeta[field]
    const fileName = meta?.fileName || (value ? decodeURIComponent(value.split('/').pop() || title) : '')
    const isImage = Boolean(
      value &&
      ((meta?.fileType && meta.fileType.startsWith('image/')) || /\.(png|jpe?g|webp|gif)$/i.test(value))
    )

    return (
      <label className="group flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50/30 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-indigo-400">
        <input
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(event) => uploadFile(field, event.target.files?.[0])}
        />
        {busy ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-xs font-bold text-indigo-600">Đang tải lên...</span>
          </div>
        ) : isImage && value ? (
          <div className="relative overflow-hidden rounded-2xl shadow-lg transition-transform group-hover:scale-105">
            <img
              src={value}
              alt={title}
              className="h-28 w-full max-w-[240px] object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <UploadCloud className="h-8 w-8 text-white" />
            </div>
          </div>
        ) : value ? (
          <div className="flex w-full max-w-[260px] items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/30">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-emerald-950 dark:text-emerald-400">{fileName}</p>
              <p className="text-xs font-bold text-emerald-600/70">Đã sẵn sàng</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-white text-slate-400 shadow-sm transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-slate-800">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white">{title}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{description}</p>
          </div>
        )}
      </label>
    )
  }

  if (success) {
    return (
      <div className="p-12 text-center animate-in zoom-in-95 duration-500">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-emerald-100 text-emerald-600 shadow-xl shadow-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-400 dark:shadow-none">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h3 className="mt-6 text-2xl font-black text-slate-950 dark:text-white">
          {isEdit ? 'Hồ sơ đã cập nhật' : 'Đã gửi xét duyệt'}
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-relaxed text-slate-500">
          Tuyệt vời! Chúng tôi đã nhận được thông tin của bạn. Hệ thống sẽ phản hồi kết quả qua email và thông báo trên app.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex flex-col">
      {/* Header with Steps */}
      <div className="border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {steps.map((item) => {
            const active = item.key === step
            const done = item.key < step
            const Icon = item.icon

            return (
              <button
                type="button"
                key={item.key}
                onClick={() => goToStep(item.key)}
                className={`flex shrink-0 items-center gap-3 rounded-2xl border px-5 py-4 transition-all duration-500 ${
                  active
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20'
                    : done
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950'
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                  active ? 'bg-white/20' : done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                }`}>
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="text-left">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-indigo-100' : 'text-slate-400'}`}>Level {item.key}</p>
                  <p className="text-sm font-black">{item.title}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-8">
        {step === 1 && (
          <section className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">Xác thực danh tính</h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Cung cấp thông tin pháp lý để chúng tôi bảo vệ cộng đồng học viên.</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Họ và tên thật" error={errors.legalName?.message}>
                <input {...register('legalName')} className={inputClass} placeholder="VD: Nguyễn Văn A" />
              </Field>
              <Field label="Ngày sinh" error={errors.dateOfBirth?.message}>
                <input type="date" {...register('dateOfBirth')} className={inputClass} />
              </Field>
              <Field label="Quốc gia cư trú" error={errors.countryOfResidence?.message}>
                <input {...register('countryOfResidence')} className={inputClass} placeholder="VD: Việt Nam" />
              </Field>
              <Field label="Loại giấy tờ" error={errors.identityDocumentType?.message}>
                <select {...register('identityDocumentType')} className={inputClass}>
                  <option>CCCD/CMND</option>
                  <option>Passport</option>
                  <option>Giấy phép lái xe</option>
                </select>
              </Field>
            </div>

            <div>
              <p className={labelClass}>Hồ sơ xác minh</p>
              <div className="grid gap-6 md:grid-cols-2">
                <UploadBox field="identityDocumentUrl" title="Giấy tờ tùy thân" description="Mặt trước CCCD hoặc hộ chiếu" />
                <UploadBox field="portraitUrl" title="Ảnh chân dung" description="Chụp rõ mặt, ánh sáng tốt" />
              </div>
              {(errors.identityDocumentUrl || errors.portraitUrl) && (
                <p className="mt-3 text-xs font-bold text-rose-500 flex items-center gap-1.5">
                  <X className="h-3.5 w-3.5" />
                  Bạn cần tải lên đầy đủ giấy tờ và ảnh chân dung.
                </p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="group rounded-[2rem] border border-emerald-100 bg-emerald-50/30 p-6 transition-colors hover:bg-emerald-50 dark:border-emerald-900/20 dark:bg-emerald-900/10">
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600/70">Email liên hệ</p>
                <p className="mt-2 truncate font-black text-emerald-950 dark:text-emerald-400">{userEmail}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-400/20">
                    <Check className="h-3 w-3" />
                  </div>
                  Xác thực hệ thống
                </div>
              </div>
              <Field label="Số điện thoại" error={errors.phoneNumber?.message}>
                <input {...register('phoneNumber')} className={inputClass} placeholder="+84 9xx xxx xxx" />
              </Field>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                <Briefcase className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">Năng lực chuyên môn</h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Giúp chúng tôi và học viên hiểu rõ thế mạnh của bạn.</p>
              </div>
            </div>

            <Field label="Tiêu đề hồ sơ (Headline)" error={errors.headline?.message}>
              <input {...register('headline')} className={inputClass} placeholder="VD: Senior Frontend Developer | React, TypeScript & UI/UX" />
            </Field>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Chức danh hiện tại" error={errors.currentTitle?.message}>
                <input {...register('currentTitle')} className={inputClass} placeholder="VD: Team Lead" />
              </Field>
              <Field label="Đơn vị công tác" error={errors.currentCompany?.message}>
                <input {...register('currentCompany')} className={inputClass} placeholder="VD: Google" />
              </Field>
              <Field label="Kinh nghiệm (năm)" error={errors.yearsOfExperience?.message}>
                <input type="number" {...register('yearsOfExperience')} className={inputClass} />
              </Field>
              <Field label="Lĩnh vực chính" error={errors.primaryDomain?.message}>
                <input {...register('primaryDomain')} className={inputClass} placeholder="VD: Software Engineering" />
              </Field>
              <Field label="Mức phí / Giờ (MXC)" error={errors.hourlyRateMxc?.message}>
                <input type="number" step="0.01" {...register('hourlyRateMxc')} className={inputClass} placeholder="VD: 500" />
              </Field>
              <Field label="Tốc độ phản hồi" error={errors.responseTimeHours?.message}>
                <select {...register('responseTimeHours')} className={inputClass}>
                  <option value={6}>Trong 6 giờ</option>
                  <option value={12}>Trong 12 giờ</option>
                  <option value={24}>Trong 24 giờ</option>
                  <option value={48}>Trong 48 giờ</option>
                </select>
              </Field>
            </div>

            <div className="space-y-6">
              <Field label="LinkedIn Profile" error={errors.linkedinUrl?.message}>
                <input {...register('linkedinUrl')} className={inputClass} placeholder="https://linkedin.com/in/..." />
              </Field>
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="GitHub (Tùy chọn)" error={errors.githubUrl?.message}>
                  <input {...register('githubUrl')} className={inputClass} placeholder="https://github.com/..." />
                </Field>
                <Field label="Portfolio (Tùy chọn)" error={errors.portfolioUrl?.message}>
                  <input {...register('portfolioUrl')} className={inputClass} placeholder="https://..." />
                </Field>
              </div>
            </div>

            <div>
              <p className={labelClass}>Chứng chỉ & Portfolio Evidence</p>
              <div className="grid gap-6 md:grid-cols-2">
                <UploadBox field="certificateUrl" title="Bằng cấp / Chứng chỉ" description="Các bằng cấp chuyên môn liên quan" />
                <UploadBox field="cvUrl" title="CV / Resume" description="Bản tóm tắt kinh nghiệm làm việc" />
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                <Banknote className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">Thanh toán & Thuế</h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Thông tin dùng để nhận thu nhập từ các dịch vụ Mentor.</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Chủ tài khoản" error={errors.bankAccountName?.message}>
                <input {...register('bankAccountName')} className={inputClass} placeholder="VD: NGUYEN VAN A" />
              </Field>
              <Field label="Ngân hàng" error={errors.bankName?.message}>
                <input {...register('bankName')} className={inputClass} placeholder="VD: Techcombank" />
              </Field>
              <Field label="Số tài khoản" error={errors.bankAccountNumber?.message}>
                <input {...register('bankAccountNumber')} className={inputClass} placeholder="VD: 1903..." />
              </Field>
              <Field label="Chi nhánh" error={errors.bankBranch?.message}>
                <input {...register('bankBranch')} className={inputClass} placeholder="VD: Chi nhánh Ba Đình" />
              </Field>
            </div>

            <Field label="Mã số thuế (Tùy chọn)" error={errors.taxId?.message}>
              <input {...register('taxId')} className={inputClass} placeholder="Nhập mã số thuế cá nhân" />
            </Field>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/50">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                <FileText className="h-4 w-4 text-indigo-600" />
                Cam kết của Mentor
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Tôi cam kết những thông tin cung cấp phía trên là hoàn toàn chính xác và chịu trách nhiệm pháp lý nếu có gian lận.
                Đồng thời tôi đồng ý tuân thủ các quy định về chất lượng tư vấn và chính sách thanh toán của Mentor X.
              </p>
              <div className="mt-8 space-y-4">
                <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-transparent p-1 transition-colors hover:bg-white/50">
                  <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                    <input type="checkbox" {...register('mentorAgreementAccepted')} className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border-2 border-slate-300 transition-all checked:border-indigo-600 checked:bg-indigo-600" />
                    <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Tôi xác nhận thông tin thanh toán là chính xác.</span>
                </label>
                {errors.mentorAgreementAccepted && <p className="ml-10 text-xs font-bold text-rose-500">{errors.mentorAgreementAccepted.message}</p>}
                
                <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-transparent p-1 transition-colors hover:bg-white/50">
                  <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                    <input type="checkbox" {...register('disputePolicyAccepted')} className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border-2 border-slate-300 transition-all checked:border-indigo-600 checked:bg-indigo-600" />
                    <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Tôi đồng ý với các chính sách xử lý tranh chấp.</span>
                </label>
                {errors.disputePolicyAccepted && <p className="ml-10 text-xs font-bold text-rose-500">{errors.disputePolicyAccepted.message}</p>}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col gap-6 border-t border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          <Lock className="h-3.5 w-3.5" />
          Dữ liệu được mã hóa & bảo mật
        </div>
        
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => goToStep(step - 1)}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Quay lại
            </button>
          )}
          
          {step < 3 ? (
            <button
              type="button"
              onClick={() => goToStep(step + 1)}
              className="group flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-95 dark:shadow-none"
            >
              Tiếp tục
              <CheckCircle2 className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-10 py-3.5 text-sm font-black text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 dark:shadow-none"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {isEdit ? 'Cập nhật ngay' : 'Gửi hồ sơ duyệt'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="m-8 mt-0 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600 dark:border-rose-900/20 dark:bg-rose-900/10">
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>}
    </div>
  )
}
