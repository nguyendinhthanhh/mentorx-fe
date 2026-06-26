import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import axios from 'axios'
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Package,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  User,
} from 'lucide-react'

import { FILE_UPLOAD_DIRS, fileApi } from '@/api/fileApi'
import { mentorApi } from '@/api/mentorApi'
import MentorAvailabilityCalendar from '@/components/mentor/MentorAvailabilityCalendar'
import MentorCoursesManager from '@/components/mentor/MentorCoursesManager'
import MentorPackagesManager from '@/components/mentor/MentorPackagesManager'
import MentorProfileForm from '@/components/mentor/MentorProfileForm'
import { useI18n } from '@/i18n/I18nProvider'
import { useAuthStore } from '@/store/authStore'
import { formatMxc } from '@/utils/formatters'
import {
  MentorOfferingResponse,
  MentorProfileAssetRequest,
  MentorProfileAssetResponse,
  MentorProfileAssetType,
} from '@/types'

type SetupTab = 'overview' | 'profile' | 'packages' | 'courses' | 'availability' | 'documents'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500'

interface Props {
  onCancelEdit?: () => void
  initialTab?: SetupTab
}

export default function MentorProfileSetupPage({ onCancelEdit, initialTab = 'profile' }: Props = {}) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<SetupTab>(initialTab)

  const userId = user?.userId

  const { data: mentorProfile, isLoading: profileLoading } = useQuery(
    ['mentorProfile', userId],
    async () => {
      try {
        return await mentorApi.getMentorProfile(userId!)
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return undefined
        }
        throw error
      }
    },
    { enabled: !!userId, retry: false }
  )

  const { data: packages = [] } = useQuery(['mentor-packages', userId], () => mentorApi.getAllMentorPackages(userId!), {
    enabled: !!userId,
  })

  const { data: courses = [] } = useQuery<MentorOfferingResponse[]>(
    ['mentor-courses', userId],
    () => mentorApi.getMentorCourses(userId!),
    { enabled: !!userId }
  )

  const { data: weeklyAvailability } = useQuery(
    ['mentor-availability', userId],
    () => mentorApi.getWeeklyAvailability(userId!),
    { enabled: !!userId }
  )

  const { data: assets = [] } = useQuery(['mentor-profile-assets', userId], () => mentorApi.getProfileAssets(userId!), {
    enabled: !!userId,
  })

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const progress = useMemo(
    () => calculateProgress(user, mentorProfile, packages, weeklyAvailability, assets),
    [assets, mentorProfile, packages, user, weeklyAvailability]
  )
  const tabs: Array<{ id: SetupTab; label: string; icon: any }> = [
    { id: 'overview', label: t('mentor.profile.setup.tabs.overview'), icon: Eye },
    { id: 'profile', label: t('mentor.profile.setup.tabs.profile'), icon: Pencil },
    { id: 'packages', label: t('mentor.profile.setup.tabs.packages'), icon: Package },
    { id: 'courses', label: t('mentor.public.tabs.courses'), icon: FileText },
    { id: 'availability', label: t('mentor.profile.setup.tabs.availability'), icon: Calendar },
    { id: 'documents', label: t('mentor.profile.setup.tabs.documents'), icon: FileText },
  ]

  if (!user) return null

  if (profileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  const achievements = assets.filter((asset) => asset.type === MentorProfileAssetType.ACHIEVEMENT)
  const certificates = assets.filter((asset) => asset.type === MentorProfileAssetType.CERTIFICATE)
  const experiences = assets.filter((asset) => asset.type === MentorProfileAssetType.EXPERIENCE)
  const documents = assets.filter((asset) => asset.type === MentorProfileAssetType.DOCUMENT)

  return (
    <div className="text-slate-950">
      <div className="w-full">


        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <nav className="flex flex-wrap gap-x-2 gap-y-1 border-b border-slate-200 px-4 sm:flex-nowrap sm:overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex h-12 min-w-max items-center gap-2 border-b-2 px-4 text-sm font-black transition sm:h-14 ${
                    active ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>

          <div>
            <main className="w-full min-w-0 p-5 md:p-8">
              {activeTab === 'overview' && (
                <OverviewPanel
                  progress={progress}
                  packages={packages}
                  courses={courses}
                  weeklyAvailability={weeklyAvailability}
                  assets={assets}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'profile' && (
                <MentorProfileForm
                  key={mentorProfile ? `mentor-profile-${mentorProfile.updatedAt}` : 'new-mentor-profile'}
                  userId={user.userId}
                  userEmail={user.email}
                  isEmailVerified={user.emailVerified}
                  initialData={mentorProfile}
                  isEdit={Boolean(mentorProfile)}
                  headingTitle={t('mentor.profile.editPublicTitle')}
                  headingDescription={t('mentor.profile.editPublicDescription')}
                  submitButtonLabel={t('mentor.profile.saveMentorProfile')}
                  successTitle={t('mentor.profile.updated')}
                  successDescription={t('mentor.profile.updatedDescription')}
                  successRedirectTo=""
                  onSaved={async () => {
                    await Promise.all([
                      queryClient.invalidateQueries(['mentorProfile', userId]),
                      queryClient.invalidateQueries(['mentor', userId]),
                      queryClient.invalidateQueries(['mentor-profile-assets', userId]),
                    ])
                    if (onCancelEdit) onCancelEdit()
                  }}
                />
              )}

              {activeTab === 'packages' && <MentorPackagesManager userId={user.userId} />}

              {activeTab === 'courses' && <MentorCoursesManager userId={user.userId} />}

              {activeTab === 'availability' && <MentorAvailabilityCalendar userId={user.userId} />}

              {activeTab === 'documents' && (
                <AssetsPanel
                  userId={user.userId}
                  achievements={achievements}
                  certificates={certificates}
                  experiences={experiences}
                  documents={documents}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

function OverviewPanel({
  progress,
  packages,
  courses,
  weeklyAvailability,
  assets,
  setActiveTab,
}: {
  progress: ReturnType<typeof calculateProgress>
  packages: any[]
  courses: MentorOfferingResponse[]
  weeklyAvailability: any
  assets: MentorProfileAssetResponse[]
  setActiveTab: Dispatch<SetStateAction<SetupTab>>
}) {
  const { t, language } = useI18n()
  const proofCount = assets.length

  const cards = [
    {
      title: t('mentor.profile.setup.cards.account.title'),
      description: t('mentor.profile.setup.cards.account.description'),
      link: '/profile',
      done: true,
      icon: User,
      cta: t('mentor.profile.setup.cards.account.cta'),
    },
    {
      title: t('mentor.profile.setup.cards.public.title'),
      description: t('mentor.profile.setup.cards.public.description'),
      tab: 'profile' as const,
      done: progress.items.some((item) => item.key === 'basics' && item.done),
      icon: Pencil,
      cta: t('mentor.profile.setup.cards.public.cta'),
    },
    {
      title: t('mentor.profile.setup.cards.packages.title'),
      description: t('mentor.profile.setup.cards.packages.description'),
      tab: 'packages' as const,
      done: packages.length > 0,
      icon: Package,
      cta: t('mentor.profile.setup.cards.packages.cta'),
    },
    {
      title: t('mentor.public.tabs.courses'),
      description:
        language === 'vi'
          ? 'Xuat ban khoa hoc hoac hoc lieu thuc te hien thi tren trang mentor cong khai.'
          : 'Publish practical courses or learning products that appear on your public mentor page.',
      tab: 'courses' as const,
      done: courses.length > 0,
      icon: FileText,
      cta: language === 'vi' ? 'Quan ly khoa hoc' : 'Manage Courses',
    },
    {
      title: t('mentor.profile.setup.cards.availability.title'),
      description: t('mentor.profile.setup.cards.availability.description'),
      tab: 'availability' as const,
      done: hasAvailability(weeklyAvailability),
      icon: Calendar,
      cta: t('mentor.profile.setup.cards.availability.cta'),
    },
    {
      title: t('mentor.profile.setup.cards.documents.title'),
      description: t('mentor.profile.setup.cards.documents.description'),
      tab: 'documents' as const,
      done: proofCount > 0,
      icon: FileText,
      cta: t('mentor.profile.setup.cards.documents.cta'),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        {t('mentor.profile.editorNotice')}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon
          const content = (
            <>
              <Icon className={card.done ? 'h-6 w-6 text-emerald-600' : 'h-6 w-6 text-blue-600'} />
              <h3 className="mt-4 text-base font-black text-slate-950">{card.title}</h3>
              <p className="mt-1 text-sm font-medium text-slate-600">{card.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className={card.done ? 'text-xs font-bold text-emerald-600' : 'text-xs font-bold text-amber-600'}>
                  {card.done ? t('common.configured') : t('common.needsAttention')}
                </span>
                <span className="text-sm font-black text-blue-700">{card.cta}</span>
              </div>
            </>
          )

          if (card.link) {
            return (
              <Link
                key={card.title}
                to={card.link}
                className={`rounded-2xl border p-5 text-left transition hover:shadow-sm ${
                  card.done ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50'
                }`}
              >
                {content}
              </Link>
            )
          }

          return (
            <button
              key={card.title}
              type="button"
              onClick={() => card.tab && setActiveTab(card.tab)}
              className={`rounded-2xl border p-5 text-left transition hover:shadow-sm ${
                card.done ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50'
              }`}
            >
              {content}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PreviewCard({ user, mentorProfile }: { user: any; mentorProfile: any }) {
  const { t, language } = useI18n()
  const displayName = user.displayName || user.fullName || 'Mentor'
  const professionalTitle =
    mentorProfile?.headline || mentorProfile?.currentTitle || mentorProfile?.primaryDomain || t('mentor.profile.publicProfile')

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-950">{t('mentor.profile.preview')}</h2>
        <Eye className="h-4 w-4 text-slate-400" />
      </div>

      <div className="text-center">
        <div className="mx-auto h-28 w-28 overflow-hidden rounded-full bg-slate-100">
          {user.avatarUrl ? <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" /> : null}
        </div>
        <h3 className="mt-4 text-xl font-black text-slate-950">{displayName}</h3>
        <p className="mt-1 text-sm font-bold text-slate-600">{professionalTitle}</p>
        <p className="mt-1 text-xs font-medium text-slate-400">{user.email}</p>
        <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
          <ShieldCheck className="h-4 w-4" />
          {t('mentor.profile.accountSource')}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 text-center">
        <MiniStat label={t('mentor.profile.setup.preview.primaryDomain')} value={mentorProfile?.primaryDomain || t('common.unset')} />
        <MiniStat
          label={t('mentor.profile.setup.preview.typicalRate')}
          value={mentorProfile?.hourlyRateMxc ? `${formatMxc(mentorProfile.hourlyRateMxc, language)}/hr` : t('common.unset')}
        />
      </div>

      <Link
        to={`/mentors/${user.userId}`}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
      >
        {t('mentor.profile.viewPublic')}
        <ExternalLink className="h-4 w-4" />
      </Link>
      <Link
        to="/profile"
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
      >
        {t('mentor.profile.openAccountSettings')}
      </Link>
    </div>
  )
}

function CompletionPanel({ progress }: { progress: ReturnType<typeof calculateProgress> }) {
  const { t } = useI18n()
  const progressLabels: Record<string, string> = {
    accountAvatar: t('mentor.profile.setup.progress.accountAvatar'),
    accountDisplayName: t('mentor.profile.setup.progress.accountDisplayName'),
    basics: t('mentor.profile.setup.progress.basics'),
    skills: t('mentor.profile.setup.progress.skills'),
    pricing: t('mentor.profile.setup.progress.pricing'),
    proof: t('mentor.profile.setup.progress.proof'),
    availability: t('mentor.profile.setup.progress.availability'),
  }
  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-950">{t('mentor.profile.completion')}</h2>
        <span className="text-xs font-black text-blue-600">{progress.percent}%</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress.percent}%` }} />
      </div>
      <div className="space-y-3">
        {progress.items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 font-semibold text-slate-600">
              <CheckCircle2 className={`h-4 w-4 ${item.done ? 'text-emerald-600' : 'text-amber-500'}`} />
              {progressLabels[item.key] || item.label}
            </span>
            <span className={item.done ? 'text-xs font-bold text-emerald-600' : 'text-xs font-bold text-amber-600'}>
              {item.done ? t('common.done') : t('common.missing')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AssetsPanel({
  userId,
  achievements,
  certificates,
  experiences,
  documents,
}: {
  userId: string
  achievements: MentorProfileAssetResponse[]
  certificates: MentorProfileAssetResponse[]
  experiences: MentorProfileAssetResponse[]
  documents: MentorProfileAssetResponse[]
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-5">
      <AssetSection
        userId={userId}
        title={t('mentor.profile.setup.assets.experienceItems')}
        type={MentorProfileAssetType.EXPERIENCE}
        assets={experiences}
        placeholder={t('mentor.profile.setup.assets.experiencePlaceholder')}
      />
      <AssetSection userId={userId} title={t('mentor.profile.setup.assets.achievements')} type={MentorProfileAssetType.ACHIEVEMENT} assets={achievements} />
      <AssetSection userId={userId} title={t('mentor.profile.setup.assets.certificates')} type={MentorProfileAssetType.CERTIFICATE} assets={certificates} />
      <AssetSection userId={userId} title={t('mentor.profile.setup.assets.publicDocuments')} type={MentorProfileAssetType.DOCUMENT} assets={documents} />
    </div>
  )
}

function AssetSection({
  userId,
  title,
  type,
  assets,
  placeholder,
}: {
  userId: string
  title: string
  type: MentorProfileAssetType
  assets: MentorProfileAssetResponse[]
  placeholder?: string
}) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<MentorProfileAssetRequest>({
    type,
    title: '',
    issuer: '',
    description: '',
    isFeatured: false,
  })
  const [uploading, setUploading] = useState(false)

  const createMutation = useMutation((payload: MentorProfileAssetRequest) => mentorApi.createProfileAsset(userId, payload), {
    onSuccess: () => {
      queryClient.invalidateQueries(['mentor-profile-assets', userId])
      setOpen(false)
      setForm({ type, title: '', issuer: '', description: '', isFeatured: false })
    },
  })

  const deleteMutation = useMutation((assetId: string) => mentorApi.deleteProfileAsset(assetId), {
    onSuccess: () => {
      queryClient.invalidateQueries(['mentor-profile-assets', userId])
    },
  })

  const uploadAssetFile = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      const response = await fileApi.upload(file, { subDirectory: FILE_UPLOAD_DIRS.PUBLIC_MENTOR_ASSET })
      const isImage = response.fileType?.startsWith('image/')
      setForm((prev) => ({
        ...prev,
        fileUrl: response.fileUrl,
        iconUrl: isImage ? response.fileUrl : prev.iconUrl,
      }))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Section title={title} icon={<FileText className="h-5 w-5" />}>
      <div className="grid gap-3 md:grid-cols-2">
        {assets.map((asset) => (
          <div key={asset.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <AssetThumb asset={asset} />
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-black text-slate-950">{asset.title}</h4>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">{asset.issuer || asset.description || t('mentor.profile.publicProfile')}</p>
              {asset.fileUrl && (
                <a href={asset.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-bold text-blue-600">
                  {t('common.openFile')}
                </a>
              )}
            </div>
            <button type="button" onClick={() => deleteMutation.mutate(asset.id)} className="rounded-xl p-2 text-red-500 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-[96px] items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 text-sm font-black text-blue-600 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4" />
            {t('common.addItem')}
          </button>
        )}
      </div>

      {open && (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            createMutation.mutate(form)
          }}
          className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Title">
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={placeholder}
                required
              />
            </Field>
            <Field label="Issuer / source">
              <input
                className={inputClass}
                value={form.issuer || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, issuer: e.target.value }))}
              />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <textarea
                className={inputClass}
                value={form.description || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </Field>
            <Field label="File or image">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                <input type="file" className="hidden" onChange={(e) => uploadAssetFile(e.target.files?.[0])} />
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {form.fileUrl ? 'Uploaded' : 'Upload file'}
              </label>
            </Field>
            <label className="flex items-center gap-2 self-end text-sm font-bold text-slate-600">
              <input
                type="checkbox"
                checked={Boolean(form.isFeatured)}
                onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
              />
              Feature this item
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isLoading} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">
              {createMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </Section>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-blue-600">{icon}</span>
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Field({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={className}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function AssetThumb({ asset }: { asset: MentorProfileAssetResponse }) {
  const url = asset.iconUrl || asset.fileUrl
  if (url && /\.(png|jpe?g|webp|gif)$/i.test(url)) {
    return <img src={url} alt={asset.title} className="h-12 w-12 rounded-xl object-cover" />
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
      <FileText className="h-5 w-5" />
    </div>
  )
}

function StatusPill({ done, label }: { done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
      <CheckCircle2 className="h-4 w-4" />
      {label}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  )
}

function hasAvailability(weeklyAvailability: any) {
  return Object.values(weeklyAvailability?.weeklySchedule || {}).some(
    (slots: any) => Array.isArray(slots) && slots.length > 0
  )
}

function calculateProgress(user: any, mentorProfile: any, packages: any[], weeklyAvailability: any, assets: MentorProfileAssetResponse[]) {
  const hasProofLinks =
    Boolean(mentorProfile?.portfolioUrl || mentorProfile?.cvUrl || mentorProfile?.certificateUrl) || assets.length > 0

  const items = [
    { key: 'accountAvatar', label: 'Account avatar', done: Boolean(user?.avatarUrl) },
    { key: 'accountDisplayName', label: 'Account display name', done: Boolean(user?.displayName || user?.fullName) },
    {
      key: 'basics',
      label: 'Mentor profile basics',
      done: Boolean(mentorProfile?.headline && mentorProfile?.professionalBio && mentorProfile?.primaryDomain),
    },
    { key: 'skills', label: 'Mentor skills', done: Array.isArray(mentorProfile?.skills) && mentorProfile.skills.length > 0 },
    { key: 'pricing', label: 'Public pricing', done: Number(mentorProfile?.hourlyRateMxc || 0) > 0 || packages.length > 0 },
    { key: 'proof', label: 'Proof and documents', done: hasProofLinks },
    { key: 'availability', label: 'Availability', done: hasAvailability(weeklyAvailability) },
  ]

  const percent = Math.round((items.filter((item) => item.done).length / items.length) * 100)
  return { percent, items }
}
