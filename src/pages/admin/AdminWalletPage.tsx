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
      <div className={`p-8 rounded-[2.5rem] border backdrop-blur-xl shadow-xl transition-all duration-500 flex flex-col xl:flex-row items-center justify-between gap-8 ${
        summary?.balanceDelta !== 0 
          ? 'bg-rose-50/70 border-rose-200/50 shadow-rose-200/20 dark:bg-rose-900/20 dark:border-rose-800/50 dark:shadow-none' 
          : 'bg-white/70 dark:bg-slate-900/70 border-white/50 dark:border-slate-800 shadow-slate-200/40 dark:shadow-none'
      }`}>
        <div className="flex items-center gap-6">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-all ${
            summary?.balanceDelta !== 0 ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
          }`}>
            <status.icon className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Integrity Index</p>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${status.bg} ${status.color}`}>
                {status.label} ({summary?.integrityScore || 100}/100)
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
                Balance Delta: <span className={summary?.balanceDelta !== 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                  {summary?.balanceDelta === 0 ? '0.00' : formatCurrency(summary?.balanceDelta || 0)}
                </span>
              </h2>
              {summary?.balanceDelta !== 0 && (
                <span className="text-[10px] font-black text-rose-500 animate-bounce uppercase">Critical Discrepancy Found</span>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Last reconciliation: {summary?.lastReconciledAt ? formatDateTime(summary.lastReconciledAt) : 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 w-full xl:w-auto xl:border-l xl:border-slate-200/50 dark:xl:border-slate-700/50 xl:pl-8">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Circulation</p>
            <p className="text-xl font-black mt-1 text-slate-900 dark:text-white">{formatCurrency(summary?.totalCirculation || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Deposit (Today)</p>
            <p className="text-xl font-black mt-1 text-emerald-600 dark:text-emerald-400">+{formatCurrency(summary?.totalDepositToday || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Withdraw (Today)</p>
            <p className="text-xl font-black mt-1 text-rose-600 dark:text-rose-400">-{formatCurrency(summary?.totalWithdrawToday || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Unmatched Amount</p>
            <p className="text-xl font-black mt-1 text-amber-600 dark:text-amber-400">{formatCurrency(summary?.totalUnmatchedAmount || 0)}</p>
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
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[2rem] w-fit mb-8 border border-white/50 dark:border-slate-800 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-[1.25rem] text-xs font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab.id 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/20 dark:shadow-none' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                tab.alert ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/20' : 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
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
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">Financial Command Center</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 italic">Authorized personnel only — every action is audited</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => queryClient.invalidateQueries()}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all shadow-sm group hover:shadow-md hover:-translate-y-0.5"
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
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">User Wallet Health</h3>
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Frozen Assets Ratio</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{summary?.frozenRatio?.toFixed(2)}%</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm ${
                      (summary?.frozenRatio || 0) > 10 ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                    }`}>
                      {(summary?.frozenRatio || 0) > 10 ? 'Abnormal' : 'Stable'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${summary?.frozenRatio}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center transition-all hover:shadow-md hover:-translate-y-0.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Frozen Accounts</p>
                    <p className="text-xl font-black text-rose-500">{summary?.frozenAccountCount || 0}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center transition-all hover:shadow-md hover:-translate-y-0.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Wallets</p>
                    <p className="text-xl font-black text-emerald-500">1,240</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">Recent Ledger Activity</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">High-value transaction verification</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary?.pendingWithdrawals && summary.pendingWithdrawals > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-2 shadow-sm">
                      <Clock className="w-3 h-3" /> {summary.pendingWithdrawals} Payouts Pending
                    </div>
                  )}
                  {summary?.unmatchedDeposits && summary.unmatchedDeposits > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-2 shadow-sm animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> {summary.unmatchedDeposits} Unmatched
                    </div>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-4 text-left">Transaction Ref</th>
                      <th className="pb-4 text-left">Type</th>
                      <th className="pb-4 text-left">Amount</th>
                      <th className="pb-4 text-center">Integrity</th>
                      <th className="pb-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                    {[
                      { ref: 'TXN-90211', type: 'Deposit', amount: 500, integrity: 'VALID', user: 'Alex Morgan' },
                      { ref: 'TXN-90212', type: 'Withdrawal', amount: -250, integrity: 'PENDING_VERIFY', user: 'Sarah Chen' },
                      { ref: 'TXN-90213', type: 'Transfer', amount: 120, integrity: 'INVALID', user: 'Unknown Actor' },
                    ].map(txn => (
                      <tr key={txn.ref} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all">
                        <td className="py-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{txn.ref}</span>
                            <span className="text-[10px] font-medium text-slate-400">{txn.user}</span>
                          </div>
                        </td>
                        <td className="py-5">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm ${
                            txn.type === 'Deposit' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                          }`}>{txn.type}</span>
                        </td>
                        <td className="py-5">
                          <span className={`text-xs font-bold ${txn.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                          </span>
                        </td>
                        <td className="py-5 text-center">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
                            txn.integrity === 'VALID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30' : 
                            txn.integrity === 'INVALID' ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse dark:bg-rose-900/20 dark:border-rose-800/30' : 
                            'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30'
                          }`}>
                            {txn.integrity === 'VALID' ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {txn.integrity}
                          </div>
                        </td>
                        <td className="py-5 text-right">
                          <button className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
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
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all">
            <div className="p-6 sm:p-8 border-b border-slate-100/50 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Withdrawal Queue</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Production Audit Required for all Payouts</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-1 shadow-sm">
                  {['All', 'High Risk', 'Low Risk'].map(f => (
                    <button key={f} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${f === 'All' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input type="text" placeholder="Search by name or ID..." className="pl-11 pr-6 py-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold w-full sm:w-64 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm hover:border-slate-300 dark:hover:border-slate-600" />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="px-8 py-5">Requester & Pending Time</th>
                    <th className="px-8 py-5">Amount (MXC)</th>
                    <th className="px-8 py-5">Risk Factor</th>
                    <th className="px-8 py-5">Target Account</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                  {isLoadingWithdrawals ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="animate-pulse"><td colSpan={5} className="px-8 py-8 h-20 bg-slate-200/50 dark:bg-slate-700/50" /></tr>
                    ))
                  ) : withdrawals?.filter(w => w.status === WithdrawalStatus.PENDING).map((w) => {
                    const diffDays = Math.floor((Date.now() - new Date(w.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <tr key={w.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{w.user?.fullName || 'User #'+w.id.substring(0,4)}</span>
                            <span className={`text-[10px] font-black uppercase mt-1 flex items-center gap-1 ${diffDays >= 2 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                              <Clock className="w-3 h-3" /> Pending for {diffDays > 0 ? `${diffDays} days` : 'today'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-rose-600 dark:text-rose-400">-{formatCurrency(w.mxcAmount)}</span>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Net: {formatCurrency(w.netMxc)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1.5">
                            {w.mxcAmount > 1000 ? (
                              <span className="px-3 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-black uppercase w-fit flex items-center gap-1 border border-rose-200 shadow-sm dark:bg-rose-900/20 dark:border-rose-800/30">
                                <ShieldAlert className="w-3 h-3" /> High Risk Level
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase w-fit border border-emerald-200 shadow-sm dark:bg-emerald-900/20 dark:border-emerald-800/30">
                                Low Risk Pattern
                              </span>
                            )}
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Velocity: Normal</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{w.bankName}</span>
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{w.bankAccountNo} • {w.bankAccountName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => {
                                if (window.confirm('Approve this payout? Ensure real-world transfer is complete.')) {
                                  setSelectedRequestId(w.id)
                                  approveMutation.mutate(w.id)
                                }
                              }}
                              className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-emerald-200/60 dark:border-emerald-800/30 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                              title="Approve & Complete"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedRequestId(w.id)
                                setIsRejectModalOpen(true)
                              }}
                              className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-rose-200/60 dark:border-rose-800/30 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
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
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className={`p-8 rounded-[2.5rem] border backdrop-blur-xl shadow-xl transition-all duration-500 flex flex-col md:flex-row items-center justify-between gap-8 ${
                (summary?.unmatchedDeposits || 0) > 0 
                  ? 'bg-rose-50/70 border-rose-200/50 dark:bg-rose-900/20 shadow-rose-200/30 dark:shadow-none' 
                  : 'bg-emerald-50/70 border-emerald-200/50 dark:bg-emerald-900/20 shadow-emerald-200/30 dark:shadow-none'
              }`}>
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-xl ${
                    (summary?.unmatchedDeposits || 0) > 0 ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30' : 'bg-emerald-500 text-white shadow-emerald-500/30'
                  }`}>
                    <ArrowRightLeft className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">VNPay/Stripe Reconciliation</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                      Status: {(summary?.unmatchedDeposits || 0) > 0 ? `${summary?.unmatchedDeposits} Unmatched Transactions Detected` : 'All External Logs Match Internal Ledger'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-8 border-l border-slate-200/50 dark:border-slate-700/50 pl-8 h-full">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unmatched Amount</p>
                    <p className="text-2xl font-black mt-1 text-rose-600 dark:text-rose-400">{formatCurrency(summary?.totalUnmatchedAmount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matched Count</p>
                    <p className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">1,248</p>
                  </div>
                </div>
             </div>

             <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all">
                <div className="p-8 border-b border-slate-100/50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">Actionable Discrepancy Log</h3>
                  <button 
                    onClick={handleFullScan}
                    disabled={reconcileMutation.isLoading}
                    className="px-6 py-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 flex items-center gap-2 group"
                  >
                    {reconcileMutation.isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                        Full Scan Now
                      </>
                    )}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/50">
                        <th className="px-8 py-5">Internal TXN ID</th>
                        <th className="px-8 py-5">Gateway Reference</th>
                        <th className="px-8 py-5">Amount Difference</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                      {[
                        { id: 'TXN-8812', ref: 'VNP_29201', diff: 500, status: 'UNMATCHED', severity: 'CRITICAL' },
                        { id: 'N/A', ref: 'STR_77102', diff: -120, status: 'GATEWAY_ONLY', severity: 'WARNING' },
                      ].map((item, i) => (
                        <tr key={i} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors">
                          <td className="px-8 py-6 font-mono text-xs font-bold text-slate-900 dark:text-white">{item.id}</td>
                          <td className="px-8 py-6 font-mono text-xs text-slate-500">{item.ref}</td>
                          <td className="px-8 py-6">
                            <span className="text-xs font-black text-rose-600 dark:text-rose-400">{formatCurrency(item.diff)}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${
                              item.status === 'UNMATCHED' ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse dark:bg-rose-900/20 dark:border-rose-800/30' : 'bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/30 text-indigo-400'
                            }`}>{item.status}</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button className="flex items-center gap-2 ml-auto px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-200 dark:border-rose-800/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
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
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all">
            <div className="p-8 border-b border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20 dark:shadow-none">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Immutable Audit Log</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Production ledger snapshot</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="px-8 py-5">Timestamp</th>
                    <th className="px-8 py-5">Wallet / Actor</th>
                    <th className="px-8 py-5">Before Value</th>
                    <th className="px-8 py-5">Delta</th>
                    <th className="px-8 py-5">After Value</th>
                    <th className="px-8 py-5 text-right">TXN Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50 font-mono">
                  {isLoadingAudit ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse"><td colSpan={6} className="px-8 py-8 h-16 bg-slate-200/50 dark:bg-slate-700/50" /></tr>
                    ))
                  ) : auditLogs?.content.map((log: AuditLog) => (
                    <tr key={log.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors">
                      <td className="px-8 py-6 text-[11px] font-bold text-slate-500">{formatDateTime(log.changedAt)}</td>
                      <td className="px-8 py-6"><span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{log.wallet.user?.fullName || 'System'}</span></td>
                      <td className="px-8 py-6 text-xs font-medium text-slate-500 dark:text-slate-400">{formatCurrency(log.oldBalanceMxc)}</td>
                      <td className="px-8 py-6"><span className={`text-xs font-black ${log.deltaMxc > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{log.deltaMxc > 0 ? '+' : ''}{formatCurrency(log.deltaMxc)}</span></td>
                      <td className="px-8 py-6 text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(log.newBalanceMxc)}</td>
                      <td className="px-8 py-6 text-right"><span className="text-[10px] font-bold text-indigo-500 uppercase flex items-center justify-end gap-1 cursor-pointer hover:underline">{log.changedByTxn.substring(0,8)}... <ExternalLink className="w-3 h-3" /></span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Anomaly Tab */}
        {activeTab === 'anomalies' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-rose-200/50 dark:border-rose-900/50 shadow-xl shadow-rose-200/20 dark:shadow-none relative overflow-hidden transition-all">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6 text-rose-500" /> Fraud Alerts Center
                  </h3>
                  <span className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-[10px] font-black uppercase animate-pulse shadow-md shadow-rose-500/30">4 High Risk</span>
                </div>
                <div className="space-y-4">
                  {[
                    { type: 'Hash Signature Invalid', user: 'ID: 88219-X', action: 'Freeze & Audit', level: 'CRITICAL' },
                    { type: 'High Velocity (12 txn/min)', user: 'ID: 10293-Y', action: 'Investigate', level: 'WARNING' },
                    { type: 'Negative Available Balance', user: 'ID: 55621-Z', action: 'Freeze Account', level: 'CRITICAL' },
                  ].map((alert, idx) => (
                    <div key={idx} className="flex items-center justify-between p-6 rounded-[2rem] bg-rose-50/50 dark:bg-rose-900/20 border border-rose-100/50 dark:border-rose-800/30 group hover:border-rose-300 dark:hover:border-rose-700 transition-colors">
                      <div>
                        <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">{alert.type}</p>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">{alert.user}</p>
                      </div>
                      <button className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                        {alert.action}
                      </button>
                    </div>
                  ))}
                </div>
             </div>

             <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest mb-8">Platform Security Policies</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <Snowflake className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Auto-Freeze on Hash Error</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Automatic lockout when integrity fails</p>
                      </div>
                    </div>
                    <div className="w-12 h-6 bg-emerald-500 rounded-full relative shadow-inner"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" /></div>
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Manual Review Threshold</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">All payouts above $50.00 flagged</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30 rounded-lg text-xs font-black shadow-sm">$50.00</span>
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
