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
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
const labelClass = 'mb-2 block text-sm font-semibold text-slate-800'

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
      <label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
        <input
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(event) => uploadFile(field, event.target.files?.[0])}
        />
        {busy ? (
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        ) : isImage && value ? (
          <img
            src={value}
            alt={title}
            className="h-28 w-full max-w-[260px] rounded-xl border border-slate-200 bg-white object-cover shadow-sm"
          />
        ) : value ? (
          <span className="flex w-full max-w-[260px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm">
            <FileText className="h-8 w-8 shrink-0 text-blue-600" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-slate-900">{fileName}</span>
              <span className="block text-xs font-semibold text-emerald-600">Đã tải lên</span>
            </span>
          </span>
        ) : (
          <UploadCloud className="h-7 w-7 text-slate-400" />
        )}
        <span className="mt-3 text-sm font-bold text-slate-900">{title}</span>
        <span className="mt-1 text-xs font-medium text-slate-500">{value ? 'Đã tải lên' : description}</span>
      </label>
    )
  }

  if (success) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h3 className="mt-4 text-xl font-black text-slate-950">
          {isEdit ? 'Đã cập nhật hồ sơ mentor' : 'Đã gửi hồ sơ xét duyệt'}
        </h3>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Admin hoặc kiểm duyệt viên sẽ xem thông tin xác minh của bạn.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-3 gap-3">
          {steps.map((item) => {
            const active = item.key === step
            const done = item.key < step
            const Icon = item.icon

            return (
              <button
                type="button"
                key={item.key}
                onClick={() => goToStep(item.key)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  active
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : done
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                  {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </span>
                <span>
                  <span className="block text-xs font-black uppercase tracking-wide">Level {item.key}</span>
                  <span className="block text-sm font-black">{item.title}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        {step === 1 && (
          <section>
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-950">Level 1 - Xác thực danh tính</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Thông tin cơ bản để mở hồ sơ mentor và bảo vệ học viên.</p>
                </div>
              </div>
            </div>

            <div className="space-y-8 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Họ và tên thật" error={errors.legalName?.message}>
                  <input {...register('legalName')} className={inputClass} placeholder="Nhập tên trên giấy tờ" />
                </Field>
                <Field label="Ngày sinh" error={errors.dateOfBirth?.message}>
                  <input type="date" {...register('dateOfBirth')} className={inputClass} />
                </Field>
                <Field label="Quốc gia cư trú" error={errors.countryOfResidence?.message}>
                  <input {...register('countryOfResidence')} className={inputClass} />
                </Field>
                <Field label="Loại giấy tờ" error={errors.identityDocumentType?.message}>
                  <select {...register('identityDocumentType')} className={inputClass}>
                    <option>CCCD/CMND</option>
                    <option>Passport</option>
                    <option>Driver License</option>
                  </select>
                </Field>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-black uppercase tracking-wide text-slate-800">Giấy tờ tùy thân</p>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">PDF, JPG, PNG</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <UploadBox field="identityDocumentUrl" title="Mặt trước giấy tờ" description="Kéo thả hoặc click để tải lên" />
                  <UploadBox field="portraitUrl" title="Ảnh chân dung" description="Rõ mặt, không đeo kính râm" />
                </div>
                {(errors.identityDocumentUrl || errors.portraitUrl) && (
                  <p className="mt-2 text-xs font-semibold text-red-500">Cần tải đủ giấy tờ và ảnh chân dung.</p>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-[1fr_1.3fr]">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-black text-emerald-800">Email</p>
                  <p className="mt-1 truncate text-sm font-medium text-emerald-700">{userEmail}</p>
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isEmailVerified ? 'Đã xác thực' : 'Đã đăng nhập'}
                  </span>
                </div>
                <Field label="Số điện thoại" error={errors.phoneNumber?.message}>
                  <input {...register('phoneNumber')} className={inputClass} placeholder="+84 901 234 567" />
                  <p className="mt-2 text-xs font-medium text-slate-500">Số điện thoại được lưu vào hồ sơ xét duyệt. Tích hợp SMS OTP có thể nối thêm khi cấu hình nhà cung cấp SMS.</p>
                </Field>
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-950">Level 2 - Chuyên môn & kinh nghiệm</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Chứng minh năng lực để học viên tin tưởng trước khi đặt lịch.</p>
                </div>
              </div>
            </div>

            <div className="space-y-8 p-6">
              <Field label="Headline hồ sơ" error={errors.headline?.message}>
                <input {...register('headline')} className={inputClass} placeholder="Senior Java mentor | Spring Boot, system design, interview prep" />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Chức danh hiện tại" error={errors.currentTitle?.message}>
                  <input {...register('currentTitle')} className={inputClass} placeholder="Senior Product Manager" />
                </Field>
                <Field label="Công ty / Tổ chức" error={errors.currentCompany?.message}>
                  <input {...register('currentCompany')} className={inputClass} placeholder="Tech Corp Inc." />
                </Field>
                <Field label="Số năm kinh nghiệm" error={errors.yearsOfExperience?.message}>
                  <input type="number" {...register('yearsOfExperience')} className={inputClass} />
                </Field>
                <Field label="Lĩnh vực chính" error={errors.primaryDomain?.message}>
                  <input {...register('primaryDomain')} className={inputClass} placeholder="Backend, Product, UX, Data..." />
                </Field>
                <Field label="Rate theo giờ (MXC)" error={errors.hourlyRateMxc?.message}>
                  <input type="number" step="0.01" {...register('hourlyRateMxc')} className={inputClass} placeholder="450" />
                </Field>
                <Field label="Thời gian phản hồi" error={errors.responseTimeHours?.message}>
                  <select {...register('responseTimeHours')} className={inputClass}>
                    <option value={6}>Trong 6 giờ</option>
                    <option value={12}>Trong 12 giờ</option>
                    <option value={24}>Trong 24 giờ</option>
                    <option value={48}>Trong 48 giờ</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-5">
                <Field label="LinkedIn URL" error={errors.linkedinUrl?.message}>
                  <input {...register('linkedinUrl')} className={inputClass} placeholder="https://linkedin.com/in/username" />
                </Field>
                <Field label="GitHub URL (không bắt buộc)" error={errors.githubUrl?.message}>
                  <input {...register('githubUrl')} className={inputClass} placeholder="https://github.com/username" />
                </Field>
                <Field label="Portfolio URL (không bắt buộc)" error={errors.portfolioUrl?.message}>
                  <input {...register('portfolioUrl')} className={inputClass} placeholder="https://your-portfolio.com" />
                </Field>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-black uppercase tracking-wide text-slate-800">Chứng chỉ / CV</p>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Khuyến khích</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <UploadBox field="certificateUrl" title="Bằng cấp hoặc chứng chỉ" description="PDF, JPG, PNG" />
                  <UploadBox field="cvUrl" title="CV / Resume" description="PDF, JPG, PNG" />
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Banknote className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-950">Level 3 - Thanh toán & thuế</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Dùng để Mentor X thanh toán thu nhập hằng tháng sau khi hồ sơ được duyệt.</p>
                </div>
              </div>
            </div>

            <div className="space-y-8 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Tên chủ tài khoản" error={errors.bankAccountName?.message}>
                  <input {...register('bankAccountName')} className={inputClass} placeholder="NGUYEN VAN A" />
                </Field>
                <Field label="Ngân hàng" error={errors.bankName?.message}>
                  <input {...register('bankName')} className={inputClass} placeholder="VCB, ACB, Techcombank..." />
                </Field>
                <Field label="Số tài khoản" error={errors.bankAccountNumber?.message}>
                  <input {...register('bankAccountNumber')} className={inputClass} placeholder="Nhập số tài khoản" />
                </Field>
                <Field label="Chi nhánh" error={errors.bankBranch?.message}>
                  <input {...register('bankBranch')} className={inputClass} placeholder="Chi nhánh TP.HCM" />
                </Field>
              </div>

              <Field label="Mã số thuế cá nhân (không bắt buộc)" error={errors.taxId?.message}>
                <input {...register('taxId')} className={inputClass} placeholder="Nhập mã số thuế" />
              </Field>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-900">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Thỏa thuận hợp tác mentor
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Bằng việc gửi duyệt, bạn cam kết cung cấp thông tin chính xác, hỗ trợ học viên với chuẩn mực nghề nghiệp,
                  bảo mật thông tin cá nhân của học viên và tuân thủ quy định của Mentor X.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 text-sm font-medium text-slate-700">
                  <input type="checkbox" {...register('mentorAgreementAccepted')} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                  Tôi cam kết không gian lận và cung cấp thông tin chính xác về tài khoản ngân hàng.
                </label>
                {errors.mentorAgreementAccepted && <p className="text-xs font-semibold text-red-500">{errors.mentorAgreementAccepted.message}</p>}
                <label className="flex items-start gap-3 text-sm font-medium text-slate-700">
                  <input type="checkbox" {...register('disputePolicyAccepted')} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                  Tôi đồng ý với chính sách xử lý tranh chấp và thỏa thuận hợp tác của Mentor X.
                </label>
                {errors.disputePolicyAccepted && <p className="text-xs font-semibold text-red-500">{errors.disputePolicyAccepted.message}</p>}
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-500">
            <Lock className="mr-1 inline h-3.5 w-3.5" />
            Thông tin xác minh chỉ hiển thị cho Admin/Moderator khi xét duyệt.
          </p>
          <div className="flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => goToStep(Math.max(1, step - 1))}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Quay lại
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => goToStep(Math.min(3, step + 1))}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              >
                Tiếp tục Level {step + 1}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {isEdit ? 'Cập nhật và gửi duyệt' : 'Hoàn tất và gửi duyệt'}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
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
