import { useState } from 'react'
import { useQuery } from 'react-query'
import { useAuthStore } from '@/store/authStore'
import { walletApi } from '@/api/walletApi'
import { ArrowDownLeft, ArrowUpRight, Clock, ReceiptText } from 'lucide-react'
import { TxnStatus, TxnType, WalletTransactionResponse } from '@/types'
import { cn } from '@/utils/cn'

type TransactionCopy = {
  title: string
  description: string
}

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
      case TxnType.APPOINTMENT_RELEASE:
      case TxnType.APPOINTMENT_REFUND:
      case TxnType.BONUS_CREDIT:
      case TxnType.WITHDRAWAL_REFUND:
        return <ArrowDownLeft className="h-5 w-5" />
      case TxnType.WITHDRAWAL:
      case TxnType.JOB_PAYMENT:
      case TxnType.COURSE_PURCHASE:
      case TxnType.APPOINTMENT_BOOKING:
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
      case TxnType.APPOINTMENT_RELEASE:
      case TxnType.APPOINTMENT_REFUND:
      case TxnType.BONUS_CREDIT:
      case TxnType.WITHDRAWAL_REFUND:
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
      case TxnType.WITHDRAWAL:
      case TxnType.JOB_PAYMENT:
      case TxnType.COURSE_PURCHASE:
      case TxnType.APPOINTMENT_BOOKING:
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
      case TxnType.APPOINTMENT_RELEASE:
      case TxnType.APPOINTMENT_REFUND:
      case TxnType.BONUS_CREDIT:
      case TxnType.WITHDRAWAL_REFUND:
        return '+'
      case TxnType.WITHDRAWAL:
      case TxnType.JOB_PAYMENT:
      case TxnType.COURSE_PURCHASE:
      case TxnType.APPOINTMENT_BOOKING:
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
      case TxnType.APPOINTMENT_RELEASE:
      case TxnType.APPOINTMENT_REFUND:
      case TxnType.BONUS_CREDIT:
      case TxnType.WITHDRAWAL_REFUND:
        return 'text-emerald-600 dark:text-emerald-400'
      case TxnType.WITHDRAWAL:
      case TxnType.JOB_PAYMENT:
      case TxnType.COURSE_PURCHASE:
      case TxnType.APPOINTMENT_BOOKING:
      case TxnType.PLATFORM_FEE:
      case TxnType.WITHDRAWAL_FEE:
      case TxnType.PENALTY_DEDUCTION:
        return 'text-rose-600 dark:text-rose-400'
      default:
        return 'text-slate-900 dark:text-white'
    }
  }

  const getTransactionCopy = (txn: WalletTransactionResponse): TransactionCopy => {
    switch (txn.txnType) {
      case TxnType.DEPOSIT:
        return {
          title: 'Nạp tiền vào ví',
          description: txn.note || 'Số dư MXC đã được cộng vào ví của bạn.',
        }
      case TxnType.WITHDRAWAL:
        return {
          title: 'Rút tiền từ ví',
          description: txn.note || 'Bạn đã tạo yêu cầu rút tiền từ ví MXC.',
        }
      case TxnType.JOB_PAYMENT:
        return {
          title: 'Tạm giữ thanh toán công việc',
          description: txn.note || 'Tiền được khóa tạm thời trong escrow để bảo đảm giao dịch job.',
        }
      case TxnType.JOB_RELEASE:
        return {
          title: 'Giải ngân thanh toán công việc',
          description: txn.note || 'Tiền đã được giải ngân từ escrow cho bên nhận thanh toán.',
        }
      case TxnType.JOB_REFUND:
        return {
          title: 'Hoàn tiền công việc',
          description: txn.note || 'Tiền job đã được hoàn lại vào ví của bạn.',
        }
      case TxnType.COURSE_PURCHASE:
        return {
          title: 'Thanh toán khóa học',
          description: txn.note || 'Bạn đã thanh toán khóa học bằng số dư ví MXC.',
        }
      case TxnType.COURSE_REFUND:
        return {
          title: 'Hoàn tiền khóa học',
          description: txn.note || 'Khoản thanh toán khóa học đã được trả lại vào ví.',
        }
      case TxnType.APPOINTMENT_BOOKING:
        return {
          title: 'Tạm giữ phí đặt lịch mentor',
          description: txn.note || 'Phí buổi mentoring được tạm giữ trong escrow sau khi đặt lịch.',
        }
      case TxnType.APPOINTMENT_RELEASE:
        return {
          title: 'Giải ngân buổi mentoring',
          description: txn.note || 'Tiền đã được giải ngân sau khi buổi mentoring hoàn tất.',
        }
      case TxnType.APPOINTMENT_REFUND:
        return {
          title: 'Hoàn tiền buổi mentoring',
          description: txn.note || 'Phí đặt lịch mentor đã được hoàn lại vào ví của bạn.',
        }
      case TxnType.PLATFORM_FEE:
        return {
          title: 'Phí nền tảng',
          description: txn.note || 'Khoản phí dịch vụ được trừ theo giao dịch trên nền tảng.',
        }
      case TxnType.WITHDRAWAL_FEE:
        return {
          title: 'Phí rút tiền',
          description: txn.note || 'Phí xử lý rút tiền được trừ cùng giao dịch.',
        }
      case TxnType.BONUS_CREDIT:
        return {
          title: 'Thưởng cộng vào ví',
          description: txn.note || 'Hệ thống đã cộng thêm thưởng hoặc ưu đãi vào ví của bạn.',
        }
      case TxnType.PENALTY_DEDUCTION:
        return {
          title: 'Khấu trừ theo quy định',
          description: txn.note || 'Hệ thống đã trừ một khoản theo quy định xử lý.',
        }
      case TxnType.WITHDRAWAL_REFUND:
        return {
          title: 'Hoàn tiền rút tiền',
          description: txn.note || 'Yêu cầu rút tiền không thành công và tiền đã được trả lại vào ví.',
        }
      case TxnType.ADJUSTMENT:
        return {
          title: 'Điều chỉnh số dư',
          description: txn.note || 'Hệ thống đã thực hiện điều chỉnh số dư ví.',
        }
      default:
        return {
          title: 'Giao dịch ví',
          description: txn.note || 'Biến động số dư trong ví MXC.',
        }
    }
  }

  const getStatusCopy = (status: TxnStatus) => {
    switch (status) {
      case TxnStatus.COMPLETED:
        return 'Thành công'
      case TxnStatus.PENDING:
        return 'Đang xử lý'
      case TxnStatus.FAILED:
        return 'Thất bại'
      case TxnStatus.REVERSED:
        return 'Đã đảo ngược'
      case TxnStatus.FLAGGED:
        return 'Cần kiểm tra'
      case TxnStatus.CANCELLED:
        return 'Đã hủy'
      default:
        return status
    }
  }

  const getStatusColor = (status: TxnStatus) => {
    switch (status) {
      case TxnStatus.COMPLETED:
        return 'bg-emerald-50 text-emerald-700'
      case TxnStatus.PENDING:
        return 'bg-amber-50 text-amber-700'
      case TxnStatus.FAILED:
      case TxnStatus.CANCELLED:
        return 'bg-rose-50 text-rose-700'
      case TxnStatus.FLAGGED:
        return 'bg-violet-50 text-violet-700'
      case TxnStatus.REVERSED:
        return 'bg-slate-100 text-slate-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const formatMxcAmount = (amount: number | string) => {
    return `${new Intl.NumberFormat('vi-VN').format(Number(amount))} MXC`
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Lịch sử giao dịch
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Xem lại toàn bộ các khoản nạp, trừ, tạm giữ, giải ngân và hoàn tiền trong ví của bạn.
        </p>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex animate-pulse gap-4 p-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="h-6 w-24 rounded-md bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
              <ReceiptText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Chưa có giao dịch</h3>
            <p className="mt-2 text-sm text-slate-500">
              Các biến động số dư sẽ hiển thị tại đây khi ví của bạn phát sinh giao dịch.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((txn) => {
              const copy = getTransactionCopy(txn)

              return (
                <div
                  key={txn.id}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 md:p-6"
                >
                  <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', getTransactionColor(txn))}>
                    {getTransactionIcon(txn)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-base font-bold text-slate-900 dark:text-white">
                      {copy.title}
                    </h4>
                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                      {copy.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(txn.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={cn('text-base font-black', getTransactionAmountColor(txn))}>
                      {getTransactionAmountPrefix(txn)}
                      {formatMxcAmount(txn.amountMxc)}
                    </div>
                    <div className={cn('mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase', getStatusColor(txn.txnStatus))}>
                      {getStatusCopy(txn.txnStatus)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

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
