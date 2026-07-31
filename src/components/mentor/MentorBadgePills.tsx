import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Clock3,
  FileText,
  Languages,
  Star,
} from 'lucide-react'

import { MentorBadgeSettingsResponse } from '@/api/platformSettingApi'
import { MentorProfileResponse, ReviewSummaryResponse } from '@/types'

type TranslateFn = (...args: any[]) => string

type MentorBadgeTone = 'emerald' | 'amber' | 'sky' | 'slate'
type MentorBadgeKind =
  | 'approved'
  | 'featured'
  | 'topRated'
  | 'fastResponse'
  | 'experience'
  | 'directBooking'
  | 'publicProof'
  | 'multilingual'

export type MentorBadge = {
  id: string
  kind: MentorBadgeKind
  label: string
  tone: MentorBadgeTone
}

export const DEFAULT_MENTOR_BADGE_SETTINGS: MentorBadgeSettingsResponse = {
  showApprovedBadge: true,
  showFeaturedBadge: true,
  showTopRatedBadge: true,
  showFastResponseBadge: true,
  showExperienceBadge: true,
  showDirectBookingBadge: true,
  showPublicProofBadge: true,
  showMultilingualBadge: true,
  topRatedMinRating: 4.8,
  topRatedMinReviews: 2,
  fastResponseMaxHours: 12,
  experienceMinYears: 5,
  multilingualMinLanguages: 2,
  profileMaxBadges: 6,
  listMaxBadges: 4,
}

type BuildMentorBadgesOptions = {
  mentor: MentorProfileResponse
  t: TranslateFn
  reviewSummary?: ReviewSummaryResponse
  resourceCount?: number
  hasDirectBooking?: boolean
  includeApproved?: boolean
  settings?: MentorBadgeSettingsResponse
  limit?: number
}

const TONE_CLASSES: Record<MentorBadgeTone, string> = {
  emerald:
    'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20',
  amber:
    'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20',
  sky: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/20',
  slate:
    'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
}

export function buildMentorBadges({
  mentor,
  t,
  reviewSummary,
  resourceCount = 0,
  hasDirectBooking = false,
  includeApproved = true,
  settings = DEFAULT_MENTOR_BADGE_SETTINGS,
  limit = settings.profileMaxBadges,
}: BuildMentorBadgesOptions): MentorBadge[] {
  const badges: MentorBadge[] = []
  const reviewCount = reviewSummary?.totalReviews ?? mentor.totalReviews ?? 0
  const averageRating = reviewSummary?.averageRating ?? mentor.averageRating ?? 0
  const yearsOfExperience = mentor.yearsOfExperience ?? 0
  const responseTimeHours = mentor.responseTimeHours ?? Number.POSITIVE_INFINITY
  const languagesCount = mentor.languages?.filter(Boolean).length ?? 0
  const publicProofCount =
    resourceCount > 0
      ? resourceCount
      : [
          mentor.portfolioUrl,
          mentor.githubUrl,
          mentor.linkedinUrl,
          mentor.certificateUrl,
        ].filter(Boolean).length

  if (includeApproved && settings.showApprovedBadge) {
    badges.push({
      id: 'approved',
      kind: 'approved',
      label: t('mentorBadge.approved'),
      tone: 'emerald',
    })
  }

  if (settings.showFeaturedBadge && mentor.isFeatured) {
    badges.push({
      id: 'featured',
      kind: 'featured',
      label: t('mentorBadge.featured'),
      tone: 'amber',
    })
  }

  if (
    settings.showTopRatedBadge &&
    averageRating >= settings.topRatedMinRating &&
    reviewCount >= settings.topRatedMinReviews
  ) {
    badges.push({
      id: 'top-rated',
      kind: 'topRated',
      label: t('mentorBadge.topRated'),
      tone: 'amber',
    })
  }

  if (settings.showFastResponseBadge && responseTimeHours <= settings.fastResponseMaxHours) {
    badges.push({
      id: 'fast-response',
      kind: 'fastResponse',
      label: t('mentorBadge.fastResponse'),
      tone: 'sky',
    })
  }

  if (settings.showExperienceBadge && yearsOfExperience >= settings.experienceMinYears) {
    badges.push({
      id: 'experience',
      kind: 'experience',
      label: t('mentorBadge.experienceYears', { count: yearsOfExperience }),
      tone: 'slate',
    })
  }

  if (settings.showDirectBookingBadge && hasDirectBooking) {
    badges.push({
      id: 'direct-booking',
      kind: 'directBooking',
      label: t('mentorBadge.directBooking'),
      tone: 'emerald',
    })
  }

  if (settings.showPublicProofBadge && publicProofCount > 0) {
    badges.push({
      id: 'public-proof',
      kind: 'publicProof',
      label: t('mentorBadge.publicProof'),
      tone: 'slate',
    })
  }

  if (settings.showMultilingualBadge && languagesCount >= settings.multilingualMinLanguages) {
    badges.push({
      id: 'multilingual',
      kind: 'multilingual',
      label: t('mentorBadge.languagesCount', { count: languagesCount }),
      tone: 'sky',
    })
  }

  return badges.slice(0, limit)
}

export function MentorBadgePills({
  badges,
  compact = false,
  className = '',
}: {
  badges: MentorBadge[]
  compact?: boolean
  className?: string
}) {
  if (badges.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      {badges.map((badge) => (
        <span
          key={badge.id}
          className={`inline-flex items-center gap-1.5 ring-1 ring-inset ${
            compact
              ? 'rounded-md px-2 py-[5px] text-[10px] font-semibold tracking-[0.01em]'
              : 'rounded-full px-2.5 py-1 text-xs font-semibold'
          } ${TONE_CLASSES[badge.tone]}`}
        >
          <MentorBadgeIcon kind={badge.kind} compact={compact} />
          {badge.label}
        </span>
      ))}
    </div>
  )
}

function MentorBadgeIcon({
  kind,
  compact,
}: {
  kind: MentorBadgeKind
  compact: boolean
}) {
  const iconClassName = compact ? 'h-3 w-3' : 'h-4 w-4'

  switch (kind) {
    case 'approved':
      return <BadgeCheck className={iconClassName} aria-hidden="true" />
    case 'featured':
    case 'topRated':
      return <Star className={`${iconClassName} fill-current`} aria-hidden="true" />
    case 'fastResponse':
      return <Clock3 className={iconClassName} aria-hidden="true" />
    case 'experience':
      return <Briefcase className={iconClassName} aria-hidden="true" />
    case 'directBooking':
      return <CalendarDays className={iconClassName} aria-hidden="true" />
    case 'publicProof':
      return <FileText className={iconClassName} aria-hidden="true" />
    case 'multilingual':
      return <Languages className={iconClassName} aria-hidden="true" />
    default:
      return null
  }
}
