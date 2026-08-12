import { useState, useEffect, type ReactNode } from 'react'
import { useQuery } from 'react-query'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { walletApi } from '@/api/walletApi'
import { formatDateTime, formatExchangeRate, formatFiatCurrency, formatMxc } from '@/utils/formatters'
import DepositForm from '@/components/wallet/DepositForm'
import WithdrawalForm from '@/components/wallet/WithdrawalForm'
import TransferForm from '@/components/wallet/TransferForm'
import BankAccountSettings from '@/components/wallet/BankAccountSettings'
import { Wallet, ArrowDownCircle, ArrowUpCircle, Send, Clock, Landmark, ArrowRightLeft, ShieldCheck, Hash, Link } from 'lucide-react'
import { TxnType, type WalletTransactionResponse } from '@/types'

export default function WalletPage() {
  const { user } = useAuthStore()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'transfer' | 'bank-accounts'>('deposit')
  const [page, setPage] = useState(0)
  const [txnFilter, setTxnFilter] = useState<TxnType | 'ALL'>('ALL')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    if (tab && ['deposit', 'withdraw', 'transfer', 'bank-accounts'].includes(tab)) {
      setActiveTab(tab as any)
    }
  }, [location.search])

  const { data: userBalance, refetch: refetchBalance } = useQuery(
    ['userBalance', user?.userId],
    () => walletApi.getUserBalance(user!.userId),
    { enabled: !!user?.userId }
  )

  const { data: wallets, refetch: refetchWallets } = useQuery(
    ['wallets', user?.userId],
    () => walletApi.getUserWallets(user!.userId),
    { enabled: !!user?.userId }
  )

  const { data: transactions, refetch: refetchTransactions } = useQuery(
    ['transactions', user?.userId, page, txnFilter],
    () => walletApi.getUserTransactions(user!.userId, { 
      page, 
      size: 10, 
      type: txnFilter === 'ALL' ? undefined : txnFilter as TxnType 
    }),
    { enabled: !!user?.userId, keepPreviousData: true }
  )

  if (!user) return null

  const availableWallet = wallets?.find((wallet) => wallet.accountType === 'USER_AVAILABLE')
  const pendingWallet = wallets?.find((wallet) => wallet.accountType === 'USER_PENDING')
  const escrowWallet = wallets?.find((wallet) => wallet.accountType === 'ESCROW')

  const tabs = [
    { key: 'deposit' as const, label: 'Nạp tiền', icon: ArrowDownCircle, color: 'text-green-600' },
    { key: 'withdraw' as const, label: 'Rút tiền', icon: ArrowUpCircle, color: 'text-red-600' },
    { key: 'transfer' as const, label: 'Chuyển tiền', icon: Send, color: 'text-blue-600' },
    { key: 'bank-accounts' as const, label: 'Nhận tiền', icon: Landmark, color: 'text-emerald-600 dark:text-emerald-500' },
  ]

  const walletTypeLabels: Record<string, string> = {
    USER_AVAILABLE: 'SỐ DƯ KHẢ DỤNG',
    USER_PENDING: 'SỐ DƯ CHỜ XỬ LÝ',
    ESCROW: 'ĐANG TẠM GIỮ',
  }

  const txnTypeLabels: Record<string, string> = {
    DEPOSIT: 'Nạp tiền',
    WITHDRAWAL: 'Rút tiền',
    WITHDRAWAL_REFUND: 'Hoàn tiền rút',
    JOB_PAYMENT: 'Thanh toán công việc',
    JOB_RELEASE: 'Giải ngân công việc',
    JOB_REFUND: 'Hoàn tiền công việc',
    JOB_RESERVE: 'Tạm giữ phí công việc',
    JOB_RESERVE_REFUND: 'Hoàn tiền phí tạm giữ',
    APPOINTMENT_BOOKING: 'Đặt lịch hẹn',
    APPOINTMENT_RELEASE: 'Giải ngân lịch hẹn',
    APPOINTMENT_REFUND: 'Hoàn tiền lịch hẹn',
    BONUS_CREDIT: 'Tiền thưởng',
  }

  const translateTxnNote = (note: string) => {
    if (!note) return note
    if (note.includes('Refund mentor session payment')) return note.replace('Refund mentor session payment', 'Hoàn tiền thanh toán buổi mentoring')
    if (note.includes('Mentor session payment')) return note.replace('Mentor session payment', 'Thanh toán buổi mentoring')
    if (note.includes('Mentor session release')) return note.replace('Mentor session release', 'Giải ngân buổi mentoring')
    if (note.includes('Job payment')) return note.replace('Job payment', 'Thanh toán công việc')
    if (note.includes('Job release')) return note.replace('Job release', 'Giải ngân công việc')
    if (note.includes('Job refund')) return note.replace('Job refund', 'Hoàn tiền công việc')
    if (note.includes('Reserve job budget')) return note.replace('Reserve job budget before mentor selection', 'Tạm giữ ngân sách trước khi chọn mentor')
    if (note.includes('Release job reserve')) return note.replace('Release job reserve back to client wallet', 'Hoàn lại phí tạm giữ công việc vào ví')
    return note
  }

  const txnColors: Record<string, { bg: string; text: string; sign: string }> = {
    DEPOSIT: { bg: 'bg-green-50', text: 'text-green-600', sign: '+' },
    JOB_REFUND: { bg: 'bg-green-50', text: 'text-green-600', sign: '+' },
    JOB_RESERVE_REFUND: { bg: 'bg-green-50', text: 'text-green-600', sign: '+' },
    APPOINTMENT_REFUND: { bg: 'bg-green-50', text: 'text-green-600', sign: '+' },
    WITHDRAWAL_REFUND: { bg: 'bg-green-50', text: 'text-green-600', sign: '+' },
    BONUS_CREDIT: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-500', sign: '+' },
    WITHDRAWAL: { bg: 'bg-red-50', text: 'text-red-600', sign: '-' },
    JOB_PAYMENT: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600', sign: '-' },
    JOB_RESERVE: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600', sign: '-' },
    COURSE_PURCHASE: { bg: 'bg-blue-50', text: 'text-blue-600', sign: '-' },
    APPOINTMENT_BOOKING: { bg: 'bg-blue-50', text: 'text-blue-600', sign: '-' },
  }

  const handleSuccess = () => {
    refetchBalance()
    refetchWallets()
    refetchTransactions()
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Ví của tôi</h1>
        <p className="text-gray-500 mt-1">Quản lý số dư MXC của bạn</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Total Balance - Hero Card */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white dark:bg-slate-950/5 rounded-full blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-primary-100">Tổng số dư</h3>
              <Wallet className="w-6 h-6 text-primary-200" />
            </div>
            <p className="text-3xl font-bold">{formatMxc(userBalance?.total || 0)}</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[10px] text-primary-200 uppercase tracking-wider font-semibold">Khả dụng</p>
                <p className="text-base font-bold">{formatMxc(availableWallet?.balanceMxc ?? userBalance?.available ?? 0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-primary-200 uppercase tracking-wider font-semibold">Chờ xử lý</p>
                <p className="text-base font-bold">{formatMxc(pendingWallet?.balanceMxc ?? userBalance?.pending ?? 0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-primary-200 uppercase tracking-wider font-semibold">Đang tạm giữ</p>
                <p className="text-base font-bold">{formatMxc(escrowWallet?.balanceMxc ?? 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-wallets */}
        {wallets?.filter(w => ['USER_AVAILABLE', 'USER_PENDING', 'ESCROW'].includes(w.accountType)).map((wallet) => (
          <div key={wallet.id} className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {walletTypeLabels[wallet.accountType] || wallet.accountType.replace(/_/g, ' ')}
              </h3>
              <div className={`w-2 h-2 rounded-full ${
                wallet.accountType === 'USER_AVAILABLE' ? 'bg-green-500' :
                wallet.accountType === 'USER_PENDING' ? 'bg-amber-500' : 'bg-blue-500'
              }`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{formatMxc(wallet.balanceMxc)}</p>
            <p className="text-[10px] text-gray-400">
              Cập nhật lần cuối: {formatDateTime(wallet.updatedAt)}
            </p>
          </div>
        ))}

        {(!wallets || wallets.length === 0) && (
          <>
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-3" />
              <div className="h-7 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mb-1" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
            </div>
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-3" />
              <div className="h-7 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mb-1" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
            </div>
          </>
        )}
      </div>

      {/* Actions + History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Tabs */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-gray-50 dark:bg-gray-900/50 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`min-w-0 flex-1 basis-[calc(50%-0.125rem)] items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all sm:basis-0 sm:text-sm ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 dark:bg-gray-800/50 hover:text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="flex min-w-0 items-center justify-center gap-1.5">
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </span>
              </button>
            ))}
          </div>

          {activeTab === 'deposit' && <DepositForm userId={user.userId} onSuccess={handleSuccess} />}
          {activeTab === 'withdraw' && (
            <WithdrawalForm
              userId={user.userId}
              onSuccess={handleSuccess}
              onOpenPayoutSetup={() => setActiveTab('bank-accounts')}
            />
          )}
          {activeTab === 'transfer' && <TransferForm userId={user.userId} onSuccess={handleSuccess} />}
          {activeTab === 'bank-accounts' && <BankAccountSettings userId={user.userId} />}
        </div>

        {/* Transaction History */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Giao dịch gần đây</h2>
            <select
              value={txnFilter}
              onChange={(e) => {
                setTxnFilter(e.target.value as any)
                setPage(0)
              }}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 w-full sm:w-auto cursor-pointer"
            >
              <option value="ALL">Tất cả giao dịch</option>
              <option value={TxnType.DEPOSIT}>Nạp tiền</option>
              <option value={TxnType.WITHDRAWAL}>Rút tiền</option>
              <option value={TxnType.WITHDRAWAL_REFUND}>Hoàn tiền rút</option>
              <option value={TxnType.JOB_PAYMENT}>Thanh toán công việc</option>
              <option value={TxnType.JOB_RELEASE}>Giải ngân công việc</option>
              <option value={TxnType.JOB_REFUND}>Hoàn tiền công việc</option>
              <option value={TxnType.JOB_RESERVE}>Tạm giữ phí công việc</option>
              <option value={TxnType.JOB_RESERVE_REFUND}>Hoàn tiền phí tạm giữ</option>
              <option value={TxnType.APPOINTMENT_BOOKING}>Đặt lịch hẹn</option>
              <option value={TxnType.APPOINTMENT_RELEASE}>Giải ngân lịch hẹn</option>
              <option value={TxnType.APPOINTMENT_REFUND}>Hoàn tiền lịch hẹn</option>
              <option value={TxnType.BONUS_CREDIT}>Tiền thưởng</option>
            </select>
          </div>
          
          {transactions?.content && transactions.content.length > 0 ? (
            <>
              <div className="space-y-3">
                {transactions.content.map((txn) => {
                  const style = txnColors[txn.txnType] || { bg: 'bg-gray-50 dark:bg-gray-900/50', text: 'text-gray-600 dark:text-gray-400', sign: '' }
                  return (
                    <TransactionItem key={txn.id} txn={txn} style={style} txnTypeLabels={txnTypeLabels} translateTxnNote={translateTxnNote} />
                  )
                })}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:bg-slate-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Trang {page + 1} / {transactions.totalPages || 1}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={transactions.last}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:bg-slate-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">Chưa có giao dịch nào</p>
              <p className="text-xs text-gray-400 mt-1">Lịch sử giao dịch của bạn sẽ hiển thị tại đây</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <span className="break-words text-left font-semibold text-slate-900 dark:text-slate-100 sm:max-w-[55%] sm:text-right">{value}</span>
    </div>
  )
}

function TransactionItem({ txn, style, txnTypeLabels, translateTxnNote }: { txn: WalletTransactionResponse; style: any; txnTypeLabels: Record<string, string>; translateTxnNote: (n: string) => string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { data: withdrawal } = useQuery(
    ['withdrawal', txn.referenceId],
    () => walletApi.getWithdrawalStatus(txn.referenceId as string),
    { enabled: isExpanded && (txn.referenceType === 'WITHDRAWAL' || txn.txnType.includes('WITHDRAWAL')) && !!txn.referenceId }
  )

  return (
    <div 
      className="rounded-2xl border border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:bg-gray-900/30 cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`mt-0.5 w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center shadow-sm`}>
            {txn.direction === 'CREDIT' ? (
              <ArrowDownCircle className={`w-5 h-5 ${style.text}`} />
            ) : (
              <ArrowUpCircle className={`w-5 h-5 ${style.text}`} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase">{txnTypeLabels[txn.txnType] || txn.txnType.replace(/_/g, ' ')}</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
              <Clock className="w-3 h-3" />
              {formatDateTime(txn.createdAt)}
            </p>
            {txn.note && (
              <p className="mt-2 break-words text-xs text-slate-500 dark:text-slate-400">{translateTxnNote(txn.note)}</p>
            )}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className={`text-sm font-bold ${style.text}`}>
            {txn.direction === 'CREDIT' ? '+' : '-'}{formatMxc(txn.amountMxc)}
          </p>
          <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
            txn.txnStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
            txn.txnStatus === 'PENDING' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}>
            {txn.txnStatus}
          </p>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-3 text-xs text-slate-600 dark:text-slate-400 cursor-default" onClick={e => e.stopPropagation()}>
          {txn.originalAmount && txn.originalCurrency && (
            <MetaRow
              icon={<ArrowRightLeft className="h-3.5 w-3.5 text-slate-400" />}
              label="Số tiền gốc"
              value={formatFiatCurrency(txn.originalAmount, txn.originalCurrency)}
            />
          )}
          {txn.exchangeRateToVnd && txn.originalCurrency && (
            <MetaRow
              icon={<ShieldCheck className="h-3.5 w-3.5 text-slate-400" />}
              label="Tỷ giá"
              value={formatExchangeRate(txn.exchangeRateToVnd, txn.originalCurrency, 'VND')}
            />
          )}
          {txn.convertedAmountVnd && (
            <MetaRow
              icon={<Wallet className="h-3.5 w-3.5 text-slate-400" />}
              label="Số tiền chuyển đổi"
              value={formatFiatCurrency(txn.convertedAmountVnd, 'VND')}
            />
          )}
          <MetaRow
            icon={<Landmark className="h-3.5 w-3.5 text-slate-400" />}
            label="Cổng thanh toán"
            value={txn.gateway || 'Sổ cái nội bộ'}
          />
          <MetaRow
            icon={<Hash className="h-3.5 w-3.5 text-slate-400" />}
            label="Mã giao dịch"
            value={txn.id}
          />
          {txn.referenceId && (
            <MetaRow
              icon={<Link className="h-3.5 w-3.5 text-slate-400" />}
              label="Mã tham chiếu"
              value={txn.referenceId}
            />
          )}
          {withdrawal && (
            <div className="mt-3 space-y-3 border-t border-slate-200 dark:border-slate-800 pt-3">
              <pre className="text-[10px] overflow-auto max-w-full p-2 bg-slate-100 rounded">DEBUG: {JSON.stringify(withdrawal, null, 2)}</pre>
              {withdrawal.rejectionReason && (
                 <div className="rounded-lg bg-red-50 p-3 text-red-700 border border-red-100">
                   <p className="font-semibold mb-1 text-sm">Lý do từ chối:</p>
                   <p>{withdrawal.rejectionReason}</p>
                 </div>
              )}
              {(withdrawal.bankName || withdrawal.payoutMethod || withdrawal.bankAccountNo || withdrawal.payoutReference || withdrawal.gatewayTxnId || withdrawal.payoutProofUrl) && (
                 <div className="rounded-lg bg-white dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
                   <p className="font-semibold mb-3 text-sm text-slate-800 dark:text-slate-200">Thông tin nhận tiền</p>
                   <div className="grid gap-2">
                     {(withdrawal.bankName || withdrawal.payoutMethod) && <MetaRow icon={<Landmark className="h-3.5 w-3.5 text-slate-400" />} label="Ngân hàng" value={(withdrawal.bankName || withdrawal.payoutMethod) as string} />}
                     {(withdrawal.bankAccountName || withdrawal.userFullName || withdrawal.user?.fullName) && <MetaRow icon={<Wallet className="h-3.5 w-3.5 text-slate-400" />} label="Tên tài khoản" value={(withdrawal.bankAccountName || withdrawal.userFullName || withdrawal.user?.fullName) as string} />}
                     {(withdrawal.bankAccountNo || withdrawal.payoutReference) && <MetaRow icon={<ShieldCheck className="h-3.5 w-3.5 text-slate-400" />} label="Số tài khoản" value={(withdrawal.bankAccountNo || withdrawal.payoutReference) as string} />}
                     {withdrawal.gatewayTxnId && (
                       <MetaRow icon={<Hash className="h-3.5 w-3.5 text-slate-400" />} label="Mã GD ngân hàng" value={withdrawal.gatewayTxnId} />
                     )}
                   </div>
                   {withdrawal.payoutProofUrl && (
                     <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                       <p className="font-medium text-xs text-slate-500 dark:text-slate-400 mb-2">Bằng chứng chuyển khoản:</p>
                       <a href={withdrawal.payoutProofUrl} target="_blank" rel="noopener noreferrer" className="block max-w-[200px] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 hover:border-primary-500 transition-colors">
                         <img src={withdrawal.payoutProofUrl} alt="Bằng chứng chi trả" className="w-full h-auto object-cover" />
                       </a>
                     </div>
                   )}
                 </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
