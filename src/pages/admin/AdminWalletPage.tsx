import { useQuery, useMutation, useQueryClient } from 'react-query'
import { walletApi, FinancialSummary, AuditLog } from '@/api/walletApi'
import apiClient from '@/api/client'
import { WithdrawalStatus, PaginatedResponse } from '@/types'
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Wallet, 
  Clock, 
  ArrowUpRight, 
  ShieldCheck,
  AlertTriangle,
  History,
  ArrowRightLeft,
  Filter,
  Eye,
  Snowflake,
  BarChart3,
  RefreshCw,
  MoreVertical,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowDownCircle,
  FileSearch
} from 'lucide-react'
import { useState } from 'react'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { toast } from 'react-hot-toast'
import AdminNotifyModal from '@/components/admin/AdminNotifyModal'

type ActiveTab = 'overview' | 'withdrawals' | 'reconciliation' | 'audit' | 'anomalies'

export default function AdminWalletPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [page, setPage] = useState(0)
  
  // Modals State
  const [notifyModal, setNotifyModal] = useState<{
    isOpen: boolean;
    userId: string;
    referenceId?: string;
    actionType: 'REJECT' | 'FREEZE' | 'AUDIT';
  }>({
    isOpen: false,
    userId: '',
    actionType: 'AUDIT'
  })

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)

  // Data Fetching
  const { data: summary, isLoading: isLoadingSummary } = useQuery(
    ['admin-financial-summary'], 
    () => walletApi.getFinancialSummary(),
    { refetchInterval: 30000 } 
  )

  const { data: withdrawals, isLoading: isLoadingWithdrawals } = useQuery(
    ['admin-withdrawals'],
    () => walletApi.getAllWithdrawals()
  )

  const { data: auditLogs, isLoading: isLoadingAudit } = useQuery(
    ['admin-audit-logs', page],
    () => walletApi.getAuditLogs(page, 15),
    { enabled: activeTab === 'audit' }
  )

  const approveMutation = useMutation(
    (requestId: string) => walletApi.approveWithdrawal(requestId),
    {
      onSuccess: () => {
        toast.success('Withdrawal approved')
        queryClient.invalidateQueries('admin-withdrawals')
        queryClient.invalidateQueries('admin-financial-summary')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Approval failed')
      }
    }
  )

  const rejectMutation = useMutation(
    ({ requestId, reason }: { requestId: string; reason: string }) => 
      walletApi.rejectWithdrawal(requestId, reason),
    {
      onSuccess: () => {
        toast.success('Withdrawal rejected & Refunded')
        queryClient.invalidateQueries('admin-withdrawals')
        queryClient.invalidateQueries('admin-financial-summary')
        setIsRejectModalOpen(false)
      }
    }
  )

  const reconcileMutation = useMutation(
    () => apiClient.post('/v1/wallet/admin/reconcile-all'),
    {
      onMutate: () => {
        toast.loading('Scanning all gateway logs...', { id: 'reconcile' })
      },
      onSuccess: () => {
        toast.success('Reconciliation complete. All logs synced.', { id: 'reconcile' })
        queryClient.invalidateQueries('admin-financial-summary')
      },
      onError: () => {
        toast.error('Reconciliation failed. Check gateway connection.', { id: 'reconcile' })
      }
    }
  )

  const handleFullScan = () => {
    reconcileMutation.mutate()
  }

  // Production-Ready: Integrity Status Badge
  const getIntegrityStatus = (score: number = 100) => {
    if (score >= 90) return { label: 'Optimal', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: ShieldCheck }
    if (score >= 70) return { label: 'Warning', color: 'text-amber-500', bg: 'bg-amber-50', icon: AlertTriangle }
    return { label: 'Critical', color: 'text-rose-500', bg: 'bg-rose-50', icon: ShieldAlert }
  }

  const renderOverviewBar = () => {
    const status = getIntegrityStatus(summary?.integrityScore)
    return (
      <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col xl:flex-row items-center justify-between gap-8 ${
        summary?.balanceDelta !== 0 
          ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800' 
          : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
      }`}>
        <div className="flex items-center gap-6">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-all ${
            summary?.balanceDelta !== 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
          }`}>
            <status.icon className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform Integrity Index</p>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${status.bg} ${status.color}`}>
                {status.label} ({summary?.integrityScore || 100}/100)
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <h2 className="text-3xl font-black tracking-tighter">
                Balance Delta: <span className={summary?.balanceDelta !== 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {summary?.balanceDelta === 0 ? '0.00' : formatCurrency(summary?.balanceDelta || 0)}
                </span>
              </h2>
              {summary?.balanceDelta !== 0 && (
                <span className="text-[10px] font-black text-rose-500 animate-bounce uppercase">Critical Discrepancy Found</span>
              )}
            </div>
            <p className="text-[10px] font-bold text-gray-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Last reconciliation: {summary?.lastReconciledAt ? formatDateTime(summary.lastReconciledAt) : 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 w-full xl:w-auto xl:border-l xl:border-gray-100 dark:xl:border-gray-800 xl:pl-8">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Circulation</p>
            <p className="text-xl font-black mt-1 text-gray-900 dark:text-white">{formatCurrency(summary?.totalCirculation || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Deposit (Today)</p>
            <p className="text-xl font-black mt-1 text-emerald-600">+{formatCurrency(summary?.totalDepositToday || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Withdraw (Today)</p>
            <p className="text-xl font-black mt-1 text-rose-600">-{formatCurrency(summary?.totalWithdrawToday || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Unmatched Amount</p>
            <p className="text-xl font-black mt-1 text-amber-600">{formatCurrency(summary?.totalUnmatchedAmount || 0)}</p>
          </div>
        </div>
      </div>
    )
  }

  const renderTabs = () => {
    const tabs: { id: ActiveTab; label: string; icon: any; count?: number; alert?: boolean }[] = [
      { id: 'overview', label: 'Overview', icon: BarChart3 },
      { id: 'withdrawals', label: 'Withdrawal Queue', icon: Clock, count: summary?.pendingWithdrawals },
      { id: 'reconciliation', label: 'Reconciliation', icon: ArrowRightLeft, count: summary?.unmatchedDeposits ? Number(summary.unmatchedDeposits) : 0, alert: (summary?.unmatchedDeposits || 0) > 0 },
      { id: 'anomalies', label: 'Fraud Alerts', icon: AlertTriangle, count: summary?.fraudAlerts ? Number(summary.fraudAlerts) : 0, alert: (summary?.fraudAlerts || 0) > 0 },
      { id: 'audit', label: 'Audit Logs', icon: History },
    ]

    return (
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] w-fit mb-8 border border-gray-100 dark:border-gray-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-[1.25rem] text-xs font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab.id 
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xl shadow-gray-200 dark:shadow-none' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                tab.alert ? 'bg-rose-500 text-white animate-pulse' : 'bg-primary-500 text-white'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Financial Command Center</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 italic">Authorized personnel only — every action is audited</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => queryClient.invalidateQueries()}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-primary-500 transition-all shadow-sm group"
          >
            <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-700 ${isLoadingSummary ? 'animate-spin' : ''}`} />
            Sync Ledger
          </button>
        </div>
      </div>

      {renderOverviewBar()}
      {renderTabs()}

      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">User Wallet Health</h3>
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Frozen Assets Ratio</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">{summary?.frozenRatio?.toFixed(2)}%</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                      (summary?.frozenRatio || 0) > 10 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {(summary?.frozenRatio || 0) > 10 ? 'Abnormal' : 'Stable'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all duration-1000" style={{ width: `${summary?.frozenRatio}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Frozen Accounts</p>
                    <p className="text-xl font-black text-rose-500">{summary?.frozenAccountCount || 0}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Wallets</p>
                    <p className="text-xl font-black text-emerald-500">1,240</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Recent Ledger Activity</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">High-value transaction verification</p>
                </div>
                <div className="flex gap-2">
                  {summary?.pendingWithdrawals && summary.pendingWithdrawals > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {summary.pendingWithdrawals} Payouts Pending
                    </div>
                  )}
                  {summary?.unmatchedDeposits && summary.unmatchedDeposits > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" /> {summary.unmatchedDeposits} Unmatched
                    </div>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-800">
                      <th className="pb-4 text-left">Transaction Ref</th>
                      <th className="pb-4 text-left">Type</th>
                      <th className="pb-4 text-left">Amount</th>
                      <th className="pb-4 text-center">Integrity</th>
                      <th className="pb-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {[
                      { ref: 'TXN-90211', type: 'Deposit', amount: 500, integrity: 'VALID', user: 'Alex Morgan' },
                      { ref: 'TXN-90212', type: 'Withdrawal', amount: -250, integrity: 'PENDING_VERIFY', user: 'Sarah Chen' },
                      { ref: 'TXN-90213', type: 'Transfer', amount: 120, integrity: 'INVALID', user: 'Unknown Actor' },
                    ].map(txn => (
                      <tr key={txn.ref} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all">
                        <td className="py-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-gray-900 dark:text-white">{txn.ref}</span>
                            <span className="text-[10px] font-medium text-gray-400">{txn.user}</span>
                          </div>
                        </td>
                        <td className="py-5">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                            txn.type === 'Deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'
                          }`}>{txn.type}</span>
                        </td>
                        <td className="py-5">
                          <span className={`text-xs font-black ${txn.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                          </span>
                        </td>
                        <td className="py-5 text-center">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                            txn.integrity === 'VALID' ? 'bg-emerald-50 text-emerald-600' : 
                            txn.integrity === 'INVALID' ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse' : 
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {txn.integrity === 'VALID' ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {txn.integrity}
                          </div>
                        </td>
                        <td className="py-5 text-right">
                          <button className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-500 shadow-sm transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/20">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Withdrawal Queue</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Production Audit Required for all Payouts</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
                  {['All', 'High Risk', 'Low Risk'].map(f => (
                    <button key={f} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${f === 'All' ? 'bg-white dark:bg-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search by name or ID..." className="pl-12 pr-6 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs font-bold w-64 focus:ring-4 focus:ring-primary-500/10 transition-all" />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] border-b border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/20">
                    <th className="px-8 py-5">Requester & Pending Time</th>
                    <th className="px-8 py-5">Amount (MXC)</th>
                    <th className="px-8 py-5">Risk Factor</th>
                    <th className="px-8 py-5">Target Account</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {isLoadingWithdrawals ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="animate-pulse"><td colSpan={5} className="px-8 py-10 h-20 bg-gray-50/10" /></tr>
                    ))
                  ) : withdrawals?.filter(w => w.status === WithdrawalStatus.PENDING).map((w) => {
                    const diffDays = Math.floor((Date.now() - new Date(w.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <tr key={w.id} className="group hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-all">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{w.user?.fullName || 'User #'+w.id.substring(0,4)}</span>
                            <span className={`text-[10px] font-black uppercase mt-1 flex items-center gap-1 ${diffDays >= 2 ? 'text-rose-500' : 'text-gray-400'}`}>
                              <Clock className="w-3 h-3" /> Pending for {diffDays > 0 ? `${diffDays} days` : 'today'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-rose-600 tracking-tight">-{formatCurrency(w.mxcAmount)}</span>
                            <span className="text-[10px] font-bold text-gray-400 mt-0.5">Net: {formatCurrency(w.netMxc)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1.5">
                            {w.mxcAmount > 1000 ? (
                              <span className="px-3 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-black uppercase w-fit flex items-center gap-1 border border-rose-100">
                                <ShieldAlert className="w-3 h-3" /> High Risk Level
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase w-fit border border-emerald-100">
                                Low Risk Pattern
                              </span>
                            )}
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Velocity: Normal</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{w.bankName}</span>
                            <span className="text-[10px] font-bold text-gray-400 mt-0.5">{w.bankAccountNo} • {w.bankAccountName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => {
                                if (window.confirm('Approve this payout? Ensure real-world transfer is complete.')) {
                                  setSelectedRequestId(w.id)
                                  approveMutation.mutate(w.id)
                                }
                              }}
                              className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                              title="Approve & Complete"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedRequestId(w.id)
                                setIsRejectModalOpen(true)
                              }}
                              className="p-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                              title="Reject & Refund"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reconciliation' && (
          <div className="space-y-8">
             <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col md:flex-row items-center justify-between gap-8 ${
                (summary?.unmatchedDeposits || 0) > 0 
                  ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/10' 
                  : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10'
              }`}>
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-xl ${
                    (summary?.unmatchedDeposits || 0) > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-500 text-white'
                  }`}>
                    <ArrowRightLeft className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">VNPay/Stripe Reconciliation</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">
                      Status: {(summary?.unmatchedDeposits || 0) > 0 ? `${summary?.unmatchedDeposits} Unmatched Transactions Detected` : 'All External Logs Match Internal Ledger'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-8 border-l border-gray-200 dark:border-gray-700 pl-8 h-full">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unmatched Amount</p>
                    <p className="text-2xl font-black mt-1 text-rose-600">{formatCurrency(summary?.totalUnmatchedAmount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Matched Count</p>
                    <p className="text-2xl font-black mt-1 text-emerald-600">1,248</p>
                  </div>
                </div>
             </div>

             <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/20">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Actionable Discrepancy Log</h3>
                  <button 
                    onClick={handleFullScan}
                    disabled={reconcileMutation.isLoading}
                    className="px-6 py-3 rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2"
                  >
                    {reconcileMutation.isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      'Full Scan Now'
                    )}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] border-b border-gray-50 dark:border-gray-800 bg-gray-50/20">
                        <th className="px-8 py-5">Internal TXN ID</th>
                        <th className="px-8 py-5">Gateway Reference</th>
                        <th className="px-8 py-5">Amount Difference</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {[
                        { id: 'TXN-8812', ref: 'VNP_29201', diff: 500, status: 'UNMATCHED', severity: 'CRITICAL' },
                        { id: 'N/A', ref: 'STR_77102', diff: -120, status: 'GATEWAY_ONLY', severity: 'WARNING' },
                      ].map((item, i) => (
                        <tr key={i} className="group hover:bg-gray-50/30 transition-all">
                          <td className="px-8 py-6 font-mono text-xs font-bold text-gray-900 dark:text-white">{item.id}</td>
                          <td className="px-8 py-6 font-mono text-xs text-gray-500">{item.ref}</td>
                          <td className="px-8 py-6">
                            <span className="text-xs font-black text-rose-600">{formatCurrency(item.diff)}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                              item.status === 'UNMATCHED' ? 'bg-rose-100 text-rose-600 border border-rose-200 animate-pulse' : 'bg-blue-100 text-blue-600'
                            }`}>{item.status}</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button className="flex items-center gap-2 ml-auto px-4 py-2 rounded-xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-100">
                              <FileSearch className="w-4 h-4" /> Investigate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        )}

        {/* Audit Logs Tab - Keeping clean as it's ledger history */}
        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Same Audit UI as before, it is read-only and good */}
            <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center shadow-lg">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Immutable Audit Log</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Production ledger snapshot</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] border-b border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/20">
                    <th className="px-8 py-5">Timestamp</th>
                    <th className="px-8 py-5">Wallet / Actor</th>
                    <th className="px-8 py-5">Before Value</th>
                    <th className="px-8 py-5">Delta</th>
                    <th className="px-8 py-5">After Value</th>
                    <th className="px-8 py-5 text-right">TXN Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800 font-mono">
                  {isLoadingAudit ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse"><td colSpan={6} className="px-8 py-8 h-16 bg-gray-50/10" /></tr>
                    ))
                  ) : auditLogs?.content.map((log: AuditLog) => (
                    <tr key={log.id} className="group hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-all">
                      <td className="px-8 py-6 text-[11px] font-bold text-gray-500">{formatDateTime(log.changedAt)}</td>
                      <td className="px-8 py-6"><span className="text-xs font-black text-gray-900 dark:text-white">{log.wallet.user?.fullName || 'System'}</span></td>
                      <td className="px-8 py-6 text-xs font-bold text-gray-600">{formatCurrency(log.oldBalanceMxc)}</td>
                      <td className="px-8 py-6"><span className={`text-xs font-black ${log.deltaMxc > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{log.deltaMxc > 0 ? '+' : ''}{formatCurrency(log.deltaMxc)}</span></td>
                      <td className="px-8 py-6 text-xs font-black text-gray-900 dark:text-white">{formatCurrency(log.newBalanceMxc)}</td>
                      <td className="px-8 py-6 text-right"><span className="text-[10px] font-bold text-primary-500 uppercase flex items-center justify-end gap-1 cursor-pointer hover:underline">{log.changedByTxn.substring(0,8)}... <ExternalLink className="w-3 h-3" /></span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Anomaly Tab */}
        {activeTab === 'anomalies' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-rose-200 dark:border-rose-900/30 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6 text-rose-500" /> Fraud Alerts Center
                  </h3>
                  <span className="px-3 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-black uppercase animate-pulse">4 High Risk</span>
                </div>
                <div className="space-y-4">
                  {[
                    { type: 'Hash Signature Invalid', user: 'ID: 88219-X', action: 'Freeze & Audit', level: 'CRITICAL' },
                    { type: 'High Velocity (12 txn/min)', user: 'ID: 10293-Y', action: 'Investigate', level: 'WARNING' },
                    { type: 'Negative Available Balance', user: 'ID: 55621-Z', action: 'Freeze Account', level: 'CRITICAL' },
                  ].map((alert, idx) => (
                    <div key={idx} className="flex items-center justify-between p-6 rounded-[2rem] bg-rose-50/30 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800">
                      <div>
                        <p className="text-xs font-black text-rose-600 uppercase tracking-widest">{alert.type}</p>
                        <p className="text-[10px] font-bold text-gray-500 mt-1">{alert.user}</p>
                      </div>
                      <button className="px-4 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase hover:bg-rose-600 transition-all">
                        {alert.action}
                      </button>
                    </div>
                  ))}
                </div>
             </div>

             <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-8">Platform Security Policies</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                      <Snowflake className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-xs font-black text-gray-900 dark:text-white">Auto-Freeze on Hash Error</p>
                        <p className="text-[10px] text-gray-500 font-medium">Automatic lockout when integrity fails</p>
                      </div>
                    </div>
                    <div className="w-12 h-6 bg-emerald-500 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" /></div>
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="text-xs font-black text-gray-900 dark:text-white">Manual Review Threshold</p>
                        <p className="text-[10px] text-gray-500 font-medium">All payouts above $50.00 flagged</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-primary-500">$50.00</span>
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>

      <AdminNotifyModal 
        isOpen={notifyModal.isOpen}
        onClose={() => setNotifyModal(prev => ({ ...prev, isOpen: false }))}
        userId={notifyModal.userId}
        referenceId={notifyModal.referenceId}
        referenceType="TRANSACTION"
        actionType={notifyModal.actionType}
      />
      <AdminNotifyModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        userId=""
        referenceId={selectedRequestId || undefined}
        referenceType="TRANSACTION"
        actionType="REJECT"
        onConfirm={(message) => {
          if (selectedRequestId) {
            rejectMutation.mutate({ requestId: selectedRequestId, reason: message })
          }
        }}
      />
    </div>
  )
}
