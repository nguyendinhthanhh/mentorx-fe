import { useState } from 'react'
import { useQuery } from 'react-query'
import { useAuthStore } from '@/store/authStore'
import { walletApi } from '@/api/walletApi'
import { ArrowDownLeft, ArrowUpRight, Clock, FileText, ReceiptText } from 'lucide-react'
import { TxnType, WalletTransactionResponse } from '@/types'
import { cn } from '@/utils/cn'

export default function UserTransactionsPage() {
  const { user } = useAuthStore()
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery(
    ['userTransactions', user?.userId, page],
    () => walletApi.getUserTransactions(user!.userId, { page, size: 20 }),
    { enabled: !!user?.userId, staleTime: 60 * 1000 }
  )

  const transactions = data?.content || []
  const totalPages = data?.totalPages || 0

  const getTransactionIcon = (txn: WalletTransactionResponse) => {
    switch (txn.txnType) {
      case TxnType.DEPOSIT:
      case TxnType.JOB_RELEASE:
      case TxnType.JOB_REFUND:
      case TxnType.COURSE_REFUND:
      case TxnType.BONUS_CREDIT:
      case TxnType.WITHDRAWAL_REFUND:
        return <ArrowDownLeft className="h-5 w-5" />
      case TxnType.WITHDRAWAL:
      case TxnType.JOB_PAYMENT:
      case TxnType.COURSE_PURCHASE:
      case TxnType.PLATFORM_FEE:
      case TxnType.WITHDRAWAL_FEE:
      case TxnType.PENALTY_DEDUCTION:
        return <ArrowUpRight className="h-5 w-5" />
      default:
        return <ReceiptText className="h-5 w-5" />
    }
  }

  const getTransactionColor = (txn: WalletTransactionResponse) => {
    switch (txn.txnType) {
      case TxnType.DEPOSIT:
      case TxnType.JOB_RELEASE:
      case TxnType.JOB_REFUND:
      case TxnType.COURSE_REFUND:
      case TxnType.BONUS_CREDIT:
      case TxnType.WITHDRAWAL_REFUND:
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
      case TxnType.WITHDRAWAL:
      case TxnType.JOB_PAYMENT:
      case TxnType.COURSE_PURCHASE:
      case TxnType.PLATFORM_FEE:
      case TxnType.WITHDRAWAL_FEE:
      case TxnType.PENALTY_DEDUCTION:
        return 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
    }
  }

  const getTransactionAmountPrefix = (txn: WalletTransactionResponse) => {
    switch (txn.txnType) {
      case TxnType.DEPOSIT:
      case TxnType.JOB_RELEASE:
      case TxnType.JOB_REFUND:
      case TxnType.COURSE_REFUND:
      case TxnType.BONUS_CREDIT:
      case TxnType.WITHDRAWAL_REFUND:
        return '+'
      case TxnType.WITHDRAWAL:
      case TxnType.JOB_PAYMENT:
      case TxnType.COURSE_PURCHASE:
      case TxnType.PLATFORM_FEE:
      case TxnType.WITHDRAWAL_FEE:
      case TxnType.PENALTY_DEDUCTION:
        return '-'
      default:
        return ''
    }
  }

  const getTransactionAmountColor = (txn: WalletTransactionResponse) => {
    switch (txn.txnType) {
      case TxnType.DEPOSIT:
      case TxnType.JOB_RELEASE:
      case TxnType.JOB_REFUND:
      case TxnType.COURSE_REFUND:
      case TxnType.BONUS_CREDIT:
      case TxnType.WITHDRAWAL_REFUND:
        return 'text-emerald-600 dark:text-emerald-400'
      case TxnType.WITHDRAWAL:
      case TxnType.JOB_PAYMENT:
      case TxnType.COURSE_PURCHASE:
      case TxnType.PLATFORM_FEE:
      case TxnType.WITHDRAWAL_FEE:
      case TxnType.PENALTY_DEDUCTION:
        return 'text-rose-600 dark:text-rose-400'
      default:
        return 'text-slate-900 dark:text-white'
    }
  }

  const formatMxcAmount = (amount: number | string) => {
    return new Intl.NumberFormat('vi-VN').format(Number(amount)) + ' MXC'
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Lịch sử giao dịch
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Xem lại tất cả các biến động số dư trong ví của bạn.
        </p>
      </div>

      <div className="rounded-[24px] border border-slate-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse p-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                </div>
                <div className="w-24 h-6 bg-slate-200 dark:bg-slate-700 rounded-md" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
              <ReceiptText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Chưa có giao dịch</h3>
            <p className="mt-2 text-sm text-slate-500">Bạn chưa thực hiện bất kỳ giao dịch nào.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((txn) => (
              <div key={txn.id} className="flex items-center gap-4 p-4 md:p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', getTransactionColor(txn))}>
                  {getTransactionIcon(txn)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="truncate text-base font-bold text-slate-900 dark:text-white">
                    {txn.txnType} {txn.note ? `- ${txn.note}` : ''}
                  </h4>
                  <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(txn.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn('text-base font-black', getTransactionAmountColor(txn))}>
                    {getTransactionAmountPrefix(txn)}
                    {formatMxcAmount(txn.amountMxc)}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-400 uppercase">
                    {txn.txnStatus}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Trang trước
            </button>
            <span className="text-sm font-medium text-slate-500">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Trang tiếp
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
