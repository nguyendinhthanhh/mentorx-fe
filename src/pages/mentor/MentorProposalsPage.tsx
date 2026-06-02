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
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'

interface NegotiationInfo {
  id: string
  message: string
  proposedAmount?: number
  estimatedDurationDays?: number
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
  { key: 'AWAITING', label: 'Awaiting Response' },
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
          latestNegotiationMap[proposal.id] = latest
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
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-9 w-32" />
            </div>
            <Skeleton className="h-12 w-full rounded-2xl" />
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <ProposalCardSkeleton key={i} />
              ))}
            </div>
          </div>
          <div className="hidden space-y-6 xl:block">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="-ml-2 mx-auto max-w-[1560px] space-y-7">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-[32px] font-black tracking-tight text-slate-950">My Proposals</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Track submitted proposals, ongoing negotiations, and client responses in one place.
              </p>
              <div className="mt-4 hidden items-center gap-2 lg:flex">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600">
                  <BellRing className="h-3 w-3" /> {stats.total}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                  <Clock3 className="h-3 w-3" /> {stats.awaitingResponse} awaiting
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600">
                  <MessageCircleMore className="h-3 w-3" /> {stats.negotiating} negotiating
                </span>
                {stats.accepted > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> {stats.accepted} active contracts
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {pendingNegotiationItems.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('NEGOTIATING')}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-700 transition hover:bg-amber-100"
                >
                  <MessageCircleMore className="h-3.5 w-3.5" />
                  {pendingNegotiationItems.length} pending reply
                </button>
              ) : null}
              <Link
                to="/mentor/jobs"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
              >
                + Browse jobs
              </Link>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                {tabs.map((tab) => {
                  const count = tabCounts[tab.key]
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
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="relative ml-auto min-w-[240px] flex-1 lg:max-w-[360px]">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search proposals or job titles..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-5 py-4">
              <div className="hidden items-center gap-2 lg:flex">
                <MiniSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    ['ALL', 'Status'],
                    ['SUBMITTED', 'Submitted'],
                    ['NEGOTIATING', 'Negotiating'],
                    ['OFFER_ACCEPTED', 'Offer agreed'],
                    ['ACCEPTED', 'Contract active'],
                    ['REJECTED', 'Rejected'],
                    ['AUTO_CLOSED', 'Closed'],
                    ['CONTRACT_CANCELLED', 'Contract cancelled'],
                    ['WITHDRAWN', 'Withdrawn'],
                  ]}
                />
                <MiniSelect value={categoryFilter} onChange={setCategoryFilter} options={[['ALL', 'Category'], ...categories.map((item) => [String(item.id), item.name] as [string, string])]} />
                {statusFilter !== 'ALL' || categoryFilter !== 'ALL' || searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('ALL')
                      setCategoryFilter('ALL')
                      setSearchQuery('')
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 px-4 py-4">
              {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div> : null}

              {filteredProposals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-14 text-center">
                  <p className="text-lg font-black text-slate-900">No proposals match the current view</p>
                  <p className="mt-2 text-sm text-slate-500">Adjust the filters or submit a new proposal from the jobs marketplace.</p>
                </div>
              ) : (
                filteredProposals.map((proposal) => {
                  const job = jobMap[proposal.jobId]
                  const categoryName = categories.find((item) => item.id === job?.categoryId)?.name || 'General'
                  const negotiation = negotiations[proposal.id]
                  const statusMeta = getStatusMeta(proposal.status, negotiation)
                  const rowTone = getRowTone(proposal.status)
                  const currentOffer = getCurrentOffer(proposal, negotiation)
                  const clientName = job?.clientName || job?.client?.fullName || 'Client'
                  const clientAvatar = job?.client?.avatarUrl
                  const cta = getProposalCta(proposal.status)
                  const lastActivityAt = negotiation?.createdAt || proposal.updatedAt || proposal.createdAt
                  const lastActivityLabel = proposal.submittedAt && proposal.submittedAt !== lastActivityAt ? `Last activity ${formatRelativeTime(lastActivityAt)}` : `Submitted ${formatRelativeTime(proposal.submittedAt || proposal.createdAt)}`

                  return (
                    <article key={proposal.id} className={`overflow-hidden rounded-[26px] border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${rowTone.border}`}>
                      <div className="px-5 py-5">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                            {clientAvatar ? (
                              <img src={clientAvatar} alt={clientName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-[10px] font-black text-indigo-600">
                                {clientName.charAt(0)}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h2 className="truncate text-sm font-bold text-slate-950">{proposal.jobTitle}</h2>
                              <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${rowTone.badge}`}>{getStatusLabel(proposal.status)}</span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {clientName} · {categoryName} · {lastActivityLabel}
                            </p>
                            <p className={`mt-1.5 text-[11px] font-medium ${rowTone.message}`}>{statusMeta.helper}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {job?.clientId ? (
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
                                className="inline-flex h-8 shrink-0 items-center rounded-lg border border-slate-200 px-3 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
                              >
                                Message
                              </button>
                            ) : null}
                            <Link
                              to={`/mentor/proposals/${proposal.id}`}
                              className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-3 text-[11px] font-bold transition ${cta.className}`}
                            >
                              {cta.label}
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>

                        <div className="mt-3 rounded-xl bg-slate-50/80 px-3 py-3">
                          <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                            <div className="grid grid-cols-2 gap-3 text-[11px]">
                              <ProposalMetric label="Client budget" value={getClientBudget(job)} />
                              <ProposalMetric label="Your offer" value={currentOffer.primary} />
                              <ProposalMetric label="Delivery time" value={getTimelineValue(proposal, negotiation)} />
                              <ProposalMetric label="Current status" value={getStatusLabel(proposal.status)} />
                            </div>

                            <div className="flex items-center justify-start md:justify-end">
                              <div className="flex items-center gap-0">
                                {stageLabels.map((label, index) => {
                                  const step = index + 1
                                  const currentStep = getCurrentStep(proposal.status)
                                  const reached = step <= currentStep
                                  const active = step === currentStep

                                  return (
                                    <div key={label} className="flex items-center">
                                      <div className="flex items-center gap-1">
                                        <div className={`h-2 w-2 rounded-full ${reached ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                                        {active ? <span className="whitespace-nowrap text-[9px] font-bold text-indigo-600">{label}</span> : null}
                                      </div>
                                      {step < stageLabels.length ? <div className={`mx-1 h-px w-3 ${step < currentStep ? 'bg-indigo-400' : 'bg-slate-200'}`} /> : null}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-950">Negotiation Inbox</h3>
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-rose-100 px-2 text-xs font-black text-rose-600">
                {pendingNegotiationItems.length}
              </span>
            </div>

            {pendingNegotiationItems.length > 0 ? (
              <div className="mt-4 space-y-4">
                {pendingNegotiationItems.slice(0, 3).map((proposal) => {
                  const negotiation = negotiations[proposal.id]
                  const clientName = jobMap[proposal.jobId]?.clientName || jobMap[proposal.jobId]?.client?.fullName || 'Client'
                  const avatarUrl = jobMap[proposal.jobId]?.client?.avatarUrl
                  return (
                    <Link key={proposal.id} to={`/mentor/proposals/${proposal.id}`} className="flex items-start gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={clientName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-xs font-black text-indigo-600">
                            {clientName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="truncate text-sm font-black text-slate-950">{clientName}</p>
                            <p className="mt-1 text-xs font-medium text-amber-600">Pending negotiation request</p>
                          </div>
                          <p className="whitespace-nowrap text-xs text-slate-400">{formatRelativeTime(negotiation?.createdAt || proposal.updatedAt)}</p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center">
                <p className="text-sm font-bold text-slate-900">No pending negotiation requests.</p>
              </div>
            )}

            <Link
              to="/mentor/proposals"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
            >
              View all proposals
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>

          <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-950">Potential Earnings</h3>
              <span className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500">Active contracts</span>
            </div>
            <p className="mt-5 text-[36px] font-black tracking-tight text-slate-950">{formatCompactMxc(stats.potentialEarnings)} MXC</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Based on proposals that already became active contracts. Escrow is locked after client acceptance, payout happens only after completion.
            </p>
          </aside>

          <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-950">Proposal Tips</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">Static</span>
            </div>
            <div className="mt-4 space-y-4">
              <SuggestionRow tone="blue" title="Respond quickly to improve acceptance rate." text="Fast follow-up helps keep negotiations active." />
              <SuggestionRow tone="indigo" title="Keep delivery time realistic." text="Clear and achievable timelines build trust with clients." />
              <SuggestionRow tone="amber" title="Clarify scope before accepting offer." text="Offer agreed does not start the contract until the client accepts and locks escrow." />
            </div>
          </aside>

          <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-950">Recommended Jobs</h3>
              <Link to="/mentor/jobs" className="text-sm font-bold text-indigo-600">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {recommendedJobs.slice(0, 2).map((job) => (
                <div key={job.jobId} className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-black text-slate-950">{job.title}</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">{getClientBudget(job)}</p>
                  <p className="mt-1 text-xs text-emerald-600">{getRecommendedMatch(job)}% match</p>
                  <Link
                    to={`/jobs/${job.jobId}`}
                    className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white transition hover:bg-indigo-700"
                  >
                    View Job
                  </Link>
                </div>
              ))}
            </div>
          </aside>
        </aside>
      </div>

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
      className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-600 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  )
}

function ProposalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-[11px] font-bold text-slate-700">{value}</p>
    </div>
  )
}

function SuggestionRow({
  tone,
  title,
  text,
}: {
  tone: 'blue' | 'indigo' | 'amber'
  title: string
  text: string
}) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-500',
    indigo: 'bg-indigo-50 text-indigo-500',
    amber: 'bg-amber-50 text-amber-500',
  }

  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${toneClass[tone]}`}>
        <Circle className="h-3 w-3 fill-current" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{text}</p>
      </div>
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
        helper: 'Waiting for the client to review your proposal.',
      }
    case 'NEGOTIATING':
      return {
        helper: negotiation?.senderType === 'CLIENT' ? 'Client sent a counter-offer, continue negotiation.' : 'Negotiation is open, waiting for the client response.',
      }
    case 'OFFER_ACCEPTED':
      return {
        helper: 'Offer agreed. Waiting for client to accept mentor and lock escrow.',
      }
    case 'ACCEPTED':
      return {
        helper: 'Contract is active. Escrow is locked and payout happens after completion.',
      }
    case 'REJECTED':
      return {
        helper: 'The client decided not to move forward with this proposal.',
      }
    case 'AUTO_CLOSED':
      return {
        helper: 'The client selected another mentor for this job.',
      }
    case 'CONTRACT_CANCELLED':
      return {
        helper: 'This contract was cancelled. The old deal remains in history.',
      }
    case 'WITHDRAWN':
      return {
        helper: 'You withdrew this proposal before it became a contract.',
      }
    default:
      return {
        helper: 'Track updates here as the proposal moves forward.',
      }
  }
}

function getProposalCta(status: string) {
  switch (status) {
    case 'NEGOTIATING':
      return {
        label: 'Continue negotiation',
        className: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
      }
    case 'OFFER_ACCEPTED':
      return {
        label: 'Waiting for client',
        className: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
      }
    case 'ACCEPTED':
      return {
        label: 'View contract',
        className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
      }
    case 'REJECTED':
    case 'AUTO_CLOSED':
    case 'CONTRACT_CANCELLED':
      return {
        label: 'View result',
        className: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
      }
    default:
      return {
        label: 'View details',
        className: 'bg-indigo-600 text-white hover:bg-indigo-700',
      }
  }
}

function getRowTone(status: string) {
  switch (status) {
    case 'NEGOTIATING':
      return {
        border: 'border-slate-200',
        badge: 'bg-amber-50 text-amber-700',
        message: 'text-amber-700',
      }
    case 'OFFER_ACCEPTED':
      return {
        border: 'border-slate-200',
        badge: 'bg-indigo-50 text-indigo-700',
        message: 'text-indigo-700',
      }
    case 'ACCEPTED':
      return {
        border: 'border-slate-200',
        badge: 'bg-emerald-50 text-emerald-700',
        message: 'text-emerald-700',
      }
    case 'REJECTED':
    case 'AUTO_CLOSED':
    case 'CONTRACT_CANCELLED':
      return {
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-600',
        message: 'text-slate-500',
      }
    default:
      return {
        border: 'border-slate-200',
        badge: 'bg-blue-50 text-blue-700',
        message: 'text-slate-500',
      }
  }
}

function getClientBudget(job?: JobResponse) {
  if (!job) return 'Budget TBD'
  if (job.budgetMinMxc && job.budgetMaxMxc) return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
  if (job.hourlyRateMxc) return `${formatCurrency(job.hourlyRateMxc)} / hr`
  return 'Budget TBD'
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

  if (negotiation?.estimatedDurationDays && !negotiation?.proposedAmount) {
    return {
      primary: getProposalValue(proposal),
    }
  }

  return {
    primary: getProposalValue(proposal),
  }
}

function getTimelineValue(proposal: ProposalResponse, negotiation?: NegotiationInfo) {
  if (negotiation?.estimatedDurationDays) {
    return `${negotiation.estimatedDurationDays} days`
  }
  if (proposal.estimatedDurationDays) {
    return `${proposal.estimatedDurationDays} days`
  }
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

function formatCompactMxc(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function getRecommendedMatch(job: JobResponse) {
  if (job.requiredSkills?.length) {
    return Math.min(92, 70 + job.requiredSkills.length * 4)
  }
  return 76
}

function ProposalCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex items-center gap-3">
        <SkeletonCircle size="h-8 w-8" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="mt-4 flex gap-4">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}
