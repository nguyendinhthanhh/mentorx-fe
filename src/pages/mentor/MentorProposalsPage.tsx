import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Circle,
  Clock3,
  Loader2,
  MessageCircleMore,
  RefreshCw,
  Search,
} from 'lucide-react'
import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/ui/Skeleton'
import { categoryApi } from '@/api/categoryApi'
import { jobApi } from '@/api/jobApi'
import { mentorApi } from '@/api/mentorApi'
import { negotiationApi } from '@/api/negotiationApi'
import { proposalApi } from '@/api/proposalApi'
import { useAuthStore } from '@/store/authStore'
import { CategoryResponse, JobResponse, MentorProfileResponse, ProposalResponse } from '@/types'
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/formatters'

interface NegotiationInfo {
  id: string
  message: string
  proposedAmount?: number
  estimatedDurationDays?: number
  senderType: 'CLIENT' | 'MENTOR'
  senderName: string
  createdAt: string
}

type TabKey = 'ALL' | 'AWAITING' | 'NEGOTIATING' | 'ACCEPTED' | 'REJECTED' | 'ARCHIVED'

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'AWAITING', label: 'Awaiting Response' },
  { key: 'NEGOTIATING', label: 'Negotiating' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ARCHIVED', label: 'Archived' },
]

export default function MentorProposalsPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [proposals, setProposals] = useState<ProposalResponse[]>([])
  const [jobMap, setJobMap] = useState<Record<string, JobResponse>>({})
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [negotiations, setNegotiations] = useState<Record<string, NegotiationInfo>>({})
  const [recommendedMentors, setRecommendedMentors] = useState<MentorProfileResponse[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<JobResponse[]>([])

  const [activeTab, setActiveTab] = useState<TabKey>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [negotiationFilter, setNegotiationFilter] = useState('ALL')
  const [budgetFilter, setBudgetFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')

  useEffect(() => {
    void loadData()
  }, [user?.userId])

  const loadData = async () => {
    if (!user?.userId) return

    try {
      setLoading(true)
      setError('')

      const [proposalPage, categoryList, mentorsPage, jobsPage] = await Promise.all([
        proposalApi.getByMentor(user.userId, { page: 0, size: 100 }),
        categoryApi.getAllActive().catch(() => [] as CategoryResponse[]),
        mentorApi.getAllApprovedMentors({ page: 0, size: 3, sortBy: 'averageRating', sortDir: 'desc' }).catch(() => ({
          content: [] as MentorProfileResponse[],
        })),
        jobApi.getOpenJobs({ page: 0, size: 4 }).catch(() => ({ content: [] as JobResponse[] })),
      ])

      setProposals(proposalPage.content)
      setCategories(categoryList)
      setRecommendedMentors(mentorsPage.content || [])
      setRecommendedJobs(jobsPage.content || [])

      const latestNegotiationMap: Record<string, NegotiationInfo> = {}
      for (const proposal of proposalPage.content.filter((item) => item.status === 'NEGOTIATING')) {
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
      setError(err.response?.data?.message || 'Khong the tai proposals')
    } finally {
      setLoading(false)
    }
  }

  const tabCounts = useMemo(() => {
    const archived = proposals.filter((proposal) => proposal.status === 'WITHDRAWN' || proposal.status === 'DRAFT').length
    const awaiting = proposals.filter((proposal) => {
      if (proposal.status === 'NEGOTIATING') return negotiations[proposal.id]?.senderType !== 'CLIENT'
      return proposal.status === 'SUBMITTED' || proposal.status === 'UNDER_REVIEW'
    }).length

    return {
      ALL: proposals.length,
      AWAITING: awaiting,
      NEGOTIATING: proposals.filter((proposal) => proposal.status === 'NEGOTIATING').length,
      ACCEPTED: proposals.filter((proposal) => proposal.status === 'ACCEPTED').length,
      REJECTED: proposals.filter((proposal) => proposal.status === 'REJECTED').length,
      ARCHIVED: archived,
    }
  }, [negotiations, proposals])

  const activeNegotiations = useMemo(
    () => proposals.filter((proposal) => proposal.status === 'NEGOTIATING' && negotiations[proposal.id]?.senderType === 'CLIENT'),
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
      .filter((proposal) => proposal.status === 'ACCEPTED' || proposal.status === 'NEGOTIATING')
      .reduce((sum, proposal) => sum + (proposal.proposedAmount || proposal.proposedHourlyRate || 0), 0)

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
    return proposals.filter((proposal) => {
      const job = jobMap[proposal.jobId]
      const categoryId = job?.categoryId ? String(job.categoryId) : ''
      const query = searchQuery.trim().toLowerCase()

      const tabMatch =
        activeTab === 'ALL' ? true :
        activeTab === 'AWAITING' ? (proposal.status === 'SUBMITTED' || proposal.status === 'UNDER_REVIEW' || (proposal.status === 'NEGOTIATING' && negotiations[proposal.id]?.senderType !== 'CLIENT')) :
        activeTab === 'NEGOTIATING' ? proposal.status === 'NEGOTIATING' :
        activeTab === 'ACCEPTED' ? proposal.status === 'ACCEPTED' :
        activeTab === 'REJECTED' ? proposal.status === 'REJECTED' :
        proposal.status === 'WITHDRAWN' || proposal.status === 'DRAFT'

      const statusMatch = statusFilter === 'ALL' || proposal.status === statusFilter
      const negotiationMatch =
        negotiationFilter === 'ALL' ||
        (negotiationFilter === 'ACTIVE' && proposal.status === 'NEGOTIATING') ||
        (negotiationFilter === 'CLIENT_WAITING' && proposal.status === 'NEGOTIATING' && negotiations[proposal.id]?.senderType === 'CLIENT') ||
        (negotiationFilter === 'MENTOR_WAITING' && proposal.status === 'NEGOTIATING' && negotiations[proposal.id]?.senderType !== 'CLIENT')
      const budgetMatch =
        budgetFilter === 'ALL' ||
        (budgetFilter === 'FIXED' && Boolean(proposal.proposedAmount || job?.budgetMinMxc || job?.budgetMaxMxc)) ||
        (budgetFilter === 'HOURLY' && Boolean(proposal.proposedHourlyRate || job?.hourlyRateMxc))
      const categoryMatch = categoryFilter === 'ALL' || categoryId === categoryFilter
      const dateMatch =
        dateFilter === 'ALL' ||
        (dateFilter === 'TODAY' && isWithinDays(proposal.updatedAt || proposal.createdAt, 1)) ||
        (dateFilter === 'WEEK' && isWithinDays(proposal.updatedAt || proposal.createdAt, 7)) ||
        (dateFilter === 'MONTH' && isWithinDays(proposal.updatedAt || proposal.createdAt, 30))
      const searchMatch =
        query === '' ||
        proposal.jobTitle.toLowerCase().includes(query) ||
        (job?.description || proposal.coverLetter).toLowerCase().includes(query)

      return tabMatch && statusMatch && negotiationMatch && budgetMatch && categoryMatch && dateMatch && searchMatch
    }).sort((a, b) => {
      const aPriority = a.status === 'NEGOTIATING' && negotiations[a.id]?.senderType === 'CLIENT' ? 1 : 0
      const bPriority = b.status === 'NEGOTIATING' && negotiations[b.id]?.senderType === 'CLIENT' ? 1 : 0
      if (aPriority !== bPriority) return bPriority - aPriority
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    })
  }, [activeTab, budgetFilter, categoryFilter, dateFilter, jobMap, negotiationFilter, negotiations, proposals, searchQuery, statusFilter])

  const inboxItems = useMemo(
    () =>
      proposals
        .filter((proposal) => proposal.status === 'NEGOTIATING' && negotiations[proposal.id])
        .sort((a, b) => new Date(negotiations[b.id].createdAt).getTime() - new Date(negotiations[a.id].createdAt).getTime())
        .slice(0, 3),
    [negotiations, proposals]
  )

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
                    <CheckCircle2 className="h-3 w-3" /> {stats.accepted} accepted
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeNegotiations.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('NEGOTIATING')}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-700 transition hover:bg-amber-100"
                >
                  <MessageCircleMore className="h-3.5 w-3.5" />
                  {activeNegotiations.length} pending reply
                </button>
              ) : null}
              <Link
                to="/mentor/jobs"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
              >
                + New Proposal
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
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
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
                <MiniSelect value={statusFilter} onChange={setStatusFilter} options={[['ALL', 'Status'], ['SUBMITTED', 'Submitted'], ['UNDER_REVIEW', 'In Review'], ['NEGOTIATING', 'Negotiation'], ['ACCEPTED', 'Accepted'], ['REJECTED', 'Rejected']]} />
                <MiniSelect value={categoryFilter} onChange={setCategoryFilter} options={[['ALL', 'Category'], ...categories.map((item) => [String(item.id), item.name] as [string, string])]} />
                {(statusFilter !== 'ALL' || categoryFilter !== 'ALL' || searchQuery) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('ALL')
                      setNegotiationFilter('ALL')
                      setBudgetFilter('ALL')
                      setCategoryFilter('ALL')
                      setDateFilter('ALL')
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
              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
              ) : null}

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
                  const rowTone = getRowTone(proposal.status)
                  const currentOffer = getCurrentOffer(proposal, negotiation)
                  const clientName = job?.clientName || job?.client?.fullName || 'Client'
                  const clientAvatar = job?.client?.avatarUrl
                  const footerText = negotiation?.senderType === 'CLIENT' ? 'Counter-offer received' : negotiation ? 'Waiting for client' : proposal.status === 'ACCEPTED' ? 'Ready to start contract' : 'Proposal submitted'

                  return (
                    <article key={proposal.id} className={`overflow-hidden rounded-[26px] border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${rowTone.border}`}>
                      <div className="px-5 py-5">
                        {/* Row 1: Avatar + Title + Badges + Actions */}
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
                              {clientName} · {categoryName} · {formatRelativeTime(proposal.updatedAt || proposal.createdAt)}
                              {proposal.estimatedDurationDays ? ` · ${proposal.estimatedDurationDays} days` : ''}
                            </p>
                          </div>
                          <Link
                            to={`/mentor/proposals/${proposal.id}`}
                            className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-3 text-[11px] font-bold text-white transition ${proposal.status === 'ACCEPTED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                          >
                            {proposal.status === 'ACCEPTED' ? 'View' : 'Open'}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>

                        {/* Row 2: Budget flow + Step progress */}
                        <div className="mt-2 flex items-center gap-4 rounded-lg bg-slate-50/80 px-3 py-2">
                          {/* Budget flow */}
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-slate-400">Budget</span>
                            <span className="font-bold text-slate-600">{getClientBudget(job)}</span>
                            <span className="text-slate-300">→</span>
                            <span className="text-slate-400">Yours</span>
                            <span className="font-bold text-slate-700">{getProposalValue(proposal)}</span>
                            {currentOffer.primary !== getProposalValue(proposal) ? (
                              <>
                                <span className="text-slate-300">→</span>
                                <span className={`font-bold ${currentOffer.highlight === 'amber' ? 'text-amber-600' : currentOffer.highlight === 'green' ? 'text-emerald-600' : 'text-slate-700'}`}>
                                  {currentOffer.primary}
                                </span>
                              </>
                            ) : null}
                          </div>

                          {/* Separator */}
                          <div className="hidden h-4 w-px bg-slate-200 md:block" />

                          {/* Mini labeled step progress */}
                          <div className="hidden items-center gap-0 md:flex">
                            {stageLabels.map((label, index) => {
                              const step = index + 1
                              const currentStep = getCurrentStep(proposal.status)
                              const reached = step <= currentStep
                              const active = step === currentStep

                              let dotCls = 'bg-slate-200'
                              if (reached) dotCls = 'bg-indigo-500'

                              return (
                                <div key={label} className="flex items-center">
                                  <div className="flex items-center gap-0.5">
                                    <div className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />
                                    {active ? (
                                      <span className="whitespace-nowrap text-[9px] font-bold text-indigo-600">{label}</span>
                                    ) : null}
                                  </div>
                                  {step < stageLabels.length ? <div className={`mx-0.5 h-[1px] w-2 ${step < currentStep ? 'bg-indigo-400' : 'bg-slate-200'}`} /> : null}
                                </div>
                              )
                            })}
                          </div>

                          {/* Footer status text (mobile) */}
                          <span className={`ml-auto text-[10px] font-bold md:hidden ${rowTone.message}`}>{footerText}</span>
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
                {activeNegotiations.length}
              </span>
            </div>
            <div className="mt-4 space-y-4">
              {inboxItems.map((proposal) => {
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
                          <p className={`mt-1 text-xs font-medium ${negotiation?.senderType === 'CLIENT' ? 'text-amber-600' : 'text-slate-500'}`}>
                            {negotiation?.senderType === 'CLIENT' ? 'Counter-offer received' : 'Waiting for your reply'}
                          </p>
                        </div>
                        <p className="whitespace-nowrap text-xs text-slate-400">{formatRelativeTime(negotiation?.createdAt || proposal.updatedAt)}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            <Link
              to="/mentor/proposals"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
            >
              View all conversations
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>

          <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-950">Earnings Forecast</h3>
              <span className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500">This Month</span>
            </div>
            <p className="mt-5 text-[36px] font-black tracking-tight text-slate-950">{formatCompactMxc(stats.potentialEarnings)} MXC</p>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-slate-500">Potential Earnings</span>
              <span className="font-bold text-emerald-500">+18% vs last month</span>
            </div>
            <MiniChart />
          </aside>

          <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-950">AI Suggestions</h3>
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-700">New</span>
            </div>
            <div className="mt-4 space-y-4">
              <SuggestionRow tone="blue" title="This proposal has high acceptance probability" text="80% match" />
              <SuggestionRow tone="indigo" title="Client usually responds within 2 hours" text="High responsiveness" />
              <SuggestionRow tone="amber" title="Consider reducing delivery time" text="May improve acceptance rate" />
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



function MiniChart() {
  const points = '6,50 38,40 70,62 102,45 134,52 166,33 198,29 230,18'
  return (
    <div className="mt-5">
      <div className="flex items-end gap-2 text-[10px] text-slate-400">
        <span>0</span>
        <span>1K</span>
        <span>2K</span>
        <span>3K</span>
      </div>
      <svg viewBox="0 0 236 72" className="mt-2 h-24 w-full">
        <path d="M6 50 L38 40 L70 62 L102 45 L134 52 L166 33 L198 29 L230 18" fill="none" stroke="#5b4df6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points} fill="url(#forecastFill)" opacity="0.18" />
        <defs>
          <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b4df6" />
            <stop offset="100%" stopColor="#5b4df6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>1 May</span>
        <span>15 May</span>
        <span>31 May</span>
      </div>
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
    case 'NEGOTIATING':
      return 'Negotiating'
    case 'SUBMITTED':
      return 'Awaiting Response'
    case 'UNDER_REVIEW':
      return 'In Review'
    case 'ACCEPTED':
      return 'Accepted'
    case 'REJECTED':
      return 'Rejected'
    default:
      return status
  }
}

function getRowTone(status: string) {
  switch (status) {
    case 'NEGOTIATING':
      return {
        border: 'border-l-4 border-l-amber-400 border-slate-200',
        badge: 'bg-amber-50 text-amber-700',
        cta: 'bg-indigo-600 hover:bg-indigo-700',
        message: 'text-indigo-600',
      }
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      return {
        border: 'border-l-4 border-l-blue-400 border-slate-200',
        badge: 'bg-blue-50 text-blue-700',
        cta: 'bg-indigo-600 hover:bg-indigo-700',
        message: 'text-emerald-500',
      }
    case 'ACCEPTED':
      return {
        border: 'border-l-4 border-l-emerald-400 border-slate-200',
        badge: 'bg-emerald-50 text-emerald-700',
        cta: 'bg-violet-100 text-violet-700 hover:bg-violet-200',
        message: 'text-emerald-500',
      }
    default:
      return {
        border: 'border-l-4 border-l-slate-300 border-slate-200',
        badge: 'bg-slate-100 text-slate-600',
        cta: 'bg-slate-900 hover:bg-slate-800',
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

function getBudgetType(job: JobResponse | undefined, proposal: ProposalResponse) {
  if (proposal.proposedHourlyRate || job?.hourlyRateMxc) return 'Hourly Rate'
  return 'Fixed Price'
}

function getProposalValue(proposal: ProposalResponse) {
  if (proposal.proposedHourlyRate) return `${formatCurrency(proposal.proposedHourlyRate)} / hr`
  if (proposal.proposedAmount) return formatCurrency(proposal.proposedAmount)
  return 'Not set'
}

function getTimelineLabel(proposal: ProposalResponse) {
  if (proposal.estimatedDurationDays) return `${proposal.estimatedDurationDays} days`
  return 'Flexible timeline'
}

function getCurrentOffer(proposal: ProposalResponse, negotiation?: NegotiationInfo) {
  if (proposal.status === 'ACCEPTED') {
    return {
      primary: proposal.proposedHourlyRate ? `${formatCurrency(proposal.proposedHourlyRate)} / hr` : proposal.proposedAmount ? formatCurrency(proposal.proposedAmount) : 'Accepted',
      secondary: 'Agreement reached',
      highlight: 'green' as const,
    }
  }

  if (negotiation?.proposedAmount) {
    return {
      primary: formatCurrency(negotiation.proposedAmount),
      secondary: negotiation.senderType === 'CLIENT' ? 'Counter-offer received' : 'Waiting for client',
      highlight: negotiation.senderType === 'CLIENT' ? ('amber' as const) : ('blue' as const),
    }
  }

  if (proposal.proposedHourlyRate) {
    return {
      primary: `${formatCurrency(proposal.proposedHourlyRate)} / hr`,
      secondary: proposal.status === 'NEGOTIATING' ? 'Negotiation started' : 'Current proposal',
      highlight: proposal.status === 'NEGOTIATING' ? ('blue' as const) : undefined,
    }
  }

  if (proposal.proposedAmount) {
    return {
      primary: formatCurrency(proposal.proposedAmount),
      secondary: proposal.status === 'NEGOTIATING' ? 'Waiting for reply' : 'Current proposal',
      highlight: proposal.status === 'NEGOTIATING' ? ('blue' as const) : undefined,
    }
  }

  return {
    primary: 'TBD',
    secondary: 'No offer yet',
    highlight: undefined,
  }
}

const stageLabels = ['Sent', 'Viewed', 'Counter', 'Negotiating', 'Agreement', 'Contract'] as const



function getCurrentStep(status: string) {
  switch (status) {
    case 'SUBMITTED':
      return 2
    case 'UNDER_REVIEW':
      return 3
    case 'NEGOTIATING':
      return 4
    case 'ACCEPTED':
      return 6
    case 'REJECTED':
      return 3
    default:
      return 1
  }
}

function isWithinDays(date: string, days: number) {
  return Date.now() - new Date(date).getTime() <= days * 24 * 60 * 60 * 1000
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
