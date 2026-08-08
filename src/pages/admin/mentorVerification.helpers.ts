import { MentorProfileResponse, PayoutMethod, VerificationStatus } from '@/types'
import { getMentorProofLinks } from '@/utils/proofLinks'

export type QueueTab = 'expertise' | 'payout'
export type QueueStatusFilter = 'all' | VerificationStatus
export type DomainFilter = 'all' | string
export type ProofFilter = 'any' | 'linkedin' | 'cv' | 'certificate' | 'portfolio' | 'missing'
export type SortOption = 'newest' | 'oldest' | 'most-experience' | 'least-experience' | 'needs-attention'
export type ReviewTab = 'overview' | 'evidence' | 'notes'

export type ModerationAction =
  | 'approve-expertise'
  | 'reject-expertise'
  | 'request-more-info'
  | 'suspend'
  | 'approve-payout'
  | 'reject-payout'

export const PAGE_SIZE = 12
export const DEFAULT_SORT: SortOption = 'newest'
export const DOMAIN_OPTIONS = [
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

export const queueTabs: Array<{
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
    key: 'payout',
    label: 'Payout review',
    description: 'Approve payout destinations before mentors can withdraw earnings.',
    adminOnly: true,
  },
]

export const statusTone: Record<VerificationStatus, string> = {
  [VerificationStatus.NOT_SUBMITTED]: 'bg-slate-100 text-slate-600',
  [VerificationStatus.PENDING]: 'bg-amber-100 text-amber-700',
  [VerificationStatus.APPROVED]: 'bg-emerald-100 text-emerald-700',
  [VerificationStatus.REJECTED]: 'bg-rose-100 text-rose-700',
  [VerificationStatus.NEEDS_MORE_INFO]: 'bg-blue-100 text-blue-700',
}

export function getStatusLabel(status?: VerificationStatus | null) {
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

export function getPayoutMethodLabel(method?: PayoutMethod | null) {
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

export function getQueueFieldValue(profile: MentorProfileResponse, activeTab: QueueTab) {
  if (activeTab === 'expertise') {
    return profile.primaryDomain || profile.currentTitle || 'Professional profile submitted'
  }

  return profile.payoutMethod ? getPayoutMethodLabel(profile.payoutMethod) : 'Payout destination submitted'
}

export const statusFilterOptions: Array<{ label: string; value: QueueStatusFilter }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: VerificationStatus.PENDING },
  { label: 'Needs more info', value: VerificationStatus.NEEDS_MORE_INFO },
  { label: 'Approved', value: VerificationStatus.APPROVED },
  { label: 'Rejected', value: VerificationStatus.REJECTED },
]

export const proofFilterOptions: Array<{ label: string; value: ProofFilter }> = [
  { label: 'Any proof', value: 'any' },
  { label: 'Has LinkedIn', value: 'linkedin' },
  { label: 'Has CV', value: 'cv' },
  { label: 'Has Certificate', value: 'certificate' },
  { label: 'Has Portfolio', value: 'portfolio' },
  { label: 'Missing proof', value: 'missing' },
]

export const sortOptions: Array<{ label: string; value: SortOption }> = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Most experience', value: 'most-experience' },
  { label: 'Least experience', value: 'least-experience' },
  { label: 'Needs attention', value: 'needs-attention' },
]

export function normalizeValue(value?: string | null) {
  return value?.trim().toLowerCase() ?? ''
}

export function getQueueStatus(profile: MentorProfileResponse, activeTab: QueueTab) {
  return activeTab === 'expertise'
    ? profile.expertiseStatus
    : profile.payoutStatus
}

export function getEvidenceCount(profile: MentorProfileResponse) {
  return getMentorProofLinks(profile).length
    + (profile.cvUrl ? 1 : 0)
    + (profile.certificateUrl ? 1 : 0)
}

export function matchesStatusFilter(
  profile: MentorProfileResponse,
  activeTab: QueueTab,
  statusFilter: QueueStatusFilter
) {
  if (statusFilter === 'all') return true
  return getQueueStatus(profile, activeTab) === statusFilter
}

export function getNewestActivity(profile: MentorProfileResponse) {
  return new Date(
    profile.submittedAt || profile.updatedAt || profile.createdAt || new Date().toISOString()
  ).getTime()
}

