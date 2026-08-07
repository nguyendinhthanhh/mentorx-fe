import { useState } from 'react'
import { useQuery } from 'react-query'
import { CheckCircle2, Clock, XCircle, AlertCircle, Eye, Banknote } from 'lucide-react'

import { walletApi } from '@/api/walletApi'
import { WithdrawalResponse, WithdrawalStatus } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface WithdrawalHistoryProps {
  userId: string
}

export default function WithdrawalHistory({ userId }: WithdrawalHistoryProps) {
  const [page, setPage] = useState(0)
  const pageSize = 10

  const { data, isLoading, isError, refetch } = useQuery(
    ['user-withdrawals', userId, page],
    () => walletApi.getUserWithdrawals(userId, { page, size: pageSize }),
    { enabled: !!userId }
  )

  const getStatusIcon = (status: WithdrawalStatus) => {
    switch (status) {
      case WithdrawalStatus.COMPLETED:
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case WithdrawalStatus.PENDING:
        return <Clock className="h-4 w-4 text-amber-500" />
      case WithdrawalStatus.PROCESSING:
        return <Banknote className="h-4 w-4 text-sky-500" />
      case WithdrawalStatus.REJECTED:
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-slate-400" />
    }
  }

  const getStatusLabel = (status: WithdrawalStatus) => {
    switch (status) {
      case WithdrawalStatus.COMPLETED:
        return <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase">Thành công</span>
      case WithdrawalStatus.PENDING:
        return <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase">Chờ duyệt</span>
      case WithdrawalStatus.PROCESSING:
        return <span className="text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase">Đang xử lý</span>
      case WithdrawalStatus.REJECTED:
        return <span className="text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase">Từ chối</span>
      default:
        return <span className="text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase">{status}</span>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-slate-50 h-20 rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">Không thể tải lịch sử rút tiền</p>
        </div>
        <button onClick={() => refetch()} className="text-sm font-bold underline hover:text-red-800">
          Thử lại
        </button>
      </div>
    )
  }

  const withdrawals = data?.content || []

  if (withdrawals.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
        <Banknote className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-900">Chưa có lịch sử rút tiền</h3>
        <p className="text-[13px] text-slate-500 mt-1">Các yêu cầu rút tiền của bạn sẽ hiển thị ở đây.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {withdrawals.map((withdrawal: WithdrawalResponse) => (
        <div key={withdrawal.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(withdrawal.status)}
              {getStatusLabel(withdrawal.status)}
            </div>
            <p className="text-[12px] font-medium text-slate-500">
              {new Date(withdrawal.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Số tiền rút</p>
              <p className="text-[18px] font-black text-slate-900">{formatCurrency(withdrawal.mxcAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Thực nhận</p>
              <p className="text-[16px] font-bold text-emerald-600">{formatCurrency(withdrawal.netMxc)}</p>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[12px]">
            <p className="text-slate-500">
              Ngân hàng: <span className="font-semibold text-slate-700">{withdrawal.bankName}</span>
            </p>
            <p className="text-slate-500">
              Số TK: <span className="font-semibold text-slate-700">*{withdrawal.bankAccountNo.slice(-4)}</span>
            </p>
          </div>

          {withdrawal.rejectionReason && (
            <div className="mt-3 p-2 bg-red-50 text-red-700 text-[12px] rounded-lg border border-red-100">
              <strong>Lý do từ chối:</strong> {withdrawal.rejectionReason}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
