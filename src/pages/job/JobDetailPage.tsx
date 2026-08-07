import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { useRecordView } from '@/hooks/useAnalytics'
import { toast } from 'react-hot-toast'
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
import { contractApi } from '@/api/contractApi'
import { jobApi } from '@/api/jobApi'
import { proposalApi } from '@/api/proposalApi'
import { negotiationApi } from '@/api/negotiationApi'
import { useAuthStore } from '@/store/authStore'
import { useI18n } from '@/i18n/I18nProvider'
import { BudgetType, JobResponse, JobStatus, JobType } from '@/types'
import { isMentorApproved } from '@/utils/roleRedirect'
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime } from '@/utils/formatters'
import { getJobChatRoute } from '@/utils/jobWorkspace'
import ProposalCreateForm from '@/components/job/ProposalCreateForm'
import ProposalList from '@/components/job/ProposalList'
import { AiExplainModal } from '@/components/ai/AiExplainModal'
import { AiTaskType } from '@/api/aiApi'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

const JOB_TYPE_META: Record<JobType, { label: string; className: string }> = {
  [JobType.FREELANCE_PROJECT]: {
    label: 'Freelance project',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300',
  },
  [JobType.LONG_TERM_MENTORING]: {
    label: 'Long-term mentoring',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300',
  },
  [JobType.QUICK_FIX]: {
    label: 'Quick fix',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300',
  },
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  [JobStatus.OPEN]: { label: 'Open', className: 'border-[#BBF7D0] bg-[#EAF7EF] text-[#15803D]' },
  [JobStatus.IN_PROGRESS]: { label: 'In progress', className: 'border-[#F5A623] bg-[#FFF7E6] text-[#D97706]' },
  [JobStatus.COMPLETED]: { label: 'Completed', className: 'border-[#BBF7D0] bg-[#EAF7EF] text-[#15803D]' },
  [JobStatus.CANCELLED]: { label: 'Cancelled', className: 'border-[#FECACA] bg-[#FEE2E2] text-[#DC2626]' },
  [JobStatus.CLOSED]: { label: 'Closed', className: 'border-[#E8E1D8] bg-[#F7F3EC] text-[#64748B]' },
  [JobStatus.EXPIRED]: { label: 'Expired', className: 'border-[#E8E1D8] bg-[#F7F3EC] text-[#64748B]' },
}

const MAX_PROPOSAL_SUBMISSIONS_PER_JOB = 5

