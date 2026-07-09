import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  BellRing,
  BookOpen,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FolderKanban,
  GraduationCap,
  MessageCircleMore,
  Plus,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react'
import { chatApi } from '@/api/chatApi'
import { contractApi } from '@/api/contractApi'
import { courseApi } from '@/api/courseApi'
import { notificationApi } from '@/api/notificationApi'
import { mentorApi } from '@/api/mentorApi'
import { proposalApi } from '@/api/proposalApi'
import { walletApi } from '@/api/walletApi'
import { useAuthStore } from '@/store/authStore'
import {
  ChatRoomResponse,
  ContractResponse,
  ContractStatus,
  CourseResponse,
  MentorProfileResponse,
  ProposalResponse,
  ProposalStatus,
} from '@/types'
import { useCourseStats, useEarningsSummary, useJobStats } from '@/hooks/useAnalytics'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'
import EarningsChart from '@/components/analytics/EarningsChart'
import StatsGrid from '@/components/analytics/StatsGrid'
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

type SupportSignal = {
  id: string
  title: string
  value: string
  helper: string
  route: string
  tone: 'emerald' | 'amber' | 'indigo' | 'rose'
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

  const { data: earningsSummary } = useEarningsSummary('MONTH')
  const { data: courseStats } = useCourseStats()
  const { data: jobStats } = useJobStats('MENTOR')

  const roomsQuery = useQuery(
    ['mentor-dashboard-rooms', user?.userId],
    () => chatApi.getUserRooms(user!.userId, { page: 0, size: 50 }),
    {
      enabled: !!user?.userId,
      staleTime: 30_000,
      refetchInterval: 15_000,
    }
  )

  const qaSummaryQuery = useQuery(
    ['mentor-dashboard-qa-summaries', user?.userId],
    () => courseApi.getMentorQaSummaries(),
    {
      enabled: !!user?.userId,
      staleTime: 30_000,
      refetchInterval: 30_000,
    }
  )

  const unreadNotificationsQuery = useQuery(
    ['mentor-dashboard-unread-notifications', user?.userId],
    () => notificationApi.getUnreadCount(user!.userId),
    {
      enabled: !!user?.userId,
      staleTime: 30_000,
      refetchInterval: 30_000,
    }
  )

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
      setError(err.response?.data?.message || 'Không thể tải dashboard mentor.')
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
          Number(Boolean(profile?.hourlyRateMxc))) * 20
      )
    )
    const activeClientCount = new Set(activeContracts.map((contract) => contract.clientId)).size
    const underReviewCount = activeContracts.filter((contract) => contract.status === ContractStatus.UNDER_REVIEW).length
    const disputeCount = activeContracts.filter((contract) => contract.status === ContractStatus.IN_DISPUTE).length

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
      activeClientCount,
      underReviewCount,
      disputeCount,
    }
  }, [availableBalance, contracts, courses, profile, proposals])

  const agendaItems = useMemo<DashboardAgendaItem[]>(() => {
    const contractItems: DashboardAgendaItem[] = summary.activeContracts.slice(0, 3).map((contract) => ({
      id: `contract-${contract.id}`,
      title: contract.title || contract.jobTitle,
      subtitle: contract.clientName || 'Client workspace',
      meta: contract.startDate ? `Bắt đầu ${formatShortDate(contract.startDate)}` : `Cập nhật ${formatRelativeTime(contract.updatedAt)}`,
      sortKey: new Date(contract.startDate || contract.updatedAt).getTime(),
      route: '/mentor/contracts',
      actionLabel: 'Mở contract',
      tone: contract.status === ContractStatus.UNDER_REVIEW ? 'amber' : 'emerald',
      statusLabel: formatContractStatus(contract.status),
      person: contract.clientName || 'Client',
    }))

    const proposalItems: DashboardAgendaItem[] = summary.pendingProposals.slice(0, 3).map((proposal) => ({
      id: `proposal-${proposal.id}`,
      title: proposal.jobTitle,
      subtitle: 'Trao đổi proposal',
      meta: proposal.estimatedDurationDays
        ? `${proposal.estimatedDurationDays} ngày dự kiến`
        : `Cập nhật ${formatRelativeTime(proposal.updatedAt || proposal.createdAt)}`,
      sortKey: new Date(proposal.updatedAt || proposal.createdAt).getTime(),
      route: `/mentor/proposals/${proposal.id}`,
      actionLabel: proposal.status === ProposalStatus.NEGOTIATING ? 'Trả lời ngay' : 'Xem proposal',
      tone: proposal.status === ProposalStatus.NEGOTIATING ? 'amber' : 'indigo',
      statusLabel: formatProposalStatus(proposal.status),
      person: 'Khách tiềm năng',
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

  const roomList = roomsQuery.data?.content || []
  const qaSummaries = qaSummaryQuery.data || []
  const unreadNotifications = unreadNotificationsQuery.data || 0

  const unreadMessagesCount = roomList.reduce((sum, room) => sum + (room.unreadCount || 0), 0)
  const unansweredCourseQaCount = qaSummaries.reduce((sum, item) => sum + (item.unansweredLearners || 0), 0)
  const supportBacklogCount =
    unreadMessagesCount +
    unreadNotifications +
    unansweredCourseQaCount +
    summary.underReviewCount +
    summary.disputeCount

  const courseLeaderboard = useMemo(() => {
    return [...(courseStats?.courses || [])]
      .sort((a, b) => {
        const revenueGap = Number(b.totalRevenueMxc || 0) - Number(a.totalRevenueMxc || 0)
        if (revenueGap !== 0) return revenueGap
        return Number(b.totalEnrollments || 0) - Number(a.totalEnrollments || 0)
      })
      .slice(0, 4)
  }, [courseStats?.courses])

  const conversationHighlights = useMemo(() => {
    return [...roomList]
      .filter((room) => !room.isArchived)
      .sort((a, b) => {
        const unreadGap = Number(b.unreadCount || 0) - Number(a.unreadCount || 0)
        if (unreadGap !== 0) return unreadGap
        return new Date(b.lastMessageAt || b.updatedAt).getTime() - new Date(a.lastMessageAt || a.updatedAt).getTime()
      })
      .slice(0, 4)
  }, [roomList])

  const supportSignals = useMemo<SupportSignal[]>(() => {
    const qaCourse = [...qaSummaries]
      .sort((a, b) => (b.unansweredLearners || 0) - (a.unansweredLearners || 0))
      .find((item) => (item.unansweredLearners || 0) > 0)
    const qaCourseTitle = courses.find((course) => course.courseId === qaCourse?.courseId)?.title

    return [
      {
        id: 'messages',
        title: 'Inbox cần phản hồi',
        value: unreadMessagesCount.toString(),
        helper:
          unreadMessagesCount > 0
            ? `${conversationHighlights.length} hội thoại nổi bật đang chờ bạn`
            : 'Không có tin nhắn chưa đọc',
        route: '/mentor/messages',
        tone: unreadMessagesCount > 0 ? 'indigo' : 'emerald',
      },
      {
        id: 'qa',
        title: 'Câu hỏi từ học viên',
        value: unansweredCourseQaCount.toString(),
        helper:
          qaCourseTitle
            ? `${qaCourseTitle} đang có backlog cao nhất`
            : 'Q&A khóa học đang ổn định',
        route: '/mentor/courses',
        tone: unansweredCourseQaCount > 0 ? 'amber' : 'emerald',
      },
      {
        id: 'notifications',
        title: 'Thông báo chưa đọc',
        value: unreadNotifications.toString(),
        helper:
          unreadNotifications > 0
            ? 'Nên dọn notification để không bỏ lỡ cập nhật'
            : 'Thông báo đã được xử lý tốt',
        route: '/profile/notifications',
        tone: unreadNotifications > 0 ? 'indigo' : 'emerald',
      },
      {
        id: 'contracts',
        title: 'Việc cần escalations',
        value: `${summary.disputeCount + summary.underReviewCount}`,
        helper: `${summary.disputeCount} dispute, ${summary.underReviewCount} under review`,
        route: '/mentor/contracts',
        tone: summary.disputeCount > 0 ? 'rose' : summary.underReviewCount > 0 ? 'amber' : 'emerald',
      },
    ]
  }, [
    conversationHighlights.length,
    courses,
    qaSummaries,
    summary.disputeCount,
    summary.underReviewCount,
    unreadMessagesCount,
    unreadNotifications,
    unansweredCourseQaCount,
  ])

  const greetingName = user?.displayName || user?.fullName || 'mentor'
  const heroHeadline =
    supportBacklogCount > 0
      ? `Bạn đang có ${supportBacklogCount} đầu việc cần xử lý, ưu tiên inbox, Q&A khóa học và các contract có rủi ro trước.`
      : 'Dashboard này đang khá sạch. Đây là thời điểm tốt để tối ưu profile, khóa học và tạo thêm pipeline mới.'

  if (loading) {
    return <LoadingRows rows={8} />
  }

  if (error) {
    return (
      <StateCard
        tone="error"
        title="Không thể tải dashboard mentor"
        message={error}
        action={
          <button onClick={loadDashboard} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-black text-white">
            Thử lại
          </button>
        }
      />
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      
      {/* Today's Focus & Welcome (Hero Section) */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 px-6 py-10 sm:px-12 sm:py-16 shadow-2xl shadow-indigo-900/20">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-10"></div>
        {/* Glow effects */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-widest font-black text-indigo-100 backdrop-blur-md mb-4 border border-white/10 shadow-sm">
                 <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                 Sẵn sàng cho ngày mới
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                 Chào mừng trở lại, {greetingName.split(' ')[0]}!
              </h1>
              <p className="mt-4 text-sm sm:text-base text-indigo-100/90 leading-relaxed font-semibold">
                 {agendaItems.length > 0 
                   ? `Bạn có ${agendaItems.length} công việc ưu tiên cần xử lý. Hoàn thành sớm để duy trì tỷ lệ phản hồi 100%.`
                   : `Tất cả mọi thứ đã được giải quyết. Đây là thời điểm tuyệt vời để cập nhật khóa học hoặc tối ưu hồ sơ của bạn.`}
              </p>
           </div>
           
           <div className="flex shrink-0 gap-3">
              <Link to="/courses/create" className="group flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 border border-white/10 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/20">
                 <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
                 Tạo khóa học
              </Link>
              <Link to="/mentor/messages" className="group flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-indigo-900 transition-all hover:bg-indigo-50 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-white/20">
                 <MessageCircleMore className="w-4 h-4 transition-transform group-hover:scale-110" />
                 Mở Inbox
              </Link>
           </div>
        </div>
      </section>

      {/* Primary KPI Metrics */}
      <section className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
         <DashboardMetricCard
           icon={<Wallet className="h-6 w-6" />}
           iconTone="emerald"
           eyebrow="Số dư khả dụng"
           label="Sẵn sàng để rút"
           value={formatCurrency(summary.availableBalance)}
           helper="Dòng tiền có thể rút hoặc tái đầu tư"
         />
         <DashboardMetricCard
           icon={<Banknote className="h-6 w-6" />}
           iconTone="indigo"
           eyebrow="Tháng hiện tại"
           label="Doanh thu phát sinh"
           value={formatCurrency(earningsSummary?.totalEarnedMxc || 0)}
           helper={earningsSummary?.timeline?.length ? 'Đang trên đà tăng trưởng tốt' : 'Sẽ cập nhật khi có giao dịch'}
         />
         <DashboardMetricCard
           icon={<Briefcase className="h-6 w-6" />}
           iconTone="amber"
           eyebrow={`${summary.activeContracts.length} Hợp đồng`}
           label="Khách đang Active"
           value={summary.activeClientCount}
           helper={`${summary.pendingProposals.length} proposal đang đàm phán`}
         />
         <DashboardMetricCard
           icon={<GraduationCap className="h-6 w-6" />}
           iconTone="sky"
           eyebrow={`${courseStats?.totalCourses || summary.publishedCourses.length} Khóa học`}
           label="Tổng học viên"
           value={courseStats?.totalEnrollments || 0}
           helper={`Tỷ lệ hoàn thành: ${Math.round(courseStats?.averageCompletionRate || 0)}%`}
         />
      </section>

      {/* 2-Column Grid Layout */}
      <div className="grid gap-6 xl:gap-8 xl:grid-cols-[1.8fr_1fr]">
         {/* LEFT COLUMN: Operations & Analytics */}
         <div className="space-y-6 xl:space-y-8 min-w-0">
            {/* Today's Focus */}
            {agendaItems.length > 0 && (
               <DashboardPanel title="Tâm điểm hôm nay" icon={<CalendarClock className="h-5 w-5" />}>
                  <div className="space-y-3">
                     {agendaItems.map((item) => (
                       <Link
                         key={item.id}
                         to={item.route}
                         className="group flex flex-col gap-4 rounded-[1.5rem] border border-slate-100 bg-white p-5 transition-all hover:border-indigo-200/60 hover:shadow-xl hover:shadow-indigo-100/40 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
                       >
                         <div className="flex items-center gap-4 min-w-0">
                           <AvatarToken name={item.person} size="md" />
                           <div className="min-w-0">
                             <div className="flex items-center gap-2 mb-1">
                               <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{item.person}</p>
                               <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-400">• {item.meta}</span>
                             </div>
                             <p className="truncate text-base font-extrabold text-slate-950">{item.title}</p>
                             <p className="mt-1 text-xs font-semibold text-slate-500 truncate">{item.subtitle}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-3 shrink-0">
                           <StatusPill label={item.statusLabel} tone={item.tone} />
                           <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-700 hidden sm:inline-block">
                             {item.actionLabel}
                           </span>
                         </div>
                       </Link>
                     ))}
                  </div>
               </DashboardPanel>
            )}

            {/* Revenue Analytics */}
            <DashboardPanel title="Phân tích Doanh thu" icon={<Wallet className="h-5 w-5" />} action={<Link to="/mentor/earnings" className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest hover:underline underline-offset-4">Chi tiết</Link>}>
               {earningsSummary ? (
                 <div className="space-y-6">
                   <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                     <RevenueChip label="Đã thu" value={formatCurrency(earningsSummary.totalEarnedMxc)} />
                     <RevenueChip label="Escrow" value={formatCurrency(earningsSummary.escrowBalanceMxc)} />
                     <RevenueChip label="Khả dụng" value={formatCurrency(earningsSummary.availableBalanceMxc)} />
                     <RevenueChip label="Đã rút" value={formatCurrency(earningsSummary.withdrawnMxc)} />
                   </div>
                   <div className="h-[280px] rounded-[1.5rem] border border-slate-100/50 bg-slate-50/50 p-4">
                     <EarningsChart data={earningsSummary.timeline} />
                   </div>
                 </div>
               ) : (
                 <EmptyPremiumState 
                   title="Bảng doanh thu đang trống" 
                   message="Khi bạn bắt đầu có hợp đồng và khóa học, biểu đồ doanh thu sẽ hiển thị xu hướng tài chính của bạn."
                   actionHref="/mentor/earnings"
                   actionLabel="Quản lý Doanh thu"
                 />
               )}
            </DashboardPanel>

            {/* Recent Activity */}
            <DashboardPanel title="Hoạt động gần đây" icon={<FolderKanban className="h-5 w-5" />}>
               {activityRows.length === 0 ? (
                 <EmptyPremiumState 
                   title="Chưa có dữ liệu" 
                   message="Gửi proposal đầu tiên hoặc bắt đầu một hợp đồng để theo dõi hoạt động."
                   actionHref="/jobs"
                   actionLabel="Khám phá cơ hội"
                 />
               ) : (
                 <div className="divide-y divide-slate-100/50">
                   {activityRows.map((row) => (
                     <Link
                       key={row.id}
                       to={row.route}
                       className="group grid gap-3 py-4 px-2 transition-all hover:bg-indigo-50/30 rounded-2xl md:grid-cols-[minmax(0,1.7fr)_1fr_1fr_0.8fr] md:items-center md:gap-4 sm:px-4"
                     >
                       <div className="min-w-0">
                         <p className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{row.title}</p>
                         <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{row.time}</p>
                       </div>
                       <div className="text-sm font-bold text-slate-600 truncate">{row.counterpart}</div>
                       <div><StatusPill label={row.statusLabel} tone={row.tone} /></div>
                       <div className="text-left text-sm font-extrabold text-slate-900 md:text-right">{row.value}</div>
                     </Link>
                   ))}
                 </div>
               )}
            </DashboardPanel>
         </div>

         {/* RIGHT COLUMN: Profile, Support, Quick Actions */}
         <div className="space-y-6 xl:space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
               <QuickActionCard to="/mentor/profile-setup" icon={<CheckCircle2 className="h-5 w-5" />} title="Profile" />
               <QuickActionCard to="/mentor/schedule" icon={<CalendarClock className="h-5 w-5" />} title="Lịch trình" />
               <QuickActionCard to="/courses/create" icon={<BookOpen className="h-5 w-5" />} title="Tạo Course" />
               <QuickActionCard to="/wallet" icon={<Banknote className="h-5 w-5" />} title="Ví MXC" />
            </div>

            {/* Profile Health */}
            <DashboardPanel title="Sức khỏe Profile" icon={<Star className="h-5 w-5 text-amber-500" />}>
               <div className="space-y-5">
                  <div>
                     <div className="flex justify-between items-end mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mức độ hoàn thiện</span>
                        <span className="text-xl font-extrabold text-indigo-600">{summary.profileStrength}%</span>
                     </div>
                     <div className="h-3 w-full bg-slate-100/80 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000" style={{ width: `${summary.profileStrength}%` }} />
                     </div>
                     {summary.profileStrength < 100 && (
                        <p className="text-xs text-slate-500 mt-3 font-semibold leading-relaxed">Bạn nên cập nhật thêm Headline và Bio để thu hút thêm traffic.</p>
                     )}
                  </div>
                  <div className="pt-4 border-t border-slate-100/50 space-y-3">
                     <OverviewLine icon={<Star className="h-4 w-4" />} label="Đánh giá trung bình" value={summary.totalReviews > 0 ? `${summary.averageRating.toFixed(1)} / 5` : 'Chưa có'} helper={summary.totalReviews > 0 ? `${summary.totalReviews} review` : 'Cần thêm social proof'} />
                     <OverviewLine icon={<Clock3 className="h-4 w-4" />} label="Phản hồi dự kiến" value={profile?.responseTimeHours ? `${profile.responseTimeHours} giờ` : 'Chưa cấu hình'} helper="Khách thường nhìn thông số này" />
                  </div>
               </div>
            </DashboardPanel>

            {/* Support Queue */}
            <DashboardPanel title="Hỗ trợ & CSKH" icon={<BellRing className="h-5 w-5 text-rose-500" />}>
               <div className="space-y-3">
                  <ReadinessLine label="Tin nhắn chưa đọc" passed={unreadMessagesCount === 0} value={unreadMessagesCount} />
                  <ReadinessLine label="Hỏi đáp khóa học" passed={unansweredCourseQaCount === 0} value={unansweredCourseQaCount} />
                  <ReadinessLine label="Rủi ro hợp đồng" passed={summary.disputeCount === 0 && summary.underReviewCount === 0} value={summary.disputeCount + summary.underReviewCount} />
               </div>
               {supportSignals.length > 0 && (
                  <div className="mt-5 space-y-3 border-t border-slate-100/50 pt-5">
                     {supportSignals.map((signal) => (
                        <SignalRow key={signal.id} {...signal} />
                     ))}
                  </div>
               )}
            </DashboardPanel>
         </div>
      </div>
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
    <section className="flex flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 shadow-xl shadow-slate-200/40 backdrop-blur-2xl transition-all">
      <div className="flex items-center justify-between border-b border-slate-100/60 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          {icon ? <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-indigo-50 text-indigo-600 shadow-sm">{icon}</div> : null}
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">{title}</h2>
        </div>
        {action}
      </div>
      <div className="flex-1 p-5 sm:p-6">{children}</div>
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
  iconTone: 'indigo' | 'emerald' | 'amber' | 'sky'
  eyebrow: string
  label: string
  value: ReactNode
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

function RevenueChip({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-100/60 bg-slate-50/60 px-4 py-3.5 transition-colors hover:bg-slate-50">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-slate-900">{value}</p>
    </div>
  )
}

function SignalRow({ title, value, helper, route, tone }: SupportSignal) {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    rose: 'bg-rose-50 text-rose-700',
  }[tone]

  return (
    <Link
      to={route}
      className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100/50 bg-slate-50/50 p-4 transition hover:border-slate-200 hover:bg-slate-50"
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
      </div>
      <span className={`shrink-0 rounded-[1rem] px-3 py-1.5 text-xs font-bold shadow-sm ${toneClass}`}>{value}</span>
    </Link>
  )
}

function OverviewLine({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  helper: string
}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-100/50 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
            {icon}
          </span>
          <span className="text-sm font-bold text-slate-700">{label}</span>
        </div>
        <span className="text-sm font-extrabold text-slate-900">{value}</span>
      </div>
      <p className="mt-2 text-[11px] font-semibold text-slate-400 pl-12">{helper}</p>
    </div>
  )
}

function ReadinessLine({ label, passed, value }: { label: string; passed: boolean; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100/60 bg-white px-4 py-3.5 transition-all hover:border-slate-200 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`h-2.5 w-2.5 rounded-full shadow-sm ${passed ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
        <span className="text-sm font-bold text-slate-700">{label}</span>
      </div>
      {passed ? (
        <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">Ổn</span>
      ) : (
        <span className="rounded-xl bg-rose-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-600">{value} Cần xử lý</span>
      )}
    </div>
  )
}

function QuickActionCard({
  to,
  icon,
  title,
}: {
  to: string
  icon: ReactNode
  title: string
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center justify-center rounded-[1.5rem] border border-slate-100 bg-white p-5 text-center transition-all hover:-translate-y-1 hover:border-indigo-100 hover:bg-indigo-50/30 hover:shadow-xl hover:shadow-indigo-100/50"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[1rem] bg-slate-50 text-slate-400 shadow-sm transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600">
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{title}</p>
    </Link>
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

function AvatarToken({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const dimension = size === 'sm' ? 'h-10 w-10 text-sm' : 'h-14 w-14 text-lg'
  return (
    <div className={`flex ${dimension} items-center justify-center rounded-[1.25rem] bg-[radial-gradient(circle_at_top,_#dbeafe,_#c7d2fe_58%,_#e2e8f0)] font-extrabold text-indigo-700 shadow-inner`}>
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
    CONTRACT_CANCELLED: 'Cancelled',
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
  return new Intl.DateTimeFormat('vi-VN', { month: 'short', day: 'numeric' }).format(new Date(value))
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
