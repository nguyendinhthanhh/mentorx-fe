import { useQuery } from 'react-query'
import { proposalApi } from '@/api/proposalApi'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'
import { User, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import { useState } from 'react'

interface Props {
  jobId: string
}

export default function ProposalList({ jobId }: Props) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery(['proposals', jobId], () =>
    proposalApi.getByJob(jobId)
  )

  const handleAccept = async (proposalId: string) => {
    try {
      setActionLoading(proposalId)
      await proposalApi.accept(proposalId)
      refetch()
    } catch (err) {
      console.error('Failed to accept proposal', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (proposalId: string) => {
    try {
      setActionLoading(proposalId)
      await proposalApi.reject(proposalId, 'Not selected for this project')
      refetch()
    } catch (err) {
      console.error('Failed to reject proposal', err)
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return <div className="space-y-4">
      {[1, 2].map(i => <div key={i} className="h-32 bg-gray-50 rounded-2xl animate-pulse" />)}
    </div>
  }

  if (!data?.content.length) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <p className="text-gray-500">No proposals received yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.content.map((proposal) => (
        <div key={proposal.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{proposal.mentorName}</h4>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Submitted {formatRelativeTime(proposal.submittedAt)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary-600">
                {proposal.proposedAmount ? formatCurrency(proposal.proposedAmount) : 
                 proposal.proposedHourlyRate ? `${formatCurrency(proposal.proposedHourlyRate)}/hr` : 'N/A'}
              </p>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                proposal.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                proposal.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {proposal.status}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 line-clamp-3 mb-4">{proposal.coverLetter}</p>

          <div className="flex gap-2">
            {proposal.status === 'SUBMITTED' && (
              <>
                <button
                  onClick={() => handleAccept(proposal.id)}
                  disabled={!!actionLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Accept
                </button>
                <button
                  onClick={() => handleReject(proposal.id)}
                  disabled={!!actionLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            <button className="flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
