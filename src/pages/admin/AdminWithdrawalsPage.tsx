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
      case WithdrawalStatus.COMPLETED: return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
      case WithdrawalStatus.PENDING: return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
      case WithdrawalStatus.REJECTED: return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
      case WithdrawalStatus.PROCESSING: return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
      default: return 'bg-gray-50 text-gray-600'
    }
  }

  const handleReject = (requestId: string) => {
    setSelectedRequestId(requestId)
    setIsRejectModalOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Withdrawal Management</h1>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Review and approve manual payout requests</p>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800 shadow-sm">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Pending Requests</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {data?.filter(r => r.status === WithdrawalStatus.PENDING).length || 0}
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 shadow-sm">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total Payouts</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {data?.filter(r => r.status === WithdrawalStatus.COMPLETED).length || 0}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 shadow-sm">
            <Banknote className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total Volume</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {formatCurrency(data?.reduce((acc, curr) => acc + (curr.status === WithdrawalStatus.COMPLETED ? curr.netMxc : 0), 0) || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by user, account name, or number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-medium text-gray-900 dark:text-white"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as WithdrawalStatus)}
            className="px-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-bold text-gray-600 dark:text-gray-400"
          >
            <option value="">All Statuses</option>
            {Object.values(WithdrawalStatus).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] border-b border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/20">
                <th className="px-8 py-5 text-left">User & Request Info</th>
                <th className="px-8 py-5 text-left">Bank Account</th>
                <th className="px-8 py-5 text-left">Amount</th>
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
                filteredData?.map((request) => (
                  <tr key={request.id} className="group hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{request.user?.fullName || `User #${request.userId.slice(0, 6)}`}</span>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">ID: {request.id.substring(0, 8)}...</span>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">{formatDateTime(request.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{request.bankAccountName}</span>
                        <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mt-0.5">{request.bankName}</span>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5">{request.bankAccountNo}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-rose-600 dark:text-rose-400 tracking-tight">-{formatCurrency(request.mxcAmount)}</span>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Net: {formatCurrency(request.netMxc)}</span>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">Fee: {formatCurrency(request.feeMxc)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      {request.rejectionReason && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1 max-w-[150px] truncate" title={request.rejectionReason}>
                          Reason: {request.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                        {request.status === WithdrawalStatus.PENDING && (
                          <>
                            <button 
                              onClick={() => {
                                if (window.confirm('Are you sure you want to APPROVE this withdrawal? Ensure you have transferred the real money first.')) {
                                  approveMutation.mutate(request.id)
                                }
                              }}
                              disabled={approveMutation.isLoading}
                              className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-emerald-600 transition-all shadow-sm"
                              title="Approve & Complete"
                            >
                              {approveMutation.isLoading && selectedRequestId === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                            <button 
                              onClick={() => handleReject(request.id)}
                              className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-rose-600 transition-all shadow-sm"
                              title="Reject & Refund"
                            >
                              <XCircle className="w-4 h-4" />
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
