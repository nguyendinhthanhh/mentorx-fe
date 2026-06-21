import { useMemo, useState } from 'react'
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
import { BudgetType, JobResponse, JobStatus, JobType } from '@/types'
import { isMentorApproved } from '@/utils/roleRedirect'
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime } from '@/utils/formatters'
import { getJobChatRoute } from '@/utils/jobWorkspace'
import ProposalCreateForm from '@/components/job/ProposalCreateForm'
import ProposalList from '@/components/job/ProposalList'
import { AiExplainModal } from '@/components/ai/AiExplainModal'
import { AiTaskType } from '@/api/aiApi'

const JOB_TYPE_META: Record<JobType, { label: string; className: string }> = {
  [JobType.FREELANCE_PROJECT]: {
    label: 'Freelance project',
    className: 'border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5]',
  },
  [JobType.LONG_TERM_MENTORING]: {
    label: 'Long-term mentoring',
    className: 'border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5]',
  },
  [JobType.QUICK_FIX]: {
    label: 'Quick fix',
    className: 'border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5]',
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

export default function JobDetailPage() {
  const { user, isAuthenticated } = useAuthStore()
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
        toast.success('Job marked as completed. Escrow has been released to the mentor.')
        await Promise.all([
          queryClient.invalidateQueries(['job', jobId]),
          queryClient.invalidateQueries(['job-contracts', jobId]),
          queryClient.invalidateQueries(['my-posted-jobs']),
          queryClient.invalidateQueries(['userBalance', user?.userId]),
        ])
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Unable to complete this job right now.')
      },
    }
  )

  if (isLoading) return <JobDetailSkeleton />

  if (!job || !derived) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] px-4 py-12 text-[#1b2252]">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#e2e6f5] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef2ff]">
            <Briefcase className="h-8 w-8 text-[#94A3B8]" />
          </div>
          <h1 className="mt-4 text-2xl font-black">Job not found</h1>
          <p className="mt-2 text-sm text-[#64748B]">This job may have been removed or is no longer available.</p>
          <Link
            to="/jobs"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4f46e5] px-5 text-sm font-black text-white transition hover:bg-[#4338ca]"
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
  const canApply = job.status === JobStatus.OPEN && !isOwner && isApprovedMentor
  const shouldPromptMentorAccess = isAuthenticated && !isOwner && !isApprovedMentor
  const clientName = getClientName(job)
  const proposalCount = getProposalCount(job)
  const canCloseJob = isOwner && job.status === JobStatus.OPEN
  const canReopenJob = isOwner && (job.status === JobStatus.CLOSED || job.status === JobStatus.CANCELLED)
  const canCompleteContract = Boolean(
    isOwner &&
    jobContract &&
    jobContract.status !== 'COMPLETED' &&
    job.status === JobStatus.IN_PROGRESS
  )
  const canEditSubmittedProposal = Boolean(
    existingProposal &&
    (existingProposal.status === 'DRAFT' || existingProposal.status === 'WITHDRAWN')
  )

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
    <div className="job-detail-theme topcv-job-font min-h-screen bg-[#f7f8fc] text-[#1b2252] pb-24 lg:pb-12">
      <style>{`
        .job-detail-theme {
          background-color: #f7f8fc;
          color: #1b2252;
        }
        .job-detail-theme .job-surface {
          border-color: #e2e6f5 !important;
          background-color: #ffffff !important;
        }
        .job-detail-theme .job-soft-section {
          border-color: #e2e6f5 !important;
          background-color: #f8faff !important;
        }
        .job-detail-theme .job-metric-card {
          border-color: #e2e6f5 !important;
          background-color: #ffffff !important;
        }
        .job-detail-theme .job-metric-card p:first-of-type {
          color: #64748b !important;
        }
        .job-detail-theme .job-metric-card p:last-of-type {
          color: #1b2252 !important;
        }
        .job-detail-theme .job-metric-card svg,
        .job-detail-theme .job-section-icon,
        .job-detail-theme .job-accent-text {
          color: #4f46e5 !important;
        }
        .job-detail-theme .job-accent-chip {
          border-color: #c7d2fe !important;
          background-color: #eef2ff !important;
          color: #4f46e5 !important;
        }
        .job-detail-theme .job-warning-chip {
          border-color: #fde68a !important;
          background-color: #fff7e6 !important;
          color: #d97706 !important;
        }
        .job-detail-theme .job-primary-btn,
        .job-detail-theme .bg-indigo-600,
        .job-detail-theme .bg-\\[\\#4F46E5\\] {
          background-color: #4f46e5 !important;
          color: #ffffff !important;
          box-shadow: none !important;
        }
        .job-detail-theme .job-primary-btn:hover,
        .job-detail-theme .hover\\:bg-indigo-700:hover,
        .job-detail-theme .hover\\:bg-\\[\\#4338CA\\]:hover {
          background-color: #4338ca !important;
        }
        .job-detail-theme .disabled\\:bg-slate-300:disabled,
        .job-detail-theme .disabled\\:bg-\\[\\#94A3B8\\]:disabled,
        .job-detail-theme .disabled\\:bg-emerald-400:disabled {
          background-color: #e2e6f5 !important;
          color: #94a3b8 !important;
        }
        .job-detail-theme .job-secondary-btn,
        .job-detail-theme .border-slate-200.bg-white,
        .job-detail-theme .border-\\[\\#E6EAF0\\].bg-\\[\\#FFFFFF\\] {
          border-color: #e2e6f5 !important;
        }
        .job-detail-theme .job-secondary-btn:hover,
        .job-detail-theme .hover\\:bg-slate-50:hover,
        .job-detail-theme .hover\\:bg-\\[\\#F5F6FA\\]:hover {
          background-color: #f8faff !important;
        }
        .job-detail-theme .text-\\[\\#4F46E5\\],
        .job-detail-theme .text-indigo-600,
        .job-detail-theme .text-indigo-700,
        .job-detail-theme .text-indigo-800,
        .job-detail-theme .text-indigo-950 {
          color: #4f46e5 !important;
        }
        .job-detail-theme .text-blue-600,
        .job-detail-theme .text-blue-700,
        .job-detail-theme .text-blue-900,
        .job-detail-theme .text-purple-700,
        .job-detail-theme .text-violet-600 {
          color: #4f46e5 !important;
        }
        .job-detail-theme .text-emerald-950 {
          color: #15803d !important;
        }
        .job-detail-theme .text-rose-950 {
          color: #dc2626 !important;
        }
        .job-detail-theme .bg-\\[\\#4F46E5\\]\\/10 {
          background-color: #eef2ff !important;
        }
        .job-detail-theme .border-indigo-100,
        .job-detail-theme .border-indigo-200,
        .job-detail-theme .border-blue-100,
        .job-detail-theme .border-blue-200,
        .job-detail-theme .border-purple-200,
        .job-detail-theme .border-violet-100 {
          border-color: #c7d2fe !important;
        }
        .job-detail-theme .bg-indigo-50,
        .job-detail-theme .bg-indigo-50\\/80,
        .job-detail-theme .bg-blue-50,
        .job-detail-theme .bg-blue-100,
        .job-detail-theme .bg-purple-100,
        .job-detail-theme .bg-violet-50 {
          background-color: #eef2ff !important;
        }
        .job-detail-theme .group-hover\\:text-\\[\\#4F46E5\\]:hover,
        .job-detail-theme .group-hover\\:text-indigo-600:hover {
          color: #4f46e5 !important;
        }
        .job-detail-theme .group-hover\\:text-white:hover {
          color: #ffffff !important;
        }
        .job-detail-theme .hover\\:border-indigo-300:hover,
        .job-detail-theme .hover\\:border-indigo-400:hover,
        .job-detail-theme .hover\\:border-\\[\\#4F46E5\\]:hover {
          border-color: #4f46e5 !important;
        }
        .job-detail-theme .bg-gradient-to-r,
        .job-detail-theme .bg-gradient-to-br {
          background-image: none !important;
        }
        .job-detail-theme .backdrop-blur-sm {
          backdrop-filter: none !important;
        }
        .job-detail-theme hr {
          border-color: #e8ecf8 !important;
        }
      `}</style>
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/jobs" className="inline-flex items-center gap-2 text-sm font-bold text-[#64748B] transition-colors hover:text-[#4f46e5]">
            <ArrowLeft className="h-4 w-4" />
            Về danh sách việc làm
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="job-surface overflow-hidden rounded-2xl border border-[#E8E1D8] bg-[#FFFFFF] p-5 shadow-sm sm:p-8 md:p-10">
              {/* Header Section */}
              <div className="mb-10">
                <h1 className="mb-4 text-[24px] font-extrabold leading-tight text-[#111827] sm:text-[32px]">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px] font-medium text-[#64748B]">
                  <span className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-[#94A3B8]" />
                    Đăng {formatRelativeTime(job.createdAt)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[#94A3B8]" />
                    {derived.categoryName}
                  </span>
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#94A3B8]" />
                    <strong className="text-[#111827]">{proposalCount}</strong> lượt ứng tuyển
                  </span>
                </div>
                
                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge className="border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5]">
                    <Briefcase className="h-3.5 w-3.5" />
                    {derived.categoryName}
                  </Badge>
                  <Badge className={JOB_TYPE_META[job.jobType]?.className || 'border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5]'}>
                    <Layers3 className="h-3.5 w-3.5" />
                    {derived.jobTypeLabel}
                  </Badge>
                  <Badge className={STATUS_META[job.status]?.className || 'border-[#E8E1D8] bg-[#F7F3EC] text-[#64748B]'}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {derived.statusLabel}
                  </Badge>
                </div>

                {/* Inline Client Info */}
                <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#E8E1D8] bg-[#F7F3EC] p-4 sm:max-w-md sm:flex-row sm:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] text-lg font-black text-[#4F46E5]">
                    {getInitials(clientName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-extrabold text-[#111827]">{clientName}</h3>
                      {job.client?.emailVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#BBF7D0] bg-[#EAF7EF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#15803D]">
                          <CheckCircle2 className="h-3 w-3" />
                          Đã xác thực
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#FED7AA] bg-[#FFF7E6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D97706]">
                          <Clock className="h-3 w-3" />
                          Chưa xác thực
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-[#64748B]">
                      <User className="h-3.5 w-3.5 text-[#94A3B8]" />
                      <span>Thành viên từ {formatRelativeTime(job.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {job.statusReason && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#FED7AA] bg-[#FFF7E6] px-4 py-3 text-sm font-semibold text-[#D97706]">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900">Ghi chú trạng thái</p>
                    <p className="mt-0.5">{job.statusReason}</p>
                  </div>
                </div>
              )}
              {/* Highlights Row */}
              <div className="mb-10 grid gap-4 min-[520px]:grid-cols-2 xl:grid-cols-4">
                <div className="job-metric-card rounded-2xl border border-[#E8E1D8] bg-white p-5 shadow-sm">
                  <p className="text-[12px] text-indigo-600 font-extrabold uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-indigo-500" /> Ngân sách</p>
                  <p className="font-black text-indigo-950 text-[18px]">{derived.budget}</p>
                </div>
                <div className="job-metric-card rounded-2xl border border-[#E8E1D8] bg-white p-5 shadow-sm">
                  <p className="text-[12px] text-emerald-600 font-extrabold uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-emerald-500" /> Hình thức</p>
                  <p className="font-black text-emerald-950 text-[18px]">{derived.jobTypeLabel}</p>
                </div>
                <div className="job-metric-card rounded-2xl border border-[#E8E1D8] bg-white p-5 shadow-sm">
                  <p className="text-[12px] text-amber-600 font-extrabold uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Layers3 className="w-4 h-4 text-amber-500" /> Cấp bậc</p>
                  <p className="font-black text-amber-950 text-[18px]">{derived.experienceLevelLabel}</p>
                </div>
                <div className="job-metric-card rounded-2xl border border-[#E8E1D8] bg-white p-5 shadow-sm">
                  <p className="text-[12px] text-rose-600 font-extrabold uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Clock3 className="w-4 h-4 text-rose-500" /> Hạn nộp</p>
                  <p className="font-black text-rose-950 text-[18px]">{derived.deadline}</p>
                </div>
              </div>

              {/* Job Description */}
              <div className="mb-10">
                <h2 className="mb-5 flex items-center gap-3 text-[22px] font-black text-[#111827]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF]">
                    <FileText className="job-section-icon h-5 w-5" />
                  </span>
                  Chi tiết công việc
                </h2>
              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-[15px] leading-8 text-[#475569]">
                  {job.description}
                </div>
              </div>
            </div>

              <hr className="my-10 border-[#F0EAE3]" />

              {/* Mentor Brief Section */}
              {hasMentorBrief(job) && (
                <div className="mb-10">
                  <h2 className="mb-6 flex items-center gap-3 text-[22px] font-black text-[#111827]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF]">
                      <ListTree className="job-section-icon h-5 w-5" />
                    </span>
                    Yêu cầu ứng viên
                  </h2>
                  
                  {/* Required Skills */}
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="mb-8">
                      <div className="mb-4 flex items-center gap-2 text-[16px] font-extrabold text-slate-900">
                        <Tags className="job-accent-text h-5 w-5 text-indigo-500" />
                        Kỹ năng bắt buộc
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.requiredSkills.map((skill) => (
                          <span 
                            key={skill} 
                            className="job-accent-chip inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-4 py-2 text-[14px] font-bold text-indigo-700 transition hover:bg-indigo-100 hover:text-indigo-800 shadow-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Requirements Grid */}
                  <div className="grid gap-4 xl:grid-cols-2">
                    {job.experienceLevel && (
                      <BriefItem icon={GraduationCap} label="Cấp độ yêu cầu" value={formatExperienceLevel(job.experienceLevel)} />
                    )}
                    {job.currentLevel && <BriefItem icon={Gauge} label="Trình độ hiện tại của client" value={job.currentLevel} />}
                    {job.learningGoals && <BriefItem icon={Target} label="Mục tiêu học tập" value={job.learningGoals} wide />}
                    {job.successCriteria && <BriefItem icon={CheckCircle2} label="Tiêu chí thành công" value={job.successCriteria} wide />}
                    {job.availabilityExpectation && <BriefItem icon={CalendarDays} label="Thời gian rảnh" value={job.availabilityExpectation} />}
                    {job.communicationPreference && (
                      <BriefItem icon={MessageCircle} label="Hình thức giao tiếp" value={formatCommunicationPreference(job.communicationPreference)} />
                    )}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {(job.attachmentUrl || (job.attachments && job.attachments.length > 0)) && (
                <>
                  {hasMentorBrief(job) && <hr className="my-10 border-[#F0EAE3]" />}
                  <div>
                    <h2 className="mb-6 flex items-center gap-3 text-[22px] font-black text-[#111827]">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF]">
                        <FileArchive className="job-section-icon h-5 w-5" />
                      </span>
                      Tài liệu đính kèm
                    </h2>
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
                              <div className="job-soft-section group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-all hover:border-indigo-300">
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
                                    Xem ảnh đầy đủ
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="job-surface group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-300 hover:bg-indigo-50/50"
                              >
                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg shadow-sm transition-transform group-hover:scale-110 ${attachmentMeta.iconClassName}`}>
                                  <attachmentMeta.Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5]">{attachmentMeta.badge}</p>
                                  <p className="mt-0.5 truncate text-sm font-bold text-[#111827]">{attachmentMeta.name}</p>
                                  <p className="mt-0.5 text-xs text-[#6B7280]">{attachmentMeta.description}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-[#94A3B8] transition group-hover:text-[#4F46E5] group-hover:translate-x-1" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* Received Proposals (Owner View) - Kept outside the paper canvas */}
            {isOwner && (
              <div className="job-surface rounded-2xl border border-[#E6EAF0] bg-[#FFFFFF] p-6 shadow-sm overflow-hidden sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[18px] font-extrabold text-[#111827] flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-[#4F46E5] rounded-full"></div>
                    Proposals đã nhận
                  </h2>
                  {proposalCount > 0 && (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF2FF] text-sm font-black text-[#4F46E5]">
                      {proposalCount}
                    </span>
                  )}
                </div>
                <div>
                  <ProposalList jobId={job.jobId} />
                </div>
              </div>
            )}

            {/* Related Jobs */}
            {relatedJobs && relatedJobs.length > 0 && (
              <div className="job-surface rounded-2xl border border-transparent bg-gradient-to-br from-white to-indigo-50/30 p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
                <h2 className="text-[20px] font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Việc làm tương tự
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {relatedJobs.map((relatedJob) => (
                    <RelatedJobCard key={relatedJob.jobId} job={relatedJob} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Management Actions Card */}
            {(isOwner || existingProposal) && (
              <div className="job-surface rounded-2xl border border-[#E6EAF0] bg-[#FFFFFF] p-6 shadow-sm">
                <h3 className="mb-4 text-[14px] font-extrabold text-[#111827]">Quản lý công việc</h3>
                <div className="space-y-3">
                  {isOwner ? (
                    <>
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-indigo-800">
                        You posted this job. Review proposals below and accept the mentor that best fits the work.
                      </div>
                      {jobContract?.fundsInEscrow && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                          <p className="font-black">Escrow secured</p>
                          <p className="mt-1">
                            {formatCurrency(jobContract.amountInEscrow || 0)} is being held by MentorX until you confirm the work is completed.
                          </p>
                        </div>
                      )}
                      {jobContract && (
                        <Link
                          to={getJobChatRoute(job.jobId, jobContract.mentorId)}
                          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-black text-indigo-700 shadow-sm hover:bg-indigo-100"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Open chat
                        </Link>
                      )}
                      {canCompleteContract && jobContract && (
                        <button
                          type="button"
                          onClick={() => setShowCompleteContractConfirm(true)}
                          disabled={completeContractMutation.isLoading}
                          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {completeContractMutation.isLoading ? 'Releasing escrow...' : 'Confirm completion'}
                        </button>
                      )}
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
                          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          {ownerStatusMutation.isLoading ? 'Updating status...' : 'Reopen job'}
                        </button>
                      )}
                    </>
                  ) : existingProposal ? (
                    <>
                      <div className={`mb-4 rounded-xl border p-4 ${existingProposal.status === 'ACCEPTED' ? 'border-[#BBF7D0] bg-[#EAF7EF]' : 'border-indigo-100 bg-indigo-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`flex items-center gap-2 text-sm font-bold ${existingProposal.status === 'ACCEPTED' ? 'text-[#15803D]' : 'text-indigo-700'}`}>
                            <CheckCircle2 className="w-4 h-4" /> Đã gửi proposal
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getProposalStatusColor(existingProposal.status)}`}>
                            {getProposalStatusLabel(existingProposal.status)}
                          </span>
                        </div>
                        <div className="text-xs text-indigo-600/80 mb-4">{formatRelativeTime(existingProposal.createdAt)}</div>
                        
                        <div className="grid gap-3 min-[420px]:grid-cols-2">
                          <div className="rounded-lg border border-indigo-200/50 bg-white p-3 shadow-sm">
                            <p className="text-indigo-600/80 font-bold text-[11px] uppercase tracking-wider mb-1">Giá đề xuất</p>
                            <p className="text-indigo-950 font-black">{formatCurrency(existingProposal.proposedAmount || 0)}</p>
                          </div>
                          <div className="rounded-lg border border-indigo-200/50 bg-white p-3 shadow-sm">
                            <p className="text-indigo-600/80 font-bold text-[11px] uppercase tracking-wider mb-1">Thời gian</p>
                            <p className="text-indigo-950 font-black">{existingProposal.estimatedDurationDays} ngày</p>
                          </div>
                        </div>
                      </div>

                      {existingProposal.status === 'ACCEPTED' && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 mb-4 text-xs font-medium text-amber-800 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                          <span>Không thể chỉnh sửa proposal đã được chấp nhận</span>
                        </div>
                      )}

                      {latestNegotiation && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4">
                          <p className="text-sm font-bold text-amber-900 mb-2">Giá đề xuất mới</p>
                          <p className="text-xl font-black text-amber-700">
                            {formatCurrency(latestNegotiation.proposedAmount || 0)}
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            Thời gian: {latestNegotiation.estimatedDurationDays || 0} ngày
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowProposalDetail(true)}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white shadow-sm hover:bg-indigo-700 transition"
                      >
                        <Eye className="h-4 w-4" />
                        Xem chi tiết proposal
                      </button>

                      {jobContract && (
                        <Link
                          to={getJobChatRoute(job.jobId, job.clientId)}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-black text-indigo-700 shadow-sm hover:bg-indigo-100 transition"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Open chat
                        </Link>
                      )}

                      {canEditSubmittedProposal && (
                        <Link
                          to={`/jobs/${job.jobId}/proposals/${existingProposal.id}/edit`}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                        >
                          <Edit className="h-4 w-4" />
                          Chỉnh sửa
                        </Link>
                      )}

                      {(existingProposal.status === 'SUBMITTED' || existingProposal.status === 'UNDER_REVIEW' || existingProposal.status === 'NEGOTIATING') && (
                      <button
                          type="button"
                          onClick={() => setShowWithdrawConfirm(true)}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 shadow-sm hover:bg-rose-100 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                          Thu hồi
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowAiExplain(true)}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
                      >
                        <Sparkles className="h-4 w-4" />
                        Hỏi AI giải thích
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            )}

            {/* Action Card (Apply/Edit/View/Share) */}
            <div className="job-surface hidden rounded-2xl border border-[#E6EAF0] bg-[#FFFFFF] p-6 shadow-sm lg:block">
              {isOwner ? (
                 <Link
                   to={`/jobs/${job.jobId}/edit`}
                   className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-8 text-[15px] font-extrabold tracking-wide text-[#FFFFFF] transition hover:bg-[#4338CA] shadow-md"
                 >
                   <Edit className="h-4 w-4" />
                   Chỉnh sửa tin
                 </Link>
              ) : isAuthenticated ? (
                 <div className="flex flex-col gap-3">
                   {!existingProposal && (
                     shouldPromptMentorAccess ? (
                        <Link
                          to="/mentor/profile"
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-8 text-[15px] font-extrabold tracking-wide text-[#FFFFFF] shadow-md hover:bg-[#4338CA]"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Đăng ký Mentor
                        </Link>
                     ) : (
                        <button
                          type="button"
                          disabled={!canApply || job.status === 'CLOSED'}
                          onClick={() => setShowApplyModal(true)}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-10 text-[15px] font-extrabold tracking-wide text-[#FFFFFF] shadow-md hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
                        >
                          {job.status === JobStatus.CLOSED ? (
                            <>
                              <X className="h-4 w-4" />
                              Việc đã đóng
                            </>
                          ) : job.status === JobStatus.OPEN ? (
                            <>
                              <Send className="h-4 w-4" />
                              Ứng tuyển ngay
                            </>
                          ) : (
                            'Không khả dụng'
                          )}
                        </button>
                     )
                   )}
                    <div className="flex gap-3 mt-2">
                      <button
                        type="button"
                        onClick={toggleSaved}
                        className="flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#E6EAF0] bg-[#FFFFFF] text-[#475569] hover:bg-[#F5F6FA] shadow-sm transition"
                        title={saved ? 'Đã lưu' : 'Lưu tin'}
                      >
                        {saved ? <BookmarkCheck className="h-5 w-5 text-[#4F46E5]" /> : <Bookmark className="h-5 w-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={copyLink}
                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#E6EAF0] bg-[#FFFFFF] text-[14px] font-extrabold text-[#475569] hover:bg-[#F5F6FA] shadow-sm transition"
                      >
                        <Share2 className="h-4 w-4" />
                        {copied ? 'Đã copy link' : 'Chia sẻ công việc'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAiExplain(true)}
                      className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
                    >
                      <Sparkles className="h-4 w-4" />
                      Hỏi AI giải thích
                    </button>
                 </div>
              ) : (
                 <Link
                   to="/login"
                   className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-10 text-[15px] font-extrabold tracking-wide text-[#FFFFFF] shadow-md hover:bg-[#4338CA]"
                 >
                   <Lock className="h-4 w-4" />
                   Đăng nhập để ứng tuyển
                 </Link>
              )}
            </div>
          </aside>

        </div>
      </main>

      {/* Sticky Mobile Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#E6EAF0] bg-[#FFFFFF]/95 p-4 shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.05)] backdrop-blur lg:hidden">
        {isOwner ? (
          <Link
            to={`/jobs/${job.jobId}/edit`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] text-sm font-extrabold text-[#FFFFFF] shadow-md"
          >
            <Edit className="h-4 w-4" />
            Chỉnh sửa tin
          </Link>
        ) : isAuthenticated ? (
          existingProposal ? (
            <button
              type="button"
              onClick={() => setShowProposalDetail(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] text-sm font-extrabold text-[#FFFFFF] shadow-md"
            >
              <Eye className="h-4 w-4" />
              Xem proposal đã gửi
            </button>
          ) : shouldPromptMentorAccess ? (
            <Link
              to="/mentor/profile"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] text-sm font-extrabold text-[#FFFFFF] shadow-md"
            >
              <ShieldCheck className="h-4 w-4" />
              Đăng ký Mentor
            </Link>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={toggleSaved}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E6EAF0] bg-[#FFFFFF] text-[#475569]"
              >
                {saved ? <BookmarkCheck className="h-5 w-5 text-[#4F46E5]" /> : <Bookmark className="h-5 w-5" />}
              </button>
              <button
                type="button"
                disabled={!canApply || job.status === 'CLOSED'}
                onClick={() => setShowApplyModal(true)}
                className="flex flex-1 h-12 items-center justify-center gap-2 rounded-xl bg-[#4F46E5] text-sm font-extrabold text-[#FFFFFF] shadow-md disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
              >
                {job.status === JobStatus.CLOSED ? 'Việc đã đóng' : job.status === JobStatus.OPEN ? 'Ứng tuyển ngay' : 'Không khả dụng'}
              </button>
            </div>
          )
        ) : (
          <Link
            to="/login"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] text-sm font-extrabold text-[#FFFFFF] shadow-md"
          >
            <Lock className="h-4 w-4" />
            Đăng nhập để ứng tuyển
          </Link>
        )}
      </div>

      {showApplyModal && user && canApply && (
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
                void Promise.all([
                  queryClient.invalidateQueries(['proposal', jobId, user?.userId]),
                  queryClient.invalidateQueries(['negotiation-latest', existingProposal?.id]),
                ])
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
              <div className="grid gap-4 min-[420px]:grid-cols-2">
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

                  <div className="grid gap-4 min-[420px]:grid-cols-2">
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
                        to={`/mentor/proposals/${existingProposal.id}`}
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
                {canEditSubmittedProposal && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProposalDetail(false)
                    setForceEditMode(true)
                    setShowApplyModal(true)
                  }}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700"
                >
                  <Edit className="h-4 w-4" />
                  Chỉnh sửa
                </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowProposalDetail(false)}
                  className={`${canEditSubmittedProposal ? 'px-6' : 'flex-1'} inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50`}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCompleteContractConfirm && jobContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Confirm job completion?</h3>
            <p className="text-sm text-slate-600 text-center mb-6">
              Once confirmed, {formatCurrency(jobContract.amountInEscrow || 0)} will be released from escrow and credited to the mentor wallet.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCompleteContractConfirm(false)}
                disabled={completeContractMutation.isLoading}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => completeContractMutation.mutate(jobContract.id)}
                disabled={completeContractMutation.isLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-lg font-bold hover:bg-emerald-700 disabled:bg-emerald-400 transition-all text-sm"
              >
                {completeContractMutation.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Release escrow'
                )}
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
    <div className={`job-soft-section rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition-all hover:border-indigo-300 ${wide ? 'md:col-span-2' : ''}`}>
      <div className="mb-2 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wide text-[#64748B]">
        <Icon className="job-section-icon h-4 w-4 text-indigo-500" />
        {label}
      </div>
      <p className="whitespace-pre-wrap text-[15px] font-bold leading-relaxed text-[#1F2937]">{value}</p>
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
        <Icon className="job-section-icon h-4 w-4 text-indigo-500" />
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
      <div className="min-h-screen bg-[#f7f8fc] px-4 py-6 sm:px-6 lg:px-8">
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
    DRAFT: 'bg-slate-100 text-slate-700 border border-slate-200',
    SUBMITTED: 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]',
    UNDER_REVIEW: 'bg-[#FFF7E6] text-[#D97706] border border-[#FED7AA]',
    NEGOTIATING: 'bg-[#FFF7E6] text-[#D97706] border border-[#FED7AA]',
    SHORTLISTED: 'bg-[#FFF7E6] text-[#D97706] border border-[#FED7AA]',
    ACCEPTED: 'bg-[#EAF7EF] text-[#15803D] border border-[#BBF7D0]',
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
      iconClassName: 'bg-[#FFF7E6] text-[#D97706]',
    }
  }

  return {
    name: fileName,
    badge: extension ? extension.toUpperCase() : 'Document',
    description: 'Open attachment',
    Icon: FileText,
      iconClassName: 'bg-[#EEF2FF] text-[#4F46E5]',
  }
}

function RelatedJobCard({ job }: { job: JobResponse }) {
  const clientName = getClientName(job)
  const budget = formatBudget(job)
  const initial = clientName.charAt(0).toUpperCase()

  return (
    <Link 
      to={`/jobs/${job.jobId}`} 
      className="job-surface group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-400"
    >
      <div className="flex items-start gap-4">
        <div className="job-soft-section flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-white text-lg font-black text-indigo-600 ring-1 ring-indigo-100 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-extrabold text-[#111827] group-hover:text-[#4F46E5] leading-snug">{job.title}</h3>
          <p className="mt-1.5 truncate text-[13px] font-bold text-[#6B7280]">{clientName}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[#F1F5F9] pt-4">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
          <Briefcase className="h-3 w-3 text-[#94A3B8]" />
          {job.jobType.replace(/_/g, ' ')}
        </span>
        <span className="text-[15px] font-black text-[#4F46E5]">{budget}</span>
      </div>
    </Link>
  )
}
