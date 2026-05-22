import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileText,
  Globe,
  Loader2,
  UploadCloud,
} from 'lucide-react'

import { fileApi } from '@/api/fileApi'
import { mentorApi } from '@/api/mentorApi'
import { MentorProfileRequest } from '@/types'
import { useAuthStore } from '@/store/authStore'

const urlField = z.string().url('Please enter a valid URL').optional().or(z.literal(''))

const schema = z.object({
  headline: z.string().min(10, 'Add a stronger headline so learners understand your focus.').max(255),
  currentTitle: z.string().min(2, 'Current title is required.'),
  currentCompany: z.string().min(2, 'Current company or organization is required.'),
  primaryDomain: z.string().min(2, 'Primary domain is required.'),
  yearsOfExperience: z.coerce.number().min(0).max(50),
  hourlyRateMxc: z.coerce.number().min(0).optional(),
  availability: z.string().optional(),
  location: z.string().optional(),
  languagesText: z.string().optional(),
  linkedinUrl: z.string().url('LinkedIn URL is required.'),
  githubUrl: urlField,
  portfolioUrl: urlField,
  portfolioEvidenceUrl: urlField,
  videoIntroUrl: urlField,
  cvUrl: z.string().optional(),
  certificateUrl: z.string().optional(),
  mentorAgreementAccepted: z.boolean().refine(Boolean, 'You must accept the mentor terms.'),
  disputePolicyAccepted: z.boolean().refine(Boolean, 'You must accept the dispute policy.'),
})

type FormValues = z.infer<typeof schema>
type UploadField = 'cvUrl' | 'certificateUrl'

interface Props {
  userId: string
  userEmail: string
  isEmailVerified?: boolean
  initialData?: MentorProfileRequest
  isEdit: boolean
}

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white'

