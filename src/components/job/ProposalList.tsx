import { useState } from 'react'
import { useQuery } from 'react-query'
import { proposalApi } from '@/api/proposalApi'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'
import { ProposalResponse } from '@/types'
import { CalendarDays, CheckCircle, Clock, MessageSquare, Timer, User, XCircle } from 'lucide-react'

interface Props {
  jobId: string
}

export default function ProposalList({ jobId }: Props) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery(['proposals', jobId], () =>
    proposalApi.getByJob(jobId, { page: 0, size: 20 })
  )

  const handleAccept = async (proposalId: string) => {
    try {
      setActionLoading(proposalId)
      await proposalApi.accept(proposalId)
      refetch()
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (proposalId: string) => {
    try {
      setActionLoading(proposalId)
      await proposalApi.reject(proposalId, 'Not selected for this project')
      refetch()
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl bg-slate-50 dark:bg-slate-900" />
        ))}
      </div>
    )
  }

  if (!data?.content.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
        <User className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
        <h3 className="mt-3 text-lg font-black text-slate-950 dark:text-white">No mentor applications yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
          When mentors apply to this job, their proposal, price, timeline, and action buttons will appear here.
        </p>
      </div>
    )
  }

  const acceptedProposal = data.content.find((proposal) => proposal.status === 'ACCEPTED')

  return (
    <div className="space-y-3">
      {acceptedProposal && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          {acceptedProposal.mentorName} has been selected for this job.
        </div>
      )}

      {data.content.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          actionLoading={actionLoading}
          hasAcceptedProposal={Boolean(acceptedProposal)}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      ))}
    </div>
  )
}

function ProposalCard({
  proposal,
  actionLoading,
  hasAcceptedProposal,
  onAccept,
  onReject,
}: {
  proposal: ProposalResponse
  actionLoading: string | null
  hasAcceptedProposal: boolean
  onAccept: (proposalId: string) => void
  onReject: (proposalId: string) => void
}) {
  const isPending = proposal.status === 'SUBMITTED'
  const isAccepted = proposal.status === 'ACCEPTED'
  const price = proposal.proposedAmount
    ? formatCurrency(proposal.proposedAmount)
    : proposal.proposedHourlyRate
      ? `${formatCurrency(proposal.proposedHourlyRate)}/hr`
      : 'Not specified'

  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-slate-950 ${
        isAccepted
          ? 'border-emerald-200 ring-2 ring-emerald-100 dark:border-emerald-900 dark:ring-emerald-900/40'
          : 'border-slate-200 hover:border-indigo-200 hover:shadow-md dark:border-slate-800'
      }`}
    >
      <div className="flex flex-col gap-4 min-[760px]:flex-row min-[760px]:items-start min-[760px]:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
              {getInitials(proposal.mentorName)}
            </div>
            <div className="min-w-0">
              <h4 className="truncate text-lg font-black text-slate-950 dark:text-white">{proposal.mentorName}</h4>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                Applied {formatRelativeTime(proposal.submittedAt || proposal.createdAt)}
              </p>
            </div>
          </div>

          <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{proposal.coverLetter}</p>

          {proposal.relevantExperience && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <p className="text-xs font-black uppercase text-slate-400">Relevant experience</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{proposal.relevantExperience}</p>
            </div>
          )}
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 min-[760px]:w-60 min-[760px]:grid-cols-1">
          <ProposalFact label="Offer" value={price} icon={CheckCircle} />
          <ProposalFact
            label="Duration"
            value={proposal.estimatedDurationDays ? `${proposal.estimatedDurationDays} day(s)` : 'Not specified'}
            icon={Timer}
          />
          {proposal.proposedDeliveryDate && (
            <ProposalFact label="Delivery" value={new Date(proposal.proposedDeliveryDate).toLocaleDateString('en-US')} icon={CalendarDays} />
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between dark:border-slate-800">
        <StatusBadge status={proposal.status} />

        <div className="flex flex-wrap gap-2">
          {isPending && (
            <>
              <button
                type="button"
                onClick={() => onAccept(proposal.id)}
                disabled={Boolean(actionLoading) || hasAcceptedProposal}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <CheckCircle className="h-4 w-4" />
                Choose mentor
              </button>
              <button
                type="button"
                onClick={() => onReject(proposal.id)}
                disabled={Boolean(actionLoading)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </>
          )}
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </button>
        </div>
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
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 break-words text-sm font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === 'ACCEPTED'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
      : status === 'REJECTED'
        ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300'
        : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300'

  return <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${className}`}>{status}</span>
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'M'
}
