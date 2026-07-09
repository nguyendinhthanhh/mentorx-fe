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
import { jobApi } from '@/api/jobApi'
import ContextualChatDrawer from '@/components/chat/ContextualChatDrawer'
import { useAuthStore } from '@/store/authStore'
import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/ui/Skeleton'
import {
  CategoryResponse,
  ContractResponse,
  ContractStatus,
  DisputeResponse,
  DisputeStatus,
  JobResponse,
} from '@/types'
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime } from '@/utils/formatters'

type ContractTab = 'ALL' | 'ACTIVE' | 'COMPLETION_REQUESTED' | 'IN_DISPUTE' | 'COMPLETED' | 'CANCELLED'
type SortKey = 'LAST_ACTIVITY' | 'DUE_DATE' | 'AMOUNT_HIGH' | 'NEWEST'
type CancellationDecisionMode = 'APPROVE' | 'REJECT' | null

const contractTabs: Array<{ key: ContractTab; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'COMPLETION_REQUESTED', label: 'Completion Requested' },
  { key: 'IN_DISPUTE', label: 'In Dispute' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
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
  DRAFT: 'Draft',
  PENDING_SIGNATURE: 'Pending signature',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  TERMINATED: 'Terminated',
  IN_DISPUTE: 'In dispute',
  EXPIRED: 'Expired',
  PENDING_PAYMENT: 'Completion requested',
  UNDER_REVIEW: 'Under review',
}

const contractStatusTone: Record<ContractStatus, string> = {
  DRAFT: 'border-slate-200 bg-slate-100 text-slate-600',
  PENDING_SIGNATURE: 'border-violet-200 bg-violet-50 text-violet-700',
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PAUSED: 'border-amber-200 bg-amber-50 text-amber-700',
  COMPLETED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
  TERMINATED: 'border-rose-200 bg-rose-50 text-rose-700',
  IN_DISPUTE: 'border-orange-200 bg-orange-50 text-orange-700',
  EXPIRED: 'border-slate-200 bg-slate-100 text-slate-600',
  PENDING_PAYMENT: 'border-sky-200 bg-sky-50 text-sky-700',
  UNDER_REVIEW: 'border-violet-200 bg-violet-50 text-violet-700',
}

interface MentorContractsDashboardData {
  contracts: ContractResponse[]
  jobsMap: Record<string, JobResponse>
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
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [chatDrawer, setChatDrawer] = useState<ChatDrawerState>(null)
  const [decisionMode, setDecisionMode] = useState<CancellationDecisionMode>(null)
  const [decisionNote, setDecisionNote] = useState('')

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

      const uniqueJobIds = Array.from(new Set(contracts.map((contract) => contract.jobId)))
      const jobEntries = await Promise.all(
        uniqueJobIds.map(async (jobId) => {
          try {
            const job = await jobApi.getById(jobId)
            return [jobId, job] as const
          } catch {
            return null
          }
        })
      )

