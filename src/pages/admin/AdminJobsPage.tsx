import { useQuery, useMutation, useQueryClient } from 'react-query'
import { jobApi } from '@/api/jobApi'
import { JobStatus, JobType } from '@/types'
import { 
  Search, 
  Briefcase, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  XCircle,
  Star,
  Eye,
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

  const getErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || error?.message || fallback

  const updateStatusMutation = useMutation(
    ({ jobId, status, reason }: { jobId: string; status: JobStatus; reason?: string }) => 
      jobApi.updateStatus(jobId, status, reason),
    {
      onSuccess: () => {
        toast.success('Job status updated')
        queryClient.invalidateQueries('admin-jobs')
        setIsArchiveModalOpen(false)
      },
      onError: (error: any) => {
        toast.error(getErrorMessage(error, 'Unable to update job status'))
      },
    }
  )

  const deleteMutation = useMutation(
    (jobId: string) => jobApi.delete(jobId),
    {
      onSuccess: () => {
        toast.success('Job deleted successfully')
        queryClient.invalidateQueries('admin-jobs')
      },
      onError: (error: any) => {
        toast.error(getErrorMessage(error, 'Unable to delete job'))
      },
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
      },
      onError: (error: any) => {
        toast.error(getErrorMessage(error, 'Unable to update featured status'))
      },
    }
  )

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.OPEN: return 'bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400'
      case JobStatus.IN_PROGRESS: return 'bg-blue-50 border border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800/30 dark:text-blue-400'
      case JobStatus.COMPLETED: return 'bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800/30 dark:text-indigo-400'
      case JobStatus.CANCELLED: return 'bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800/30 dark:text-rose-400'
      case JobStatus.CLOSED: return 'bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
      default: return 'bg-slate-50 border border-slate-200 text-slate-600'
    }
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
          Job Moderation
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
          Monitor and manage platform-wide job postings.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
        <div className="flex flex-col gap-5 md:flex-row">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search jobs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-medium shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
            />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as JobStatus)}
              className="w-full rounded-2xl border border-slate-200/60 bg-white/50 px-6 py-3.5 text-sm font-bold text-slate-600 outline-none transition-all focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:focus:bg-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 sm:w-auto appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              {Object.values(JobStatus).map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as JobType)}
              className="w-full rounded-2xl border border-slate-200/60 bg-white/50 px-6 py-3.5 text-sm font-bold text-slate-600 outline-none transition-all focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:focus:bg-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 sm:w-auto appearance-none cursor-pointer"
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
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/50">
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Job Title & Client</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Budget</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Posted Date</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6">
                      <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl w-full" />
                    </td>
                  </tr>
                ))
              ) : (
                data?.content.map((job) => (
                  <tr key={job.jobId} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <Briefcase className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[250px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{job.title}</span>
                          <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mt-0.5">By {job.client?.fullName || 'Unknown'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {job.budgetMinMxc ? `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc!)}` : `${formatCurrency(job.hourlyRateMxc!)}/hr`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{job.jobType.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(job.status)} shadow-sm`}>
                        {job.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {formatDateTime(job.createdAt)}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 transition-all duration-300 lg:translate-x-4 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100">
                        <Link to={`/jobs/${job.jobId}`} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Link>
                        
                        <button 
                          onClick={() => toggleFeaturedMutation.mutate({ jobId: job.jobId, isFeatured: !job.isFeatured })}
                          className={`p-2 rounded-xl border transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                            job.isFeatured 
                              ? 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800/50 dark:hover:bg-amber-900/40' 
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                          }`}
                          title={job.isFeatured ? "Unfeature" : "Feature Job"}
                        >
                          <Star className={`w-4 h-4 ${job.isFeatured ? 'fill-current' : ''}`} />
                        </button>

                        {job.status === JobStatus.OPEN ? (
                          <button 
                            onClick={() => handleArchive(job.jobId)}
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                            title="Archive/Hide Job"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => updateStatusMutation.mutate({ jobId: job.jobId, status: JobStatus.OPEN })}
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
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
        <div className="flex flex-col gap-4 border-t border-slate-100/50 bg-slate-50/30 px-6 py-5 dark:border-slate-800/50 dark:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Total {data?.totalElements} jobs listed
          </p>
          <div className="flex gap-2">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              disabled={data?.last}
              onClick={() => setPage(p => p + 1)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
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
