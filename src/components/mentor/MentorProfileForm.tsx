import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
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
  UploadCloud, User,
} from 'lucide-react'

import { FILE_UPLOAD_DIRS, fileApi } from '@/api/fileApi'
import { mentorApi } from '@/api/mentorApi'
import { userApi } from '@/api/userApi'
import { MentorProfileRequest } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { deriveLegacyProofFields, getMentorProofLinks, normalizeProofLinks } from '@/utils/proofLinks'

const isDevEnvironment = import.meta.env.DEV

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

const DOMAIN_OPTIONS = [
  'Software Engineering',
  'Data Science & AI',
  'Product Management',
  'Design',
  'Marketing',
  'Business & Finance',
  'Career Coaching',
  'Other',
] as const

const LOCATION_OPTIONS = [
  'Ho Chi Minh City, GMT+7',
  'Ha Noi, GMT+7',
  'Da Nang, GMT+7',
  'Singapore, GMT+8',
  'Tokyo, GMT+9',
  'Remote / Flexible',
  'Other',
] as const

const LANGUAGE_OPTIONS = [
  'English',
  'Vietnamese',
  'Japanese',
  'English, Vietnamese',
  'English, Japanese',
  'Vietnamese, Japanese',
  'English, Vietnamese, Japanese',
  'Other',
] as const

const SKILL_SUGGESTIONS = [
  'React Native',
  'React',
  'TypeScript',
  'Node.js',
  'Java',
  'Spring Boot',
  'Python',
  'Data Analysis',
  'Product Design',
  'Career Coaching',
]

const schema = z
  .object({
    headline: z.string().min(10, 'Add a stronger headline so learners understand your focus.').max(255),
    currentTitle: z.string().optional(),
    currentCompany: z.string().optional(),
    primaryDomain: z.string().min(2, 'Primary domain is required.'),
    primaryDomainCustom: z.string().optional(),
    skills: z.array(z.string().min(1).max(60)).min(1, 'Add at least one skill.'),
    professionalBio: z
      .string()
      .min(50, 'Professional bio must be at least 50 characters.')
      .max(500, 'Professional bio cannot exceed 500 characters.'),
    helpDescription: z
      .string()
      .min(30, 'Please add what you can help learners with (minimum 30 characters).')
      .max(500, 'This field cannot exceed 500 characters.'),
    yearsOfExperience: z.coerce.number().min(0).max(50),
    hourlyRateMxc: z.coerce.number().min(0).optional(),
    availability: z.string().optional(),
    locationOption: z.string().optional(),
    locationCustom: z.string().optional(),
    languagesOption: z.string().optional(),
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
    mentorAgreementAccepted: z.boolean().refine(Boolean, 'You must accept the mentor terms.'),
    disputePolicyAccepted: z.boolean().refine(Boolean, 'You must accept the dispute policy.'),
  })
  .superRefine((value, context) => {
    if (value.primaryDomain === 'Other' && (!value.primaryDomainCustom || value.primaryDomainCustom.trim().length < 2)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter your primary domain.',
        path: ['primaryDomainCustom'],
      })
    }
    if (value.locationOption === 'Other' && (!value.locationCustom || value.locationCustom.trim().length < 2)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter your location / timezone.',
        path: ['locationCustom'],
      })
    }
    if (value.languagesOption === 'Other' && (!value.languagesCustom || value.languagesCustom.trim().length < 2)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter your languages.',
        path: ['languagesCustom'],
      })
    }

    if (isUrlLike(value.headline)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Headline must be plain text, not a URL.',
        path: ['headline'],
      })
    }
    if (isUrlLike(value.currentTitle)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Current title must be plain text, not a URL.',
        path: ['currentTitle'],
      })
    }
    if (isUrlLike(value.currentCompany)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Current company must be plain text, not a URL.',
        path: ['currentCompany'],
      })
    }

    const normalizedProofLinks = normalizeProofLinks(value.proofLinks)
    for (let index = 0; index < value.proofLinks.length; index += 1) {
      const item = value.proofLinks[index]
      const label = item.label?.trim() || ''
      const url = item.url?.trim() || ''

      if (!label && !url) {
        continue
      }

      if (!label) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a label.',
          path: ['proofLinks', index, 'label'],
        })
      }

      if (!url) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a URL.',
          path: ['proofLinks', index, 'url'],
        })
        continue
      }

      if (label.length > 80) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Label must be 80 characters or fewer.',
          path: ['proofLinks', index, 'label'],
        })
      }

      const parsed = parseUrl(url)
      if (!parsed) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a valid URL.',
          path: ['proofLinks', index, 'url'],
        })
      } else if (
        !isDevEnvironment &&
        ['localhost', '127.0.0.1'].includes(parsed.hostname.toLowerCase())
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Localhost URLs are not allowed outside development.',
          path: ['proofLinks', index, 'url'],
        })
      }
    }

    const hasProof = normalizedProofLinks.length > 0 || Boolean(value.cvUrl?.trim() || value.certificateUrl?.trim())
    if (!hasProof) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Add at least one proof item: a link, CV, or certificate.',
        path: ['proofLinks'],
      })
    }
  })

