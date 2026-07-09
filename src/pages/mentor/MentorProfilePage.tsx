import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { ArrowRight, BadgeCheck, Clock3, ShieldCheck } from 'lucide-react'
import axios from 'axios'

import { mentorApi } from '@/api/mentorApi'
import MentorProfileForm from '@/components/mentor/MentorProfileForm'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { useAuthStore } from '@/store/authStore'
import { MentorStatus, VerificationStatus } from '@/types'

export default function MentorProfilePage() {
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
      <div className="space-y-4 py-6">
        <div className="h-28 animate-pulse rounded-[28px] bg-slate-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-[420px] animate-pulse rounded-3xl bg-slate-100" />
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
    || (expertiseStatus === VerificationStatus.NEEDS_MORE_INFO && mentorProfile?.resubmissionAllowed !== false)
  )
  const lockMessage = expertiseStatus === VerificationStatus.PENDING
    ? 'Your mentor application is under review. Editing is locked until moderators request updates.'
    : expertiseStatus === VerificationStatus.REJECTED
      ? 'Application is currently closed. Editing is locked unless moderation team requests a revision.'
      : suspended
        ? 'Mentor mode is suspended. Profile editing is locked.'
        : 'Profile editing is locked.'
  const applicationState = approved
    ? 'Approved'
    : pending
      ? 'In review'
      : rejected
        ? 'Needs update'
        : suspended
          ? 'Suspended'
          : mentorProfile
            ? 'Draft saved'
            : 'Not submitted'

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 space-y-6 py-6">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
        <div className="px-5 py-5 sm:px-7 sm:py-6">
          <Breadcrumbs
            items={[
              { label: 'Account', to: '/profile' },
              { label: 'Become a Mentor' },
            ]}
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
          />

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                Mentor application
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Become a Mentor</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                Create your professional mentor profile. Verified mentors can receive mentorship requests, career consultations, and teaching opportunities.
              </p>
              <p className="mt-3 inline-flex rounded-full bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">
                Application state: <span className="ml-1 font-bold text-slate-900">{applicationState}</span>
              </p>
            </div>

            <div className="grid w-full gap-3 sm:w-auto sm:min-w-[280px] sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Estimated time</p>
                <p className="mt-2 text-lg font-black text-slate-950">7 minutes</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Review time</p>
                <p className="mt-2 text-lg font-black text-slate-950">2-5 business days</p>
              </div>
            </div>
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
