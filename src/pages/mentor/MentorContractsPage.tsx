import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import {
  AlertCircle,
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  FolderKanban,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react'
import { categoryApi } from '@/api/categoryApi'
import { contractApi } from '@/api/contractApi'
import { disputeApi } from '@/api/disputeApi'
import ContextualChatDrawer from '@/components/chat/ContextualChatDrawer'
import { useAuthStore } from '@/store/authStore'
import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/ui/Skeleton'
import {
  CategoryResponse,
  JobSummaryResponse,
  ContractResponse,
  ContractStatus,
  DisputeResponse,
  DisputeStatus,
} from '@/types'
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime } from '@/utils/formatters'

type ContractTab = 'ALL' | 'ACTIVE' | 'COMPLETION_REQUESTED' | 'IN_DISPUTE' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED'
type SortKey = 'LAST_ACTIVITY' | 'DUE_DATE' | 'AMOUNT_HIGH' | 'NEWEST'
type CancellationDecisionMode = 'APPROVE' | 'REJECT' | null

const contractTabs: Array<{ key: ContractTab; label: string }> = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'ACTIVE', label: 'Đang hoạt động' },
  { key: 'COMPLETION_REQUESTED', label: 'Chờ duyệt' },
  { key: 'IN_DISPUTE', label: 'Tranh chấp' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
  { key: 'CANCELLED', label: 'Đã hủy' },
  { key: 'ARCHIVED', label: 'Đã lưu trữ' },
]

const liveDisputeStatuses: DisputeStatus[] = [
  DisputeStatus.OPEN,
  DisputeStatus.AWAITING_RESPONSE,
  DisputeStatus.INVESTIGATING,
  DisputeStatus.EVIDENCE_REVIEW,
  DisputeStatus.IN_MEDIATION,
  DisputeStatus.IN_ARBITRATION,
]

const contractStatusLabel: Record<ContractStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING_SIGNATURE: 'Chờ ký',
  ACTIVE: 'Đang hoạt động',
  PAUSED: 'Đã tạm dừng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  TERMINATED: 'Bị chấm dứt',
  IN_DISPUTE: 'Đang tranh chấp',
  EXPIRED: 'Hết hạn',
  PENDING_PAYMENT: 'Chờ thanh toán',
  UNDER_REVIEW: 'Đang xem xét',
}