export default function MentorProfileForm({ userId, initialData, isEdit }: Props) {
  const navigate = useNavigate()
  const { refreshUser } = useAuthStore()
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
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
      primaryDomain: initialData?.primaryDomain || '',
      yearsOfExperience: initialData?.yearsOfExperience || 0,
      hourlyRateMxc: initialData?.hourlyRateMxc || undefined,
      availability: initialData?.availability || 'Flexible',
      location: initialData?.location || '',
      languagesText: initialData?.languages?.join(', ') || '',
      linkedinUrl: initialData?.linkedinUrl || '',
      githubUrl: initialData?.githubUrl || '',
      portfolioUrl: initialData?.portfolioUrl || '',
      portfolioEvidenceUrl: initialData?.portfolioEvidenceUrl || '',
      videoIntroUrl: initialData?.videoIntroUrl || '',
      cvUrl: initialData?.cvUrl || '',
      certificateUrl: initialData?.certificateUrl || '',
      mentorAgreementAccepted: Boolean(initialData?.mentorAgreementAccepted),
      disputePolicyAccepted: Boolean(initialData?.disputePolicyAccepted),
    },
  })

  const values = watch()

  const uploadFile = async (field: UploadField, file?: File) => {
    if (!file) return
    setUploading((prev) => ({ ...prev, [field]: true }))
    setError('')
    try {
      const response = await fileApi.upload(file)
      setValue(field, response.fileUrl, { shouldDirty: true, shouldValidate: true })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to upload the selected file.')
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }))
    }
  }

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true)
      setError('')

      const payload: MentorProfileRequest = {
        headline: data.headline,
        currentTitle: data.currentTitle,
        currentCompany: data.currentCompany,
        primaryDomain: data.primaryDomain,
        yearsOfExperience: Number(data.yearsOfExperience),
        hourlyRateMxc: data.hourlyRateMxc ? Number(data.hourlyRateMxc) : undefined,
        availability: data.availability || undefined,
        location: data.location || undefined,
        languages: data.languagesText
          ? data.languagesText.split(',').map((item) => item.trim()).filter(Boolean)
          : undefined,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl || undefined,
        portfolioUrl: data.portfolioUrl || undefined,
        portfolioEvidenceUrl: data.portfolioEvidenceUrl || undefined,
        videoIntroUrl: data.videoIntroUrl || undefined,
        cvUrl: data.cvUrl || undefined,
        certificateUrl: data.certificateUrl || undefined,
        mentorAgreementAccepted: data.mentorAgreementAccepted,
        disputePolicyAccepted: data.disputePolicyAccepted,
      }

      if (isEdit) {
        await mentorApi.updateMentorProfile(userId, payload)
      } else {
        await mentorApi.createMentorProfile(userId, payload)
      }

      await refreshUser()
      setSuccess(true)
      setTimeout(() => navigate('/become-a-mentor'), 900)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to submit your professional profile right now.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50/70 p-10 text-center dark:border-emerald-900/30 dark:bg-emerald-950/20">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
          {isEdit ? 'Professional profile updated' : 'Professional profile submitted'}
        </h3>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Your expertise review is now in queue. Mentor Mode will unlock after the moderation team approves your
          professional profile.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">Step 1</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">Build your professional profile</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Tell Mentor X what you can teach, where you have real experience, and how learners should trust your
              work.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Field label="Headline" error={errors.headline?.message}>
            <input {...register('headline')} className={inputClass} placeholder="Senior React Native mentor for app architecture and performance" />
          </Field>
          <Field label="Primary domain" error={errors.primaryDomain?.message}>
            <input {...register('primaryDomain')} className={inputClass} placeholder="Software Engineering" />
          </Field>
          <Field label="Current title" error={errors.currentTitle?.message}>
            <input {...register('currentTitle')} className={inputClass} placeholder="Senior Frontend Engineer" />
          </Field>
          <Field label="Current company" error={errors.currentCompany?.message}>
            <input {...register('currentCompany')} className={inputClass} placeholder="Mentor X / Freelance / Company name" />
          </Field>
          <Field label="Years of experience" error={errors.yearsOfExperience?.message}>
            <input type="number" {...register('yearsOfExperience')} className={inputClass} />
          </Field>
          <Field label="Indicative hourly rate (optional)" error={errors.hourlyRateMxc?.message}>
            <input type="number" step="0.01" {...register('hourlyRateMxc')} className={inputClass} placeholder="250" />
          </Field>
          <Field label="Availability" error={errors.availability?.message}>
            <select {...register('availability')} className={inputClass}>
              <option value="Flexible">Flexible</option>
              <option value="Weekdays">Weekdays</option>
              <option value="Evenings">Evenings</option>
              <option value="Weekends">Weekends</option>
            </select>
          </Field>
          <div className="md:col-span-2 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-sky-900">
            Your actual response time will be calculated automatically after you start receiving messages.
          </div>
        </div>
      </section>

      <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-600">Step 2</p>
              <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">Show proof of expertise</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Add links and optional supporting files that help moderators validate your experience faster.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <Field label="LinkedIn profile" error={errors.linkedinUrl?.message}>
              <input {...register('linkedinUrl')} className={inputClass} placeholder="https://linkedin.com/in/..." />
            </Field>
            <Field label="GitHub profile (optional)" error={errors.githubUrl?.message}>
              <input {...register('githubUrl')} className={inputClass} placeholder="https://github.com/..." />
            </Field>
            <Field label="Portfolio (optional)" error={errors.portfolioUrl?.message}>
              <input {...register('portfolioUrl')} className={inputClass} placeholder="https://your-portfolio.com" />
            </Field>
            <Field label="Proof of work (optional)" error={errors.portfolioEvidenceUrl?.message}>
              <input {...register('portfolioEvidenceUrl')} className={inputClass} placeholder="Case study, PDF, article, deck..." />
            </Field>
            <Field label="Intro video URL (optional)" error={errors.videoIntroUrl?.message}>
              <input {...register('videoIntroUrl')} className={inputClass} placeholder="https://youtube.com/..." />
            </Field>
            <Field label="Languages" error={errors.languagesText?.message}>
              <input {...register('languagesText')} className={inputClass} placeholder="English, Vietnamese, Japanese" />
            </Field>
            <Field label="Location / timezone" error={errors.location?.message}>
              <input {...register('location')} className={inputClass} placeholder="Ho Chi Minh City, GMT+7" />
            </Field>
          </div>

          <div className="mt-5 grid gap-4">
            <UploadFieldCard
              title="Resume / CV"
              description="Optional, but useful if you want faster review."
              busy={Boolean(uploading.cvUrl)}
              value={values.cvUrl}
              onSelect={(file) => uploadFile('cvUrl', file)}
            />
            <UploadFieldCard
              title="Certificate or credential"
              description="Optional supporting proof for your specialization."
              busy={Boolean(uploading.certificateUrl)}
              value={values.certificateUrl}
              onSelect={(file) => uploadFile('certificateUrl', file)}
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-slate-50/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Before you submit</p>
          <div className="mt-5 space-y-4">
            <label className="flex items-start gap-3">
              <input type="checkbox" {...register('mentorAgreementAccepted')} className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                I confirm that my professional information is accurate and that I can support learners in the areas listed above.
              </span>
            </label>
            {errors.mentorAgreementAccepted && <p className="text-xs font-semibold text-rose-500">{errors.mentorAgreementAccepted.message}</p>}

            <label className="flex items-start gap-3">
              <input type="checkbox" {...register('disputePolicyAccepted')} className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                I agree to Mentor X moderation, quality, and dispute policies.
              </span>
            </label>
            {errors.disputePolicyAccepted && <p className="text-xs font-semibold text-rose-500">{errors.disputePolicyAccepted.message}</p>}
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300">
              {error}
            </div>
          )}

          <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            You can apply as a mentor without uploading identity documents first. Identity verification is requested later only when trust, payout, or compliance requires it.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {isEdit ? 'Update profile for review' : 'Submit for mentor review'}
          </button>
        </section>
      </aside>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs font-semibold text-rose-500">{error}</p>}
    </div>
  )
}

function UploadFieldCard({
  title,
  description,
  value,
  busy,
  onSelect,
}: {
  title: string
  description: string
  value?: string
  busy: boolean
  onSelect: (file?: File) => void
}) {
  return (
    <label className="group flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-slate-50/60 p-5 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-900/60">
      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => onSelect(event.target.files?.[0])} />
      {busy ? (
        <>
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
          <p className="mt-3 text-sm font-semibold text-indigo-600">Uploading file...</p>
        </>
      ) : value ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="mt-4 text-sm font-black text-slate-950 dark:text-white">{title} attached</p>
          <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">{value}</p>
        </>
      ) : (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-slate-950">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-black text-slate-950 dark:text-white">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white dark:bg-white dark:text-slate-950">
            <FileText className="h-3.5 w-3.5" />
            Select file
          </p>
        </>
      )}
    </label>
  )
}
