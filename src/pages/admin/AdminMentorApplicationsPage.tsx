import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileBadge,
  Fingerprint,
  Globe2,
  Lock,
  Mail,
  MessageSquareMore,
  Search,
  ShieldAlert,
  UserRound,
  XCircle,
} from 'lucide-react'
import { adminMentorVerificationApi } from '@/api/adminMentorVerificationApi'
import { useAuthStore } from '@/store/authStore'
import {
  MentorProfileResponse,
  PaginatedResponse,
  PayoutMethod,
  VerificationStatus,
} from '@/types'
import { formatDateTime } from '@/utils/formatters'
import { hasRole } from '@/utils/roleRedirect'

type QueueTab = 'expertise' | 'identity' | 'payout'

type ModerationAction =
  | 'approve-expertise'
  | 'reject-expertise'
  | 'request-more-info'
  | 'suspend'
  | 'approve-identity'
  | 'reject-identity'
  | 'approve-payout'
  | 'reject-payout'

const PAGE_SIZE = 12

const queueTabs: Array<{
  key: QueueTab
  label: string
  description: string
  adminOnly?: boolean
}> = [
  {
    key: 'expertise',
    label: 'Expertise review',
    description: 'Unlock Mentor Mode after the team validates the professional profile.',
  },
  {
    key: 'identity',
    label: 'Identity review',
    description: 'Trust and compliance queue for optional or policy-triggered identity checks.',
  },
  {
    key: 'payout',
    label: 'Payout review',
    description: 'Approve payout destinations before mentors can withdraw earnings.',
    adminOnly: true,
  },
]

const statusTone: Record<VerificationStatus, string> = {
  [VerificationStatus.NOT_SUBMITTED]: 'bg-slate-100 text-slate-600',
  [VerificationStatus.PENDING]: 'bg-amber-100 text-amber-700',
  [VerificationStatus.APPROVED]: 'bg-emerald-100 text-emerald-700',
  [VerificationStatus.REJECTED]: 'bg-rose-100 text-rose-700',
  [VerificationStatus.NEEDS_MORE_INFO]: 'bg-blue-100 text-blue-700',
}

function getStatusLabel(status?: VerificationStatus | null) {
  switch (status) {
    case VerificationStatus.PENDING:
      return 'Pending review'
    case VerificationStatus.APPROVED:
      return 'Approved'
    case VerificationStatus.REJECTED:
      return 'Rejected'
    case VerificationStatus.NEEDS_MORE_INFO:
      return 'Needs more info'
    case VerificationStatus.NOT_SUBMITTED:
    default:
      return 'Not submitted'
  }
}

function getQueueFieldValue(profile: MentorProfileResponse, activeTab: QueueTab) {
  if (activeTab === 'expertise') {
    return profile.primaryDomain || profile.currentTitle || 'Professional profile submitted'
  }

  if (activeTab === 'identity') {
    return profile.documentNumberMasked || profile.identityDocumentType || 'Identity packet submitted'
  }

  return profile.payoutMethod ? getPayoutMethodLabel(profile.payoutMethod) : 'Payout destination submitted'
}

function getPayoutMethodLabel(method?: PayoutMethod | null) {
  switch (method) {
    case PayoutMethod.LOCAL_BANK:
      return 'Local bank account'
    case PayoutMethod.INTERNATIONAL_BANK:
      return 'International bank account'
    case PayoutMethod.PAYPAL:
      return 'PayPal'
    case PayoutMethod.WISE:
      return 'Wise'
    case PayoutMethod.STRIPE_CONNECT:
      return 'Stripe Connect'
    default:
      return 'Payout method'
  }
}

function filterProfiles(items: MentorProfileResponse[], searchQuery: string) {
  if (!searchQuery.trim()) return items
  const query = searchQuery.toLowerCase()
  return items.filter((profile) =>
    [
      profile.user?.fullName,
      profile.user?.email,
      profile.headline,
      profile.currentTitle,
      profile.currentCompany,
      profile.primaryDomain,
      profile.legalName,
      profile.countryOfResidence,
      profile.payoutCountry,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query))
  )
}