type FormValues = z.infer<typeof schema>
type UploadField = 'cvUrl' | 'certificateUrl'

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
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white'

export default function MentorProfileForm({
  userId,
  initialData,
  isEdit,
  isLocked = false,
  lockedMessage,
  headingTitle,
  headingDescription,
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
  const resolvedDomain = DOMAIN_OPTIONS.includes(initialDomain as (typeof DOMAIN_OPTIONS)[number]) ? initialDomain : (initialDomain ? 'Other' : '')
  const resolvedLocation = LOCATION_OPTIONS.includes(initialLocation as (typeof LOCATION_OPTIONS)[number])
    ? initialLocation
    : (initialLocation ? 'Other' : '')
  const resolvedLanguages = LANGUAGE_OPTIONS.includes(initialLanguagesText as (typeof LANGUAGE_OPTIONS)[number])
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
      yearsOfExperience: initialData?.yearsOfExperience || 0,
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

  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'avatarUrl' | 'coverUrl') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!allowedMimeTypes.has(file.type)) {
      setError('Invalid file type for ' + fieldName)
      return
    }

    try {
      setUploading((prev) => ({ ...prev, [fieldName]: true }))
      setError('')
      const response = await fileApi.uploadCourseMedia(file, fieldName === 'avatarUrl' ? 'mentorx/avatars' : 'mentorx/covers')
      setValue(fieldName, response.fileUrl, { shouldValidate: true, shouldDirty: true })
    } catch (err) {
      console.error(err)
      setError(getApiErrorMessage(err, 'Failed to upload image.'))
    } finally {
      setUploading((prev) => ({ ...prev, [fieldName]: false }))
    }
  }

