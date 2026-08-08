import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Globe,
  HelpCircle,
  Loader2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Tag,
  UploadCloud,
  User,
  Video,
} from 'lucide-react'

import { useQuery } from 'react-query'

import { categoryApi } from '@/api/categoryApi'
import { FILE_UPLOAD_DIRS, fileApi } from '@/api/fileApi'
import { mentorApi } from '@/api/mentorApi'
import { skillApi } from '@/api/skillApi'
import { userApi } from '@/api/userApi'
import { useAuthStore } from '@/store/authStore'
import { MentorProfileRequest } from '@/types'
import { deriveLegacyProofFields, getMentorProofLinks, normalizeProofLinks } from '@/utils/proofLinks'

const isDevEnvironment = import.meta.env.DEV


// A small fallback list used only if the browser doesn't support Intl.supportedValuesOf
// (e.g. very old Safari). Modern browsers use the full IANA tz database instead (see below).
const FALLBACK_TIMEZONE_IDS = [
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
  'UTC',
]

function getTimezoneOffsetLabel(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date())
    return parts.find((part) => part.type === 'timeZoneName')?.value || ''
  } catch {
    return ''
  }
}

function getTimezoneOffsetMinutes(timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    }).formatToParts(new Date())
    const raw = parts.find((part) => part.type === 'timeZoneName')?.value || 'GMT+00:00'
    const match = raw.match(/GMT([+-])(\d{2}):(\d{2})/)
    if (!match) return 0
    const sign = match[1] === '-' ? -1 : 1
    return sign * (parseInt(match[2], 10) * 60 + parseInt(match[3], 10))
  } catch {
    return 0
  }
}

// IANA canonicalizes a few zones to older/less recognizable names (e.g. Ho Chi Minh City's
// zone resolves to "Asia/Saigon"). Override just those so the label reads naturally.
const TIMEZONE_DISPLAY_OVERRIDES: Record<string, string> = {
  'Asia/Saigon': 'HÃ  Ná»™i / Há»“ ChÃ­ Minh, Viá»‡t Nam',
  'Asia/Ho_Chi_Minh': 'HÃ  Ná»™i / Há»“ ChÃ­ Minh, Viá»‡t Nam',
}

function formatTimezoneCityLabel(timeZone: string): string {
  if (timeZone === 'UTC') return 'UTC'
  if (TIMEZONE_DISPLAY_OVERRIDES[timeZone]) return TIMEZONE_DISPLAY_OVERRIDES[timeZone]
  const segments = timeZone.split('/')
  const city = segments[segments.length - 1]?.replace(/_/g, ' ') || timeZone
  const region = segments.length > 1 ? segments[0].replace(/_/g, ' ') : ''
  return region ? `${city}, ${region}` : city
}

// Pulls every real IANA timezone the browser knows about (~400 zones) so the list is never
// hardcoded/stale and always matches the current UTC offset (DST-aware). "Etc/GMT*" zones are
// excluded because their sign is inverted from common usage (e.g. "Etc/GMT+7" is actually UTC-7)
// and would be confusing next to city-based zones.
function getAllTimezoneIds(): string[] {
  try {
    if (typeof Intl.supportedValuesOf === 'function') {
      const zones = Intl.supportedValuesOf('timeZone').filter((zone) => !zone.startsWith('Etc/'))
      if (zones.length > 0) return [...zones, 'UTC']
    }
  } catch {
    // fall through to the static fallback list below
  }
  return FALLBACK_TIMEZONE_IDS
}

function buildLocationOptions() {
  const seen = new Set<string>()
  const options = getAllTimezoneIds()
    .map((timeZone) => {
      const offset = getTimezoneOffsetLabel(timeZone)
      if (!offset) return null
      const city = formatTimezoneCityLabel(timeZone)
      const value = `${city}, ${offset}`
      if (seen.has(value)) return null
      seen.add(value)
      return { value, label: `${city} (${offset})`, offsetMinutes: getTimezoneOffsetMinutes(timeZone) }
    })
    .filter((option): option is { value: string; label: string; offsetMinutes: number } => option !== null)
    .sort((a, b) => a.offsetMinutes - b.offsetMinutes || a.label.localeCompare(b.label))
    .map(({ value, label }) => ({ value, label }))

  return options
}

