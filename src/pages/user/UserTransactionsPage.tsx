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
          title: 'Nap tien vao vi',
          description: txn.note || 'So du MXC da duoc cong vao vi cua ban.',
        }
      case TxnType.WITHDRAWAL:
        return {
          title: 'Rut tien tu vi',
          description: txn.note || 'Ban da tao yeu cau rut tien tu vi MXC.',
        }
      case TxnType.JOB_PAYMENT:
        return {
          title: 'Tam giu thanh toan cong viec',
          description: txn.note || 'Tien duoc khoa tam thoi trong escrow de bao dam giao dich job.',
        }
      case TxnType.JOB_RELEASE:
        return {
          title: 'Giai ngan thanh toan cong viec',
          description: txn.note || 'Tien da duoc giai ngan tu escrow cho ben nhan thanh toan.',
        }
      case TxnType.JOB_REFUND:
        return {
          title: 'Hoan tien cong viec',
          description: txn.note || 'Tien job da duoc hoan lai vao vi cua ban.',
        }
      case TxnType.COURSE_PURCHASE:
        return {
          title: 'Thanh toan khoa hoc',
          description: txn.note || 'Ban da thanh toan khoa hoc bang so du vi MXC.',
        }
      case TxnType.COURSE_REFUND:
        return {
          title: 'Hoan tien khoa hoc',
          description: txn.note || 'Khoan thanh toan khoa hoc da duoc tra lai vao vi.',
        }
      case TxnType.APPOINTMENT_BOOKING:
        return {
          title: 'Tam giu phi dat lich mentor',
          description: txn.note || 'Phi buoi mentoring duoc tam giu trong escrow sau khi dat lich.',
        }
      case TxnType.APPOINTMENT_RELEASE:
        return {
          title: 'Giai ngan buoi mentoring',
          description: txn.note || 'Tien da duoc giai ngan sau khi buoi mentoring hoan tat.',
        }
      case TxnType.APPOINTMENT_REFUND:
        return {
          title: 'Hoan tien buoi mentoring',
          description: txn.note || 'Phi dat lich mentor da duoc hoan lai vao vi cua ban.',
        }
      case TxnType.PLATFORM_FEE:
        return {
          title: 'Phi nen tang',
          description: txn.note || 'Khoan phi dich vu duoc tru theo giao dich tren nen tang.',
        }
      case TxnType.WITHDRAWAL_FEE:
        return {
          title: 'Phi rut tien',
          description: txn.note || 'Phi xu ly rut tien duoc tru cung giao dich.',
        }
      case TxnType.BONUS_CREDIT:
        return {
          title: 'Thuong cong vao vi',
          description: txn.note || 'He thong da cong them thuong hoac uu dai vao vi cua ban.',
        }
      case TxnType.PENALTY_DEDUCTION:
        return {
          title: 'Khau tru theo quy dinh',
          description: txn.note || 'He thong da tru mot khoan theo quy dinh xu ly.',
        }
      case TxnType.WITHDRAWAL_REFUND:
        return {
          title: 'Hoan tien rut tien',
          description: txn.note || 'Yeu cau rut tien khong thanh cong va tien da duoc tra lai vao vi.',
        }
      case TxnType.ADJUSTMENT:
        return {
          title: 'Dieu chinh so du',
          description: txn.note || 'He thong da thuc hien dieu chinh so du vi.',
        }
      default:
        return {
          title: 'Giao dich vi',
          description: txn.note || 'Bien dong so du trong vi MXC.',
        }
    }
  }

  const getStatusCopy = (status: TxnStatus) => {
    switch (status) {
      case TxnStatus.COMPLETED:
        return 'Thanh cong'
      case TxnStatus.PENDING:
        return 'Dang xu ly'
      case TxnStatus.FAILED:
        return 'That bai'
      case TxnStatus.REVERSED:
        return 'Da dao nguoc'
      case TxnStatus.FLAGGED:
        return 'Can kiem tra'
      case TxnStatus.CANCELLED:
        return 'Da huy'
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
          Lich su giao dich
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Xem lai toan bo cac khoan nap, tru, tam giu, giai ngan va hoan tien trong vi cua ban.
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
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Chua co giao dich</h3>
            <p className="mt-2 text-sm text-slate-500">
              Cac bien dong so du se hien thi tai day khi vi cua ban phat sinh giao dich.
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
              Trang truoc
            </button>
            <span className="text-sm font-medium text-slate-500">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Trang tiep
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
