import { useQuery, useMutation, useQueryClient } from 'react-query'
import { walletApi } from '@/api/walletApi'
import { WithdrawalStatus } from '@/types'
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Wallet, 
  Clock, 
  ArrowDownCircle, 
  Banknote,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useState } from 'react'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { toast } from 'react-hot-toast'
import ArchiveReasonModal from '@/components/admin/ArchiveReasonModal'

export default function AdminWithdrawalsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | ''>('')
  
  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

  const { data, isLoading } = useQuery(
    ['admin-withdrawals'],
    () => walletApi.getAllWithdrawals()
  )

  const approveMutation = useMutation(
    (requestId: string) => walletApi.approveWithdrawal(requestId),
    {
      onSuccess: () => {
        toast.success('Withdrawal request approved and processed')
        queryClient.invalidateQueries('admin-withdrawals')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to approve withdrawal')
      }
    }
  )

  const rejectMutation = useMutation(
    ({ requestId, reason }: { requestId: string; reason: string }) => 
      walletApi.rejectWithdrawal(requestId, reason),
    {
      onSuccess: () => {
        toast.success('Withdrawal request rejected')
        queryClient.invalidateQueries('admin-withdrawals')
        setIsRejectModalOpen(false)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to reject withdrawal')
      }
    }
  )

  const filteredData = data?.filter(req => {
    const matchesSearch = req.bankAccountName.toLowerCase().includes(search.toLowerCase()) || 
                         req.bankAccountNo.includes(search) ||
                         req.user?.fullName?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter ? req.status === statusFilter : true
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: WithdrawalStatus) => {
    switch (status) {
      case WithdrawalStatus.COMPLETED: return 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400'
      case WithdrawalStatus.PENDING: return 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-400'
      case WithdrawalStatus.REJECTED: return 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/30 dark:text-rose-400'
      case WithdrawalStatus.PROCESSING: return 'bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/30 dark:text-indigo-400'
      default: return 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
    }
  }

  const handleReject = (requestId: string) => {
    setSelectedRequestId(requestId)
    setIsRejectModalOpen(true)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">Withdrawal Management</h1>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">Review and approve manual payout requests</p>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex items-center gap-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none">
          <div className="w-16 h-16 rounded-[2rem] bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 shadow-sm">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pending Requests</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {data?.filter(r => r.status === WithdrawalStatus.PENDING).length || 0}
            </p>
          </div>
        </div>
        
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex items-center gap-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none">
          <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 shadow-sm">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Payouts</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {data?.filter(r => r.status === WithdrawalStatus.COMPLETED).length || 0}
            </p>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex items-center gap-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none">
          <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/30 shadow-sm">
            <Banknote className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Volume</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {formatCurrency(data?.reduce((acc, curr) => acc + (curr.status === WithdrawalStatus.COMPLETED ? curr.netMxc : 0), 0) || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by user, account name, or number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as WithdrawalStatus)}
            className="px-6 py-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all text-sm font-bold text-slate-600 dark:text-slate-400 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer outline-none appearance-none min-w-[200px]"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="">All Statuses</option>
            {Object.values(WithdrawalStatus).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-8 py-5 text-left">User & Request Info</th>
                <th className="px-8 py-5 text-left">Bank Account</th>
                <th className="px-8 py-5 text-left">Amount</th>
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
                filteredData?.map((request) => (
                  <tr key={request.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{request.user?.fullName || `User #${request.userId.slice(0, 6)}`}</span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">ID: {request.id.substring(0, 8)}...</span>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{formatDateTime(request.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{request.bankAccountName}</span>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-0.5">{request.bankName}</span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{request.bankAccountNo}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-rose-600 dark:text-rose-400 tracking-tight">-{formatCurrency(request.mxcAmount)}</span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Net: {formatCurrency(request.netMxc)}</span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Fee: {formatCurrency(request.feeMxc)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      {request.rejectionReason && (
                        <p className="text-[10px] text-rose-500 font-bold mt-2 max-w-[150px] truncate bg-rose-50 dark:bg-rose-900/20 p-1.5 rounded-md border border-rose-100 dark:border-rose-800/30" title={request.rejectionReason}>
                          {request.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
                        {request.status === WithdrawalStatus.PENDING && (
                          <>
                            <button 
                              onClick={() => {
                                if (window.confirm('Are you sure you want to APPROVE this withdrawal? Ensure you have transferred the real money first.')) {
                                  approveMutation.mutate(request.id)
                                }
                              }}
                              disabled={approveMutation.isLoading}
                              className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-emerald-200/60 dark:border-emerald-800/30 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                              title="Approve & Complete"
                            >
                              {approveMutation.isLoading && selectedRequestId === request.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-5 h-5" />
                              )}
                            </button>
                            <button 
                              onClick={() => handleReject(request.id)}
                              className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-rose-200/60 dark:border-rose-800/30 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                              title="Reject & Refund"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ArchiveReasonModal 
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        isLoading={rejectMutation.isLoading}
        title="Reject Withdrawal"
        message="The funds will be returned to the user's available balance. Please explain why this request is being rejected."
        confirmText="Confirm Reject"
        onConfirm={(reason) => {
          if (selectedRequestId) {
            rejectMutation.mutate({ requestId: selectedRequestId, reason })
          }
        }}
      />
    </div>
  )
}