const { fields: proofLinkFields, append: appendProofLink, remove: removeProofLink } = useFieldArray({
    control,
    name: 'proofLinks',
  })

  const values = watch()
  const maxUploadBytes = 10 * 1024 * 1024
  const allowedMimeTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ])
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp']

  const getApiErrorMessage = (err: any, fallback: string) => {
    const isNetworkError =
      err?.code === 'ERR_NETWORK' ||
      (!err?.response && typeof err?.message === 'string' && err.message.toLowerCase().includes('network error'))
    if (isNetworkError) {
      return 'Cannot connect to backend server (localhost:8080). Please start backend and try again.'
    }

    const status = err?.response?.status
    if (status === 401) return 'Your session has expired. Please sign in again.'
    if (status === 403) return 'You do not have permission to upload this file.'
    if (status === 413) return 'File is too large. Maximum upload size is 10MB.'
    if (status === 415) return 'Unsupported file type. Please upload PDF, JPG, JPEG, PNG, or WEBP.'

    return (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.response?.data?.errors?.[0]?.message ||
      err?.message ||
      fallback
    )
  }

  const uploadFile = async (field: UploadField, file?: File) => {
    if (isLocked) return
    if (!file) return
    const extension = file.name?.toLowerCase().slice(file.name.lastIndexOf('.')) || ''
    if (!allowedMimeTypes.has(file.type) || !allowedExtensions.includes(extension)) {
      setError('Unsupported file type. Please upload PDF, JPG, JPEG, PNG, or WEBP.')
      return
    }
    if (file.size > maxUploadBytes) {
      setError('File is too large. Maximum upload size is 10MB.')
      return
    }

    setUploading((prev) => ({ ...prev, [field]: true }))
    setError('')
    try {
      const response = await fileApi.upload(file, { subDirectory: FILE_UPLOAD_DIRS.PRIVATE_DOCUMENT })
      setValue(field, response.fileUrl, { shouldDirty: true, shouldValidate: true })
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Unable to upload the selected file. Please try again.'))
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
    setValue('skills', [...currentSkills, normalizedSkill], { shouldDirty: true, shouldValidate: true })
    setSkillInput('')
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
      const resolvedLocationValue = data.locationOption === 'Other'
        ? (data.locationCustom || '').trim()
        : (data.locationOption || '').trim()
      const resolvedLanguagesValue = data.languagesOption === 'Other'
        ? (data.languagesCustom || '').trim()
        : (data.languagesOption || '').trim()
      const proofLinks = normalizeProofLinks(data.proofLinks)
      const legacyProofFields = deriveLegacyProofFields(proofLinks)

      const payload: MentorProfileRequest = {
        headline: data.headline,
        currentTitle: data.currentTitle?.trim() || undefined,
        currentCompany: data.currentCompany?.trim() || undefined,
        primaryDomain: data.primaryDomain === 'Other'
          ? (data.primaryDomainCustom || '').trim()
          : data.primaryDomain,
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
      setError(getApiErrorMessage(err, 'Unable to submit your professional profile right now.'))
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
          {successTitle || (isEdit ? 'Professional profile updated' : 'Professional profile submitted')}
        </h3>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {successDescription || 'Your expertise review is now in queue. Mentor Mode will unlock after the moderation team approves your professional profile.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {isLocked && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {lockedMessage || 'Your profile is currently under review. Editing is locked until moderators request updates.'}
        </section>
      )}
      <fieldset disabled={isLocked} className="space-y-6 disabled:cursor-not-allowed disabled:opacity-70">

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">Visual Branding</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Make your profile stand out with a custom cover photo and professional avatar.</p>
        </div>

        <div className="relative mt-4">
          {/* Cover Photo Area */}
          <div className="relative h-48 w-full rounded-2xl bg-slate-100 overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center group transition-colors hover:border-indigo-400 dark:bg-slate-900 dark:border-slate-800">
            {values.coverUrl ? (
              <img src={values.coverUrl} alt="Cover" className="h-full w-full object-cover" />
            ) : (
              <div className="text-center text-slate-500">
                <UploadCloud className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <span className="text-sm font-medium">Upload Cover Photo (16:9)</span>
              </div>
            )}
            
            <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
              <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageUpload(e, 'coverUrl')} disabled={uploading.coverUrl || isLocked} />
              {uploading.coverUrl && <Loader2 className="h-8 w-8 animate-spin text-white" />}
            </label>
          </div>

          {/* Avatar Area */}
          <div className="absolute -bottom-10 left-8 z-10">
            <div className="relative h-28 w-28 rounded-full border-4 border-white bg-white shadow-md overflow-hidden group dark:border-slate-950 dark:bg-slate-900">
              {values.avatarUrl ? (
                <img src={values.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-400 dark:bg-indigo-900 dark:text-indigo-300">
                  <User className="h-12 w-12" />
                </div>
              )}
              
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all rounded-full">
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageUpload(e, 'avatarUrl')} disabled={uploading.avatarUrl || isLocked} />
                {uploading.avatarUrl ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <UploadCloud className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-14 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Recommended: Cover (1600x400px), Avatar (400x400px). JPG, PNG, WEBP up to 10MB.
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
              {headingTitle || 'Build your public mentor profile'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {headingDescription || 'Tell Mentor X what you can teach, where you have real experience, and why learners can trust your professional background.'}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Field label="Headline" error={errors.headline?.message}>
            <input {...register('headline')} className={inputClass} placeholder="Senior React Native mentor for app architecture and performance" />
          </Field>
          <Field label="Primary domain" error={errors.primaryDomain?.message}>
            <select {...register('primaryDomain')} className={inputClass}>
              <option value="">Select a primary domain</option>
              {DOMAIN_OPTIONS.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </Field>
          {values.primaryDomain === 'Other' && (
            <Field label="Custom domain" error={errors.primaryDomainCustom?.message}>
              <input
                {...register('primaryDomainCustom')}
                className={inputClass}
                placeholder="Enter your domain (e.g. Cybersecurity, DevOps...)"
              />
            </Field>
          )}
          <Field label="Skills" error={errors.skills?.message as string | undefined}>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(values.skills || []).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-200"
                  >
                    {skill}
                    <span aria-hidden>×</span>
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
                  placeholder="Type a skill and press Enter"
                />
                <button
                  type="button"
                  onClick={() => addSkill(skillInput)}
                  className="rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {SKILL_SUGGESTIONS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => addSkill(skill)}
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </Field>
          <Field label="Professional bio" error={errors.professionalBio?.message}>
            <div>
              <textarea
                {...register('professionalBio')}
                rows={4}
                className={inputClass}
                placeholder="Describe your background, mentoring style, and what learners can expect from you."
              />
              <p className="mt-1 text-xs text-slate-500">
                Describe your background, mentoring style, and what learners can expect from you.
              </p>
            </div>
          </Field>
          <Field label="What can you help learners with?" error={errors.helpDescription?.message}>
            <div>
              <textarea
                {...register('helpDescription')}
                rows={4}
                className={inputClass}
                placeholder="Explain the problems, goals, or topics you can help learners with."
              />
              <p className="mt-1 text-xs text-slate-500">
                Explain the problems, goals, or topics you can help learners with.
              </p>
            </div>
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
          <Field label="Expected hourly rate (optional, MXC/hour)" error={errors.hourlyRateMxc?.message}>
            <div>
              <input type="number" step="0.01" {...register('hourlyRateMxc')} className={inputClass} placeholder="250" />
              <p className="mt-1 text-xs text-slate-500">
                This is only an estimate. You can configure official packages after approval.
              </p>
            </div>
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

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">Show proof of expertise</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Add links and optional supporting files that help moderators validate your experience faster.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Proof links
              </label>
              <button
                type="button"
                onClick={() => addProofLinkTemplate()}
                className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
              >
                Add link
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {['LinkedIn', 'GitHub', 'Portfolio', 'Proof of work', 'Intro video'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => addProofLinkTemplate(preset)}
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              {proofLinkFields.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-500">
                  Add any proof you want, for example GitHub, Behance, Medium article, case study deck, YouTube intro, portfolio site.
                </div>
              )}

              {proofLinkFields.map((field, index) => (
                <div key={field.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] md:items-start">
                    <div>
                      <input
                        {...register(`proofLinks.${index}.label` as const)}
                        className={inputClass}
                        placeholder="e.g. GitHub, Behance, Article"
                      />
                      {errors.proofLinks?.[index]?.label?.message && (
                        <p className="mt-1.5 text-xs font-semibold text-rose-500">
                          {errors.proofLinks?.[index]?.label?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        {...register(`proofLinks.${index}.url` as const)}
                        className={inputClass}
                        placeholder="https://..."
                      />
                      {errors.proofLinks?.[index]?.url?.message && (
                        <p className="mt-1.5 text-xs font-semibold text-rose-500">
                          {errors.proofLinks?.[index]?.url?.message}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProofLink(index)}
                      className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-slate-600 hover:bg-white"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {typeof errors.proofLinks?.message === 'string' && (
                <p className="text-xs font-semibold text-rose-500">{errors.proofLinks.message}</p>
              )}
            </div>
          </div>
          <Field label="Languages" error={errors.languagesOption?.message}>
            <select {...register('languagesOption')} className={inputClass}>
              <option value="">Select languages</option>
              {LANGUAGE_OPTIONS.map((languageOption) => (
                <option key={languageOption} value={languageOption}>
                  {languageOption}
                </option>
              ))}
            </select>
          </Field>
          {values.languagesOption === 'Other' && (
            <Field label="Custom languages" error={errors.languagesCustom?.message}>
              <input
                {...register('languagesCustom')}
                className={inputClass}
                placeholder="English, Vietnamese, Japanese"
              />
            </Field>
          )}
          <Field label="Location / timezone" error={errors.locationOption?.message}>
            <select {...register('locationOption')} className={inputClass}>
              <option value="">Select location / timezone</option>
              {LOCATION_OPTIONS.map((locationOption) => (
                <option key={locationOption} value={locationOption}>
                  {locationOption}
                </option>
              ))}
            </select>
          </Field>
          {values.locationOption === 'Other' && (
            <Field label="Custom location / timezone" error={errors.locationCustom?.message}>
              <input
                {...register('locationCustom')}
                className={inputClass}
                placeholder="Bangkok, GMT+7"
              />
            </Field>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
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



        <button
          type="submit"
          disabled={loading || isLocked}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {submitButtonLabel || (isEdit ? 'Update profile for review' : 'Submit for mentor review')}
        </button>
      </section>
      </fieldset>
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
      className={`group flex min-h-[170px] flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-slate-50/60 p-5 text-center transition dark:border-slate-800 dark:bg-slate-900/60 ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40'}`}
    >
      <input type="file" disabled={disabled} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => onSelect(event.target.files?.[0])} />
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
