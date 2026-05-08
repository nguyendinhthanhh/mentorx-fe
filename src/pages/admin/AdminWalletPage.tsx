import { useQuery, useMutation, useQueryClient } from 'react-query'
import { walletApi } from '@/api/walletApi'
import apiClient from '@/api/client'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  ShieldCheck,
  MoreVertical,
  ExternalLink
} from 'lucide-react'
import { useState } from 'react'
import { WithdrawalResponse, WithdrawalStatus, ApiResponse } from '@/types'

export default function AdminWalletPage() {
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState<WithdrawalStatus | 'ALL'>('ALL')

  // Using a manual call since we didn't add listWithdrawals to walletApi.ts yet
  const { data: withdrawals, isLoading } = useQuery(
    ['adminWithdrawals', filterStatus],
    async () => {
      const response = await apiClient.get<ApiResponse<WithdrawalResponse[]>>('/v1/wallet/admin/withdrawals')
      return response.data.data
    }
  )

  const { data: totalLocked } = useQuery('adminTotalLocked', () => walletApi.getTotalEscrowLocked())

  const approveMutation = useMutation(
    ({ id, txId }: { id: string; txId: string }) => 
      apiClient.post(`/v1/wallet/admin/withdraw/${id}/approve?gatewayTxnId=${txId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminWithdrawals')
        alert('Withdrawal approved successfully!')
      }
    }
  )

  const rejectMutation = useMutation(
    ({ id, reason }: { id: string; reason: string }) => 
      apiClient.post(`/v1/wallet/admin/withdraw/${id}/reject?reason=${reason}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminWithdrawals')
        alert('Withdrawal rejected and funds returned.')
      }
    }
  )

  const handleApprove = (id: string) => {
    const txId = prompt('Enter Gateway Transaction ID (e.g. Bank Transfer Ref):')
    if (txId) {
      approveMutation.mutate({ id, txId })
    }
  }

  const handleReject = (id: string) => {
    const reason = prompt('Enter rejection reason:')
    if (reason) {
      rejectMutation.mutate({ id, reason })
    }
  }

  const stats = [
    { label: 'Total Escrow Locked', value: formatCurrency(totalLocked || 0), icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Withdrawals', value: withdrawals?.filter(w => w.status === 'PENDING').length || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Payouts (MXC)', value: formatCurrency(withdrawals?.filter(w => w.status === 'COMPLETED').reduce((acc, curr) => acc + curr.mxcAmount, 0) || 0), icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-sm text-gray-500">Monitor platform escrow and process withdrawals</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Withdrawal Requests */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary-500" />
            Withdrawal Requests
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search user..." 
                className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 w-full sm:w-64"
              />
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-gray-50 border-none rounded-xl text-sm px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">User & Date</th>
                <th className="px-6 py-4">Amount (MXC)</th>
                <th className="px-6 py-4">Real Payout</th>
                <th className="px-6 py-4">Bank Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-16 bg-gray-50/50" />
                  </tr>
                ))
              ) : withdrawals?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Clock className="w-10 h-10 text-gray-200 mb-2" />
                      <p className="font-medium">No withdrawal requests found</p>
                    </div>
                  </td>
                </tr>
              ) : withdrawals?.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{w.userId.split('-')[0]}</p>
                    <p className="text-[10px] text-gray-400">{formatDateTime(w.createdAt)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(w.mxcAmount)}</span>
                      <span className="text-[10px] text-gray-400">Fee: {formatCurrency(w.feeMxc)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-green-600">
                      {w.realAmount?.toLocaleString()} {w.realCurrency || 'VND'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-semibold text-gray-700">{w.bankName}</p>
                    <p className="text-[10px] text-gray-500">{w.bankAccountNo} • {w.bankAccountName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      w.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      w.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {w.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleApprove(w.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve & Payout"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleReject(w.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject & Refund"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <button className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
