import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { ArrowLeft, ArrowRight, BadgeCheck, Clock3, ShieldCheck } from 'lucide-react'
import axios from 'axios'

import { mentorApi } from '@/api/mentorApi'
import MentorProfileForm from '@/components/mentor/MentorProfileForm'
import { useI18n } from '@/i18n/I18nProvider'
import { useAuthStore } from '@/store/authStore'
import { MentorStatus, VerificationStatus } from '@/types'

export default function MentorProfilePage() {
  const { t } = useI18n()
  const { user } = useAuthStore()

  const { data: mentorProfile, isLoading } = useQuery(
    ['mentorProfile', user?.userId],
    async () => {
      try {
        return await mentorApi.getMentorProfile(user!.userId)
      } catch (error: any) {
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
  if (isLoading && user?.mentorStatus !== MentorStatus.NOT_APPLIED) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-28 animate-pulse rounded-[28px] bg-slate-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-[420px] animate-pulse rounded-3xl bg-slate-100" />
      </div>
    )
  }

  const mentorStatus = user.mentorStatus ?? MentorStatus.NOT_APPLIED
  const expertiseStatus = mentorProfile?.expertiseStatus ?? user.expertiseStatus ?? VerificationStatus.NOT_SUBMITTED
  const identityStatus = user.identityStatus ?? VerificationStatus.NOT_SUBMITTED
  const payoutStatus = user.payoutStatus ?? VerificationStatus.NOT_SUBMITTED

  const approved = mentorStatus === MentorStatus.APPROVED
  const pending = mentorStatus === MentorStatus.PENDING || expertiseStatus === VerificationStatus.PENDING
  const rejected = mentorStatus === MentorStatus.REJECTED || expertiseStatus === VerificationStatus.REJECTED
  const suspended = mentorStatus === MentorStatus.SUSPENDED
  const canEditProfile = !mentorProfile || (
    expertiseStatus === VerificationStatus.NOT_SUBMITTED
    || (expertiseStatus === VerificationStatus.NEEDS_MORE_INFO && mentorProfile?.resubmissionAllowed !== false)
  )
  const lockMessage = expertiseStatus === VerificationStatus.PENDING
    ? 'Your mentor application is under review. Editing is locked until moderators request updates.'
    : expertiseStatus === VerificationStatus.REJECTED
      ? 'Application is currently closed. Editing is locked unless moderation team requests a revision.'
      : suspended
        ? 'Mentor mode is suspended. Profile editing is locked.'
        : 'Profile editing is locked.'

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-indigo-50/40 to-sky-50/30 shadow-sm">
        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 hover:text-indigo-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to account
          </Link>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{t('mentor.application.title')}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            {t('mentor.application.subtitle')}
          </p>
        </div>
      </section>

      {(approved || pending || rejected || suspended) && (
        <StatusBanner
          mentorStatus={mentorStatus}
          expertiseStatus={expertiseStatus}
          rejectionReason={mentorProfile?.expertiseRejectionReason || mentorProfile?.rejectionReason}
        />
      )}

      <ReviewProgress
        hasProfile={Boolean(mentorProfile)}
        expertiseStatus={expertiseStatus}
        mentorStatus={mentorStatus}
        submittedAt={mentorProfile?.submittedAt}
        reviewedAt={mentorProfile?.expertiseReviewedAt}
      />
      {(mentorProfile?.expertiseReviewNote || mentorProfile?.expertiseRejectionReason || mentorProfile?.rejectionReason) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Moderator Note</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {mentorProfile?.expertiseReviewNote || mentorProfile?.expertiseRejectionReason || mentorProfile?.rejectionReason}
          </p>
        </section>
      )}

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
        <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
            {lockMessage}
          </div>
          {approved && (
            <Link
              to="/mentor/dashboard"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              Go to Mentor Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

    </div>
  )
}

function ReviewProgress({
  hasProfile,
  expertiseStatus,
  mentorStatus,
  submittedAt,
  reviewedAt,
}: {
  hasProfile: boolean
  expertiseStatus: VerificationStatus
  mentorStatus: MentorStatus
  submittedAt?: string
  reviewedAt?: string
}) {
  const submitted = hasProfile
  const reviewing = expertiseStatus === VerificationStatus.PENDING
  const needsMoreInfo = expertiseStatus === VerificationStatus.NEEDS_MORE_INFO
  const approved = mentorStatus === MentorStatus.APPROVED || expertiseStatus === VerificationStatus.APPROVED
  const rejected = mentorStatus === MentorStatus.REJECTED || expertiseStatus === VerificationStatus.REJECTED

  const steps = [
    {
      title: 'Profile submitted',
      detail: submittedAt ? new Date(submittedAt).toLocaleString() : 'Waiting for submission',
      done: submitted,
      active: submitted && !reviewing && !approved && !rejected && !needsMoreInfo,
    },
    {
      title: 'In review',
      detail: reviewing ? 'Moderation team is reviewing your expertise.' : 'Waiting for review',
      done: reviewing || approved || rejected || needsMoreInfo,
      active: reviewing,
    },
    {
      title: approved ? 'Approved' : rejected ? 'Rejected' : needsMoreInfo ? 'Needs more info' : 'Decision',
      detail: reviewedAt ? new Date(reviewedAt).toLocaleString() : 'Pending decision',
      done: approved || rejected || needsMoreInfo,
      active: approved || rejected || needsMoreInfo,
    },
  ]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Application progress</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className={`rounded-xl border px-4 py-3 ${
              step.active
                ? 'border-indigo-300 bg-indigo-50'
                : step.done
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50'
            }`}
          >
            <p className="text-xs font-black text-slate-500">Step {index + 1}</p>
            <p className="mt-1 text-sm font-black text-slate-900">{step.title}</p>
            <p className="mt-1 text-xs text-slate-600">{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
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
  if (mentorStatus === MentorStatus.APPROVED) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-950">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <BadgeCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-black sm:text-base">Mentor Mode unlocked</h2>
            <p className="mt-1 text-sm leading-6 text-emerald-900/80">
              Expertise review approved. You can switch to Mentor Mode right away.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (mentorStatus === MentorStatus.SUSPENDED) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-950">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-black sm:text-base">Mentor Mode suspended</h2>
            <p className="mt-1 text-sm leading-6 text-rose-900/80">
              Your account remains active in User Mode, but mentor features are temporarily disabled.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (mentorStatus === MentorStatus.REJECTED || expertiseStatus === VerificationStatus.REJECTED) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-950">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-black sm:text-base">Application was rejected</h2>
            <p className="mt-1 text-sm leading-6 text-rose-900/80">
              {rejectionReason || 'Your profile was rejected. Editing remains locked unless moderators request additional information.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">
          <Clock3 className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-sm font-black sm:text-base">Application under review</h2>
          <p className="mt-1 text-sm leading-6 text-amber-900/80">
            Our team is reviewing your expertise profile. Identity documents are not required at this stage.
          </p>
        </div>
      </div>
    </div>
  )
}

function getReviewStatusLabel(mentorStatus?: MentorStatus, expertiseStatus?: VerificationStatus) {
  if (mentorStatus === MentorStatus.APPROVED) return 'Approved'
  if (mentorStatus === MentorStatus.REJECTED || expertiseStatus === VerificationStatus.REJECTED) return 'Rejected'
  if (expertiseStatus === VerificationStatus.NEEDS_MORE_INFO) return 'Needs more info'
  if (mentorStatus === MentorStatus.PENDING || expertiseStatus === VerificationStatus.PENDING) return 'Pending review'
  return 'Not started'
}
