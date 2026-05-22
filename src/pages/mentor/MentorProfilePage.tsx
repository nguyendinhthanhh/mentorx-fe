import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileText,
  Lock,
  ScanFace,
  ShieldCheck,
} from 'lucide-react'

import { mentorApi } from '@/api/mentorApi'
import MentorProfileForm from '@/components/mentor/MentorProfileForm'
import { useAuthStore } from '@/store/authStore'
import { MentorStatus, VerificationStatus } from '@/types'

export default function MentorProfilePage() {
  const { user } = useAuthStore()

  const { data: mentorProfile, isLoading } = useQuery(
    ['mentorProfile', user?.userId],
    () => mentorApi.getMentorProfile(user!.userId),
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
  const identityRequired = Boolean(mentorProfile?.identityRequired)

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-indigo-50/40 to-sky-50/30 shadow-sm">
        <div className="grid gap-6 px-5 py-6 sm:px-7 sm:py-7 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div>
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

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <FlowStep
                index={1}
                title="Professional Profile"
                subtitle={getProfessionalStatusLabel(expertiseStatus)}
                active={!approved}
                done={approved}
              />
              <FlowStep
                index={2}
                title="Mentor Review"
                subtitle={getReviewStatusLabel(mentorStatus, expertiseStatus)}
                active={pending}
                done={approved}
              />
              <FlowStep
                index={3}
                title="Payout and Identity"
                subtitle={getCombinedStatusLabel(payoutStatus, identityStatus)}
                active={
                  approved &&
                  (payoutStatus === VerificationStatus.PENDING || identityStatus === VerificationStatus.PENDING)
                }
                locked={!approved}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-white/85 p-5 shadow-sm backdrop-blur">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">Required for Mentor Mode</p>
            <div className="mt-4 space-y-3">
              <RequirementItem
                icon={<FileText className="h-4 w-4" />}
                title="Professional profile"
                text="Required to submit your mentor application."
              />
              <RequirementItem
                icon={<BadgeCheck className="h-4 w-4" />}
                title="Mentor review"
                text="Our moderation team reviews your expertise and positioning."
              />
              <RequirementItem
                icon={<ScanFace className="h-4 w-4" />}
                title="Identity verification"
                text="Optional now. Used later for trust badge, payouts, and higher-risk cases."
              />
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

      {isLoading ? (
        <div className="space-y-4 rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="h-7 w-1/3 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      ) : canEditProfile ? (
        <MentorProfileForm
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

      <section className="space-y-3">
        <CollapsedStep
          title="Step 2: Mentor Review"
          description="Moderator or Admin reviews your professional profile before unlocking Mentor Mode."
          status={getReviewStatusLabel(mentorStatus, expertiseStatus)}
          tone={approved ? 'success' : pending ? 'pending' : rejected ? 'danger' : 'neutral'}
        />
        <CollapsedStep
          title="Step 3: Payout and Identity"
          description="Set up payout before your first withdrawal. Identity can be optional or required by policy."
          status={identityRequired ? 'Identity required before withdrawal' : 'Identity optional now'}
          tone={identityRequired ? 'pending' : 'neutral'}
          locked={!approved}
        />
      </section>
    </div>
  )
}

function FlowStep({
  index,
  title,
  subtitle,
  active,
  done,
  locked,
}: {
  index: number
  title: string
  subtitle: string
  active?: boolean
  done?: boolean
  locked?: boolean
}) {
  const badgeClass = done
    ? 'bg-emerald-600 text-white'
    : active
      ? 'bg-indigo-600 text-white'
      : 'border border-slate-300 bg-white text-slate-600'

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${badgeClass}`}>
          {done ? <CheckCircle2 className="h-4 w-4" /> : index}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900">{title}</p>
            {locked ? <Lock className="h-3.5 w-3.5 text-slate-400" /> : null}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

function RequirementItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
        </div>
      </div>
    </div>
  )
}

function CollapsedStep({
  title,
  description,
  status,
  tone,
  locked,
}: {
  title: string
  description: string
  status: string
  tone: 'neutral' | 'pending' | 'success' | 'danger'
  locked?: boolean
}) {
  const toneStyles = {
    neutral: 'border-slate-200 bg-white text-slate-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    danger: 'border-rose-200 bg-rose-50 text-rose-800',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-black text-slate-950">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {locked ? <Lock className="h-4 w-4 text-slate-400" /> : null}
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneStyles[tone]}`}>
            {status}
          </span>
        </div>
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

function getProfessionalStatusLabel(status?: VerificationStatus) {
  switch (status) {
    case VerificationStatus.PENDING:
      return 'In review'
    case VerificationStatus.APPROVED:
      return 'Approved'
    case VerificationStatus.REJECTED:
      return 'Rejected'
    case VerificationStatus.NEEDS_MORE_INFO:
      return 'Needs more info'
    default:
      return 'Not submitted'
  }
}

function getReviewStatusLabel(mentorStatus?: MentorStatus, expertiseStatus?: VerificationStatus) {
  if (mentorStatus === MentorStatus.APPROVED) return 'Approved'
  if (mentorStatus === MentorStatus.REJECTED || expertiseStatus === VerificationStatus.REJECTED) return 'Rejected'
  if (expertiseStatus === VerificationStatus.NEEDS_MORE_INFO) return 'Needs more info'
  if (mentorStatus === MentorStatus.PENDING || expertiseStatus === VerificationStatus.PENDING) return 'Pending review'
  return 'Not started'
}

function getCombinedStatusLabel(payoutStatus?: VerificationStatus, identityStatus?: VerificationStatus) {
  const payout = payoutStatus && payoutStatus !== VerificationStatus.NOT_SUBMITTED ? payoutStatus : null
  const identity = identityStatus && identityStatus !== VerificationStatus.NOT_SUBMITTED ? identityStatus : null

  if (!payout && !identity) return 'Not submitted'
  if (payout === VerificationStatus.APPROVED && identity === VerificationStatus.APPROVED) return 'Fully approved'
  if (payout === VerificationStatus.REJECTED || identity === VerificationStatus.REJECTED) return 'Needs update'
  if (payout === VerificationStatus.PENDING || identity === VerificationStatus.PENDING) return 'Pending review'
  return 'In progress'
}