const contractStatusTone: Record<ContractStatus, string> = {
  DRAFT: 'border-slate-200 bg-slate-100 text-slate-600',
  PENDING_SIGNATURE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PAUSED: 'border-amber-200 bg-amber-50 text-amber-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
  TERMINATED: 'border-rose-200 bg-rose-50 text-rose-700',
  IN_DISPUTE: 'border-orange-200 bg-orange-50 text-orange-700',
  EXPIRED: 'border-slate-200 bg-slate-100 text-slate-600',
  PENDING_PAYMENT: 'border-sky-200 bg-sky-50 text-sky-700',
  UNDER_REVIEW: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

interface MentorContractsDashboardData {
  contracts: ContractResponse[]
  jobsMap: Record<string, JobSummaryResponse>
  categoryMap: Record<number, CategoryResponse>
  disputesByContractId: Record<string, DisputeResponse[]>
}

type ChatDrawerState = {
  recipientId: string
  contextType: 'CONTRACT'
  contextId: string
  title?: string
  subtitle?: string
  contextTitle?: string
  statusLabel?: string
  statusToneClassName?: string
} | null

export default function MentorContractsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<ContractTab>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('LAST_ACTIVITY')
  const [chatDrawer, setChatDrawer] = useState<ChatDrawerState>(null)

  const dashboardQuery = useQuery<MentorContractsDashboardData>(
    ['mentor-contracts-dashboard', user?.userId],
    async () => {
      if (!user?.userId) {
        return {
          contracts: [],
          jobsMap: {},
          categoryMap: {},
          disputesByContractId: {},
        }
      }

      const [contractsPage, disputesPage, categories] = await Promise.all([
        contractApi.getMine({ page: 0, size: 100 }),
        disputeApi.getByUser(user.userId, { page: 0, size: 100 }).catch(() => ({
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 100,
          number: 0,
          first: true,
          last: true,
        })),
        categoryApi.getAllActive().catch(() => [] as CategoryResponse[]),
      ])

      const contracts = contractsPage.content || []
      const categoryMap = categories.reduce<Record<number, CategoryResponse>>((acc, category) => {
        acc[category.id] = category
        return acc
      }, {})

      const jobsMap = contracts.reduce<Record<string, JobSummaryResponse>>((acc, contract) => {
        if (contract.jobSummary) {
          acc[contract.jobId] = contract.jobSummary
        }
        return acc
      }, {})

      const disputesByContractId = (disputesPage.content || []).reduce<Record<string, DisputeResponse[]>>((acc, dispute) => {
        if (!dispute.contractId) {
          return acc
        }
        if (!acc[dispute.contractId]) {
          acc[dispute.contractId] = []
        }
        acc[dispute.contractId].push(dispute)
        return acc
      }, {})

      return {
        contracts,
        jobsMap,
        categoryMap,
        disputesByContractId,
      }
    },
    {
      enabled: !!user?.userId,
      keepPreviousData: true,
    }
  )

  const contracts = dashboardQuery.data?.contracts || []
  const jobsMap = dashboardQuery.data?.jobsMap || {}
  const categoryMap = dashboardQuery.data?.categoryMap || {}
  const disputesByContractId = dashboardQuery.data?.disputesByContractId || {}

  const summary = useMemo(() => {
    const now = new Date()
    const activeContracts = contracts.filter((contract) => contract.status === ContractStatus.ACTIVE).length
    const inEscrow = contracts.filter((contract) => contract.fundsInEscrow && contract.amountInEscrow > 0).length
    const awaitingCompletion = contracts.filter(
      (contract) =>
        contract.status === ContractStatus.ACTIVE &&
        contract.fundsInEscrow &&
        contract.amountInEscrow > 0
    ).length
    const completedThisMonth = contracts.filter((contract) => {
      if (contract.status !== ContractStatus.COMPLETED || !contract.completedAt) {
        return false
      }
      const completedAt = new Date(contract.completedAt)
      return completedAt.getMonth() === now.getMonth() && completedAt.getFullYear() === now.getFullYear()
    }).length

    return {
      activeContracts,
      inEscrow,
      awaitingCompletion,
      completedThisMonth,
    }
  }, [contracts])

  const tabCounts = useMemo(() => {
    return contractTabs.reduce<Record<ContractTab, number>>((acc, tab) => {
      acc[tab.key] = contracts.filter((contract) =>
        matchesContractTab(contract, disputesByContractId[contract.id] || [], tab.key)
      ).length
      return acc
    }, {
      ALL: 0,
      ACTIVE: 0,
      COMPLETION_REQUESTED: 0,
      IN_DISPUTE: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      ARCHIVED: 0,
    })
  }, [contracts, disputesByContractId])

  const filteredContracts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    return contracts
      .filter((contract) => {
        const job = jobsMap[contract.jobId]
        const disputes = disputesByContractId[contract.id] || []
        const categoryLabel = getCategoryLabel(job, categoryMap)

        if (!matchesContractTab(contract, disputes, activeTab)) {
          return false
        }

        if (!normalizedQuery) {
          return true
        }

        const haystack = [
          contract.jobTitle,
          contract.clientName,
          contract.title,
          contract.description,
          categoryLabel,
          job?.customCategoryName,
          job?.requiredSkills?.join(' '),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(normalizedQuery)
      })
      .sort((left, right) => sortContracts(left, right, sortBy, jobsMap))
  }, [activeTab, categoryMap, contracts, disputesByContractId, jobsMap, searchQuery, sortBy])



  if (dashboardQuery.isLoading) {
    return <MentorContractsLoadingState />
  }

  if (dashboardQuery.isError) {
    return (
      <div className="space-y-6 pt-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-rose-700 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h1 className="text-lg font-bold text-rose-900">Không thể tải hợp đồng</h1>
              <p className="mt-1 text-sm leading-6">
                {((dashboardQuery.error as any)?.response?.data?.message as string) || 'Vui lòng thử lại sau.'}
              </p>
              <button
                type="button"
                onClick={() => dashboardQuery.refetch()}
                className="mt-4 inline-flex h-10 items-center rounded-xl bg-rose-600 px-4 text-sm font-bold text-white transition hover:bg-rose-700"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
        {/* Compact Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] uppercase tracking-widest font-black text-emerald-600 mb-3 border border-emerald-100 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Pipeline Overview
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Hợp đồng & Mentee</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Bạn đang có <span className="font-bold text-slate-700">{summary.activeContracts}</span> hợp đồng đang diễn ra. 
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/50 py-2.5 shadow-sm backdrop-blur-md">
              <div className="flex flex-col px-5 border-r border-slate-200/60">
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Đang diễn ra</span>
                 <span className="text-xl font-black text-emerald-600">{summary.activeContracts}</span>
              </div>
              <div className="flex flex-col px-5 border-r border-slate-200/60">
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Hoàn thành (Tháng này)</span>
                 <span className="text-xl font-black text-emerald-600">{summary.completedThisMonth}</span>
              </div>
              <div className="flex flex-col px-5">
                 <span className="text-[10px] font-black uppercase tracking-widest text-rose-600/70">Đã hủy</span>
                 <span className="text-xl font-black text-rose-600">{tabCounts.CANCELLED}</span>
              </div>
            </div>

            <Link to="/mentor/proposals" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 hover:bg-emerald-700 px-6 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-emerald-500/30 shrink-0">
              <Briefcase className="h-4 w-4" />
              Xem Proposals
            </Link>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200/60 bg-white/50 p-6 sm:p-8 shadow-xl shadow-slate-200/40 backdrop-blur-2xl">
          <section className="flex flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/40 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
            <div className="border-b border-slate-100/60 px-5 py-3 bg-white/40 backdrop-blur-md">
              <div className="flex w-full overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-200/30 p-1.5 backdrop-blur-sm">
                  {contractTabs.map((tab) => {
                    const isActive = activeTab === tab.key
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`group relative flex h-10 shrink-0 items-center gap-2.5 rounded-xl px-4 text-sm font-bold transition-all duration-300 ${
                          isActive
                            ? 'bg-white text-emerald-600 shadow-md shadow-slate-200/50 ring-1 ring-slate-200/50'
                            : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                        }`}
                      >
                        {tab.label}
                        <span
                          className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-black transition-colors duration-300 ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200/80 text-slate-500 group-hover:bg-slate-300/80'
                          }`}
                        >
                          {tabCounts[tab.key]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-[360px]">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm kiếm theo công việc, khách hàng, kỹ năng, ..."
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <MiniSelect
                  value={sortBy}
                  onChange={(value) => setSortBy(value as SortKey)}
                  options={[
                    ['LAST_ACTIVITY', 'Hoạt động gần nhất'],
                    ['DUE_DATE', 'Sắp đến hạn'],
                    ['AMOUNT_HIGH', 'Giá trị cao nhất'],
                    ['NEWEST', 'Mới nhất'],
                  ]}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-3 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>{filteredContracts.length} hợp đồng</p>
              <p>Hợp đồng sẽ được chuyển vào lịch sử sau khi hoàn thành hoặc bị hủy.</p>
            </div>

            <div className="space-y-3 p-4">
              {filteredContracts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-slate-900">Không có hợp đồng nào phù hợp.</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Thử thay đổi bộ lọc hoặc xem các đề xuất của bạn để nhận việc mới.
                  </p>
                  <Link
                    to="/mentor/proposals"
                    className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    Xem đề xuất
                  </Link>
                </div>
              ) : (
                filteredContracts.map((contract) => {
                  const job = jobsMap[contract.jobId]
                  const disputes = disputesByContractId[contract.id] || []
                  const primaryDispute = getPrimaryDispute(disputes)

                  return (
                    <article
                      key={contract.id}
                      className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/60 px-6 py-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-wider ${contractStatusTone[contract.status]}`}>
                              {contractStatusLabel[contract.status]}
                            </span>
                            <span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-bold ${getEscrowTone(contract, primaryDispute)}`}>
                              {getEscrowLabel(contract, primaryDispute)}
                            </span>
                            {contract.cancellationRequestStatus === 'PENDING' ? (
                              <span className="inline-flex h-7 items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 text-[11px] font-bold text-amber-700">
                                Khách hàng yêu cầu hủy
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3 flex flex-wrap items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <h2 className="truncate text-lg font-bold tracking-tight text-slate-950">{contract.jobTitle}</h2>
                                <Link
                                  to={contract.proposalId ? `/mentor/proposals/${contract.proposalId}` : '#'}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 transition hover:text-emerald-700"
                                >
                                  Xem chi tiết
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                <span>Khách hàng: <span className="font-semibold text-slate-700">{contract.clientName}</span></span>
                                <span>{getCategoryLabel(job, categoryMap)}</span>
                                <span>Bắt đầu {formatRelativeTime(contract.activatedAt || contract.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <DataFact label="Đang giữ (Escrow)" value={formatCurrency(contract.amountInEscrow)} icon={<ShieldCheck className="h-4 w-4" />} />
                            <DataFact label="Đã thanh toán" value={formatCurrency(contract.amountPaid)} icon={<Wallet className="h-4 w-4" />} />
                            <DataFact label="Hạn chót" value={getDueDateLabel(contract, job)} icon={<CalendarDays className="h-4 w-4" />} />
                            <DataFact label="Hoạt động gần nhất" value={formatRelativeTime(getLastActivity(contract))} icon={<Clock3 className="h-4 w-4" />} />
                          </div>

                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                              <span>Tiến độ</span>
                              <span>{getProgressLabel(contract)}</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${getProgressBarTone(contract)}`}
                                style={{ width: `${Math.max(8, Math.min(100, getProgressValue(contract)))}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-row gap-2">
                          <Link
                            to={buildWorkspaceLink(contract)}
                            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-6 text-sm font-bold text-white transition hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20"
                          >
                            Không gian làm việc
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                          <Link
                            to={contract.proposalId ? `/mentor/proposals/${contract.proposalId}` : '#'}
                            className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                          >
                            Chi tiết
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </section>

        </div>
      </div>

      <ContextualChatDrawer
        open={!!chatDrawer}
        onOpenChange={(open) => {
          if (!open) {
            setChatDrawer(null)
          }
        }}
        recipientId={chatDrawer?.recipientId}
        contextType={chatDrawer?.contextType}
        contextId={chatDrawer?.contextId}
        title={chatDrawer?.title}
        subtitle={chatDrawer?.subtitle}
        contextTitle={chatDrawer?.contextTitle}
        statusLabel={chatDrawer?.statusLabel}
        statusToneClassName={chatDrawer?.statusToneClassName}
      />
    </>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
  caption,
}: {
  icon: ReactNode
  label: string
  value: number
  tone: 'indigo' | 'emerald' | 'amber' | 'slate'
  caption: string
}) {
  const toneMap = {
    indigo: 'bg-emerald-50 text-emerald-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
  }

  return (
    <article className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${toneMap[tone]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
        <p className="mt-1 text-[11px] leading-tight text-slate-400">{caption}</p>
      </div>
    </article>
  )
}

function DataFact({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-sm font-bold text-slate-800">{value}</p>
    </div>
  )
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
      {children}
    </section>
  )
}

function PanelFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  )
}

function LongField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{value?.trim() ? value : 'Không xác định'}</p>
    </div>
  )
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm leading-6 text-slate-600">{value}</p>
    </div>
  )
}

function MiniSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: Array<[string, string]>
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  )
}

function MentorContractsLoadingState() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-[420px]" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <Skeleton className="h-11 w-11 rounded-2xl" />
            <Skeleton className="mt-4 h-3 w-28" />
            <Skeleton className="mt-2 h-8 w-16" />
            <Skeleton className="mt-3 h-4 w-40" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-24 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="border-b border-slate-100 px-5 py-4">
            <Skeleton className="h-11 w-full rounded-2xl lg:w-[360px]" />
          </div>
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-2xl" />
                  <div className="min-w-0 flex-1 space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-60" />
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {Array.from({ length: 4 }).map((_, innerIndex) => (
                        <Skeleton key={innerIndex} className="h-16 rounded-2xl" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="hidden xl:block">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <SkeletonCircle size="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <SkeletonText lines={3} />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-11 rounded-2xl" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function getCategoryLabel(job: JobSummaryResponse | undefined, categoryMap: Record<number, CategoryResponse>): string {
  if (!job) {
    return 'Chưa phân loại'
  }
  if (job.customCategoryName) {
    return job.customCategoryName
  }
  if (job.categoryId && categoryMap[job.categoryId]) {
    return categoryMap[job.categoryId].name
  }
  return 'Yêu cầu chung'
}

function getBudgetLabel(job?: JobSummaryResponse): string {
  if (!job) {
    return 'Không có thông tin'
  }
  if (job.budgetType === 'HOURLY' && job.hourlyRateMxc) {
    return `${formatCurrency(job.hourlyRateMxc)} / giờ`
  }
  if (job.budgetMinMxc != null && job.budgetMaxMxc != null) {
    return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
  }
  if (job.budgetMinMxc != null) {
    return `Từ ${formatCurrency(job.budgetMinMxc)}`
  }
  return 'Không xác định'
}

function getLastActivity(contract: ContractResponse): string {
  return (
    contract.cancellationRespondedAt ||
    contract.cancellationRequestedAt ||
    contract.completedAt ||
    contract.cancelledAt ||
    contract.updatedAt ||
    contract.createdAt
  )
}

function sortContracts(
  left: ContractResponse,
  right: ContractResponse,
  sortBy: SortKey,
  jobsMap: Record<string, JobSummaryResponse>
): number {
  if (sortBy === 'AMOUNT_HIGH') {
    return right.totalAmount - left.totalAmount
  }

  if (sortBy === 'DUE_DATE') {
    const leftDue = getDueTimestamp(left, jobsMap[left.jobId])
    const rightDue = getDueTimestamp(right, jobsMap[right.jobId])
    return leftDue - rightDue
  }

  if (sortBy === 'NEWEST') {
    return new Date(right.activatedAt || right.createdAt).getTime() - new Date(left.activatedAt || left.createdAt).getTime()
  }

  return new Date(getLastActivity(right)).getTime() - new Date(getLastActivity(left)).getTime()
}

function getDueTimestamp(contract: ContractResponse, job?: JobSummaryResponse): number {
  const dueDate = contract.endDate || job?.deadlineAt
  if (!dueDate) {
    return Number.MAX_SAFE_INTEGER
  }
  return new Date(dueDate).getTime()
}

function getDueDateLabel(contract: ContractResponse, job?: JobSummaryResponse): string {
  const dueDate = contract.endDate || job?.deadlineAt
  if (!dueDate) {
    return 'Linh hoạt'
  }
  return formatDate(dueDate)
}

function getProgressValue(contract: ContractResponse): number {
  if (contract.status === ContractStatus.COMPLETED) {
    return 100
  }
  if (contract.status === ContractStatus.CANCELLED) {
    return 100
  }
  if (contract.status === ContractStatus.IN_DISPUTE) {
    return Math.max(contract.progressPercentage || 0, 15)
  }
  return contract.progressPercentage || 8
}

function getProgressLabel(contract: ContractResponse): string {
  if (contract.status === ContractStatus.COMPLETED) {
    return 'Đã hoàn thành và giải ngân'
  }
  if (contract.status === ContractStatus.CANCELLED) {
    return 'Đã hủy và đóng'
  }
  if (contract.status === ContractStatus.IN_DISPUTE) {
    return 'Bị khóa do tranh chấp'
  }
  if (contract.fundsInEscrow && contract.amountInEscrow > 0) {
    return `${contract.progressPercentage || 0}% hoàn thành, chờ khách hàng xác nhận`
  }
  return `${contract.progressPercentage || 0}% hoàn thành`
}

function getProgressBarTone(contract: ContractResponse): string {
  if (contract.status === ContractStatus.COMPLETED) {
    return 'bg-emerald-600'
  }
  if (contract.status === ContractStatus.CANCELLED) {
    return 'bg-rose-500'
  }
  if (contract.status === ContractStatus.IN_DISPUTE) {
    return 'bg-orange-500'
  }
  return 'bg-emerald-500'
}

function getPrimaryDispute(disputes: DisputeResponse[]): DisputeResponse | null {
  const liveDisputes = disputes.filter((dispute) => liveDisputeStatuses.includes(dispute.status))
  if (!liveDisputes.length) {
    return null
  }
  return [...liveDisputes].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0]
}

function matchesContractTab(contract: ContractResponse, disputes: DisputeResponse[], tab: ContractTab): boolean {
  if (tab === 'ALL') {
    return !contract.isArchived
  }
  if (tab === 'ARCHIVED') {
    return !!contract.isArchived
  }
  if (contract.isArchived) {
    return false
  }
  if (tab === 'ACTIVE') {
    return contract.status === ContractStatus.ACTIVE
  }
  if (tab === 'COMPLETION_REQUESTED') {
    return contract.status === ContractStatus.PENDING_PAYMENT || contract.status === ContractStatus.UNDER_REVIEW
  }
  if (tab === 'IN_DISPUTE') {
    return contract.status === ContractStatus.IN_DISPUTE || disputes.some((dispute) => liveDisputeStatuses.includes(dispute.status))
  }
  if (tab === 'COMPLETED') {
    return contract.status === ContractStatus.COMPLETED
  }
  return contract.status === ContractStatus.CANCELLED || contract.status === ContractStatus.TERMINATED
}

function getEscrowLabel(contract: ContractResponse, dispute: DisputeResponse | null): string {
  if (dispute || contract.status === ContractStatus.IN_DISPUTE) {
    return 'Escrow bị khóa do tranh chấp'
  }
  if (contract.fundsInEscrow && contract.amountInEscrow > 0) {
    return 'Escrow đã khóa'
  }
  if (contract.status === ContractStatus.COMPLETED || contract.amountPaid > 0) {
    return 'Đã giải ngân cho mentor'
  }
  if (contract.status === ContractStatus.CANCELLED) {
    return 'Đã hoàn tiền cho khách'
  }
  return 'Không có giao dịch escrow'
}

function getEscrowDescription(contract: ContractResponse, dispute: DisputeResponse | null): string {
  if (dispute || contract.status === ContractStatus.IN_DISPUTE) {
    return 'Tiền trong escrow sẽ bị đóng băng cho đến khi tranh chấp được giải quyết bởi nền tảng.'
  }
  if (contract.fundsInEscrow && contract.amountInEscrow > 0) {
    return 'Khách hàng đã nạp tiền cho hợp đồng này. Tiền được bảo vệ an toàn cho đến khi hoàn thành được xác nhận.'
  }
  if (contract.status === ContractStatus.COMPLETED || contract.amountPaid > 0) {
    return 'Khách hàng đã xác nhận hoàn thành, tiền trong escrow đã được giải ngân vào ví của bạn.'
  }
  if (contract.status === ContractStatus.CANCELLED) {
    return 'Hợp đồng đã bị hủy, mọi khoản tiền trong escrow đã được hoàn trả cho khách hàng.'
  }
  return 'Hợp đồng này hiện không giữ tiền escrow.'
}

function getEscrowTone(contract: ContractResponse, dispute: DisputeResponse | null): string {
  if (dispute || contract.status === ContractStatus.IN_DISPUTE) {
    return 'border-orange-200 bg-orange-50 text-orange-700'
  }
  if (contract.fundsInEscrow && contract.amountInEscrow > 0) {
    return 'border-sky-200 bg-sky-50 text-sky-700'
  }
  if (contract.status === ContractStatus.COMPLETED || contract.amountPaid > 0) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (contract.status === ContractStatus.CANCELLED) {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }
  return 'border-slate-200 bg-slate-100 text-slate-600'
}

function buildMiniTimeline(contract: ContractResponse, dispute: DisputeResponse | null) {
  if (dispute || contract.status === ContractStatus.IN_DISPUTE) {
    return [
      { label: 'Bắt đầu', active: true },
      { label: 'Đã khóa Escrow', active: true },
      { label: 'Tranh chấp', active: true },
    ]
  }

  if (contract.status === ContractStatus.COMPLETED) {
    return [
      { label: 'Bắt đầu', active: true },
      { label: 'Đã khóa Escrow', active: true },
      { label: 'Giải ngân', active: true },
    ]
  }

  if (contract.status === ContractStatus.CANCELLED) {
    return [
      { label: 'Bắt đầu', active: true },
      { label: 'Đã khóa Escrow', active: true },
      { label: 'Hoàn tiền', active: true },
    ]
  }

  return [
    { label: 'Bắt đầu', active: true },
    { label: 'Đã khóa Escrow', active: contract.fundsInEscrow || contract.amountInEscrow > 0 },
    { label: 'Đang chờ hoàn thành', active: contract.status === ContractStatus.ACTIVE },
  ]
}

function buildWorkspaceLink(contract: ContractResponse): string {
  return `/mentor/messages?targetUserId=${encodeURIComponent(contract.clientId)}&jobId=${encodeURIComponent(contract.jobId)}`
}
