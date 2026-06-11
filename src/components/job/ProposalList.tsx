import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import { proposalApi } from '@/api/proposalApi'
import { negotiationApi, type NegotiationResponse } from '@/api/negotiationApi'
import { chatApi } from '@/api/chatApi'
import { useAuthStore } from '@/store/authStore'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { formatCurrency, formatRelativeTime, formatDeadline, formatTimeRemaining } from '@/utils/formatters'
import { ProposalResponse } from '@/types'
import { ensureDirectJobChat, getJobChatRoute } from '@/utils/jobWorkspace'
import {
  Clock3,
  DollarSign,
  MessageCircle,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  CheckCircle2,
  Loader2,
  CalendarDays,
  Timer,
  ArrowRight,
  TrendingUp,
  X,
  Edit,
  MessageSquare,
  ChevronRight,
  PencilLine,
  FileText,
  User
} from 'lucide-react'

interface Props {
  jobId: string
}

type StatusFilter = 'ALL' | 'SUBMITTED' | 'NEGOTIATING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED'

type AcceptCandidate = ProposalResponse & {
  acceptedAmount?: number | null
  acceptedDurationDays?: number | null
}

export default function ProposalList({ jobId }: Props) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [acceptCandidate, setAcceptCandidate] = useState<{
    id: string
    mentorId: string
    mentorName: string
    acceptedAmount?: number
    acceptedDurationDays?: number
    jobId: string
  } | null>(null)
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [searchParams] = useSearchParams()
  const targetProposalId = searchParams.get('proposalId')

  const { data, isLoading, refetch } = useQuery(['proposals', jobId], () =>
    proposalApi.getByJob(jobId, { page: 0, size: 50 })
  )

  const proposals = data?.content || []
  const acceptedProposal = proposals.find((proposal) => proposal.status === 'ACCEPTED')
  const hasAcceptedProposal = Boolean(acceptedProposal)

  const { data: acceptedLatestNegotiation } = useQuery(
    ['negotiation-latest', acceptedProposal?.id, 'accepted-summary'],
    () => negotiationApi.getLatest(acceptedProposal!.id),
    {
      enabled: !!acceptedProposal?.id,
      retry: false,
    }
  )

  const refreshProposalViews = async () => {
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries(['negotiation-latest']),
      queryClient.invalidateQueries(['negotiation-history']),
      queryClient.invalidateQueries(['job', jobId]),
      queryClient.invalidateQueries(['job-contracts', jobId]),
      queryClient.invalidateQueries(['my-posted-jobs']),
      queryClient.invalidateQueries(['userBalance']),
    ])
  }

  // Effect to scroll to target proposal
  useEffect(() => {
    if (targetProposalId) {
      setTimeout(() => {
        const element = document.getElementById(`proposal-${targetProposalId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('ring-4', 'ring-indigo-500/30', 'border-indigo-500')
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-indigo-500/30', 'border-indigo-500')
          }, 3000)
        }
      }, 500)
    }
  }, [targetProposalId, data])

  const handleAccept = async (proposalId: string) => {
    if (!confirm('Bạn có chắc chắn muốn chấp nhận proposal này?')) return
    try {
      setActionLoading(proposalId)
      await proposalApi.accept(proposalId)

      // Auto-setup direct chat and kickoff message.
      const proposalToAccept = data?.content.find((p) => p.id === proposalId)
      if (proposalToAccept && user) {
        try {
          let finalAmount = proposalToAccept.proposedAmount
          let finalDays = proposalToAccept.estimatedDurationDays

          try {
            const latestNeg = await negotiationApi.getLatest(proposalId)
            if (latestNeg) {
              finalAmount = latestNeg.proposedAmount || finalAmount
              finalDays = latestNeg.estimatedDurationDays || finalDays
            }
          } catch (e) {
            // Ignore error
          }

          const room = await ensureDirectJobChat({
            currentUserId: user.userId,
            peerUserId: proposalToAccept.mentorId,
            jobId,
          })

          const msg = `🎉 **Dự án đã chính thức được bắt đầu!**\n\nChào mentor **${proposalToAccept.mentorName}**, tôi vừa chấp nhận đề xuất của bạn. Dưới đây là thông tin chốt:\n- **Giá thỏa thuận**: ${finalAmount} MXC\n- **Thời gian**: ${finalDays} ngày\n\nChúng ta sẽ sử dụng không gian này để trao đổi tiến độ và tài liệu công việc nhé!`

          await chatApi.sendMessage({
            chatRoomId: room.id,
            senderId: user.userId,
            content: msg,
            messageType: 'TEXT',
          })
        } catch (chatError) {
          console.error('Lỗi khi setup không gian làm việc:', chatError)
        }
      }

      await refreshProposalViews()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể chấp nhận proposal')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (proposalId: string) => {
    const reason = prompt('Lý do từ chối (tùy chọn):')
    if (reason === null) return // User cancelled
    try {
      setActionLoading(proposalId)
      await proposalApi.reject(proposalId, reason || 'Not selected for this project')
      await refreshProposalViews()
      setSelectedProposalId(null)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể từ chối proposal')
    } finally {
      setActionLoading(null)
    }
  }

  const openAcceptConfirm = (proposal: ProposalResponse, latestNegotiation?: NegotiationResponse) => {
    setAcceptCandidate({
      id: proposal.id,
      mentorId: proposal.mentorId,
      mentorName: proposal.mentorName,
      jobId,
      acceptedAmount: latestNegotiation?.proposedAmount ?? proposal.proposedAmount ?? undefined,
      acceptedDurationDays: latestNegotiation?.estimatedDurationDays ?? proposal.estimatedDurationDays ?? undefined,
    })
  }

  const confirmAccept = async () => {
    if (!acceptCandidate) return

    try {
      setActionLoading(acceptCandidate.id)
      await proposalApi.accept(acceptCandidate.id)

      if (user) {
        try {
          const room = await ensureDirectJobChat({
            currentUserId: user.userId,
            peerUserId: acceptCandidate.mentorId,
            jobId,
          })

          const msg = `🎉 **Dự án đã chính thức được bắt đầu!**\n\nChào mentor **${acceptCandidate.mentorName}**, tôi vừa chấp nhận đề xuất của bạn. Dưới đây là thông tin chốt:\n- **Giá thỏa thuận**: ${acceptCandidate.acceptedAmount} MXC\n- **Thời gian**: ${acceptCandidate.acceptedDurationDays} ngày\n\nChúng ta sẽ sử dụng không gian này để trao đổi tiến độ và tài liệu công việc nhé!`

          await chatApi.sendMessage({
            chatRoomId: room.id,
            senderId: user.userId,
            content: msg,
            messageType: 'TEXT',
          })
          toast.success('Deal accepted. Chat is ready.')
          navigate(getJobChatRoute(jobId, acceptCandidate.mentorId))
        } catch (chatError) {
          console.error('Lỗi khi setup không gian làm việc:', chatError)
        }
      }

      await refreshProposalViews()
      setAcceptCandidate(null)
      setSelectedProposalId(null)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể chấp nhận proposal')
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-2xl bg-slate-50" />
        ))}
      </div>
    )
  }

  if (!data?.content.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <User className="mx-auto h-12 w-12 text-slate-300" />
        <h3 className="mt-3 text-lg font-black text-slate-950">Chưa có proposals</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Khi có mentor apply vào job này, proposals của họ sẽ hiển thị ở đây. Bạn có thể xem, thương lượng và chọn mentor phù hợp.
        </p>
      </div>
    )
  }

  const filteredProposals = statusFilter === 'ALL' 
    ? proposals 
    : proposals.filter(p => p.status === statusFilter)

  // Stats
  const stats = {
    total: proposals.length,
    submitted: proposals.filter(p => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').length,
    negotiating: proposals.filter(p => p.status === 'NEGOTIATING').length,
    shortlisted: proposals.filter(p => p.status === 'SHORTLISTED').length,
    accepted: proposals.filter(p => p.status === 'ACCEPTED').length,
    rejected: proposals.filter(p => p.status === 'REJECTED').length,
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <FilterChip label="Tất cả" count={stats.total} active={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')} color="slate" />
        <FilterChip label="Mới gửi" count={stats.submitted} active={statusFilter === 'SUBMITTED'} onClick={() => setStatusFilter('SUBMITTED')} color="blue" />
        <FilterChip label="Đang deal" count={stats.negotiating} active={statusFilter === 'NEGOTIATING'} onClick={() => setStatusFilter('NEGOTIATING')} color="amber" />
        <FilterChip label="Được chọn" count={stats.shortlisted} active={statusFilter === 'SHORTLISTED'} onClick={() => setStatusFilter('SHORTLISTED')} color="purple" />
        <FilterChip label="Chấp nhận" count={stats.accepted} active={statusFilter === 'ACCEPTED'} onClick={() => setStatusFilter('ACCEPTED')} color="emerald" />
        <FilterChip label="Từ chối" count={stats.rejected} active={statusFilter === 'REJECTED'} onClick={() => setStatusFilter('REJECTED')} color="rose" />
      </div>

      {/* Accepted Banner */}
      {acceptedProposal && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-900">
              Đã chọn mentor: <span className="font-black">{acceptedProposal.mentorName}</span>
            </p>
            <p className="hidden">
              Giá thỏa thuận: {formatCurrency(acceptedProposal.proposedAmount)} • 
              Thời gian: {acceptedProposal.estimatedDurationDays} ngày
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              Final amount: {formatCurrency(acceptedLatestNegotiation?.proposedAmount || acceptedProposal.proposedAmount)} | Timeline:{' '}
              {acceptedLatestNegotiation?.estimatedDurationDays || acceptedProposal.estimatedDurationDays} days
            </p>
          </div>
          <Link
            to={getJobChatRoute(jobId, acceptedProposal.mentorId)}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700"
          >
            Open chat
          </Link>
        </div>
      )}

      {/* Filter Info */}
      {statusFilter !== 'ALL' && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-indigo-900">
              Hiển thị {filteredProposals.length} proposals với status: {statusFilter}
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('ALL')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-600">
            Không có proposals với status này
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProposals.map((proposal) => (
            <CompactProposalCard
              key={proposal.id}
              proposal={proposal}
              onClick={() => setSelectedProposalId(proposal.id)}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {filteredProposals.length > 0 && (
        <div className="text-center text-sm text-slate-500">
          Hiển thị {filteredProposals.length} / {proposals.length} proposals
        </div>
      )}

      {selectedProposalId && (
        <ProposalDetailDrawer
          proposal={proposals.find(p => p.id === selectedProposalId)!}
          onClose={() => setSelectedProposalId(null)}
          actionLoading={actionLoading}
          hasAcceptedProposal={hasAcceptedProposal}
          onAccept={openAcceptConfirm}
          onReject={handleReject}
          onNegotiated={refreshProposalViews}
        />
      )}

      {acceptCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-950">Chấp nhận đề xuất này?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Bạn sắp chọn <span className="font-black text-slate-900">{acceptCandidate.mentorName}</span> cho công việc này.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="font-bold text-slate-500">Mentor</span>
                <span className="text-right font-black text-slate-950">{acceptCandidate.mentorName}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-bold text-slate-500">Giá đề xuất</span>
                <span className="text-right font-black text-slate-950">
                  {formatCurrency(acceptCandidate.acceptedAmount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-bold text-slate-500">Thời gian</span>
                <span className="text-right font-black text-slate-950">
                  {acceptCandidate.acceptedDurationDays ? `${acceptCandidate.acceptedDurationDays} ngày` : 'Chưa xác định'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setAcceptCandidate(null)}
                disabled={actionLoading === acceptCandidate.id}
                className="flex-1 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmAccept}
                disabled={actionLoading === acceptCandidate.id}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-black text-white hover:bg-emerald-700 disabled:bg-slate-300"
              >
                {actionLoading === acceptCandidate.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Xác nhận chấp nhận
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


interface FilterChipProps {
  label: string
  count: number
  color: 'slate' | 'blue' | 'amber' | 'purple' | 'emerald' | 'rose'
  active: boolean
  onClick: () => void
}

function FilterChip({ label, count, color, active, onClick }: FilterChipProps) {
  const baseColors = {
    slate: 'hover:bg-slate-100 text-slate-600 border-slate-200',
    blue: 'hover:bg-blue-50 text-blue-600 border-blue-200',
    amber: 'hover:bg-amber-50 text-amber-600 border-amber-200',
    purple: 'hover:bg-purple-50 text-purple-600 border-purple-200',
    emerald: 'hover:bg-emerald-50 text-emerald-600 border-emerald-200',
    rose: 'hover:bg-rose-50 text-rose-600 border-rose-200',
  }
  const activeColors = {
    slate: 'bg-slate-800 text-white border-slate-800 shadow-md',
    blue: 'bg-blue-600 text-white border-blue-600 shadow-md',
    amber: 'bg-amber-500 text-white border-amber-500 shadow-md',
    purple: 'bg-purple-600 text-white border-purple-600 shadow-md',
    emerald: 'bg-emerald-600 text-white border-emerald-600 shadow-md',
    rose: 'bg-rose-600 text-white border-rose-600 shadow-md',
  }

  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all ${
        active ? activeColors[color] : `bg-white ${baseColors[color]}`
      }`}
    >
      <span>{label}</span>
      <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-black ${
        active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
      }`}>
        {count}
      </span>
    </button>
  )
}

function CompactProposalCard({
  proposal,
  onClick
}: {
  proposal: ProposalResponse
  onClick: () => void
}) {
  const isAccepted = proposal.status === 'ACCEPTED' || proposal.status === 'OFFER_ACCEPTED'
  const isRejected = proposal.status === 'REJECTED'
  const isNegotiating = proposal.status === 'NEGOTIATING'

  const { data: latestNegotiation } = useQuery(
    ['negotiation-latest', proposal.id],
    () => negotiationApi.getLatest(proposal.id),
    { enabled: isNegotiating || isAccepted, retry: false }
  )

  const currentAmount = latestNegotiation?.proposedAmount ?? proposal.proposedAmount

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md ${
        isAccepted ? 'border-emerald-200 bg-emerald-50/30' :
        isRejected ? 'border-slate-200 opacity-70' :
        isNegotiating ? 'border-amber-200 hover:border-amber-300' :
        'border-slate-200 hover:border-indigo-300'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-700">
          {getInitials(proposal.mentorName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-base font-black text-slate-950 group-hover:text-indigo-600 transition-colors">
              {proposal.mentorName}
            </h4>
            <StatusBadge status={proposal.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1"><Clock3 className="w-3.5 h-3.5"/> {formatRelativeTime(proposal.submittedAt || proposal.createdAt)}</span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-slate-400"/> {currentAmount ? formatCurrency(currentAmount) : 'N/A'}</span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-slate-400"/> 
              {(latestNegotiation?.estimatedDurationDays || proposal.estimatedDurationDays) 
                ? `${latestNegotiation?.estimatedDurationDays || proposal.estimatedDurationDays} ngày`
                : (latestNegotiation?.deadlineAt || proposal.deadlineAt)
                  ? formatDeadline(latestNegotiation?.deadlineAt || proposal.deadlineAt)
                  : 'N/A'
              }
            </span>
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

function ProposalDetailDrawer({
  proposal,
  onClose,
  actionLoading,
  hasAcceptedProposal,
  onAccept,
  onReject,
  onNegotiated
}: {
  proposal: ProposalResponse
  onClose: () => void
  actionLoading: string | null
  hasAcceptedProposal: boolean
  onAccept: (proposal: ProposalResponse, latestNegotiation?: NegotiationResponse) => void
  onReject: (proposalId: string) => void
  onNegotiated: () => void | Promise<unknown>
}) {
  const isOfferAccepted = proposal.status === 'OFFER_ACCEPTED'
  const isPending = proposal.status === 'SUBMITTED' || proposal.status === 'DRAFT' || proposal.status === 'UNDER_REVIEW' || isOfferAccepted
  const isAccepted = proposal.status === 'ACCEPTED'
  const isRejected = proposal.status === 'REJECTED'
  const isNegotiating = proposal.status === 'NEGOTIATING'
  const shouldFetchNegotiation = isNegotiating || isAccepted || isOfferAccepted

  const { data: latestNegotiation } = useQuery(
    ['negotiation-latest', proposal.id],
    () => negotiationApi.getLatest(proposal.id),
    { enabled: shouldFetchNegotiation, retry: false }
  )

  const { data: negotiationHistory } = useQuery(
    ['negotiation-history', proposal.id],
    () => negotiationApi.getByProposal(proposal.id),
    { enabled: shouldFetchNegotiation, retry: false }
  )

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-xl bg-slate-50 h-full overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-700">
               {getInitials(proposal.mentorName)}
             </div>
             <div>
               <h3 className="font-black text-lg text-slate-950 truncate max-w-[200px] sm:max-w-[300px]">{proposal.mentorName}</h3>
               <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-bold">
                 <span>{formatRelativeTime(proposal.submittedAt || proposal.createdAt)}</span>
                 <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                 <StatusBadge status={proposal.status} />
               </div>
             </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Thread Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* First Message (Original Proposal) */}
          <div className="flex gap-4">
             <div className="flex-shrink-0 flex flex-col items-center">
               <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                 <FileText className="w-4 h-4" />
               </div>
               <div className="w-0.5 flex-1 bg-slate-200 my-2"></div>
             </div>
             <div className="flex-1 pb-6">
               <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                 <div className="flex items-center justify-between mb-3">
                   <span className="text-sm font-black text-slate-900">Original Proposal</span>
                   <span className="text-[10px] text-slate-500 font-bold">{formatRelativeTime(proposal.submittedAt || proposal.createdAt)}</span>
                 </div>
                 
                 <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">
                   {proposal.coverLetter}
                 </div>
                 {proposal.relevantExperience && (
                   <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 mb-4">
                     <p className="text-[10px] font-black text-indigo-500 uppercase mb-1">Kinh nghiệm liên quan</p>
                     <p className="text-sm text-slate-700">{proposal.relevantExperience}</p>
                   </div>
                 )}

                 <div className="flex flex-wrap gap-2 text-xs font-bold">
                   <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-1.5">
                     <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                     {proposal.proposedAmount ? formatCurrency(proposal.proposedAmount) : (proposal.proposedHourlyRate ? `${formatCurrency(proposal.proposedHourlyRate)}/hr` : 'N/A')}
                   </div>
                   <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-1.5">
                     <Timer className="w-3.5 h-3.5 text-slate-400" />
                     {proposal.estimatedDurationDays ? `${proposal.estimatedDurationDays} ngày` : 'N/A'}
                   </div>
                 </div>
               </div>
             </div>
          </div>

          {/* Negotiation History */}
          {negotiationHistory && negotiationHistory.length > 0 && negotiationHistory.map((neg, idx) => {
            const isLast = idx === negotiationHistory.length - 1 && !isRejected && !isAccepted
            return (
              <div className="flex gap-4" key={neg.id}>
                <div className="flex-shrink-0 flex flex-col items-center">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center ${neg.senderType === 'CLIENT' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-600'}`}>
                     {neg.senderType === 'CLIENT' ? <MessageCircle className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                   </div>
                   {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-2"></div>}
                </div>
                <div className={`flex-1 ${!isLast ? 'pb-6' : ''}`}>
                   <div className={`rounded-2xl p-4 border shadow-sm ${neg.senderType === 'CLIENT' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-sm font-black text-slate-900">{neg.senderType === 'CLIENT' ? 'Bạn' : neg.senderName || 'Mentor'}</span>
                       <span className="text-[10px] text-slate-500 font-bold">{formatRelativeTime(neg.createdAt)}</span>
                     </div>
                     <p className="text-sm text-slate-700 italic mb-3">"{neg.message}"</p>
                     <div className="flex flex-wrap gap-2 text-xs font-bold">
                       {neg.proposedAmount && (
                         <div className="bg-white px-2.5 py-1 rounded-md border border-slate-100 text-slate-700">
                           Giá mới: <span className="font-black text-amber-700">{formatCurrency(neg.proposedAmount)}</span>
                         </div>
                       )}
                       {(neg.deadlineAt || neg.estimatedDurationDays) && (
                         <div className="bg-white px-2.5 py-1 rounded-md border border-slate-100 text-slate-700">
                           Thời gian mới: <span className="font-black text-amber-700">
                             {neg.deadlineAt 
                               ? `${formatDeadline(neg.deadlineAt)} (${formatTimeRemaining(neg.deadlineAt)})`
                               : `${neg.estimatedDurationDays} ngày`}
                           </span>
                         </div>
                       )}
                     </div>
                   </div>
                </div>
              </div>
            )
          })}
          
          {/* Rejection Reason */}
          {isRejected && proposal.rejectionReason && (
             <div className="flex gap-4 mt-6">
               <div className="flex-shrink-0 flex flex-col items-center">
                 <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                   <XCircle className="w-4 h-4" />
                 </div>
               </div>
               <div className="flex-1">
                  <div className="rounded-2xl p-4 border border-rose-200 bg-rose-50">
                    <span className="text-sm font-black text-rose-700 block mb-1">Lý do từ chối</span>
                    <span className="text-sm text-rose-800">{proposal.rejectionReason}</span>
                  </div>
               </div>
             </div>
          )}

          {/* Final terms if accepted */}
          {(isAccepted || isOfferAccepted) && (
            <div className="flex gap-4 mt-6">
               <div className="flex-shrink-0 flex flex-col items-center">
                 <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                   <CheckCircle2 className="w-4 h-4" />
                 </div>
               </div>
               <div className="flex-1">
                  <div className="rounded-2xl p-4 border border-emerald-200 bg-emerald-50 shadow-sm flex items-center justify-between">
                     <div>
                       <span className="text-[10px] font-black uppercase text-emerald-600 block mb-1.5">Kết quả chốt deal</span>
                       <div className="flex items-center gap-3 text-sm font-bold">
                         <span className="bg-white px-3 py-1 rounded-lg text-emerald-900 border border-emerald-100">
                           {formatCurrency(latestNegotiation?.proposedAmount || proposal.proposedAmount || 0)}
                         </span>
                         <span className="bg-white px-3 py-1 rounded-lg text-emerald-900 border border-emerald-100">
                           {(latestNegotiation?.estimatedDurationDays || proposal.estimatedDurationDays)
                             ? `${latestNegotiation?.estimatedDurationDays || proposal.estimatedDurationDays} ngày`
                             : latestNegotiation?.deadlineAt 
                               ? new Date(latestNegotiation.deadlineAt).toLocaleDateString('vi-VN') 
                               : 'N/A'}
                         </span>
                       </div>
                     </div>
                  </div>
               </div>
             </div>
          )}
        </div>

        {/* Action Bottom Bar */}
        <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           <ProposalActions
            proposal={proposal}
            latestNegotiation={latestNegotiation}
            isPending={isPending}
            isNegotiating={isNegotiating}
            hasAcceptedProposal={hasAcceptedProposal}
            actionLoading={actionLoading}
            onAccept={onAccept}
            onReject={onReject}
            onNegotiated={onNegotiated}
          />
        </div>
      </div>
    </div>
  )
}

function ProposalFact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-1">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-sm font-black text-slate-950 break-words">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    DRAFT: { label: 'Nháp', className: 'border-slate-200 bg-slate-50 text-slate-700' },
    SUBMITTED: { label: 'Đã gửi', className: 'border-blue-200 bg-blue-50 text-blue-700' },
    UNDER_REVIEW: { label: 'Đang xem xét', className: 'border-amber-200 bg-amber-50 text-amber-700' },
    NEGOTIATING: { label: 'Đang thương lượng', className: 'border-amber-200 bg-amber-50 text-amber-700' },
    SHORTLISTED: { label: 'Được chọn', className: 'border-purple-200 bg-purple-50 text-purple-700' },
    ACCEPTED: { label: 'Chấp nhận', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    OFFER_ACCEPTED: { label: 'Đã chốt giá', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    REJECTED: { label: 'Từ chối', className: 'border-rose-200 bg-rose-50 text-rose-700' },
    WITHDRAWN: { label: 'Đã thu hồi', className: 'border-gray-200 bg-gray-50 text-gray-700' },
  }

  const { label, className } = config[status] || { label: status, className: 'border-slate-200 bg-slate-50 text-slate-600' }

  return (
    <span className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-black ${className}`}>
      {label}
    </span>
  )
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'M'
}

interface ProposalActionsProps {
  proposal: ProposalResponse
  latestNegotiation?: NegotiationResponse
  isPending: boolean
  isNegotiating: boolean
  hasAcceptedProposal: boolean
  actionLoading: string | null
  onAccept: (proposal: ProposalResponse, latestNegotiation?: NegotiationResponse) => void
  onReject: (proposalId: string) => void
  onNegotiated: () => void | Promise<unknown>
}

function ProposalActions({
  proposal,
  latestNegotiation,
  isPending,
  isNegotiating,
  hasAcceptedProposal,
  actionLoading,
  onAccept,
  onReject,
  onNegotiated,
}: ProposalActionsProps) {
  const { user } = useAuthStore()
  const [showNegotiateForm, setShowNegotiateForm] = useState(false)
  const [negotiateMessage, setNegotiateMessage] = useState('')
  const [negotiateAmount, setNegotiateAmount] = useState(proposal.proposedAmount?.toString() || '')
  const [negotiateDeadline, setNegotiateDeadline] = useState(proposal.deadlineAt ? proposal.deadlineAt.slice(0, 16) : '')
  const [negotiating, setNegotiating] = useState(false)
  const isEditingOwnPendingOffer =
    latestNegotiation?.senderType === 'CLIENT' &&
    latestNegotiation?.status === 'PENDING' &&
    latestNegotiation?.senderId === user?.userId

  const openNegotiateForm = (options?: { preserveClientMessage?: boolean }) => {
    const preserveClientMessage = options?.preserveClientMessage ?? false
    const draftAmount = latestNegotiation?.proposedAmount ?? proposal.proposedAmount
    const draftDeadline = latestNegotiation?.deadlineAt ?? proposal.deadlineAt
    const draftMessage = preserveClientMessage && latestNegotiation?.senderType === 'CLIENT'
      ? latestNegotiation.message || ''
      : ''

    setNegotiateMessage(draftMessage)
    setNegotiateAmount(draftAmount != null ? draftAmount.toString() : '')
    setNegotiateDeadline(draftDeadline ? draftDeadline.slice(0, 16) : '')
    setShowNegotiateForm(true)
  }

  const closeNegotiateForm = () => {
    setShowNegotiateForm(false)
  }

  const handleNegotiate = async () => {
    if (!negotiateMessage.trim() || negotiateMessage.length < 10) {
      toast.error('Vui long nhap noi dung it nhat 10 ky tu.')
      return
    }

    if (!negotiateAmount && !negotiateDeadline) {
      toast.error('Vui long nhap it nhat gia hoac thoi gian deadline.')
      return
    }

    if (!user?.userId) {
      toast.error('Vui long dang nhap.')
      return
    }

    try {
      setNegotiating(true)

      const negotiationPayload = {
        proposalId: proposal.id,
        senderId: user.userId,
        message: negotiateMessage,
        proposedAmount: negotiateAmount ? parseFloat(negotiateAmount) : undefined,
        deadlineAt: negotiateDeadline ? new Date(negotiateDeadline).toISOString() : undefined,
      }

      if (isEditingOwnPendingOffer && latestNegotiation) {
        await negotiationApi.updatePendingNegotiation(latestNegotiation.id, negotiationPayload)
        toast.success('Da cap nhat de xuat thuong luong.')
      } else {
        await negotiationApi.clientCounterOffer(negotiationPayload)
        toast.success('Da gui de xuat thuong luong.')
      }

      setShowNegotiateForm(false)
      setNegotiateMessage('')
      
      // Refresh page to see updated status
      await onNegotiated()
      
    } catch (error: any) {
      console.error('Negotiation error:', error)
      const errorMessage = error.response?.data?.message || 'Khong the gui de xuat thuong luong. Vui long thu lai.'
      toast.error(errorMessage)
    } finally {
      setNegotiating(false)
    }
  }

  return (
    <div className="space-y-3 pt-2 border-t border-slate-100">
      {/* Negotiation Form */}
      {showNegotiateForm && (
        <div className="rounded-[24px] border border-indigo-200/80 bg-[linear-gradient(180deg,rgba(245,247,255,0.95),rgba(255,255,255,1))] p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-indigo-100 pb-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Respond</p>
                <h2 className="text-base font-black tracking-tight text-slate-950">Shape the next offer</h2>
              </div>
              <p className="mt-0.5 text-[13px] text-slate-500">Update price, deadline, and work details before sending.</p>
            </div>
            {latestNegotiation && (
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                Last message {formatRelativeTime(latestNegotiation.createdAt)}
              </span>
            )}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Price (MXC)</span>
              <input
                type="number"
                min="1"
                value={negotiateAmount}
                onChange={(event) => setNegotiateAmount(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Deadline date/time</span>
              <input
                type="datetime-local"
                value={negotiateDeadline}
                onChange={(event) => setNegotiateDeadline(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
              <p className="text-[11px] font-medium text-slate-500">
                Choose the latest time this offer should be completed by.
              </p>
              {negotiateDeadline ? (
                <p className={`text-[11px] font-bold ${new Date(negotiateDeadline).getTime() <= Date.now() ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {formatTimeRemaining(negotiateDeadline)}
                </p>
              ) : null}
            </label>
          </div>
          <label className="mt-3 block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Message / Work details</span>
            <textarea
              value={negotiateMessage}
              onChange={(event) => setNegotiateMessage(event.target.value)}
              placeholder="Describe what you will do, what is included, and what you need from the client."
              className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-5 text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
            <p className="text-[11px] font-medium text-slate-500">{negotiateMessage.trim().length}/1000 characters, minimum 10</p>
          </label>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={negotiating}
              onClick={handleNegotiate}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              <PencilLine className="h-4 w-4" />
              {negotiating ? 'Sending...' : 'Send counter offer'}
            </button>
            <button
              type="button"
              disabled={negotiating}
              onClick={closeNegotiateForm}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!showNegotiateForm && (
        <div className="flex flex-wrap gap-2">
          {isPending && !hasAcceptedProposal && (
          <>
            <button
              type="button"
              onClick={() => onAccept(proposal, latestNegotiation)}
              disabled={Boolean(actionLoading)}
              className="flex-1 sm:flex-none inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
            >
              {actionLoading === proposal.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Chấp nhận
            </button>
            <button
              type="button"
              onClick={() => openNegotiateForm()}
              className="flex-1 sm:flex-none inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 text-sm font-black text-white hover:bg-amber-700 transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              Thương lượng
            </button>
            <button
              type="button"
              onClick={() => onReject(proposal.id)}
              disabled={Boolean(actionLoading)}
              className="flex-1 sm:flex-none inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              <XCircle className="h-4 w-4" />
              Từ chối
            </button>
          </>
        )}
        
        {isNegotiating && (
          <>
            {latestNegotiation?.senderType === 'MENTOR' ? (
              <div className="flex flex-wrap gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => onAccept(proposal, latestNegotiation)}
                  disabled={Boolean(actionLoading)}
                  className="flex-1 sm:flex-none inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white hover:bg-emerald-700 disabled:bg-slate-300 transition-all shadow-lg shadow-emerald-200 hover:scale-[1.02] active:scale-95"
                >
                  <CheckCircle className="h-4 w-4" />
                  Chấp nhận đề xuất
                </button>
                <button
                  type="button"
                  onClick={() => openNegotiateForm()}
                  className="flex-1 sm:flex-none inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 text-sm font-black text-white hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 hover:scale-[1.02] active:scale-95"
                >
                  <TrendingUp className="h-4 w-4" />
                  Đề xuất lại
                </button>
                <button
                  type="button"
                  onClick={() => onReject(proposal.id)}
                  disabled={Boolean(actionLoading)}
                  className="flex-1 sm:flex-none inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 hover:bg-slate-50 transition-all hover:border-rose-200 hover:text-rose-600"
                >
                  <XCircle className="h-4 w-4" />
                  Từ chối
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 w-full">
                <div className="flex-1 bg-amber-50/80 border border-dashed border-amber-300 rounded-xl px-5 py-3 text-xs font-bold text-amber-800 flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
                    <Clock className="w-3.5 h-3.5 animate-pulse text-amber-600" />
                  </div>
                  <span>Đang chờ mentor phản hồi đề xuất của bạn...</span>
                </div>
                <button
                  type="button"
                  onClick={() => openNegotiateForm({ preserveClientMessage: true })}
                  className="flex-1 sm:flex-none inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-amber-200 bg-white px-6 text-sm font-black text-amber-700 hover:bg-amber-50 transition-all hover:border-amber-400"
                >
                  <Edit className="h-4 w-4" />
                  Chỉnh sửa
                </button>
              </div>
            )}
          </>
        )}
        
        <button
          type="button"
          className="flex-1 sm:flex-none inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50 transition-all"
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </button>
      </div>
      )}
    </div>
  )
}
