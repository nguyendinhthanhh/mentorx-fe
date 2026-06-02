import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Coins,
  ExternalLink,
  FileText,
  GraduationCap,
  Lock,
  MessageSquare,
  RefreshCcw,
  ShieldCheck,
  Target,
  User,
  Users,
  X,
} from 'lucide-react'
import { categoryApi } from '@/api/categoryApi'
import { contractApi } from '@/api/contractApi'
import { disputeApi } from '@/api/disputeApi'
import { jobApi } from '@/api/jobApi'
import { negotiationApi, NegotiationResponse } from '@/api/negotiationApi'
import { proposalApi } from '@/api/proposalApi'
import ContextualChatDrawer from '@/components/chat/ContextualChatDrawer'
import { useI18n } from '@/i18n/I18nProvider'
import { jobStatusKeys } from '@/i18n/status'
import { useAuthStore } from '@/store/authStore'
import { ContractResponse, DisputeResponse, JobResponse, JobStatus, JobType, ProposalResponse } from '@/types'
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime } from '@/utils/formatters'
type DetailTab = 'overview' | 'applications' | 'chat' | 'payment' | 'history'
type ProposalDecision = { mode: 'accept' | 'reject'; proposal: ProposalResponse } | null
type ChatDrawerState = {
  recipientId: string
  contextType: 'JOB' | 'PROPOSAL' | 'CONTRACT'
  contextId: string
  title?: string
  subtitle?: string
} | null

const cancellationReasonOptions = [
  {
    value: 'SCOPE_CHANGED',
    label: 'Nhu cầu công việc đã thay đổi',
    helper: 'Không còn phù hợp với mục tiêu ban đầu hoặc bạn cần đổi hướng thực hiện.',
  },
  {
    value: 'TIMELINE_ISSUE',
    label: 'Tiến độ không còn phù hợp',
    helper: 'Deadline hoặc lịch làm việc hiện tại không còn đáp ứng được kế hoạch của bạn.',
  },
  {
    value: 'COMMUNICATION_ISSUE',
    label: 'Cần thay đổi cách phối hợp',
    helper: 'Hai bên đang gặp trở ngại khi trao đổi hoặc thống nhất cách làm việc.',
  },
  {
    value: 'BUDGET_ISSUE',
    label: 'Ngân sách không còn phù hợp',
    helper: 'Bạn cần dừng công việc vì chi phí hoặc phạm vi thanh toán cần thay đổi.',
  },
  {
    value: 'OTHER',
    label: 'Lý do khác',
    helper: 'Hãy mô tả rõ để mentor hiểu tình huống và phản hồi nhanh hơn.',
  },
] as const

