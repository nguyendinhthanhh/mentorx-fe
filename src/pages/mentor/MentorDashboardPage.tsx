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
      <section className="relative overflow-hidden rounded-[34px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,247,255,0.96),rgba(255,255,255,0.98))] px-6 py-7 shadow-[0_22px_60px_-42px_rgba(37,99,235,0.35)] md:px-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-100/80 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-indigo-500">Mentor overview</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
              Chào mừng trở lại, {greetingName}!
            </h1>
            <p className="mt-3 max-w-2xl text-base font-medium leading-8 text-slate-600 md:text-[18px]">
              {todaysHeadline}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/courses/create"
              className="inline-flex h-14 items-center gap-3 rounded-2xl bg-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Tạo khóa học mới
            </Link>
            <Link
              to="/mentor/profile-setup"
              className="inline-flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-5 text-sm font-black text-slate-700 transition hover:bg-white"
            >
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Edit mentor profile
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
            icon={<CalendarClock className="h-5 w-5 text-indigo-600" />}
            action={<Link to="/mentor/contracts" className="text-sm font-black text-indigo-600">Xem tất cả</Link>}
          >
            {agendaItems.length === 0 ? (
              <EmptyInlineState
                title="Chưa có lịch ưu tiên"
                message="Khi có contract đang chạy hoặc proposal cần trả lời, chúng sẽ xuất hiện ở đây."
                actionHref="/jobs"
                actionLabel="Tìm job phù hợp"
              />
            ) : (
              <div className="space-y-4">
                {agendaItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.route}
                    className="grid gap-4 rounded-[26px] bg-[linear-gradient(180deg,#f3f5ff,#eef1ff)] px-5 py-5 transition hover:translate-y-[-1px] hover:shadow-lg hover:shadow-indigo-100 md:grid-cols-[auto_minmax(0,1fr)_auto]"
                  >
                    <AvatarToken name={item.person} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xl font-black text-slate-950">{item.person}</p>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-500">
                          <Clock3 className="h-3.5 w-3.5" />
                          {item.meta}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <p className="text-[18px] font-black text-indigo-700">{item.title}</p>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{item.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <StatusPill label={item.statusLabel} tone={item.tone} />
                      <span className="inline-flex h-11 items-center rounded-full border border-indigo-200 bg-white px-5 text-sm font-black text-indigo-700">
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
              <div className="overflow-hidden rounded-[26px] border border-slate-200">
                <div className="hidden grid-cols-[minmax(0,1.7fr)_0.9fr_0.9fr_0.8fr] gap-4 bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400 md:grid">
                  <span>Đề mục</span>
                  <span>Counterpart</span>
                  <span>Trạng thái</span>
                  <span className="text-right">Giá trị</span>
                </div>
                <div className="divide-y divide-slate-100 bg-white">
                  {activityRows.map((row) => (
                    <Link
                      key={row.id}
                      to={row.route}
                      className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 md:grid-cols-[minmax(0,1.7fr)_0.9fr_0.9fr_0.8fr] md:items-center md:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-lg font-black text-slate-950">{row.title}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">{row.time}</p>
                      </div>
                      <div className="text-sm font-semibold text-slate-600">{row.counterpart}</div>
                      <div>
                        <StatusPill label={row.statusLabel} tone={row.tone} />
                      </div>
                      <div className="text-left text-xl font-black text-slate-950 md:text-right">{row.value}</div>
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

          <section className="overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#1d4ed8,#6d28d9)] p-6 text-white shadow-[0_28px_80px_-34px_rgba(79,70,229,0.7)]">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/65">Mentor growth</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Sẵn sàng lên hạng?</h2>
            <p className="mt-3 text-sm leading-7 text-white/80">
              Hoàn thành thêm contract và giữ phản hồi ổn định để mở khóa vị trí mentor nổi bật hơn.
            </p>
            <div className="mt-6 rounded-full bg-white/20 p-1">
              <div className="h-3 rounded-full bg-white/90 transition-all" style={{ width: `${Math.max(progressPercent, 8)}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm font-bold text-white/85">
              <span>Tiến độ</span>
              <span>{completedProgressValue} / {completedProgressTarget} completed contracts</span>
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
                  <Link key={item.id} to={item.route} className="flex items-center gap-3 rounded-2xl px-1 py-1 transition hover:bg-slate-50">
                    <AvatarToken name={item.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black text-slate-950">{item.name}</p>
                      <p className="truncate text-sm font-medium text-slate-500">{item.detail}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-indigo-500" />
                  </Link>
                ))}
              </div>
            )}
          </DashboardPanel>
        </aside>
      </section>
    </div>
  )
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
    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.28)] md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon ? <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50">{icon}</div> : null}
          <h2 className="text-[28px] font-black tracking-[-0.03em] text-slate-950">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
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
    indigo: 'bg-indigo-100 text-indigo-700',
    violet: 'bg-violet-100 text-violet-700',
    amber: 'bg-amber-100 text-amber-700',
    sky: 'bg-sky-100 text-sky-700',
  }[iconTone]

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.28)]">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-13 w-13 items-center justify-center rounded-2xl ${toneClass}`}>{icon}</div>
        <p className="text-sm font-black text-indigo-600">{eyebrow}</p>
      </div>
      <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <div className="mt-3 text-[40px] font-black tracking-[-0.05em] text-slate-950">{value}</div>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{helper}</p>
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
      className="flex items-center gap-4 rounded-[24px] bg-[linear-gradient(180deg,#f5f6ff,#f0f2fb)] px-4 py-4 transition hover:translate-y-[-1px] hover:shadow-md"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-black tracking-[-0.03em] text-slate-950">{title}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{description}</p>
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
