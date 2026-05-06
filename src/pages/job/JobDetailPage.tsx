import { Briefcase, Calendar, DollarSign, ArrowLeft, Clock, User, Bookmark, MessageSquare, Send } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'
import ProposalCreateForm from '@/components/job/ProposalCreateForm'
import ProposalList from '@/components/job/ProposalList'

export default function JobDetailPage() {
  const { user } = useAuthStore()
  const { jobId } = useParams<{ jobId: string }>()
  const [showApplyModal, setShowApplyModal] = useState(false)
  
  const { data: job, isLoading } = useQuery(
    ['job', jobId],
    () => jobApi.getById(jobId!),
    { enabled: !!jobId }
  )

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse">
          <div className="h-8 bg-gray-100 rounded-lg w-2/3 mb-4" />
          <div className="h-4 bg-gray-100 rounded-lg w-1/4 mb-8" />
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-xl" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="h-4 bg-gray-100 rounded w-4/6" />
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-gray-300" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Job not found</h2>
        <p className="text-gray-500 mb-4">This job may have been removed or doesn't exist.</p>
        <Link to="/jobs" className="text-primary-600 font-medium hover:text-primary-700">
          ← Back to jobs
        </Link>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    OPEN: 'bg-green-50 text-green-700 border-green-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
    COMPLETED: 'bg-gray-50 text-gray-700 border-gray-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    CLOSED: 'bg-gray-50 text-gray-500 border-gray-200',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to jobs
      </Link>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Posted by {job.client?.fullName || 'Unknown'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatRelativeTime(job.createdAt)}
              </span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[job.status] || 'bg-gray-50 text-gray-600'}`}>
            {job.status}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Briefcase className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Job Type</span>
            </div>
            <p className="font-semibold text-gray-900">{job.jobType.replace(/_/g, ' ')}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Budget</span>
            </div>
            <p className="font-semibold text-gray-900">
              {job.budgetMinMxc && job.budgetMaxMxc
                ? `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
                : job.hourlyRateMxc
                ? `${formatCurrency(job.hourlyRateMxc)}/hr`
                : 'To be discussed'}
            </p>
          </div>

          {job.deadlineAt && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Deadline</span>
              </div>
              <p className="font-semibold text-gray-900">{formatDateTime(job.deadlineAt)}</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="border-t border-gray-100 pt-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h2>
          <div className="text-gray-600 whitespace-pre-wrap leading-relaxed">{job.description}</div>
        </div>

        {/* Actions or Proposals */}
        <div className="border-t border-gray-100 pt-8 mt-8">
          {job.clientId === user?.userId ? (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Send className="w-5 h-5 text-primary-500" />
                Received Proposals
              </h2>
              <ProposalList jobId={job.jobId} />
            </div>
          ) : (
            <div className="flex gap-3">
              <button 
                onClick={() => setShowApplyModal(true)}
                className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors text-sm shadow-sm shadow-primary-200"
              >
                Apply for this Job
              </button>
              <button className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
                <Bookmark className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-8 relative">
            <button 
              onClick={() => setShowApplyModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="w-5 h-5 rotate-90" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Proposal</h2>
            <p className="text-gray-500 mb-6">Send your best offer to {job.client?.fullName}</p>
            
            <ProposalCreateForm 
              jobId={job.jobId} 
              mentorId={user!.userId} 
              jobType={job.jobType}
              onSuccess={() => {
                setTimeout(() => setShowApplyModal(false), 2000)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
