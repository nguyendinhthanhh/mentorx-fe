import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react'
import axios from 'axios'

import { mentorApi } from '@/api/mentorApi'
import MentorProfileForm from '@/components/mentor/MentorProfileForm'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { useI18n } from '@/i18n/I18nProvider'
import { useAuthStore } from '@/store/authStore'
import { MentorStatus, VerificationStatus } from '@/types'

export default function MentorProfilePage() {
  const { user } = useAuthStore()
  const { t } = useI18n()

  const { data: mentorProfile, isLoading } = useQuery(
    ['mentorProfile', user?.userId],
    async () => {
      try {
        return await mentorApi.getMentorProfile(user!.userId)
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return undefined
        }
        throw error
      }
    },
    {
      enabled: !!user?.userId,
      retry: false,
    }
  )

  if (!user) return null

  if (isLoading && user.mentorStatus !== MentorStatus.NOT_APPLIED) {
    return (
      <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-56 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="h-[760px] animate-pulse rounded-2xl bg-slate-200/70" />
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
        </div>
      </div>
    )
  }

  const mentorStatus = user.mentorStatus ?? MentorStatus.NOT_APPLIED
  const expertiseStatus = mentorProfile?.expertiseStatus ?? user.expertiseStatus ?? VerificationStatus.NOT_SUBMITTED

  const approved = mentorStatus === MentorStatus.APPROVED
  const pending = mentorStatus === MentorStatus.PENDING || expertiseStatus === VerificationStatus.PENDING
  const rejected = mentorStatus === MentorStatus.REJECTED || expertiseStatus === VerificationStatus.REJECTED
  const suspended = mentorStatus === MentorStatus.SUSPENDED
  const canEditProfile = !mentorProfile || (
    expertiseStatus === VerificationStatus.NOT_SUBMITTED
    || (expertiseStatus === VerificationStatus.NEEDS_MORE_INFO && mentorProfile.resubmissionAllowed !== false)
  )

  const lockMessage = expertiseStatus === VerificationStatus.PENDING
    ? t('mentor.application.locked.pending')
    : expertiseStatus === VerificationStatus.REJECTED
      ? t('mentor.application.locked.rejected')
      : suspended
        ? t('mentor.application.locked.suspended')
        : t('mentor.application.locked')

  const applicationStateKey = approved
    ? 'mentor.application.status.approved'
    : pending
      ? 'mentor.application.status.review'
      : rejected
        ? 'mentor.application.status.needsUpdate'
        : suspended
          ? 'mentor.application.status.suspended'
          : mentorProfile
            ? 'mentor.application.status.draft'
            : 'mentor.application.status.notSubmitted'

  const applicationTone = approved
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : pending
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : rejected || suspended
        ? 'border-rose-200 bg-rose-50 text-rose-800'
        : 'border-sky-200 bg-sky-50 text-sky-800'

  const flowSteps = [
    {
      title: t('mentor.application.flow.profile.title'),
      description: t('mentor.application.flow.profile.description'),
      icon: FileCheck2,
    },
    {
      title: t('mentor.application.flow.review.title'),
      description: t('mentor.application.flow.review.description'),
      icon: ShieldCheck,
    },
    {
      title: t('mentor.application.flow.mode.title'),
      description: t('mentor.application.flow.mode.description'),
      icon: BadgeCheck,
    },
  ]

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_370px]">
          <div className="p-6 sm:p-8">
            <Breadcrumbs
              items={[
                { label: t('mentor.application.breadcrumb.account'), to: '/profile' },
                { label: t('mentor.application.title') },
              ]}
              className="text-xs font-semibold text-slate-500"
            />

            <div className="mt-7 max-w-2xl">
              <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${applicationTone}`}>
                <span>{t('mentor.application.statusLabel')}</span>
                <span className="h-1 w-1 rounded-full bg-current" />
                <span>{t(applicationStateKey)}</span>
              </div>
              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {t('mentor.application.title')}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                {t('mentor.application.subtitle')}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-8 lg:border-l lg:border-t-0">
            <h2 className="text-sm font-bold text-slate-950">{t('mentor.application.flow.title')}</h2>
            <ol className="mt-5 space-y-5">
              {flowSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <li key={step.title} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-200 bg-white text-sm font-bold text-sky-700">
                      {index + 1}
                    </div>
                    <div className="min-w-0 pb-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-sky-700" />
                        <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                      </div>
                      <p className="mt-1 text-sm leading-5 text-slate-600">{step.description}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </section>

      {(approved || pending || rejected || suspended) && (
        <StatusBanner
          mentorStatus={mentorStatus}
          expertiseStatus={expertiseStatus}
          rejectionReason={mentorProfile?.expertiseRejectionReason || mentorProfile?.rejectionReason}
        />
      )}

      {(mentorProfile?.expertiseReviewNote || mentorProfile?.expertiseRejectionReason || mentorProfile?.rejectionReason) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-950">{t('mentor.application.reviewerNote')}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {mentorProfile?.expertiseReviewNote || mentorProfile?.expertiseRejectionReason || mentorProfile?.rejectionReason}
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div>
          {canEditProfile ? (
            <MentorProfileForm
              key={mentorProfile ? 'existing-profile' : 'new-profile'}
              userId={user.userId}
              userEmail={user.email}
              isEmailVerified={user.emailVerified}
              initialData={mentorProfile}
              isEdit={Boolean(mentorProfile)}
              isLocked={!canEditProfile}
              lockedMessage={lockMessage}
            />
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-700">
                {lockMessage}
              </div>
              {approved && (
                <Link
                  to="/mentor/dashboard"
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 active:translate-y-px"
                >
                  {t('mentor.application.goToDashboard')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </section>
          )}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <CircleUserRound className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-base font-bold text-slate-950">{t('mentor.application.guidance.title')}</h2>
          <ul className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
            {[
              t('mentor.application.guidance.expertise'),
              t('mentor.application.guidance.proof'),
              t('mentor.application.guidance.expectations'),
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
            {t('mentor.application.guidance.note')}
          </p>
        </aside>
      </div>
    </div>
  )
}

function StatusBanner({
  mentorStatus,
  expertiseStatus,
  rejectionReason,
}: {
  mentorStatus: MentorStatus
  expertiseStatus: VerificationStatus
  rejectionReason?: string
}) {
  const { t } = useI18n()

  const status = mentorStatus === MentorStatus.APPROVED
    ? {
      icon: BadgeCheck,
      title: t('mentor.application.banner.approved.title'),
      description: t('mentor.application.banner.approved.description'),
      tone: 'border-emerald-200 bg-emerald-50 text-emerald-950',
      iconTone: 'bg-emerald-600 text-white',
    }
    : mentorStatus === MentorStatus.SUSPENDED
      ? {
        icon: ShieldCheck,
        title: t('mentor.application.banner.suspended.title'),
        description: t('mentor.application.banner.suspended.description'),
        tone: 'border-rose-200 bg-rose-50 text-rose-950',
        iconTone: 'bg-rose-600 text-white',
      }
      : mentorStatus === MentorStatus.REJECTED || expertiseStatus === VerificationStatus.REJECTED
        ? {
          icon: ShieldCheck,
          title: t('mentor.application.banner.rejected.title'),
          description: rejectionReason || t('mentor.application.banner.rejected.description'),
          tone: 'border-rose-200 bg-rose-50 text-rose-950',
          iconTone: 'bg-rose-600 text-white',
        }
        : {
          icon: Clock3,
          title: t('mentor.application.banner.pending.title'),
          description: t('mentor.application.banner.pending.description'),
          tone: 'border-amber-200 bg-amber-50 text-amber-950',
          iconTone: 'bg-amber-500 text-white',
        }

  const Icon = status.icon

  return (
    <section className={`rounded-2xl border px-5 py-4 ${status.tone}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${status.iconTone}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold sm:text-base">{status.title}</h2>
          <p className="mt-1 text-sm leading-6 opacity-85">{status.description}</p>
        </div>
      </div>
    </section>
  )
}
