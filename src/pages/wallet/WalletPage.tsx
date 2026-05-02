import { useState } from 'react'
import { useQuery } from 'react-query'
import { useAuthStore } from '@/store/authStore'
import { walletApi } from '@/api/walletApi'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { Wallet, ArrowUpCircle, ArrowDownCircle, Send } from 'lucide-react'
import DepositForm from '@/components/wallet/DepositForm'
import WithdrawalForm from '@/components/wallet/WithdrawalForm'
import TransferForm from '@/components/wallet/TransferForm'

export default function WalletPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit')

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

  const { data: totalBalance } = useQuery(
    ['totalBalance', user?.userId],
    () => walletApi.getTotalBalance(user!.userId),
    { enabled: !!user?.userId }
  )

  if (!user) return null

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Wallet</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Total Balance</h3>
            <Wallet className="w-8 h-8" />
          </div>
          <p className="text-4xl font-bold">{formatCurrency(totalBalance || 0)}</p>
        </div>

        {wallets?.map((wallet) => (
          <div key={wallet.walletId} className="card">
            <h3 className="text-lg font-semibold mb-2">{wallet.accountType} Wallet</h3>
            <p className="text-2xl font-bold text-primary-600">
              {formatCurrency(wallet.balanceMxc)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Available: {formatCurrency(wallet.availableBalanceMxc)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex space-x-2 mb-6 border-b">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`px-4 py-2 font-semibold ${
                activeTab === 'deposit'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4 inline mr-1" />
              Deposit
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`px-4 py-2 font-semibold ${
                activeTab === 'withdraw'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4 inline mr-1" />
              Withdraw
            </button>
            <button
              onClick={() => setActiveTab('transfer')}
              className={`px-4 py-2 font-semibold ${
                activeTab === 'transfer'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600'
              }`}
            >
              <Send className="w-4 h-4 inline mr-1" />
              Transfer
            </button>
          </div>

          {activeTab === 'deposit' && (
            <DepositForm userId={user.userId} onSuccess={refetchWallets} />
          )}
          {activeTab === 'withdraw' && (
            <WithdrawalForm userId={user.userId} onSuccess={refetchWallets} />
          )}
          {activeTab === 'transfer' && (
            <TransferForm userId={user.userId} onSuccess={refetchWallets} />
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {transactions?.content.map((txn) => (
              <div key={txn.txnId} className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-semibold">{txn.txnType}</p>
                  <p className="text-sm text-gray-600">{formatDateTime(txn.createdAt)}</p>
                  {txn.description && (
                    <p className="text-sm text-gray-500">{txn.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    txn.txnType === 'DEPOSIT' || txn.txnType === 'REFUND'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {txn.txnType === 'DEPOSIT' || txn.txnType === 'REFUND' ? '+' : '-'}
                    {formatCurrency(txn.amount)}
                  </p>
                  <p className="text-sm text-gray-600">{txn.status}</p>
                </div>
              </div>
            ))}
          </div>

          {transactions?.content.length === 0 && (
            <p className="text-center text-gray-600 py-8">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
