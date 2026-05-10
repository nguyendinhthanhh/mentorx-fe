import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  DollarSign,
  FileText,
  Gauge,
  Hourglass,
  Layers3,
  Lock,
  MessageSquare,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import { jobApi } from '@/api/jobApi'
import { useAuthStore } from '@/store/authStore'
import { BudgetType, JobResponse, JobStatus, JobType } from '@/types'
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime } from '@/utils/formatters'
import ProposalCreateForm from '@/components/job/ProposalCreateForm'
import ProposalList from '@/components/job/ProposalList'

const JOB_TYPE_META: Record<JobType, { label: string; className: string }> = {
  [JobType.FREELANCE_PROJECT]: {
    label: 'Freelance project',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  [JobType.LONG_TERM_MENTORING]: {
    label: 'Long-term mentoring',
    className: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  },
  [JobType.QUICK_FIX]: {
    label: 'Quick fix',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  [JobStatus.OPEN]: { label: 'Open', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  [JobStatus.IN_PROGRESS]: { label: 'In progress', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  [JobStatus.COMPLETED]: { label: 'Completed', className: 'border-slate-200 bg-slate-50 text-slate-700' },
  [JobStatus.CANCELLED]: { label: 'Cancelled', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  [JobStatus.CLOSED]: { label: 'Closed', className: 'border-slate-200 bg-slate-50 text-slate-500' },
}

export default function JobDetailPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { jobId } = useParams<{ jobId: string }>()
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [saved, setSaved] = useState(() => Boolean(jobId && localStorage.getItem(`saved-job-${jobId}`)))
  const [copied, setCopied] = useState(false)

  const { data: job, isLoading } = useQuery(['job', jobId], () => jobApi.getById(jobId!), { enabled: !!jobId })

  const derived = useMemo(() => {
    if (!job) return null
    return getJobDisplayData(job)
  }, [job])

  if (isLoading) return <JobDetailSkeleton />

  if (!job || !derived) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] px-4 py-12 text-slate-950">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
            <Briefcase className="h-8 w-8 text-slate-300" />
          </div>
          <h1 className="mt-4 text-2xl font-black">Job not found</h1>
          <p className="mt-2 text-sm text-slate-600">This job may have been removed or is no longer available.</p>
          <Link
            to="/jobs"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to jobs
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = job.clientId === user?.userId
  const canApply = job.status === JobStatus.OPEN && !isOwner
  const clientName = getClientName(job)
  const proposalCount = getProposalCount(job)

  const toggleSaved = () => {
    if (!jobId) return
    if (saved) {
      localStorage.removeItem(`saved-job-${jobId}`)
      setSaved(false)
      return
    }
    localStorage.setItem(`saved-job-${jobId}`, 'true')
    setSaved(true)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
          <Link to="/jobs" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Back to jobs
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <button
              type="button"
              onClick={toggleSaved}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {saved ? <BookmarkCheck className="h-4 w-4 text-indigo-600" /> : <Bookmark className="h-4 w-4" />}
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={JOB_TYPE_META[job.jobType]?.className}>{derived.jobTypeLabel}</Badge>
                <Badge className={STATUS_META[job.status]?.className || 'border-slate-200 bg-slate-50 text-slate-600'}>
                  {STATUS_META[job.status]?.label || job.status}
                </Badge>
                {job.isFeatured && (
                  <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Featured
                  </Badge>
                )}
              </div>

              <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                {job.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {clientName}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" />
                  Posted {formatRelativeTime(job.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  {proposalCount} proposal(s)
                </span>
              </div>

              <div className="mt-6 grid gap-3 min-[520px]:grid-cols-2 xl:grid-cols-4">
                <SummaryTile icon={DollarSign} label="Budget" value={derived.budget} />
                <SummaryTile icon={CalendarDays} label="Deadline" value={derived.deadline} />
                <SummaryTile icon={Hourglass} label="Estimated time" value={derived.estimatedTime} />
                <SummaryTile icon={Gauge} label="Updated" value={formatRelativeTime(job.updatedAt)} />
              </div>
            </div>

            <Panel title="Mô tả công việc" icon={FileText}>
              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{job.description}</div>
            </Panel>

            {(job.attachmentUrl || (job.attachments && job.attachments.length > 0)) && (
              <Panel title="Tài liệu & Hình ảnh đính kèm" icon={Layers3}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Gộp tất cả tài liệu vào một danh sách để hiển thị */}
                  {[
                    ...(job.attachmentUrl ? [job.attachmentUrl] : []),
                    ...(job.attachments || [])
                  ]
                  .filter((url, index, self) => self.indexOf(url) === index) // Loại bỏ trùng lặp
                  .map((url, index) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                    return (
                      <div key={index} className="space-y-2">
                        {isImage ? (
                          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition-all hover:border-indigo-300">
                            <img 
                              src={url} 
                              alt={`Attachment ${index + 1}`} 
                              className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition-all group-hover:bg-slate-950/20 group-hover:opacity-100">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-900 shadow-xl transition-transform hover:scale-105"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                                Xem ảnh gốc
                              </a>
                            </div>
                          </div>
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 transition-all hover:bg-indigo-100 hover:shadow-lg hover:shadow-indigo-100/50 dark:border-indigo-900/30 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm transition-transform group-hover:scale-110 dark:bg-slate-800">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">TÀI LIỆU {index + 1}</p>
                              <p className="truncate text-xs font-bold text-slate-900 dark:text-white">Tải tài liệu chi tiết</p>
                            </div>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            <Panel title="What To Prepare" icon={Layers3}>
              <div className="grid gap-3 min-[520px]:grid-cols-3">
                {derived.prepItems.map((item) => (
                  <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </Panel>

            {isOwner && (
              <Panel title="Received Proposals" icon={MessageSquare} flush>
                <ProposalList jobId={job.jobId} />
              </Panel>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-black text-indigo-700">
                  {getInitials(clientName)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-slate-400">Client</p>
                  <h2 className="truncate text-lg font-black text-slate-950">{clientName}</h2>
                  <p className="mt-1 text-sm text-slate-500">Member since {formatDate(job.client?.createdAt || job.createdAt)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-2">
                <SideFact icon={ShieldCheck} label="Client status" value={job.client?.emailVerified ? 'Email verified' : 'Verification pending'} />
                <SideFact icon={Briefcase} label="Job type" value={derived.jobTypeLabel} />
                <SideFact icon={FileText} label="Proposals" value={`${proposalCount} received`} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-slate-950">Actions</p>
              <div className="mt-4 space-y-3">
                {isOwner ? (
                  <>
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-indigo-800">
                      You posted this job. Review proposals below and accept the mentor that best fits the work.
                    </div>
                    <Link
                      to="/profile/jobs"
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white shadow-sm hover:bg-indigo-700"
                    >
                      <Briefcase className="h-4 w-4" />
                      Manage posted jobs
                    </Link>
                  </>
                ) : isAuthenticated ? (
                  <button
                    type="button"
                    disabled={!canApply}
                    onClick={() => setShowApplyModal(true)}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Send className="h-4 w-4" />
                    {job.status === JobStatus.OPEN ? 'Submit proposal' : 'Job is not open'}
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white shadow-sm hover:bg-indigo-700"
                  >
                    <Lock className="h-4 w-4" />
                    Sign in to apply
                  </Link>
                )}

                <button
                  type="button"
                  onClick={toggleSaved}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  {saved ? <BookmarkCheck className="h-4 w-4 text-indigo-600" /> : <Bookmark className="h-4 w-4" />}
                  {saved ? 'Remove saved job' : 'Save for later'}
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  <Share2 className="h-4 w-4" />
                  {copied ? 'Link copied' : 'Share job'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-slate-950">Job Details</p>
              <div className="mt-4 space-y-3 text-sm">
                <DetailRow label="Budget type" value={derived.budgetTypeLabel} />
                <DetailRow label="Created" value={formatDateTime(job.createdAt)} />
                <DetailRow label="Last updated" value={formatDateTime(job.updatedAt)} />
                <DetailRow label="Job ID" value={job.jobId.slice(0, 8)} />
              </div>
            </div>
          </aside>
        </div>
      </main>

      {showApplyModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-indigo-600">Proposal</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Submit your offer</h2>
                <p className="mt-1 text-sm text-slate-500">Send a focused proposal for {clientName}.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close proposal form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ProposalCreateForm
              jobId={job.jobId}
              mentorId={user.userId}
              jobType={job.jobType}
              budgetType={job.budgetType}
              onSuccess={() => setShowApplyModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Panel({
  title,
  icon: Icon,
  children,
  flush = false,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  flush?: boolean
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-indigo-600" />
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
      </div>
      <div className={flush ? '' : 'rounded-xl bg-white'}>{children}</div>
    </section>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 break-words text-sm font-black leading-5 text-slate-950">{value}</p>
    </div>
  )
}

function SideFact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
        <p className="truncate text-sm font-black text-slate-950">{value}</p>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[190px] text-right font-black text-slate-950">{value}</span>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${className}`}>{children}</span>
}

function JobDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#f6f7fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="h-7 w-48 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-5 h-10 w-4/5 animate-pulse rounded-xl bg-slate-100" />
            <div className="mt-4 h-5 w-2/5 animate-pulse rounded bg-slate-100" />
          <div className="mt-6 grid gap-3 min-[520px]:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          </div>
          <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
        </div>
        <div className="space-y-4">
          <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
          <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
        </div>
      </div>
    </div>
  )
}

function getJobDisplayData(job: JobResponse) {
  return {
    jobTypeLabel: JOB_TYPE_META[job.jobType]?.label || job.jobType.replace(/_/g, ' '),
    budget: formatBudget(job),
    budgetTypeLabel: job.budgetType === BudgetType.HOURLY ? 'Hourly' : 'Fixed price',
    deadline: job.deadlineAt ? formatDate(job.deadlineAt) : 'Flexible',
    estimatedTime: job.estimatedHours ? `${job.estimatedHours} hour(s)` : getDefaultEstimate(job.jobType),
    prepItems: getPrepItems(job.jobType),
  }
}

function formatBudget(job: JobResponse) {
  if (job.budgetMinMxc && job.budgetMaxMxc) return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
  if (job.hourlyRateMxc) return `${formatCurrency(job.hourlyRateMxc)}/hr`
  return 'To be discussed'
}

function getDefaultEstimate(jobType: JobType) {
  if (jobType === JobType.QUICK_FIX) return 'Short engagement'
  if (jobType === JobType.LONG_TERM_MENTORING) return 'Ongoing'
  return 'Project based'
}

function getPrepItems(jobType: JobType) {
  if (jobType === JobType.QUICK_FIX) {
    return [
      { title: 'Current issue', description: 'Prepare screenshots, links, logs, or examples that show the problem clearly.' },
      { title: 'Expected outcome', description: 'State what should change and how success will be checked.' },
      { title: 'Availability', description: 'Share a few time windows so the mentor can start quickly.' },
    ]
  }

  if (jobType === JobType.LONG_TERM_MENTORING) {
    return [
      { title: 'Learning goal', description: 'Describe the skill, decision, or milestone you want support with.' },
      { title: 'Current level', description: 'Mention your background so mentors can tailor the plan.' },
      { title: 'Cadence', description: 'Confirm preferred session frequency and communication style.' },
    ]
  }

  return [
    { title: 'Scope', description: 'List the deliverables and any constraints that matter.' },
    { title: 'Assets', description: 'Prepare links, repos, designs, docs, or access notes needed for work.' },
    { title: 'Acceptance', description: 'Define what complete means before accepting a proposal.' },
  ]
}

function getClientName(job: JobResponse) {
  return (job as JobResponse & { clientName?: string }).clientName || job.client?.displayName || job.client?.fullName || 'Client'
}

function getProposalCount(job: JobResponse) {
  return (job as JobResponse & { proposalCount?: number }).proposalCount || 0
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const initials = parts.slice(0, 2).map((part) => part[0]).join('')
  return initials.toUpperCase() || 'C'
}
