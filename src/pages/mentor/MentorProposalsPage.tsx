import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Circle,
  Clock3,
  MessageCircleMore,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react'
import ContextualChatDrawer from '@/components/chat/ContextualChatDrawer'
import { Skeleton, SkeletonCircle } from '@/components/ui/Skeleton'
import { categoryApi } from '@/api/categoryApi'
import { jobApi } from '@/api/jobApi'
import { mentorApi } from '@/api/mentorApi'
import { negotiationApi } from '@/api/negotiationApi'
import { proposalApi } from '@/api/proposalApi'
import { useAuthStore } from '@/store/authStore'
import { CategoryResponse, JobResponse, ProposalResponse } from '@/types'
import { formatCurrency, formatRelativeTime, formatDeadline } from '@/utils/formatters'
import { PageShell } from './shared/MentorHubUI'

interface NegotiationInfo {
  id: string
  message: string
  proposedAmount?: number
  estimatedDurationDays?: number
  deadlineAt?: string
  senderType: 'CLIENT' | 'MENTOR'
  senderName: string
  createdAt: string
  status?: string
}

type ChatDrawerState = {
  recipientId: string
  contextId: string
  title?: string
  subtitle?: string
} | null

type TabKey = 'ALL' | 'AWAITING' | 'NEGOTIATING' | 'ACCEPTED' | 'REJECTED' | 'ARCHIVED'

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'AWAITING', label: 'Awaiting' },
  { key: 'NEGOTIATING', label: 'Negotiating' },
  { key: 'ACCEPTED', label: 'Active' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ARCHIVED', label: 'Archived' },
]

const stageLabels = ['Sent', 'Viewed', 'Negotiating', 'Agreed', 'Contract'] as const

