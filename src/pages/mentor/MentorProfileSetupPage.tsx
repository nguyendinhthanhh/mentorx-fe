import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Globe2,
  Languages,
  Link2,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  Upload,
  User,
  Video,
  X,
} from 'lucide-react'
import { fileApi } from '@/api/fileApi'
import { mentorApi } from '@/api/mentorApi'
import { userApi } from '@/api/userApi'
import { useAuthStore } from '@/store/authStore'
import {
  MentorProfileAssetRequest,
  MentorProfileAssetResponse,
  MentorProfileAssetType,
  MentorProfileRequest,
  PackageType,
} from '@/types'
import MentorPackagesManager from '@/components/mentor/MentorPackagesManager'
import MentorAvailabilityCalendar from '@/components/mentor/MentorAvailabilityCalendar'

type SetupTab = 'overview' | 'profile' | 'packages' | 'availability' | 'documents'

type ProfileForm = {
  fullName: string
  headline: string
  currentTitle: string
  currentCompany: string
  location: string
  bio: string
  avatarUrl: string
  videoIntroUrl: string
  languages: string[]
  primaryDomain: string
  skillsText: string
  linkedinUrl: string
  githubUrl: string
  portfolioUrl: string
  hourlyRateMxc: number
  yearsOfExperience: number
}

const tabs: Array<{ id: SetupTab; label: string; icon: any }> = [
  { id: 'overview', label: 'Tổng quan', icon: Eye },
  { id: 'profile', label: 'Chỉnh sửa hồ sơ', icon: Pencil },
  { id: 'packages', label: 'Gói mentoring', icon: Package },
  { id: 'availability', label: 'Lịch trống', icon: Calendar },
  { id: 'documents', label: 'Tài liệu', icon: FileText },
]

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500'

interface Props {
  onCancelEdit?: () => void
  initialTab?: SetupTab
}

