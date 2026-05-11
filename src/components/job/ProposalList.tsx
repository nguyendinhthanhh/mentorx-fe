import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { proposalApi } from '@/api/proposalApi'
import { negotiationApi } from '@/api/negotiationApi'
import { chatApi } from '@/api/chatApi'
import { useAuthStore } from '@/store/authStore'
import { useSearchParams, Link } from 'react-router-dom'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'
import { ProposalResponse } from '@/types'
import { 
  CalendarDays, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  Timer, 
  User, 
  XCircle,
  Filter,
  AlertCircle,
  TrendingUp,
  MessageCircle,
  DollarSign,
  Loader2,
  ArrowRight,
  Eye,
  Edit,
} from 'lucide-react'

interface Props {
  jobId: string
}

type StatusFilter = 'ALL' | 'SUBMITTED' | 'NEGOTIATING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED'

export default function ProposalList({ jobId }: Props) {
  const { user } = useAuthStore()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [searchParams] = useSearchParams()
  const targetProposalId = searchParams.get('proposalId')

  const { data, isLoading, refetch } = useQuery(['proposals', jobId], () =>
    proposalApi.getByJob(jobId, { page: 0, size: 50 })
  )

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

      // Auto-setup workspace (Chat Room & Initial Message)
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

          const room = await chatApi.createRoom({
            roomType: 'DIRECT_MESSAGE',
            memberIds: [user.userId, proposalToAccept.mentorId],
            createdByUserId: user.userId,
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

      refetch()
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
      refetch()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể từ chối proposal')
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

  const proposals = data.content
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

  const acceptedProposal = proposals.find(p => p.status === 'ACCEPTED')
  const hasAcceptedProposal = Boolean(acceptedProposal)

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
          <div>
            <p className="text-sm font-bold text-emerald-900">
              Đã chọn mentor: <span className="font-black">{acceptedProposal.mentorName}</span>
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              Giá thỏa thuận: {formatCurrency(acceptedProposal.proposedAmount)} • 
              Thời gian: {acceptedProposal.estimatedDurationDays} ngày
            </p>
          </div>
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
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              id={`proposal-${proposal.id}`}
              proposal={proposal}
              actionLoading={actionLoading}
              hasAcceptedProposal={hasAcceptedProposal}
              onAccept={handleAccept}
              onReject={handleReject}
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

function ProposalCard({
  id,
  proposal,
  actionLoading,
  hasAcceptedProposal,
  onAccept,
  onReject,
}: {
  id?: string
  proposal: ProposalResponse
  actionLoading: string | null
  hasAcceptedProposal: boolean
  onAccept: (proposalId: string) => void
  onReject: (proposalId: string) => void
}) {
  const isPending = proposal.status === 'SUBMITTED' || proposal.status === 'DRAFT' || proposal.status === 'UNDER_REVIEW'
  const isAccepted = proposal.status === 'ACCEPTED'
  const isRejected = proposal.status === 'REJECTED'
  const isNegotiating = proposal.status === 'NEGOTIATING'

  // Fetch latest negotiation
  const { data: latestNegotiation } = useQuery(
    ['negotiation-latest', proposal.id],
    () => negotiationApi.getLatest(proposal.id),
    { 
      enabled: isNegotiating || isAccepted,
      retry: false
    }
  )

  // Fetch negotiation history
  const { data: negotiationHistory } = useQuery(
    ['negotiation-history', proposal.id],
    () => negotiationApi.getByProposal(proposal.id),
    { 
      enabled: isNegotiating || isAccepted,
      retry: false
    }
  )
  
  const price = proposal.proposedAmount
    ? formatCurrency(proposal.proposedAmount)
    : proposal.proposedHourlyRate
      ? `${formatCurrency(proposal.proposedHourlyRate)}/hr`
      : 'Chưa xác định'

  return (
    <article
      id={id}
      className={`rounded-2xl border bg-white p-6 shadow-sm transition-all duration-500 ${
        isAccepted
          ? 'border-emerald-200 ring-2 ring-emerald-100'
          : isRejected
            ? 'border-slate-200 opacity-60'
            : isNegotiating
              ? 'border-amber-200 ring-2 ring-amber-100'
              : 'border-slate-200 hover:border-indigo-200 hover:shadow-md'
      }`}
    >
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Link to={`/mentors/${proposal.mentorId}`} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-700 hover:bg-indigo-100 transition-colors">
              {getInitials(proposal.mentorName)}
            </Link>
            <div className="min-w-0 flex-1">
              <Link to={`/mentors/${proposal.mentorId}`} className="group inline-flex items-center gap-1.5 hover:opacity-80">
                <h4 className="text-lg font-black text-slate-950 group-hover:text-indigo-600 transition-colors">{proposal.mentorName}</h4>
                <Eye className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100" />
              </Link>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Gửi {formatRelativeTime(proposal.submittedAt || proposal.createdAt)}
              </p>
            </div>
          </div>
          <StatusBadge status={proposal.status} />
        </div>

        {/* Cover Letter & Experience Section */}
        <div className={`grid gap-4 ${proposal.relevantExperience ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
          <div className="flex flex-col rounded-xl bg-slate-50 p-4 border border-slate-100">
            <h5 className="text-xs font-black uppercase text-slate-400 mb-2">Cover Letter</h5>
            <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap line-clamp-4">{proposal.coverLetter}</p>
          </div>
          
          {proposal.relevantExperience && (
            <div className="flex flex-col rounded-xl bg-indigo-50/50 p-4 border border-indigo-100">
              <h5 className="text-xs font-black uppercase text-indigo-500 mb-2">Kinh nghiệm liên quan</h5>
              <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap line-clamp-4">{proposal.relevantExperience}</p>
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ProposalFact label="Giá ban đầu" value={price} icon={DollarSign} />
          <ProposalFact
            label="Thời gian ban đầu"
            value={proposal.estimatedDurationDays ? `${proposal.estimatedDurationDays} ngày` : 'Chưa xác định'}
            icon={Timer}
          />
          {proposal.proposedDeliveryDate && (
            <ProposalFact 
              label="Ngày giao" 
              value={new Date(proposal.proposedDeliveryDate).toLocaleDateString('vi-VN')} 
              icon={CalendarDays} 
            />
          )}
        </div>

        {/* Latest Negotiation (Mentor's Counter Offer) */}
        {isNegotiating && latestNegotiation && (
          <div className="relative bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-2xl p-5 mt-4 shadow-sm overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/30 rounded-full -mr-8 -mt-8 blur-2xl" />
            
            <div className="relative flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">
                    {latestNegotiation.senderType === 'MENTOR' ? 'Mentor đã đề xuất lại' : 'Bạn đã đề xuất thương lượng'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {latestNegotiation.senderType === 'MENTOR' ? 'Đang chờ bạn phản hồi' : 'Đang chờ mentor phản hồi'}
                  </p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-md bg-white/80 border border-amber-100 text-[10px] font-bold text-amber-600 shadow-sm">
                {formatRelativeTime(latestNegotiation.createdAt)}
              </div>
            </div>

            <div className="relative bg-white rounded-xl p-4 border border-amber-100/50 mb-4 shadow-sm italic text-slate-600 text-sm leading-relaxed">
              <span className="text-amber-300 text-2xl absolute -top-1 -left-1 font-serif opacity-50">"</span>
              {latestNegotiation.message}
              <span className="text-amber-300 text-2xl absolute -bottom-4 -right-1 font-serif opacity-50">"</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {latestNegotiation.proposedAmount && (
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3.5 border border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                  <p className="text-[10px] font-black text-amber-600 uppercase mb-2 tracking-widest">Giá thỏa thuận</p>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 line-through text-xs font-bold">{proposal.proposedAmount} MXC</span>
                    <ArrowRight className="w-3 h-3 text-amber-500" />
                    <span className="text-lg font-black text-amber-700">{latestNegotiation.proposedAmount} MXC</span>
                  </div>
                </div>
              )}
              {latestNegotiation.estimatedDurationDays && (
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3.5 border border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                  <p className="text-[10px] font-black text-amber-600 uppercase mb-2 tracking-widest">Thời gian mới</p>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 line-through text-xs font-bold">{proposal.estimatedDurationDays} ngày</span>
                    <ArrowRight className="w-3 h-3 text-amber-500" />
                    <span className="text-lg font-black text-amber-700">{latestNegotiation.estimatedDurationDays} ngày</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Negotiation History & Final Terms */}
        {(isNegotiating || isAccepted) && negotiationHistory && negotiationHistory.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <h5 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-indigo-500" />
              Lịch sử thương lượng
            </h5>
            <div className="space-y-4">
              {negotiationHistory.map((neg, idx) => (
                <div key={neg.id} className={`p-4 rounded-xl border text-sm shadow-sm ${neg.senderType === 'CLIENT' ? 'bg-indigo-50 border-indigo-100 ml-8' : 'bg-slate-50 border-slate-200 mr-8'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-900">{neg.senderType === 'CLIENT' ? 'Bạn' : neg.senderName || 'Mentor'}</span>
                    <span className="text-[10px] font-bold text-slate-500">{formatRelativeTime(neg.createdAt)}</span>
                  </div>
                  <p className="text-slate-700 italic mb-3">"{neg.message}"</p>
                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    {neg.proposedAmount && (
                      <span className="text-emerald-700 bg-emerald-100/50 px-2.5 py-1 rounded-md border border-emerald-200">
                        Giá: {neg.proposedAmount} MXC
                      </span>
                    )}
                    {neg.estimatedDurationDays && (
                      <span className="text-blue-700 bg-blue-100/50 px-2.5 py-1 rounded-md border border-blue-200">
                        Thời gian: {neg.estimatedDurationDays} ngày
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Final agreed details if accepted */}
            {isAccepted && (
               <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                 <div>
                   <p className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-2">Kết quả chốt deal</p>
                   <div className="flex items-center gap-4">
                     <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm">
                       <p className="text-[10px] text-emerald-600 font-bold mb-0.5">Giá cuối</p>
                       <p className="text-lg font-black text-emerald-900">{latestNegotiation?.proposedAmount || proposal.proposedAmount} MXC</p>
                     </div>
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                     <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm">
                       <p className="text-[10px] text-emerald-600 font-bold mb-0.5">Thời gian</p>
                       <p className="text-lg font-black text-emerald-900">{latestNegotiation?.estimatedDurationDays || proposal.estimatedDurationDays} ngày</p>
                     </div>
                   </div>
                 </div>
                 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
                   <Link
                     to={`/chat?userId=${proposal.mentorId}&jobId=${proposal.jobId}&contextMsg=${encodeURIComponent(`🎉 **Dự án đã chính thức được bắt đầu!**\n\nChào mentor **${proposal.mentorName}**, tôi vừa chấp nhận đề xuất của bạn. Dưới đây là thông tin chốt:\n- **Giá thỏa thuận**: ${latestNegotiation?.proposedAmount || proposal.proposedAmount} MXC\n- **Thời gian**: ${latestNegotiation?.estimatedDurationDays || proposal.estimatedDurationDays} ngày\n\nChúng ta sẽ sử dụng không gian này để trao đổi tiến độ và tài liệu công việc nhé!`)}`}
                     className="flex-1 sm:flex-none inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                   >
                     <MessageSquare className="w-4 h-4" />
                     Bắt đầu làm việc
                   </Link>
                   <div className="hidden sm:flex w-11 h-11 rounded-full bg-emerald-100 items-center justify-center flex-shrink-0">
                     <CheckCircle className="w-5 h-5 text-emerald-600" />
                   </div>
                 </div>
               </div>
            )}
          </div>
        )}

        {/* Rejection Reason */}
        {isRejected && proposal.rejectionReason && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black uppercase text-rose-600 mb-1">Lý do từ chối</p>
                <p className="text-sm text-rose-700">{proposal.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <ProposalActions
          proposal={proposal}
          latestNegotiation={latestNegotiation}
          isPending={isPending}
          isNegotiating={isNegotiating}
          hasAcceptedProposal={hasAcceptedProposal}
          actionLoading={actionLoading}
          onAccept={onAccept}
          onReject={onReject}
        />
      </div>
    </article>
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
  onAccept: (proposalId: string) => void
  onReject: (proposalId: string) => void
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
}: ProposalActionsProps) {
  const { user } = useAuthStore()
  const [showNegotiateForm, setShowNegotiateForm] = useState(false)
  const [negotiateMessage, setNegotiateMessage] = useState('')
  const [negotiateAmount, setNegotiateAmount] = useState(proposal.proposedAmount?.toString() || '')
  const [negotiateDays, setNegotiateDays] = useState(proposal.estimatedDurationDays?.toString() || '')
  const [negotiating, setNegotiating] = useState(false)

  const handleNegotiate = async () => {
    if (!negotiateMessage.trim() || negotiateMessage.length < 10) {
      alert('Vui lòng nhập message ít nhất 10 ký tự')
      return
    }

    if (!negotiateAmount && !negotiateDays) {
      alert('Vui lòng nhập ít nhất giá hoặc thời gian')
      return
    }

    if (!user?.userId) {
      alert('Vui lòng đăng nhập')
      return
    }

    try {
      setNegotiating(true)
      
      // Call API
      await negotiationApi.clientCounterOffer({
        proposalId: proposal.id,
        senderId: user.userId,
        message: negotiateMessage,
        proposedAmount: negotiateAmount ? parseFloat(negotiateAmount) : undefined,
        estimatedDurationDays: negotiateDays ? parseInt(negotiateDays) : undefined,
      })
      
      // Success
      alert('✅ Đã gửi đề xuất thương lượng thành công! Mentor sẽ nhận được thông báo.')
      setShowNegotiateForm(false)
      setNegotiateMessage('')
      
      // Refresh page to see updated status
      window.location.reload()
      
    } catch (error: any) {
      console.error('Negotiation error:', error)
      const errorMessage = error.response?.data?.message || 'Không thể gửi counter-offer. Vui lòng thử lại.'
      alert('❌ ' + errorMessage)
    } finally {
      setNegotiating(false)
    }
  }

  return (
    <div className="space-y-3 pt-2 border-t border-slate-100">
      {/* Negotiation Form */}
      {showNegotiateForm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-indigo-900">💬 Gửi đề xuất thương lượng</h4>
            <button
              onClick={() => setShowNegotiateForm(false)}
              className="text-indigo-600 hover:text-indigo-700"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={negotiateMessage}
              onChange={(e) => setNegotiateMessage(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Bạn có thể làm với giá 400 MXC trong 10 ngày không?"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Tối thiểu 10 ký tự</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Giá đề xuất (MXC)
              </label>
              <input
                type="number"
                value={negotiateAmount}
                onChange={(e) => setNegotiateAmount(e.target.value)}
                placeholder="400"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Thời gian (ngày)
              </label>
              <input
                type="number"
                value={negotiateDays}
                onChange={(e) => setNegotiateDays(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleNegotiate}
              disabled={negotiating}
              className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700 disabled:bg-slate-300"
            >
              {negotiating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  Gửi đề xuất
                </>
              )}
            </button>
            <button
              onClick={() => setShowNegotiateForm(false)}
              disabled={negotiating}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {isPending && !hasAcceptedProposal && (
          <>
            <button
              type="button"
              onClick={() => onAccept(proposal.id)}
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
              onClick={() => setShowNegotiateForm(!showNegotiateForm)}
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
                  onClick={() => onAccept(proposal.id)}
                  disabled={Boolean(actionLoading)}
                  className="flex-1 sm:flex-none inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white hover:bg-emerald-700 disabled:bg-slate-300 transition-all shadow-lg shadow-emerald-200 hover:scale-[1.02] active:scale-95"
                >
                  <CheckCircle className="h-4 w-4" />
                  Chấp nhận đề xuất
                </button>
                <button
                  type="button"
                  onClick={() => setShowNegotiateForm(!showNegotiateForm)}
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
                  onClick={() => setShowNegotiateForm(!showNegotiateForm)}
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
    </div>
  )
}