export default function JobDetailPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const { jobId } = useParams<{ jobId: string }>()
  useRecordView('job', jobId)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showProposalDetail, setShowProposalDetail] = useState(false)
  const [forceEditMode, setForceEditMode] = useState(false) // Track if we should force edit mode
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false)
  const [showAiExplain, setShowAiExplain] = useState(false)
  const [showCompleteContractConfirm, setShowCompleteContractConfirm] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawReason, setWithdrawReason] = useState('')
  const [clockNow, setClockNow] = useState(() => Date.now())
  const [saved, setSaved] = useState(() => Boolean(jobId && localStorage.getItem(`saved-job-${jobId}`)))
  const [copied, setCopied] = useState(false)

  const { data: job, isLoading } = useQuery(['job', jobId], () => jobApi.getById(jobId!), { enabled: !!jobId })
  const { data: categories = [] } = useQuery(['active-categories'], categoryApi.getAllActive)
  
  // Check if mentor has already submitted a proposal
  const { data: existingProposal } = useQuery(
    ['proposal', jobId, user?.userId],
    () => proposalApi.getByJobAndMentor(jobId!, user!.userId),
    { 
      enabled: !!jobId && !!user?.userId && isAuthenticated && isMentorApproved(user),
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

  const { data: contractPage } = useQuery(
    ['job-contracts', jobId],
    () => contractApi.getByJob(jobId!, { page: 0, size: 10 }),
    { enabled: !!jobId && !!user?.userId }
  )

  const { data: relatedJobsPage } = useQuery(
    ['related-jobs', job?.categoryId],
    () => jobApi.getOpenJobs({ categoryId: job?.categoryId, size: 5 }),
    { enabled: !!job?.categoryId }
  )

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const relatedJobs = (relatedJobsPage?.content || []).filter(j => j.jobId !== jobId).slice(0, 4)

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

  const completeContractMutation = useMutation(
    (contractId: string) => contractApi.complete(contractId),
    {
      onSuccess: async () => {
        setShowCompleteContractConfirm(false)
        toast.success('Đã đánh dấu công việc hoàn thành. Quỹ đảm bảo đã được giải ngân cho mentor.')
        await Promise.all([
          queryClient.invalidateQueries(['job', jobId]),
          queryClient.invalidateQueries(['job-contracts', jobId]),
          queryClient.invalidateQueries(['my-posted-jobs']),
          queryClient.invalidateQueries(['userBalance', user?.userId]),
        ])
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Không thể hoàn thành công việc lúc này.')
      },
    }
  )

  if (isLoading) return <JobDetailSkeleton />

  if (!job || !derived) {
    return (
      <div className="min-h-screen bg-[#f3f5f7] px-4 py-12 text-gray-900">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#e2e6f5] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <Briefcase className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mt-4 text-2xl font-black">Job not found</h1>
          <p className="mt-2 text-sm text-slate-500">This job may have been removed or is no longer available.</p>
          <Link
            to="/jobs"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to jobs
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = job.clientId === user?.userId
  const isApprovedMentor = isMentorApproved(user)
  const jobContract =
    contractPage?.content.find((contract) => contract.proposalId) ||
    contractPage?.content[0] ||
    null
  const isDeadlinePassed = Boolean(job.deadlineAt && new Date(job.deadlineAt).getTime() <= clockNow)
  const canApply = job.status === JobStatus.OPEN && !isDeadlinePassed && !isOwner && isApprovedMentor
  const shouldPromptMentorAccess = isAuthenticated && !isOwner && !isApprovedMentor
  const hasWithdrawnProposal = existingProposal?.status === 'WITHDRAWN'
  const hasSubmissionAttemptsLeft = (existingProposal?.submissionCount ?? 0) < MAX_PROPOSAL_SUBMISSIONS_PER_JOB
  const visibleProposal = existingProposal && (!hasWithdrawnProposal || !hasSubmissionAttemptsLeft) ? existingProposal : null
  const clientName = getClientName(job)
  const proposalCount = getProposalCount(job)
  const canCloseJob = isOwner && job.status === JobStatus.OPEN
  const canReopenJob = isOwner &&
    (job.status === JobStatus.CLOSED || job.status === JobStatus.CANCELLED) &&
    !isDeadlinePassed
  const needsDeadlineExtension = isOwner && (
    job.status === JobStatus.EXPIRED ||
    (job.status === JobStatus.CLOSED && isDeadlinePassed)
  )
  const canCompleteContract = Boolean(
    isOwner &&
    jobContract &&
    jobContract.status === 'UNDER_REVIEW' &&
    job.status === JobStatus.IN_PROGRESS
  )
  const canEditExistingProposal = Boolean(
    existingProposal &&
    hasSubmissionAttemptsLeft &&
    (existingProposal.status === 'DRAFT' || existingProposal.status === 'WITHDRAWN')
  )
  const canOpenProposalFlow = canApply && (!existingProposal || (hasWithdrawnProposal && hasSubmissionAttemptsLeft))

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
    const normalizedReason = withdrawReason.trim()
    if (normalizedReason.length < 10) {
      alert(t('jobs.proposalForm.withdraw.reasonMin'))
      return
    }
    
    try {
      setWithdrawing(true)
      await proposalApi.withdraw(existingProposal.id, normalizedReason)
      setShowWithdrawConfirm(false)
      setWithdrawReason('')
      toast.success('Đã thu hồi proposal.')
      await Promise.all([
        queryClient.invalidateQueries(['proposal', jobId, user?.userId]),
        queryClient.invalidateQueries(['negotiation-latest', existingProposal.id]),
      ])
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể thu hồi proposal. Vui lòng thử lại.')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#f3f5f7] text-gray-900 pb-24 lg:pb-12 overflow-hidden">
      {/* Background Meshes */}
      
      

      <main className="relative mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 z-10">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: 'Trang chủ', to: '/' },
              { label: 'Việc làm IT', to: '/jobs' },
              { label: job.title },
            ]}
          />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_400px]">
          {/* Main Column */}
          <div className="flex flex-col h-max overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            {/* TOP HERO CARD (Upwork / Premium Style) */}
            <div className="p-6 sm:p-10">
          <div className="flex flex-col">
            {/* Top Metadata Bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {derived.categoryName}
                </span>
                <span className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold ${derived.statusClass}`}>
                  {derived.statusLabel}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                  Đăng {formatRelativeTime(job.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  {proposalCount} lượt đề xuất
                </span>
              </div>
            </div>

            {/* Title & Utilities */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white leading-snug">
                {job.title}
              </h1>
              
              <div className="flex shrink-0 items-center gap-2 self-start">
                {!isOwner && canOpenProposalFlow && (
                  <button
                    onClick={toggleSaved}
                    className={`flex h-9 w-9 sm:w-auto sm:px-4 shrink-0 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-all ${
                      saved
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                    title={saved ? 'Đã lưu' : 'Lưu công việc'}
                  >
                    {saved ? <BookmarkCheck className="h-4 w-4 text-emerald-600" /> : <Bookmark className="h-4 w-4" />}
                    <span className="hidden sm:inline">{saved ? 'Đã lưu' : 'Lưu'}</span>
                  </button>
                )}
                <button 
                  onClick={copyLink} 
                  className="flex h-9 w-9 sm:w-auto sm:px-4 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  title="Chia sẻ"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{copied ? 'Đã copy' : 'Chia sẻ'}</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Chips */}
            <div className="flex flex-wrap gap-2.5">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900/50">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-slate-900 dark:text-white">{derived.budget}</span>
                <span className="text-xs text-slate-500">({derived.budgetTypeLabel})</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900/50">
                <Layers3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-slate-900 dark:text-white">{derived.jobTypeLabel}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900/50">
                <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="font-bold text-slate-900 dark:text-white">{derived.experienceLevelLabel}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900/50">
                <CalendarDays className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className={`font-bold ${
                  getTimeRemaining(job.deadlineAt) === 'Đã hết hạn'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {getTimeRemaining(job.deadlineAt)}
                </span>
                <span className="text-xs text-slate-500">({derived.deadline})</span>
              </div>
            </div>

            {/* Actions Bar */}
            {(!isOwner && canOpenProposalFlow) || shouldPromptMentorAccess ? (
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                {!isOwner && canOpenProposalFlow ? (
                  <button
                    onClick={() => {
                      setForceEditMode(hasWithdrawnProposal)
                      setShowApplyModal(true)
                    }}
                    className="flex h-10 w-full sm:w-auto min-w-[200px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:bg-emerald-800"
                  >
                    Ứng tuyển dự án này
                  </button>
                ) : shouldPromptMentorAccess ? (
                  <Link
                    to="/become-mentor"
                    className="flex h-10 w-full sm:w-auto min-w-[200px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
                  >
                    Đăng ký tài khoản Mentor để ứng tuyển
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

            
            {job.statusReason && (
              <div className="p-6 sm:p-8 bg-amber-50/50">
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm font-semibold text-amber-700 shadow-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 text-[15px]">Ghi chú trạng thái</p>
                    <p className="mt-1">{job.statusReason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Chi tiết công việc Card */}
            <section className="p-6 sm:p-10">
               <h2 className="mb-5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">Chi tiết công việc</h2>
               <div className="max-w-none">
                 <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium sm:text-base">
                   {job.description}
                 </div>
               </div>
            </section>

            {/* Yêu cầu ứng viên Card */}
            {hasMentorBrief(job) && (
               <section className="p-6 sm:p-10">
                  <h2 className="mb-6 text-xl font-bold tracking-tight text-slate-900 dark:text-white">Yêu cầu ứng viên</h2>
                  
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="mb-8">
                      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                        <Tags className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Kỹ năng bắt buộc
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.requiredSkills.map((skill) => (
                          <span 
                            key={skill} 
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-4 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 xl:grid-cols-2">
                    {job.experienceLevel && <BriefItem icon={GraduationCap} label="Cấp độ yêu cầu" value={formatExperienceLevel(job.experienceLevel)} />}
                    {job.currentLevel && <BriefItem icon={Gauge} label="Trình độ hiện tại của client" value={job.currentLevel} />}
                    {job.learningGoals && <BriefItem icon={Target} label="Mục tiêu học tập" value={job.learningGoals} wide />}
                    {job.successCriteria && <BriefItem icon={CheckCircle2} label="Tiêu chí thành công" value={job.successCriteria} wide />}
                    {job.availabilityExpectation && <BriefItem icon={CalendarDays} label="Thời gian rảnh" value={job.availabilityExpectation} />}
                    {job.communicationPreference && <BriefItem icon={MessageCircle} label="Hình thức giao tiếp" value={formatCommunicationPreference(job.communicationPreference)} />}
                  </div>
               </section>
            )}

            {/* Tài liệu đính kèm Card */}
            {(job.attachmentUrl || (job.attachments && job.attachments.length > 0)) && (
               <section className="p-6 sm:p-10">
                  <h2 className="mb-6 text-xl font-bold tracking-tight text-slate-900 dark:text-white">Tài liệu đính kèm</h2>
                  <div className="grid gap-4 lg:grid-cols-2">
                     {[
                       ...(job.attachmentUrl ? [job.attachmentUrl] : []),
                       ...(job.attachments || [])
                     ]
                     .filter((url, index, self) => self.indexOf(url) === index)
                     .map((url, index) => {
                       const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                       const attachmentMeta = getAttachmentMeta(url, index)
                       return (
                         <div key={index} className="space-y-2">
                           {isImage ? (
                             <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition-all hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-950">
                               <img 
                                 src={url} 
                                 alt={`Attachment ${index + 1}`} 
                                 className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
                               />
                               <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/30 group-hover:opacity-100">
                                 <a
                                   href={url}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-xs font-bold text-slate-900 shadow-xl transition-transform hover:scale-105"
                                 >
                                   <Eye className="h-4 w-4" />
                                   Xem ảnh
                                 </a>
                               </div>
                             </div>
                           ) : (
                             <a
                               href={url}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-700"
                             >
                               <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg shadow-sm transition-transform group-hover:scale-110 ${attachmentMeta.iconClassName}`}>
                                 <attachmentMeta.Icon className="h-5 w-5" />
                               </div>
                               <div className="min-w-0 flex-1">
                                 <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">{attachmentMeta.badge}</p>
                                 <p className="mt-0.5 truncate text-sm font-bold text-slate-900 dark:text-white">{attachmentMeta.name}</p>
                                 <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{attachmentMeta.description}</p>
                               </div>
                               <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-emerald-600 group-hover:translate-x-1" />
                             </a>
                           )}
                         </div>
                       );
                     })}
                  </div>
               </section>
            )}

            {/* Received Proposals */}
            {isOwner && (
              <section className="p-6 sm:p-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Proposals đã nhận</h2>
                  {proposalCount > 0 && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {proposalCount}
                    </span>
                  )}
                </div>
                <ProposalList jobId={job.jobId} />
              </section>
            )}
            
            {/* Related Jobs */}
            {relatedJobs && relatedJobs.length > 0 && (
              <section className="p-6 sm:p-10 bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="mb-6 text-xl font-bold tracking-tight text-slate-900 dark:text-white">Việc làm tương tự</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {relatedJobs.map((relatedJob) => (
                    <RelatedJobCard key={relatedJob.jobId} job={relatedJob} />
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Sidebar */}
          <div className="flex flex-col h-max overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 m-0 p-0 lg:sticky lg:top-24">
            
            {/* Management Actions Card */}
            {(isOwner || visibleProposal) && (
              <div className="p-6 sm:p-8">
                <h3 className="mb-4 text-base font-bold tracking-tight text-slate-900 dark:text-white">Quản lý công việc</h3>
                <div className="space-y-3">
                  {isOwner ? (
                    <>
                      {needsDeadlineExtension && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] leading-relaxed text-amber-800">
                          Yêu cầu đã hết hạn. Bạn không cần đăng lại; hãy gia hạn hạn chót trong phần chỉnh sửa để mở lại và tiếp tục nhận ứng tuyển.
                        </div>
                      )}
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-[13px] leading-relaxed text-emerald-800">
                        Bạn đã đăng công việc này. Hãy xem xét các ứng viên và chọn Mentor phù hợp nhất.
                      </div>
                      {jobContract?.fundsInEscrow && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[13px] leading-relaxed text-emerald-900">
                          <p className="font-black">Escrow secured</p>
                          <p className="mt-1">
                            {formatCurrency(jobContract.amountInEscrow || 0)} đang được giữ bởi MentorX cho tới khi bạn xác nhận hoàn thành.
                          </p>
                        </div>
                      )}
                      {jobContract && (
                        <Link
                          to={getJobChatRoute(job.jobId, jobContract.mentorId)}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-700 shadow-sm hover:bg-emerald-100 transition"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Mở Chat
                        </Link>
                      )}
                      {jobContract?.status === 'UNDER_REVIEW' && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] leading-relaxed text-amber-900">
                          Mentor đã đánh dấu công việc hoàn thành. Hãy kiểm tra sản phẩm trước khi giải ngân; nếu chưa đạt, hãy yêu cầu chỉnh sửa. Escrow vẫn được khóa trong thời gian chờ bạn xử lý.
                          {jobContract.mentorSubmittedLate && <p className="mt-2 font-bold">Bàn giao này được gửi sau deadline đã cam kết.</p>}
                          <Link
                            to={`/my-jobs/${job.jobId}`}
                            className="mt-3 inline-flex font-black text-amber-800 underline underline-offset-2 hover:text-amber-950"
                          >
                            Mở màn hình duyệt, yêu cầu chỉnh sửa hoặc dispute
                          </Link>
                        </div>
                      )}
                      {canCompleteContract && jobContract && (
                        <button
                          type="button"
                          onClick={() => setShowCompleteContractConfirm(true)}
                          disabled={completeContractMutation.isLoading}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 transition"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {completeContractMutation.isLoading ? 'Đang xử lý...' : 'Xác nhận hoàn thành'}
                        </button>
                      )}
                      <Link
                        to={`/jobs/${job.jobId}/edit`}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-gray-800 shadow-sm hover:bg-slate-50 transition"
                      >
                        <Edit className="h-4 w-4" />
                        {needsDeadlineExtension ? 'Gia hạn & mở lại' : 'Chỉnh sửa yêu cầu'}
                      </Link>
                      {canCloseJob && (
                        <button
                          type="button"
                          onClick={() => ownerStatusMutation.mutate(JobStatus.CLOSED)}
                          disabled={ownerStatusMutation.isLoading}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 text-sm font-black text-amber-700 shadow-sm hover:bg-amber-50 transition disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <X className="h-4 w-4" />
                          {ownerStatusMutation.isLoading ? 'Đang cập nhật...' : 'Đóng yêu cầu'}
                        </button>
                      )}
                      {canReopenJob && (
                        <button
                          type="button"
                          onClick={() => ownerStatusMutation.mutate(JobStatus.OPEN)}
                          disabled={ownerStatusMutation.isLoading}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          {ownerStatusMutation.isLoading ? 'Đang cập nhật...' : 'Mở lại yêu cầu'}
                        </button>
                      )}
                    </>
                  ) : visibleProposal ? (
                    <>
                      <div className={`mb-4 rounded-xl border p-4 ${visibleProposal.status === 'ACCEPTED' ? 'border-emerald-200 bg-emerald-50' : 'border-emerald-100 bg-emerald-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`flex items-center gap-2 text-sm font-bold ${visibleProposal.status === 'ACCEPTED' ? 'text-emerald-700' : 'text-emerald-700'}`}>
                            <CheckCircle2 className="w-4 h-4" /> Đã gửi proposal
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getProposalStatusColor(visibleProposal.status)}`}>
                            {getProposalStatusLabel(visibleProposal.status)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mb-4">{formatRelativeTime(visibleProposal.createdAt)}</div>
                        
                        <div className="grid gap-3 min-[420px]:grid-cols-2">
                          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                            <p className="text-gray-600 font-bold text-[11px] uppercase tracking-wider mb-1">Giá đề xuất</p>
                            <p className="text-gray-900 font-black">{formatCurrency(visibleProposal.proposedAmount || 0)}</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                            <p className="text-gray-600 font-bold text-[11px] uppercase tracking-wider mb-1">Thời gian</p>
                            <p className="text-gray-900 font-black">{visibleProposal.estimatedDurationDays} ngày</p>
                          </div>
                        </div>
                      </div>

                      {visibleProposal.status === 'ACCEPTED' && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 mb-4 text-xs font-medium text-amber-800 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                          <span>Không thể chỉnh sửa proposal đã được chấp nhận</span>
                        </div>
                      )}

                      {latestNegotiation && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4">
                          <p className="text-sm font-bold text-amber-900 mb-2">Giá đề xuất mới</p>
                          <p className="text-[16px] font-black text-amber-700">
                            {formatCurrency(latestNegotiation.proposedAmount || 0)}
                          </p>
                          <p className="text-[13px] font-medium text-amber-600 mt-1">
                            Thời gian: {latestNegotiation.estimatedDurationDays || 0} ngày
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowProposalDetail(true)}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                      >
                        <Eye className="h-4 w-4" />
                        Xem chi tiết
                      </button>

                      {jobContract && (
                        <Link
                          to={getJobChatRoute(job.jobId, job.clientId)}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-700 shadow-sm hover:bg-emerald-100 transition mt-3"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Mở chat
                        </Link>
                      )}

                      {canEditExistingProposal && (
                        <Link
                          to={`/jobs/${job.jobId}/proposals/${visibleProposal.id}/edit`}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-gray-800 shadow-sm hover:bg-slate-50 transition mt-3"
                        >
                          <Edit className="h-4 w-4" />
                          Chỉnh sửa
                        </Link>
                      )}
                      {canEditExistingProposal && (
                        <button
                          onClick={() => setShowWithdrawConfirm(true)}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-rose-600 text-[14px] font-bold hover:bg-rose-50 transition mt-2"
                        >
                          Thu hồi proposal
                        </button>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            )}

            {/* AI Assistant Callout */}
            <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Phân tích bằng AI</h3>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Hiểu rõ yêu cầu công việc và nhận gợi ý tiếp cận tối ưu.
              </p>
              <button
                onClick={() => setShowAiExplain(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Tạo bản phân tích
              </button>
            </div>

            {/* THÔNG TIN CHUNG CARD */}
            <div className="p-6 sm:p-8">
               <h3 className="mb-5 text-base font-bold tracking-tight text-slate-900 dark:text-white">Thông tin chung</h3>
               <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                     <Clock className="mt-0.5 h-4 w-4 text-slate-400 shrink-0" />
                     <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Thời hạn hoàn thành</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{getFullDateTime(job.deadlineAt)}</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-3">
                     <Briefcase className="mt-0.5 h-4 w-4 text-slate-400 shrink-0" />
                     <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Lĩnh vực</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{derived.categoryName}</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-3">
                     <MessageSquare className="mt-0.5 h-4 w-4 text-slate-400 shrink-0" />
                     <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Lượt ứng tuyển</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{proposalCount} lượt đề xuất</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-3">
                     <Eye className="mt-0.5 h-4 w-4 text-slate-400 shrink-0" />
                     <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Lượt xem</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{job.viewCount || 0} lượt xem</p>
                     </div>
                  </div>
               </div>
            </div>
            
            {/* Client Info Card */}
            <div className="p-6 sm:p-8">
              <h3 className="mb-5 text-base font-bold tracking-tight text-slate-900 dark:text-white">Thông tin Khách hàng</h3>
              <Link to={`/users/${job.clientId}`} className="group flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-100/80 text-xl font-extrabold text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-900/40 dark:text-emerald-300">
                  {job.clientAvatarUrl || job.client?.avatarUrl ? (
                    <img src={job.clientAvatarUrl || job.client?.avatarUrl} alt={clientName} className="h-full w-full object-cover" />
                  ) : (
                    getInitials(clientName)
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors dark:text-white dark:group-hover:text-emerald-400">{clientName}</h4>
                </div>
              </Link>
              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <User className="h-4 w-4 text-slate-400" />
                  Thành viên từ {formatRelativeTime(job.createdAt)}
                </div>
              </div>
            </div>


            {/* Trust & Guarantee Card */}
            <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Bảo đảm thanh toán</h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Khoản tiền được MentorX giữ an toàn và chỉ giải ngân khi công việc hoàn thành.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals & Dialogs */}
      {showApplyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => {
              setShowApplyModal(false)
              setForceEditMode(false)
            }}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-10">
            <button
              onClick={() => {
                setShowApplyModal(false)
                setForceEditMode(false)
              }}
              className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-gray-600 transition hover:bg-slate-200 hover:text-slate-900 z-10"
            >
              <X className="h-4 w-4" />
            </button>
            <ProposalCreateForm
              jobId={job.jobId}
              mentorId={user!.userId}
              jobType={job.jobType}
              budgetType={job.budgetType}
              clientBudget={job.budgetType === 'HOURLY' ? job.hourlyRateMxc : job.budgetMaxMxc}
              clientDeadline={job.deadlineAt}
              forceEditMode={forceEditMode}
              onSuccess={() => {
                setShowApplyModal(false)
                setForceEditMode(false)
                queryClient.invalidateQueries(['proposal', jobId, user?.userId])
              }}
              onCancel={() => {
                setShowApplyModal(false)
                setForceEditMode(false)
              }}
            />
          </div>
        </div>
      )}

      {showProposalDetail && existingProposal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowProposalDetail(false)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-10">
            <button
              onClick={() => setShowProposalDetail(false)}
              className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-gray-600 transition hover:bg-slate-200 hover:text-slate-900 z-10"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Chi tiết Proposal</h2>
              <p className="mt-1 text-sm text-gray-600">Proposal bạn đã gửi cho công việc này</p>
            </div>
            
            <ProposalCreateForm
              jobId={job.jobId}
              mentorId={user!.userId}
              jobType={job.jobType}
              budgetType={job.budgetType}
              clientBudget={job.budgetType === 'HOURLY' ? job.hourlyRateMxc : job.budgetMaxMxc}
              clientDeadline={job.deadlineAt}
              forceEditMode={forceEditMode}
              onSuccess={() => {
                setShowProposalDetail(false)
                setForceEditMode(false)
                queryClient.invalidateQueries(['proposal', jobId, user?.userId])
              }}
              onCancel={() => setShowProposalDetail(false)}
            />
          </div>
        </div>
      )}

      {showWithdrawConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => {
              if (withdrawing) return
              setShowWithdrawConfirm(false)
              setWithdrawReason('')
            }}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-5 shadow-inner">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-center text-xl font-bold text-gray-900 mb-2">Xác nhận thu hồi</h3>
            <p className="text-center text-sm text-gray-600 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn thu hồi proposal này không? Hành động này không thể hoàn tác và client sẽ không thể thấy proposal của bạn nữa.
            </p>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              {t('jobs.proposalForm.withdraw.reasonLabel')}
            </label>
            <textarea
              value={withdrawReason}
              onChange={(event) => setWithdrawReason(event.target.value)}
              rows={3}
              className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              placeholder={t('jobs.proposalForm.withdraw.reasonPlaceholder')}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawConfirm(false)
                  setWithdrawReason('')
                }}
                disabled={withdrawing}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 text-[15px] font-bold text-gray-800 hover:bg-slate-200 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing || withdrawReason.trim().length < 10}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3.5 text-[15px] font-bold text-white hover:bg-rose-700 transition"
              >
                {withdrawing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Thu hồi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompleteContractConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !completeContractMutation.isLoading && setShowCompleteContractConfirm(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-5 shadow-inner">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-center text-xl font-bold text-gray-900 mb-2">Hoàn thành công việc</h3>
            <p className="text-center text-sm text-gray-600 mb-6 leading-relaxed">
              Bạn xác nhận công việc này đã hoàn thành? Số tiền <strong className="text-emerald-600">{formatCurrency(jobContract?.amountInEscrow || 0)}</strong> trong Escrow sẽ được chuyển cho Mentor ngay lập tức. Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteContractConfirm(false)}
                disabled={completeContractMutation.isLoading}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 text-[15px] font-bold text-gray-800 hover:bg-slate-200 transition"
              >
                Chưa xong
              </button>
              <button
                onClick={() => jobContract && completeContractMutation.mutate(jobContract.id)}
                disabled={completeContractMutation.isLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-[15px] font-bold text-white hover:bg-emerald-700 transition"
              >
                {completeContractMutation.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Explain Modal */}
      <AiExplainModal
        open={showAiExplain}
        onOpenChange={setShowAiExplain}
        taskType={AiTaskType.JOB}
        taskId={job.jobId}
        taskTitle={job.title}
      />
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
    <div className="job-soft-section rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#94A3B8]">
        <Icon className="job-section-icon h-4 w-4 text-[#4f46e5]" />
        {label}
      </div>
      <p className="mt-3 break-words text-lg font-extrabold leading-6 tracking-tight text-[#1F2937]">{value}</p>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
        <Icon className="h-4 w-4 text-gray-600" />
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
      <span className="text-gray-600">{label}</span>
      <span className="max-w-[190px] text-right font-black text-slate-950">{value}</span>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${className}`}>{children}</span>
}

function JobDetailSkeleton() {
  return (
      <div className="min-h-screen bg-[#f3f5f7] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E8E1D8] bg-[#FFFFFF] p-7 shadow-sm">
            <Skeleton className="h-7 w-48 rounded-full" />
            <Skeleton className="mt-5 h-10 w-4/5 rounded-xl" />
            <Skeleton className="mt-4 h-5 w-2/5" />
            <div className="mt-6 grid gap-3 min-[520px]:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-4 rounded-2xl border border-[#E8E1D8] bg-[#FFFFFF] p-7 shadow-sm">
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
    <div className={`job-soft-section rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition-all hover:border-emerald-300 ${wide ? 'md:col-span-2' : ''}`}>
      <div className="mb-2 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wide text-[#64748B]">
        <Icon className="job-section-icon h-4 w-4 text-[#4f46e5]" />
        {label}
      </div>
      <p className="whitespace-pre-wrap text-[15px] font-bold leading-relaxed text-[#1F2937]">{value}</p>
    </div>
  )
}


function getTimeRemaining(deadlineAt: string | undefined | null) {
  if (!deadlineAt) return 'Không giới hạn';
  const deadline = new Date(deadlineAt);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  
  if (diff <= 0) return 'Đã hết hạn';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
  if (hours > 0) return `Còn ${hours} giờ ${minutes} phút`;
  return `Còn ${minutes} phút`;
}

function getFullDateTime(deadlineAt: string | undefined | null) {
  if (!deadlineAt) return 'Không giới hạn';
  const d = new Date(deadlineAt);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day} tháng ${month}, ${year} ${hours}:${minutes}`;
}

function getJobDisplayData(job: JobResponse, categories: Array<{ id?: number; categoryId?: number; name: string }>) {
  const categoryName =
    categories.find((category) => category.id === job.categoryId || category.categoryId === job.categoryId)?.name || ''

  return {
    categoryName,
    statusLabel: STATUS_META[job.status]?.label || job.status.replace(/_/g, ' '),
    statusClass: STATUS_META[job.status]?.className || 'border-slate-200 bg-slate-50 text-slate-700',
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
  return job.clientName || job.client?.displayName || job.client?.fullName || 'Client'
}

function getProposalCount(job: JobResponse) {
  return job.proposalCount || 0
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
    DRAFT: 'bg-slate-100 text-gray-800 border border-slate-200',
    SUBMITTED: 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]',
    UNDER_REVIEW: 'bg-[#FFF7E6] text-[#D97706] border border-[#FED7AA]',
    NEGOTIATING: 'bg-[#FFF7E6] text-[#D97706] border border-[#FED7AA]',
    SHORTLISTED: 'bg-[#FFF7E6] text-[#D97706] border border-[#FED7AA]',
    ACCEPTED: 'bg-[#EAF7EF] text-[#15803D] border border-[#BBF7D0]',
    REJECTED: 'bg-rose-100 text-rose-700 border border-rose-200',
    WITHDRAWN: 'bg-gray-100 text-gray-700 border border-gray-200',
  }
  return statusColors[status] || 'bg-slate-100 text-gray-800 border border-slate-200'
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
      iconClassName: 'bg-[#FFF7E6] text-[#D97706]',
    }
  }

  return {
    name: fileName,
    badge: extension ? extension.toUpperCase() : 'Document',
    description: 'Open attachment',
    Icon: FileText,
    iconClassName: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  }
}

function RelatedJobCard({ job }: { job: JobResponse }) {
  const clientName = getClientName(job)
  const budget = formatBudget(job)
  const initial = clientName.charAt(0).toUpperCase()

  return (
    <Link 
      to={`/jobs/${job.jobId}`} 
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-base font-extrabold text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-900/40 dark:text-emerald-300">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-bold text-slate-900 leading-snug group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">{job.title}</h3>
          <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{clientName}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5 dark:border-slate-800">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Briefcase className="h-3 w-3 text-slate-400" />
          {job.jobType.replace(/_/g, ' ')}
        </span>
        <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">{budget}</span>
      </div>
    </Link>
  )
}
