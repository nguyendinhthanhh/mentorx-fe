import { useQuery } from 'react-query'
import { jobApi } from '@/api/jobApi'
import { Link } from 'react-router-dom'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'
import { Plus, Briefcase } from 'lucide-react'

export default function JobListPage() {
  const { data, isLoading } = useQuery('jobs', () =>
    jobApi.getOpenJobs({ page: 0, size: 20 })
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Browse Jobs</h1>
        <Link to="/jobs/create" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Post a Job
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading jobs...</div>
      ) : (
        <div className="space-y-4">
          {data?.content.map((job) => (
            <Link
              key={job.jobId}
              to={`/jobs/${job.jobId}`}
              className="card hover:shadow-lg transition-shadow block"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Briefcase className="w-5 h-5 text-primary-600" />
                    <h3 className="font-bold text-lg">{job.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="text-gray-600">
                      Type: <span className="font-semibold">{job.jobType.replace('_', ' ')}</span>
                    </span>
                    <span className="text-gray-600">
                      Budget:{' '}
                      <span className="font-semibold">
                        {job.budgetMinMxc && job.budgetMaxMxc
                          ? `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
                          : job.hourlyRateMxc
                          ? `${formatCurrency(job.hourlyRateMxc)}/hr`
                          : 'N/A'}
                      </span>
                    </span>
                    <span className="text-gray-600">
                      Posted: <span className="font-semibold">{formatRelativeTime(job.createdAt)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data?.content.length === 0 && (
        <div className="text-center py-12 text-gray-600">No jobs found.</div>
      )}
    </div>
  )
}
