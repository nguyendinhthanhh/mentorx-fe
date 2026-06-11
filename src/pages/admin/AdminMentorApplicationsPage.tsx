import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Fingerprint,
  Github,
  Link2,
  Mail,
  MessageSquareMore,
  Search,
  ShieldCheck,
  Video,
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
import { getMentorProofLinks } from '@/utils/proofLinks'
import { formatDateTime } from '@/utils/formatters'
import { hasRole } from '@/utils/roleRedirect'

type QueueTab = 'expertise' | 'identity' | 'payout'
type QueueStatusFilter = 'all' | VerificationStatus
type DomainFilter = 'all' | string
type ProofFilter = 'any' | 'linkedin' | 'cv' | 'certificate' | 'portfolio' | 'missing'
type SortOption = 'newest' | 'oldest' | 'most-experience' | 'least-experience' | 'needs-attention'
type ReviewTab = 'overview' | 'evidence' | 'notes'

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
const DEFAULT_SORT: SortOption = 'newest'
const DOMAIN_OPTIONS = [
  'Software Engineering',
  'Data & AI',
  'Legal',
  'Marketing',
  'Business',
  'UI/UX Design',
  'Career Coaching',
  'Language Learning',
  'Finance',
  'Other',
] as const

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

const statusFilterOptions: Array<{ label: string; value: QueueStatusFilter }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: VerificationStatus.PENDING },
  { label: 'Needs more info', value: VerificationStatus.NEEDS_MORE_INFO },
  { label: 'Approved', value: VerificationStatus.APPROVED },
  { label: 'Rejected', value: VerificationStatus.REJECTED },
]

const proofFilterOptions: Array<{ label: string; value: ProofFilter }> = [
  { label: 'Any proof', value: 'any' },
  { label: 'Has LinkedIn', value: 'linkedin' },
  { label: 'Has CV', value: 'cv' },
  { label: 'Has Certificate', value: 'certificate' },
  { label: 'Has Portfolio', value: 'portfolio' },
  { label: 'Missing proof', value: 'missing' },
]

const sortOptions: Array<{ label: string; value: SortOption }> = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Most experience', value: 'most-experience' },
  { label: 'Least experience', value: 'least-experience' },
  { label: 'Needs attention', value: 'needs-attention' },
]

function normalizeValue(value?: string | null) {
  return value?.trim().toLowerCase() ?? ''
}

function getQueueStatus(profile: MentorProfileResponse, activeTab: QueueTab) {
  return activeTab === 'expertise'
    ? profile.expertiseStatus
    : activeTab === 'identity'
      ? profile.identityStatus
      : profile.payoutStatus
}

function getEvidenceCount(profile: MentorProfileResponse) {
  return getMentorProofLinks(profile).length
    + (profile.cvUrl ? 1 : 0)
    + (profile.certificateUrl ? 1 : 0)
}

function matchesStatusFilter(
  profile: MentorProfileResponse,
  activeTab: QueueTab,
  statusFilter: QueueStatusFilter
) {
  if (statusFilter === 'all') return true
  return getQueueStatus(profile, activeTab) === statusFilter
}

function getNewestActivity(profile: MentorProfileResponse) {
  return new Date(
    profile.submittedAt || profile.updatedAt || profile.createdAt || new Date().toISOString()
  ).getTime()
}

function hasProofLink(
  profile: MentorProfileResponse,
  candidates: { labels?: string[]; hosts?: string[] }
) {
  return getMentorProofLinks(profile).some((link) => {
    const lowerLabel = normalizeValue(link.label)
    const lowerUrl = normalizeValue(link.url)
    return (
      candidates.labels?.some((label) => lowerLabel.includes(label)) ||
      candidates.hosts?.some((host) => lowerUrl.includes(host))
    )
  })
}

function hasLinkedInProof(profile: MentorProfileResponse) {
  return Boolean(profile.linkedinUrl) || hasProofLink(profile, { labels: ['linkedin'], hosts: ['linkedin.com'] })
}

function hasGitHubProof(profile: MentorProfileResponse) {
  return Boolean(profile.githubUrl) || hasProofLink(profile, { labels: ['github'], hosts: ['github.com'] })
}

function hasPortfolioProof(profile: MentorProfileResponse) {
  return (
    Boolean(profile.portfolioUrl || profile.portfolioEvidenceUrl)
    || hasProofLink(profile, {
      labels: ['portfolio', 'proof of work', 'case study', 'article', 'deck', 'website', 'site'],
      hosts: ['behance.net', 'dribbble.com'],
    })
  )
}

function hasCvProof(profile: MentorProfileResponse) {
  return Boolean(profile.cvUrl)
}

function hasCertificateProof(profile: MentorProfileResponse) {
  return Boolean(profile.certificateUrl)
}

function getProofSummary(profile: MentorProfileResponse) {
  return [
    hasLinkedInProof(profile) ? 'LinkedIn' : null,
    hasGitHubProof(profile) ? 'GitHub' : null,
    hasPortfolioProof(profile) ? 'Portfolio' : null,
    hasCvProof(profile) ? 'CV' : null,
    hasCertificateProof(profile) ? 'Certificate' : null,
  ].filter(Boolean) as string[]
}

function matchesDomainFilter(profile: MentorProfileResponse, domainFilter: DomainFilter) {
  if (domainFilter === 'all') return true
  return normalizeValue(profile.primaryDomain) === normalizeValue(domainFilter)
}

function matchesProofFilter(profile: MentorProfileResponse, proofFilter: ProofFilter) {
  switch (proofFilter) {
    case 'linkedin':
      return hasLinkedInProof(profile)
    case 'cv':
      return hasCvProof(profile)
    case 'certificate':
      return hasCertificateProof(profile)
    case 'portfolio':
      return hasPortfolioProof(profile)
    case 'missing':
      return getMentorProofLinks(profile).length === 0 && !hasCvProof(profile) && !hasCertificateProof(profile)
    case 'any':
    default:
      return true
  }
}

function getNeedsAttentionRank(status?: VerificationStatus | null) {
  switch (status) {
    case VerificationStatus.NEEDS_MORE_INFO:
      return 0
    case VerificationStatus.PENDING:
      return 1
    case VerificationStatus.REJECTED:
      return 2
    case VerificationStatus.APPROVED:
      return 3
    case VerificationStatus.NOT_SUBMITTED:
    default:
      return 4
  }
}

