import { useQuery, useMutation, useQueryClient } from 'react-query'
import { jobApi } from '@/api/jobApi'
import { JobStatus, JobType, JobResponse } from '@/types'
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Briefcase, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  XCircle,
  Star,
  Eye,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react'
import { useState } from 'react'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import ArchiveReasonModal from '@/components/admin/ArchiveReasonModal'

export default function AdminJobsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<JobType | ''>('')

  // Archive Modal State
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  const { data, isLoading } = useQuery(
    ['admin-jobs', page, search, statusFilter, typeFilter],
    () => jobApi.getAllJobs({ 
      page, 
      size: 10, 
      status: statusFilter || undefined,
      jobType: typeFilter || undefined
    })
  )

  const updateStatusMutation = useMutation(
    ({ jobId, status, reason }: { jobId: string; status: JobStatus; reason?: string }) => 
      jobApi.updateStatus(jobId, status, reason),
    {
      onSuccess: () => {
        toast.success('Job status updated')
        queryClient.invalidateQueries('admin-jobs')
        setIsArchiveModalOpen(false)
      }
    }
  )

  const deleteMutation = useMutation(
    (jobId: string) => jobApi.delete(jobId),
    {
      onSuccess: () => {
        toast.success('Job deleted successfully')
        queryClient.invalidateQueries('admin-jobs')
      }
    }
  )

  const handleArchive = (jobId: string) => {
    setSelectedJobId(jobId)
    setIsArchiveModalOpen(true)
  }

  const toggleFeaturedMutation = useMutation(
    ({ jobId, isFeatured }: { jobId: string; isFeatured: boolean }) => 
      jobApi.update(jobId, { isFeatured }),
    {
      onSuccess: () => {
        toast.success('Featured status updated')
        queryClient.invalidateQueries('admin-jobs')
      }
    }
  )

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.OPEN: return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
      case JobStatus.IN_PROGRESS: return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
      case JobStatus.COMPLETED: return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
      case JobStatus.CANCELLED: return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
      case JobStatus.CLOSED: return 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      default: return 'bg-gray-50 text-gray-600'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Job Moderation</h1>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Monitor and manage platform-wide job postings</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search jobs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-medium text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as JobStatus)}
              className="w-full rounded-2xl bg-gray-50 px-6 py-3.5 text-sm font-bold text-gray-600 transition-all focus:border-primary-500/30 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:bg-gray-800 dark:text-gray-400 dark:focus:bg-gray-900 sm:w-auto"
            >
              <option value="">All Statuses</option>
              {Object.values(JobStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as JobType)}
              className="w-full rounded-2xl bg-gray-50 px-6 py-3.5 text-sm font-bold text-gray-600 transition-all focus:border-primary-500/30 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:bg-gray-800 dark:text-gray-400 dark:focus:bg-gray-900 sm:w-auto"
            >
              <option value="">All Types</option>
              {Object.values(JobType).map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] border-b border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/20">
                <th className="px-8 py-5 text-left">Job Title & Client</th>
                <th className="px-8 py-5 text-left">Budget</th>
                <th className="px-8 py-5 text-left">Status</th>
                <th className="px-8 py-5 text-left">Posted Date</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6">
                      <div className="h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl w-full" />
                    </td>
                  </tr>
                ))
              ) : (
                data?.content.map((job) => (
                  <tr key={job.jobId} className="group hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 shadow-sm">
                          <Briefcase className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight truncate max-w-[250px]">{job.title}</span>
                          <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.1em] mt-0.5">By {job.client?.fullName || 'Unknown'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
                          {job.budgetMinMxc ? `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc!)}` : `${formatCurrency(job.hourlyRateMxc!)}/hr`}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">{job.jobType.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(job.status)}`}>
                        {job.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 tracking-tight">
                        <Clock className="w-4 h-4 text-gray-300" />
                        {formatDateTime(job.createdAt)}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 transition-all duration-300 md:translate-x-4 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100">
                        <Link to={`/jobs/${job.jobId}`} className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-600 transition-all shadow-sm" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Link>
                        
                        <button 
                          onClick={() => toggleFeaturedMutation.mutate({ jobId: job.jobId, isFeatured: !job.isFeatured })}
                          className={`p-2.5 rounded-xl border transition-all shadow-sm ${
                            job.isFeatured 
                              ? 'bg-amber-50 border-amber-200 text-amber-500' 
                              : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:text-amber-500'
                          }`}
                          title={job.isFeatured ? "Unfeature" : "Feature Job"}
                        >
                          <Star className={`w-4 h-4 ${job.isFeatured ? 'fill-current' : ''}`} />
                        </button>

                        {job.status === JobStatus.OPEN ? (
                          <button 
                            onClick={() => handleArchive(job.jobId)}
                            className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-rose-600 transition-all shadow-sm"
                            title="Archive/Hide Job"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => updateStatusMutation.mutate({ jobId: job.jobId, status: JobStatus.OPEN })}
                            className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-emerald-600 transition-all shadow-sm"
                            title="Approve/Re-open Job"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-4 border-t border-gray-50 bg-gray-50/30 px-6 py-6 dark:border-gray-800 dark:bg-gray-800/30 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Total {data?.totalElements} jobs listed
          </p>
          <div className="flex gap-3">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-600 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              disabled={data?.last}
              onClick={() => setPage(p => p + 1)}
              className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-600 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <ArchiveReasonModal 
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        isLoading={updateStatusMutation.isLoading}
        onConfirm={(reason) => {
          if (selectedJobId) {
            updateStatusMutation.mutate({ 
              jobId: selectedJobId, 
              status: JobStatus.CLOSED, 
              reason 
            })
          }
        }}
      />
    </div>
  )
}
