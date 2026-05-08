import { useQuery } from 'react-query'
import { jobApi } from '@/api/jobApi'
import { Link } from 'react-router-dom'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'
import { Plus, Briefcase, Search, MapPin, Clock, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { JobType } from '@/types'

export default function JobListPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('ALL')

  const { data, isLoading } = useQuery('jobs', () =>
    jobApi.getOpenJobs({ page: 0, size: 20 })
  )

  const filteredJobs = data?.content.filter((job) => {
    const matchesSearch = !search || 
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'ALL' || job.jobType === filter
    return matchesSearch && matchesFilter
  })

  const jobTypeColors: Record<string, string> = {
    LONG_TERM_MENTORING: 'bg-blue-50 text-blue-700 border-blue-200',
    FREELANCE_PROJECT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    QUICK_FIX: 'bg-amber-50 text-amber-700 border-amber-200',
  }

  const jobTypeFilters = ['ALL', ...Object.values(JobType)]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Jobs</h1>
          <p className="text-gray-500 mt-1">Find opportunities that match your expertise</p>
        </div>
        <Link
          to="/jobs/create"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors text-sm shadow-sm shadow-primary-200"
        >
          <Plus className="w-4 h-4" />
          Post a Job
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs by title or description..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
          />
        </div>
        <div className="flex gap-2">
          {jobTypeFilters.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filter === type
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {type === 'ALL' ? 'All' : type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Job List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="h-5 bg-gray-100 rounded-lg w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded-lg w-2/3 mb-4" />
              <div className="flex gap-4">
                <div className="h-3 bg-gray-100 rounded w-20" />
                <div className="h-3 bg-gray-100 rounded w-24" />
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredJobs && filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Link
              key={job.jobId}
              to={`/jobs/${job.jobId}`}
              className="group bg-white rounded-2xl border border-gray-100 p-6 block hover:shadow-lg hover:shadow-gray-100/50 hover:border-gray-200 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                      {job.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${jobTypeColors[job.jobType] || 'bg-gray-50 text-gray-600'}`}>
                      {job.jobType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{job.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Briefcase className="w-3.5 h-3.5" />
                      {job.budgetMinMxc && job.budgetMaxMxc
                        ? `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
                        : job.hourlyRateMxc
                        ? `${formatCurrency(job.hourlyRateMxc)}/hr`
                        : 'Budget TBD'}
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {formatRelativeTime(job.createdAt)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      job.status === 'OPEN' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors mt-1 flex-shrink-0 ml-4" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No jobs found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {search ? 'Try adjusting your search or filters' : 'Be the first to post a job!'}
          </p>
          <Link
            to="/jobs/create"
            className="inline-flex items-center gap-2 text-sm text-primary-600 font-medium hover:text-primary-700"
          >
            <Plus className="w-4 h-4" />
            Post a Job
          </Link>
        </div>
      )}
    </div>
  )
}
