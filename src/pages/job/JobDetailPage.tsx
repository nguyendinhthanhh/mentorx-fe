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
      alert(err.response?.data?.message || 'Không thể thu hồi proposal. Vui lòng thử lại.')
      setWithdrawing(false)
    }
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

              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">At a glance</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Quick scan</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <QuickMetaCard icon={ListTree} label="Category" value={derived.categoryName || 'Chưa phân loại'} />
                  <QuickMetaCard icon={Briefcase} label="Work style" value={derived.jobTypeLabel} />
                  <QuickMetaCard icon={CheckCircle2} label="Status" value={derived.statusLabel} />
                  <QuickMetaCard icon={MessageCircle} label="Preferred communication" value={derived.communicationPreferenceLabel} />
                  <QuickMetaCard icon={CalendarDays} label="Availability" value={derived.availabilityLabel} />
                  <QuickMetaCard icon={GraduationCap} label="Preferred mentor level" value={derived.experienceLevelLabel} />
                </div>
              </div>

              {job.statusReason && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                  Lý do trạng thái: {job.statusReason}
                </div>
              )}
            </div>

            <Panel title="Mô tả công việc" icon={FileText}>
              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{job.description}</div>
            </Panel>

            {hasMentorBrief(job) && (
              <Panel title="Brief dành cho mentor" icon={Target}>
                <div className="grid gap-3 md:grid-cols-2">
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                      <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
                        <Tags className="h-4 w-4 text-indigo-600" />
                        Kỹ năng/chủ đề cần nắm
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
                    <BriefItem icon={GraduationCap} label="Trình độ mentor mong muốn" value={formatExperienceLevel(job.experienceLevel)} />
                  )}
                  {job.currentLevel && <BriefItem icon={Gauge} label="Trình độ hiện tại" value={job.currentLevel} />}
                  {job.learningGoals && <BriefItem icon={Target} label="Mục tiêu" value={job.learningGoals} wide />}
                  {job.successCriteria && <BriefItem icon={CheckCircle2} label="Tiêu chí thành công" value={job.successCriteria} wide />}
                  {job.availabilityExpectation && <BriefItem icon={CalendarDays} label="Lịch mong muốn" value={job.availabilityExpectation} />}
                  {job.communicationPreference && (
                    <BriefItem icon={MessageCircle} label="Kênh trao đổi ưu tiên" value={formatCommunicationPreference(job.communicationPreference)} />
                  )}
                </div>
              </Panel>
            )}

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
                <SideFact icon={ListTree} label="Category" value={derived.categoryName || 'Chưa phân loại'} />
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
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-emerald-900">Đã gửi proposal</p>
                              <p className="text-xs text-emerald-700 mt-0.5">
                                {formatRelativeTime(existingProposal.submittedAt || existingProposal.createdAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white rounded-lg p-2 border border-emerald-100">
                              <p className="text-emerald-600 font-bold mb-0.5">Giá đề xuất</p>
                              <p className="text-slate-900 font-black">{formatCurrency(existingProposal.proposedAmount || 0)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-emerald-100">
                              <p className="text-emerald-600 font-bold mb-0.5">Thời gian</p>
                              <p className="text-slate-900 font-black">{existingProposal.estimatedDurationDays} ngày</p>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-3 border border-emerald-100">
                            <p className="text-xs font-bold text-emerald-600 mb-1">Status</p>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black ${getProposalStatusColor(existingProposal.status)}`}>
                              {getProposalStatusLabel(existingProposal.status)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowProposalDetail(true)}
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white shadow-sm hover:bg-indigo-700"
                        >
                          <Eye className="h-4 w-4" />
                          Xem chi tiết proposal
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
                            {existingProposal.status === 'WITHDRAWN' ? 'Apply lại' : 'Chỉnh sửa'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowWithdrawConfirm(true)}
                            disabled={existingProposal.status === 'ACCEPTED' || existingProposal.status === 'WITHDRAWN'}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-sm font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4" />
                            Thu hồi
                          </button>
                        </div>
                        
                        {(existingProposal.status === 'ACCEPTED' || existingProposal.status === 'REJECTED') && (
                          <p className="text-xs text-slate-500 text-center">
                            {existingProposal.status === 'ACCEPTED' 
                              ? '⚠️ Không thể chỉnh sửa proposal đã được chấp nhận'
                              : '⚠️ Không thể chỉnh sửa proposal đã bị từ chối'
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
                              Công việc đã đóng
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
                              Dự án này đã tìm được mentor phù hợp và hiện tại không còn chấp nhận đề xuất mới.
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

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-slate-950">Reference</p>
              <div className="mt-4 space-y-3 text-sm">
                <DetailRow label="Budget type" value={derived.budgetTypeLabel} />
                <DetailRow label="Current level" value={derived.currentLevelLabel} />
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
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {existingProposal && forceEditMode ? 'Chỉnh sửa proposal' : 'Submit your offer'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {existingProposal && forceEditMode
                    ? 'Cập nhật thông tin proposal của bạn'
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
                    <p className="text-xs font-bold uppercase text-slate-500">Lượt xem</p>
                    <p className="mt-1 text-2xl font-black text-slate-900">{existingProposal.viewCount}</p>
                  </div>
                )}
              </div>

              {/* Budget & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-2">
                    <DollarSign className="h-4 w-4" />
                    Giá đề xuất
                  </div>
                  <p className="text-2xl font-black text-slate-950">{formatCurrency(existingProposal.proposedAmount || 0)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-2">
                    <CalendarDays className="h-4 w-4" />
                    Thời gian
                  </div>
                  <p className="text-2xl font-black text-slate-950">{existingProposal.estimatedDurationDays} ngày</p>
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
                          {latestNegotiation.senderType === 'CLIENT' ? 'Client đề xuất thương lượng' : 'Bạn đã phản hồi thương lượng'}
                        </h3>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-0.5">
                          {latestNegotiation.senderType === 'CLIENT' ? 'Đang chờ bạn phản hồi' : 'Đang chờ client phản hồi'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative bg-white rounded-2xl p-5 border border-amber-100 mb-6 shadow-sm italic text-slate-600 leading-relaxed text-sm">
                    <span className="text-4xl text-amber-200 absolute -top-2 -left-1 font-serif opacity-50">“</span>
                    {latestNegotiation.message}
                    <span className="text-4xl text-amber-200 absolute -bottom-6 -right-1 font-serif opacity-50">”</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {latestNegotiation.proposedAmount && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-100 shadow-sm">
                        <p className="text-[10px] font-black text-amber-600 uppercase mb-2 tracking-wider">Giá thỏa thuận</p>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 line-through text-xs font-bold">{existingProposal.proposedAmount} MXC</span>
                          <ArrowRight className="w-3 h-3 text-amber-500" />
                          <span className="text-lg font-black text-amber-700">{latestNegotiation.proposedAmount} MXC</span>
                        </div>
                      </div>
                    )}
                    {latestNegotiation.estimatedDurationDays && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-100 shadow-sm">
                        <p className="text-[10px] font-black text-amber-600 uppercase mb-2 tracking-wider">Thời gian mới</p>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 line-through text-xs font-bold">{existingProposal.estimatedDurationDays} ngày</span>
                          <ArrowRight className="w-3 h-3 text-amber-500" />
                          <span className="text-lg font-black text-amber-700">{latestNegotiation.estimatedDurationDays} ngày</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {latestNegotiation.senderType === 'CLIENT' ? (
                    <div className="mt-6">
                      <Link
                        to="/mentor/proposals"
                        className="flex w-full h-12 items-center justify-center gap-2 rounded-2xl bg-amber-600 text-sm font-black text-white hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all hover:scale-[1.02] active:scale-95"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Phản hồi ngay
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-6 p-4 bg-amber-100/30 rounded-2xl border border-dashed border-amber-300 text-center">
                      <p className="text-xs font-bold text-amber-800 flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 animate-pulse" />
                        Đang chờ client phản hồi đề xuất của bạn
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
                  <p className="text-sm font-black text-slate-950 mb-3">Kinh nghiệm liên quan</p>
                  <div className="rounded-xl bg-indigo-50 p-4 border border-indigo-200">
                    <p className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">{existingProposal.relevantExperience}</p>
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {existingProposal.status === 'REJECTED' && existingProposal.rejectionReason && (
                <div>
                  <p className="text-sm font-black text-rose-600 mb-3">Lý do từ chối</p>
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
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={() => setShowProposalDetail(false)}
                  className="px-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Đóng
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
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Thu hồi Proposal?</h3>
            <p className="text-sm text-slate-600 text-center mb-6">
              Bạn có chắc chắn muốn thu hồi proposal này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawConfirm(false)}
                disabled={withdrawing}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 transition-all text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="flex-1 flex items-center justify-center gap-2 bg-rose-600 text-white py-2.5 rounded-lg font-bold hover:bg-rose-700 disabled:bg-rose-400 transition-all text-sm"
              >
                {withdrawing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận thu hồi'
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
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 break-words text-sm font-black leading-5 text-slate-950">{value}</p>
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
    INTERMEDIATE: 'Mentor trung cấp trở lên',
    SENIOR: 'Mentor senior',
    EXPERT: 'Chuyên gia trong lĩnh vực',
  }
  return labels[level] || level
}

function formatCommunicationPreference(preference: string) {
  const labels: Record<string, string> = {
    CHAT: 'Chat là chính',
    VIDEO_CALL: 'Video call',
    CODE_REVIEW: 'Review code/tài liệu',
    MIXED: 'Kết hợp nhiều hình thức',
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
    DRAFT: 'Nháp',
    SUBMITTED: 'Đã gửi',
    UNDER_REVIEW: 'Đang xem xét',
    NEGOTIATING: 'Đang thương lượng',
    SHORTLISTED: 'Được chọn',
    ACCEPTED: 'Chấp nhận',
    REJECTED: 'Từ chối',
    WITHDRAWN: 'Đã thu hồi',
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