export default function MentorProfileSetupPage({ onCancelEdit, initialTab = 'profile' }: Props = {}) {
  const queryClient = useQueryClient()
  const { user, refreshUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<SetupTab>(initialTab)
  const [form, setForm] = useState<ProfileForm>(emptyProfileForm())
  const [draftState, setDraftState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [formError, setFormError] = useState('')
  const [uploading, setUploading] = useState<'avatar' | 'video' | null>(null)

  const userId = user?.userId

  const { data: mentorProfile, isLoading: profileLoading } = useQuery(
    ['mentorProfile', userId],
    () => mentorApi.getMentorProfile(userId!),
    { enabled: !!userId, retry: false }
  )

  const { data: packages = [] } = useQuery(
    ['mentor-packages', userId],
    () => mentorApi.getAllMentorPackages(userId!),
    { enabled: !!userId }
  )

  const { data: weeklyAvailability } = useQuery(
    ['mentor-availability', userId],
    () => mentorApi.getWeeklyAvailability(userId!),
    { enabled: !!userId }
  )

  const { data: assets = [] } = useQuery(
    ['mentor-profile-assets', userId],
    () => mentorApi.getProfileAssets(userId!),
    { enabled: !!userId }
  )

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    if (!user || !mentorProfile) return
    setForm({
      fullName: user.fullName || '',
      headline: mentorProfile.headline || '',
      currentTitle: mentorProfile.currentTitle || '',
      currentCompany: mentorProfile.currentCompany || '',
      location: mentorProfile.location || '',
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
      videoIntroUrl: mentorProfile.videoIntroUrl || '',
      languages: mentorProfile.languages?.length ? mentorProfile.languages : ['Tiếng Việt'],
      primaryDomain: mentorProfile.primaryDomain || '',
      skillsText: mentorProfile.primaryDomain || '',
      linkedinUrl: mentorProfile.linkedinUrl || '',
      githubUrl: mentorProfile.githubUrl || '',
      portfolioUrl: mentorProfile.portfolioUrl || '',
      hourlyRateMxc: mentorProfile.hourlyRateMxc || 0,
      yearsOfExperience: mentorProfile.yearsOfExperience || 0,
    })
  }, [mentorProfile, user])

  const saveMutation = useMutation(
    async ({ requireComplete }: { requireComplete: boolean }) => {
      if (!user || !mentorProfile) return
      const missing = getMissingRequiredFields(form)
      if (requireComplete && missing.length > 0) {
        throw new Error(`Cần bổ sung: ${missing.join(', ')}`)
      }

      await userApi.updateUser(user.userId, {
        fullName: form.fullName,
        avatarUrl: form.avatarUrl || undefined,
        bio: form.bio || undefined,
      })

      const payload: MentorProfileRequest = {
        headline: form.headline || undefined,
        currentTitle: form.currentTitle || undefined,
        currentCompany: form.currentCompany || undefined,
        location: form.location || undefined,
        videoIntroUrl: form.videoIntroUrl || undefined,
        languages: form.languages.filter(Boolean),
        primaryDomain: form.primaryDomain || form.skillsText || undefined,
        linkedinUrl: form.linkedinUrl || undefined,
        githubUrl: form.githubUrl || undefined,
        portfolioUrl: form.portfolioUrl || undefined,
        hourlyRateMxc: Number(form.hourlyRateMxc) || undefined,
        yearsOfExperience: Number(form.yearsOfExperience) || undefined,
      }
      await mentorApi.updateMentorProfile(user.userId, payload)
    },
    {
      onMutate: () => {
        setDraftState('saving')
        setFormError('')
      },
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(['mentorProfile', userId]),
          refreshUser(),
        ])
        setDraftState('saved')
      },
      onError: (err: any) => {
        setDraftState('error')
        setFormError(err.message || err.response?.data?.message || 'Không thể lưu hồ sơ.')
      },
    }
  )

  const uploadProfileFile = async (field: 'avatar' | 'video', file?: File) => {
    if (!file) return
    setUploading(field)
    setFormError('')
    try {
      const response = await fileApi.upload(file)
      setForm((prev) => ({
        ...prev,
        [field === 'avatar' ? 'avatarUrl' : 'videoIntroUrl']: response.fileUrl,
      }))
      setDraftState('idle')
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Không thể tải file lên.')
    } finally {
      setUploading(null)
    }
  }

  const progress = useMemo(
    () => calculateProgress(form, packages, weeklyAvailability, assets),
    [form, packages, weeklyAvailability, assets]
  )

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
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Thiết lập hồ sơ Mentor</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Hoàn thiện hồ sơ để tăng độ tin cậy và thu hút mentee phù hợp.
            </p>
          </div>
          <div className="grid min-w-[360px] gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto]">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Tiến độ hoàn thiện hồ sơ</span>
                <span className="text-lg font-black text-slate-950">{progress.percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
            <StatusPill done={Boolean(user.emailVerified)} label="Đã xác minh" />
            <StatusPill done={progress.percent >= 80} label="Hồ sơ nổi bật" />
          </div>
        </header>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <nav className="flex overflow-x-auto border-b border-slate-200 px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex h-14 min-w-max items-center gap-2 border-b-2 px-4 text-sm font-black transition ${
                    active
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>

          <div className="grid gap-0 lg:grid-cols-[330px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
              <PreviewCard form={form} mentorProfile={mentorProfile} userEmail={user.email} />
              <CompletionPanel progress={progress} />
            </aside>

            <main className="min-w-0 p-5 flex flex-col">
              <div className="flex-1">
              {activeTab === 'overview' && (
                <OverviewPanel
                  progress={progress}
                  packages={packages}
                  weeklyAvailability={weeklyAvailability}
                  achievements={achievements}
                  certificates={certificates}
                  experiences={experiences}
                  documents={documents}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileEditPanel
                  form={form}
                  setForm={setForm}
                  uploading={uploading}
                  uploadProfileFile={uploadProfileFile}
                />
              )}

              {activeTab === 'packages' && <MentorPackagesManager userId={user.userId} />}

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
              </div>
            <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 border-t border-slate-200 bg-white/95 px-5 py-3 shadow-2xl backdrop-blur z-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {draftState === 'saving' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  ) : draftState === 'error' ? (
                    <X className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  <span className={draftState === 'error' ? 'text-red-600' : 'text-slate-600'}>
                    {draftState === 'saving'
                      ? 'Đang lưu...'
                      : draftState === 'saved'
                        ? 'Đã lưu thay đổi'
                        : draftState === 'error'
                          ? formError
                          : 'Sẵn sàng cập nhật hồ sơ'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {onCancelEdit && (
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" />
                      Hủy
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => saveMutation.mutate({ requireComplete: false })}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    <Save className="h-4 w-4" />
                    Lưu nháp
                  </button>
                  {onCancelEdit ? (
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Xem trước
                    </button>
                  ) : (
                    <Link
                      to={`/mentors/${user.userId}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Xem trước
                    </Link>
                  )}
                  <button
                    type="button"
                    disabled={saveMutation.isLoading}
                    onClick={() => saveMutation.mutate({ requireComplete: true })}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {saveMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Cập nhật hồ sơ
                  </button>
                </div>
              </div>
            </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileEditPanel({
  form,
  setForm,
  uploading,
  uploadProfileFile,
}: {
  form: ProfileForm
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>
  uploading: 'avatar' | 'video' | null
  uploadProfileFile: (field: 'avatar' | 'video', file?: File) => Promise<void>
}) {
  const update = (field: keyof ProfileForm, value: any) => setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="space-y-5">
      <Section title="Thông tin cơ bản" icon={<User className="h-5 w-5" />}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Họ và tên">
              <input className={inputClass} value={form.fullName} onChange={(e) => update('fullName', e.target.value)} />
            </Field>
            <Field label="Chức danh">
              <input className={inputClass} value={form.currentTitle} onChange={(e) => update('currentTitle', e.target.value)} />
            </Field>
            <Field label="Công ty hiện tại">
              <input className={inputClass} value={form.currentCompany} onChange={(e) => update('currentCompany', e.target.value)} />
            </Field>
            <Field label="Địa điểm">
              <input className={inputClass} value={form.location} onChange={(e) => update('location', e.target.value)} />
            </Field>
            <Field label="Headline" className="md:col-span-2">
              <input className={inputClass} value={form.headline} onChange={(e) => update('headline', e.target.value)} />
            </Field>
          </div>

          <div className="space-y-4">
            <UploadTile
              label="Ảnh đại diện"
              accept="image/*"
              url={form.avatarUrl}
              busy={uploading === 'avatar'}
              onFile={(file) => uploadProfileFile('avatar', file)}
            />
            <UploadTile
              label="Video giới thiệu"
              accept="video/*"
              url={form.videoIntroUrl}
              busy={uploading === 'video'}
              onFile={(file) => uploadProfileFile('video', file)}
              video
            />
          </div>
        </div>
      </Section>

      <Section title="Giới thiệu bản thân" icon={<Pencil className="h-5 w-5" />}>
        <textarea
          className={`${inputClass} min-h-[150px] resize-y leading-6`}
          value={form.bio}
          maxLength={1000}
          onChange={(e) => update('bio', e.target.value)}
        />
        <div className="mt-2 text-right text-xs font-semibold text-slate-400">{form.bio.length}/1000</div>
      </Section>

      <Section title="Chuyên môn & kỹ năng" icon={<Award className="h-5 w-5" />}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Lĩnh vực chính">
            <input className={inputClass} value={form.primaryDomain} onChange={(e) => update('primaryDomain', e.target.value)} />
          </Field>
          <Field label="Kỹ năng nổi bật">
            <input className={inputClass} value={form.skillsText} onChange={(e) => update('skillsText', e.target.value)} placeholder="UX/UI Design, Career Coaching..." />
          </Field>
          <Field label="Số năm kinh nghiệm">
            <input type="number" className={inputClass} value={form.yearsOfExperience} onChange={(e) => update('yearsOfExperience', Number(e.target.value))} />
          </Field>
          <Field label="Rate mặc định (MXC)">
            <input type="number" className={inputClass} value={form.hourlyRateMxc} onChange={(e) => update('hourlyRateMxc', Number(e.target.value))} />
          </Field>
          <Field label="Response time">
            <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-900">
              Response time is automatically calculated from real message activity.
            </div>
          </Field>
          <Field label="Ngôn ngữ">
            <input
              className={inputClass}
              value={form.languages.join(', ')}
              onChange={(e) => update('languages', e.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
            />
          </Field>
        </div>
      </Section>

      <Section title="Liên kết & mạng xã hội" icon={<Link2 className="h-5 w-5" />}>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="LinkedIn">
            <input className={inputClass} value={form.linkedinUrl} onChange={(e) => update('linkedinUrl', e.target.value)} />
          </Field>
          <Field label="GitHub">
            <input className={inputClass} value={form.githubUrl} onChange={(e) => update('githubUrl', e.target.value)} />
          </Field>
          <Field label="Portfolio / Website">
            <input className={inputClass} value={form.portfolioUrl} onChange={(e) => update('portfolioUrl', e.target.value)} />
          </Field>
        </div>
      </Section>
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
  return (
    <div className="space-y-5">
      <AssetSection userId={userId} title="Kinh nghiệm làm việc" type={MentorProfileAssetType.EXPERIENCE} assets={experiences} placeholder="Google, TechCorp..." />
      <AssetSection userId={userId} title="Thành tựu" type={MentorProfileAssetType.ACHIEVEMENT} assets={achievements} />
      <AssetSection userId={userId} title="Chứng chỉ" type={MentorProfileAssetType.CERTIFICATE} assets={certificates} />
      <AssetSection userId={userId} title="Tài liệu hồ sơ" type={MentorProfileAssetType.DOCUMENT} assets={documents} />
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
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<MentorProfileAssetRequest>({ type, title: '', issuer: '', description: '', isFeatured: false })
  const [uploading, setUploading] = useState(false)

  const createMutation = useMutation((payload: MentorProfileAssetRequest) => mentorApi.createProfileAsset(userId, payload), {
    onSuccess: () => {
      queryClient.invalidateQueries(['mentor-profile-assets', userId])
      setOpen(false)
      setForm({ type, title: '', issuer: '', description: '', isFeatured: false })
    },
  })

  const deleteMutation = useMutation((assetId: string) => mentorApi.deleteProfileAsset(assetId), {
    onSuccess: () => queryClient.invalidateQueries(['mentor-profile-assets', userId]),
  })

  const uploadAssetFile = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      const response = await fileApi.upload(file)
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
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">{asset.issuer || asset.description || 'Mentor X'}</p>
              {asset.fileUrl && (
                <a href={asset.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-bold text-blue-600">
                  Xem file
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(asset.id)}
              className="rounded-xl p-2 text-red-500 hover:bg-red-50"
            >
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
            Thêm mới
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
            <Field label="Tiêu đề">
              <input className={inputClass} value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder={placeholder} required />
            </Field>
            <Field label="Tổ chức / nguồn">
              <input className={inputClass} value={form.issuer || ''} onChange={(e) => setForm((prev) => ({ ...prev, issuer: e.target.value }))} />
            </Field>
            <Field label="Mô tả" className="md:col-span-2">
              <textarea className={inputClass} value={form.description || ''} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </Field>
            <Field label="File / ảnh">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                <input type="file" className="hidden" onChange={(e) => uploadAssetFile(e.target.files?.[0])} />
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {form.fileUrl ? 'Đã tải lên' : 'Tải file'}
              </label>
            </Field>
            <label className="flex items-center gap-2 self-end text-sm font-bold text-slate-600">
              <input
                type="checkbox"
                checked={Boolean(form.isFeatured)}
                onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
              />
              Hiển thị nổi bật
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">
              Hủy
            </button>
            <button type="submit" disabled={createMutation.isLoading} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">
              {createMutation.isLoading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      )}
    </Section>
  )
}

function OverviewPanel({ progress, packages, weeklyAvailability, achievements, certificates, experiences, documents, setActiveTab }: any) {
  const cards = [
    { tab: 'profile', title: 'Thông tin hồ sơ', done: progress.percent >= 50, icon: User },
    { tab: 'packages', title: 'Gói mentoring', done: packages.length > 0, icon: Package },
    { tab: 'availability', title: 'Lịch trống', done: hasAvailability(weeklyAvailability), icon: Calendar },
    { tab: 'documents', title: 'Kinh nghiệm & Chứng chỉ', done: achievements.length + certificates.length + experiences.length + documents.length > 0, icon: Award },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <button
            key={card.tab}
            type="button"
            onClick={() => setActiveTab(card.tab)}
            className={`rounded-2xl border p-5 text-left transition hover:shadow-sm ${
              card.done ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
            }`}
          >
            <Icon className={card.done ? 'h-6 w-6 text-emerald-600' : 'h-6 w-6 text-amber-600'} />
            <h3 className="mt-4 text-base font-black text-slate-950">{card.title}</h3>
            <p className="mt-1 text-sm font-medium text-slate-600">{card.done ? 'Đã hoàn tất' : 'Cần cập nhật'}</p>
          </button>
        )
      })}
    </div>
  )
}

function PreviewCard({ form, mentorProfile, userEmail }: { form: ProfileForm; mentorProfile: any; userEmail: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-950">Xem trước hồ sơ</h2>
        <Eye className="h-4 w-4 text-slate-400" />
      </div>
      <div className="text-center">
        <div className="mx-auto h-28 w-28 overflow-hidden rounded-full bg-slate-100">
          {form.avatarUrl ? <img src={form.avatarUrl} alt={form.fullName} className="h-full w-full object-cover" /> : null}
        </div>
        <h3 className="mt-4 text-xl font-black text-slate-950">{form.fullName || 'Mentor X'}</h3>
        <p className="mt-1 text-sm font-bold text-slate-600">{form.headline || form.currentTitle || 'Mentor'}</p>
        <p className="mt-1 text-xs font-medium text-slate-400">{form.currentCompany || userEmail}</p>
        <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-black text-amber-700">
          <Star className="h-4 w-4 fill-current" />
          {(mentorProfile?.averageRating || 4.9).toFixed(1)}
          <span className="text-xs font-semibold text-slate-500">({mentorProfile?.totalReviews || 0} đánh giá)</span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <MiniStat label="Tỷ lệ phản hồi" value={`${Math.round(Number(mentorProfile?.successRate || 98))}%`} />
        <MiniStat label="Response" value={mentorProfile?.responseTimeHours ? `${mentorProfile.responseTimeHours} hours` : "Response time will be calculated after more activity."} />
        <MiniStat label="Mentoring" value={`${mentorProfile?.totalJobsDone || 0} job`} />
      </div>
      <Link
        to={`/mentors/${mentorProfile?.userId || ''}`}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
      >
        Xem trước hồ sơ
        <ExternalLink className="h-4 w-4" />
      </Link>
    </div>
  )
}

function CompletionPanel({ progress }: { progress: ReturnType<typeof calculateProgress> }) {
  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-950">Hoàn thiện hồ sơ</h2>
        <span className="text-xs font-black text-blue-600">{progress.percent}% hoàn thành</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress.percent}%` }} />
      </div>
      <div className="space-y-3">
        {progress.items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 font-semibold text-slate-600">
              <CheckCircle2 className={`h-4 w-4 ${item.done ? 'text-emerald-600' : 'text-amber-500'}`} />
              {item.label}
            </span>
            <span className={item.done ? 'text-xs font-bold text-emerald-600' : 'text-xs font-bold text-amber-600'}>
              {item.done ? 'Hoàn tất' : 'Cần cập nhật'}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs font-semibold leading-5 text-slate-500">
        Mẹo: video giới thiệu, lịch trống rõ ràng và gói mentoring cụ thể giúp hồ sơ có tỷ lệ booking tốt hơn.
      </div>
    </div>
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

function UploadTile({
  label,
  accept,
  url,
  busy,
  onFile,
  video,
}: {
  label: string
  accept: string
  url?: string
  busy: boolean
  onFile: (file?: File) => void
  video?: boolean
}) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <input type="file" accept={accept} className="hidden" onChange={(event) => onFile(event.target.files?.[0])} />
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-20 items-center justify-center overflow-hidden rounded-xl bg-white">
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          ) : url && video ? (
            <Video className="h-6 w-6 text-blue-600" />
          ) : url ? (
            <img src={url} alt={label} className="h-full w-full object-cover" />
          ) : (
            <Upload className="h-5 w-5 text-slate-400" />
          )}
        </div>
        <span className="text-sm font-black text-blue-600">{url ? 'Thay đổi' : 'Tải lên'}</span>
      </div>
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

function emptyProfileForm(): ProfileForm {
  return {
    fullName: '',
    headline: '',
    currentTitle: '',
    currentCompany: '',
    location: '',
    bio: '',
    avatarUrl: '',
    videoIntroUrl: '',
    languages: ['Tiếng Việt'],
    primaryDomain: '',
    skillsText: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    hourlyRateMxc: 0,
    yearsOfExperience: 0,
  }
}

function getMissingRequiredFields(form: ProfileForm) {
  const required: Array<[string, boolean]> = [
    ['Họ và tên', Boolean(form.fullName.trim())],
    ['Chức danh', Boolean(form.currentTitle.trim() || form.headline.trim())],
    ['Ảnh đại diện', Boolean(form.avatarUrl)],
    ['Giới thiệu bản thân', form.bio.trim().length >= 40],
    ['Chuyên môn', Boolean(form.primaryDomain.trim() || form.skillsText.trim())],
    ['Địa điểm', Boolean(form.location.trim())],
  ]
  return required.filter(([, done]) => !done).map(([label]) => label)
}

function hasAvailability(weeklyAvailability: any) {
  return Object.values(weeklyAvailability?.weeklySchedule || {}).some((slots: any) => Array.isArray(slots) && slots.length > 0)
}

function calculateProgress(form: ProfileForm, packages: any[], weeklyAvailability: any, assets: MentorProfileAssetResponse[]) {
  const items = [
    { label: 'Ảnh đại diện', done: Boolean(form.avatarUrl) },
    { label: 'Giới thiệu bản thân', done: form.bio.trim().length >= 40 },
    { label: 'Chuyên môn & kỹ năng', done: Boolean(form.primaryDomain || form.skillsText) },
    { label: 'Kinh nghiệm làm việc', done: form.yearsOfExperience > 0 || Boolean(form.currentCompany) },
    { label: 'Thành tựu & chứng chỉ', done: assets.some((asset) => asset.type !== MentorProfileAssetType.DOCUMENT) },
    { label: 'Gói mentoring', done: packages.length > 0 },
    { label: 'Lịch rảnh trong tuần', done: hasAvailability(weeklyAvailability) },
    { label: 'Liên kết & mạng xã hội', done: Boolean(form.linkedinUrl || form.portfolioUrl || form.githubUrl) },
  ]
  const percent = Math.round((items.filter((item) => item.done).length / items.length) * 100)
  return { percent, items }
}