export default function UserRequestDetailPage() {
  const { t, language } = useI18n()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const { jobId = '' } = useParams<{ jobId: string }>()
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [decision, setDecision] = useState<ProposalDecision>(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [chatDrawer, setChatDrawer] = useState<ChatDrawerState>(null)
  const [cancelRequestReasonType, setCancelRequestReasonType] = useState<(typeof cancellationReasonOptions)[number]['value'] | ''>('')
  const [cancelRequestDetails, setCancelRequestDetails] = useState('')
  const [disputeTitle, setDisputeTitle] = useState('Mentor từ chối yêu cầu hủy gần nhất')
  const [disputeDescription, setDisputeDescription] = useState('')
  const tabs: Array<{ key: DetailTab; label: string }> = [
    { key: 'overview', label: t('jobs.detail.tabs.overview') },
    { key: 'applications', label: t('jobs.detail.tabs.applications') },
    { key: 'chat', label: t('jobs.detail.tabs.chat') },
    { key: 'payment', label: t('jobs.detail.tabs.payment') },
    { key: 'history', label: t('jobs.detail.tabs.history') },
  ]
  const jobTypeLabelMap: Record<JobType, string> = {
    [JobType.FREELANCE_PROJECT]: t('jobs.detail.types.freelanceProject'),
    [JobType.LONG_TERM_MENTORING]: t('jobs.detail.types.longTermMentoring'),
    [JobType.QUICK_FIX]: t('jobs.detail.types.quickFix'),
  }
  const getJobStatusLabel = (status?: string) => {
    if (!status) return ''
    const key = jobStatusKeys[status as JobStatus]
    return key ? t(key) : status
  }

  const { data: job, isLoading: jobLoading } = useQuery(['user-request', jobId], () => jobApi.getById(jobId), {
    enabled: Boolean(jobId),
  })

  const { data: categories = [] } = useQuery(['request-categories'], categoryApi.getAllActive, {
    staleTime: 60_000,
  })

  const { data: proposalsPage, isLoading: proposalsLoading } = useQuery(
    ['user-request-proposals', jobId],
    () => proposalApi.getByJob(jobId, { page: 0, size: 20 }),
    {
      enabled: Boolean(jobId),
    }
  )

  const { data: contractsPage, isLoading: contractsLoading } = useQuery(
    ['user-request-contracts', jobId],
    () => contractApi.getByJob(jobId, { page: 0, size: 10 }),
    {
      enabled: Boolean(jobId),
    }
  )

  const { data: disputesPage } = useQuery(
    ['user-request-disputes', user?.userId],
    () => disputeApi.getByUser(user!.userId, { page: 0, size: 50 }),
    {
      enabled: Boolean(user?.userId),
      staleTime: 15_000,
    }
  )

  const proposals = proposalsPage?.content || []
  const contracts = contractsPage?.content || []
  const activeContract =
    contracts.find((item) => item.status === 'ACTIVE') ||
    contracts.find((item) => item.status === 'IN_DISPUTE') ||
    contracts.find((item) => item.status === 'UNDER_REVIEW') ||
    contracts.find((item) => item.status === 'COMPLETED') ||
    contracts.find((item) => item.status === 'PAUSED') ||
    contracts.find((item) => item.status === 'PENDING_PAYMENT') ||
    null
  const latestContract =
    [...contracts].sort((left, right) => new Date(right.updatedAt || right.createdAt).getTime() - new Date(left.updatedAt || left.createdAt).getTime())[0] ||
    null
  const contract = activeContract
  const historyContract = activeContract || latestContract

  const { data: latestNegotiations = {} } = useQuery(
    ['user-request-negotiations', proposals.map((proposal) => proposal.id).join(',')],
    async () => {
      const entries = await Promise.all(
        proposals.map(async (proposal) => {
          try {
            const negotiation = await negotiationApi.getLatest(proposal.id)
            return [proposal.id, negotiation] as const
          } catch {
            return [proposal.id, null] as const
          }
        })
      )

      return Object.fromEntries(entries) as Record<string, NegotiationResponse | null>
    },
    {
      enabled: proposals.length > 0,
      staleTime: 15_000,
    }
  )

  const isOwner = job?.clientId === user?.userId
  const canCloseRequest = job?.status === JobStatus.OPEN && !contract

  const acceptMutation = useMutation((proposalId: string) => proposalApi.accept(proposalId), {
    onSuccess: async () => {
      toast.success('Bạn đã chấp nhận mentor này và dự án có thể bắt đầu.')
      setDecision(null)
      setDecisionNote('')
      setActiveTab('payment')
      await invalidateRequestQueries(queryClient, user?.userId, jobId)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể chấp nhận đề xuất này.')
    },
  })

  const rejectMutation = useMutation(
    ({ proposalId, reason }: { proposalId: string; reason: string }) => proposalApi.reject(proposalId, reason),
    {
      onSuccess: async () => {
        toast.success('Đã từ chối đề xuất.')
        setDecision(null)
        setDecisionNote('')
        await invalidateRequestQueries(queryClient, user?.userId, jobId)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Không thể từ chối đề xuất này.')
      },
    }
  )

  const closeMutation = useMutation(() => jobApi.updateStatus(jobId, JobStatus.CLOSED), {
    onSuccess: async () => {
      toast.success('Yêu cầu đã được đóng.')
      setShowCloseConfirm(false)
      await invalidateRequestQueries(queryClient, user?.userId, jobId)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể đóng yêu cầu này.')
    },
  })

  const completeContractMutation = useMutation((contractId: string) => contractApi.complete(contractId), {
    onSuccess: async () => {
      toast.success('Đã xác nhận hoàn thành và giải ngân escrow cho mentor.')
      setShowCompleteConfirm(false)
      await invalidateRequestQueries(queryClient, user?.userId, jobId)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể hoàn tất hợp đồng lúc này.')
    },
  })

  const cancellationRequestMutation = useMutation(
    ({ contractId, requesterId, reason }: { contractId: string; requesterId: string; reason: string }) =>
      contractApi.requestCancellation(contractId, requesterId, reason),
    {
      onSuccess: async () => {
        toast.success('Đã gửi yêu cầu hủy. Hệ thống đang chờ mentor đồng ý.')
        closeCancellationRequestModal()
        await invalidateRequestQueries(queryClient, user?.userId, jobId)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Không thể gửi yêu cầu hủy lúc này.')
      },
    }
  )

  const categoryName = useMemo(() => {
    if (!job?.categoryId) return ''
    return categories.find((category) => category.id === job.categoryId || category.categoryId === job.categoryId)?.name || ''
  }, [categories, job?.categoryId])

  const sortedProposals = useMemo(() => {
    return [...proposals].sort((left, right) => {
      const leftAccepted = activeContract?.proposalId === left.id
      const rightAccepted = activeContract?.proposalId === right.id
      if (leftAccepted !== rightAccepted) return leftAccepted ? -1 : 1
      return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()
    })
  }, [activeContract?.proposalId, proposals])

  const previewProposals = sortedProposals.slice(0, 3)
  const acceptedProposal = sortedProposals.find((proposal) => proposal.id === activeContract?.proposalId) || null
  const acceptedNegotiation = acceptedProposal ? latestNegotiations[acceptedProposal.id] || null : null
  const openProposalChat = (proposal: ProposalResponse) => {
    setChatDrawer({
      recipientId: proposal.mentorId,
      contextType: contract?.proposalId === proposal.id ? 'CONTRACT' : 'PROPOSAL',
      contextId: contract?.proposalId === proposal.id && contract ? contract.id : proposal.id,
      title: proposal.mentorName,
      subtitle: contract?.proposalId === proposal.id ? 'Contract chat' : 'Proposal discussion',
    })
  }

  const openAcceptedMentorChat = () => {
    if (!acceptedProposal) return
    setChatDrawer({
      recipientId: acceptedProposal.mentorId,
      contextType: contract ? 'CONTRACT' : 'PROPOSAL',
      contextId: contract ? contract.id : acceptedProposal.id,
      title: acceptedProposal.mentorName,
      subtitle: contract ? 'Contract chat' : 'Proposal discussion',
    })
  }

  const hasLockedMentor = Boolean(
    acceptedProposal ||
      activeContract ||
      job?.status === JobStatus.IN_PROGRESS ||
      job?.status === JobStatus.COMPLETED
  )
  const canEditRequest = Boolean(
    !hasLockedMentor &&
      job?.status !== JobStatus.CLOSED &&
      job?.status !== JobStatus.CANCELLED
  )
  const pendingCancellation = contract?.cancellationRequestStatus === 'PENDING'
  const rejectedCancellation = contract?.cancellationRequestStatus === 'REJECTED'
  const relatedDisputes: DisputeResponse[] = (disputesPage?.content || []).filter(
    (dispute) => (contract && dispute.contractId === contract.id) || dispute.jobId === jobId
  )
  const activeDispute =
    relatedDisputes.find((dispute) =>
      ['OPEN', 'AWAITING_RESPONSE', 'INVESTIGATING', 'EVIDENCE_REVIEW', 'IN_MEDIATION', 'IN_ARBITRATION'].includes(dispute.status)
    ) || null
  const isContractDisputed = contract?.status === 'IN_DISPUTE' || Boolean(activeDispute)
  const canRequestCancellation = Boolean(
    contract &&
      contract.status === 'ACTIVE' &&
      !isContractDisputed &&
      !pendingCancellation
  )
  const canOpenDispute = Boolean(
    contract &&
      rejectedCancellation &&
      !activeDispute &&
      contract.status !== 'COMPLETED' &&
      contract.status !== 'CANCELLED'
  )
  const canCompleteContract = Boolean(
    contract &&
      contract.status === 'ACTIVE' &&
      job?.status === JobStatus.IN_PROGRESS &&
      !isContractDisputed
  )
  const selectedCancellationReason = cancellationReasonOptions.find((option) => option.value === cancelRequestReasonType) || null
  const composedCancellationReason = useMemo(() => {
    if (!selectedCancellationReason) return ''
    const details = cancelRequestDetails.trim()
    if (!details) return selectedCancellationReason.label
    return `${selectedCancellationReason.label}: ${details}`
  }, [cancelRequestDetails, selectedCancellationReason])
  const canSubmitCancellationRequest = Boolean(
    selectedCancellationReason &&
      (cancelRequestReasonType !== 'OTHER' || cancelRequestDetails.trim())
  )

  function closeCancellationRequestModal() {
    setShowCancelRequestModal(false)
    setCancelRequestReasonType('')
    setCancelRequestDetails('')
  }

  function closeDisputeModal() {
    setShowDisputeModal(false)
    setDisputeTitle('Mentor từ chối yêu cầu hủy gần nhất')
    setDisputeDescription('')
  }

  const createDisputeMutation = useMutation(
    () =>
      disputeApi.create({
        initiatorId: user!.userId,
        respondentId: contract!.mentorId,
        contractId: contract!.id,
        jobId,
        title: disputeTitle.trim(),
        description: disputeDescription.trim(),
        disputeCategory: 'CANCELLATION',
        disputedAmountMxc: contract?.amountInEscrow || contract?.totalAmount || 0,
        refundRequestedMxc: contract?.amountInEscrow || contract?.totalAmount || 0,
      }),
    {
      onSuccess: async () => {
        toast.success('Đã mở dispute. Escrow sẽ tiếp tục bị khóa cho đến khi có quyết định xử lý.')
        closeDisputeModal()
        await invalidateRequestQueries(queryClient, user?.userId, jobId)
        await queryClient.invalidateQueries(['user-request-disputes', user?.userId])
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Không thể mở dispute lúc này.')
      },
    }
  )

  const activityItems = useMemo(() => {
    const items: Array<{ id: string; title: string; subtitle: string; at?: string; tone?: 'indigo' | 'emerald' | 'amber' }> = []

    if (job) {
      items.push({
        id: `job-created-${job.jobId}`,
        title: 'Yêu cầu được tạo',
        subtitle: 'Yêu cầu đã được thêm vào danh sách quản lý của bạn.',
        at: job.createdAt,
        tone: 'indigo',
      })
      if (job.publishedAt) {
        items.push({
          id: `job-published-${job.jobId}`,
          title: 'Yêu cầu được đăng công khai',
          subtitle: 'Mentor có thể bắt đầu gửi đề xuất.',
          at: job.publishedAt,
          tone: 'indigo',
        })
      }
      if (job.closedAt) {
        items.push({
          id: `job-closed-${job.jobId}`,
          title: 'Yêu cầu đã đóng',
          subtitle: 'Bạn đã dừng nhận thêm đề xuất mới.',
          at: job.closedAt,
          tone: 'amber',
        })
      }
    }

    proposals.forEach((proposal) => {
      items.push({
        id: `proposal-${proposal.id}`,
        title: `${proposal.mentorName} đã ứng tuyển`,
        subtitle: 'Một mentor mới đã gửi đề xuất cho yêu cầu này.',
        at: proposal.submittedAt,
        tone: 'indigo',
      })
    })

    if (historyContract) {
      items.push({
        id: `contract-${historyContract.id}`,
        title: 'Mentor đã được chọn',
        subtitle:
          historyContract.status === 'COMPLETED'
            ? 'Hợp đồng đã hoàn tất.'
            : historyContract.status === 'CANCELLED'
              ? 'Hợp đồng trước đã được hủy và yêu cầu đang mở lại cho mentor khác.'
              : 'Escrow đã được khóa để bắt đầu công việc.',
        at: historyContract.activatedAt || historyContract.createdAt,
        tone: historyContract.status === 'COMPLETED' ? 'emerald' : 'amber',
      })
      if (historyContract.completedAt) {
        items.push({
          id: `contract-completed-${historyContract.id}`,
          title: 'Công việc đã hoàn thành',
          subtitle: 'Escrow đã được giải ngân cho mentor.',
          at: historyContract.completedAt,
          tone: 'emerald',
        })
      }
      if (historyContract.cancelledAt) {
        items.push({
          id: `contract-cancelled-${historyContract.id}`,
          title: 'Deal trước đã được hủy',
          subtitle: 'Escrow đã hoàn lại và yêu cầu được mở lại để mentor khác ứng tuyển.',
          at: historyContract.cancelledAt,
          tone: 'amber',
        })
      }
    }

    relatedDisputes.forEach((dispute) => {
      items.push({
        id: `dispute-${dispute.id}`,
        title: 'Dispute được mở',
        subtitle: dispute.title,
        at: dispute.createdAt,
        tone: 'amber',
      })
    })

    return items
      .filter((item) => item.at)
      .sort((left, right) => new Date(right.at || '').getTime() - new Date(left.at || '').getTime())
  }, [historyContract, job, proposals, relatedDisputes])

  if (jobLoading) {
    return <DetailSkeleton />
  }

  if (!job || !isOwner) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
          <FileText className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950">{t('jobs.detail.notAccessibleTitle')}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {t('jobs.detail.notAccessibleBody')}
        </p>
        <Link
          to="/users/requests"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[#6C4DFF] px-5 text-sm font-bold text-white transition hover:bg-[#5b3ef0]"
        >
          {t('jobs.detail.backToList')}
        </Link>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/users/requests"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('jobs.detail.backToList')}
      </Link>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="relative border-b border-slate-100 px-6 py-8 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(108,77,255,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.1),transparent_30%)]" />
          
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-[0_4px_12px_rgba(99,80,255,0.12)]">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <RequestBadge tone={job.status === JobStatus.OPEN ? 'emerald' : job.status === JobStatus.IN_PROGRESS ? 'amber' : 'slate'}>
                      {getJobStatusLabel(job.status)}
                    </RequestBadge>
                    <RequestBadge tone="indigo">{jobTypeLabelMap[job.jobType] || job.jobType}</RequestBadge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                    <span>{t('jobs.detail.header.posted', { time: formatRelativeTime(job.createdAt, language) })}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span>ID: {job.jobId.slice(0, 8).toUpperCase()}</span>
                    {categoryName && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{categoryName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl md:text-[2rem] md:leading-[1.1]">{job.title}</h1>
            </div>

            <div className="flex shrink-0 flex-wrap gap-x-8 gap-y-4 rounded-[24px] border border-white/60 bg-white/40 p-5 shadow-sm backdrop-blur-md">
              <HeaderMeta label={t('jobs.detail.labels.budget')} value={formatBudget(job)} />
              <HeaderMeta label={t('jobs.detail.labels.applications')} value={t('jobs.detail.header.applicationsCount', { count: proposals.length })} />
              <HeaderMeta label={t('jobs.detail.labels.status')} value={getJobStatusLabel(job.status)} />
            </div>
          </div>
        </div>

        {(acceptedProposal || contract) && (
          <div className="border-t border-slate-100 px-6 py-4 sm:px-8">
            <div className="flex flex-wrap gap-3">
              {acceptedProposal && (
                <button
                  type="button"
                  onClick={openAcceptedMentorChat}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#6C4DFF] px-4 text-sm font-bold text-white transition hover:bg-[#5b3ef0]"
                >
                  {t('jobs.detail.actions.openChatWithMentor')}
                </button>
              )}
              {contract && (
                <button
                  type="button"
                  onClick={() => setActiveTab('payment')}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  {t('jobs.detail.actions.viewPayment')}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 px-4 py-4 sm:px-6">
          {tabs.map((tab) => {
            const count =
              tab.key === 'applications'
                ? proposals.length
                : tab.key === 'chat'
                  ? proposals.length
                  : undefined

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                  activeTab === tab.key
                    ? 'bg-[#6C4DFF] text-white shadow-[0_12px_28px_rgba(108,77,255,0.18)]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {typeof count === 'number' && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{count}</span>}
              </button>
            )
          })}
        </div>
      </section>

      {activeTab === 'overview' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <div className="space-y-6">
            <SectionCard
              title="Thông tin yêu cầu"
              description="Những thông tin mentor cần hiểu trước khi bắt đầu trao đổi hoặc gửi đề xuất chi tiết hơn."
            >
              <div className="space-y-6">
                <div className="space-y-6 rounded-[24px] border border-slate-100 bg-slate-50/50 p-5 sm:p-6">
                  <DetailBlock label="Mô tả" value={job.description} />
                  <DetailBlock
                    label="Kỹ năng yêu cầu"
                    value={
                      job.requiredSkills && job.requiredSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {job.requiredSkills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        'Chưa cung cấp'
                      )
                    }
                  />
                  <DetailBlock
                    label="Ghi chú thêm"
                    value={job.successCriteria || job.learningGoals || 'Chưa cung cấp'}
                  />
                </div>

                <div>
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Yêu cầu chung</h3>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <SideInfo icon={Coins} label="Ngân sách" value={formatBudget(job)} />
                    <SideInfo icon={CalendarDays} label="Thời gian mong muốn" value={job.deadlineAt ? formatDate(job.deadlineAt) : 'Linh hoạt'} />
                    <SideInfo icon={MessageSquare} label="Hình thức làm việc" value={formatCommunicationMode(job)} />
                    <SideInfo icon={GraduationCap} label="Ngôn ngữ" value="Theo trao đổi" />
                    <SideInfo icon={Clock3} label="Khung giờ mong muốn" value={job.availabilityExpectation || 'Linh hoạt'} />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                {canEditRequest && (
                  <Link
                    to={`/jobs/${job.jobId}/edit`}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Chỉnh sửa yêu cầu
                  </Link>
                )}
                {hasLockedMentor && (
                  <button
                    type="button"
                    onClick={() => setShowCancelRequestModal(true)}
                    disabled={!canRequestCancellation || cancellationRequestMutation.isLoading}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pendingCancellation ? 'Đang chờ mentor duyệt hủy' : 'Yêu cầu hủy công việc'}
                  </button>
                )}
                {canCloseRequest && (
                  <button
                    type="button"
                    onClick={() => setShowCloseConfirm(true)}
                    disabled={closeMutation.isLoading}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Đóng yêu cầu
                  </button>
                )}
              </div>

              {pendingCancellation && contract && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p className="font-bold">Yêu cầu hủy đang chờ mentor phản hồi.</p>
                  <p className="mt-1 leading-6">
                    Lý do đã gửi: {contract.cancellationRequestReason || 'Không có ghi chú bổ sung.'}
                  </p>
                </div>
              )}

              {rejectedCancellation && contract?.cancellationResponseNote && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <p className="font-bold">Mentor chưa đồng ý hủy công việc.</p>
                  <p className="mt-1 leading-6">Phản hồi từ mentor: {contract.cancellationResponseNote}</p>
                  {canOpenDispute && (
                    <button
                      type="button"
                      onClick={() => setShowDisputeModal(true)}
                      className="mt-3 inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      Mở dispute
                    </button>
                  )}
                </div>
              )}

              {isContractDisputed && (
                <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                  <p className="font-bold">Hợp đồng đang được xử lý tranh chấp.</p>
                  <p className="mt-1 leading-6">
                    Escrow vẫn đang được hệ thống giữ lại, và các hành động hủy/giải ngân trực tiếp đã bị khóa.
                  </p>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Hướng dẫn"
              description="Đi theo flow này để việc chọn mentor nhanh hơn và tránh phải xử lý lại nhiều lần."
            >
              <div className="space-y-3">
                {[
                  'Xem nhanh hồ sơ và phần giải thích công việc của mentor.',
                  'Mở tab Chat để trao đổi rõ phạm vi, deadline và mức giá cuối.',
                  'Chỉ chấp nhận khi bạn đã thống nhất được offer phù hợp.',
                ].map((item, index) => (
                  <GuideStep key={item} index={index + 1} label={item} />
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            {acceptedProposal && (
              <SectionCard
                title="Mentor đang đồng hành"
                description="Mentor này hiện là người đang xử lý yêu cầu của bạn. Từ đây bạn nên tập trung vào chat, tiến độ và thanh toán."
              >
                <ProposalCard
                  proposal={acceptedProposal}
                  job={job}
                  contract={contract}
                  negotiation={acceptedNegotiation}
                  compact
                  onOpenChat={openAcceptedMentorChat}
                  onAccept={() => undefined}
                  onReject={() => undefined}
                />
              </SectionCard>
            )}

            <SectionCard
              title={`${t('jobs.detail.tabs.applications')} (${proposals.length})`}
              description="Các đề xuất gần nhất để bạn scan nhanh trước khi mở tab đầy đủ."
            >
              {proposalsLoading ? (
                <ApplicationListSkeleton />
              ) : previewProposals.length > 0 ? (
                <div className="space-y-4">
                  {previewProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    job={job}
                    contract={contract}
                    negotiation={latestNegotiations[proposal.id] || null}
                    compact
                    onOpenChat={() => openProposalChat(proposal)}
                    onAccept={() => setDecision({ mode: 'accept', proposal })}
                    onReject={() => setDecision({ mode: 'reject', proposal })}
                  />
                  ))}
                  {sortedProposals.length > previewProposals.length && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('applications')}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Xem tất cả đề xuất
                    </button>
                  )}
                </div>
              ) : (
                <EmptyCard
                  icon={Users}
                  title="Chưa có mentor nào ứng tuyển"
                  description="Khi có đề xuất mới, chúng sẽ xuất hiện ở đây để bạn xem nhanh."
                />
              )}
            </SectionCard>

            <SectionCard title="Tiếp theo là gì?" description="Một checklist gọn để bạn không bị quá tải khi quản lý yêu cầu.">
              <div className="space-y-3">
                {[
                  'Xem xét đề xuất từ mentor.',
                  'Chat để làm rõ phạm vi, deadline và kỳ vọng.',
                  'Chấp nhận mentor phù hợp nhất.',
                  'Theo dõi escrow và xác nhận hoàn thành khi công việc xong.',
                ].map((item, index) => (
                  <GuideStep key={item} index={index + 1} label={item} />
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <SectionCard
          title={`${t('jobs.detail.tabs.applications')} (${proposals.length})`}
          description="Tất cả đề xuất được gom riêng tại đây để bạn review, chat và ra quyết định mà không làm rối trang tổng quan."
        >
          {proposalsLoading ? (
            <ApplicationListSkeleton />
          ) : sortedProposals.length > 0 ? (
            <div className="space-y-4">
              {sortedProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  job={job}
                  contract={contract}
                  negotiation={latestNegotiations[proposal.id] || null}
                  onOpenChat={() => openProposalChat(proposal)}
                  onAccept={() => setDecision({ mode: 'accept', proposal })}
                  onReject={() => setDecision({ mode: 'reject', proposal })}
                />
              ))}
            </div>
          ) : (
            <EmptyCard
              icon={Users}
              title="Chưa có đề xuất nào"
              description="Khi mentor bắt đầu ứng tuyển, bạn sẽ thấy danh sách đầy đủ tại đây."
            />
          )}
        </SectionCard>
      )}

      {activeTab === 'chat' && (
        <SectionCard
          title="Chat"
          description="Mỗi mentor có một điểm vào chat riêng cho yêu cầu này, giúp bạn trao đổi rõ trước khi chấp nhận."
        >
          {sortedProposals.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {sortedProposals.map((proposal) => {
                const offer = getEffectiveOffer(proposal, latestNegotiations[proposal.id] || null)
                const isSelected = contract?.proposalId === proposal.id

                return (
                  <div key={proposal.id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <AvatarInitials name={proposal.mentorName} />
                          <div>
                            <h3 className="text-lg font-black text-slate-950">{proposal.mentorName}</h3>
                            <p className="text-sm text-slate-500">Ứng tuyển {formatRelativeTimeVi(proposal.submittedAt)}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <RequestBadge tone={isSelected ? 'emerald' : 'indigo'}>
                            {isSelected ? 'Mentor đã chọn' : 'Sẵn sàng trao đổi'}
                          </RequestBadge>
                          <RequestBadge tone="slate">
                            {offer.amountText} · {offer.durationText}
                          </RequestBadge>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openProposalChat(proposal)}
                        className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#6C4DFF] px-4 text-sm font-bold text-white transition hover:bg-[#5b3ef0]"
                      >
                        Mở chat
                      </button>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {proposal.coverLetter || 'Mentor này chưa thêm lời nhắn giới thiệu.'}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyCard
              icon={MessageSquare}
              title="Chưa có cuộc trao đổi nào"
              description="Hãy chờ mentor ứng tuyển hoặc chia sẻ yêu cầu của bạn rõ hơn để bắt đầu trao đổi."
            />
          )}
        </SectionCard>
      )}

      {activeTab === 'payment' && (
        <SectionCard
          title={t('jobs.detail.tabs.payment')}
          description="Escrow và tiến trình thanh toán được tách riêng để bạn kiểm tra khi đã chọn mentor."
        >
          {contractsLoading ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-28 rounded-[24px] bg-slate-100" />
              ))}
            </div>
          ) : contract ? (
            <div className="space-y-6">
              {pendingCancellation && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p className="font-bold">Đã gửi yêu cầu hủy công việc.</p>
                  <p className="mt-1 leading-6">
                    Mentor cần xác nhận trước khi hệ thống hủy hợp đồng và hoàn escrow cho bạn.
                  </p>
                </div>
              )}

              {rejectedCancellation && contract.cancellationResponseNote && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <p className="font-bold">Mentor đã từ chối yêu cầu hủy gần nhất.</p>
                  <p className="mt-1 leading-6">{contract.cancellationResponseNote}</p>
                  {canOpenDispute && (
                    <button
                      type="button"
                      onClick={() => setShowDisputeModal(true)}
                      className="mt-3 inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      Mở dispute
                    </button>
                  )}
                </div>
              )}

              {isContractDisputed && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                  <p className="font-bold">Dispute đang mở.</p>
                  <p className="mt-1 leading-6">
                    Hợp đồng này đang được review. Escrow tiếp tục bị khóa và không thể giải ngân hoặc refund trực tiếp ở bước này.
                  </p>
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-3">
                <PaymentMetric
                  icon={Lock}
                  label="Escrow đang giữ"
                  value={formatCurrency(contract.amountInEscrow || contract.totalAmount || 0)}
                  hint={contract.fundsInEscrow ? 'Đã khóa trong hệ thống' : 'Chưa khóa'}
                />
                <PaymentMetric
                  icon={CheckCircle2}
                  label="Đã giải ngân"
                  value={formatCurrency(contract.amountPaid || 0)}
                  hint={contract.status === 'COMPLETED' ? 'Đã hoàn tất' : 'Chờ xác nhận hoàn thành'}
                />
                <PaymentMetric
                  icon={Target}
                  label="Tiến độ"
                  value={`${contract.progressPercentage || 0}%`}
                  hint={`${contract.completedMilestoneCount || 0}/${contract.milestoneCount || 0} milestone`}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <h3 className="text-lg font-black text-slate-950">Chi tiết hợp đồng</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <SideInfo icon={User} label="Mentor" value={contract.mentorName} />
                    <SideInfo icon={CalendarDays} label="Deadline" value={contract.endDate ? formatDate(contract.endDate) : 'Linh hoạt'} />
                    <SideInfo icon={Coins} label="Tổng giá trị" value={formatCurrency(contract.totalAmount || 0)} />
                    <SideInfo icon={ShieldCheck} label="Trạng thái" value={formatContractStatus(contract.status)} />
                  </div>
                </div>

                <div className="rounded-[24px] border border-indigo-100 bg-indigo-50/60 p-5">
                  <h3 className="text-lg font-black text-slate-950">Hành động tiếp theo</h3>
                  <div className="mt-4">
                    {canCompleteContract ? (
                      <div>
                        <p className="mb-4 text-sm leading-7 text-slate-600">
                          Mentor đã đánh dấu hoàn thành, hoặc bạn thấy công việc đã xong. Bấm xác nhận để giải ngân số tiền trong escrow.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowCompleteConfirm(true)}
                          className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[#6C4DFF] px-4 text-sm font-bold text-white transition hover:bg-[#5b3ef0]"
                        >
                          Xác nhận hoàn thành & Giải ngân
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm leading-7 text-slate-600">
                        {isContractDisputed
                          ? 'Hợp đồng đang tranh chấp, nên các hành động thanh toán trực tiếp đã bị khóa.'
                          : 'Hợp đồng đang thực hiện hoặc đã đóng. Không có hành động thanh toán nào khả dụng lúc này.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyCard
              icon={Coins}
              title="Chưa có thông tin thanh toán"
              description="Bạn cần thống nhất đề xuất và chấp nhận một mentor trước khi hợp đồng và thanh toán được thiết lập."
            />
          )}
        </SectionCard>
      )}

      {activeTab === 'history' && (
        <SectionCard
          title={t('jobs.detail.tabs.history')}
          description="Timeline toàn bộ các sự kiện chính của yêu cầu này từ lúc bạn tạo."
        >
          <div className="relative pl-3">
            <div className="absolute bottom-0 left-5 top-2 w-[2px] bg-slate-100" />
            <div className="space-y-8">
              {activityItems.length > 0 ? (
                activityItems.map((item) => (
                  <div key={item.id} className="relative flex gap-5">
                    <div
                      className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-4 ring-white ${
                        item.tone === 'emerald'
                          ? 'text-emerald-500'
                          : item.tone === 'amber'
                            ? 'text-amber-500'
                            : 'text-[#6C4DFF]'
                      }`}
                    >
                      {item.tone === 'emerald' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : item.tone === 'amber' ? (
                        <Clock3 className="h-5 w-5" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-current" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{item.title}</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{item.subtitle}</p>
                      {item.at && (
                        <p className="mt-2 text-xs font-bold text-slate-400">{formatDateTime(item.at)}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-sm text-slate-500">Chưa có hoạt động nào được ghi nhận.</div>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Accept Proposal Modal */}
      {decision?.mode === 'accept' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h3 className="text-xl font-black text-slate-950">Chấp nhận mentor</h3>
              <button
                type="button"
                onClick={() => setDecision(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm leading-7 text-slate-600">
                Bạn sắp chọn <strong>{decision.proposal.mentorName}</strong> cho yêu cầu này.
                <br />
                Đảm bảo bạn đã thảo luận rõ ràng về phạm vi công việc, thời hạn và chi phí qua mục Chat.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setDecision(null)}
                  disabled={acceptMutation.isLoading}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => acceptMutation.mutate(decision.proposal.id)}
                  disabled={acceptMutation.isLoading}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-[#6C4DFF] px-5 text-sm font-bold text-white transition hover:bg-[#5b3ef0] disabled:opacity-50"
                >
                  {acceptMutation.isLoading ? 'Đang xử lý...' : 'Đồng ý & Bắt đầu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Proposal Modal */}
      {decision?.mode === 'reject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h3 className="text-xl font-black text-slate-950">Từ chối đề xuất</h3>
              <button
                type="button"
                onClick={() => {
                  setDecision(null)
                  setDecisionNote('')
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm leading-7 text-slate-600">
                Bạn sẽ bỏ qua đề xuất của <strong>{decision.proposal.mentorName}</strong>. Hãy để lại một lý do ngắn gọn để phản hồi lại cho họ.
              </p>

              <textarea
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Ghi chú thêm cho mentor (tùy chọn)..."
                className="mt-6 h-32 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDecision(null)
                    setDecisionNote('')
                  }}
                  disabled={rejectMutation.isLoading}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => rejectMutation.mutate({ proposalId: decision.proposal.id, reason: decisionNote })}
                  disabled={rejectMutation.isLoading}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  {rejectMutation.isLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Request Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h3 className="text-xl font-black text-slate-950">Đóng yêu cầu này?</h3>
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm leading-7 text-slate-600">
                Khi đóng yêu cầu, mentor sẽ không thể gửi thêm đề xuất mới. Bạn chắc chắn muốn đóng chứ?
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowCloseConfirm(false)}
                  disabled={closeMutation.isLoading}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => closeMutation.mutate()}
                  disabled={closeMutation.isLoading}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  {closeMutation.isLoading ? 'Đang đóng...' : 'Xác nhận đóng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Cancellation Request Modal */}
      {showCancelRequestModal && contract && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h3 className="text-xl font-black text-slate-950">Gửi yêu cầu hủy công việc</h3>
              <button
                type="button"
                onClick={closeCancellationRequestModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm leading-7 text-slate-600">
                Mentor sẽ nhận được yêu cầu này và công việc chỉ bị hủy sau khi mentor đồng ý. Nếu đang có tiền trong escrow,
                hệ thống sẽ hoàn lại cho bạn khi yêu cầu được chấp thuận.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">Lý do hủy</label>
                  <select
                    value={cancelRequestReasonType}
                    onChange={(event) =>
                      setCancelRequestReasonType(
                        event.target.value as (typeof cancellationReasonOptions)[number]['value'] | ''
                      )
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Chọn lý do bạn muốn gửi cho mentor</option>
                    {cancellationReasonOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {selectedCancellationReason && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">{selectedCancellationReason.helper}</p>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-sm font-semibold text-slate-900">
                      {cancelRequestReasonType === 'OTHER' ? 'Mô tả chi tiết' : 'Ghi chú thêm (không bắt buộc)'}
                    </label>
                    <span className="text-xs font-medium text-slate-400">{cancelRequestDetails.length}/500</span>
                  </div>
                  <textarea
                    value={cancelRequestDetails}
                    maxLength={500}
                    onChange={(event) => setCancelRequestDetails(event.target.value)}
                    placeholder={
                      cancelRequestReasonType === 'OTHER'
                        ? 'Hãy mô tả rõ lý do để mentor có đủ bối cảnh phản hồi...'
                        : 'Nếu cần, hãy thêm thông tin cụ thể để mentor hiểu tình huống của bạn hơn...'
                    }
                    className="h-32 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {composedCancellationReason && (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">Nội dung sẽ gửi</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{composedCancellationReason}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={closeCancellationRequestModal}
                  disabled={cancellationRequestMutation.isLoading}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() =>
                    cancellationRequestMutation.mutate({
                      contractId: contract.id,
                      requesterId: user.userId,
                      reason: composedCancellationReason,
                    })
                  }
                  disabled={cancellationRequestMutation.isLoading || !canSubmitCancellationRequest}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-5 text-sm font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
                >
                  {cancellationRequestMutation.isLoading ? 'Đang gửi...' : 'Gửi yêu cầu hủy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDisputeModal && contract && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h3 className="text-xl font-black text-slate-950">Mở dispute</h3>
              <button
                type="button"
                onClick={closeDisputeModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-sm text-indigo-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="leading-6">
                    Khi dispute được mở, hợp đồng sẽ được chuyển sang trạng thái tranh chấp và escrow tiếp tục bị hệ thống giữ cho đến khi có quyết định xử lý.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-900">Tiêu đề dispute</span>
                  <input
                    value={disputeTitle}
                    onChange={(event) => setDisputeTitle(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-900">Mô tả tranh chấp</span>
                  <textarea
                    value={disputeDescription}
                    onChange={(event) => setDisputeDescription(event.target.value)}
                    placeholder="Nêu rõ bối cảnh, điều bạn đã yêu cầu, phản hồi từ mentor và cách bạn muốn hệ thống hỗ trợ..."
                    className="h-36 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={closeDisputeModal}
                  disabled={createDisputeMutation.isLoading}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => createDisputeMutation.mutate()}
                  disabled={createDisputeMutation.isLoading || !disputeTitle.trim() || !disputeDescription.trim()}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-[#6C4DFF] px-5 text-sm font-bold text-white transition hover:bg-[#5b3ef0] disabled:opacity-50"
                >
                  {createDisputeMutation.isLoading ? 'Đang gửi...' : 'Gửi dispute'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Contract Modal */}
      {showCompleteConfirm && contract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h3 className="text-xl font-black text-slate-950">Hoàn tất hợp đồng</h3>
              <button
                type="button"
                onClick={() => setShowCompleteConfirm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm leading-7 text-slate-600">
                Xác nhận công việc đã hoàn thành 100%. Tiền trong escrow <strong>({formatCurrency(contract.totalAmount || 0)})</strong> sẽ được giải ngân cho mentor.
                Hành động này không thể hoàn tác.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowCompleteConfirm(false)}
                  disabled={completeContractMutation.isLoading}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => completeContractMutation.mutate(contract.id)}
                  disabled={completeContractMutation.isLoading}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-[#6C4DFF] px-5 text-sm font-bold text-white transition hover:bg-[#5b3ef0] disabled:opacity-50"
                >
                  {completeContractMutation.isLoading ? 'Đang xử lý...' : 'Giải ngân ngay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ContextualChatDrawer
        open={!!chatDrawer}
        onOpenChange={(open) => {
          if (!open) {
            setChatDrawer(null)
          }
        }}
        recipientId={chatDrawer?.recipientId}
        contextType={chatDrawer?.contextType}
        contextId={chatDrawer?.contextId}
        title={chatDrawer?.title}
        subtitle={chatDrawer?.subtitle}
      />
    </div>
  )
}

function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
        <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
        <p className="mt-1.5 text-sm text-slate-500">{description}</p>
      </div>
      <div className="p-6 sm:p-8">{children}</div>
    </section>
  )
}

function HeaderMeta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <div className="mt-1 text-[15px] font-black text-slate-900">{value}</div>
    </div>
  )
}

function DetailBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <div className="mt-2 text-sm leading-7 text-slate-700">{value}</div>
    </div>
  )
}

function SideInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-sm font-bold text-slate-900">{value}</p>
    </div>
  )
}

function GuideStep({ index, label }: { index: number; label: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white">
        {index}
      </div>
      <p className="pt-1 text-sm leading-7 text-slate-700">{label}</p>
    </div>
  )
}

function PaymentMetric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        <Icon className="h-4 w-4 text-indigo-500" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </div>
  )
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-bold text-slate-900">{value}</p>
    </div>
  )
}

function EmptyCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="mt-4 text-sm font-black text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}

function RequestBadge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'emerald' | 'amber' | 'indigo' }) {
  const styles = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    indigo: 'bg-indigo-100 text-indigo-700',
  }

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${styles[tone]}`}>{children}</span>
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-base font-black text-indigo-600">
      {initials}
    </div>
  )
}

function ApplicationListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="h-32 rounded-[24px] bg-slate-100" />
      ))}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-24 rounded-2xl bg-slate-100" />
      <div className="h-64 rounded-[28px] bg-slate-100" />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="h-[400px] rounded-[28px] bg-slate-100" />
        <div className="space-y-6">
          <div className="h-48 rounded-[28px] bg-slate-100" />
          <div className="h-64 rounded-[28px] bg-slate-100" />
        </div>
      </div>
    </div>
  )
}

function formatBudget(job: JobResponse) {
  if (!job.budgetMinMxc || !job.budgetMaxMxc) return 'Thỏa thuận'
  return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
}

function formatCommunicationMode(job: JobResponse) {
  if (!job.communicationPreference) return 'Linh hoạt'
  const parts = job.communicationPreference.split(',')
  return parts.join(', ')
}

function getEffectiveOffer(proposal: ProposalResponse, negotiation: NegotiationResponse | null) {
  if (negotiation && negotiation.status === 'ACCEPTED') {
    return {
      amount: negotiation.proposedAmount || 0,
      amountText: formatCurrency(negotiation.proposedAmount || 0),
      duration: negotiation.estimatedDurationDays || 0,
      durationText: `${negotiation.estimatedDurationDays || 0} ngày`,
    }
  }

  return {
    amount: proposal.proposedAmount || 0,
    amountText: formatCurrency(proposal.proposedAmount || 0),
    duration: proposal.estimatedDurationDays || 0,
    durationText: `${proposal.estimatedDurationDays || 0} ngày`,
  }
}

function formatContractStatus(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'Đang thực hiện',
    PENDING_PAYMENT: 'Chờ thanh toán',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã hủy',
    DISPUTED: 'Tranh chấp',
    IN_DISPUTE: 'Tranh chấp',
    UNDER_REVIEW: 'Đang được xem xét',
    PAUSED: 'Tạm dừng',
  }
  return map[status] || status
}

function formatRelativeTimeVi(date: string | Date): string {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60) return 'vừa xong'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`
  return formatDate(date)
}

function invalidateRequestQueries(queryClient: any, clientId?: string, jobId?: string) {
  return Promise.all([
    queryClient.invalidateQueries(['user-request', jobId]),
    queryClient.invalidateQueries(['user-request-proposals', jobId]),
    queryClient.invalidateQueries(['user-request-contracts', jobId]),
    queryClient.invalidateQueries(['user-request-negotiations']),
    queryClient.invalidateQueries(['user-request-disputes', clientId]),
    queryClient.invalidateQueries(['client-jobs', clientId]),
    queryClient.invalidateQueries(['userBalance', clientId]),
    queryClient.invalidateQueries(['wallets', clientId]),
    queryClient.invalidateQueries(['transactions', clientId]),
  ])
}

function ProposalCard({
  proposal,
  job,
  contract,
  negotiation,
  compact = false,
  onOpenChat,
  onAccept,
  onReject,
}: {
  proposal: ProposalResponse
  job: JobResponse
  contract: ContractResponse | null
  negotiation: NegotiationResponse | null
  compact?: boolean
  onOpenChat: () => void
  onAccept: () => void
  onReject: () => void
}) {
  const offer = getEffectiveOffer(proposal, negotiation)
  const isSelected = contract?.proposalId === proposal.id
  const isRejected =
    proposal.status === 'REJECTED' ||
    proposal.status === 'AUTO_CLOSED' ||
    proposal.status === 'CONTRACT_CANCELLED'
  const isNegotiating = negotiation?.status === 'PENDING'
  const isOwner = job?.clientId === useAuthStore.getState().user?.userId
  const statusLabel =
    proposal.status === 'AUTO_CLOSED'
      ? 'Đã đóng tự động'
      : proposal.status === 'CONTRACT_CANCELLED'
        ? 'Deal cũ đã hủy'
        : 'Đã từ chối'

  // If in compact mode, or rendered within the narrow sidebar, it stacks vertically.
  // Otherwise it can span rows horizontally.
  return (
    <div className={`relative overflow-hidden rounded-[24px] border ${isSelected ? 'border-[#6C4DFF] bg-indigo-50/20' : 'border-slate-200 bg-white'}`}>
      <div className={`p-5 ${compact ? 'flex flex-col' : 'lg:flex lg:items-start lg:gap-6'}`}>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <AvatarInitials name={proposal.mentorName} />
              <div>
                <h3 className="text-lg font-black text-slate-950">{proposal.mentorName}</h3>
                <p className="text-sm font-medium text-slate-500">Gửi đề xuất {formatRelativeTimeVi(proposal.submittedAt)}</p>
              </div>
            </div>

            {isSelected && (
              <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-emerald-100 px-3 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Đã chọn
              </span>
            )}
            {isRejected && (
              <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-slate-100 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {statusLabel}
              </span>
            )}
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-700 line-clamp-3">
            {proposal.coverLetter || 'Mentor không gửi kèm lời nhắn giới thiệu.'}
          </p>
        </div>

        <div className={`mt-5 flex shrink-0 flex-col gap-3 ${compact ? 'w-full' : 'lg:mt-0 lg:w-[220px]'}`}>
          <div className="grid grid-cols-2 gap-2">
            <MiniInfo label="Đề xuất" value={offer.amountText} />
            <MiniInfo label="Thời gian" value={offer.durationText} />
          </div>

          {!isSelected && !isRejected && isOwner && job.status === JobStatus.OPEN && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onAccept}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#6C4DFF] px-4 text-sm font-bold text-white transition hover:bg-[#5b3ef0]"
              >
                Chấp nhận
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onOpenChat}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-[#6C4DFF] bg-white px-3 text-sm font-bold text-[#6C4DFF] transition hover:bg-indigo-50"
                >
                  Chat
                </button>
                <button
                  type="button"
                  onClick={onReject}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {isNegotiating && !isSelected && !isRejected && (
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-700">
              Đang chờ phản hồi thay đổi
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

