import { toast } from 'react-hot-toast'
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Github,
  Link2,
  Video,
} from 'lucide-react'

import { MentorProfileResponse, VerificationStatus } from '@/types'
import { formatDateTime } from '@/utils/formatters'
import MentorStatusChip from '@/components/admin/MentorStatusChip'
import {
  ModerationAction,
  QueueTab,
  ReviewTab,
  buildEvidenceRows,
  buildReviewHistory,
  getActionDescription,
  getActionTitle,
  getQueueFieldValue,
  getQueueStatus,
  getStatusLabel,
  queueTabs,
  requiresReason,
} from '@/pages/admin/mentorVerification.helpers'

export default function MentorApplicationReviewPanel({
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
  onSubmitAction,
  isSubmitting,
  canReviewExpertise,
  canReviewPayout,
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
  onSubmitAction: (action: ModerationAction, note: string) => void
  isSubmitting: boolean
  canReviewExpertise: boolean
  canReviewPayout: boolean
}) {
  const shellClass = 'rounded-[2.5rem] border border-white/40 bg-white/70 backdrop-blur-2xl shadow-xl shadow-slate-200/50 dark:border-slate-700/50 dark:bg-slate-900/60 dark:shadow-none transition-all duration-500 ease-out'

  if (loading) {
    return (
      <div className={shellClass}>
        <div className="border-b border-slate-200/80 px-6 py-5 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading application details...</p>
        </div>
        <div className="space-y-4 px-6 py-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-2xl border border-gray-100 p-5 dark:border-gray-800">
              <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-3 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={shellClass}>
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-8 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-gray-950 dark:text-white">Unable to load application details.</h3>
            <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">Try reopening this application after the detail endpoint responds.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={shellClass}>
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-8 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-gray-950 dark:text-white">Application not found.</h3>
            <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">This mentor application could not be located.</p>
          </div>
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
    || profile.payoutRejectionReason
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
      : canReviewPayout
        ? [
            { action: 'reject-payout' as ModerationAction, label: 'Reject payout', tone: 'danger' as const },
            { action: 'approve-payout' as ModerationAction, label: 'Approve payout', tone: 'primary' as const },
          ]
        : []

  const actionInputLabel =
    draftAction === 'reject-expertise' || draftAction === 'reject-payout'
      ? 'Reason for rejection'
      : draftAction === 'request-more-info'
        ? 'Information needed'
        : 'Optional internal note'

  const actionPlaceholder =
    draftAction === 'reject-expertise' || draftAction === 'reject-payout'
      ? 'Explain what the applicant needs to fix...'
      : draftAction === 'request-more-info'
        ? 'Tell the applicant what information or proof is missing...'
        : 'Add context for this approval if needed...'

  const handleSubmit = () => {
    if (!draftAction) return
    if (requiresReason(draftAction) && !actionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối/yêu cầu chỉnh sửa trước khi xác nhận.')
      return
    }
    onSubmitAction(draftAction, actionReason)
  }

  return (
    <div className={shellClass}>
      <div className="border-b border-white/20 bg-white/60 px-6 py-5 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/60">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-emerald-600 to-emerald-600 text-lg font-black text-white shadow-lg shadow-emerald-500/20 overflow-hidden">
            {profile.user?.avatarUrl ? (
              <img src={profile.user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              profile.user?.fullName?.charAt(0)?.toUpperCase() || 'M'
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-black text-slate-950 dark:text-white">{profile.user?.fullName || 'Mentor applicant'}</h2>
              <MentorStatusChip status={queueStatus} />
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
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-emerald-600 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 hover:bg-emerald-700 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6">
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
                  className="w-full rounded-[1.25rem] border border-slate-200/60 bg-white/70 backdrop-blur-md px-5 py-4 text-sm font-medium text-slate-900 outline-none transition-all hover:bg-white hover:border-emerald-200 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800/60 dark:bg-slate-950/50 dark:text-white dark:hover:bg-emerald-600 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 hover:bg-emerald-700 dark:focus:bg-slate-950 dark:focus:border-emerald-500/50"
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
                  <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-500 dark:text-emerald-400">Moderator Note</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{currentModeratorNote}</p>
                  </div>
                ) : null}

                {(profile.expertiseRejectionReason || profile.payoutRejectionReason) ? (
                  <div className="rounded-2xl border border-rose-200/60 bg-rose-50/50 p-5 dark:border-rose-500/20 dark:bg-rose-500/10">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-500 dark:text-rose-400">Rejection Reason</p>
                    <p className="mt-2 text-sm leading-relaxed text-rose-800 dark:text-rose-200">
                      {profile.expertiseRejectionReason || profile.payoutRejectionReason}
                    </p>
                  </div>
                ) : null}

                {!currentModeratorNote && !(profile.expertiseRejectionReason || profile.payoutRejectionReason) && (
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
                      <span className="absolute -left-[1.3125rem] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:bg-emerald-400 dark:ring-slate-900" />
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

      <div className="border-t border-slate-200/80 bg-white/95 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
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
