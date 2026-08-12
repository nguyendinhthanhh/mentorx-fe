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
        toast.success('Yêu cầu rút tiền đã được phê duyệt và xử lý')
        queryClient.invalidateQueries('admin-withdrawals')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Không thể phê duyệt yêu cầu rút tiền')
      }
    }
  )

  const rejectMutation = useMutation(
    ({ requestId, reason }: { requestId: string; reason: string }) => 
      walletApi.rejectWithdrawal(requestId, reason),
    {
      onSuccess: () => {
        toast.success('Yêu cầu rút tiền đã bị từ chối')
        queryClient.invalidateQueries('admin-withdrawals')
        setIsRejectModalOpen(false)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Không thể từ chối yêu cầu rút tiền')
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
      case WithdrawalStatus.COMPLETED: return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400'
      case WithdrawalStatus.PENDING: return 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 border border-amber-200 dark:border-amber-800/50 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-400'
      case WithdrawalStatus.REJECTED: return 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/30 dark:text-rose-400'
      case WithdrawalStatus.PROCESSING: return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400'
      default: return 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
    }
  }

  const getStatusLabel = (status: WithdrawalStatus) => {
    const labels: Record<WithdrawalStatus, string> = {
      [WithdrawalStatus.PENDING]: 'Chờ xử lý',
      [WithdrawalStatus.PROCESSING]: 'Đang xử lý',
      [WithdrawalStatus.COMPLETED]: 'Đã hoàn tất',
      [WithdrawalStatus.REJECTED]: 'Đã từ chối',
      [WithdrawalStatus.FAILED]: 'Thất bại',
      [WithdrawalStatus.CANCELLED]: 'Đã hủy',
    }
    return labels[status] || status
  }

  const handleReject = (requestId: string) => {
    setSelectedRequestId(requestId)
    setIsRejectModalOpen(true)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent dark:from-white dark:to-slate-400 sm:text-3xl lg:text-4xl">Quản lý rút tiền</h1>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">Xem xét và phê duyệt các yêu cầu chi trả thủ công</p>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-950/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex items-center gap-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none">
          <div className="w-16 h-16 rounded-[2rem] bg-amber-50 dark:bg-amber-900/30 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30 shadow-sm">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Yêu cầu chờ xử lý</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {data?.filter(r => r.status === WithdrawalStatus.PENDING).length || 0}
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-950/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex items-center gap-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none">
          <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/30 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-500 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 shadow-sm">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Chi trả hoàn tất</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {data?.filter(r => r.status === WithdrawalStatus.COMPLETED).length || 0}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex items-center gap-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none">
          <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/30 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-500 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 shadow-sm">
            <Banknote className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tổng khối lượng</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {formatCurrency(data?.reduce((acc, curr) => acc + (curr.status === WithdrawalStatus.COMPLETED ? curr.netMxc : 0), 0) || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/50 bg-white dark:bg-slate-950/70 p-4 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none sm:rounded-[2.5rem] sm:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm theo người dùng, tên tài khoản hoặc số tài khoản..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white dark:bg-slate-950/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/60 dark:border-slate-700/60 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as WithdrawalStatus)}
            className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950/50 px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400 shadow-sm outline-none transition-all hover:border-slate-300 dark:border-slate-700 focus:border-emerald-500/30 focus:bg-white dark:bg-slate-950 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-slate-600 dark:focus:bg-slate-800 md:w-auto md:min-w-[200px]"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.values(WithdrawalStatus).map(s => (
              <option key={s} value={s}>{getStatusLabel(s)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-950/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-800/30">
                <th className="px-8 py-5 text-left">Người dùng & yêu cầu</th>
                <th className="px-8 py-5 text-left">Tài khoản ngân hàng</th>
                <th className="px-8 py-5 text-left">Số tiền</th>
                <th className="px-8 py-5 text-left">Trạng thái</th>
                <th className="px-8 py-5 text-right">Thao tác</th>
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
                  <tr key={request.id} className="group hover:bg-slate-50 dark:bg-slate-900/30 dark:hover:bg-slate-800/80 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{request.user?.fullName || `Người dùng #${request.userId.slice(0, 6)}`}</span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">ID: {request.id.substring(0, 8)}...</span>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{formatDateTime(request.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{request.bankAccountName}</span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mt-0.5">{request.bankName}</span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-0.5">{request.bankAccountNo}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-rose-600 dark:text-rose-400 tracking-tight">-{formatCurrency(request.mxcAmount)}</span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-0.5">Thực nhận: {formatCurrency(request.netMxc)}</span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-0.5">Phí: {formatCurrency(request.feeMxc)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
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
                                if (window.confirm('Bạn chắc chắn muốn phê duyệt yêu cầu rút tiền này? Hãy đảm bảo bạn đã chuyển tiền thật trước.')) {
                                  approveMutation.mutate(request.id)
                                }
                              }}
                              disabled={approveMutation.isLoading}
                              className="p-3 rounded-xl bg-white dark:bg-slate-950/50 dark:bg-slate-800/50 border border-emerald-200 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                              title="Phê duyệt & hoàn tất"
                            >
                              {approveMutation.isLoading && selectedRequestId === request.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-5 h-5" />
                              )}
                            </button>
                            <button 
                              onClick={() => handleReject(request.id)}
                              className="p-3 rounded-xl bg-white dark:bg-slate-950/50 dark:bg-slate-800/50 border border-rose-200/60 dark:border-rose-800/30 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                              title="Từ chối & hoàn tiền"
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
        title="Từ chối yêu cầu rút tiền"
        message="Số tiền sẽ được hoàn về số dư khả dụng của người dùng. Vui lòng giải thích lý do từ chối yêu cầu này."
        confirmText="Xác nhận từ chối"
        onConfirm={(reason) => {
          if (selectedRequestId) {
            rejectMutation.mutate({ requestId: selectedRequestId, reason })
          }
        }}
      />
    </div>
  )
}