export default function AdminMentorApplicationsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const isAdmin = hasRole(user, 'ADMIN')
  const [activeTab, setActiveTab] = useState<QueueTab>('expertise')
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<MentorProfileResponse | null>(null)
  const [pendingAction, setPendingAction] = useState<ModerationAction | null>(null)
  const [reason, setReason] = useState('')

  const expertiseQuery = useQuery(['admin-mentor-expertise', page], () =>
    adminMentorVerificationApi.getExpertiseQueue({ page, size: PAGE_SIZE })
  )

  const identityQuery = useQuery(['admin-mentor-identity', page], () =>
    adminMentorVerificationApi.getIdentityQueue({ page, size: PAGE_SIZE })
  )

  const payoutQuery = useQuery(
    ['admin-mentor-payouts', page],
    () => adminMentorVerificationApi.getPayoutQueue({ page, size: PAGE_SIZE }),
    { enabled: isAdmin }
  )

  const moderationMutation = useMutation(
    async ({ action, profile, note }: { action: ModerationAction; profile: MentorProfileResponse; note: string }) => {
      switch (action) {
        case 'approve-expertise':
          return adminMentorVerificationApi.approveExpertise(profile.userId)
        case 'reject-expertise':
          return adminMentorVerificationApi.rejectExpertise(profile.userId, note)
        case 'request-more-info':
          return adminMentorVerificationApi.requestMoreInfo(profile.userId, note)
        case 'suspend':
          return adminMentorVerificationApi.suspendMentor(profile.userId, note)
        case 'approve-identity':
          return adminMentorVerificationApi.approveIdentity(profile.userId)
        case 'reject-identity':
          return adminMentorVerificationApi.rejectIdentity(profile.userId, note)
        case 'approve-payout':
          return adminMentorVerificationApi.approvePayout(profile.userId)
        case 'reject-payout':
          return adminMentorVerificationApi.rejectPayout(profile.userId, note)
      }
    },
    {
      onSuccess: (_, variables) => {
        toast.success(getSuccessMessage(variables.action))
        queryClient.invalidateQueries('admin-mentor-expertise')
        queryClient.invalidateQueries('admin-mentor-identity')
        queryClient.invalidateQueries('admin-mentor-payouts')
        setPendingAction(null)
        setSelectedProfile(null)
        setReason('')
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'The moderation action could not be completed.')
      },
    }
  )

  const queueMap: Record<QueueTab, PaginatedResponse<MentorProfileResponse> | undefined> = {
    expertise: expertiseQuery.data,
    identity: identityQuery.data,
    payout: payoutQuery.data,
  }

  const queueErrors: Record<QueueTab, any> = {
    expertise: expertiseQuery.error,
    identity: identityQuery.error,
    payout: payoutQuery.error,
  }

  const queueLoading: Record<QueueTab, boolean> = {
    expertise: expertiseQuery.isLoading,
    identity: identityQuery.isLoading,
    payout: payoutQuery.isLoading,
  }

  const activeQueue = queueMap[activeTab]
  const activeItems = useMemo(
    () => filterProfiles(activeQueue?.content ?? [], searchQuery),
    [activeQueue?.content, searchQuery]
  )

  const stats = [
    {
      label: 'Expertise queue',
      value: expertiseQuery.data?.totalElements ?? 0,
      icon: FileBadge,
      tone: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    {
      label: 'Identity queue',
      value: identityQuery.data?.totalElements ?? 0,
      icon: Fingerprint,
      tone: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      label: 'Payout queue',
      value: isAdmin ? payoutQuery.data?.totalElements ?? 0 : 0,
      icon: Banknote,
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
  ]

  const openAction = (profile: MentorProfileResponse, action: ModerationAction) => {
    setSelectedProfile(profile)
    setPendingAction(action)
    setReason('')
  }

  const submitAction = () => {
    if (!selectedProfile || !pendingAction) return
    if (requiresReason(pendingAction) && !reason.trim()) {
      toast.error('Please add a short moderation note before submitting.')
      return
    }
    moderationMutation.mutate({
      action: pendingAction,
      profile: selectedProfile,
      note: reason.trim(),
    })
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <ShieldAlert className="h-3.5 w-3.5" />
              Risk-based mentor verification
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-950 dark:text-white">
                Mentor verification console
              </h1>
              <p className="mt-2 text-sm font-medium leading-6 text-gray-600 dark:text-gray-300">
                Review professional profiles first, then handle identity and payout only when trust, withdrawal,
                or compliance requires it. The queues below match the new Mentor X verification policy.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className={`rounded-[1.5rem] border px-4 py-4 ${item.tone} dark:border-white/10 dark:bg-white/5`}
              >
                <div className="flex items-center justify-between">
                  <item.icon className="h-5 w-5" />
                  <span className="text-2xl font-black">{item.value}</span>
                </div>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-6 pt-6 dark:border-gray-800">
          <div className="flex flex-wrap gap-3">
            {queueTabs.map((tab) => {
              const disabled = tab.adminOnly && !isAdmin
              const total = tab.key === 'expertise'
                ? expertiseQuery.data?.totalElements ?? 0
                : tab.key === 'identity'
                  ? identityQuery.data?.totalElements ?? 0
                  : payoutQuery.data?.totalElements ?? 0

              return (
                <button
                  key={tab.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setActiveTab(tab.key)
                    setPage(0)
                    setSelectedProfile(null)
                  }}
                  className={`inline-flex items-center gap-3 rounded-full border px-4 py-2.5 text-sm font-bold transition ${
                    activeTab === tab.key
                      ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-950'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-950 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-white'
                  } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {tab.adminOnly && <Lock className="h-4 w-4" />}
                  <span>{tab.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === tab.key ? 'bg-white/15 text-white dark:bg-gray-200 dark:text-gray-900' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300'}`}>
                    {total}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="pb-6 pt-4 text-sm text-gray-500 dark:text-gray-400">
            {queueTabs.find((tab) => tab.key === activeTab)?.description}
          </p>
        </div>

        <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, email, domain, country, or company"
                className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400"
              />
            </div>

            {activeTab === 'payout' && !isAdmin && (
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                <Lock className="h-3.5 w-3.5" />
                Payout approvals remain admin-only.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <div className="border-r border-gray-100 dark:border-gray-800">
            {queueLoading[activeTab] ? (
              <QueueSkeleton />
            ) : queueErrors[activeTab] ? (
              <QueueError tab={activeTab} />
            ) : activeItems.length === 0 ? (
              <QueueEmptyState
                title="No items in this queue"
                description="There is nothing waiting in the selected review lane right now."
              />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {activeItems.map((profile) => (
                  <QueueCard
                    key={profile.userId}
                    activeTab={activeTab}
                    profile={profile}
                    isSelected={selectedProfile?.userId === profile.userId}
                    onSelect={() => setSelectedProfile(profile)}
                    onAction={openAction}
                    showPayoutActions={isAdmin}
                  />
                ))}
              </div>
            )}

            {activeQueue && activeQueue.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 dark:border-gray-800">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Page {page + 1} of {activeQueue.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                    disabled={page === 0}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(activeQueue.totalPages - 1, current + 1))}
                    disabled={page >= activeQueue.totalPages - 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <QueueDetailsPanel
            activeTab={activeTab}
            profile={selectedProfile}
            isAdmin={isAdmin}
            onAction={openAction}
          />
        </div>
      </section>

      {selectedProfile && pendingAction && (
        <ModerationModal
          action={pendingAction}
          profile={selectedProfile}
          reason={reason}
          onReasonChange={setReason}
          onClose={() => {
            setPendingAction(null)
            setReason('')
          }}
          onConfirm={submitAction}
          loading={moderationMutation.isLoading}
        />
      )}
    </div>
  )
}

function QueueCard({
  profile,
  activeTab,
  isSelected,
  onSelect,
  onAction,
  showPayoutActions,
}: {
  profile: MentorProfileResponse
  activeTab: QueueTab
  isSelected: boolean
  onSelect: () => void
  onAction: (profile: MentorProfileResponse, action: ModerationAction) => void
  showPayoutActions: boolean
}) {
  const user = profile.user
  const queueStatus =
    activeTab === 'expertise'
      ? profile.expertiseStatus
      : activeTab === 'identity'
        ? profile.identityStatus
        : profile.payoutStatus

  return (
    <div
      className={`px-6 py-5 transition ${isSelected ? 'bg-indigo-50/60 dark:bg-indigo-500/10' : 'hover:bg-gray-50/70 dark:hover:bg-white/5'}`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-start gap-4 text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-black text-white">
            {user?.fullName?.charAt(0)?.toUpperCase() || 'M'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-black text-gray-950 dark:text-white">{user?.fullName || 'Mentor applicant'}</h3>
              <StatusChip status={queueStatus} />
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Mail className="h-3.5 w-3.5" />
              {user?.email}
            </p>
            <p className="mt-3 line-clamp-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              {profile.headline || profile.currentTitle || 'No headline provided yet.'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
              <MetaPill icon={Globe2} label={getQueueFieldValue(profile, activeTab)} />
              {profile.currentCompany && <MetaPill icon={UserRound} label={profile.currentCompany} />}
              <MetaPill icon={CalendarClock} label={formatDateTime(profile.updatedAt || profile.createdAt || new Date().toISOString())} />
            </div>
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <button
            type="button"
            onClick={onSelect}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-950 dark:border-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            <Eye className="h-4 w-4" />
            Review
          </button>

          {activeTab === 'expertise' && (
            <>
              <ActionButton tone="primary" onClick={() => onAction(profile, 'approve-expertise')} icon={CheckCircle2}>
                Approve
              </ActionButton>
              <ActionButton tone="secondary" onClick={() => onAction(profile, 'request-more-info')} icon={MessageSquareMore}>
                Ask for info
              </ActionButton>
              <ActionButton tone="danger" onClick={() => onAction(profile, 'reject-expertise')} icon={XCircle}>
                Reject
              </ActionButton>
            </>
          )}

          {activeTab === 'identity' && (
            <>
              <ActionButton tone="primary" onClick={() => onAction(profile, 'approve-identity')} icon={BadgeCheck}>
                Approve identity
              </ActionButton>
              <ActionButton tone="danger" onClick={() => onAction(profile, 'reject-identity')} icon={XCircle}>
                Reject
              </ActionButton>
            </>
          )}

          {activeTab === 'payout' && showPayoutActions && (
            <>
              <ActionButton tone="primary" onClick={() => onAction(profile, 'approve-payout')} icon={Banknote}>
                Approve payout
              </ActionButton>
              <ActionButton tone="danger" onClick={() => onAction(profile, 'reject-payout')} icon={XCircle}>
                Reject
              </ActionButton>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function QueueDetailsPanel({
  profile,
  activeTab,
  isAdmin,
  onAction,
}: {
  profile: MentorProfileResponse | null
  activeTab: QueueTab
  isAdmin: boolean
  onAction: (profile: MentorProfileResponse, action: ModerationAction) => void
}) {
  if (!profile) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 px-8 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
          <ArrowRight className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-gray-950 dark:text-white">Select a review item</h3>
          <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
            Use the queue on the left to inspect a mentor profile, review status, and complete the next moderation step.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-base font-black text-white dark:bg-white dark:text-gray-950">
            {profile.user?.fullName?.charAt(0)?.toUpperCase() || 'M'}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-gray-950 dark:text-white">{profile.user?.fullName}</h3>
            <p className="truncate text-sm text-gray-500 dark:text-gray-400">{profile.user?.email}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/50">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Professional headline</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100">
            {profile.headline || 'No headline provided.'}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailStat label="Mentor status" value={profile.user?.mentorStatus || 'NOT_APPLIED'} />
        <DetailStat label="Expertise" value={getStatusLabel(profile.expertiseStatus)} />
        <DetailStat label="Identity" value={getStatusLabel(profile.identityStatus)} />
        <DetailStat label="Payout" value={getStatusLabel(profile.payoutStatus)} />
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
        <SectionBlock title="Profile review">
          <DetailLine label="Domain" value={profile.primaryDomain || 'Not provided'} />
          <DetailLine label="Current role" value={profile.currentTitle || 'Not provided'} />
          <DetailLine label="Company" value={profile.currentCompany || 'Not provided'} />
          <DetailLine label="Portfolio" value={profile.portfolioEvidenceUrl || profile.portfolioUrl || 'Not provided'} mono />
          <DetailLine label="LinkedIn" value={profile.linkedinUrl || 'Not provided'} mono />
          <DetailLine label="GitHub" value={profile.githubUrl || 'Not provided'} mono />
        </SectionBlock>

        <SectionBlock title="Identity review">
          <DetailLine label="Country" value={profile.countryOfResidence || 'Not provided'} />
          <DetailLine label="Document type" value={profile.identityDocumentType || 'Not submitted'} />
          <DetailLine label="Document" value={profile.documentNumberMasked || 'Not submitted'} mono />
          <DetailLine label="Identity note" value={profile.identityRejectionReason || profile.expertiseReviewNote || 'No note yet'} />
        </SectionBlock>

        <SectionBlock title="Payout review">
          <DetailLine label="Country" value={profile.payoutCountry || 'Not submitted'} />
          <DetailLine label="Method" value={getPayoutMethodLabel(profile.payoutMethod)} />
          <DetailLine label="Account holder" value={profile.payoutAccountHolderName || 'Not provided'} />
          <DetailLine label="Bank" value={profile.payoutBankName || 'Not provided'} />
          <DetailLine label="Masked account" value={profile.payoutAccountNumberMasked || 'Not provided'} mono />
          <DetailLine label="PayPal" value={profile.paypalEmail || 'Not provided'} mono />
          <DetailLine label="Wise" value={profile.wiseEmail || 'Not provided'} mono />
          <DetailLine label="IBAN / SWIFT" value={[profile.iban, profile.swiftCode].filter(Boolean).join(' / ') || 'Not provided'} mono />
        </SectionBlock>
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Recommended next action</p>
        {activeTab === 'expertise' && (
          <div className="flex flex-wrap gap-2">
            <ActionButton tone="primary" onClick={() => onAction(profile, 'approve-expertise')} icon={CheckCircle2}>
              Approve Mentor Mode
            </ActionButton>
            <ActionButton tone="secondary" onClick={() => onAction(profile, 'request-more-info')} icon={MessageSquareMore}>
              Request more info
            </ActionButton>
            <ActionButton tone="danger" onClick={() => onAction(profile, 'reject-expertise')} icon={XCircle}>
              Reject expertise
            </ActionButton>
            <ActionButton tone="ghost" onClick={() => onAction(profile, 'suspend')} icon={AlertCircle}>
              Suspend mentor
            </ActionButton>
          </div>
        )}

        {activeTab === 'identity' && (
          <div className="flex flex-wrap gap-2">
            <ActionButton tone="primary" onClick={() => onAction(profile, 'approve-identity')} icon={BadgeCheck}>
              Approve identity
            </ActionButton>
            <ActionButton tone="danger" onClick={() => onAction(profile, 'reject-identity')} icon={XCircle}>
              Reject identity
            </ActionButton>
          </div>
        )}

        {activeTab === 'payout' && isAdmin && (
          <div className="flex flex-wrap gap-2">
            <ActionButton tone="primary" onClick={() => onAction(profile, 'approve-payout')} icon={Banknote}>
              Approve payout
            </ActionButton>
            <ActionButton tone="danger" onClick={() => onAction(profile, 'reject-payout')} icon={XCircle}>
              Reject payout
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  )
}

function ModerationModal({
  action,
  profile,
  reason,
  onReasonChange,
  onConfirm,
  onClose,
  loading,
}: {
  action: ModerationAction
  profile: MentorProfileResponse
  reason: string
  onReasonChange: (value: string) => void
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
              Moderation action
            </p>
            <h3 className="mt-2 text-xl font-black text-gray-950 dark:text-white">{getActionTitle(action)}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {profile.user?.fullName} · {profile.user?.email}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-950 dark:border-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {getActionDescription(action)}
          </p>

          {requiresReason(action) && (
            <textarea
              rows={5}
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Add a concise note for the mentor and the moderation log"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-gray-200 px-5 text-sm font-bold text-gray-600 transition hover:border-gray-300 hover:text-gray-950 dark:border-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-gray-950 px-5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
          >
            {loading ? 'Submitting...' : getActionTitle(action)}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusChip({ status }: { status?: VerificationStatus | null }) {
  const normalized = status ?? VerificationStatus.NOT_SUBMITTED
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${statusTone[normalized]}`}>
      {getStatusLabel(normalized)}
    </span>
  )
}

function MetaPill({ icon: Icon, label }: { icon: typeof Globe2; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] dark:bg-gray-800">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-sm font-bold text-gray-950 dark:text-white">{value}</p>
    </div>
  )
}

function DetailLine({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-gray-100 py-3 first:border-t-0 first:pt-0 dark:border-gray-800">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`max-w-[62%] text-right text-sm font-medium text-gray-900 dark:text-gray-100 ${mono ? 'break-all font-mono text-xs' : ''}`}>
        {value}
      </p>
    </div>
  )
}

function SectionBlock({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function ActionButton({
  children,
  tone,
  icon: Icon,
  onClick,
}: {
  children: React.ReactNode
  tone: 'primary' | 'secondary' | 'danger' | 'ghost'
  icon: typeof CheckCircle2
  onClick: () => void
}) {
  const toneClass =
    tone === 'primary'
      ? 'bg-gray-950 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200'
      : tone === 'secondary'
        ? 'border border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300'
        : tone === 'danger'
          ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
          : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-950 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-white'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold transition ${toneClass}`}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </button>
  )
}

function QueueSkeleton() {
  return (
    <div className="space-y-4 px-6 py-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-[1.5rem] border border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-56 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function QueueEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 px-8 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-black text-gray-950 dark:text-white">{title}</h3>
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </div>
  )
}

function QueueError({ tab }: { tab: QueueTab }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 px-8 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-black text-gray-950 dark:text-white">Unable to load this queue</h3>
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
          The {queueTabs.find((item) => item.key === tab)?.label.toLowerCase()} data could not be loaded. Retry after the backend is available.
        </p>
      </div>
    </div>
  )
}

function requiresReason(action: ModerationAction) {
  return action === 'reject-expertise'
    || action === 'request-more-info'
    || action === 'suspend'
    || action === 'reject-identity'
    || action === 'reject-payout'
}

function getActionTitle(action: ModerationAction) {
  switch (action) {
    case 'approve-expertise':
      return 'Approve Mentor Mode'
    case 'reject-expertise':
      return 'Reject expertise review'
    case 'request-more-info':
      return 'Request more information'
    case 'suspend':
      return 'Suspend mentor'
    case 'approve-identity':
      return 'Approve identity'
    case 'reject-identity':
      return 'Reject identity'
    case 'approve-payout':
      return 'Approve payout'
    case 'reject-payout':
      return 'Reject payout'
  }
}

function getActionDescription(action: ModerationAction) {
  switch (action) {
    case 'approve-expertise':
      return 'This will unlock Mentor Mode and keep the account in the user-plus-mentor model.'
    case 'reject-expertise':
      return 'Use this when the professional profile does not meet quality or trust requirements.'
    case 'request-more-info':
      return 'Use this when the mentor can qualify after improving their profile or adding evidence.'
    case 'suspend':
      return 'Suspension removes Mentor Mode access but preserves the user account and user features.'
    case 'approve-identity':
      return 'Use this when identity documentation is sufficient for trust, payout, or compliance.'
    case 'reject-identity':
      return 'Add a specific reason so the mentor can correct or replace the identity submission.'
    case 'approve-payout':
      return 'Approve this payout destination so the mentor can request withdrawals.'
    case 'reject-payout':
      return 'Use this when payout details are incomplete, risky, or non-compliant.'
  }
}

function getSuccessMessage(action: ModerationAction) {
  switch (action) {
    case 'approve-expertise':
      return 'Mentor Mode has been approved.'
    case 'reject-expertise':
      return 'The expertise review has been rejected.'
    case 'request-more-info':
      return 'A revision request has been sent.'
    case 'suspend':
      return 'The mentor has been suspended.'
    case 'approve-identity':
      return 'Identity verification approved.'
    case 'reject-identity':
      return 'Identity verification rejected.'
    case 'approve-payout':
      return 'Payout destination approved.'
    case 'reject-payout':
      return 'Payout destination rejected.'
  }
}
