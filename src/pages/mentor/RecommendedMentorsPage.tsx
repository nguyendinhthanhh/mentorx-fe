import { fetchMentorRecommendations } from '@/api/feedApi'
import { useI18n } from '@/i18n/I18nProvider'
import type { Language, TranslationKey } from '@/i18n/translations'
import { useAuthStore } from '@/store/authStore'
import type {
  MentorRecommendationReason,
  MentorRecommendationResponse,
} from '@/types'
import { formatMxc } from '@/utils/formatters'
import {
  AlertCircle,
  Award,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Star,
  Users,
} from 'lucide-react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'

type Translate = ReturnType<typeof useI18n>['t']

const reasonKeys: Record<MentorRecommendationReason, TranslationKey> = {
  SKILL_MATCH: 'mentorRecommendations.reason.SKILL_MATCH',
  DOMAIN_MATCH: 'mentorRecommendations.reason.DOMAIN_MATCH',
  LANGUAGE_MATCH: 'mentorRecommendations.reason.LANGUAGE_MATCH',
  AVAILABLE_SCHEDULE: 'mentorRecommendations.reason.AVAILABLE_SCHEDULE',
  STRONG_RATING: 'mentorRecommendations.reason.STRONG_RATING',
  PROVEN_TRACK_RECORD: 'mentorRecommendations.reason.PROVEN_TRACK_RECORD',
  FEATURED_PROFILE: 'mentorRecommendations.reason.FEATURED_PROFILE',
  PROFILE_QUALITY: 'mentorRecommendations.reason.PROFILE_QUALITY',
}

export default function RecommendedMentorsPage() {
  const { user } = useAuthStore()
  const { t, language } = useI18n()
  const { data: mentors, isLoading, error } = useQuery(
    ['recommended-mentors', user?.userId],
    () => fetchMentorRecommendations(50),
    { enabled: Boolean(user), retry: 1 }
  )

  if (!user) {
    return (
      <section className="mx-auto max-w-xl py-20 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white">
          <Users className="h-6 w-6 text-slate-500" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          {t('mentorRecommendations.loginTitle')}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          {t('mentorRecommendations.loginDescription')}
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
        >
          {t('mentorRecommendations.loginAction')}
        </Link>
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <Link
        to="/profile"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {t('mentorRecommendations.back')}
      </Link>

      <header className="border-l-4 border-amber-400 bg-slate-50 px-6 py-6 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
          {t('mentorRecommendations.eyebrow')}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {t('mentorRecommendations.title')}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          {t('mentorRecommendations.description')}
        </p>
      </header>

      {isLoading ? (
        <div
          className="flex min-h-56 items-center justify-center border border-slate-200 bg-white"
          aria-live="polite"
        >
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-700" aria-hidden="true" />
            <p className="mt-3 text-sm text-slate-600">
              {t('mentorRecommendations.loading')}
            </p>
          </div>
        </div>
      ) : null}

      {error && !isLoading ? (
        <div
          role="alert"
          className="flex items-start gap-3 border border-red-200 bg-red-50 p-5"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-red-950">
              {t('mentorRecommendations.errorTitle')}
            </h2>
            <p className="mt-1 text-sm text-red-800">
              {t('mentorRecommendations.errorDescription')}
            </p>
          </div>
        </div>
      ) : null}

      {!isLoading && mentors && mentors.length > 0 ? (
        <>
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-800">
              {t('mentorRecommendations.results', { count: mentors.length })}
            </p>
            {mentors.some((mentor) => mentor.personalized) ? (
              <p className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                <BadgeCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                {t('mentorRecommendations.rankingNote')}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {mentors.map((mentor) => (
              <MentorCard
                key={mentor.userId}
                mentor={mentor}
                t={t}
                language={language}
              />
            ))}
          </div>
        </>
      ) : null}

      {!isLoading && mentors?.length === 0 ? (
        <section className="border border-slate-200 bg-white px-6 py-14 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold text-slate-950">
            {t('mentorRecommendations.emptyTitle')}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
            {t('mentorRecommendations.emptyDescription')}
          </p>
          <Link
            to="/profile"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
          >
            {t('mentorRecommendations.updateProfile')}
          </Link>
        </section>
      ) : null}
    </div>
  )
}

function MentorCard({
  mentor,
  t,
  language,
}: {
  mentor: MentorRecommendationResponse
  t: Translate
  language: Language
}) {
  const visibleSkills =
    mentor.matchingSkills.length > 0 ? mentor.matchingSkills : mentor.skills
  const skillLabel =
    mentor.matchingSkills.length > 0
      ? t('mentorRecommendations.matchingSkills')
      : t('mentorRecommendations.expertise')

  return (
    <article className="flex h-full flex-col border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-600 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 hover:bg-emerald-700 text-lg font-bold text-white">
          {mentor.avatarUrl ? (
            <img
              src={mentor.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            mentor.fullName.charAt(0).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-bold text-slate-950">
              {mentor.displayName || mentor.fullName}
            </h2>
            {mentor.isFeatured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
                <Award className="h-3 w-3" aria-hidden="true" />
                {t('mentorRecommendations.featured')}
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
            {mentor.headline || t('mentorRecommendations.notProvided')}
          </p>
        </div>

        <span
          className={
            mentor.personalized
              ? 'shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800'
              : 'shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700'
          }
        >
          {mentor.personalized
            ? t('mentorRecommendations.profileFit', {
                score: Math.round(mentor.matchScore),
              })
            : t('mentorRecommendations.suggested')}
        </span>
      </div>

      {visibleSkills.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {skillLabel}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {visibleSkills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700"
              >
                {skill}
              </span>
            ))}
            {visibleSkills.length > 5 ? (
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                +{visibleSkills.length - 5}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-slate-100 py-4 text-sm">
        <Metric
          label={t('mentorRecommendations.rate')}
          value={
            mentor.hourlyRateMxc
              ? `${formatMxc(mentor.hourlyRateMxc, language)} ${t('mentorRecommendations.perHour')}`
              : t('mentorRecommendations.flexible')
          }
        />
        <Metric
          label={t('mentorRecommendations.experience')}
          value={
            mentor.yearsOfExperience
              ? t('mentorRecommendations.years', {
                  count: mentor.yearsOfExperience,
                })
              : t('mentorRecommendations.notProvided')
          }
        />
        <Metric
          label={t('mentorRecommendations.rating')}
          value={
            mentor.totalReviews > 0 && mentor.averageRating != null
              ? `${mentor.averageRating.toFixed(1)} (${mentor.totalReviews})`
              : t('mentorRecommendations.noRatings')
          }
          icon={<Star className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />}
        />
        <Metric
          label={t('mentorRecommendations.available')}
          value={
            mentor.isAvailable
              ? t('mentorRecommendations.available')
              : t('mentorRecommendations.scheduleUnavailable')
          }
          icon={<Clock3 className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />}
        />
      </dl>

      {mentor.reasonCodes.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {t('mentorRecommendations.why')}
          </p>
          <ul className="mt-2 space-y-2">
            {mentor.reasonCodes.slice(0, 3).map((reason) => (
              <li
                key={reason}
                className="flex items-start gap-2 text-sm leading-5 text-slate-700"
              >
                <BadgeCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />
                {t(reasonKeys[reason])}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Link
        to={`/mentors/${mentor.userId}`}
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
      >
        {t('mentorRecommendations.viewProfile')}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  )
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
    </div>
  )
}