      const jobsMap = jobEntries.reduce<Record<string, JobResponse>>((acc, entry) => {
        if (entry) {
          acc[entry[0]] = entry[1]
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

  const selectedContract = useMemo(
    () => contracts.find((contract) => contract.id === selectedContractId) || null,
    [contracts, selectedContractId]
  )

  useEffect(() => {
    if (contracts.length === 0) {
      setSelectedContractId(null)
      return
    }

    if (!selectedContractId || !contracts.some((contract) => contract.id === selectedContractId)) {
      setSelectedContractId(contracts[0].id)
    }
  }, [contracts, selectedContractId])

  useEffect(() => {
    if (!selectedContract) {
      setDecisionMode(null)
      setDecisionNote('')
    }
  }, [selectedContract])

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

  const openDisputeForSelected = selectedContract
    ? getPrimaryDispute(disputesByContractId[selectedContract.id] || [])
    : null

  const approveCancellationMutation = useMutation(
    async ({ contractId, note }: { contractId: string; note: string }) => {
      return contractApi.approveCancellation(contractId, user!.userId, note)
    },
    {
      onSuccess: async () => {
        toast.success('Cancellation approved and escrow refunded.')
        setDecisionMode(null)
        setDecisionNote('')
        await queryClient.invalidateQueries(['mentor-contracts-dashboard', user?.userId])
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Unable to approve this cancellation request.')
      },
    }
  )

  const rejectCancellationMutation = useMutation(
    async ({ contractId, note }: { contractId: string; note: string }) => {
      return contractApi.rejectCancellation(contractId, user!.userId, note)
    },
    {
      onSuccess: async () => {
        toast.success('Contract stays active. The client can continue or open a dispute.')
        setDecisionMode(null)
        setDecisionNote('')
        await queryClient.invalidateQueries(['mentor-contracts-dashboard', user?.userId])
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Unable to keep this contract active.')
      },
    }
  )

  const isSubmittingDecision = approveCancellationMutation.isLoading || rejectCancellationMutation.isLoading

  const handleSubmitDecision = async () => {
    if (!selectedContract || !decisionMode) {
      return
    }

    const trimmedNote = decisionNote.trim()
    if (!trimmedNote) {
      toast.error(decisionMode === 'APPROVE' ? 'Add a note before approving the cancellation.' : 'Explain why you want to keep the contract active.')
      return
    }

    if (decisionMode === 'APPROVE') {
      await approveCancellationMutation.mutateAsync({ contractId: selectedContract.id, note: trimmedNote })
      return
    }

    await rejectCancellationMutation.mutateAsync({ contractId: selectedContract.id, note: trimmedNote })
  }

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
              <h1 className="text-lg font-bold text-rose-900">Unable to load active contracts</h1>
              <p className="mt-1 text-sm leading-6">
                {((dashboardQuery.error as any)?.response?.data?.message as string) || 'Please try again in a moment.'}
              </p>
              <button
                type="button"
                onClick={() => dashboardQuery.refetch()}
                className="mt-4 inline-flex h-10 items-center rounded-xl bg-rose-600 px-4 text-sm font-bold text-white transition hover:bg-rose-700"
              >
                Retry
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
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] uppercase tracking-widest font-black text-indigo-600 mb-3 border border-indigo-100 shadow-sm">
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
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600/70">Đang diễn ra</span>
                 <span className="text-xl font-black text-indigo-600">{summary.activeContracts}</span>
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

            <Link to="/mentor/proposals" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-500/30 shrink-0">
              <Briefcase className="h-4 w-4" />
              Xem Proposals
            </Link>
          </div>
        </div>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px] rounded-[2.5rem] border border-slate-200/60 bg-white/50 p-6 sm:p-8 shadow-xl shadow-slate-200/40 backdrop-blur-2xl">
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm backdrop-blur-md">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                {contractTabs.map((tab) => {
                  const isActive = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition ${
                        isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {tabCounts[tab.key]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-[360px]">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by job, client, skill, or category"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <MiniSelect
                  value={sortBy}
                  onChange={(value) => setSortBy(value as SortKey)}
                  options={[
                    ['LAST_ACTIVITY', 'Last activity'],
                    ['DUE_DATE', 'Due soon'],
                    ['AMOUNT_HIGH', 'Highest amount'],
                    ['NEWEST', 'Newest start'],
                  ]}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-3 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>{filteredContracts.length} contracts visible</p>
              <p>Contracts move to history after completion or cancellation.</p>
            </div>

            <div className="space-y-3 p-4">
              {filteredContracts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-slate-900">No contracts match this filter.</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Try a different tab or search term, or review your proposals to pick up new work.
                  </p>
                  <Link
                    to="/mentor/proposals"
                    className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700"
                  >
                    Open proposals
                  </Link>
                </div>
              ) : (
                filteredContracts.map((contract) => {
                  const job = jobsMap[contract.jobId]
                  const disputes = disputesByContractId[contract.id] || []
                  const primaryDispute = getPrimaryDispute(disputes)
                  const isSelected = contract.id === selectedContractId

                  return (
                    <article
                      key={contract.id}
                      className={`rounded-xl border px-5 py-5 shadow-sm transition ${
                        isSelected
                          ? 'border-indigo-200 bg-indigo-50/40 shadow-indigo-100/60'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
                                Client requested cancellation
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
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedContractId(contract.id)
                                    setIsMobileDrawerOpen(true)
                                  }}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 transition hover:text-indigo-700"
                                >
                                  Review details
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                <span>Client: <span className="font-semibold text-slate-700">{contract.clientName}</span></span>
                                <span>{getCategoryLabel(job, categoryMap)}</span>
                                <span>Started {formatRelativeTime(contract.activatedAt || contract.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <DataFact label="In escrow" value={formatCurrency(contract.amountInEscrow)} icon={<ShieldCheck className="h-4 w-4" />} />
                            <DataFact label="Amount paid" value={formatCurrency(contract.amountPaid)} icon={<Wallet className="h-4 w-4" />} />
                            <DataFact label="Due date" value={getDueDateLabel(contract, job)} icon={<CalendarDays className="h-4 w-4" />} />
                            <DataFact label="Last activity" value={formatRelativeTime(getLastActivity(contract))} icon={<Clock3 className="h-4 w-4" />} />
                          </div>

                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                              <span>Progress</span>
                              <span>{getProgressLabel(contract)}</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${getProgressBarTone(contract)}`}
                                style={{ width: `${Math.max(8, Math.min(100, getProgressValue(contract)))}%` }}
                              />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500">
                              {buildMiniTimeline(contract, primaryDispute).map((step) => (
                                <span
                                  key={step.label}
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${
                                    step.active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {step.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-row gap-2 lg:flex-col">
                          <Link
                            to={buildWorkspaceLink(contract)}
                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700"
                          >
                            View workspace
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedContractId(contract.id)
                              setIsMobileDrawerOpen(true)
                            }}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </section>

          <aside className="hidden 2xl:block">
            <ContractDetailPanel
              contract={selectedContract}
              job={selectedContract ? jobsMap[selectedContract.jobId] : undefined}
              categoryMap={categoryMap}
              dispute={openDisputeForSelected}
              decisionMode={decisionMode}
              decisionNote={decisionNote}
              onDecisionModeChange={setDecisionMode}
              onDecisionNoteChange={setDecisionNote}
              onSubmitDecision={handleSubmitDecision}
              isSubmittingDecision={isSubmittingDecision}
              onOpenChat={(contract) =>
                setChatDrawer({
                  recipientId: contract.clientId,
                  contextType: 'CONTRACT',
                  contextId: contract.id,
                  title: contract.clientName,
                  subtitle: 'Contract chat',
                  contextTitle: contract.jobTitle,
                  statusLabel: contractStatusLabel[contract.status],
                  statusToneClassName: contractStatusTone[contract.status],
                })
              }
            />
          </aside>
        </div>
      </div>

      {selectedContract && isMobileDrawerOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm 2xl:hidden">
          <div className="absolute inset-y-0 right-0 w-full max-w-[560px] overflow-y-auto bg-white shadow-2xl">
            <ContractDetailPanel
              contract={selectedContract}
              job={jobsMap[selectedContract.jobId]}
              categoryMap={categoryMap}
              dispute={openDisputeForSelected}
              decisionMode={decisionMode}
              decisionNote={decisionNote}
              onDecisionModeChange={setDecisionMode}
              onDecisionNoteChange={setDecisionNote}
              onSubmitDecision={handleSubmitDecision}
              isSubmittingDecision={isSubmittingDecision}
              onOpenChat={(contract) =>
                setChatDrawer({
                  recipientId: contract.clientId,
                  contextType: 'CONTRACT',
                  contextId: contract.id,
                  title: contract.clientName,
                  subtitle: 'Contract chat',
                  contextTitle: contract.jobTitle,
                  statusLabel: contractStatusLabel[contract.status],
                  statusToneClassName: contractStatusTone[contract.status],
                })
              }
              onClose={() => {
                setIsMobileDrawerOpen(false)
                setDecisionMode(null)
                setDecisionNote('')
              }}
            />
          </div>
        </div>
      ) : null}

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

function ContractDetailPanel({
  contract,
  job,
  categoryMap,
  dispute,
  decisionMode,
  decisionNote,
  onDecisionModeChange,
  onDecisionNoteChange,
  onSubmitDecision,
  isSubmittingDecision,
  onOpenChat,
  onClose,
}: {
  contract: ContractResponse | null
  job?: JobResponse
  categoryMap: Record<number, CategoryResponse>
  dispute: DisputeResponse | null
  decisionMode: CancellationDecisionMode
  decisionNote: string
  onDecisionModeChange: (mode: CancellationDecisionMode) => void
  onDecisionNoteChange: (value: string) => void
  onSubmitDecision: () => void
  isSubmittingDecision: boolean
  onOpenChat: (contract: ContractResponse) => void
  onClose?: () => void
}) {
  if (!contract) {
    return (
      <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex h-[420px] flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <FolderKanban className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Select a contract</h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
            Open any contract from the list to inspect escrow, terms, cancellation status, and client context.
          </p>
        </div>
      </div>
    )
  }

  const categoryLabel = getCategoryLabel(job, categoryMap)
  const dueDateLabel = getDueDateLabel(contract, job)
  const workspaceLink = buildWorkspaceLink(contract)
  const showCancellationActions =
    contract.status === ContractStatus.ACTIVE &&
    contract.cancellationRequestStatus === 'PENDING' &&
    !dispute

  return (
    <div className="sticky top-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-wider ${contractStatusTone[contract.status]}`}>
                {contractStatusLabel[contract.status]}
              </span>
              <span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-bold ${getEscrowTone(contract, dispute)}`}>
                {getEscrowLabel(contract, dispute)}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{contract.jobTitle}</h2>
            <div className="mt-2 space-y-1 text-sm text-slate-500">
              <p>
                Client <span className="font-semibold text-slate-700">{contract.clientName}</span>
              </p>
              <p>Started {formatDateTime(contract.activatedAt || contract.createdAt)}</p>
            </div>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-6 px-6 py-5">
        <PanelSection title="Contract summary">
          <div className="grid gap-3 sm:grid-cols-2">
            <PanelFact label="Contract status" value={contractStatusLabel[contract.status]} />
            <PanelFact label="Category" value={categoryLabel} />
            <PanelFact label="Started" value={formatDate(contract.startDate || contract.activatedAt || contract.createdAt)} />
            <PanelFact label="Due date" value={dueDateLabel} />
            <PanelFact label="Progress" value={getProgressLabel(contract)} />
            <PanelFact label="Last activity" value={formatRelativeTime(getLastActivity(contract))} />
          </div>
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            {contract.description}
          </p>
        </PanelSection>

        <PanelSection title="Escrow status">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900">{getEscrowLabel(contract, dispute)}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{getEscrowDescription(contract, dispute)}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <PanelFact label="Amount in escrow" value={formatCurrency(contract.amountInEscrow)} />
              <PanelFact label="Amount paid" value={formatCurrency(contract.amountPaid)} />
            </div>
          </div>
        </PanelSection>

        <PanelSection title="Client info">
          <div className="grid gap-3 sm:grid-cols-2">
            <PanelFact label="Client name" value={contract.clientName} />
            <PanelFact label="Contract title" value={contract.title} />
            <PanelFact label="Created" value={formatDateTime(contract.createdAt)} />
            <PanelFact label="Updated" value={formatDateTime(contract.updatedAt)} />
          </div>
        </PanelSection>

        <PanelSection title="Job and proposal terms">
          <div className="grid gap-3 sm:grid-cols-2">
            <PanelFact label="Total amount" value={formatCurrency(contract.totalAmount)} />
            <PanelFact label="Hourly rate" value={contract.hourlyRate ? formatCurrency(contract.hourlyRate) : 'Not set'} />
            <PanelFact label="Client budget" value={getBudgetLabel(job)} />
            <PanelFact label="Delivery target" value={dueDateLabel} />
          </div>

          {job?.requiredSkills?.length ? (
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills.slice(0, 6).map((skill) => (
                <span key={skill} className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600">
                  {skill}
                </span>
              ))}
            </div>
          ) : null}

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <LongField label="Deliverables" value={contract.deliverables} />
            <LongField label="Payment terms" value={contract.paymentTerms} />
            <LongField label="Terms and conditions" value={contract.termsAndConditions} />
          </div>
        </PanelSection>

        <PanelSection title="Cancellation and dispute status">
          <div className="space-y-3">
            <StatusLine
              label="Cancellation"
              value={
                contract.cancellationRequestStatus === 'PENDING'
                  ? 'Client requested cancellation'
                  : contract.cancellationRequestStatus === 'APPROVED'
                    ? 'Cancellation approved'
                    : contract.cancellationRequestStatus === 'REJECTED'
                      ? 'Cancellation rejected'
                      : 'No cancellation request'
              }
            />
            <StatusLine
              label="Client reason"
              value={contract.cancellationRequestReason || 'No cancellation request on file'}
            />
            <StatusLine
              label="Dispute"
              value={dispute ? `${dispute.status} · ${dispute.title}` : 'No open dispute'}
            />
            {contract.cancellationResponseNote ? (
              <StatusLine label="Latest response note" value={contract.cancellationResponseNote} />
            ) : null}
          </div>
        </PanelSection>

        <PanelSection title="Actions">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to={workspaceLink}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              View workspace
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => onOpenChat(contract)}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Message client
            </button>
          </div>

          {contract.status === ContractStatus.ACTIVE && !showCancellationActions && !dispute ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
              Escrow remains locked until the client marks the contract as completed. You have not been paid yet.
            </div>
          ) : null}

          {dispute ? (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-6 text-orange-700">
              This contract is in dispute. Escrow stays locked until admin resolution, so direct completion or cancellation actions are unavailable.
            </div>
          ) : null}

          {showCancellationActions ? (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Client requested cancellation</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Respond to the request. Approving will refund escrow to the client. Keeping the contract active lets the client continue or open a dispute.
                </p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                <span className="font-bold text-slate-800">Client reason:</span> {contract.cancellationRequestReason || 'No reason provided.'}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onDecisionModeChange('APPROVE')}
                  className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-bold transition ${
                    decisionMode === 'APPROVE'
                      ? 'bg-emerald-600 text-white'
                      : 'border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  Approve cancellation
                </button>
                <button
                  type="button"
                  onClick={() => onDecisionModeChange('REJECT')}
                  className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-bold transition ${
                    decisionMode === 'REJECT'
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Keep contract active
                </button>
              </div>

              {decisionMode ? (
                <div className="space-y-3 rounded-xl border border-white/80 bg-white/90 p-4">
                  <label className="block space-y-2">
                    <span className="text-sm font-bold text-slate-700">
                      {decisionMode === 'APPROVE' ? 'Note before refunding escrow' : 'Why should the contract continue?'}
                    </span>
                    <textarea
                      value={decisionNote}
                      onChange={(event) => onDecisionNoteChange(event.target.value)}
                      placeholder={
                        decisionMode === 'APPROVE'
                          ? 'Add a short note for the client before the contract is cancelled...'
                          : 'Explain why the contract should remain active...'
                      }
                      className="min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isSubmittingDecision}
                      onClick={() => {
                        onDecisionModeChange(null)
                        onDecisionNoteChange('')
                      }}
                      className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingDecision}
                      onClick={onSubmitDecision}
                      className={`inline-flex h-11 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-bold text-white transition disabled:opacity-60 ${
                        decisionMode === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {isSubmittingDecision
                        ? 'Submitting...'
                        : decisionMode === 'APPROVE'
                          ? 'Approve and refund'
                          : 'Keep contract active'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </PanelSection>
      </div>
    </div>
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
    indigo: 'bg-indigo-50 text-indigo-600',
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
      <p className="mt-1 text-sm leading-6 text-slate-600">{value?.trim() ? value : 'Not specified'}</p>
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
      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
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

function getCategoryLabel(job: JobResponse | undefined, categoryMap: Record<number, CategoryResponse>): string {
  if (!job) {
    return 'Unassigned category'
  }
  if (job.customCategoryName) {
    return job.customCategoryName
  }
  if (job.categoryId && categoryMap[job.categoryId]) {
    return categoryMap[job.categoryId].name
  }
  return 'General request'
}

function getBudgetLabel(job?: JobResponse): string {
  if (!job) {
    return 'Not available'
  }
  if (job.budgetType === 'HOURLY' && job.hourlyRateMxc) {
    return `${formatCurrency(job.hourlyRateMxc)} / hour`
  }
  if (job.budgetMinMxc != null && job.budgetMaxMxc != null) {
    return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
  }
  if (job.budgetMinMxc != null) {
    return `From ${formatCurrency(job.budgetMinMxc)}`
  }
  return 'Not specified'
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
  jobsMap: Record<string, JobResponse>
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

function getDueTimestamp(contract: ContractResponse, job?: JobResponse): number {
  const dueDate = contract.endDate || job?.deadlineAt
  if (!dueDate) {
    return Number.MAX_SAFE_INTEGER
  }
  return new Date(dueDate).getTime()
}

function getDueDateLabel(contract: ContractResponse, job?: JobResponse): string {
  const dueDate = contract.endDate || job?.deadlineAt
  if (!dueDate) {
    return 'Flexible'
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
    return 'Completed and released'
  }
  if (contract.status === ContractStatus.CANCELLED) {
    return 'Cancelled and closed'
  }
  if (contract.status === ContractStatus.IN_DISPUTE) {
    return 'Blocked by dispute'
  }
  if (contract.fundsInEscrow && contract.amountInEscrow > 0) {
    return `${contract.progressPercentage || 0}% complete, awaiting client sign-off`
  }
  return `${contract.progressPercentage || 0}% complete`
}

function getProgressBarTone(contract: ContractResponse): string {
  if (contract.status === ContractStatus.COMPLETED) {
    return 'bg-indigo-600'
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
    return true
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
    return 'Escrow locked in dispute'
  }
  if (contract.fundsInEscrow && contract.amountInEscrow > 0) {
    return 'Escrow locked'
  }
  if (contract.status === ContractStatus.COMPLETED || contract.amountPaid > 0) {
    return 'Released to mentor'
  }
  if (contract.status === ContractStatus.CANCELLED) {
    return 'Refunded to client'
  }
  return 'No escrow movement'
}

function getEscrowDescription(contract: ContractResponse, dispute: DisputeResponse | null): string {
  if (dispute || contract.status === ContractStatus.IN_DISPUTE) {
    return 'Escrow remains frozen until the dispute is reviewed and resolved by the platform.'
  }
  if (contract.fundsInEscrow && contract.amountInEscrow > 0) {
    return 'The client has funded this contract. Money stays protected until completion is confirmed.'
  }
  if (contract.status === ContractStatus.COMPLETED || contract.amountPaid > 0) {
    return 'The client confirmed completion, and escrow has already been released to your wallet.'
  }
  if (contract.status === ContractStatus.CANCELLED) {
    return 'The contract was cancelled, and any escrow for this deal was refunded to the client.'
  }
  return 'This contract does not currently hold escrow funds.'
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
      { label: 'Started', active: true },
      { label: 'Escrow locked', active: true },
      { label: 'Dispute', active: true },
    ]
  }

  if (contract.status === ContractStatus.COMPLETED) {
    return [
      { label: 'Started', active: true },
      { label: 'Escrow locked', active: true },
      { label: 'Released', active: true },
    ]
  }

  if (contract.status === ContractStatus.CANCELLED) {
    return [
      { label: 'Started', active: true },
      { label: 'Escrow locked', active: true },
      { label: 'Refunded', active: true },
    ]
  }

  return [
    { label: 'Started', active: true },
    { label: 'Escrow locked', active: contract.fundsInEscrow || contract.amountInEscrow > 0 },
    { label: 'Awaiting completion', active: contract.status === ContractStatus.ACTIVE },
  ]
}

function buildWorkspaceLink(contract: ContractResponse): string {
  return `/chat?userId=${contract.clientId}&jobId=${contract.jobId}`
}
