import { useEffect, useState } from 'react'
import { proposalApi } from '@/api/proposalApi'
import { negotiationApi } from '@/api/negotiationApi'
import { useAuthStore } from '@/store/authStore'
import { ProposalResponse } from '@/types'
import { 
  Loader2, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Calendar,
  Eye,
  ExternalLink,
  Filter,
  Search,
  MessageCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

interface NegotiationInfo {
  id: string
  message: string
  proposedAmount?: number
  estimatedDurationDays?: number
  senderType: 'CLIENT' | 'MENTOR'
  senderName: string
  createdAt: string
}

type ProposalStatusFilter = 'ALL' | 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'

const statusConfig = {
  DRAFT: { 
    label: 'Nháp', 
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: FileText,
    iconColor: 'text-slate-500'
  },
  SUBMITTED: { 
    label: 'Đã gửi', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Clock,
    iconColor: 'text-blue-500'
  },
  UNDER_REVIEW: { 
    label: 'Đang xem xét', 
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Eye,
    iconColor: 'text-amber-500'
  },
  SHORTLISTED: { 
    label: 'Được chọn', 
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: CheckCircle,
    iconColor: 'text-purple-500'
  },
  ACCEPTED: { 
    label: 'Chấp nhận', 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
    iconColor: 'text-emerald-500'
  },
  REJECTED: { 
    label: 'Từ chối', 
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    icon: XCircle,
    iconColor: 'text-rose-500'
  },
  WITHDRAWN: { 
    label: 'Đã thu hồi', 
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: AlertCircle,
    iconColor: 'text-gray-500'
  },
  EXPIRED: { 
    label: 'Hết hạn', 
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Clock,
    iconColor: 'text-gray-400'
  },
  INTERVIEW_REQUESTED: { 
    label: 'Yêu cầu phỏng vấn', 
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: Calendar,
    iconColor: 'text-indigo-500'
  },
  NEGOTIATING: { 
    label: 'Đang thương lượng', 
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    icon: DollarSign,
    iconColor: 'text-cyan-500'
  },
}

export default function MentorProposalsPage() {
  const { user } = useAuthStore()
  const [proposals, setProposals] = useState<ProposalResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProposalStatusFilter>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [negotiations, setNegotiations] = useState<Record<string, NegotiationInfo>>({})
  
  // Modal states
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const targetProposalId = searchParams.get('proposalId')

  // Effect to scroll to target proposal
  useEffect(() => {
    if (targetProposalId && proposals.length > 0) {
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
  }, [targetProposalId, proposals])
  const [selectedProposal, setSelectedProposal] = useState<ProposalResponse | null>(null)
  const [counterForm, setCounterForm] = useState({
    message: '',
    amount: 0,
    duration: 0
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadProposals()
  }, [user])

  const loadProposals = async () => {
    if (!user?.userId) return

    try {
      setLoading(true)
      setError('')
      const response = await proposalApi.getByMentor(user.userId, { page: 0, size: 100 })
      setProposals(response.content)
      
      // Load negotiations for NEGOTIATING proposals
      const negotiatingProposals = response.content.filter(p => p.status === 'NEGOTIATING')
      await loadNegotiations(negotiatingProposals)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải proposals')
    } finally {
      setLoading(false)
    }
  }

  const loadNegotiations = async (negotiatingProposals: ProposalResponse[]) => {
    const negotiationsMap: Record<string, NegotiationInfo> = {}
    
    console.log('Loading negotiations for', negotiatingProposals.length, 'proposals')
    
    for (const proposal of negotiatingProposals) {
      try {
        const latestNegotiation = await negotiationApi.getLatest(proposal.id)
        console.log('Loaded negotiation for proposal', proposal.id, latestNegotiation)
        negotiationsMap[proposal.id] = latestNegotiation
      } catch (err) {
        console.error(`Failed to load negotiation for proposal ${proposal.id}`, err)
      }
    }
    
    console.log('Final negotiations map:', negotiationsMap)
    setNegotiations(negotiationsMap)
  }

  const openCounterModal = (proposal: ProposalResponse, currentNegotiation?: NegotiationInfo) => {
    setSelectedProposal(proposal)
    setCounterForm({
      message: '',
      amount: currentNegotiation?.proposedAmount || proposal.proposedAmount,
      duration: currentNegotiation?.estimatedDurationDays || proposal.estimatedDurationDays || 0
    })
    setIsCounterModalOpen(true)
  }

  const handleCounterOffer = async () => {
    if (!selectedProposal || !user?.userId) return
    
    const trimmedMessage = counterForm.message.trim()
    if (!trimmedMessage) {
      toast.error('Vui lòng nhập lời nhắn')
      return
    }

    if (trimmedMessage.length < 10) {
      toast.error('Lời nhắn phải có ít nhất 10 ký tự')
      return
    }
    
    try {
      setSubmitting(true)
      await negotiationApi.mentorCounterOffer({
        proposalId: selectedProposal.id,
        senderId: user.userId,
        message: trimmedMessage,
        proposedAmount: counterForm.amount,
        estimatedDurationDays: counterForm.duration
      })
      
      toast.success('Gửi đề xuất thương lượng thành công!')
      setIsCounterModalOpen(false)
      loadProposals()
    } catch (err: any) {
      // Check for validation errors from backend
      if (err.response?.data?.data && typeof err.response.data.data === 'object') {
        const errors = err.response.data.data
        const firstError = Object.values(errors)[0] as string
        toast.error(firstError)
      } else {
        toast.error(err.response?.data?.message || 'Không thể gửi đề xuất')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleAccept = async (proposalId: string, negotiationId: string) => {
    if (!user?.userId) return
    
    if (!window.confirm('Bạn có chắc chắn muốn chấp nhận đề xuất thương lượng này?')) return

    try {
      setLoading(true)
      await negotiationApi.acceptNegotiation(negotiationId, user.userId)
      toast.success('Đã chấp nhận đề xuất thương lượng!')
      loadProposals()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể chấp nhận đề xuất')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (proposalId: string, negotiationId: string) => {
    if (!user?.userId) return
    
    if (!window.confirm('Bạn có chắc chắn muốn từ chối đề xuất thương lượng này?')) return

    try {
      setLoading(true)
      await negotiationApi.rejectNegotiation(negotiationId, user.userId)
      toast.success('Đã từ chối đề xuất thương lượng!')
      loadProposals()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể từ chối đề xuất')
    } finally {
      setLoading(false)
    }
  }

  const filteredProposals = proposals.filter(proposal => {
    const matchesStatus = statusFilter === 'ALL' || proposal.status === statusFilter
    const matchesSearch = searchQuery === '' || 
      proposal.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.coverLetter.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Sort proposals: NEGOTIATING with new counter-offer first, then by date
  const sortedProposals = [...filteredProposals].sort((a, b) => {
    // Priority 1: NEGOTIATING proposals with unread negotiations come first
    const aIsNegotiating = a.status === 'NEGOTIATING' && negotiations[a.id]
    const bIsNegotiating = b.status === 'NEGOTIATING' && negotiations[b.id]
    
    if (aIsNegotiating && !bIsNegotiating) return -1
    if (!aIsNegotiating && bIsNegotiating) return 1
    
    // Priority 2: Sort by updated date (newest first)
    const aDate = new Date(a.updatedAt || a.createdAt).getTime()
    const bDate = new Date(b.updatedAt || b.createdAt).getTime()
    return bDate - aDate
  })

  const stats = {
    total: proposals.length,
    submitted: proposals.filter(p => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').length,
    shortlisted: proposals.filter(p => p.status === 'SHORTLISTED').length,
    accepted: proposals.filter(p => p.status === 'ACCEPTED').length,
    rejected: proposals.filter(p => p.status === 'REJECTED').length,
    negotiating: proposals.filter(p => p.status === 'NEGOTIATING').length,
    newNegotiations: proposals.filter(p => p.status === 'NEGOTIATING' && negotiations[p.id]).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Đang tải proposals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">My Proposals</h1>
        <p className="text-slate-600">Quản lý và theo dõi tất cả proposals bạn đã gửi</p>
      </div>

      {/* New Negotiations Alert */}
      {stats.newNegotiations > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 shadow-lg">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-amber-900 mb-1">
                🔔 Bạn có {stats.newNegotiations} đề xuất thương lượng mới!
              </h3>
              <p className="text-sm text-amber-800">
                Client đã gửi counter-offer cho proposals của bạn. Hãy xem và phản hồi ngay.
              </p>
            </div>
            <button
              onClick={() => setStatusFilter('NEGOTIATING')}
              className="shrink-0 px-4 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-all text-sm shadow-lg"
            >
              Xem ngay
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-600">Tổng số</span>
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-blue-600">Đang chờ</span>
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-blue-600">{stats.submitted}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-purple-600">Được chọn</span>
            <CheckCircle className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-purple-600">{stats.shortlisted}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-emerald-600">Chấp nhận</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-600">{stats.accepted}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-rose-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-rose-600">Từ chối</span>
            <XCircle className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-3xl font-black text-rose-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên job hoặc nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProposalStatusFilter)}
              className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-bold bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DRAFT">Nháp</option>
              <option value="SUBMITTED">Đã gửi</option>
              <option value="UNDER_REVIEW">Đang xem xét</option>
              <option value="SHORTLISTED">Được chọn</option>
              <option value="ACCEPTED">Chấp nhận</option>
              <option value="REJECTED">Từ chối</option>
              <option value="WITHDRAWN">Đã thu hồi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-6 py-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Lỗi khi tải proposals</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Proposals List */}
      {sortedProposals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {searchQuery || statusFilter !== 'ALL' ? 'Không tìm thấy proposals' : 'Chưa có proposals'}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchQuery || statusFilter !== 'ALL' 
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Bắt đầu tìm kiếm jobs và gửi proposals để nhận được dự án'
            }
          </p>
          {!searchQuery && statusFilter === 'ALL' && (
            <Link
              to="/mentor/jobs"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Search className="w-5 h-5" />
              Tìm Jobs
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedProposals.map((proposal) => {
            const config = statusConfig[proposal.status as keyof typeof statusConfig] || statusConfig.SUBMITTED
            const StatusIcon = config.icon

            return (
              <div
                key={proposal.id}
                id={`proposal-${proposal.id}`}
                className={`rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-all duration-500 ${
                  proposal.status === 'NEGOTIATING' && negotiations[proposal.id]
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Left: Job Info */}
                  <div className="flex-1 min-w-0">
                    {/* New Negotiation Badge */}
                    {proposal.status === 'NEGOTIATING' && negotiations[proposal.id] && (
                      <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <span className="text-xs font-black text-amber-900">
                          {negotiations[proposal.id].senderType === 'CLIENT' 
                            ? 'Có đề xuất mới từ client' 
                            : 'Đang chờ client phản hồi'}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl ${config.color} border flex items-center justify-center flex-shrink-0`}>
                        <StatusIcon className={`w-5 h-5 ${config.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/jobs/${proposal.jobId}`}
                          className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 flex items-center gap-2"
                        >
                          {proposal.jobTitle}
                          <ExternalLink className="w-4 h-4 flex-shrink-0" />
                        </Link>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${config.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {config.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            Gửi lúc: {new Date(proposal.submittedAt || proposal.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cover Letter Preview */}
                    <div className="bg-slate-50 rounded-xl p-4 mb-3">
                      <p className="text-sm text-slate-700 line-clamp-2">
                        {proposal.coverLetter}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-6 flex-wrap text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-900">{proposal.proposedAmount} MXC</span>
                      </div>
                      {proposal.estimatedDurationDays && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{proposal.estimatedDurationDays} ngày</span>
                        </div>
                      )}
                      {proposal.viewCount !== undefined && proposal.viewCount > 0 && (
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">Đã xem {proposal.viewCount} lần</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex lg:flex-col gap-2">
                    <Link
                      to={`/jobs/${proposal.jobId}`}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm shadow-lg shadow-indigo-200"
                    >
                      <Eye className="w-4 h-4" />
                      Xem chi tiết
                    </Link>
                  </div>
                </div>

                {/* Rejection Reason (if rejected) */}
                {proposal.status === 'REJECTED' && proposal.rejectionReason && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-rose-600 mb-1">Lý do từ chối:</p>
                        <p className="text-slate-600">{proposal.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Negotiation Info (if negotiating) */}
                {proposal.status === 'NEGOTIATING' && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    {negotiations[proposal.id] ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <MessageCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-black text-amber-900">
                                {negotiations[proposal.id].senderType === 'CLIENT' 
                                  ? '💬 Client đề xuất thương lượng' 
                                  : '💬 Bạn đã gửi phản hồi'}
                              </p>
                              <span className="text-xs text-amber-600">
                                {new Date(negotiations[proposal.id].createdAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            
                            <p className="text-sm text-slate-700 mb-3 bg-white rounded-lg p-3 border border-amber-100 italic">
                              "{negotiations[proposal.id].message}"
                            </p>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                              {negotiations[proposal.id].proposedAmount && (
                                <div className="bg-white rounded-lg p-3 border border-amber-100">
                                  <p className="text-xs font-bold text-amber-600 mb-1">Giá đề xuất</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400 line-through text-sm">{proposal.proposedAmount} MXC</span>
                                    <ArrowRight className="w-3 h-3 text-amber-500" />
                                    <span className="text-lg font-black text-amber-700">{negotiations[proposal.id].proposedAmount} MXC</span>
                                  </div>
                                </div>
                              )}
                              
                              {negotiations[proposal.id].estimatedDurationDays && (
                                <div className="bg-white rounded-lg p-3 border border-amber-100">
                                  <p className="text-xs font-bold text-amber-600 mb-1">Thời gian đề xuất</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400 line-through text-sm">{proposal.estimatedDurationDays} ngày</span>
                                    <ArrowRight className="w-3 h-3 text-amber-500" />
                                    <span className="text-lg font-black text-amber-700">{negotiations[proposal.id].estimatedDurationDays} ngày</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {negotiations[proposal.id].senderType === 'CLIENT' ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAccept(proposal.id, negotiations[proposal.id].id)}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all text-sm shadow-sm"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Chấp nhận
                                </button>
                                <button
                                  onClick={() => openCounterModal(proposal, negotiations[proposal.id])}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-all text-sm shadow-sm"
                                >
                                  <TrendingUp className="w-4 h-4" />
                                  Đề xuất lại
                                </button>
                                <button
                                  onClick={() => handleReject(proposal.id, negotiations[proposal.id].id)}
                                  className="px-4 py-2.5 border border-slate-200 bg-white rounded-lg font-bold hover:bg-slate-50 transition-all text-sm text-slate-700"
                                >
                                  <XCircle className="w-4 h-4 inline mr-1" />
                                  Từ chối
                                </button>
                              </div>
                            ) : (
                              <div className="bg-amber-100/50 rounded-xl p-3 border border-dashed border-amber-300 text-center">
                                <p className="text-xs font-bold text-amber-800 flex items-center justify-center gap-2">
                                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                                  Đang chờ Client xem xét đề xuất của bạn...
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <MessageCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-black text-amber-900 mb-1">💬 Đang thương lượng</p>
                            <p className="text-sm text-amber-700">
                              Client đang thương lượng về giá và thời gian. Vào trang job để xem chi tiết.
                            </p>
                            <Link
                              to={`/jobs/${proposal.jobId}`}
                              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-all text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Xem chi tiết
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Results Count */}
      {sortedProposals.length > 0 && (
        <div className="text-center text-sm text-slate-500">
          Hiển thị {sortedProposals.length} / {proposals.length} proposals
        </div>
      )}
      {/* Counter Offer Modal */}
      {isCounterModalOpen && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-900">Đề xuất thương lượng mới</h3>
                <button 
                  onClick={() => setIsCounterModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Lời nhắn đến Client
                  </label>
                  <textarea
                    value={counterForm.message}
                    onChange={(e) => setCounterForm({ ...counterForm, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none min-h-[120px] text-sm"
                    placeholder="Giải thích lý do bạn đề xuất mức giá/thời gian này..."
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs font-bold ${counterForm.message.trim().length < 10 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {counterForm.message.trim().length} / 10 ký tự tối thiểu
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Mức giá đề xuất (MXC)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        value={counterForm.amount}
                        onChange={(e) => setCounterForm({ ...counterForm, amount: Number(e.target.value) })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Thời gian hoàn thành (ngày)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        value={counterForm.duration}
                        onChange={(e) => setCounterForm({ ...counterForm, duration: Number(e.target.value) })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    <AlertCircle className="w-4 h-4 inline mr-1 mb-0.5" />
                    Lưu ý: Sau khi bạn gửi đề xuất, Client sẽ nhận được thông báo và có thể chấp nhận, từ chối hoặc tiếp tục thương lượng với bạn.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsCounterModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleCounterOffer}
                  disabled={submitting}
                  className="flex-[2] px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5" />
                      Gửi đề xuất
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
