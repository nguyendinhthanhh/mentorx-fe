import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Clock3,
  Coins,
  Edit,
  FileText,
  GraduationCap,
  MessageCircle,
  MessageSquare,
  Quote,
  ShieldAlert,
  Target,
  TrendingUp,
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
import ProposalList from '@/components/job/ProposalList'
import ContextualChatDrawer from '@/components/chat/ContextualChatDrawer'
import { useI18n } from '@/i18n/I18nProvider'
import { jobStatusKeys } from '@/i18n/status'
import { useAuthStore } from '@/store/authStore'
import { ContractResponse, DisputeResponse, JobResponse, JobStatus, JobType, ProposalResponse } from '@/types'
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/formatters'

type DetailTab = 'overview' | 'proposals' | 'payment'
type ChatDrawerState = {
  recipientId: string
  contextType: 'JOB' | 'PROPOSAL' | 'CONTRACT'
  contextId: string
  title?: string
  subtitle?: string
} | null

export default function UserRequestDetailPageNew() {
  const { t, language } = useI18n()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const { jobId = '' } = useParams<{ jobId: string }>()
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [chatDrawer, setChatDrawer] = useState<ChatDrawerState>(null)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)

  const { data: job, isLoading: jobLoading } = useQuery(['user-request', jobId], () => jobApi.getById(jobId), {
    enabled: Boolean(jobId),
  })

  const { data: categories = [] } = useQuery(['request-categories'], categoryApi.getAllActive, {
    staleTime: 60_000,
  })

  const { data: proposalsPage } = useQuery(
    ['user-request-proposals', jobId],
    () => proposalApi.getByJob(jobId, { page: 0, size: 20 }),
    { enabled: Boolean(jobId) }
  )

  const { data: contractsPage } = useQuery(
    ['user-request-contracts', jobId],
    () => contractApi.getByJob(jobId, { page: 0, size: 10 }),
    { enabled: Boolean(jobId) }
  )

  const { data: latestNegotiations = {} } = useQuery(
    ['user-request-negotiations', (proposalsPage?.content || []).map((p) => p.id).join(',')],
    async () => {
      const proposals = proposalsPage?.content || []
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
      enabled: (proposalsPage?.content || []).length > 0,
      staleTime: 15_000,
    }
  )

  const proposals = proposalsPage?.content || []
  const contracts = contractsPage?.content || []
  const contract = contracts.find((item) => item.status === 'ACTIVE') || contracts.find((item) => item.status === 'IN_DISPUTE')
  const isOwner = job?.clientId === user?.userId

  const categoryName = useMemo(() => {
    if (!job?.categoryId) return ''
    return categories.find((c) => c.id === job.categoryId || c.categoryId === job.categoryId)?.name || ''
  }, [categories, job?.categoryId])

  const sortedProposals = useMemo(() => {
    return [...proposals].sort((left, right) => {
      const leftAccepted = contract?.proposalId === left.id
      const rightAccepted = contract?.proposalId === right.id
      if (leftAccepted !== rightAccepted) return leftAccepted ? -1 : 1
      return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()
    })
  }, [contract?.proposalId, proposals])

  const acceptedProposal = sortedProposals.find((p) => p.id === contract?.proposalId) || null

  const completeContractMutation = useMutation((contractId: string) => contractApi.complete(contractId), {
    onSuccess: async () => {
      toast.success('Đã xác nhận hoàn thành và giải ngân escrow cho mentor.')
      setShowCompleteConfirm(false)
      await queryClient.invalidateQueries(['user-request', jobId])
      await queryClient.invalidateQueries(['user-request-contracts', jobId])
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể hoàn tất hợp đồng lúc này.')
    },
  })

  const getStatusBadge = (status?: JobStatus) => {
    const statusMap: Record<JobStatus, { label: string; color: string }> = {
      [JobStatus.DRAFT]: { label: 'Nháp', color: 'bg-slate-50 text-slate-600 border-slate-200' },
      [JobStatus.PENDING_APPROVAL]: { label: 'Chờ duyệt', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      [JobStatus.OPEN]: { label: 'Đang mở', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      [JobStatus.IN_PROGRESS]: { label: 'Đang thực hiện', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      [JobStatus.ON_HOLD]: { label: 'Tạm dừng', color: 'bg-orange-50 text-orange-700 border-orange-200' },
      [JobStatus.COMPLETED]: { label: 'Hoàn thành', color: 'bg-slate-100 text-slate-700 border-slate-200' },
      [JobStatus.CLOSED]: { label: 'Đã đóng', color: 'bg-slate-100 text-slate-600 border-slate-200' },
      [JobStatus.CANCELLED]: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-600 border-rose-200' },
      [JobStatus.EXPIRED]: { label: 'Hết hạn', color: 'bg-slate-50 text-slate-500 border-slate-200' },
    }
    return statusMap[status || JobStatus.OPEN]
  }

  const formatBudget = (job: JobResponse) => {
    if (job.budgetMinMxc != null && job.budgetMaxMxc != null) {
      if (job.budgetMinMxc === job.budgetMaxMxc) return formatCurrency(job.budgetMinMxc)
      return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
    }
    if (job.budgetMinMxc != null) {
      return formatCurrency(job.budgetMinMxc)
    }
    if (job.budgetMaxMxc != null) {
      return formatCurrency(job.budgetMaxMxc)
    }
    if (job.hourlyRateMxc) {
      return `${formatCurrency(job.hourlyRateMxc)}/giờ`
    }
    return 'Chưa xác định'
  }

  if (jobLoading || !job || !isOwner) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  const statusBadge = getStatusBadge(job.status)
  const canCompleteContract = Boolean(contract && contract.status === 'ACTIVE' && job.status === JobStatus.IN_PROGRESS)

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/users/requests" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Link>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Left Column - Main Content */}
          <div className="space-y-6">
            {/* Header Card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Status Bar */}
              <div className="bg-gradient-to-r from-indigo-50 to-slate-50 px-6 py-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                    {job.jobType === JobType.FREELANCE_PROJECT ? 'Dự án freelance' : job.jobType === JobType.LONG_TERM_MENTORING ? 'Mentoring dài hạn' : 'Quick fix'}
                  </span>
                  {categoryName && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                      {categoryName}
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Meta */}
              <div className="px-6 py-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">{job.title}</h1>
                
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Đã đăng {formatRelativeTime(job.createdAt, language)}
                  </span>
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-slate-400" />
                    ID: {job.jobId.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="border-t border-slate-100 px-6 py-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Budget */}
                  <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
                      <Coins className="h-4 w-4" />
                      Ngân sách
                    </div>
                    <p className="text-xl font-black text-slate-950">{formatBudget(job)}</p>
                  </div>

                  {/* Proposals */}
                  <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
                      <Users className="h-4 w-4" />
                      Ứng tuyển
                    </div>
                    <p className="text-xl font-black text-slate-950">{proposals.length} mentor</p>
                  </div>

                  {/* Status */}
                  <div className="rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      Trạng thái
                    </div>
                    <p className="text-xl font-black text-slate-950">{statusBadge.label}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                  activeTab === 'overview'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('proposals')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                  activeTab === 'proposals'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                Mentor ứng tuyển
                {proposals.length > 0 && (
                  <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">{proposals.length}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                  activeTab === 'payment'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                Thanh toán
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-950">Thông tin yêu cầu</h2>
                      <p className="text-xs text-slate-500">Chi tiết công việc và yêu cầu</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-6 space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Mô tả công việc</h3>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-5">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{job.description}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-700 mb-3">Kỹ năng yêu cầu</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.requiredSkills.map((skill) => (
                          <span key={skill} className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-sm font-bold text-indigo-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirements Grid */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Yêu cầu khác</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          <CalendarDays className="h-4 w-4" />
                          Hạn chót
                        </div>
                        <p className="text-sm font-medium text-slate-900">{job.deadlineAt ? formatDate(job.deadlineAt) : 'Linh hoạt'}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          <Clock3 className="h-4 w-4" />
                          Khung giờ
                        </div>
                        <p className="text-sm font-medium text-slate-900">{job.availabilityExpectation || 'Linh hoạt'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <Link
                      to={`/jobs/${job.jobId}/edit`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Edit className="h-4 w-4" />
                      Chỉnh sửa
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'proposals' && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                        <Users className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-950">Mentor ứng tuyển</h2>
                        <p className="text-xs text-slate-500">{proposals.length} đề xuất đã nhận</p>
                      </div>
                    </div>
                  </div>
                </div>
                <ProposalList jobId={job.jobId} />
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                      <Coins className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-950">Thanh toán</h2>
                      <p className="text-xs text-slate-500">Lịch sử giao dịch và escrow</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-8">
                  {contract ? (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold text-emerald-900">Escrow đang giữ</p>
                            <p className="mt-1 text-2xl font-black text-emerald-950">{formatCurrency(contract.amountInEscrow || 0)}</p>
                          </div>
                          <ShieldAlert className="h-8 w-8 text-emerald-600" />
                        </div>
                      </div>
                      {canCompleteContract && (
                        <button
                          onClick={() => setShowCompleteConfirm(true)}
                          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                        >
                          <CheckCircle2 className="inline h-5 w-5 mr-2" />
                          Xác nhận hoàn thành & giải ngân
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Coins className="mx-auto h-12 w-12 text-slate-300" />
                      <p className="mt-4 text-sm text-slate-600">Chưa có giao dịch nào</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {/* Mentor Card (if accepted) */}
            {acceptedProposal && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-gradient-to-br from-indigo-50 to-white px-6 py-5 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-black text-white shadow-lg">
                      {acceptedProposal.mentorName?.charAt(0) || 'M'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Mentor đang đồng hành</p>
                      <h3 className="mt-1 truncate text-lg font-black text-slate-950">{acceptedProposal.mentorName}</h3>
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã chọn
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4">
                  <div className="text-sm text-slate-600 mb-4">
                    <p className="font-bold text-slate-900">Đã chốt giá: {formatCurrency(acceptedProposal.proposedAmount || 0)}</p>
                  </div>
                  <button
                    onClick={() => setChatDrawer({
                      recipientId: acceptedProposal.mentorId,
                      contextType: contract ? 'CONTRACT' : 'PROPOSAL',
                      contextId: contract ? contract.id : acceptedProposal.id,
                      title: acceptedProposal.mentorName,
                    })}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition"
                  >
                    <MessageSquare className="inline h-4 w-4 mr-2" />
                    Mở chat
                  </button>
                </div>
              </div>
            )}

            {/* Guide Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Hướng dẫn</h3>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">1</div>
                  <p className="text-slate-700">Xem xét đề xuất từ mentor.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">2</div>
                  <p className="text-slate-700">Chat để làm rõ phạm vi, deadline và kỳ vọng.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">3</div>
                  <p className="text-slate-700">Chấp nhận mentor phù hợp nhất.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">4</div>
                  <p className="text-slate-700">Theo dõi escrow và xác nhận hoàn thành khi công việc xong.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Complete Confirmation Modal */}
      {showCompleteConfirm && contract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Xác nhận hoàn thành?</h3>
            <p className="text-sm text-slate-600 text-center mb-6">
              Khi xác nhận, {formatCurrency(contract.amountInEscrow || 0)} sẽ được giải ngân cho mentor.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={() => completeContractMutation.mutate(contract.id)}
                disabled={completeContractMutation.isLoading}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700 disabled:bg-emerald-400"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Drawer */}
      {chatDrawer && (
        <ContextualChatDrawer
          open={true}
          onOpenChange={(open) => {
            if (!open) setChatDrawer(null)
          }}
          recipientId={chatDrawer.recipientId}
          contextType={chatDrawer.contextType}
          contextId={chatDrawer.contextId}
          title={chatDrawer.title}
          subtitle={chatDrawer.subtitle}
        />
      )}
    </div>
  )
}
