import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { ArrowLeft, ArrowRight, BadgeCheck, Clock3, ShieldCheck } from 'lucide-react'
import axios from 'axios'

import { mentorApi } from '@/api/mentorApi'
import MentorProfileForm from '@/components/mentor/MentorProfileForm'
import { useAuthStore } from '@/store/authStore'
import { MentorStatus, VerificationStatus } from '@/types'

export default function MentorProfilePage() {
  const { user } = useAuthStore()

  const { data: mentorProfile } = useQuery(
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

  const mentorStatus = user.mentorStatus ?? MentorStatus.NOT_APPLIED
  const expertiseStatus = user.expertiseStatus ?? VerificationStatus.NOT_SUBMITTED
  const identityStatus = user.identityStatus ?? VerificationStatus.NOT_SUBMITTED
  const payoutStatus = user.payoutStatus ?? VerificationStatus.NOT_SUBMITTED

  const approved = mentorStatus === MentorStatus.APPROVED
  const pending = mentorStatus === MentorStatus.PENDING || expertiseStatus === VerificationStatus.PENDING
  const rejected = mentorStatus === MentorStatus.REJECTED || expertiseStatus === VerificationStatus.REJECTED
  const suspended = mentorStatus === MentorStatus.SUSPENDED
  const canEditProfile = !approved || rejected || expertiseStatus === VerificationStatus.NEEDS_MORE_INFO
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

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Become a Mentor</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Complete your professional profile to unlock Mentor Mode. Identity verification is requested later only
            when trust, payout, or compliance policy requires it.
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

      {canEditProfile ? (
        <MentorProfileForm
          key={mentorProfile ? 'existing-profile' : 'new-profile'}
          userId={user.userId}
          userEmail={user.email}
          isEmailVerified={user.emailVerified}
          initialData={mentorProfile}
          isEdit={Boolean(mentorProfile)}
        />
      ) : (
        <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-900">
            Your mentor profile is approved. You can manage packages, proposals, schedule, and earnings from Mentor
            Mode.
          </div>
          <Link
            to="/mentor/dashboard"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            Go to Mentor Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
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
            <h2 className="text-sm font-black sm:text-base">Application needs updates</h2>
            <p className="mt-1 text-sm leading-6 text-rose-900/80">
              {rejectionReason || 'Your profile needs updates before approval. Please revise and submit again.'}
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
