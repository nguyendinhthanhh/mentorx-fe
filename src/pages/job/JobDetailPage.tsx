import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  Clock3,
  Copy,
  DollarSign,
  FileArchive,
  FileCode2,
  FileImage,
  FileText,
  Gauge,
  Layers3,
  Lock,
  MessageSquare,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  User,
  X,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  TrendingUp,
  ArrowRight,
  MessageCircle,
  GraduationCap,
  ListTree,
  RefreshCcw,
  Tags,
  Target,
} from 'lucide-react'
import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/ui/Skeleton'
import { categoryApi } from '@/api/categoryApi'
import { jobApi } from '@/api/jobApi'
import { proposalApi } from '@/api/proposalApi'
import { negotiationApi } from '@/api/negotiationApi'
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
  [JobStatus.CLOSED]: { label: 'Closed', className: 'border-slate-200 bg-slate-50 text-slate-600' },
}

export default function JobDetailPage() {
  const { user, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const { jobId } = useParams<{ jobId: string }>()
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showProposalDetail, setShowProposalDetail] = useState(false)
  const [forceEditMode, setForceEditMode] = useState(false) // Track if we should force edit mode
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [saved, setSaved] = useState(() => Boolean(jobId && localStorage.getItem(`saved-job-${jobId}`)))
  const [copied, setCopied] = useState(false)

  const { data: job, isLoading } = useQuery(['job', jobId], () => jobApi.getById(jobId!), { enabled: !!jobId })
  const { data: categories = [] } = useQuery(['active-categories'], categoryApi.getAllActive)
  
  // Check if mentor has already submitted a proposal
  const { data: existingProposal } = useQuery(
    ['proposal', jobId, user?.userId],
    () => proposalApi.getByJobAndMentor(jobId!, user!.userId),
    { 
      enabled: !!jobId && !!user?.userId && isAuthenticated,
      retry: false,
      // Don't throw error if no proposal found (404 is expected)
      onError: () => {
        // Silently handle - no proposal exists
      }
    }
  )

  // Get latest negotiation for the existing proposal
  const { data: latestNegotiation } = useQuery(
    ['negotiation-latest', existingProposal?.id],
    () => negotiationApi.getLatest(existingProposal!.id),
    { 
      enabled: !!existingProposal?.id && existingProposal.status === 'NEGOTIATING',
      retry: false
    }
  )

  const derived = useMemo(() => {
    if (!job) return null
    return getJobDisplayData(job, categories)
  }, [categories, job])

  const ownerStatusMutation = useMutation(
    (nextStatus: JobStatus) => {
      if (!jobId) {
        throw new Error('Missing job id')
      }
      return jobApi.update(jobId, { status: nextStatus })
    },
    {
      onSuccess: async (updatedJob) => {
        await queryClient.invalidateQueries(['job', jobId])
        await queryClient.invalidateQueries(['my-posted-jobs', user?.userId])
        queryClient.setQueryData(['job', updatedJob.jobId], updatedJob)
      },
    }
  )

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
  const canCloseJob = isOwner && (job.status === JobStatus.OPEN || job.status === JobStatus.IN_PROGRESS)
  const canReopenJob = isOwner && (job.status === JobStatus.CLOSED || job.status === JobStatus.CANCELLED)

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

  const handleWithdraw = async () => {
    if (!existingProposal) return
    
    try {
      setWithdrawing(true)
      await proposalApi.withdraw(existingProposal.id)
      setShowWithdrawConfirm(false)
      // Refresh to show updated state
      window.location.reload()
    } catch (err: any) {
      alert(err.response?.data?.message || 'KhÃ´ng thá»ƒ thu há»“i proposal. Vui lÃ²ng thá»­ láº¡i.')
      setWithdrawing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5">
          <Link to="/jobs" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Back to jobs
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={JOB_TYPE_META[job.jobType]?.className}>{derived.jobTypeLabel}</Badge>
                {derived.categoryName && (
                  <Badge className="border-sky-200 bg-sky-50 text-sky-700">
                    <ListTree className="h-3.5 w-3.5" />
                    {derived.categoryName}
                  </Badge>
                )}
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

              <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-slate-950 sm:text-5xl">
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

              <div className="mt-6 grid gap-3 min-[520px]:grid-cols-2 xl:grid-cols-3">
                <SummaryTile icon={DollarSign} label="Budget" value={derived.budget} />
                <SummaryTile icon={CalendarDays} label="Deadline" value={derived.deadline} />
                <SummaryTile icon={FileText} label="Proposals" value={`${proposalCount} proposal(s)`} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-slate-400">
                <span>Updated {formatRelativeTime(job.updatedAt)}</span>
                {derived.experienceLevelLabel !== 'Open to suggestion' && (
                  <>
                    <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
                    <span>Mentor level: {derived.experienceLevelLabel}</span>
                  </>
                )}
                {derived.communicationPreferenceLabel !== 'Flexible' && (
                  <>
                    <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
                    <span>Communication: {derived.communicationPreferenceLabel}</span>
                  </>
                )}
              </div>

              {job.statusReason && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                  LÃ½ do tráº¡ng thÃ¡i: {job.statusReason}
                </div>
              )}
            </div>

            <Panel title="Mô tả công việc" icon={FileText}>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-5 sm:px-6">
                <div className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-indigo-500">
                  Job description
                </div>
                <div className="whitespace-pre-wrap text-[16px] font-medium leading-8 text-slate-800 sm:text-[17px]">
                  {job.description}
                </div>
              </div>
            </Panel>

            {hasMentorBrief(job) && (
              <Panel title="Brief dÃ nh cho mentor" icon={Target}>
                <div className="grid gap-3 md:grid-cols-2">
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                      <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
                        <Tags className="h-4 w-4 text-indigo-600" />
                        Ká»¹ nÄƒng/chá»§ Ä‘á» cáº§n náº¯m
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.requiredSkills.map((skill) => (
                          <span key={skill} className="rounded-full bg-white px-3 py-1 text-xs font-black text-indigo-700 ring-1 ring-indigo-100">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.experienceLevel && (
                    <BriefItem icon={GraduationCap} label="TrÃ¬nh Ä‘á»™ mentor mong muá»‘n" value={formatExperienceLevel(job.experienceLevel)} />
                  )}
                  {job.currentLevel && <BriefItem icon={Gauge} label="TrÃ¬nh Ä‘á»™ hiá»‡n táº¡i" value={job.currentLevel} />}
                  {job.learningGoals && <BriefItem icon={Target} label="Má»¥c tiÃªu" value={job.learningGoals} wide />}
                  {job.successCriteria && <BriefItem icon={CheckCircle2} label="TiÃªu chÃ­ thÃ nh cÃ´ng" value={job.successCriteria} wide />}
                  {job.availabilityExpectation && <BriefItem icon={CalendarDays} label="Lá»‹ch mong muá»‘n" value={job.availabilityExpectation} />}
                  {job.communicationPreference && (
                    <BriefItem icon={MessageCircle} label="KÃªnh trao Ä‘á»•i Æ°u tiÃªn" value={formatCommunicationPreference(job.communicationPreference)} />
                  )}
                </div>
              </Panel>
            )}

            {(job.attachmentUrl || (job.attachments && job.attachments.length > 0)) && (
              <Panel title="Tài liệu & Hình ảnh đính kèm" icon={Layers3}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Gá»™p táº¥t cáº£ tÃ i liá»‡u vÃ o má»™t danh sÃ¡ch Ä‘á»ƒ hiá»ƒn thá»‹ */}
                  {[
                    ...(job.attachmentUrl ? [job.attachmentUrl] : []),
                    ...(job.attachments || [])
                  ]
                  .filter((url, index, self) => self.indexOf(url) === index) // Loáº¡i bá» trÃ¹ng láº·p
                  .map((url, index) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                    const attachmentMeta = getAttachmentMeta(url, index)
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
                                Xem áº£nh gá»‘c
                              </a>
                            </div>
                          </div>
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-lg hover:shadow-indigo-100/50 dark:border-indigo-900/30 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20"
                          >
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110 ${attachmentMeta.iconClassName}`}>
                              <attachmentMeta.Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500">{attachmentMeta.badge}</p>
                              <p className="mt-1 truncate text-sm font-black text-slate-900 dark:text-white">{attachmentMeta.name}</p>
                              <p className="mt-1 text-xs font-medium text-slate-500">{attachmentMeta.description}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-indigo-500" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {isOwner && (
              <Panel title="Received Proposals" icon={MessageSquare} flush>
                <ProposalList jobId={job.jobId} />
              </Panel>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-black text-white shadow-lg shadow-indigo-200/70">
                  {getInitials(clientName)}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Client</p>
                  <h2 className="mt-1 truncate text-xl font-extrabold tracking-tight text-slate-950">{clientName}</h2>
                  <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${job.client?.emailVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {job.client?.emailVerified ? 'Email verified' : 'Verification pending'}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    Posted <span className="font-black text-slate-900">{formatRelativeTime(job.createdAt)}</span>
                  </p>
                </div>
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
                      to={`/jobs/${job.jobId}/edit`}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      <Edit className="h-4 w-4" />
                      Edit job
                    </Link>
                    {canCloseJob && (
                      <button
                        type="button"
                        onClick={() => ownerStatusMutation.mutate(JobStatus.CLOSED)}
                        disabled={ownerStatusMutation.isLoading}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 text-sm font-black text-amber-700 shadow-sm hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <X className="h-4 w-4" />
                        {ownerStatusMutation.isLoading ? 'Updating status...' : 'Close job'}
                      </button>
                    )}
                    {canReopenJob && (
                      <button
                        type="button"
                        onClick={() => ownerStatusMutation.mutate(JobStatus.OPEN)}
                        disabled={ownerStatusMutation.isLoading}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-700 shadow-sm hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        {ownerStatusMutation.isLoading ? 'Updating status...' : 'Reopen job'}
                      </button>
                    )}
                    <Link
                      to="/profile/jobs"
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white shadow-sm hover:bg-indigo-700"
                    >
                      <Briefcase className="h-4 w-4" />
                      Manage posted jobs
                    </Link>
                  </>
                ) : isAuthenticated ? (
                  <>
                    {existingProposal ? (
                      // Mentor has already submitted a proposal
                      <>
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-emerald-900">ÄÃ£ gá»­i proposal</p>
                                <p className="mt-0.5 text-xs text-emerald-700">
                                  {formatRelativeTime(existingProposal.submittedAt || existingProposal.createdAt)}
                                </p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${getProposalStatusColor(existingProposal.status)}`}>
                              {getProposalStatusLabel(existingProposal.status)}
                            </span>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-emerald-100 bg-white p-3">
                              <p className="text-emerald-600 font-bold mb-0.5">GiÃ¡ Ä‘á» xuáº¥t</p>
                              <p className="text-slate-900 font-black">{formatCurrency(existingProposal.proposedAmount || 0)}</p>
                            </div>
                            <div className="rounded-xl border border-emerald-100 bg-white p-3">
                              <p className="text-emerald-600 font-bold mb-0.5">Thá»i gian</p>
                              <p className="text-slate-900 font-black">{existingProposal.estimatedDurationDays} ngÃ y</p>
                            </div>
                          </div>

                          {existingProposal.status === 'NEGOTIATING' && latestNegotiation && (
                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                              <div className="flex items-start gap-2">
                                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-amber-900">
                                    {latestNegotiation.senderType === 'CLIENT'
                                      ? 'Client is waiting for your reply'
                                      : 'Waiting for client response'}
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-amber-800">
                                    {latestNegotiation.senderType === 'CLIENT'
                                      ? `Latest counter: ${latestNegotiation.proposedAmount ? formatCurrency(latestNegotiation.proposedAmount) : 'price update'}${latestNegotiation.estimatedDurationDays ? ` â€¢ ${latestNegotiation.estimatedDurationDays} days` : ''}`
                                      : 'Your latest negotiation update has been sent.'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowProposalDetail(true)}
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white shadow-sm hover:bg-indigo-700"
                        >
                          <Eye className="h-4 w-4" />
                          Xem chi tiáº¿t proposal
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setForceEditMode(true)
                              setShowApplyModal(true)
                            }}
                            disabled={existingProposal.status === 'ACCEPTED' || existingProposal.status === 'REJECTED'}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Edit className="h-4 w-4" />
                            {existingProposal.status === 'WITHDRAWN' ? 'Apply láº¡i' : 'Chá»‰nh sá»­a'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowWithdrawConfirm(true)}
                            disabled={existingProposal.status === 'ACCEPTED' || existingProposal.status === 'WITHDRAWN'}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-sm font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4" />
                            Thu há»“i
                          </button>
                        </div>
                        
                        {(existingProposal.status === 'ACCEPTED' || existingProposal.status === 'REJECTED') && (
                          <p className="text-xs text-slate-500 text-center">
                            {existingProposal.status === 'ACCEPTED' 
                              ? 'âš ï¸ KhÃ´ng thá»ƒ chá»‰nh sá»­a proposal Ä‘Ã£ Ä‘Æ°á»£c cháº¥p nháº­n'
                              : 'âš ï¸ KhÃ´ng thá»ƒ chá»‰nh sá»­a proposal Ä‘Ã£ bá»‹ tá»« chá»‘i'
                            }
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={!canApply || job.status === 'CLOSED'}
                          onClick={() => setShowApplyModal(true)}
                          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {job.status === JobStatus.CLOSED ? (
                            <>
                              <X className="h-4 w-4" />
                              CÃ´ng viá»‡c Ä‘Ã£ Ä‘Ã³ng
                            </>
                          ) : job.status === JobStatus.OPEN ? (
                            <>
                              <Send className="h-4 w-4" />
                              Submit proposal
                            </>
                          ) : (
                            'Job is not open'
                          )}
                        </button>
                        {job.status === JobStatus.CLOSED && (
                          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 mx-auto mb-2">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                            </div>
                            <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                              Dá»± Ã¡n nÃ y Ä‘Ã£ tÃ¬m Ä‘Æ°á»£c mentor phÃ¹ há»£p vÃ  hiá»‡n táº¡i khÃ´ng cÃ²n cháº¥p nháº­n Ä‘á» xuáº¥t má»›i.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </>
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

          </aside>
        </div>
      </main>

      {showApplyModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-indigo-600">Proposal</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {existingProposal && forceEditMode ? 'Chá»‰nh sá»­a proposal' : 'Submit your offer'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {existingProposal && forceEditMode
                    ? 'Cáº­p nháº­t thÃ´ng tin proposal cá»§a báº¡n'
                    : `Send a focused proposal for ${clientName}.`
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowApplyModal(false)
                  setForceEditMode(false)
                }}
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
              forceEditMode={forceEditMode}
              onSuccess={() => {
                setShowApplyModal(false)
                setForceEditMode(false)
                // Refetch proposal data instead of full page reload
                window.location.reload()
              }}
              onCancel={() => {
                // When user cancels edit in force edit mode, just close modal
                setShowApplyModal(false)
                setForceEditMode(false)
              }}
            />
          </div>
        </div>
      )}

      {showProposalDetail && existingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-indigo-600">Your Proposal</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Proposal Details</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Submitted {formatRelativeTime(existingProposal.submittedAt || existingProposal.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProposalDetail(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close proposal detail"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Status Badge */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Status</p>
                  <span className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black ${getProposalStatusColor(existingProposal.status)}`}>
                    {getProposalStatusLabel(existingProposal.status)}
                  </span>
                </div>
                {existingProposal.viewCount !== undefined && (
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase text-slate-500">LÆ°á»£t xem</p>
                    <p className="mt-1 text-2xl font-black text-slate-900">{existingProposal.viewCount}</p>
                  </div>
                )}
              </div>

              {/* Budget & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-2">
                    <DollarSign className="h-4 w-4" />
                    GiÃ¡ Ä‘á» xuáº¥t
                  </div>
                  <p className="text-2xl font-black text-slate-950">{formatCurrency(existingProposal.proposedAmount || 0)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-2">
                    <CalendarDays className="h-4 w-4" />
                    Thá»i gian
                  </div>
                  <p className="text-2xl font-black text-slate-950">{existingProposal.estimatedDurationDays} ngÃ y</p>
                </div>
              </div>

              {/* Latest Negotiation Info */}
              {existingProposal.status === 'NEGOTIATING' && latestNegotiation && (
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-3xl p-6 shadow-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full -mr-16 -mt-16 blur-3xl" />
                  
                  <div className="relative flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shadow-sm">
                        <MessageCircle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900">
                          {latestNegotiation.senderType === 'CLIENT' ? 'Client Ä‘á» xuáº¥t thÆ°Æ¡ng lÆ°á»£ng' : 'Báº¡n Ä‘Ã£ pháº£n há»“i thÆ°Æ¡ng lÆ°á»£ng'}
                        </h3>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-0.5">
                          {latestNegotiation.senderType === 'CLIENT' ? 'Äang chá» báº¡n pháº£n há»“i' : 'Äang chá» client pháº£n há»“i'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative bg-white rounded-2xl p-5 border border-amber-100 mb-6 shadow-sm italic text-slate-600 leading-relaxed text-sm">
                    <span className="text-4xl text-amber-200 absolute -top-2 -left-1 font-serif opacity-50">â€œ</span>
                    {latestNegotiation.message}
                    <span className="text-4xl text-amber-200 absolute -bottom-6 -right-1 font-serif opacity-50">â€</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {latestNegotiation.proposedAmount && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-100 shadow-sm">
                        <p className="text-[10px] font-black text-amber-600 uppercase mb-2 tracking-wider">GiÃ¡ thá»a thuáº­n</p>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 line-through text-xs font-bold">{existingProposal.proposedAmount} MXC</span>
                          <ArrowRight className="w-3 h-3 text-amber-500" />
                          <span className="text-lg font-black text-amber-700">{latestNegotiation.proposedAmount} MXC</span>
                        </div>
                      </div>
                    )}
                    {latestNegotiation.estimatedDurationDays && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-100 shadow-sm">
                        <p className="text-[10px] font-black text-amber-600 uppercase mb-2 tracking-wider">Thá»i gian má»›i</p>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 line-through text-xs font-bold">{existingProposal.estimatedDurationDays} ngÃ y</span>
                          <ArrowRight className="w-3 h-3 text-amber-500" />
                          <span className="text-lg font-black text-amber-700">{latestNegotiation.estimatedDurationDays} ngÃ y</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {latestNegotiation.senderType === 'CLIENT' ? (
                    <div className="mt-6">
                      <Link
                        to={`/mentor/proposals/${existingProposal.id}`}
                        className="flex w-full h-12 items-center justify-center gap-2 rounded-2xl bg-amber-600 text-sm font-black text-white hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all hover:scale-[1.02] active:scale-95"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Pháº£n há»“i ngay
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-6 p-4 bg-amber-100/30 rounded-2xl border border-dashed border-amber-300 text-center">
                      <p className="text-xs font-bold text-amber-800 flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 animate-pulse" />
                        Äang chá» client pháº£n há»“i Ä‘á» xuáº¥t cá»§a báº¡n
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Cover Letter */}
              <div>
                <p className="text-sm font-black text-slate-950 mb-3">Cover Letter</p>
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <p className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">{existingProposal.coverLetter}</p>
                </div>
              </div>

              {/* Relevant Experience */}
              {existingProposal.relevantExperience && (
                <div>
                  <p className="text-sm font-black text-slate-950 mb-3">Kinh nghiá»‡m liÃªn quan</p>
                  <div className="rounded-xl bg-indigo-50 p-4 border border-indigo-200">
                    <p className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">{existingProposal.relevantExperience}</p>
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {existingProposal.status === 'REJECTED' && existingProposal.rejectionReason && (
                <div>
                  <p className="text-sm font-black text-rose-600 mb-3">LÃ½ do tá»« chá»‘i</p>
                  <div className="rounded-xl bg-rose-50 p-4 border border-rose-200">
                    <p className="text-sm leading-7 text-rose-700">{existingProposal.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowProposalDetail(false)
                    setShowApplyModal(true)
                  }}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700"
                >
                  <Edit className="h-4 w-4" />
                  Chá»‰nh sá»­a
                </button>
                <button
                  type="button"
                  onClick={() => setShowProposalDetail(false)}
                  className="px-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  ÄÃ³ng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      {showWithdrawConfirm && existingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Thu há»“i Proposal?</h3>
            <p className="text-sm text-slate-600 text-center mb-6">
              Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n thu há»“i proposal nÃ y? HÃ nh Ä‘á»™ng nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawConfirm(false)}
                disabled={withdrawing}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 transition-all text-sm"
              >
                Há»§y
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="flex-1 flex items-center justify-center gap-2 bg-rose-600 text-white py-2.5 rounded-lg font-bold hover:bg-rose-700 disabled:bg-rose-400 transition-all text-sm"
              >
                {withdrawing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Äang xá»­ lÃ½...
                  </>
                ) : (
                  'XÃ¡c nháº­n thu há»“i'
                )}
              </button>
            </div>
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

function BriefItem({
  icon: Icon,
  label,
  value,
  wide = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50 p-4 ${wide ? 'md:col-span-2' : ''}`}>
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400">
        <Icon className="h-4 w-4 text-indigo-600" />
        {label}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{value}</p>
    </div>
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
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
        <Icon className="h-4 w-4 text-indigo-500" />
        {label}
      </div>
      <p className="mt-3 break-words text-lg font-extrabold leading-6 tracking-tight text-slate-950">{value}</p>
    </div>
  )
}

function QuickMetaCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
        <Icon className="h-4 w-4 text-slate-500" />
        {label}
      </div>
      <p className="mt-2 break-words text-sm font-black leading-6 text-slate-950">{value}</p>
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
            <Skeleton className="h-7 w-48 rounded-full" />
            <Skeleton className="mt-5 h-10 w-4/5 rounded-xl" />
            <Skeleton className="mt-4 h-5 w-2/5" />
            <div className="mt-6 grid gap-3 min-[520px]:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <Skeleton className="h-6 w-32" />
            <SkeletonText lines={6} />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

function getJobDisplayData(job: JobResponse, categories: Array<{ id?: number; categoryId?: number; name: string }>) {
  const categoryName =
    categories.find((category) => category.id === job.categoryId || category.categoryId === job.categoryId)?.name || ''

  return {
    categoryName,
    statusLabel: STATUS_META[job.status]?.label || job.status.replace(/_/g, ' '),
    jobTypeLabel: JOB_TYPE_META[job.jobType]?.label || job.jobType.replace(/_/g, ' '),
    budget: formatBudget(job),
    budgetTypeLabel: job.budgetType === BudgetType.HOURLY ? 'Hourly' : 'Fixed price',
    deadline: job.deadlineAt ? formatDate(job.deadlineAt) : 'Flexible',
    estimatedTime: job.estimatedHours ? `${job.estimatedHours} hour(s)` : getDefaultEstimate(job.jobType),
    communicationPreferenceLabel: job.communicationPreference ? formatCommunicationPreference(job.communicationPreference) : 'Flexible',
    availabilityLabel: job.availabilityExpectation || 'Flexible',
    currentLevelLabel: job.currentLevel || 'Not specified',
    experienceLevelLabel: job.experienceLevel ? formatExperienceLevel(job.experienceLevel) : 'Open to suggestion',
    prepItems: getPrepItems(job.jobType),
  }
}

function hasMentorBrief(job: JobResponse) {
  return Boolean(
    (job.requiredSkills && job.requiredSkills.length > 0) ||
      job.experienceLevel ||
      job.currentLevel ||
      job.learningGoals ||
      job.successCriteria ||
      job.availabilityExpectation ||
      job.communicationPreference
  )
}

function formatExperienceLevel(level: string) {
  const labels: Record<string, string> = {
    INTERMEDIATE: 'Mentor trung cáº¥p trá»Ÿ lÃªn',
    SENIOR: 'Mentor senior',
    EXPERT: 'ChuyÃªn gia trong lÄ©nh vá»±c',
  }
  return labels[level] || level
}

function formatCommunicationPreference(preference: string) {
  const labels: Record<string, string> = {
    CHAT: 'Chat lÃ  chÃ­nh',
    VIDEO_CALL: 'Video call',
    CODE_REVIEW: 'Review code/tÃ i liá»‡u',
    MIXED: 'Káº¿t há»£p nhiá»u hÃ¬nh thá»©c',
  }
  return labels[preference] || preference
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

function getProposalStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    DRAFT: 'NhÃ¡p',
    SUBMITTED: 'ÄÃ£ gá»­i',
    UNDER_REVIEW: 'Äang xem xÃ©t',
    NEGOTIATING: 'Äang thÆ°Æ¡ng lÆ°á»£ng',
    SHORTLISTED: 'ÄÆ°á»£c chá»n',
    ACCEPTED: 'Cháº¥p nháº­n',
    REJECTED: 'Tá»« chá»‘i',
    WITHDRAWN: 'ÄÃ£ thu há»“i',
  }
  return statusLabels[status] || status
}

function getProposalStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700 border border-slate-200',
    SUBMITTED: 'bg-blue-100 text-blue-700 border border-blue-200',
    UNDER_REVIEW: 'bg-amber-100 text-amber-700 border border-amber-200',
    NEGOTIATING: 'bg-amber-100 text-amber-700 border border-amber-200',
    SHORTLISTED: 'bg-purple-100 text-purple-700 border border-purple-200',
    ACCEPTED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    REJECTED: 'bg-rose-100 text-rose-700 border border-rose-200',
    WITHDRAWN: 'bg-gray-100 text-gray-700 border border-gray-200',
  }
  return statusColors[status] || 'bg-slate-100 text-slate-700 border border-slate-200'
}

function getAttachmentMeta(url: string, index: number) {
  const fileName = decodeURIComponent(url.split('/').pop() || `Attachment ${index + 1}`)
  const extension = (fileName.split('.').pop() || '').toLowerCase()

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
    return {
      name: fileName,
      badge: 'Image',
      description: 'Preview and open full size',
      Icon: FileImage,
      iconClassName: 'bg-emerald-50 text-emerald-600',
    }
  }

  if (['zip', 'rar', '7z'].includes(extension)) {
    return {
      name: fileName,
      badge: 'Archive',
      description: 'Compressed attachment',
      Icon: FileArchive,
      iconClassName: 'bg-amber-50 text-amber-600',
    }
  }

  if (['json', 'xml', 'yml', 'yaml', 'sql', 'js', 'ts', 'java', 'kt', 'py'].includes(extension)) {
    return {
      name: fileName,
      badge: 'Code',
      description: 'Source or config file',
      Icon: FileCode2,
      iconClassName: 'bg-violet-50 text-violet-600',
    }
  }

  return {
    name: fileName,
    badge: extension ? extension.toUpperCase() : 'Document',
    description: 'Open attachment',
    Icon: FileText,
    iconClassName: 'bg-indigo-50 text-indigo-600',
  }
}
