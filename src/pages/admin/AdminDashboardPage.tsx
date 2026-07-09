import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  DollarSign,
  Briefcase,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  Activity,
  ChevronRight,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  FileText,
  GraduationCap,
  MessageSquare,
  BarChart3,
  Flag,
  Shield,
} from 'lucide-react'
import { useQuery } from 'react-query'
import { walletApi } from '@/api/walletApi'
import { adminMentorVerificationApi } from '@/api/adminMentorVerificationApi'
import { useAuthStore } from '@/store/authStore'
import { isAdmin } from '@/utils/roleRedirect'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const revenueData = [
  { name: 'T1', revenue: 12400, profit: 7200 },
  { name: 'T2', revenue: 15800, profit: 9100 },
  { name: 'T3', revenue: 11200, profit: 6300 },
  { name: 'T4', revenue: 19600, profit: 11400 },
  { name: 'T5', revenue: 16200, profit: 9800 },
  { name: 'T6', revenue: 22800, profit: 13600 },
  { name: 'T7', revenue: 28100, profit: 17200 },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function DashboardPanel({
  title,
  icon,
  action,
  children,
  noPadding = false,
}: {
  title: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  noPadding?: boolean
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-slate-400">{icon}</div>}
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
        </div>
        {action}
      </div>
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </section>
  )
}

function MetricCard({
  icon,
  label,
  value,
  badge,
  badgeTone = 'neutral',
  helper,
  alert,
  href,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  badge?: string
  badgeTone?: 'up' | 'down' | 'neutral' | 'warning'
  helper?: string
  alert?: boolean
  href?: string
}) {
  const badgeClass = {
    up: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    down: 'bg-rose-50 text-rose-700 border border-rose-100',
    neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
  }[badgeTone]

  const inner = (
    <>
      {alert && (
        <span className="absolute right-4 top-4 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
        </span>
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</div>
        {badge && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${badgeClass}`}>
            {badgeTone === 'up' && <ArrowUpRight className="h-3 w-3" />}
            {badge}
          </span>
        )}
      </div>
      {helper && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
    </>
  )

  const cls = `relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-slate-900 ${alert ? 'border-amber-200 dark:border-amber-900/40' : 'border-slate-200 dark:border-slate-800'} ${href ? 'hover:border-indigo-200 hover:shadow-md cursor-pointer' : ''}`

  if (href) {
    return <Link to={href} className={cls}>{inner}</Link>
  }
  return <div className={cls}>{inner}</div>
}

function QuickActionTile({
  to,
  icon,
  title,
  description,
  count,
}: {
  to: string
  icon: ReactNode
  title: string
  description: string
  count?: number
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 transition hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{title}</p>
          {count !== undefined && count > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">{count}</span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </Link>
  )
}

function PriorityRow({
  href,
  icon,
  iconTone,
  title,
  detail,
  time,
  badge,
  badgeTone,
}: {
  href: string
  icon: ReactNode
  iconTone: string
  title: string
  detail: string
  time?: string
  badge?: string
  badgeTone?: 'amber' | 'rose' | 'indigo' | 'emerald'
}) {
  const toneIcon: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  }
  const toneBadge: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  }

  return (
    <Link
      to={href}
      className="group flex items-center gap-4 rounded-xl border border-transparent p-3 transition hover:border-slate-100 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-800/40"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneIcon[iconTone]}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {badge && badgeTone && (
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${toneBadge[badgeTone]}`}>
            {badge}
          </span>
        )}
        {time && <span className="text-[11px] text-slate-400">{time}</span>}
        <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
      </div>
    </Link>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user } = useAuthStore()
  const financeAdmin = isAdmin(user)

  const { data: walletSummary } = useQuery(
    ['admin-financial-summary'],
    () => walletApi.getFinancialSummary(),
    { enabled: financeAdmin }
  )
  const { data: expertiseQueue } = useQuery(
    ['admin-dashboard-expertise-queue'],
    () => adminMentorVerificationApi.getExpertiseQueue({ page: 0, size: 5 }),
    { retry: false }
  )

  const pendingWithdrawalsCount = walletSummary?.pendingWithdrawals || 0
  const pendingExpertiseCount = expertiseQueue?.totalElements || 0
  // Complaints API trả 403 với moderator → không query, dùng link trực tiếp
  const pendingComplaintsCount = 0

  // ── Moderator dashboard ───────────────────────────────────────────────────
  if (!financeAdmin) {
    const greetingName = user?.displayName || user?.fullName || 'Moderator'
    const hasUrgent = pendingExpertiseCount > 0 || pendingComplaintsCount > 0

    const priorityItems = [
      ...(expertiseQueue?.content || []).slice(0, 3).map((m) => ({
        id: m.userId,
        href: '/admin/mentor-applications',
        icon: <ShieldCheck className="h-4 w-4" />,
        iconTone: 'indigo',
        title: m.user?.fullName || m.user?.displayName || 'Mentor',
        detail: m.headline || 'Xin xét duyệt hồ sơ chuyên môn',
        badge: 'Chờ duyệt',
        badgeTone: 'amber' as const,
        time: '',
      })),
    ].slice(0, 5)

    return (
      <div className="space-y-6">
        {/* Welcome banner */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-400">
                  <Shield className="h-3 w-3" />
                  Platform Moderator
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${hasUrgent ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${hasUrgent ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  {hasUrgent ? 'Có việc cần xử lý' : 'Hệ thống ổn định'}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                Xin chào, {greetingName}!
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {hasUrgent
                  ? `Bạn đang có ${[pendingExpertiseCount > 0 && `${pendingExpertiseCount} hồ sơ mentor`, pendingComplaintsCount > 0 && `${pendingComplaintsCount} khiếu nại`].filter(Boolean).join(' và ')} cần xử lý. Hãy ưu tiên duyệt ngay để đảm bảo chất lượng nền tảng.`
                  : 'Không có tác vụ khẩn cấp. Hãy kiểm tra định kỳ chất lượng nội dung và hồ sơ mentor mới.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                to="/admin/mentor-applications"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <ShieldCheck className="h-4 w-4" />
                Duyệt mentor {pendingExpertiseCount > 0 && `(${pendingExpertiseCount})`}
              </Link>
              <Link
                to="/admin/complaints"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <Flag className="h-4 w-4 text-rose-500" />
                Khiếu nại {pendingComplaintsCount > 0 && `(${pendingComplaintsCount})`}
              </Link>
            </div>
          </div>
        </section>

        {/* Stats row */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Hồ sơ mentor chờ duyệt"
            value={pendingExpertiseCount}
            badge={pendingExpertiseCount > 0 ? 'Cần xử lý' : 'Rỗng'}
            badgeTone={pendingExpertiseCount > 0 ? 'warning' : 'neutral'}
            helper="Chờ xác minh chuyên môn"
            alert={pendingExpertiseCount > 0}
            href="/admin/mentor-applications"
          />
          <MetricCard
            icon={<Flag className="h-5 w-5" />}
            label="Khiếu nại đang mở"
            value={pendingComplaintsCount}
            badge={pendingComplaintsCount > 0 ? 'Chưa xử lý' : 'Rỗng'}
            badgeTone={pendingComplaintsCount > 0 ? 'warning' : 'neutral'}
            helper="Cần phân xử từ moderator"
            alert={pendingComplaintsCount > 0}
            href="/admin/complaints"
          />
          <MetricCard
            icon={<BookOpen className="h-5 w-5" />}
            label="Khóa học chờ duyệt"
            value="—"
            badge="Kiểm tra"
            badgeTone="neutral"
            helper="Nội dung chờ xem xét"
            href="/admin/courses"
          />
          <MetricCard
            icon={<Activity className="h-5 w-5" />}
            label="Trạng thái hệ thống"
            value="Ổn định"
            badge="Live"
            badgeTone="up"
            helper="Tất cả dịch vụ đang chạy"
          />
        </section>

        {/* Main content */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            {/* Priority Queue */}
            <DashboardPanel
              title="Hàng chờ ưu tiên"
              icon={<AlertCircle className="h-5 w-5 text-amber-500" />}
              action={
                <span className="text-xs font-medium text-slate-500">
                  {priorityItems.length} mục
                </span>
              }
            >
              {priorityItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 py-10 text-center dark:border-slate-800 dark:bg-slate-800/20">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-white">Hàng chờ trống</p>
                  <p className="mt-1 text-xs text-slate-500">Không có hồ sơ hay khiếu nại nào cần xử lý.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {priorityItems.map((item) => (
                    <PriorityRow key={item.id} {...item} />
                  ))}
                  <div className="mt-3 flex gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <Link
                      to="/admin/mentor-applications"
                      className="flex-1 rounded-lg border border-slate-200 py-2.5 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Xem tất cả hồ sơ mentor
                    </Link>
                    <Link
                      to="/admin/complaints"
                      className="flex-1 rounded-lg border border-slate-200 py-2.5 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Xem tất cả khiếu nại
                    </Link>
                  </div>
                </div>
              )}
            </DashboardPanel>

            {/* Moderation workflows */}
            <DashboardPanel
              title="Luồng kiểm duyệt"
              icon={<Activity className="h-5 w-5 text-indigo-600" />}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { href: '/admin/mentor-applications', icon: <ShieldCheck className="h-5 w-5" />, title: 'Xét duyệt Mentor', detail: 'Duyệt chuyên môn và kiểm tra hồ sơ.', badge: pendingExpertiseCount, badgeTone: 'amber' as const },
                  { href: '/admin/jobs', icon: <Briefcase className="h-5 w-5" />, title: 'Kiểm duyệt Job', detail: 'Kiểm tra job công khai và xử lý vi phạm.', badgeTone: 'indigo' as const },
                  { href: '/admin/courses', icon: <GraduationCap className="h-5 w-5" />, title: 'Kiểm duyệt Khóa học', detail: 'Xem xét khóa học mentor tạo về chất lượng.', badgeTone: 'indigo' as const },
                  { href: '/admin/complaints', icon: <Flag className="h-5 w-5" />, title: 'Xử lý Khiếu nại', detail: 'Phân xử các khiếu nại từ người dùng.', badge: pendingComplaintsCount, badgeTone: 'rose' as const },
                  { href: '/admin/reports', icon: <FileText className="h-5 w-5" />, title: 'Báo cáo vi phạm', detail: 'Xem xét nội dung bị báo cáo.', badgeTone: 'rose' as const },
                  { href: '/admin/support', icon: <MessageSquare className="h-5 w-5" />, title: 'Hỗ trợ người dùng', detail: 'Giải quyết vấn đề và phân loại yêu cầu.', badgeTone: 'indigo' as const },
                ].map((item) => {
                  const toneMap: Record<string, string> = { amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700', indigo: 'bg-indigo-50 text-indigo-700' }
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-slate-800 dark:bg-slate-800/20 dark:hover:border-indigo-900/40"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                        {item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                            {item.title}
                          </p>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${toneMap[item.badgeTone]}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>
                      </div>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                    </Link>
                  )
                })}
              </div>
            </DashboardPanel>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Quick Actions */}
            <DashboardPanel title="Thao tác nhanh" icon={<Sparkles className="h-5 w-5 text-indigo-600" />}>
              <div className="space-y-3">
                <QuickActionTile
                  to="/admin/mentor-applications"
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Duyệt mentor mới"
                  description="Xem xét hồ sơ chuyên môn đang chờ xét duyệt."
                  count={pendingExpertiseCount}
                />
                <QuickActionTile
                  to="/admin/complaints"
                  icon={<Flag className="h-5 w-5" />}
                  title="Xử lý khiếu nại"
                  description="Kiểm tra và phân xử các khiếu nại đang mở."
                  count={pendingComplaintsCount}
                />
                <QuickActionTile
                  to="/admin/courses"
                  icon={<BookOpen className="h-5 w-5" />}
                  title="Kiểm duyệt nội dung"
                  description="Xem xét khóa học và tài liệu mới tạo."
                />
                <QuickActionTile
                  to="/admin/jobs"
                  icon={<Briefcase className="h-5 w-5" />}
                  title="Kiểm tra job"
                  description="Kiểm tra các job mới được đăng lên."
                />
              </div>
            </DashboardPanel>

            {/* Policy reminder */}
            <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-900/30 dark:bg-amber-900/10">
              <div className="mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">Lưu ý chính sách</h3>
              </div>
              <ul className="space-y-2 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                  Mentor được mở khóa thông qua phê duyệt hồ sơ chuyên nghiệp, không phải payout.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                  Đảm bảo tất cả kiểm tra hồ sơ đạt tiêu chuẩn tin cậy trước khi duyệt.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                  Khiếu nại ưu tiên cao cần xử lý trong vòng 24h làm việc.
                </li>
              </ul>
            </section>

            {/* Checklist */}
            <DashboardPanel title="Checklist hôm nay">
              <div className="space-y-3">
                {[
                  { label: 'Duyệt hồ sơ mentor mới', done: pendingExpertiseCount === 0 },
                  { label: 'Xử lý khiếu nại đang mở', done: pendingComplaintsCount === 0 },
                  { label: 'Kiểm tra nội dung báo cáo', done: false },
                  { label: 'Review job mới đăng', done: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${item.done ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'} dark:border-slate-700`}>
                      {item.done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                    </div>
                    <span className={`text-sm ${item.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </DashboardPanel>
          </aside>
        </section>
      </div>
    )
  }

  // ── Full Admin view ───────────────────────────────────────────────────────
  const stats = [
    { label: 'Tổng người dùng', value: '2,840', badge: '+12.5%', badgeTone: 'up' as const, icon: <Users className="h-5 w-5" />, helper: 'Đang hoạt động trên nền tảng' },
    { label: 'Yêu cầu rút tiền', value: pendingWithdrawalsCount, badge: pendingWithdrawalsCount > 0 ? 'Cần xử lý' : 'Đã cập nhật', badgeTone: pendingWithdrawalsCount > 0 ? 'warning' as const : 'neutral' as const, icon: <Wallet className="h-5 w-5" />, helper: 'Đang chờ xét duyệt payout', alert: pendingWithdrawalsCount > 0 },
    { label: 'Doanh thu nền tảng', value: '45.200 MXC', badge: '+24.0%', badgeTone: 'up' as const, icon: <TrendingUp className="h-5 w-5" />, helper: 'So với tháng trước' },
    { label: 'Job đang hoạt động', value: '452', badge: '+8.2%', badgeTone: 'up' as const, icon: <Briefcase className="h-5 w-5" />, helper: 'Đang tìm mentor phù hợp' },
    { label: 'Hồ sơ mentor chờ', value: pendingExpertiseCount, badge: pendingExpertiseCount > 0 ? 'Cần duyệt' : 'Rỗng', badgeTone: pendingExpertiseCount > 0 ? 'warning' as const : 'neutral' as const, icon: <ShieldCheck className="h-5 w-5" />, helper: 'Chờ xác minh chuyên môn', alert: pendingExpertiseCount > 0 },
    { label: 'Khóa học đang bán', value: '198', badge: '+5.1%', badgeTone: 'up' as const, icon: <BookOpen className="h-5 w-5" />, helper: 'Khóa học đang published' },
  ]

  const recentActivity = [
    { user: 'Sarah Chen', action: 'yêu cầu rút 450 MXC', time: '2 phút trước', icon: <DollarSign className="h-4 w-4" />, tone: 'amber', href: '/admin/wallet' },
    { user: 'Alex Morgan', action: 'đăng job mới "React Developer"', time: '15 phút trước', icon: <Briefcase className="h-4 w-4" />, tone: 'indigo', href: '/admin/jobs' },
    { user: 'Elena Rodriguez', action: 'được duyệt là Mentor', time: '1 giờ trước', icon: <CheckCircle2 className="h-4 w-4" />, tone: 'emerald', href: '/admin/mentor-applications' },
    { user: 'Minh Tran', action: 'gửi khiếu nại #1042', time: '2 giờ trước', icon: <AlertCircle className="h-4 w-4" />, tone: 'rose', href: '/admin/complaints' },
    { user: 'Ji-woo Kim', action: 'tạo khóa học "UI/UX Fundamentals"', time: '3 giờ trước', icon: <BookOpen className="h-4 w-4" />, tone: 'violet', href: '/admin/courses' },
  ]

  const toneIconClass: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-600', indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600', rose: 'bg-rose-100 text-rose-600',
    violet: 'bg-violet-100 text-violet-600',
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
              Xin chào, {user?.displayName || user?.fullName || 'Admin'}!
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {pendingWithdrawalsCount > 0 || pendingExpertiseCount > 0
                ? `Có ${[pendingWithdrawalsCount > 0 && `${pendingWithdrawalsCount} yêu cầu rút tiền`, pendingExpertiseCount > 0 && `${pendingExpertiseCount} hồ sơ mentor chờ duyệt`].filter(Boolean).join(' và ')} cần xử lý hôm nay.`
                : 'Không có tác vụ khẩn cấp. Đây là thời điểm tốt để kiểm tra analytics và tối ưu nền tảng.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/mentor-applications" className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
              <ShieldCheck className="h-4 w-4" />Duyệt mentor
            </Link>
            <Link to="/admin/wallet" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Wallet className="h-4 w-4 text-indigo-500" />Xử lý payout
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat, i) => <MetricCard key={i} {...stat} />)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <DashboardPanel title="Doanh thu nền tảng" icon={<BarChart3 className="h-5 w-5 text-indigo-600" />}
            action={
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600"><div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />Doanh thu</span>
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Lợi nhuận</span>
              </div>
            }
          >
            <div className="h-[260px] w-full min-w-0 min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} /><stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="adminProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)', padding: '10px 14px' }} itemStyle={{ fontSize: '12px', fontWeight: 600 }} labelStyle={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#adminRev)" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#adminProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Hoạt động gần đây" icon={<Activity className="h-5 w-5 text-indigo-600" />}
            action={<span className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Trực tiếp</span>}
          >
            <div className="space-y-2">
              {recentActivity.map((event, i) => (
                <Link key={i} to={event.href} className="group flex items-center gap-4 rounded-xl border border-transparent p-3 transition hover:border-slate-100 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-800/40">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneIconClass[event.tone]}`}>{event.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-900 dark:text-white"><span className="font-semibold">{event.user}</span> <span className="text-slate-500">{event.action}</span></p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400"><Clock className="h-3 w-3" />{event.time}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
                </Link>
              ))}
            </div>
          </DashboardPanel>
        </div>

        <aside className="space-y-6">
          <DashboardPanel title="Thao tác nhanh" icon={<Sparkles className="h-5 w-5 text-indigo-600" />}>
            <div className="space-y-3">
              <QuickActionTile to="/admin/mentor-applications" icon={<ShieldCheck className="h-5 w-5" />} title="Duyệt mentor" description="Xem xét hồ sơ chuyên môn đang chờ." count={pendingExpertiseCount} />
              <QuickActionTile to="/admin/wallet" icon={<Wallet className="h-5 w-5" />} title="Xử lý payout" description="Duyệt yêu cầu rút tiền từ mentor." count={pendingWithdrawalsCount} />
              <QuickActionTile to="/admin/complaints" icon={<AlertCircle className="h-5 w-5" />} title="Xử lý khiếu nại" description="Xem và phân xử các khiếu nại đang mở." count={pendingComplaintsCount} />
              <QuickActionTile to="/admin/users" icon={<Users className="h-5 w-5" />} title="Quản lý tài khoản" description="Tìm kiếm, khóa, hoặc cấu hình người dùng." />
            </div>
          </DashboardPanel>

          <DashboardPanel title="Điều hướng nhanh" action={<Link to="/admin/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-800">Tất cả</Link>}>
            <div className="space-y-2">
              {[
                { label: 'Người dùng', href: '/admin/users', icon: <Users className="h-4 w-4" /> },
                { label: 'Job & Proposal', href: '/admin/jobs', icon: <Briefcase className="h-4 w-4" /> },
                { label: 'Khóa học', href: '/admin/courses', icon: <BookOpen className="h-4 w-4" /> },
                { label: 'Ví & Giao dịch', href: '/admin/wallet', icon: <DollarSign className="h-4 w-4" /> },
                { label: 'Báo cáo vi phạm', href: '/admin/reports', icon: <FileText className="h-4 w-4" /> },
              ].map((item) => (
                <Link key={item.href} to={item.href} className="group flex items-center gap-3 rounded-lg p-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800">
                  <span className="text-slate-400 group-hover:text-indigo-500">{item.icon}</span>
                  {item.label}
                  <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-400" />
                </Link>
              ))}
            </div>
          </DashboardPanel>
        </aside>
      </section>
    </div>
  )
}
