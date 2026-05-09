import { useState } from 'react'
import { useQuery } from 'react-query'
import { useAuthStore } from '@/store/authStore'
import { walletApi } from '@/api/walletApi'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import DepositForm from '@/components/wallet/DepositForm'
import WithdrawalForm from '@/components/wallet/WithdrawalForm'
import TransferForm from '@/components/wallet/TransferForm'
import BankAccountSettings from '@/components/wallet/BankAccountSettings'
import { Wallet, ArrowDownCircle, ArrowUpCircle, Send, TrendingUp, Clock, Landmark } from 'lucide-react'

export default function WalletPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'transfer' | 'bank-accounts'>('deposit')

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

  const { data: transactions } = useQuery(
    ['transactions', user?.userId],
    () => walletApi.getUserTransactions(user!.userId, { page: 0, size: 10 }),
    { enabled: !!user?.userId }
  )

  if (!user) return null

  const tabs = [
    { key: 'deposit' as const, label: 'Deposit', icon: ArrowDownCircle, color: 'text-green-600' },
    { key: 'withdraw' as const, label: 'Withdraw', icon: ArrowUpCircle, color: 'text-red-600' },
    { key: 'transfer' as const, label: 'Transfer', icon: Send, color: 'text-blue-600' },
    { key: 'bank-accounts' as const, label: 'Banks', icon: Landmark, color: 'text-purple-600' },
  ]

  const txnColors: Record<string, { bg: string; text: string; sign: string }> = {
    DEPOSIT: { bg: 'bg-green-50', text: 'text-green-600', sign: '+' },
    JOB_REFUND: { bg: 'bg-green-50', text: 'text-green-600', sign: '+' },
    WITHDRAWAL_REFUND: { bg: 'bg-green-50', text: 'text-green-600', sign: '+' },
    BONUS_CREDIT: { bg: 'bg-purple-50', text: 'text-purple-600', sign: '+' },
    WITHDRAWAL: { bg: 'bg-red-50', text: 'text-red-600', sign: '-' },
    JOB_PAYMENT: { bg: 'bg-orange-50', text: 'text-orange-600', sign: '-' },
    COURSE_PURCHASE: { bg: 'bg-blue-50', text: 'text-blue-600', sign: '-' },
  }

  const handleSuccess = () => {
    refetchBalance()
    refetchWallets()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
        <p className="text-gray-500 mt-1">Manage your MXC token balance</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Total Balance - Hero Card */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-primary-100">Total Balance</h3>
              <Wallet className="w-6 h-6 text-primary-200" />
            </div>
            <p className="text-3xl font-bold">{formatCurrency(userBalance?.total || 0)}</p>
            <div className="flex gap-4 mt-4">
              <div>
                <p className="text-[10px] text-primary-200 uppercase tracking-wider font-semibold">Available</p>
                <p className="text-lg font-bold">{formatCurrency(userBalance?.available || 0)}</p>
              </div>
              <div className="w-px h-8 bg-white/20 my-auto" />
              <div>
                <p className="text-[10px] text-primary-200 uppercase tracking-wider font-semibold">Pending</p>
                <p className="text-lg font-bold">{formatCurrency(userBalance?.pending || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-wallets */}
        {wallets?.filter(w => ['USER_AVAILABLE', 'USER_PENDING', 'ESCROW'].includes(w.accountType)).map((wallet) => (
          <div key={wallet.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {wallet.accountType.replace(/_/g, ' ')}
              </h3>
              <div className={`w-2 h-2 rounded-full ${
                wallet.accountType === 'USER_AVAILABLE' ? 'bg-green-500' :
                wallet.accountType === 'USER_PENDING' ? 'bg-amber-500' : 'bg-blue-500'
              }`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(wallet.balanceMxc)}</p>
            <p className="text-[10px] text-gray-400">
              Last updated: {formatDateTime(wallet.updatedAt)}
            </p>
          </div>
        ))}

        {(!wallets || wallets.length === 0) && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-7 bg-gray-100 rounded w-2/3 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-7 bg-gray-100 rounded w-2/3 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          </>
        )}
      </div>

      {/* Actions + History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex gap-1 mb-6 bg-gray-50 p-1 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'deposit' && <DepositForm userId={user.userId} onSuccess={handleSuccess} />}
          {activeTab === 'withdraw' && <WithdrawalForm userId={user.userId} onSuccess={handleSuccess} />}
          {activeTab === 'transfer' && <TransferForm userId={user.userId} onSuccess={handleSuccess} />}
          {activeTab === 'bank-accounts' && <BankAccountSettings userId={user.userId} />}
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <button className="text-xs font-medium text-primary-600 hover:text-primary-700">View All</button>
          </div>
          
          {transactions?.content && transactions.content.length > 0 ? (
            <div className="space-y-1">
              {transactions.content.map((txn) => {
                const style = txnColors[txn.txnType] || { bg: 'bg-gray-50', text: 'text-gray-600', sign: '' }
                return (
                  <div key={txn.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors px-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center shadow-sm`}>
                        {txn.direction === 'CREDIT' ? (
                          <ArrowDownCircle className={`w-5 h-5 ${style.text}`} />
                        ) : (
                          <ArrowUpCircle className={`w-5 h-5 ${style.text}`} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{txn.txnType.replace(/_/g, ' ')}</p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(txn.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${style.text}`}>
                        {txn.direction === 'CREDIT' ? '+' : '-'}{formatCurrency(txn.amountMxc)}
                      </p>
                      <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        txn.txnStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        txn.txnStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {txn.txnStatus}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No transactions yet</p>
              <p className="text-xs text-gray-400 mt-1">Your transaction history will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
