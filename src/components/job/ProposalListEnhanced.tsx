import { useState } from 'react'
import { useQuery } from 'react-query'
import { proposalApi } from '@/api/proposalApi'
import { formatCurrency, formatDeadline, formatRelativeTime } from '@/utils/formatters'
import { ProposalResponse } from '@/types'
import { 
  CalendarDays, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  Timer, 
  User, 
  XCircle,
  MessageCircle,
  DollarSign,
  AlertCircle,
  Eye,
  TrendingUp,
  Filter
} from 'lucide-react'
import ProposalCard from './ProposalCard'

interface Props {
  jobId: string
}

type StatusFilter = 'ALL' | 'SUBMITTED' | 'NEGOTIATING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED'

export default function ProposalListEnhanced({ jobId }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const { data, isLoading, refetch } = useQuery(['proposals', jobId], () =>
    proposalApi.getByJob(jobId, { page: 0, size: 50 })
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
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
        <h3 className="mt-3 text-lg font-bold text-slate-950">Chưa có proposals</h3>
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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard 
          label="Tổng số" 
          value={stats.total} 
          icon={User}
          color="slate"
          active={statusFilter === 'ALL'}
          onClick={() => setStatusFilter('ALL')}
        />
        <StatCard 
          label="Mới gửi" 
          value={stats.submitted} 
          icon={Clock}
          color="blue"
          active={statusFilter === 'SUBMITTED'}
          onClick={() => setStatusFilter('SUBMITTED')}
        />
        <StatCard 
          label="Đang deal" 
          value={stats.negotiating} 
          icon={MessageCircle}
          color="amber"
          active={statusFilter === 'NEGOTIATING'}
          onClick={() => setStatusFilter('NEGOTIATING')}
        />
        <StatCard 
          label="Được chọn" 
          value={stats.shortlisted} 
          icon={TrendingUp}
          color="purple"
          active={statusFilter === 'SHORTLISTED'}
          onClick={() => setStatusFilter('SHORTLISTED')}
        />
        <StatCard 
          label="Chấp nhận" 
          value={stats.accepted} 
          icon={CheckCircle}
          color="emerald"
          active={statusFilter === 'ACCEPTED'}
          onClick={() => setStatusFilter('ACCEPTED')}
        />
        <StatCard 
          label="Từ chối" 
          value={stats.rejected} 
          icon={XCircle}
          color="rose"
          active={statusFilter === 'REJECTED'}
          onClick={() => setStatusFilter('REJECTED')}
        />
      </div>

      {/* Accepted Banner */}
      {acceptedProposal && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-900">
              Đã chọn mentor: <span className="font-bold">{acceptedProposal.mentorName}</span>
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              Giá thỏa thuận: {formatCurrency(acceptedProposal.proposedAmount)} • 
              Deadline: {acceptedProposal.deadlineAt ? formatDeadline(acceptedProposal.deadlineAt) : 'Chưa xác định'}
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
              proposal={proposal}
              hasAcceptedProposal={hasAcceptedProposal}
              onRefetch={refetch}
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

interface StatCardProps {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: 'slate' | 'blue' | 'amber' | 'purple' | 'emerald' | 'rose'
  active: boolean
  onClick: () => void
}

function StatCard({ label, value, icon: Icon, color, active, onClick }: StatCardProps) {
  const colorClasses = {
    slate: active 
      ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-200' 
      : 'bg-white border-slate-200 hover:border-slate-300',
    blue: active 
      ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-200' 
      : 'bg-white border-blue-200 hover:border-blue-300',
    amber: active 
      ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-200' 
      : 'bg-white border-amber-200 hover:border-amber-300',
    purple: active 
      ? 'bg-purple-100 border-purple-300 ring-2 ring-purple-200' 
      : 'bg-white border-purple-200 hover:border-purple-300',
    emerald: active 
      ? 'bg-emerald-100 border-emerald-300 ring-2 ring-emerald-200' 
      : 'bg-white border-emerald-200 hover:border-emerald-300',
    rose: active 
      ? 'bg-rose-100 border-rose-300 ring-2 ring-rose-200' 
      : 'bg-white border-rose-200 hover:border-rose-300',
  }

  const iconColorClasses = {
    slate: 'text-slate-500',
    blue: 'text-blue-500',
    amber: 'text-amber-500',
    purple: 'text-purple-500',
    emerald: 'text-emerald-500',
    rose: 'text-rose-500',
  }

  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 transition-all cursor-pointer ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-600">{label}</span>
        <Icon className={`w-4 h-4 ${iconColorClasses[color]}`} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </button>
  )
}