export function hasProofLink(
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

export function hasLinkedInProof(profile: MentorProfileResponse) {
  return Boolean(profile.linkedinUrl) || hasProofLink(profile, { labels: ['linkedin'], hosts: ['linkedin.com'] })
}

export function hasGitHubProof(profile: MentorProfileResponse) {
  return Boolean(profile.githubUrl) || hasProofLink(profile, { labels: ['github'], hosts: ['github.com'] })
}

export function hasPortfolioProof(profile: MentorProfileResponse) {
  return (
    Boolean(profile.portfolioUrl || profile.portfolioEvidenceUrl)
    || hasProofLink(profile, {
      labels: ['portfolio', 'proof of work', 'case study', 'article', 'deck', 'website', 'site'],
      hosts: ['behance.net', 'dribbble.com'],
    })
  )
}

export function hasCvProof(profile: MentorProfileResponse) {
  return Boolean(profile.cvUrl)
}

export function hasCertificateProof(profile: MentorProfileResponse) {
  return Boolean(profile.certificateUrl)
}

export function getProofSummary(profile: MentorProfileResponse) {
  return [
    hasLinkedInProof(profile) ? 'LinkedIn' : null,
    hasGitHubProof(profile) ? 'GitHub' : null,
    hasPortfolioProof(profile) ? 'Portfolio' : null,
    hasCvProof(profile) ? 'CV' : null,
    hasCertificateProof(profile) ? 'Certificate' : null,
  ].filter(Boolean) as string[]
}

export function matchesDomainFilter(profile: MentorProfileResponse, domainFilter: DomainFilter) {
  if (domainFilter === 'all') return true
  return normalizeValue(profile.primaryDomain) === normalizeValue(domainFilter)
}

export function matchesProofFilter(profile: MentorProfileResponse, proofFilter: ProofFilter) {
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

export function getNeedsAttentionRank(status?: VerificationStatus | null) {
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

export function sortProfiles(items: MentorProfileResponse[], activeTab: QueueTab, sortOption: SortOption) {
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

export function filterProfiles(items: MentorProfileResponse[], searchQuery: string) {
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

export function buildEvidenceRows(profile: MentorProfileResponse, activeTab: QueueTab) {
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

export function buildReviewHistory(profile: MentorProfileResponse, activeTab: QueueTab) {
  const entries = []

  if (activeTab === 'expertise' && profile.expertiseReviewedAt) {
    entries.push({
      label: 'Expertise reviewed',
      actor: profile.expertiseReviewedByName || 'Reviewer',
      timestamp: profile.expertiseReviewedAt,
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

export function requiresReason(action: ModerationAction) {
  return action === 'reject-expertise'
    || action === 'request-more-info'
    || action === 'suspend'
    || action === 'reject-payout'
}

export function getActionTitle(action: ModerationAction) {
  switch (action) {
    case 'approve-expertise':
      return 'Approve Mentor Mode'
    case 'reject-expertise':
      return 'Reject expertise review'
    case 'request-more-info':
      return 'Request more information'
    case 'suspend':
      return 'Suspend mentor'
    case 'approve-payout':
      return 'Approve payout'
    case 'reject-payout':
      return 'Reject payout'
  }
}

export function getActionDescription(action: ModerationAction) {
  switch (action) {
    case 'approve-expertise':
      return 'This will unlock Mentor Mode and keep the account in the user-plus-mentor model.'
    case 'reject-expertise':
      return 'Use this when the professional profile does not meet quality or trust requirements.'
    case 'request-more-info':
      return 'Use this when the mentor can qualify after improving their profile or adding evidence.'
    case 'suspend':
      return 'Suspension removes Mentor Mode access but preserves the user account and user features.'
    case 'approve-payout':
      return 'Approve this payout destination so the mentor can request withdrawals.'
    case 'reject-payout':
      return 'Use this when payout details are incomplete, risky, or non-compliant.'
  }
}

export function getSuccessMessage(action: ModerationAction) {
  switch (action) {
    case 'approve-expertise':
      return 'Mentor Mode has been approved.'
    case 'reject-expertise':
      return 'The expertise review has been rejected.'
    case 'request-more-info':
      return 'A revision request has been sent.'
    case 'suspend':
      return 'The mentor has been suspended.'
    case 'approve-payout':
      return 'Payout destination approved.'
    case 'reject-payout':
      return 'Payout destination rejected.'
  }
}
