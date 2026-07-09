import { useQuery, useMutation, useQueryClient } from 'react-query'
import { reportApi } from '@/api/reportApi'
import { ReportStatus, ReportTargetType } from '@/types'
import { 
  Search, 
  MoreVertical, 
  Flag, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  XCircle,
  Eye,
  User,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react'
import { useState } from 'react'
import { formatDateTime } from '@/utils/formatters'
import { useAuthStore } from '@/store/authStore'

export default function AdminReportsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>(ReportStatus.PENDING)

  const { data, isLoading } = useQuery(
    ['admin-reports', page, statusFilter],
    () => reportApi.getReports({ 
      page, 
      size: 10, 
      status: statusFilter || undefined
    })
  )

  const resolveMutation = useMutation(
    ({ reportId, isUpheld }: { reportId: string; isUpheld: boolean }) => 
      reportApi.resolveReport(reportId, { 
        actionTaken: isUpheld ? 'Resolved - Action Taken' : 'Dismissed - No Action',
        isUpheld,
        moderatorNotes: 'Processed via Admin Portal'
      }),
    {
      onSuccess: () => queryClient.invalidateQueries('admin-reports')
    }
  )

  const assignMutation = useMutation(
    (reportId: string) => reportApi.assignReport(reportId, user!.userId),
    {
      onSuccess: () => queryClient.invalidateQueries('admin-reports')
    }
  )

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.PENDING: return 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-400'
      case ReportStatus.UNDER_REVIEW: return 'bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/30 dark:text-indigo-400'
      case ReportStatus.RESOLVED: return 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400'
      case ReportStatus.DISMISSED: return 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
      case ReportStatus.ESCALATED: return 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/30 dark:text-rose-400'
      default: return 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">Content Moderation</h1>
          <p className="mt-2 text-sm font-bold text-slate-400 dark:text-slate-500">Review user reports and enforce community guidelines</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all">
        <div className="flex items-center gap-6">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReportStatus)}
            className="px-6 py-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all text-sm font-bold text-slate-600 dark:text-slate-400 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer outline-none appearance-none min-w-[200px]"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="">All Statuses</option>
            {Object.values(ReportStatus).map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <div className="h-8 w-px bg-slate-200/60 dark:bg-slate-700/60" />
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {data?.totalElements || 0} reports matching criteria
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-8 py-5 text-left">Report Details</th>
                <th className="px-8 py-5 text-left">Reporter</th>
                <th className="px-8 py-5 text-left">Target</th>
                <th className="px-8 py-5 text-left">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6">
                      <div className="h-12 bg-slate-200/50 dark:bg-slate-700/50 rounded-2xl w-full" />
                    </td>
                  </tr>
                ))
              ) : (
                data?.content.map((report) => (
                  <tr key={report.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-105 transition-transform ${
                          report.priorityLevel > 3 ? 'bg-rose-50 text-rose-600 border-rose-200/60 dark:border-rose-800/30' : 'bg-amber-50 text-amber-600 border-amber-200/60 dark:border-amber-800/30'
                        }`}>
                          {report.priorityLevel > 3 ? <ShieldAlert className="w-6 h-6" /> : <Flag className="w-6 h-6" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[200px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{report.reason}</span>
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{report.reportCategory.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{report.reporterName}</span>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">{formatDateTime(report.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          {report.targetType === ReportTargetType.USER_PROFILE ? <User className="w-4 h-4 text-slate-400" /> : <AlertTriangle className="w-4 h-4 text-slate-400" />}
                          {report.reportedUserName}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{report.targetType.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(report.status)}`}>
                        {report.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
                        <button className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                          <Eye className="w-5 h-5" />
                        </button>
                        {report.status === ReportStatus.PENDING && (
                          <button 
                            onClick={() => assignMutation.mutate(report.id)}
                            className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                            title="Assign to me"
                          >
                            <User className="w-5 h-5" />
                          </button>
                        )}
                        {(report.status === ReportStatus.PENDING || report.status === ReportStatus.UNDER_REVIEW) && (
                          <>
                            <button 
                              onClick={() => resolveMutation.mutate({ reportId: report.id, isUpheld: true })}
                              className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-emerald-200/60 dark:border-emerald-800/30 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                              title="Uphold Report"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => resolveMutation.mutate({ reportId: report.id, isUpheld: false })}
                              className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-rose-200/60 dark:border-rose-800/30 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                              title="Dismiss Report"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-6 border-t border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/20">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
            Showing <span className="font-black text-slate-600 dark:text-slate-300">{data?.totalElements === 0 ? 0 : ((data?.number ?? 0) * (data?.size ?? 0)) + 1}</span> - <span className="font-black text-slate-600 dark:text-slate-300">{Math.min(((data?.number ?? 0) + 1) * (data?.size ?? 0), data?.totalElements ?? 0)}</span> of <span className="font-black text-slate-600 dark:text-slate-300">{data?.totalElements ?? 0}</span> reports
          </p>
          <div className="flex gap-3">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-3 rounded-xl border border-slate-200/60 bg-white/50 text-slate-500 transition-all hover:bg-white hover:text-indigo-600 hover:shadow-sm hover:-translate-y-0.5 hover:border-indigo-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400 dark:hover:border-indigo-800/50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              disabled={data?.last}
              onClick={() => setPage(p => p + 1)}
              className="p-3 rounded-xl border border-slate-200/60 bg-white/50 text-slate-500 transition-all hover:bg-white hover:text-indigo-600 hover:shadow-sm hover:-translate-y-0.5 hover:border-indigo-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400 dark:hover:border-indigo-800/50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
