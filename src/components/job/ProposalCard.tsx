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
    <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-lg font-bold text-slate-950 dark:text-slate-100">{proposal.mentorName}</h4>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            Gửi {formatRelativeTime(proposal.submittedAt || proposal.createdAt)}
          </p>
        </div>
        <span className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
          {proposal.status}
        </span>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{proposal.coverLetter}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3">
          <p className="text-[10px] font-bold uppercase text-slate-400">Giá đề xuất</p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
            {proposal.proposedAmount ? formatCurrency(proposal.proposedAmount) : 'Chưa xác định'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3">
          <p className="text-[10px] font-bold uppercase text-slate-400">Thời gian</p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
            {proposal.estimatedDurationDays ? `${proposal.estimatedDurationDays} ngày` : 'Chưa xác định'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          to={`/jobs/${proposal.jobId}?proposalId=${proposal.id}`}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50"
        >
          Xem chi tiết
        </Link>
      </div>
    </article>
  )
}
