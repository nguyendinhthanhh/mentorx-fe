import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { jobApi } from '@/api/jobApi'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { Briefcase, Calendar, DollarSign } from 'lucide-react'

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>()
  
  const { data: job, isLoading } = useQuery(
    ['job', jobId],
    () => jobApi.getById(jobId!),
    { enabled: !!jobId }
  )

  if (isLoading) {
    return <div className="text-center py-12">Loading job details...</div>
  }

  if (!job) {
    return <div className="text-center py-12">Job not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
            <p className="text-gray-600">Posted by {job.client.fullName}</p>
          </div>
          <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
            {job.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Job Type</p>
              <p className="font-semibold">{job.jobType.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Budget</p>
              <p className="font-semibold">
                {job.budgetMinMxc && job.budgetMaxMxc
                  ? `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
                  : job.hourlyRateMxc
                  ? `${formatCurrency(job.hourlyRateMxc)}/hr`
                  : 'N/A'}
              </p>
            </div>
          </div>

          {job.deadlineAt && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Deadline</p>
                <p className="font-semibold">{formatDateTime(job.deadlineAt)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-bold mb-3">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
        </div>

        <div className="mt-6 flex gap-4">
          <button className="btn btn-primary flex-1">Apply for this Job</button>
          <button className="btn btn-outline">Save</button>
        </div>
      </div>
    </div>
  )
}
