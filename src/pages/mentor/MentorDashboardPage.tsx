import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Banknote,
  BookOpen,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Clock3,
  FolderKanban,
  GraduationCap,
  MessageCircleMore,
  Plus,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react'
import { contractApi } from '@/api/contractApi'
import { courseApi } from '@/api/courseApi'
import { mentorApi } from '@/api/mentorApi'
import { proposalApi } from '@/api/proposalApi'
import { walletApi } from '@/api/walletApi'
import { useAuthStore } from '@/store/authStore'
import { ContractResponse, ContractStatus, CourseResponse, MentorProfileResponse, ProposalResponse, ProposalStatus } from '@/types'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'
import { LoadingRows, StateCard, StatusPill } from './shared/MentorHubUI'
import { useJobStats } from '@/hooks/useAnalytics'
import StatsGrid from '@/components/analytics/StatsGrid'
import ConversionFunnel from '@/components/analytics/ConversionFunnel'

type DashboardAgendaItem = {
  id: string
  title: string
  subtitle: string
  meta: string
  sortKey: number
  route: string
  actionLabel: string
  tone: 'indigo' | 'emerald' | 'amber' | 'slate'
  statusLabel: string
  person: string
}

type DashboardActivityRow = {
  id: string
  title: string
  counterpart: string
  statusLabel: string
  tone: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'
  value: string
  time: string
  sortKey: number
  route: string
}