export default function MentorProposalsPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [proposals, setProposals] = useState<ProposalResponse[]>([])
  const [jobMap, setJobMap] = useState<Record<string, JobResponse>>({})
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [negotiations, setNegotiations] = useState<Record<string, NegotiationInfo>>({})
  const [recommendedJobs, setRecommendedJobs] = useState<JobResponse[]>([])

  const [activeTab, setActiveTab] = useState<TabKey>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [chatDrawer, setChatDrawer] = useState<ChatDrawerState>(null)

  useEffect(() => {
    void loadData()
  }, [user?.userId])

  const loadData = async () => {
    if (!user?.userId) return

    try {
      setLoading(true)
      setError('')

      const [proposalPage, categoryList, , jobsPage] = await Promise.all([
        proposalApi.getByMentor(user.userId, { page: 0, size: 100 }),
        categoryApi.getAllActive().catch(() => [] as CategoryResponse[]),
        mentorApi.getAllApprovedMentors({ page: 0, size: 3, sortBy: 'averageRating', sortDir: 'desc' }).catch(() => ({
          content: [],
        })),
        jobApi.getOpenJobs({ page: 0, size: 4 }).catch(() => ({ content: [] as JobResponse[] })),
      ])

      setProposals(proposalPage.content)
      setCategories(categoryList)
      setRecommendedJobs(jobsPage.content || [])

      const latestNegotiationMap: Record<string, NegotiationInfo> = {}
      for (const proposal of proposalPage.content.filter((item) => item.status === 'NEGOTIATING' || item.status === 'OFFER_ACCEPTED')) {
        try {
          const latest = await negotiationApi.getLatest(proposal.id)
          if (latest) {
            latestNegotiationMap[proposal.id] = latest
          }
        } catch {
          continue
        }
      }
      setNegotiations(latestNegotiationMap)

      const uniqueJobIds = Array.from(new Set(proposalPage.content.map((proposal) => proposal.jobId)))
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

      setJobMap(
        jobEntries.reduce<Record<string, JobResponse>>((acc, entry) => {
          if (entry) acc[entry[0]] = entry[1]
          return acc
        }, {})
      )
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load your proposals.')
    } finally {
      setLoading(false)
    }
  }

  const tabCounts = useMemo(() => {
    const archived = proposals.filter((proposal) => ['WITHDRAWN', 'DRAFT', 'AUTO_CLOSED', 'CONTRACT_CANCELLED'].includes(proposal.status)).length
    const awaiting = proposals.filter((proposal) => {
      if (proposal.status === 'NEGOTIATING') return negotiations[proposal.id]?.senderType !== 'CLIENT'
      return proposal.status === 'SUBMITTED' || proposal.status === 'UNDER_REVIEW'
    }).length

    return {
      ALL: proposals.length,
      AWAITING: awaiting,
      NEGOTIATING: proposals.filter((proposal) => proposal.status === 'NEGOTIATING').length,
      ACCEPTED: proposals.filter((proposal) => proposal.status === 'ACCEPTED').length,
      REJECTED: proposals.filter((proposal) => ['REJECTED', 'AUTO_CLOSED', 'CONTRACT_CANCELLED'].includes(proposal.status)).length,
      ARCHIVED: archived,
    }
  }, [negotiations, proposals])

  const pendingNegotiationItems = useMemo(
    () =>
      proposals
        .filter((proposal) => proposal.status === 'NEGOTIATING' && negotiations[proposal.id]?.senderType === 'CLIENT')
        .sort((a, b) => new Date(negotiations[b.id].createdAt).getTime() - new Date(negotiations[a.id].createdAt).getTime()),
    [negotiations, proposals]
  )

  const stats = useMemo(() => {
    const total = proposals.length
    const awaitingResponse = tabCounts.AWAITING
    const negotiating = tabCounts.NEGOTIATING
    const accepted = tabCounts.ACCEPTED
    const rejected = tabCounts.REJECTED
    const responseRate = total > 0 ? Math.round(((accepted + negotiating) / total) * 100) : 0
    const potentialEarnings = proposals
      .filter((proposal) => proposal.status === 'ACCEPTED')
      .reduce((sum, proposal) => sum + normalizeProposalValue(proposal), 0)

    return {
      total,
      awaitingResponse,
      negotiating,
      accepted,
      rejected,
      responseRate,
      potentialEarnings,
    }
  }, [proposals, tabCounts])

  const filteredProposals = useMemo(() => {
    return proposals
      .filter((proposal) => {
        const job = jobMap[proposal.jobId]
        const categoryId = job?.categoryId ? String(job.categoryId) : ''
        const query = searchQuery.trim().toLowerCase()

        const tabMatch =
          activeTab === 'ALL'
            ? true
            : activeTab === 'AWAITING'
              ? proposal.status === 'SUBMITTED' ||
                proposal.status === 'UNDER_REVIEW' ||
                (proposal.status === 'NEGOTIATING' && negotiations[proposal.id]?.senderType !== 'CLIENT')
              : activeTab === 'NEGOTIATING'
                ? proposal.status === 'NEGOTIATING'
                : activeTab === 'ACCEPTED'
                  ? proposal.status === 'ACCEPTED'
                  : activeTab === 'REJECTED'
                    ? ['REJECTED', 'AUTO_CLOSED', 'CONTRACT_CANCELLED'].includes(proposal.status)
                    : ['WITHDRAWN', 'DRAFT', 'AUTO_CLOSED', 'CONTRACT_CANCELLED'].includes(proposal.status)

        const statusMatch = statusFilter === 'ALL' || proposal.status === statusFilter
        const categoryMatch = categoryFilter === 'ALL' || categoryId === categoryFilter
        const searchMatch =
          query === '' ||
          proposal.jobTitle.toLowerCase().includes(query) ||
          (job?.description || proposal.coverLetter || '').toLowerCase().includes(query)

        return tabMatch && statusMatch && categoryMatch && searchMatch
      })
      .sort((a, b) => {
        const aPriority = a.status === 'NEGOTIATING' && negotiations[a.id]?.senderType === 'CLIENT' ? 1 : 0
        const bPriority = b.status === 'NEGOTIATING' && negotiations[b.id]?.senderType === 'CLIENT' ? 1 : 0
        if (aPriority !== bPriority) return bPriority - aPriority
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      })
  }, [activeTab, categoryFilter, jobMap, negotiations, proposals, searchQuery, statusFilter])

  if (loading) {
    return (
      <div className="space-y-6 pt-6">
        <div className="grid gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-40" />
            </div>
            <Skeleton className="h-16 w-full rounded-2xl" />
            <div className="space-y-5 rounded-3xl bg-white p-6 shadow-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <ProposalCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageShell
        title="My Proposals"
        description="Track and manage all your active negotiations and submitted proposals."
        actions={
          <>
            {pendingNegotiationItems.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('NEGOTIATING')}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-sm font-medium text-amber-700 shadow-sm hover:bg-amber-100"
              >
                <MessageCircleMore className="h-4 w-4" />
                {pendingNegotiationItems.length} pending reply
              </button>
            )}
            <Link
              to="/jobs"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <Search className="h-4 w-4" />
              Browse Jobs
            </Link>
          </>
        }
      >
      <div className="grid gap-6">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((tab) => {
                const count = tabCounts[tab.key]
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${isActive ? 'bg-slate-700 text-slate-100 dark:bg-slate-200 dark:text-slate-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="relative min-w-[240px] md:max-w-[320px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search proposals..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
              />
            </div>
          </div>

            {/* Sub-filters */}
            <div className="flex flex-wrap items-center gap-3">
              <MiniSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  ['ALL', 'All Statuses'],
                  ['SUBMITTED', 'Submitted'],
                  ['NEGOTIATING', 'Negotiating'],
                  ['OFFER_ACCEPTED', 'Offer agreed'],
                  ['ACCEPTED', 'Contract active'],
                  ['REJECTED', 'Rejected'],
                  ['AUTO_CLOSED', 'Closed'],
                  ['WITHDRAWN', 'Withdrawn'],
                ]}
              />
              <MiniSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={[['ALL', 'All Categories'], ...categories.map((item) => [String(item.id), item.name] as [string, string])]}
              />
              {(statusFilter !== 'ALL' || categoryFilter !== 'ALL' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL')
                    setCategoryFilter('ALL')
                    setSearchQuery('')
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-4 pt-2">
              {error && (
                <div className="mx-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
                  {error}
                </div>
              )}

              {filteredProposals.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                    <Search className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-[17px] font-black tracking-tight text-slate-900">No proposals found</p>
                  <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">
                    We couldn't find any proposals matching your current filters. Try adjusting them or clear the search.
                  </p>
                </div>
              ) : (
                filteredProposals.map((proposal) => {
                  const job = jobMap[proposal.jobId]
                  const categoryName = categories.find((item) => item.id === job?.categoryId)?.name || 'General'
                  const negotiation = negotiations[proposal.id]
                  const statusMeta = getStatusMeta(proposal.status, negotiation)
                  const rowTone = getRowTone(proposal.status, negotiation?.senderType)
                  const currentOffer = getCurrentOffer(proposal, negotiation)
                  const clientName = job?.clientName || job?.client?.fullName || 'Client'
                  const clientAvatar = job?.client?.avatarUrl
                  const cta = getProposalCta(proposal.status)
                  const lastActivityAt = negotiation?.createdAt || proposal.updatedAt || proposal.createdAt
                  const lastActivityLabel = proposal.submittedAt && proposal.submittedAt !== lastActivityAt ? `Last activity ${formatRelativeTime(lastActivityAt)}` : `Submitted ${formatRelativeTime(proposal.submittedAt || proposal.createdAt)}`

                  return (
                    <article
                      key={proposal.id}
                      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700">
                            {clientAvatar ? (
                              <img src={clientAvatar} alt={clientName} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{clientName.charAt(0)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h2 className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                              {proposal.jobTitle}
                            </h2>
                            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{clientName}</span>
                              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                              <span>{categoryName}</span>
                              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                              <span>{lastActivityLabel}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-start md:items-end">
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{currentOffer.primary}</p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Your Offer</p>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${rowTone.badge}`}>
                            {getStatusLabel(proposal.status)}
                          </span>
                          <p className={`flex items-center gap-1.5 text-sm font-medium ${rowTone.message}`}>
                            {statusMeta.icon}
                            {statusMeta.helper}
                          </p>
                        </div>

                        <div className="flex w-full items-center gap-2 sm:w-auto">
                          {job?.clientId && (
                            <button
                              type="button"
                              onClick={() =>
                                setChatDrawer({
                                  recipientId: job.clientId,
                                  contextId: proposal.id,
                                  title: clientName,
                                  subtitle: 'Proposal discussion',
                                })
                              }
                              className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:flex-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              Message
                            </button>
                          )}
                          <Link
                            to={`/mentor/proposals/${proposal.id}`}
                            className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 sm:flex-none dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                          >
                            View details
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </PageShell>

      <ContextualChatDrawer
        open={!!chatDrawer}
        onOpenChange={(open) => {
          if (!open) {
            setChatDrawer(null)
          }
        }}
        recipientId={chatDrawer?.recipientId}
        contextType="PROPOSAL"
        contextId={chatDrawer?.contextId}
        title={chatDrawer?.title}
        subtitle={chatDrawer?.subtitle}
      />
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
      className="h-9 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white px-3.5 pr-8 text-[13px] font-medium text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  )
}

function ProposalMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="text-slate-400 dark:text-slate-500">{icon}</div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}



function getStatusLabel(status: string) {
  switch (status) {
    case 'SUBMITTED':
      return 'Submitted'
    case 'NEGOTIATING':
      return 'Negotiating'
    case 'OFFER_ACCEPTED':
      return 'Offer agreed'
    case 'ACCEPTED':
      return 'Contract active'
    case 'REJECTED':
      return 'Rejected'
    case 'AUTO_CLOSED':
      return 'Closed'
    case 'CONTRACT_CANCELLED':
      return 'Contract cancelled'
    case 'WITHDRAWN':
      return 'Withdrawn'
    case 'UNDER_REVIEW':
      return 'In review'
    default:
      return status
  }
}

function getStatusMeta(status: string, negotiation?: NegotiationInfo) {
  switch (status) {
    case 'SUBMITTED':
      return {
        icon: <Clock3 className="h-3 w-3" />,
        helper: 'Waiting for the client to review your proposal.',
      }
    case 'NEGOTIATING':
      return {
        icon: <MessageCircleMore className="h-3 w-3" />,
        helper: negotiation?.senderType === 'CLIENT' ? 'Client countered. Action required.' : 'Negotiation sent, waiting for client.',
      }
    case 'OFFER_ACCEPTED':
      return {
        icon: <CheckCircle2 className="h-3 w-3" />,
        helper: 'Terms agreed. Waiting for client to lock escrow.',
      }
    case 'ACCEPTED':
      return {
        icon: <Zap className="h-3 w-3" />,
        helper: 'Contract is fully active. You can begin work.',
      }
    case 'REJECTED':
      return {
        icon: <Circle className="h-3 w-3" />,
        helper: 'The client declined this proposal.',
      }
    case 'WITHDRAWN':
      return {
        icon: <Circle className="h-3 w-3" />,
        helper: 'You withdrew this proposal.',
      }
    default:
      return {
        icon: <Circle className="h-3 w-3" />,
        helper: 'Proposal is closed or archived.',
      }
  }
}

function getProposalCta(status: string) {
  switch (status) {
    case 'NEGOTIATING':
      return {
        label: 'View details',
        className: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20',
      }
    case 'OFFER_ACCEPTED':
      return {
        label: 'Waiting for client',
        className: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
      }
    case 'ACCEPTED':
      return {
        label: 'View contract',
        className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
      }
    case 'REJECTED':
    case 'AUTO_CLOSED':
    case 'CONTRACT_CANCELLED':
    case 'WITHDRAWN':
      return {
        label: 'View history',
        className: 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
      }
    default:
      return {
        label: 'View proposal',
        className: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20',
      }
  }
}

function getRowTone(status: string, latestSender?: 'CLIENT' | 'MENTOR') {
  switch (status) {
    case 'NEGOTIATING':
      if (latestSender === 'CLIENT') {
        return {
          badge: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
          message: 'text-amber-600',
        }
      }
      return {
        badge: 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/60',
        message: 'text-indigo-500',
      }
    case 'OFFER_ACCEPTED':
      return {
        badge: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60',
        message: 'text-emerald-600',
      }
    case 'ACCEPTED':
      return {
        badge: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300/60',
        message: 'text-emerald-600',
      }
    case 'REJECTED':
    case 'AUTO_CLOSED':
    case 'CONTRACT_CANCELLED':
    case 'WITHDRAWN':
      return {
        badge: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
        message: 'text-slate-400',
      }
    default:
      return {
        badge: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200/60',
        message: 'text-slate-500',
      }
  }
}

function getClientBudget(job?: JobResponse) {
  if (!job) return 'TBD'
  if (job.budgetMinMxc && job.budgetMaxMxc) {
    if (job.budgetMinMxc === job.budgetMaxMxc) return formatCurrency(job.budgetMinMxc)
    return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
  }
  if (job.budgetMinMxc) return formatCurrency(job.budgetMinMxc)
  if (job.hourlyRateMxc) return `${formatCurrency(job.hourlyRateMxc)} / hr`
  return 'TBD'
}

function getProposalValue(proposal: ProposalResponse) {
  if (proposal.proposedHourlyRate) return `${formatCurrency(proposal.proposedHourlyRate)} / hr`
  if (proposal.proposedAmount) return formatCurrency(proposal.proposedAmount)
  return 'Not set'
}

function getCurrentOffer(proposal: ProposalResponse, negotiation?: NegotiationInfo) {
  if (negotiation?.proposedAmount) {
    return {
      primary: formatCurrency(negotiation.proposedAmount),
    }
  }

  if ((negotiation?.estimatedDurationDays || negotiation?.deadlineAt) && !negotiation?.proposedAmount) {
    return {
      primary: getProposalValue(proposal),
    }
  }

  return {
    primary: getProposalValue(proposal),
  }
}

function getTimelineValue(proposal: ProposalResponse, negotiation?: NegotiationInfo) {
  if (negotiation?.deadlineAt) return formatDeadline(negotiation.deadlineAt)
  if (negotiation?.estimatedDurationDays) return `${negotiation.estimatedDurationDays} days`
  if (proposal.deadlineAt) return formatDeadline(proposal.deadlineAt)
  if (proposal.estimatedDurationDays) return `${proposal.estimatedDurationDays} days`
  return 'Flexible'
}

function getCurrentStep(status: string) {
  switch (status) {
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      return 2
    case 'NEGOTIATING':
      return 3
    case 'OFFER_ACCEPTED':
      return 4
    case 'ACCEPTED':
      return 5
    default:
      return 1
  }
}

function normalizeProposalValue(proposal: ProposalResponse) {
  return proposal.proposedAmount || proposal.proposedHourlyRate || 0
}



function ProposalCardSkeleton() {
  return (
    <div className="rounded-[24px] border border-slate-100 bg-white p-5">
      <div className="flex items-start gap-4">
        <SkeletonCircle size="h-12 w-12 rounded-[16px]" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 rounded-[16px] bg-slate-50 p-4 lg:grid-cols-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full lg:col-span-2" />
      </div>
    </div>
  )
}
