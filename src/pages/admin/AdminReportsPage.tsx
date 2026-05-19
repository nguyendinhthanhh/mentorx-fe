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
      case ReportStatus.PENDING: return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
      case ReportStatus.UNDER_REVIEW: return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
      case ReportStatus.RESOLVED: return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
      case ReportStatus.DISMISSED: return 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      case ReportStatus.ESCALATED: return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
      default: return 'bg-gray-50 text-gray-600'
    }
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
        <div className="flex items-center gap-6">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReportStatus)}
            className="px-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-bold text-gray-600 dark:text-gray-400"
          >
            <option value="">All Statuses</option>
            {Object.values(ReportStatus).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="h-8 w-px bg-gray-100 dark:bg-gray-800" />
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {data?.totalElements || 0} reports matching criteria
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] border-b border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/20">
                <th className="px-8 py-5 text-left">Report Details</th>
                <th className="px-8 py-5 text-left">Reporter</th>
                <th className="px-8 py-5 text-left">Target</th>
                <th className="px-8 py-5 text-left">Status</th>
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
                data?.content.map((report) => (
                  <tr key={report.id} className="group hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                          report.priorityLevel > 3 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {report.priorityLevel > 3 ? <ShieldAlert className="w-6 h-6" /> : <Flag className="w-6 h-6" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight truncate max-w-[200px]">{report.reason}</span>
                          <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.1em] mt-0.5">{report.reportCategory}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{report.reporterName}</span>
                        <span className="text-[10px] font-medium text-gray-400 mt-0.5">{formatDateTime(report.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                          {report.targetType === ReportTargetType.USER_PROFILE ? <User className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          {report.reportedUserName}
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{report.targetType.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(report.status)}`}>
                        {report.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                        <button className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-600 transition-all shadow-sm">
                          <Eye className="w-4 h-4" />
                        </button>
                        {report.status === ReportStatus.PENDING && (
                          <button 
                            onClick={() => assignMutation.mutate(report.id)}
                            className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-indigo-600 transition-all shadow-sm"
                            title="Assign to me"
                          >
                            <User className="w-4 h-4" />
                          </button>
                        )}
                        {(report.status === ReportStatus.PENDING || report.status === ReportStatus.UNDER_REVIEW) && (
                          <>
                            <button 
                              onClick={() => resolveMutation.mutate({ reportId: report.id, isUpheld: true })}
                              className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-emerald-600 transition-all shadow-sm"
                              title="Uphold Report"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => resolveMutation.mutate({ reportId: report.id, isUpheld: false })}
                              className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-rose-600 transition-all shadow-sm"
                              title="Dismiss Report"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-gray-900 transition-all shadow-sm">
                          <MoreVertical className="w-4 h-4" />
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
        <div className="px-8 py-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/30">
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Showing {data?.number! * data?.size! + 1} - {Math.min((data?.number! + 1) * data?.size!, data?.totalElements!)} of {data?.totalElements} reports
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
    </div>
  )
}