const LOCATION_OPTIONS = buildLocationOptions()

const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'Tiáº¿ng Anh' },
  { value: 'Vietnamese', label: 'Tiáº¿ng Viá»‡t' },
  { value: 'Japanese', label: 'Tiáº¿ng Nháº­t' },
  { value: 'English, Vietnamese', label: 'Anh, Viá»‡t' },
  { value: 'English, Japanese', label: 'Anh, Nháº­t' },
  { value: 'Vietnamese, Japanese', label: 'Viá»‡t, Nháº­t' },
  { value: 'English, Vietnamese, Japanese', label: 'Anh, Viá»‡t, Nháº­t' },
  { value: 'Other', label: 'KhÃ¡c' },
] as const


const EXPERIENCE_OPTIONS = [
  { value: '0.5', label: 'DÆ°á»›i 1 nÄƒm' },
  { value: '1', label: '1 - 3 nÄƒm' },
  { value: '3', label: '3 - 5 nÄƒm' },
  { value: '5', label: '5 - 8 nÄƒm' },
  { value: '8', label: '8 - 12 nÄƒm' },
  { value: '12', label: '12+ nÄƒm' },
] as const

const AVAILABILITY_OPTIONS = [
  { value: 'Flexible', label: 'Linh hoáº¡t' },
  { value: 'Weekdays', label: 'NgÃ y thÆ°á»ng' },
  { value: 'Evenings', label: 'Buá»•i tá»‘i' },
  { value: 'Weekends', label: 'Cuá»‘i tuáº§n' },
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
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-sky-600 focus:ring-4 focus:ring-sky-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white'

const textareaClass = `${inputClass} min-h-[100px] resize-y`
const sectionClass = 'rounded-2xl border border-slate-200 bg-white p-5 sm:p-7'

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

function countCharacters(value?: string) {
  return (value || '').trim().length
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
      .min(20, 'Vui lÃ²ng nháº­p Ã­t nháº¥t 20 kÃ½ tá»±.')
      .max(120, 'TiÃªu Ä‘á» khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 120 kÃ½ tá»±.'),
    currentTitle: z.string().optional(),
    currentCompany: z.string().optional(),
    primaryDomain: z.string().min(2, 'Vui lÃ²ng chá»n lÄ©nh vá»±c chuyÃªn mÃ´n chÃ­nh.'),
    primaryDomainCustom: z.string().optional(),
    skills: z
      .array(z.string().trim().min(1).max(60))
      .min(3, 'Vui lÃ²ng thÃªm Ã­t nháº¥t 3 ká»¹ nÄƒng.')
      .max(15, 'Báº¡n chá»‰ cÃ³ thá»ƒ thÃªm tá»‘i Ä‘a 15 ká»¹ nÄƒng.'),
    professionalBio: z.string().trim(),
    helpDescription: z
      .string()
      .trim()
      .min(40, 'Vui lÃ²ng thÃªm tÃ³m táº¯t vá» nhá»¯ng gÃ¬ há»c viÃªn cÃ³ thá»ƒ ká»³ vá»ng.')
      .max(500, 'Ná»™i dung nÃ y khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 500 kÃ½ tá»±.'),
    yearsOfExperience: z.coerce.number().positive('Vui lÃ²ng chá»n sá»‘ nÄƒm kinh nghiá»‡m.'),
    hourlyRateMxc: z.coerce.number().positive('Má»©c phÃ­ theo giá» pháº£i lá»›n hÆ¡n 0.').optional(),
    availability: z.string().min(1, 'Vui lÃ²ng chá»n khung giá» trá»‘ng.'),
    location: z.string().trim().min(2, 'Vui lÃ²ng nháº­p mÃºi giá» / khu vá»±c cá»§a báº¡n.'),
    languagesOption: z.string().min(1, 'Vui lÃ²ng chá»n Ã­t nháº¥t má»™t ngÃ´n ngá»¯.'),
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
    mentorAgreementAccepted: z.boolean().refine(Boolean, 'Vui lÃ²ng xÃ¡c nháº­n thÃ´ng tin lÃ  chÃ­nh xÃ¡c.'),
    disputePolicyAccepted: z.boolean().refine(Boolean, 'Vui lÃ²ng Ä‘á»“ng Ã½ vá»›i chÃ­nh sÃ¡ch kiá»ƒm duyá»‡t.'),
  })
  .superRefine((value, context) => {
    if (value.primaryDomain === 'Other' && (!value.primaryDomainCustom || value.primaryDomainCustom.trim().length < 2)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lÃ²ng nháº­p lÄ©nh vá»±c chuyÃªn mÃ´n cá»§a báº¡n.',
        path: ['primaryDomainCustom'],
      })
    }

    if (value.languagesOption === 'Other' && (!value.languagesCustom || value.languagesCustom.trim().length < 2)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lÃ²ng nháº­p ngÃ´n ngá»¯ cá»§a báº¡n.',
        path: ['languagesCustom'],
      })
    }

    if (isUrlLike(value.headline)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'TiÃªu Ä‘á» pháº£i lÃ  vÄƒn báº£n thÃ´ng thÆ°á»ng, khÃ´ng Ä‘Æ°á»£c chá»©a URL.',
        path: ['headline'],
      })
    }

    if (isUrlLike(value.currentTitle)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Chá»©c danh pháº£i lÃ  vÄƒn báº£n thÃ´ng thÆ°á»ng, khÃ´ng Ä‘Æ°á»£c chá»©a URL.',
        path: ['currentTitle'],
      })
    }

    if (isUrlLike(value.currentCompany)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'TÃªn cÃ´ng ty pháº£i lÃ  vÄƒn báº£n thÃ´ng thÆ°á»ng, khÃ´ng Ä‘Æ°á»£c chá»©a URL.',
        path: ['currentCompany'],
      })
    }

    const bioLength = countCharacters(value.professionalBio)
    if (bioLength < 50 || bioLength > 500) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Giá»›i thiá»‡u báº£n thÃ¢n cáº§n tá»« 50 Ä‘áº¿n 500 kÃ½ tá»±.',
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
          message: 'Vui lÃ²ng nháº­p tÃªn nhÃ£n.',
          path: ['proofLinks', index, 'label'],
        })
      }

      if (!url) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lÃ²ng nháº­p URL.',
          path: ['proofLinks', index, 'url'],
        })
        continue
      }

      const parsed = parseUrl(url)
      if (!parsed) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lÃ²ng nháº­p URL há»£p lá»‡.',
          path: ['proofLinks', index, 'url'],
        })
      } else if (!isDevEnvironment && ['localhost', '127.0.0.1'].includes(parsed.hostname.toLowerCase())) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Localhost URL khÃ´ng Ä‘Æ°á»£c phÃ©p.',
          path: ['proofLinks', index, 'url'],
        })
      }
    }

    const hasProof = normalizedProofLinks.length > 0 || Boolean(value.cvUrl?.trim() || value.certificateUrl?.trim())
    if (!hasProof) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lÃ²ng thÃªm Ã­t nháº¥t má»™t liÃªn káº¿t nÄƒng lá»±c, CV, hoáº·c chá»©ng chá»‰.',
        path: ['proofLinks'],
      })
    }
  })

