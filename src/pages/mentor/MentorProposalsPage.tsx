import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Banknote,
  BellRing,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
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
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Compact Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] uppercase tracking-widest font-black text-indigo-600 mb-3 border border-indigo-100 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Pipeline Overview
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Quản lý Proposals</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Bạn có tổng cộng <span className="font-bold text-slate-700">{stats.total}</span> đề xuất. {pendingNegotiationItems.length > 0 ? <span className="font-bold text-amber-600">Bạn có {pendingNegotiationItems.length} đề xuất cần xử lý ngay.</span> : "Tất cả đều đang tiến hành tốt."}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/50 py-2.5 shadow-sm backdrop-blur-md">
            <div className="flex flex-col px-5 border-r border-slate-200/60">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chờ phản hồi</span>
               <span className="text-xl font-black text-slate-900">{stats.awaitingResponse}</span>
            </div>
            <div className="flex flex-col px-5 border-r border-slate-200/60">
               <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/70">Đang đàm phán</span>
               <span className="text-xl font-black text-amber-600">{stats.negotiating}</span>
            </div>
            <div className="flex flex-col px-5">
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Đã chốt</span>
               <span className="text-xl font-black text-emerald-600">{stats.accepted}</span>
            </div>
          </div>

          <Link to="/jobs" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-500/30 shrink-0">
            <Search className="h-4 w-4" />
            Tìm Jobs
          </Link>
        </div>
      </div>

      {/* Content Area */}
      <div className="rounded-[2.5rem] border border-slate-200/60 bg-white/50 p-6 sm:p-8 shadow-xl shadow-slate-200/40 backdrop-blur-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-full lg:w-auto overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => {
              const count = tabCounts[tab.key]
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200/80 text-slate-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="relative w-full lg:max-w-[320px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm kiếm proposals..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <MiniSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              ['ALL', 'Tất cả trạng thái'],
              ['SUBMITTED', 'Đã nộp'],
              ['NEGOTIATING', 'Đang đàm phán'],
              ['OFFER_ACCEPTED', 'Đã chốt offer'],
              ['ACCEPTED', 'Contract active'],
              ['REJECTED', 'Bị từ chối'],
              ['AUTO_CLOSED', 'Đã đóng'],
              ['WITHDRAWN', 'Đã rút'],
            ]}
          />
          <MiniSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[['ALL', 'Tất cả danh mục'], ...categories.map((item) => [String(item.id), item.name] as [string, string])]}
          />
          {(statusFilter !== 'ALL' || categoryFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL')
                setCategoryFilter('ALL')
                setSearchQuery('')
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
            >
              <RefreshCw className="h-4 w-4" />
              Xóa bộ lọc
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        )}

        {filteredProposals.length === 0 ? (
          <EmptyPremiumState 
             title="Không tìm thấy proposals nào"
             message="Hãy thử thay đổi bộ lọc hoặc tìm kiếm các job mới để gửi proposal."
             actionHref="/jobs"
             actionLabel="Tìm Jobs mới"
          />
        ) : (
          <div className="space-y-4">
            {filteredProposals.map((proposal) => {
              const job = jobMap[proposal.jobId]
              const categoryName = categories.find((item) => item.id === job?.categoryId)?.name || 'General'
              const negotiation = negotiations[proposal.id]
              const statusMeta = getStatusMeta(proposal.status, negotiation)
              const rowTone = getRowTone(proposal.status, negotiation?.senderType)
              const currentOffer = getCurrentOffer(proposal, negotiation)
              const clientName = job?.clientName || job?.client?.fullName || 'Client'
              const clientAvatar = job?.client?.avatarUrl
              const lastActivityAt = negotiation?.createdAt || proposal.updatedAt || proposal.createdAt
              const lastActivityLabel = proposal.submittedAt && proposal.submittedAt !== lastActivityAt ? `Cập nhật ${formatRelativeTime(lastActivityAt)}` : `Gửi ${formatRelativeTime(proposal.submittedAt || proposal.createdAt)}`

              return (
                <article
                  key={proposal.id}
                  className="group relative flex flex-col gap-5 rounded-[1.75rem] border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-200/50"
                >
                  <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-indigo-50 to-slate-100 ring-1 ring-slate-200/60 shadow-inner group-hover:ring-indigo-100 transition-all">
                        {clientAvatar ? (
                          <img src={clientAvatar} alt={clientName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-lg font-black text-indigo-400">{clientName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <Link to={`/mentor/proposals/${proposal.id}`} className="hover:text-indigo-600 transition-colors">
                           <h2 className="truncate text-lg font-extrabold tracking-tight text-slate-900">
                             {proposal.jobTitle}
                           </h2>
                        </Link>
                        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                          <span className="text-slate-700">{clientName}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span>{categoryName}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span>{lastActivityLabel}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end shrink-0 md:pl-6 md:border-l md:border-slate-100">
                      <p className="text-2xl font-black text-slate-900">{currentOffer.primary}</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Offer của bạn</p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-4 border-t border-slate-100/80 pt-5 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-widest shadow-sm ${rowTone.badge}`}>
                        {getStatusLabel(proposal.status)}
                      </span>
                      <p className={`flex items-center gap-1.5 text-xs font-bold ${rowTone.message}`}>
                        {statusMeta.icon}
                        {statusMeta.helper}
                      </p>
                    </div>

                    <div className="flex w-full items-center gap-3 sm:w-auto">
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
                          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600 sm:flex-none"
                        >
                          <MessageCircleMore className="w-4 h-4" />
                          Nhắn tin
                        </button>
                      )}
                      <Link
                        to={`/mentor/proposals/${proposal.id}`}
                        className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-500/30 sm:flex-none"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <ContextualChatDrawer
        open={!!chatDrawer}
        onOpenChange={(open) => {
          if (!open) setChatDrawer(null)
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
      className="h-10 cursor-pointer appearance-none rounded-xl border border-slate-200/80 bg-white/80 px-4 pr-10 text-sm font-bold text-slate-700 shadow-sm outline-none transition-all hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 backdrop-blur-md"
      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  )
}

function DashboardMetricCard({
  icon,
  iconTone,
  eyebrow,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode
  iconTone: 'indigo' | 'emerald' | 'amber' | 'sky'
  eyebrow: string
  label: string
  value: React.ReactNode
  helper: string
}) {
  const toneClass = {
    indigo: 'bg-indigo-50/80 text-indigo-600 border-indigo-100/50 shadow-indigo-100/50',
    emerald: 'bg-emerald-50/80 text-emerald-600 border-emerald-100/50 shadow-emerald-100/50',
    amber: 'bg-amber-50/80 text-amber-600 border-amber-100/50 shadow-amber-100/50',
    sky: 'bg-sky-50/80 text-sky-600 border-sky-100/50 shadow-sky-100/50',
  }[iconTone]

  return (
    <div className="group flex flex-col justify-between rounded-[1.75rem] border border-white/60 bg-white/70 p-5 sm:p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/50">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <div className={`flex h-12 w-12 items-center justify-center rounded-[1.25rem] border shadow-sm ${toneClass} transition-transform group-hover:scale-110`}>{icon}</div>
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <div className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</div>
          <span className="text-[11px] font-bold text-indigo-600">{eyebrow}</span>
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-400">{helper}</p>
    </div>
  )
}

function EmptyPremiumState({
  title,
  message,
  actionHref,
  actionLabel,
}: {
  title: string
  message: string
  actionHref: string
  actionLabel: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-slate-100/50 bg-gradient-to-b from-slate-50/50 to-white/30 px-6 py-10 text-center backdrop-blur-md">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-indigo-50 text-indigo-500 shadow-inner">
        <Sparkles className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm font-semibold leading-relaxed text-slate-500">{message}</p>
      <Link to={actionHref} className="mt-6 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30">
        {actionLabel}
      </Link>
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
        icon: <Clock3 className="h-3.5 w-3.5" />,
        helper: 'Đang đợi khách hàng xem xét.',
      }
    case 'NEGOTIATING':
      return {
        icon: <MessageCircleMore className="h-3.5 w-3.5" />,
        helper: negotiation?.senderType === 'CLIENT' ? 'Khách hàng vừa counter offer. Cần bạn xử lý.' : 'Đã gửi offer, chờ khách phản hồi.',
      }
    case 'OFFER_ACCEPTED':
      return {
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        helper: 'Đã chốt thỏa thuận. Khách đang lock tiền.',
      }
    case 'ACCEPTED':
      return {
        icon: <Zap className="h-3.5 w-3.5" />,
        helper: 'Contract đã kích hoạt. Bạn có thể bắt đầu làm việc.',
      }
    case 'REJECTED':
      return {
        icon: <Circle className="h-3.5 w-3.5" />,
        helper: 'Khách hàng đã từ chối proposal này.',
      }
    case 'WITHDRAWN':
      return {
        icon: <Circle className="h-3.5 w-3.5" />,
        helper: 'Bạn đã rút proposal này.',
      }
    default:
      return {
        icon: <Circle className="h-3.5 w-3.5" />,
        helper: 'Proposal đã đóng.',
      }
  }
}

function getRowTone(status: string, latestSender?: 'CLIENT' | 'MENTOR') {
  switch (status) {
    case 'NEGOTIATING':
      if (latestSender === 'CLIENT') {
        return {
          badge: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200/80',
          message: 'text-amber-600',
        }
      }
      return {
        badge: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/80',
        message: 'text-indigo-600',
      }
    case 'OFFER_ACCEPTED':
      return {
        badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
        message: 'text-emerald-600',
      }
    case 'ACCEPTED':
      return {
        badge: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/80',
        message: 'text-emerald-700',
      }
    case 'REJECTED':
    case 'AUTO_CLOSED':
    case 'CONTRACT_CANCELLED':
    case 'WITHDRAWN':
      return {
        badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
        message: 'text-slate-500',
      }
    default:
      return {
        badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/80',
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

function normalizeProposalValue(proposal: ProposalResponse) {
  return proposal.proposedAmount || proposal.proposedHourlyRate || 0
}

function ProposalCardSkeleton() {
  return (
    <div className="rounded-[1.75rem] border border-slate-100/80 bg-white/70 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <SkeletonCircle size="h-14 w-14 rounded-[1.25rem]" />
        <div className="flex-1 space-y-3 pt-1">
          <Skeleton className="h-6 w-1/3 rounded-lg" />
          <Skeleton className="h-4 w-1/4 rounded-md" />
        </div>
      </div>
      <div className="mt-6 border-t border-slate-100 pt-5">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}