function sortProfiles(items: MentorProfileResponse[], activeTab: QueueTab, sortOption: SortOption) {
  return [...items].sort((a, b) => {
    if (sortOption === 'oldest') {
      return getNewestActivity(a) - getNewestActivity(b)
    }

    if (sortOption === 'most-experience') {
      return (b.yearsOfExperience ?? -1) - (a.yearsOfExperience ?? -1)
    }

    if (sortOption === 'least-experience') {
      return (a.yearsOfExperience ?? Number.MAX_SAFE_INTEGER) - (b.yearsOfExperience ?? Number.MAX_SAFE_INTEGER)
    }

    if (sortOption === 'needs-attention') {
      const rankDiff = getNeedsAttentionRank(getQueueStatus(a, activeTab)) - getNeedsAttentionRank(getQueueStatus(b, activeTab))
      if (rankDiff !== 0) return rankDiff
    }

    return getNewestActivity(b) - getNewestActivity(a)
  })
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
      profile.skills?.join(', '),
      profile.professionalBio,
      profile.helpDescription,
      profile.legalName,
      profile.countryOfResidence,
      profile.payoutCountry,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query))
  )
}

function findProofUrl(profile: MentorProfileResponse, keywords: string[]) {
  return getMentorProofLinks(profile).find((item) => {
    const label = normalizeValue(item.label)
    const url = normalizeValue(item.url)
    return keywords.some((keyword) => label.includes(keyword) || url.includes(keyword))
  })?.url
}

function buildEvidenceRows(profile: MentorProfileResponse, activeTab: QueueTab) {
  const reviewPending = [
    VerificationStatus.PENDING,
    VerificationStatus.NEEDS_MORE_INFO,
  ].includes(getQueueStatus(profile, activeTab) ?? VerificationStatus.NOT_SUBMITTED)

  const proofLinks = getMentorProofLinks(profile)
  const usedUrls = new Set<string>()

  const findProofUrlWithTracking = (keywords: string[]) => {
    const found = proofLinks.find((item) => {
      if (usedUrls.has(item.url)) return false
      const label = normalizeValue(item.label)
      const url = normalizeValue(item.url)
      return keywords.some((keyword) => label.includes(keyword) || url.includes(keyword))
    })
    if (found) {
      usedUrls.add(found.url)
      return found.url
    }
    return undefined
  }

  const rows = [
    { key: 'linkedin', label: 'LinkedIn profile', value: profile.linkedinUrl || findProofUrlWithTracking(['linkedin']), kind: 'link' as const, icon: 'link' as const },
    { key: 'github', label: 'GitHub profile', value: profile.githubUrl || findProofUrlWithTracking(['github']), kind: 'link' as const, icon: 'github' as const },
    { key: 'portfolio', label: 'Portfolio', value: profile.portfolioUrl || findProofUrlWithTracking(['portfolio', 'website', 'site']), kind: 'link' as const, icon: 'link' as const },
    { key: 'proof-work', label: 'Proof of work', value: profile.portfolioEvidenceUrl || findProofUrlWithTracking(['proof', 'case study', 'article', 'deck', 'work']), kind: 'link' as const, icon: 'link' as const },
    { key: 'intro-video', label: 'Intro video', value: profile.videoIntroUrl || findProofUrlWithTracking(['video', 'intro', 'youtube', 'vimeo']), kind: 'link' as const, icon: 'video' as const },
    { key: 'resume', label: 'Resume / CV', value: profile.cvUrl, kind: 'file' as const, icon: 'file' as const },
    { key: 'certificate', label: 'Certificate or credential', value: profile.certificateUrl, kind: 'file' as const, icon: 'file' as const },
  ]

  proofLinks.forEach((link, index) => {
    if (!usedUrls.has(link.url)) {
      rows.push({
        key: `extra-proof-${index}`,
        label: link.label || 'Additional link',
        value: link.url,
        kind: 'link' as const,
        icon: 'link' as const,
      })
    }
  })

  return rows.map((row) => ({
    ...row,
    status: (!row.value ? 'Missing' : reviewPending ? 'Needs review' : 'Available') as 'Available' | 'Missing' | 'Needs review',
  }))
}

function buildReviewHistory(profile: MentorProfileResponse, activeTab: QueueTab) {
  const entries = []

  if (activeTab === 'expertise' && profile.expertiseReviewedAt) {
    entries.push({
      label: 'Expertise reviewed',
      actor: profile.expertiseReviewedByName || 'Reviewer',
      timestamp: profile.expertiseReviewedAt,
    })
  }

  if (activeTab === 'identity' && profile.identityVerifiedAt) {
    entries.push({
      label: 'Identity reviewed',
      actor: profile.identityVerifiedByName || 'Reviewer',
      timestamp: profile.identityVerifiedAt,
    })
  }

  if (activeTab === 'payout' && profile.payoutReviewedAt) {
    entries.push({
      label: 'Payout reviewed',
      actor: profile.payoutReviewedByName || 'Reviewer',
      timestamp: profile.payoutReviewedAt,
    })
  }

  if (profile.approvedAt) {
    entries.push({
      label: 'Application approved',
      actor: profile.approvedByName || 'Admin',
      timestamp: profile.approvedAt,
    })
  }

  return entries
}