type FormValues = z.infer<typeof schema>
type UploadField = 'cvUrl' | 'certificateUrl'

interface InnerProps extends Props {
  domainOptions: { value: string; label: string }[]
  skillSuggestions: string[]
}

export default function MentorProfileForm(props: Props) {
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery(
    ['categories'],
    () => categoryApi.getAllActive(),
    { staleTime: 1000 * 60 * 60 }
  )

  const { data: skills = [], isLoading: isLoadingSkills } = useQuery(
    ['skills'],
    () => skillApi.getAllActive(),
    { staleTime: 1000 * 60 * 60 }
  )

  if (isLoadingCategories || isLoadingSkills) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
        <p className="text-sm font-medium">Đang tải cấu hình biểu mẫu...</p>
      </div>
    )
  }

  const domainOptions = categories.map((c) => ({ value: c.slug, label: c.name }))
  domainOptions.push({ value: 'Other', label: 'Khác' })

  const skillSuggestions = skills.map((s) => s.labelVi || s.labelEn)

  return <MentorProfileFormInner {...props} domainOptions={domainOptions} skillSuggestions={skillSuggestions} />
}

function MentorProfileFormInner({
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
  domainOptions,
  skillSuggestions,
}: InnerProps) {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuthStore()
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')

  const initialDomain = initialData?.primaryDomain || ''
  const initialLanguagesText = initialData?.languages?.join(', ') || ''
  const resolvedDomain = domainOptions.some(o => o.value === initialDomain) ? initialDomain : (initialDomain ? 'Other' : '')
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
      location: initialData?.location || '',
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
  const bioLength = countCharacters(values.professionalBio)
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
      return 'KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n mÃ¡y chá»§. Vui lÃ²ng thá»­ láº¡i sau.'
    }

    const status = err?.response?.status
    if (status === 401) return 'PhiÃªn Ä‘Äƒng nháº­p Ä‘Ã£ háº¿t háº¡n. Vui lÃ²ng Ä‘Äƒng nháº­p láº¡i.'
    if (status === 403) return 'Báº¡n khÃ´ng cÃ³ quyá»n táº£i lÃªn tá»‡p nÃ y.'
    if (status === 413) return 'Tá»‡p quÃ¡ lá»›n. KÃ­ch thÆ°á»›c tá»‘i Ä‘a lÃ  10MB.'
    if (status === 415) return 'Loáº¡i tá»‡p khÃ´ng Ä‘Æ°á»£c há»— trá»£. Vui lÃ²ng táº£i lÃªn PDF, JPG, JPEG, PNG, hoáº·c WEBP.'

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
      setError(`Loáº¡i hÃ¬nh áº£nh khÃ´ng Ä‘Æ°á»£c há»— trá»£.`)
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
      setError(getApiErrorMessage(err, 'Lá»—i khi táº£i áº£nh lÃªn.'))
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
      setError('Äá»‹nh dáº¡ng tá»‡p khÃ´ng Ä‘Æ°á»£c há»— trá»£. Vui lÃ²ng chá»n PDF, JPG, PNG, hoáº·c WEBP.')
      return
    }

    if (file.size > maxUploadBytes) {
      setError('Tá»‡p quÃ¡ lá»›n. KÃ­ch thÆ°á»›c tá»‘i Ä‘a lÃ  10MB.')
      return
    }

    setUploading((prev) => ({ ...prev, [field]: true }))
    setError('')
    try {
      const response = await fileApi.upload(file, { subDirectory: FILE_UPLOAD_DIRS.PRIVATE_DOCUMENT })
      setValue(field, response.fileUrl, { shouldDirty: true, shouldValidate: true })
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'KhÃ´ng thá»ƒ táº£i tá»‡p lÃªn. Vui lÃ²ng thá»­ láº¡i.'))
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
      setError('Báº¡n chá»‰ cÃ³ thá»ƒ thÃªm tá»‘i Ä‘a 15 ká»¹ nÄƒng.')
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
        location: data.location.trim() || undefined,
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
      setError(getApiErrorMessage(err, 'KhÃ´ng thá»ƒ gá»­i há»“ sÆ¡ cá»§a báº¡n lÃºc nÃ y.'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-900">
          {successTitle || (isEdit ? 'ÄÃ£ cáº­p nháº­t há»“ sÆ¡' : 'ÄÃ£ gá»­i há»“ sÆ¡ á»©ng tuyá»ƒn')}
        </h3>
        <p className="mx-auto mt-3 max-w-lg text-sm font-semibold text-slate-600">
          {successDescription || 'Há»“ sÆ¡ cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c gá»­i. ChÃºng tÃ´i sáº½ pháº£n há»“i trong vÃ²ng 2-5 ngÃ y lÃ m viá»‡c.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
      {isLocked && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">
          {lockedMessage || 'Há»“ sÆ¡ cá»§a báº¡n Ä‘ang Ä‘Æ°á»£c xÃ©t duyá»‡t. KhÃ´ng thá»ƒ chá»‰nh sá»­a lÃºc nÃ y.'}
        </section>
      )}

      <fieldset disabled={isLocked} className="space-y-5 disabled:cursor-not-allowed disabled:opacity-75">
        
        {/* áº¢nh Ä‘áº¡i diá»‡n & Khá»Ÿi Ä‘áº§u */}
        <section className={sectionClass}>
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex flex-col items-center shrink-0">
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                {values.avatarUrl ? (
                  <img src={values.avatarUrl} alt="Mentor avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-slate-400" />
                )}
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-800 transition hover:bg-sky-100">
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => handleImageUpload(event, 'avatarUrl')}
                  disabled={uploading.avatarUrl || isLocked}
                />
                {uploading.avatarUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                {values.avatarUrl ? 'Äá»•i áº£nh' : 'Táº£i áº£nh lÃªn'}
              </label>

              {values.avatarUrl && (
                <button
                  type="button"
                  onClick={() => setValue('avatarUrl', '', { shouldDirty: true, shouldValidate: true })}
                  className="mt-2 text-[10px] font-bold text-slate-400 hover:text-slate-600"
                >
                  Gá»¡ áº£nh
                </button>
              )}
            </div>

            <div className="md:border-l md:border-slate-200 md:pl-6">
              <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700">
                <CheckCircle2 className="w-3 h-3" />
                áº¤n tÆ°á»£ng Ä‘áº§u tiÃªn
              </div>
              <h3 className="text-xl font-black text-slate-900">HÃ¬nh áº£nh chuyÃªn nghiá»‡p, dá»… nháº­n diá»‡n</h3>
              <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed max-w-lg">
                áº¢nh Ä‘áº¡i diá»‡n rÃµ nÃ©t, khuÃ´n máº·t thÃ¢n thiá»‡n sáº½ giÃºp há»c viÃªn tin tÆ°á»Ÿng báº¡n hÆ¡n vÃ  tÄƒng tá»· lá»‡ booking. File há»— trá»£: JPG, PNG, WEBP (tá»‘i Ä‘a 10MB).
              </p>
            </div>
          </div>
        </section>

        {/* ThÃ´ng tin chuyÃªn mÃ´n */}
        <SectionCard
          eyebrow="ThÃ´ng tin cÃ¡ nhÃ¢n"
          title="Äá»‹nh vá»‹ chuyÃªn mÃ´n cá»§a báº¡n"
          description="Giá»›i thiá»‡u nhanh vá» báº¡n, lÄ©nh vá»±c máº¡nh nháº¥t vÃ  cÃ¡c ká»¹ nÄƒng cá»‘t lÃµi."
          icon={<Sparkles className="h-5 w-5" />}
          tone="indigo"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="TiÃªu Ä‘á» (Headline)"
              description="Má»™t cÃ¢u ngáº¯n gá»n tÃ³m táº¯t vá»‹ tháº¿ cá»§a báº¡n."
              error={errors.headline?.message}
            >
              <input
                {...register('headline')}
                className={inputClass}
                placeholder="VD: Senior Backend Engineer giÃºp báº¡n master Spring Boot"
              />
            </Field>

            <Field
              label="LÄ©nh vá»±c chÃ­nh"
              description="Há»— trá»£ phÃ¢n loáº¡i há»“ sÆ¡ cá»§a báº¡n."
              error={errors.primaryDomain?.message}
            >
              <select {...register('primaryDomain')} className={inputClass}>
                <option value="">Chá»n lÄ©nh vá»±c cá»§a báº¡n</option>
                {domainOptions.map((domain) => (
                  <option key={domain.value} value={domain.value}>
                    {domain.label}
                  </option>
                ))}
              </select>
            </Field>

            {values.primaryDomain === 'Other' && (
              <div className="md:col-span-2">
                <Field
                  label="LÄ©nh vá»±c khÃ¡c"
                  error={errors.primaryDomainCustom?.message}
                >
                  <input {...register('primaryDomainCustom')} className={inputClass} placeholder="VD: Luáº­t, Kiáº¿n trÃºc, Nha khoa" />
                </Field>
              </div>
            )}

            <div className="md:col-span-2">
              <Field
                label="Ká»¹ nÄƒng (Skills)"
                description="ThÃªm 3 - 15 ká»¹ nÄƒng cá»‘t lÃµi mÃ  báº¡n tá»± tin mentor."
                error={errors.skills?.message as string | undefined}
              >
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(values.skills || []).map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="group flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-200"
                      >
                        <Tag className="h-3 w-3 text-emerald-500 group-hover:text-emerald-600" />
                        {skill}
                        <span className="text-emerald-400 group-hover:text-emerald-600">&times;</span>
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
                      placeholder="Nháº­p tÃªn ká»¹ nÄƒng vÃ  nháº¥n Enter..."
                    />
                    <button
                      type="button"
                      onClick={() => addSkill(skillInput)}
                      className="shrink-0 rounded-xl bg-emerald-600 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 hover:bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-600"
                    >
                      ThÃªm
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs font-semibold text-slate-400">Gá»£i Ã½:</span>
                    {skillSuggestions.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200/80 px-2.5 py-1 text-[10px] font-bold text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                      >
                        <Tag className="h-3 w-3" />
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* Giá»›i thiá»‡u chi tiáº¿t */}
        <SectionCard
          eyebrow="Giá»›i thiá»‡u báº£n thÃ¢n"
          title="Ká»ƒ cÃ¢u chuyá»‡n nghá» nghiá»‡p cá»§a báº¡n"
          description="Cho há»c viÃªn biáº¿t phong cÃ¡ch mentor cá»§a báº¡n vÃ  há» sáº½ Ä‘áº¡t Ä‘Æ°á»£c gÃ¬ khi lÃ m viá»‡c vá»›i báº¡n."
          icon={<FileText className="h-5 w-5" />}
          tone="emerald"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field
                label="Tiá»ƒu sá»­ chuyÃªn mÃ´n"
                description="Ká»ƒ vá» kinh nghiá»‡m, ngÃ nh nghá» Ä‘Ã£ lÃ m vÃ  nhá»¯ng ai báº¡n thÃ­ch giÃºp Ä‘á»¡."
                hint={`${bioLength}/500 kÃ½ tá»± Â· tá»‘i thiá»ƒu 50 kÃ½ tá»±`}
                error={errors.professionalBio?.message}
              >
                <textarea
                  {...register('professionalBio')}
                  rows={6}
                  maxLength={500}
                  className={textareaClass}
                  placeholder="Chia sáº» vá» con Ä‘Æ°á»ng sá»± nghiá»‡p cá»§a báº¡n..."
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field
                label="Há»c viÃªn sáº½ nháº­n Ä‘Æ°á»£c gÃ¬?"
                description="VD: Luyá»‡n phá»ng váº¥n, Review CV, Roadmap nghá» nghiá»‡p..."
                error={errors.helpDescription?.message}
              >
                <textarea
                  {...register('helpDescription')}
                  rows={4}
                  className={textareaClass}
                  placeholder="MÃ´ táº£ cá»¥ thá»ƒ nhá»¯ng giÃ¡ trá»‹ báº¡n mang láº¡i sau khÃ³a há»c..."
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* ThÃ´ng tin cÆ¡ báº£n */}
        <SectionCard
          eyebrow="Kinh nghiá»‡m & Dá»‹ch vá»¥"
          title="Chá»©c danh vÃ  Má»©c phÃ­"
          description="Bá»• sung chá»©c danh hiá»‡n táº¡i vÃ  thiáº¿t láº­p má»©c phÃ­ cÆ¡ báº£n cho cÃ¡c buá»•i há»c."
          icon={<Briefcase className="h-5 w-5" />}
          tone="amber"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Chá»©c vá»¥ hiá»‡n táº¡i" error={errors.currentTitle?.message}>
              <input {...register('currentTitle')} className={inputClass} placeholder="VD: Senior Product Designer" />
            </Field>

            <Field label="CÃ´ng ty" error={errors.currentCompany?.message}>
              <input {...register('currentCompany')} className={inputClass} placeholder="VD: FPT Software, Tá»± do..." />
            </Field>

            <Field label="Sá»‘ nÄƒm kinh nghiá»‡m" error={errors.yearsOfExperience?.message}>
              <select {...register('yearsOfExperience')} className={inputClass}>
                <option value="">Chá»n sá»‘ nÄƒm</option>
                {EXPERIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>

            <Field label="PhÃ­ dá»± kiáº¿n (MXC/Giá»)" description="Báº¡n cÃ³ thá»ƒ thay Ä‘á»•i sau." error={errors.hourlyRateMxc?.message}>
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

            <Field
              label="MÃºi giá» (Khu vá»±c)"
              description="GÃµ Ä‘á»ƒ tÃ¬m theo tÃªn thÃ nh phá»‘ hoáº·c chá»n tá»« gá»£i Ã½."
              error={errors.location?.message}
            >
              <Combobox
                value={values.location}
                onChange={(next) => setValue('location', next, { shouldDirty: true, shouldValidate: true })}
                options={LOCATION_OPTIONS}
                placeholder="VD: Há»“ ChÃ­ Minh, GMT+7"
                disabled={isLocked}
              />
            </Field>

            <Field label="NgÃ´n ngá»¯" error={errors.languagesOption?.message}>
              <select {...register('languagesOption')} className={inputClass}>
                <option value="">Chá»n ngÃ´n ngá»¯ giao tiáº¿p</option>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>

            {values.languagesOption === 'Other' && (
              <Field label="NgÃ´n ngá»¯ khÃ¡c" error={errors.languagesCustom?.message}>
                <input {...register('languagesCustom')} className={inputClass} placeholder="VD: Tiáº¿ng HÃ n..." />
              </Field>
            )}

            <Field label="Khung giá» hoáº¡t Ä‘á»™ng" error={errors.availability?.message}>
              <select {...register('availability')} className={inputClass}>
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>
          </div>
        </SectionCard>

        {/* NÄƒng lá»±c & Báº±ng chá»©ng */}
        <SectionCard
          eyebrow="Há»“ sÆ¡ nÄƒng lá»±c"
          title="Minh chá»©ng ká»¹ nÄƒng cá»§a báº¡n"
          description="Cung cáº¥p cÃ¡c link profile (LinkedIn, GitHub) hoáº·c CV Ä‘á»ƒ tÄƒng Ä‘á»™ uy tÃ­n."
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
                + ThÃªm link tÃ¹y chá»‰nh
              </button>
            </div>

            {proofLinkFields.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-5 py-6 text-center text-sm font-semibold text-slate-400">
                ChÆ°a cÃ³ liÃªn káº¿t nÃ o. HÃ£y thÃªm LinkedIn, GitHub, hoáº·c Portfolio cá»§a báº¡n.
              </div>
            ) : (
              <div className="space-y-3">
                {proofLinkFields.map((field, index) => (
                  <div key={field.id} className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-xl border border-slate-200/60 bg-white/60 p-3 shadow-sm">
                    <div className="w-full sm:w-1/3">
                      <input
                        {...register(`proofLinks.${index}.label` as const)}
                        className={inputClass}
                        placeholder="TÃªn nhÃ£n (VD: LinkedIn)"
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
                      XÃ³a
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
                title="SÆ¡ yáº¿u lÃ½ lá»‹ch (CV)"
                description="Äá» xuáº¥t PDF. Tá»‘i Ä‘a 10MB."
                busy={Boolean(uploading.cvUrl)}
                value={values.cvUrl}
                disabled={isLocked}
                onSelect={(file) => uploadFile('cvUrl', file)}
              />
              <UploadFieldCard
                title="Chá»©ng chá»‰ (TÃ¹y chá»n)"
                description="HÃ¬nh áº£nh hoáº·c PDF. Tá»‘i Ä‘a 10MB."
                busy={Boolean(uploading.certificateUrl)}
                value={values.certificateUrl}
                disabled={isLocked}
                onSelect={(file) => uploadFile('certificateUrl', file)}
              />
            </div>
          </div>
        </SectionCard>

        {/* Cam káº¿t & Submit */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="mb-6 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                {...register('mentorAgreementAccepted')}
                className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
              />
              <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                TÃ´i cam káº¿t nhá»¯ng thÃ´ng tin trÃªn lÃ  chÃ­nh xÃ¡c vÃ  pháº£n Ã¡nh Ä‘Ãºng kinh nghiá»‡m thá»±c táº¿ cá»§a báº£n thÃ¢n.
              </span>
            </label>
            {errors.mentorAgreementAccepted && <p className="ml-8 text-xs font-bold text-rose-500">{errors.mentorAgreementAccepted.message}</p>}

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                {...register('disputePolicyAccepted')}
                className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
              />
              <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                TÃ´i Ä‘á»“ng Ã½ vá»›i chÃ­nh sÃ¡ch cá»§a Mentor X vá» viá»‡c kiá»ƒm duyá»‡t há»“ sÆ¡ vÃ  Ä‘áº£m báº£o cháº¥t lÆ°á»£ng mentor.
              </span>
            </label>
            {errors.disputePolicyAccepted && <p className="ml-8 text-xs font-bold text-rose-500">{errors.disputePolicyAccepted.message}</p>}
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200/60 pt-6">
            <p className="text-sm font-medium text-slate-500">
              Thá»i gian xÃ©t duyá»‡t thÃ´ng thÆ°á»ng tá»« <span className="font-bold text-slate-900">2-5 ngÃ y lÃ m viá»‡c</span>.
            </p>
            <button
              type="submit"
              disabled={loading || isLocked}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-8 text-sm font-semibold text-white transition hover:bg-slate-800 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
              {submitButtonLabel || (isEdit ? 'Cáº­p nháº­t há»“ sÆ¡' : 'Gá»­i há»“ sÆ¡ Ä‘Äƒng kÃ½')}
            </button>
          </div>
        </div>

      </fieldset>
    </form>
  )
}

function Combobox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setQuery(value)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, value])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredOptions = normalizedQuery
    ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
    : options

  const selectOption = (option: { value: string; label: string }) => {
    onChange(option.value)
    setQuery(option.value)
    setOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        event.preventDefault()
        setOpen(true)
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((index) => Math.min(index + 1, filteredOptions.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const option = filteredOptions[highlightedIndex]
      if (option) selectOption(option)
    } else if (event.key === 'Escape') {
      setOpen(false)
      setQuery(value)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          value={query}
          disabled={disabled}
          autoComplete="off"
          onChange={(event) => {
            const nextValue = event.target.value
            setQuery(nextValue)
            onChange(nextValue)
            setOpen(true)
            setHighlightedIndex(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={`${inputClass} pr-12`}
          placeholder={placeholder}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 disabled:cursor-not-allowed"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && !disabled && (
        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs font-semibold text-slate-400">KhÃ´ng tÃ¬m tháº¥y káº¿t quáº£ phÃ¹ há»£p.</div>
          ) : (
            filteredOptions.slice(0, 200).map((option, index) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                  index === highlightedIndex ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
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
    indigo: 'border-sky-200 bg-sky-50 text-sky-700',
    emerald: 'border-sky-200 bg-sky-50 text-sky-700',
    amber: 'border-sky-200 bg-sky-50 text-sky-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
  }

  return (
    <section className={sectionClass}>
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${toneMap[tone]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold text-sky-700">{eyebrow}</p>
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
        {hint && <span className="text-xs font-semibold text-slate-400">{hint}</span>}
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
      className={`group flex min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center transition ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-sky-400 hover:bg-sky-50'}`}
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
          <Loader2 className="h-6 w-6 animate-spin text-sky-700" />
          <p className="mt-3 text-[13px] font-bold text-emerald-700">Äang táº£i tá»‡p lÃªn...</p>
        </div>
      ) : value ? (
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-900">ÄÃ£ Ä‘Ã­nh kÃ¨m {title}</p>
          <p className="mt-1 break-all text-[11px] font-semibold text-slate-500 line-clamp-1">{value}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors group-hover:border-sky-300 group-hover:bg-sky-50 group-hover:text-sky-700">
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-900">{title}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">{description}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white transition-colors group-hover:bg-slate-800">
            <FileText className="h-3 w-3" />
            Chá»n tá»‡p
          </div>
        </div>
      )}
    </label>
  )
}

