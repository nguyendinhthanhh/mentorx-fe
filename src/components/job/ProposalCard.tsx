import { Link } from 'react-router-dom'
import { ProposalResponse } from '@/types'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'

interface ProposalCardProps {
  proposal: ProposalResponse
  hasAcceptedProposal?: boolean
  onRefetch?: () => void
}

export default function ProposalCard({ proposal }: ProposalCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-lg font-bold text-slate-950">{proposal.mentorName}</h4>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Gửi {formatRelativeTime(proposal.submittedAt || proposal.createdAt)}
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
          {proposal.status}
        </span>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{proposal.coverLetter}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase text-slate-400">Giá đề xuất</p>
          <p className="mt-1 text-sm font-bold text-slate-900">
            {proposal.proposedAmount ? formatCurrency(proposal.proposedAmount) : 'Chưa xác định'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase text-slate-400">Thời gian</p>
          <p className="mt-1 text-sm font-bold text-slate-900">
            {proposal.estimatedDurationDays ? `${proposal.estimatedDurationDays} ngày` : 'Chưa xác định'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          to={`/jobs/${proposal.jobId}?proposalId=${proposal.id}`}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Xem chi tiết
        </Link>
      </div>
    </article>
  )
}