export default function AdminMentorApplicationsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const isAdmin = hasRole(user, 'ADMIN')
  const isModerator = hasRole(user, 'MODERATOR')
  const [activeTab, setActiveTab] = useState<QueueTab>('expertise')
  const [statusFilter, setStatusFilter] = useState<QueueStatusFilter>('all')
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('all')
  const [proofFilter, setProofFilter] = useState<ProofFilter>('any')
  const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT)
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<MentorProfileResponse | null>(null)
  const [reviewTab, setReviewTab] = useState<ReviewTab>('overview')
  const [draftAction, setDraftAction] = useState<ModerationAction | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [internalNote, setInternalNote] = useState('')

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

  const expertiseDetailQuery = useQuery(
    ['admin-mentor-expertise-detail', selectedProfile?.userId],
    () => adminMentorVerificationApi.getExpertiseApplication(selectedProfile!.userId),
    {
      enabled: activeTab === 'expertise' && !!selectedProfile?.userId,
      staleTime: 0,
    }
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
        queryClient.invalidateQueries('admin-mentor-expertise-detail')
        setDraftAction(null)
        setActionReason('')
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

  const availableTabs = useMemo(
    () => queueTabs.filter((tab) => !tab.adminOnly || isAdmin),
    [isAdmin]
  )

  useEffect(() => {
    if (!availableTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab('expertise')
    }
  }, [activeTab, availableTabs])

  useEffect(() => {
    setSelectedProfile(null)
    setDraftAction(null)
    setActionReason('')
    setInternalNote('')
    setReviewTab('overview')
  }, [activeTab, searchQuery, statusFilter, domainFilter, proofFilter, sortOption])

  const activeQueue = queueMap[activeTab]
  const hasCustomFilters =
    searchQuery.trim().length > 0
    || statusFilter !== 'all'
    || domainFilter !== 'all'
    || proofFilter !== 'any'
    || sortOption !== DEFAULT_SORT
  const activeItems = useMemo(
    () => {
      let items = activeQueue?.content ?? []

      if (activeTab === 'expertise') {
        items = items.filter(
          (profile) => getQueueStatus(profile, activeTab) !== VerificationStatus.NOT_SUBMITTED
        )
      }

      items = filterProfiles(items, searchQuery)
      items = items.filter((profile) => matchesStatusFilter(profile, activeTab, statusFilter))
      items = items.filter((profile) => matchesDomainFilter(profile, domainFilter))
      items = items.filter((profile) => matchesProofFilter(profile, proofFilter))

      return sortProfiles(items, activeTab, sortOption)
    },
    [activeQueue?.content, activeTab, searchQuery, statusFilter, domainFilter, proofFilter, sortOption]
  )

  const canReviewExpertise = isAdmin || isModerator
  const canReviewIdentity = isAdmin || isModerator
  const canReviewPayout = isAdmin

  const selectedApplication = activeTab === 'expertise'
    ? expertiseDetailQuery.data ?? selectedProfile
    : selectedProfile

  const selectedLoading = activeTab === 'expertise' && !!selectedProfile && expertiseDetailQuery.isLoading
  const selectedError = activeTab === 'expertise' ? expertiseDetailQuery.error : null

  useEffect(() => {
    if (!selectedProfile) return
    const nextMatch = activeItems.find((item) => item.userId === selectedProfile.userId)
    if (!nextMatch && !queueLoading[activeTab]) {
      setSelectedProfile(activeItems[0] ?? null)
      setDraftAction(null)
      setActionReason('')
    }
  }, [activeItems, activeTab, queueLoading, selectedProfile])

  useEffect(() => {
    if (!selectedApplication) {
      setInternalNote('')
      return
    }

    setInternalNote(
      selectedApplication.expertiseReviewNote
      || selectedApplication.expertiseRejectionReason
      || selectedApplication.identityRejectionReason
      || selectedApplication.payoutRejectionReason
      || ''
    )
  }, [selectedApplication?.userId])

  useEffect(() => {
    setReviewTab('overview')
    setDraftAction(null)
    setActionReason('')
  }, [selectedProfile?.userId])

  const submitAction = (action: ModerationAction, note: string) => {
    if (!selectedApplication) return
    moderationMutation.mutate({
      action,
      profile: selectedApplication,
      note: note.trim(),
    })
  }

  return (
    <div className={`relative min-h-screen grid gap-6 transition-all duration-500 ${selectedProfile ? 'xl:grid-cols-[minmax(0,1fr)_720px]' : 'max-w-7xl mx-auto w-full'}`}>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-white to-white dark:from-indigo-950/20 dark:via-slate-950 dark:to-slate-950" />
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/60 backdrop-blur-2xl shadow-xl shadow-slate-200/40 dark:border-slate-800/60 dark:bg-slate-900/40 dark:shadow-none transition-all">
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none dark:from-white/5" />
        <div className="relative z-10 px-6 py-6 lg:px-8">
          {/* ── Queue Tabs ── */}
          <div className="grid gap-3 sm:grid-cols-3">
            {availableTabs.map((tab) => {
              const total = tab.key === 'expertise'
                ? expertiseQuery.data?.totalElements ?? 0
                : tab.key === 'identity'
                  ? identityQuery.data?.totalElements ?? 0
                  : payoutQuery.data?.totalElements ?? 0
              const isActive = activeTab === tab.key
              const iconMap: Record<string, typeof ShieldCheck> = {
                expertise: ShieldCheck,
                identity: Fingerprint,
                payout: Banknote,
              }
              const TabIcon = iconMap[tab.key] || ShieldCheck

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key)
                    setStatusFilter('all')
                    setDomainFilter('all')
                    setProofFilter('any')
                    setSortOption(DEFAULT_SORT)
                    setPage(0)
                    setSelectedProfile(null)
                  }}
                  className={`group relative flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-300 ${
                    isActive
                      ? 'border-indigo-200 bg-indigo-50/80 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10'
                      : 'border-slate-200/60 bg-white/50 hover:border-slate-300 hover:bg-white hover:shadow-sm dark:border-slate-800/60 dark:bg-slate-900/30 dark:hover:border-slate-700 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700'
                  }`}>
                    <TabIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`block text-sm font-bold ${isActive ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>{tab.label}</span>
                    <span className={`mt-0.5 block text-[11px] leading-snug ${isActive ? 'text-indigo-600/70 dark:text-indigo-300/60' : 'text-slate-400 dark:text-slate-500'}`}>
                      {tab.description}
                    </span>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black tabular-nums transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-700'
                  }`}>
                    {total}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── Search & Filters ── */}
          <div className="mt-5 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setPage(0)
                }}
                placeholder="Search by name, email, skill, domain, or company…"
                className="h-11 w-full rounded-xl border border-slate-200/60 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-white dark:hover:border-slate-700 dark:focus:border-indigo-500/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ToolbarSelect
                label="Status"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value as QueueStatusFilter)
                  setPage(0)
                }}
                options={statusFilterOptions}
              />
              <ToolbarSelect
                label="Domain"
                value={domainFilter}
                onChange={(value) => {
                  setDomainFilter(value)
                  setPage(0)
                }}
                options={[
                  { label: 'All domains', value: 'all' },
                  ...DOMAIN_OPTIONS.map((domain) => ({ label: domain, value: domain })),
                ]}
              />
              <ToolbarSelect
                label="Proof"
                value={proofFilter}
                onChange={(value) => {
                  setProofFilter(value as ProofFilter)
                  setPage(0)
                }}
                options={proofFilterOptions}
              />
              <ToolbarSelect
                label="Sort"
                value={sortOption}
                onChange={(value) => setSortOption(value as SortOption)}
                options={sortOptions}
              />

              {hasCustomFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setDomainFilter('all')
                    setProofFilter('any')
                    setSortOption(DEFAULT_SORT)
                    setPage(0)
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200/80 bg-rose-50/60 px-3 text-xs font-bold text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              )}

              <span className="ml-auto text-xs font-medium text-slate-400 dark:text-slate-500">
                {activeItems.length} of {activeQueue?.totalElements ?? 0} · Page {page + 1}/{Math.max(activeQueue?.totalPages ?? 1, 1)}
              </span>
            </div>
          </div>
        </div>

        <div>
          {queueLoading[activeTab] ? (
            <QueueSkeleton />
          ) : queueErrors[activeTab] ? (
            <QueueError tab={activeTab} />
          ) : activeItems.length === 0 ? (
            <QueueEmptyState
              title="No applications match this filter."
              description="Try adjusting the search query or clearing one of the active filters."
            />
          ) : (
            <div className="space-y-3 px-4 py-4 lg:px-6">
              {activeItems.map((profile) => (
                <QueueCard
                  key={profile.userId}
                  activeTab={activeTab}
                  profile={profile}
                  isSelected={selectedProfile?.userId === profile.userId}
                  onSelect={() => setSelectedProfile(profile)}
                />
              ))}
            </div>
          )}

          {activeQueue && activeQueue.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200/80 px-6 py-4 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Page {page + 1} of {activeQueue.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(activeQueue.totalPages - 1, current + 1))}
                  disabled={page >= activeQueue.totalPages - 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      
      {selectedProfile && (
        <div 
          className="hidden xl:block"
          style={{ animation: 'slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
          <style>{`
            @keyframes slideInRight {
              0% { opacity: 0; transform: translateX(60px) scale(0.98); }
              100% { opacity: 1; transform: translateX(0) scale(1); }
            }
          `}</style>
          <ReviewWorkspacePanel
          activeTab={activeTab}
          profile={selectedApplication}
          loading={selectedLoading}
          error={selectedError}
          reviewTab={reviewTab}
          onReviewTabChange={setReviewTab}
          internalNote={internalNote}
          onInternalNoteChange={setInternalNote}
          draftAction={draftAction}
          onDraftActionChange={setDraftAction}
          actionReason={actionReason}
          onActionReasonChange={setActionReason}
          onClose={() => setSelectedProfile(null)}
          onSubmitAction={submitAction}
          isSubmitting={moderationMutation.isLoading}
          canReviewExpertise={canReviewExpertise}
          canReviewIdentity={canReviewIdentity}
          canReviewPayout={canReviewPayout}
        />
      </div>
      )}

      {selectedProfile && (
        <div className="fixed inset-0 z-[60] bg-slate-950/45 backdrop-blur-[2px] xl:hidden">
          <div className="absolute inset-0" onClick={() => setSelectedProfile(null)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-[560px] bg-white shadow-2xl dark:bg-slate-950">
            <ReviewWorkspacePanel
              activeTab={activeTab}
              profile={selectedApplication}
              loading={selectedLoading}
              error={selectedError}
              reviewTab={reviewTab}
              onReviewTabChange={setReviewTab}
              internalNote={internalNote}
              onInternalNoteChange={setInternalNote}
              draftAction={draftAction}
              onDraftActionChange={setDraftAction}
              actionReason={actionReason}
              onActionReasonChange={setActionReason}
              onClose={() => setSelectedProfile(null)}
              onSubmitAction={submitAction}
              isSubmitting={moderationMutation.isLoading}
              canReviewExpertise={canReviewExpertise}
              canReviewIdentity={canReviewIdentity}
              canReviewPayout={canReviewPayout}
              mobile
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewWorkspacePanel({
  activeTab,
  profile,
  loading,
  error,
  reviewTab,
  onReviewTabChange,
  internalNote,
  onInternalNoteChange,
  draftAction,
  onDraftActionChange,
  actionReason,
  onActionReasonChange,
  onClose,
  onSubmitAction,
  isSubmitting,
  canReviewExpertise,
  canReviewIdentity,
  canReviewPayout,
  mobile = false,
}: {
  activeTab: QueueTab
  profile: MentorProfileResponse | null | undefined
  loading: boolean
  error: any
  reviewTab: ReviewTab
  onReviewTabChange: (tab: ReviewTab) => void
  internalNote: string
  onInternalNoteChange: (value: string) => void
  draftAction: ModerationAction | null
  onDraftActionChange: (action: ModerationAction | null) => void
  actionReason: string
  onActionReasonChange: (value: string) => void
  onClose: () => void
  onSubmitAction: (action: ModerationAction, note: string) => void
  isSubmitting: boolean
  canReviewExpertise: boolean
  canReviewIdentity: boolean
  canReviewPayout: boolean
  mobile?: boolean
}) {
  const shellClass = mobile
    ? 'flex h-full flex-col bg-white/90 backdrop-blur-xl dark:bg-slate-950/90'
    : 'sticky top-6 flex h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/70 backdrop-blur-2xl shadow-xl shadow-slate-200/50 dark:border-slate-700/50 dark:bg-slate-900/60 dark:shadow-none transition-all duration-500 ease-out'

  if (loading) {
    return (
      <div className={shellClass}>
        <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading application details...</p>
        </div>
        <div className="flex-1 p-5">
          <QueueSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={shellClass}>
        <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Review detail</p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <QueueEmptyState
            title="Unable to load application details."
            description="Try re-opening this application after the detail endpoint responds."
          />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={shellClass}>
        <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Review detail</p>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <QueueEmptyState
            title="Select an application to review."
            description="Choose an item from the queue to inspect evidence, notes, and review actions."
          />
        </div>
      </div>
    )
  }

  const queueStatus = getQueueStatus(profile, activeTab)
  const reviewType = queueTabs.find((tab) => tab.key === activeTab)?.label || 'Review'
  const evidenceRows = buildEvidenceRows(profile, activeTab)
  const historyEntries = buildReviewHistory(profile, activeTab)
  const currentModeratorNote =
    profile.expertiseReviewNote
    || profile.expertiseRejectionReason
    || profile.identityRejectionReason
    || profile.payoutRejectionReason
    || profile.rejectionReason
    || ''

  const canAct = queueStatus === VerificationStatus.PENDING

  const actionButtons = !canAct 
    ? []
    : activeTab === 'expertise'
      ? canReviewExpertise
        ? [
            { action: 'request-more-info' as ModerationAction, label: 'Request more info', tone: 'secondary' as const },
            { action: 'reject-expertise' as ModerationAction, label: 'Reject', tone: 'danger' as const },
            { action: 'approve-expertise' as ModerationAction, label: 'Approve', tone: 'primary' as const },
          ]
        : []
      : activeTab === 'identity'
        ? canReviewIdentity
          ? [
              { action: 'reject-identity' as ModerationAction, label: 'Reject identity', tone: 'danger' as const },
              { action: 'approve-identity' as ModerationAction, label: 'Approve identity', tone: 'primary' as const },
            ]
          : []
        : canReviewPayout
          ? [
              { action: 'reject-payout' as ModerationAction, label: 'Reject payout', tone: 'danger' as const },
              { action: 'approve-payout' as ModerationAction, label: 'Approve payout', tone: 'primary' as const },
            ]
          : []

  const actionInputLabel =
    draftAction === 'reject-expertise' || draftAction === 'reject-identity' || draftAction === 'reject-payout'
      ? 'Reason for rejection'
      : draftAction === 'request-more-info'
        ? 'Information needed'
        : 'Optional internal note'

  const actionPlaceholder =
    draftAction === 'reject-expertise' || draftAction === 'reject-identity' || draftAction === 'reject-payout'
      ? 'Explain what the applicant needs to fix...'
      : draftAction === 'request-more-info'
        ? 'Tell the applicant what information or proof is missing...'
        : 'Add context for this approval if needed...'

  const handleSubmit = () => {
    if (!draftAction) return
    if (requiresReason(draftAction) && !actionReason.trim()) {
      toast.error('Please provide the required review reason before submitting.')
      return
    }
    onSubmitAction(draftAction, actionReason)
  }

  return (
    <div className={shellClass}>
      <div className="sticky top-0 z-10 border-b border-white/20 bg-white/60 px-6 py-5 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/60">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex flex-1 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-black text-white shadow-lg shadow-indigo-500/20">
              {profile.user?.fullName?.charAt(0)?.toUpperCase() || 'M'}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-black text-slate-950 dark:text-white">{profile.user?.fullName || 'Mentor applicant'}</h2>
                <StatusChip status={queueStatus} />
              </div>
              <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{profile.user?.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Application status: {getStatusLabel(queueStatus)}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span>Review type: {reviewType}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span>Submitted {profile.submittedAt ? formatDateTime(profile.submittedAt) : 'Not submitted'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          {[
            { key: 'overview' as ReviewTab, label: 'Overview' },
            { key: 'evidence' as ReviewTab, label: 'Evidence' },
            { key: 'notes' as ReviewTab, label: 'Notes & History' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onReviewTabChange(tab.key)}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                reviewTab === tab.key
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {reviewTab === 'overview' && (
          <div className="space-y-4">
            <PanelSection title="Professional Summary" description="Core information used to validate the mentor application.">
              <FieldGrid>
                <FieldItem label="Headline" value={profile.headline || 'Not provided'} spanFull />
                <FieldItem label="Professional bio" value={profile.professionalBio || 'Not provided'} spanFull />
                <FieldItem label="Current title" value={profile.currentTitle || 'Not provided'} />
                <FieldItem label="Current company" value={profile.currentCompany || 'Not provided'} />
                <FieldItem
                  label="Years of experience"
                  value={profile.yearsOfExperience != null ? `${profile.yearsOfExperience} years` : 'Not provided'}
                />
                <FieldItem
                  label="Expected hourly rate"
                  value={profile.hourlyRateMxc != null ? `${profile.hourlyRateMxc} MXC/hour` : 'Not provided'}
                />
                <FieldItem label="Availability" value={profile.availability || 'Not provided'} />
                <FieldItem label="Languages" value={profile.languages?.join(', ') || 'Not provided'} />
                <FieldItem label="Location / timezone" value={profile.location || 'Not provided'} />
                <FieldItem label="What can you help learners with" value={profile.helpDescription || 'Not provided'} spanFull />
              </FieldGrid>
            </PanelSection>

            <PanelSection title="Domain & Skills" description="Review the mentor's stated domain and practical strengths.">
              <FieldGrid>
                <FieldItem label="Primary domain" value={profile.primaryDomain || 'Not provided'} />
                <FieldItem label="Review focus" value={getQueueFieldValue(profile, activeTab)} />
              </FieldGrid>
              <div className="mt-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Skills</p>
                {profile.skills?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Not provided</p>
                )}
              </div>
            </PanelSection>
          </div>
        )}

        {reviewTab === 'evidence' && (
          <div className="space-y-4">
            <PanelSection title="Evidence Summary" description="Proof links and uploaded files provided with the application.">
              <div className="space-y-3">
                {evidenceRows.filter((item) => item.value).map((item) => (
                  <EvidenceRow
                    key={item.key}
                    label={item.label}
                    value={item.value}
                    status={item.status}
                    kind={item.kind}
                    icon={item.icon}
                  />
                ))}
              </div>
              {evidenceRows.every((item) => !item.value) && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                  No proof items provided.
                </div>
              )}
            </PanelSection>
          </div>
        )}

        {reviewTab === 'notes' && (
          <div className="space-y-6">
            <PanelSection title="Internal Notes" description="Reviewer-only notes kept inside the moderation workspace.">
              <div>
                <textarea
                  rows={4}
                  value={internalNote}
                  onChange={(event) => onInternalNoteChange(event.target.value.slice(0, 1000))}
                  placeholder="Draft an internal note for other reviewers..."
                  className="w-full rounded-[1.25rem] border border-slate-200/60 bg-white/70 backdrop-blur-md px-5 py-4 text-sm font-medium text-slate-900 outline-none transition-all hover:bg-white hover:border-indigo-200 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800/60 dark:bg-slate-950/50 dark:text-white dark:hover:bg-slate-900 dark:focus:bg-slate-950 dark:focus:border-indigo-500/50"
                />
                <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                  <span>Internal only, not visible to the applicant.</span>
                  <span>{internalNote.length} / 1000</span>
                </div>
              </div>
            </PanelSection>

            <PanelSection title="Moderator Notes" description="Existing notes and rejection reasons already attached to this application.">
              <div className="space-y-3">
                {currentModeratorNote ? (
                  <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/50 p-5 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-500 dark:text-indigo-400">Moderator Note</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{currentModeratorNote}</p>
                  </div>
                ) : null}

                {(profile.expertiseRejectionReason || profile.identityRejectionReason || profile.payoutRejectionReason || profile.rejectionReason) ? (
                  <div className="rounded-2xl border border-rose-200/60 bg-rose-50/50 p-5 dark:border-rose-500/20 dark:bg-rose-500/10">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-500 dark:text-rose-400">Rejection Reason</p>
                    <p className="mt-2 text-sm leading-relaxed text-rose-800 dark:text-rose-200">
                      {profile.expertiseRejectionReason || profile.identityRejectionReason || profile.payoutRejectionReason || profile.rejectionReason}
                    </p>
                  </div>
                ) : null}

                {!currentModeratorNote && !(profile.expertiseRejectionReason || profile.identityRejectionReason || profile.payoutRejectionReason || profile.rejectionReason) && (
                  <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/50 px-4 py-4 text-center dark:border-slate-800 dark:bg-slate-900/30">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No moderator notes attached yet.</p>
                  </div>
                )}
              </div>
            </PanelSection>

            <PanelSection title="Review History" description="Chronological record of actions taken on this application.">
              {historyEntries.length > 0 ? (
                <div className="relative ml-4 mt-2 space-y-6 before:absolute before:inset-y-0 before:-left-4 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
                  {historyEntries.map((entry) => (
                    <div key={`${entry.label}-${entry.timestamp}`} className="relative">
                      <span className="absolute -left-[1.3125rem] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-white dark:bg-indigo-400 dark:ring-slate-900" />
                      <div className="pl-3">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{entry.label}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                          <span>{entry.actor}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span>{formatDateTime(entry.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/50 px-4 py-4 text-center dark:border-slate-800 dark:bg-slate-900/30">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No review history available.</p>
                </div>
              )}
            </PanelSection>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        {draftAction && (
          <div className="mb-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{getActionTitle(draftAction)}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{getActionDescription(draftAction)}</p>

            <div className="mt-4 space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {actionInputLabel}
              </label>
              <textarea
                rows={4}
                value={actionReason}
                onChange={(event) => onActionReasonChange(event.target.value)}
                placeholder={actionPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-600 dark:focus:ring-white/5"
              />
            </div>

            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  onDraftActionChange(null)
                  onActionReasonChange('')
                }}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
              >
                {isSubmitting ? 'Submitting...' : getActionTitle(draftAction)}
              </button>
            </div>
          </div>
        )}

        {!draftAction && actionButtons.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {actionButtons.map((button) => (
              <button
                key={button.action}
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  onDraftActionChange(button.action)
                  onActionReasonChange('')
                }}
                className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95 ${
                  button.tone === 'primary'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 border-none'
                    : button.tone === 'danger'
                      ? 'border border-rose-200/80 bg-rose-50/50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 hover:shadow-md hover:-translate-y-0.5 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20'
                      : 'border border-amber-200/80 bg-amber-50/50 text-amber-800 hover:bg-amber-100 hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20'
                }`}
              >
                {button.label}
              </button>
            ))}
          </div>
        )}

        {!draftAction && actionButtons.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {!canAct 
              ? `No further actions can be taken. The application is ${getStatusLabel(queueStatus).toLowerCase()}.` 
              : 'You do not have permission to take actions in this review lane.'}
          </p>
        )}
      </div>
    </div>
  )
}

function EvidenceRow({
  label,
  value,
  status,
  kind,
  icon,
}: {
  label: string
  value?: string | null
  status: 'Available' | 'Missing' | 'Needs review'
  kind: 'link' | 'file'
  icon: 'link' | 'github' | 'file' | 'video'
}) {
  const Icon =
    icon === 'github'
      ? Github
      : icon === 'video'
        ? Video
        : icon === 'file'
          ? FileText
          : Link2

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="min-w-0 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 dark:bg-slate-950 dark:text-slate-300">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{status}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
            status === 'Available'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
              : status === 'Needs review'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200'
                : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {status}
        </span>
        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:text-white"
          >
            {kind === 'file' ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
            {kind === 'file' ? 'Download' : 'Open link'}
          </a>
        ) : (
          <span className="inline-flex h-10 items-center rounded-xl border border-dashed border-slate-200 px-3 text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
            Missing
          </span>
        )}
      </div>
    </div>
  )
}

function QueueCard({
  profile,
  activeTab,
  isSelected,
  onSelect,
}: {
  profile: MentorProfileResponse
  activeTab: QueueTab
  isSelected: boolean
  onSelect: () => void
}) {
  const user = profile.user
  const queueStatus = getQueueStatus(profile, activeTab)
  const skillsPreview = profile.skills?.slice(0, 3) ?? []
  const hasMoreSkills = (profile.skills?.length ?? 0) > skillsPreview.length
  const submittedLabel = profile.submittedAt
    ? formatDateTime(profile.submittedAt)
    : formatDateTime(profile.updatedAt || profile.createdAt)
  const factChips = [
    profile.yearsOfExperience != null ? `${profile.yearsOfExperience}y experience` : null,
    profile.languages?.length ? profile.languages.join(', ') : null,
    profile.location || null,
  ].filter(Boolean) as string[]
  const proofItems = [
    { label: 'LinkedIn', active: hasLinkedInProof(profile) },
    { label: 'CV', active: hasCvProof(profile) },
    { label: 'Certificate', active: hasCertificateProof(profile) },
    { label: 'Portfolio', active: hasPortfolioProof(profile) },
  ]

  return (
    <div
      className={`group relative rounded-[1.75rem] border p-5 transition-all duration-400 ease-out overflow-hidden backdrop-blur-sm ${
        isSelected
          ? 'border-indigo-400/80 bg-indigo-50/40 shadow-xl shadow-indigo-100/60 scale-[1.02] dark:border-indigo-400/50 dark:bg-indigo-900/20 dark:shadow-indigo-900/20'
          : 'border-slate-200/60 bg-white/60 hover:border-indigo-300/80 hover:bg-white/90 hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-1.5 dark:border-slate-800/60 dark:bg-slate-950/50 dark:hover:border-indigo-500/40 dark:hover:bg-slate-900/80'
      }`}
    >
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none" />
      )}
      <button type="button" onClick={onSelect} className="flex w-full min-w-0 flex-col gap-4 text-left">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex flex-1 items-start gap-4">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-950 text-base font-black text-white dark:bg-white dark:text-slate-950">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'M'}
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="truncate text-xl font-black text-slate-950 dark:text-white">{user?.fullName || 'Mentor applicant'}</h3>
                <StatusChip status={queueStatus} />
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </p>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right dark:bg-slate-900">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                Submitted
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{submittedLabel}</p>
            </div>

            <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
              <Eye className="h-4 w-4" />
              Open review
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 lg:hidden">
          <div className="rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Submitted
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{submittedLabel}</p>
          </div>

          <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
            <Eye className="h-4 w-4" />
            Open review
          </span>
        </div>

        <div className="min-w-0">

            <p className="mt-4 text-lg font-bold leading-6 text-slate-900 dark:text-slate-50">
              {profile.headline || profile.currentTitle || 'No headline provided yet.'}
            </p>
            {profile.professionalBio && (
              <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                {profile.professionalBio}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {profile.primaryDomain && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {profile.primaryDomain}
                </span>
              )}
              {skillsPreview.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {skill}
                </span>
              ))}
              {hasMoreSkills && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  +{(profile.skills?.length ?? 0) - skillsPreview.length}
                </span>
              )}
            </div>

            {factChips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {factChips.map((fact) => (
                  <span
                    key={fact}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                  >
                    {fact}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Proofs:</span>
              {proofItems.map((item) => (
                <span
                  key={item.label}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    item.active
                      ? 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                      : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500'
                  }`}
                >
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                      item.active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {item.active ? '✓' : '•'}
                  </span>
                  {item.label}
                </span>
              ))}
            </div>
        </div>
      </button>
    </div>
  )
}

function QueueDetailsPanel({
  profile,
  activeTab,
  isAdmin,
  onAction,
  onClose,
}: {
  profile: MentorProfileResponse
  activeTab: QueueTab
  isAdmin: boolean
  onAction: (profile: MentorProfileResponse, action: ModerationAction) => void
  onClose: () => void
}) {
  const proofLinks = getMentorProofLinks(profile)

  const hasIdentityReviewData =
    activeTab === 'identity' ||
    profile.identityRequired === true ||
    (profile.identityStatus != null && profile.identityStatus !== VerificationStatus.NOT_SUBMITTED) ||
    Boolean(
      profile.countryOfResidence ||
        profile.identityDocumentType ||
        profile.documentNumberMasked ||
        profile.identityRejectionReason ||
        profile.identityVerifiedAt ||
        profile.identityVerifiedBy
    )

  const hasPayoutReviewData =
    activeTab === 'payout' ||
    (profile.payoutStatus != null && profile.payoutStatus !== VerificationStatus.NOT_SUBMITTED) ||
    Boolean(
      profile.payoutCountry ||
        profile.payoutMethod ||
        profile.payoutAccountHolderName ||
        profile.payoutBankName ||
        profile.payoutAccountNumberMasked ||
        profile.paypalEmail ||
        profile.wiseEmail ||
        profile.iban ||
        profile.swiftCode
    )

  const queueStatus = getQueueStatus(profile, activeTab)
  const evidenceCount = getEvidenceCount(profile)
  const identityNote = profile.identityRejectionReason || profile.expertiseReviewNote || 'No note yet'
  const payoutReference = [profile.iban, profile.swiftCode].filter(Boolean).join(' / ') || 'Not provided'

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/45 backdrop-blur-[2px]">
      <button
        type="button"
        onClick={onClose}
        className="min-h-full flex-1 cursor-default"
        aria-label="Close profile review"
      />
      <div className="relative h-full w-full max-w-[980px] overflow-y-auto border-l border-slate-200/80 bg-slate-50 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 lg:px-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Mentor profile review
            </p>
            <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
              Opened from the {queueTabs.find((tab) => tab.key === activeTab)?.label.toLowerCase()} lane
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-6 px-6 py-6 lg:px-8">
          <section className="rounded-[1.75rem] bg-slate-950 px-6 py-6 text-white shadow-lg shadow-slate-950/10 dark:border dark:border-white/10">
            <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-lg font-black text-white">
                    {profile.user?.fullName?.charAt(0)?.toUpperCase() || 'M'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-2xl font-black">{profile.user?.fullName}</p>
                      <StatusChip status={queueStatus} />
                    </div>
                    <p className="mt-1 text-sm text-white/70">{profile.user?.email}</p>
                    <p className="mt-4 max-w-3xl text-sm font-medium leading-6 text-white/84">
                      {profile.headline || profile.currentTitle || 'No professional headline provided yet.'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <SnapshotStat label="Primary domain" value={profile.primaryDomain || 'Not provided'} />
                  <SnapshotStat
                    label="Experience"
                    value={profile.yearsOfExperience != null ? `${profile.yearsOfExperience} years` : 'Not provided'}
                  />
                  <SnapshotStat label="Evidence package" value={`${evidenceCount} item${evidenceCount === 1 ? '' : 's'}`} />
                  <SnapshotStat
                    label="Submitted"
                    value={profile.submittedAt ? formatDateTime(profile.submittedAt) : 'Not submitted'}
                  />
                </div>
              </div>

              <div className="w-full max-w-sm rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">Review actions</p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  Decide from this panel so the queue stays focused on triage rather than action clutter.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeTab === 'expertise' && (
                    <>
                      <ActionButton tone="primary" onClick={() => onAction(profile, 'approve-expertise')} icon={CheckCircle2}>
                        Approve Mentor Mode
                      </ActionButton>
                      <ActionButton tone="secondary" onClick={() => onAction(profile, 'request-more-info')} icon={MessageSquareMore}>
                        Request more info
                      </ActionButton>
                      <ActionButton tone="danger" onClick={() => onAction(profile, 'reject-expertise')} icon={XCircle}>
                        Reject expertise
                      </ActionButton>
                    </>
                  )}

                  {activeTab === 'identity' && (
                    <>
                      <ActionButton tone="primary" onClick={() => onAction(profile, 'approve-identity')} icon={BadgeCheck}>
                        Approve identity
                      </ActionButton>
                      <ActionButton tone="danger" onClick={() => onAction(profile, 'reject-identity')} icon={XCircle}>
                        Reject identity
                      </ActionButton>
                    </>
                  )}

                  {activeTab === 'payout' && isAdmin && (
                    <>
                      <ActionButton tone="primary" onClick={() => onAction(profile, 'approve-payout')} icon={Banknote}>
                        Approve payout
                      </ActionButton>
                      <ActionButton tone="danger" onClick={() => onAction(profile, 'reject-payout')} icon={XCircle}>
                        Reject payout
                      </ActionButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="space-y-4">
              <PanelSection
                title="Professional profile"
                description="Core information that determines whether Mentor Mode should be unlocked."
              >
                <FieldGrid>
                  <FieldItem label="Primary domain" value={profile.primaryDomain || 'Not provided'} />
                  <FieldItem label="Current title" value={profile.currentTitle || 'Not provided'} />
                  <FieldItem label="Current company" value={profile.currentCompany || 'Not provided'} />
                  <FieldItem label="Availability" value={profile.availability || 'Not provided'} />
                  <FieldItem
                    label="Expected hourly rate"
                    value={profile.hourlyRateMxc != null ? `${profile.hourlyRateMxc} MXC/hour` : 'Not provided'}
                  />
                  <FieldItem label="Languages" value={profile.languages?.join(', ') || 'Not provided'} />
                  <FieldItem label="Location / timezone" value={profile.location || 'Not provided'} />
                  <FieldItem label="Skills" value={profile.skills?.join(', ') || 'Not provided'} />
                  <FieldItem label="Professional bio" value={profile.professionalBio || 'Not provided'} spanFull />
                  <FieldItem label="Learner support" value={profile.helpDescription || 'Not provided'} spanFull />
                </FieldGrid>
              </PanelSection>

              <PanelSection
                title="Evidence package"
                description="Links and files submitted to support expertise claims."
              >
                {proofLinks.length > 0 ? (
                  <div className="space-y-3">
                    {proofLinks.map((link) => (
                      <ProofLinkRow key={`${link.label}-${link.url}`} label={link.label} value={link.url} />
                    ))}
                  </div>
                ) : (
                  <InlineEmptyState label="No external proof links were submitted." />
                )}

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <AttachmentTile label="Resume / CV" value={profile.cvUrl} />
                  <AttachmentTile label="Certificate / credential" value={profile.certificateUrl} />
                </div>
              </PanelSection>
            </div>

            <div className="space-y-4">
              <PanelSection
                title="Review status"
                description="Current moderation state across the three verification lanes."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailStat label="Mentor status" value={profile.user?.mentorStatus || 'NOT_APPLIED'} />
                  <DetailStat label="Expertise" value={getStatusLabel(profile.expertiseStatus)} />
                  <DetailStat label="Identity" value={getStatusLabel(profile.identityStatus)} />
                  <DetailStat label="Payout" value={getStatusLabel(profile.payoutStatus)} />
                </div>
              </PanelSection>

              <PanelSection
                title="Submission confirmations"
                description="Mentor declarations confirmed before the application entered review."
              >
                <FieldGrid>
                  <FieldItem label="Accuracy confirmed" value={profile.mentorAgreementAccepted ? 'Yes' : 'No'} />
                  <FieldItem label="Policies accepted" value={profile.disputePolicyAccepted ? 'Yes' : 'No'} />
                  <FieldItem
                    label="Submitted at"
                    value={profile.submittedAt ? formatDateTime(profile.submittedAt) : 'Not submitted'}
                  />
                </FieldGrid>
              </PanelSection>

              {hasIdentityReviewData && (
                <PanelSection
                  title="Identity review"
                  description="Only shown when identity verification is required or already in progress."
                >
                  <FieldGrid>
                    <FieldItem label="Country" value={profile.countryOfResidence || 'Not provided'} />
                    <FieldItem label="Document type" value={profile.identityDocumentType || 'Not submitted'} />
                    <FieldItem label="Document" value={profile.documentNumberMasked || 'Not submitted'} mono />
                    <FieldItem label="Identity note" value={identityNote} spanFull />
                  </FieldGrid>
                </PanelSection>
              )}

              {hasPayoutReviewData && (
                <PanelSection
                  title="Payout review"
                  description="Destination details reviewed only when withdrawals are relevant."
                >
                  <FieldGrid>
                    <FieldItem label="Country" value={profile.payoutCountry || 'Not submitted'} />
                    <FieldItem label="Method" value={getPayoutMethodLabel(profile.payoutMethod)} />
                    <FieldItem label="Account holder" value={profile.payoutAccountHolderName || 'Not provided'} />
                    <FieldItem label="Bank" value={profile.payoutBankName || 'Not provided'} />
                    <FieldItem label="Masked account" value={profile.payoutAccountNumberMasked || 'Not provided'} mono />
                    <FieldItem label="PayPal" value={profile.paypalEmail || 'Not provided'} mono />
                    <FieldItem label="Wise" value={profile.wiseEmail || 'Not provided'} mono />
                    <FieldItem label="IBAN / SWIFT" value={payoutReference} mono />
                  </FieldGrid>
                </PanelSection>
              )}
            </div>
          </div>
        </div>
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

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  )
}

function ToolbarSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
}) {
  return (
    <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200/60 bg-white px-3 transition-colors hover:border-slate-300 dark:border-slate-800/60 dark:bg-slate-900/60 dark:hover:border-slate-700">
      <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 cursor-pointer bg-transparent text-xs font-semibold text-slate-700 outline-none dark:text-slate-300"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function SnapshotStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">{label}</p>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  )
}

function PanelSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</p>
        {description && (
          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">{children}</div>
}

function FieldItem({
  label,
  value,
  mono = false,
  spanFull = false,
}: {
  label: string
  value: string
  mono?: boolean
  spanFull?: boolean
}) {
  return (
    <div className={`border-b border-slate-200/80 pb-4 last:border-b-0 dark:border-slate-800 ${spanFull ? 'md:col-span-2' : ''}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-sm font-medium leading-6 text-slate-950 dark:text-slate-100 ${mono ? 'break-all font-mono text-xs' : ''}`}>
        {value}
      </p>
    </div>
  )
}

function ProofLinkRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 transition hover:border-indigo-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-2 break-all font-mono text-xs text-indigo-700 dark:text-indigo-300">{value}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
    </a>
  )
}

function AttachmentTile({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      {value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block break-all font-mono text-xs font-medium text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          {value}
        </a>
      ) : (
        <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">Not provided</p>
      )}
    </div>
  )
}

function InlineEmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-4 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
      {label}
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
      ? 'bg-indigo-600 text-white hover:bg-indigo-500'
      : tone === 'secondary'
        ? 'border border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200'
        : tone === 'danger'
          ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200'
          : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950 dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/25 dark:hover:text-white'

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