export default function MentorDashboardPage() {
  const { user } = useAuthStore()
  const [contracts, setContracts] = useState<ContractResponse[]>([])
  const [proposals, setProposals] = useState<ProposalResponse[]>([])
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [profile, setProfile] = useState<MentorProfileResponse | null>(null)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadDashboard()
  }, [user?.userId])

  const loadDashboard = async () => {
    if (!user?.userId) return
    try {
      setLoading(true)
      setError('')
      const [contractPage, proposalPage, coursePage, mentorProfile, balance] = await Promise.all([
        contractApi.getMine({ page: 0, size: 100 }),
        proposalApi.getByMentor(user.userId, { page: 0, size: 100 }),
        courseApi.getByInstructor(user.userId, { page: 0, size: 100 }),
        mentorApi.getMentorProfile(user.userId).catch(() => null),
        walletApi.getUserBalance(user.userId).catch(() => ({ available: 0 })),
      ])
      setContracts(contractPage.content || [])
      setProposals(proposalPage.content || [])
      setCourses(coursePage.content || [])
      setProfile(mentorProfile)
      setAvailableBalance(Number(balance.available || 0))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load MentorHub overview.')
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => {
    const activeContracts = contracts.filter((contract) =>
      [ContractStatus.ACTIVE, ContractStatus.UNDER_REVIEW, ContractStatus.IN_DISPUTE].includes(contract.status)
    )
    const pendingProposals = proposals.filter((proposal) =>
      [ProposalStatus.SUBMITTED, ProposalStatus.NEGOTIATING, ProposalStatus.OFFER_ACCEPTED].includes(proposal.status)
    )
    const publishedCourses = courses.filter((course) => String(course.status) === 'PUBLISHED')
    const completedContracts = contracts.filter((contract) => contract.status === ContractStatus.COMPLETED).length
    const profileStrength = Math.min(
      100,
      Math.round(
        (Number(Boolean(profile?.headline)) +
          Number(Boolean(profile?.professionalBio)) +
          Number((profile?.skills || []).length > 0) +
          Number(Boolean(profile?.portfolioUrl || profile?.portfolioEvidenceUrl)) +
          Number(Boolean(profile?.hourlyRateMxc))) *
          20
      )
    )

    return {
      activeContracts,
      pendingProposals,
      publishedCourses,
      completedContracts,
      availableBalance,
      averageRating: Number(profile?.averageRating || 0),
      totalReviews: profile?.totalReviews || 0,
      totalEarnings: Number(profile?.totalEarnings || 0),
      profileStrength,
      quickCount: activeContracts.length + pendingProposals.length,
    }
  }, [availableBalance, contracts, courses, profile, proposals])

  const agendaItems = useMemo<DashboardAgendaItem[]>(() => {
    const contractItems: DashboardAgendaItem[] = summary.activeContracts.slice(0, 3).map((contract) => ({
      id: `contract-${contract.id}`,
      title: contract.title || contract.jobTitle,
      subtitle: contract.clientName || 'Client workspace',
      meta: contract.startDate ? `Starts ${formatShortDate(contract.startDate)}` : `Updated ${formatRelativeTime(contract.updatedAt)}`,
      sortKey: new Date(contract.startDate || contract.updatedAt).getTime(),
      route: '/mentor/contracts',
      actionLabel: 'Open contract',
      tone: contract.status === ContractStatus.UNDER_REVIEW ? 'amber' : 'emerald',
      statusLabel: formatContractStatus(contract.status),
      person: contract.clientName || 'Client',
    }))

    const proposalItems: DashboardAgendaItem[] = summary.pendingProposals.slice(0, 3).map((proposal) => ({
      id: `proposal-${proposal.id}`,
      title: proposal.jobTitle,
      subtitle: 'Proposal conversation',
      meta: proposal.estimatedDurationDays ? `${proposal.estimatedDurationDays} days proposed` : `Updated ${formatRelativeTime(proposal.updatedAt || proposal.createdAt)}`,
      sortKey: new Date(proposal.updatedAt || proposal.createdAt).getTime(),
      route: `/mentor/proposals/${proposal.id}`,
      actionLabel: proposal.status === ProposalStatus.NEGOTIATING ? 'Reply now' : 'Review proposal',
      tone: proposal.status === ProposalStatus.NEGOTIATING ? 'amber' : 'indigo',
      statusLabel: formatProposalStatus(proposal.status),
      person: 'Prospect',
    }))

    return [...contractItems, ...proposalItems]
      .sort((a, b) => b.sortKey - a.sortKey)
      .slice(0, 4)
  }, [summary.activeContracts, summary.pendingProposals])

  const activityRows = useMemo<DashboardActivityRow[]>(() => {
    const proposalRows: DashboardActivityRow[] = proposals.slice(0, 4).map((proposal) => ({
      id: `proposal-row-${proposal.id}`,
      title: proposal.jobTitle,
      counterpart: 'Proposal',
      statusLabel: formatProposalStatus(proposal.status),
      tone:
        proposal.status === ProposalStatus.ACCEPTED
          ? 'emerald'
          : proposal.status === ProposalStatus.REJECTED
            ? 'rose'
            : proposal.status === ProposalStatus.NEGOTIATING
              ? 'amber'
              : 'indigo',
      value: formatCurrency(proposal.proposedAmount || proposal.proposedHourlyRate || 0),
      time: formatRelativeTime(proposal.updatedAt || proposal.createdAt),
      sortKey: new Date(proposal.updatedAt || proposal.createdAt).getTime(),
      route: `/mentor/proposals/${proposal.id}`,
    }))

    const contractRows: DashboardActivityRow[] = contracts.slice(0, 4).map((contract) => ({
      id: `contract-row-${contract.id}`,
      title: contract.title || contract.jobTitle,
      counterpart: contract.clientName,
      statusLabel: formatContractStatus(contract.status),
      tone:
        contract.status === ContractStatus.COMPLETED
          ? 'emerald'
          : contract.status === ContractStatus.IN_DISPUTE
            ? 'rose'
            : contract.status === ContractStatus.UNDER_REVIEW
              ? 'amber'
              : 'slate',
      value: formatCurrency(contract.totalAmount || 0),
      time: formatRelativeTime(contract.updatedAt),
      sortKey: new Date(contract.updatedAt).getTime(),
      route: '/mentor/contracts',
    }))

    return [...proposalRows, ...contractRows]
      .sort((a, b) => b.sortKey - a.sortKey)
      .slice(0, 6)
  }, [contracts, proposals])

  const networkItems = useMemo(() => {
    const contractContacts = contracts
      .filter((contract) => Boolean(contract.clientName))
      .map((contract) => ({
        id: contract.id,
        name: contract.clientName,
        detail: contract.title || contract.jobTitle,
        route: '/mentor/contracts',
      }))

    const skillItems = (profile?.skills || []).slice(0, 3).map((skill) => ({
      id: skill,
      name: skill,
      detail: profile?.primaryDomain || 'Mentor specialty',
      route: '/mentor/profile-setup',
    }))

    return [...dedupeByName(contractContacts), ...skillItems].slice(0, 4)
  }, [contracts, profile?.primaryDomain, profile?.skills])

  const greetingName = user?.displayName || user?.fullName || 'mentor'
  const todaysHeadline = agendaItems.length > 0
    ? `Bạn có ${agendaItems.length} việc cần chú ý hôm nay. Ưu tiên phản hồi nhanh để giữ nhịp cộng tác.`
    : 'Hôm nay chưa có việc gấp. Đây là lúc tốt để tối ưu profile và chuẩn bị đề xuất tốt hơn.'
  const completedProgressTarget = 20
  const completedProgressValue = Math.min(summary.completedContracts, completedProgressTarget)
  const progressPercent = Math.round((completedProgressValue / completedProgressTarget) * 100)

  if (loading) {
    return <LoadingRows rows={7} />
  }

  if (error) {
    return (
      <StateCard
        tone="error"
        title="Unable to load dashboard"
        message={error}
        action={
          <button onClick={loadDashboard} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-black text-white">
            Retry
          </button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl dark:text-white">
              Chào mừng trở lại, {greetingName}!
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {todaysHeadline}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/courses/create"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Tạo khóa học mới
            </Link>
            <Link
              to="/mentor/profile-setup"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Edit profile
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <DashboardMetricCard
          icon={<Wallet className="h-5 w-5" />}
          iconTone="indigo"
          eyebrow="Ví sẵn sàng"
          label="Số dư khả dụng"
          value={formatCurrency(summary.availableBalance)}
          helper={summary.totalEarnings > 0 ? `${formatCurrency(summary.totalEarnings)} tổng thu nhập` : 'Tiền có thể rút ngay'}
        />
        <DashboardMetricCard
          icon={<CalendarClock className="h-5 w-5" />}
          iconTone="violet"
          eyebrow={`${summary.activeContracts.length} live`}
          label="Việc đang hoạt động"
          value={summary.activeContracts.length}
          helper={`${summary.pendingProposals.length} proposal cần theo dõi`}
        />
        <DashboardMetricCard
          icon={<Star className="h-5 w-5" />}
          iconTone="amber"
          eyebrow={summary.totalReviews > 0 ? `${summary.totalReviews} reviews` : 'No reviews yet'}
          label="Đánh giá trung bình"
          value={summary.totalReviews > 0 ? `${summary.averageRating.toFixed(1)} / 5` : 'Chưa có'}
          helper={profile?.headline || 'Hồ sơ công khai đang xây dựng uy tín'}
        />
        <DashboardMetricCard
          icon={<GraduationCap className="h-5 w-5" />}
          iconTone="sky"
          eyebrow={`${summary.profileStrength}% complete`}
          label="Khóa học & profile"
          value={summary.publishedCourses.length}
          helper={`${summary.publishedCourses.length} khóa học đang publish`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <DashboardPanel
            title="Lịch ưu tiên sắp tới"
            action={<Link to="/mentor/contracts" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Xem tất cả</Link>}
          >
            {agendaItems.length === 0 ? (
              <EmptyInlineState
                title="Chưa có lịch ưu tiên"
                message="Khi có contract đang chạy hoặc proposal cần trả lời, chúng sẽ xuất hiện ở đây."
                actionHref="/jobs"
                actionLabel="Tìm job phù hợp"
              />
            ) : (
              <div className="space-y-3">
                {agendaItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.route}
                    className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-slate-200 hover:bg-slate-50 md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-800/20 dark:hover:border-slate-700 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-4">
                      <AvatarToken name={item.person} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.person}</p>
                          <span className="text-xs text-slate-500 dark:text-slate-400">• {item.meta}</span>
                        </div>
                        <p className="mt-0.5 truncate text-base font-medium text-slate-900 dark:text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill label={item.statusLabel} tone={item.tone} />
                      <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {item.actionLabel}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel
            title="Hoạt động gần đây"
            icon={<FolderKanban className="h-5 w-5 text-indigo-600" />}
          >
            {activityRows.length === 0 ? (
              <EmptyInlineState
                title="Chưa có hoạt động"
                message="Sau khi bạn gửi proposal hoặc bắt đầu contract, bảng hoạt động sẽ hiển thị ở đây."
                actionHref="/mentor/profile-setup"
                actionLabel="Hoàn thiện hồ sơ mentor"
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="hidden grid-cols-[minmax(0,1.7fr)_0.9fr_0.9fr_0.8fr] gap-4 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 md:grid">
                  <span>Đề mục</span>
                  <span>Counterpart</span>
                  <span>Trạng thái</span>
                  <span className="text-right">Giá trị</span>
                </div>
                <div className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {activityRows.map((row) => (
                    <Link
                      key={row.id}
                      to={row.route}
                      className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 md:grid-cols-[minmax(0,1.7fr)_0.9fr_0.9fr_0.8fr] md:items-center md:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{row.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{row.time}</p>
                      </div>
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{row.counterpart}</div>
                      <div>
                        <StatusPill label={row.statusLabel} tone={row.tone} />
                      </div>
                      <div className="text-left text-sm font-bold text-slate-900 md:text-right dark:text-white">{row.value}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </DashboardPanel>
        </div>

        <aside className="space-y-6">
          <DashboardPanel title="Thao tác nhanh" icon={<Sparkles className="h-5 w-5 text-indigo-600" />}>
            <div className="space-y-3">
              <QuickActionTile
                to="/mentor/schedule"
                icon={<CalendarClock className="h-5 w-5" />}
                title="Thiết lập lịch trống"
                description="Cập nhật availability để khách hàng dễ book hơn."
              />
              <QuickActionTile
                to="/wallet"
                icon={<Banknote className="h-5 w-5" />}
                title="Rút MX Coin"
                description="Kiểm tra số dư và tạo yêu cầu payout."
              />
              <QuickActionTile
                to="/mentor/profile-setup"
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Cập nhật profile"
                description="Làm rõ headline, rate, portfolio và proof."
              />
            </div>
          </DashboardPanel>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/30">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Sẵn sàng lên hạng?</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Hoàn thành thêm contract và giữ phản hồi ổn định để mở khóa vị trí mentor nổi bật hơn.
            </p>
            <div className="mt-4 rounded-full bg-slate-200 p-0.5 dark:bg-slate-700">
              <div className="h-1.5 rounded-full bg-slate-900 transition-all dark:bg-slate-400" style={{ width: `${Math.max(progressPercent, 5)}%` }} />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
              <span>Tiến độ</span>
              <span>{completedProgressValue} / {completedProgressTarget} completed</span>
            </div>
          </section>

          <DashboardPanel title="Kết nối đáng chú ý" icon={<MessageCircleMore className="h-5 w-5 text-indigo-600" />}>
            {networkItems.length === 0 ? (
              <EmptyInlineState
                compact
                title="Chưa có liên hệ nổi bật"
                message="Khi bạn bắt đầu làm việc với client hoặc hoàn thiện skill stack, gợi ý sẽ hiện tại đây."
                actionHref="/jobs"
                actionLabel="Khám phá cơ hội"
              />
            ) : (
              <div className="space-y-4">
                {networkItems.map((item) => (
                  <Link key={item.id} to={item.route} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                    <AvatarToken name={item.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </DashboardPanel>
        </aside>
      </section>

      {/* Analytics: Job Stats */}
      <JobStatsSection />

      {/* Analytics: Conversion Funnel */}
      <ConversionFunnel />
    </div>
  )
}

function JobStatsSection() {
  const { data: jobStats } = useJobStats('MENTOR')
  if (!jobStats) return null

  const stats = [
    { label: 'Proposals sent', value: jobStats.proposalsSent },
    { label: 'Proposals accepted', value: jobStats.proposalsAccepted },
    { label: 'Acceptance rate', value: `${(jobStats.proposalAcceptanceRate * 100).toFixed(1)}%` },
    { label: 'Contracts active', value: jobStats.contractsActive },
    { label: 'Contracts completed', value: jobStats.contractsCompleted },
    { label: 'Completion rate', value: `${(jobStats.contractCompletionRate * 100).toFixed(1)}%` },
  ]

  return <StatsGrid title="Job Analytics" stats={stats} />
}

function DashboardPanel({
  title,
  icon,
  action,
  children,
}: {
  title: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          {icon ? <div className="text-slate-400">{icon}</div> : null}
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
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
  icon: ReactNode
  iconTone: 'indigo' | 'violet' | 'amber' | 'sky'
  eyebrow: string
  label: string
  value: ReactNode
  helper: string
}) {
  const toneClass = {
    indigo: 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400',
    violet: 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400',
    amber: 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400',
    sky: 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400',
  }[iconTone]

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${toneClass}`}>{icon}</div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{eyebrow}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
    </div>
  )
}

function QuickActionTile({
  to,
  icon,
  title,
  description,
}: {
  to: string
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 transition hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
    </Link>
  )
}

function EmptyInlineState({
  title,
  message,
  actionHref,
  actionLabel,
  compact = false,
}: {
  title: string
  message: string
  actionHref: string
  actionLabel: string
  compact?: boolean
}) {
  return (
    <div className={`rounded-[26px] border border-dashed border-slate-200 bg-slate-50/70 text-center ${compact ? 'px-4 py-6' : 'px-6 py-10'}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">{message}</p>
      <Link
        to={actionHref}
        className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-black text-white transition hover:bg-indigo-700"
      >
        {actionLabel}
      </Link>
    </div>
  )
}

function AvatarToken({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const dimension = size === 'sm' ? 'h-12 w-12 text-sm' : 'h-16 w-16 text-lg'
  return (
    <div className={`flex ${dimension} items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,_#dbeafe,_#c7d2fe_58%,_#e2e8f0)] font-black text-indigo-700 shadow-inner`}>
      {getInitials(name)}
    </div>
  )
}

function formatProposalStatus(status: string) {
  const labels: Record<string, string> = {
    SUBMITTED: 'Submitted',
    NEGOTIATING: 'Negotiating',
    OFFER_ACCEPTED: 'Offer agreed',
    ACCEPTED: 'Contract active',
    REJECTED: 'Rejected',
    AUTO_CLOSED: 'Closed',
    CONTRACT_CANCELLED: 'Contract cancelled',
    WITHDRAWN: 'Withdrawn',
  }
  return labels[status] || status.replace(/_/g, ' ').toLowerCase()
}

function formatContractStatus(status: ContractStatus) {
  const labels: Partial<Record<ContractStatus, string>> = {
    ACTIVE: 'Active',
    UNDER_REVIEW: 'Under review',
    IN_DISPUTE: 'In dispute',
    COMPLETED: 'Completed',
    PAUSED: 'Paused',
    CANCELLED: 'Cancelled',
  }
  return labels[status] || status
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value))
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function dedupeByName<T extends { name: string }>(items: T[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.name.trim().toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
