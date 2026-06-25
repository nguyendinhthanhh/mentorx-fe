import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from 'react-query'
import { walletApi } from '@/api/walletApi'
import { formatMxc } from '@/utils/formatters'
import { useI18n } from '@/i18n/I18nProvider'
import { 
  Wallet, 
  Briefcase, 
  ShoppingBag, 
  Award, 
  ChevronRight, 
  Clock, 
  ShieldAlert 
} from 'lucide-react'
import { canSwitchToMentorMode } from '@/utils/roleRedirect'

export default function ProfileDashboardPage() {
  const { t, language } = useI18n()
  const { user } = useAuthStore()

  const { data: balance, isLoading: isBalanceLoading } = useQuery(
    ['userBalance', user?.userId],
    () => walletApi.getUserBalance(user!.userId),
    { enabled: !!user?.userId, staleTime: 5 * 60 * 1000 }
  )

  if (!user) return null

  const displayName = user.displayName || user.fullName
  const mentorApproved = canSwitchToMentorMode(user)

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Chào mừng trở lại, {displayName}! 👋
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Đây là không gian quản lý cá nhân của bạn. Theo dõi tiến độ và bắt đầu dự án mới.
        </p>
      </div>

      {/* Warning/Alert if eKYC is not verified or something */}
      {user.identityStatus !== 'APPROVED' && (
        <div className="flex items-start gap-4 rounded-[1.25rem] border border-amber-200/60 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-500">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-500">
              Tài khoản chưa được xác thực
            </h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-600/80">
              Vui lòng hoàn tất xác thực eKYC (CMND/CCCD) để mở khóa toàn bộ tính năng và bảo vệ tài khoản tốt hơn.
            </p>
            <div className="mt-3">
              <Link
                to="/profile/settings"
                className="inline-flex h-9 items-center justify-center rounded-xl bg-amber-500 px-4 text-xs font-bold text-white transition-colors hover:bg-amber-600"
              >
                Xác thực ngay
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Wallet Stat */}
        <div className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200/60 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-indigo-50 transition-transform group-hover:scale-150 dark:bg-indigo-900/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Wallet className="h-6 w-6" />
            </div>
            <Link to="/wallet" className="flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-700">
              Xem ví <ChevronRight className="ml-0.5 h-3 w-3" />
            </Link>
          </div>
          <div className="relative mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Số dư khả dụng</p>
            <div className="mt-1 h-8 flex items-center">
              {isBalanceLoading ? (
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
              ) : (
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {formatMxc(balance?.available || 0, language)}
                </h3>
              )}
            </div>
          </div>
        </div>

        {/* Jobs Stat */}
        <div className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200/60 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-emerald-50 transition-transform group-hover:scale-150 dark:bg-emerald-900/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Briefcase className="h-6 w-6" />
            </div>
            <Link to="/users/requests" className="flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700">
              Quản lý <ChevronRight className="ml-0.5 h-3 w-3" />
            </Link>
          </div>
          <div className="relative mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Yêu cầu công việc</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">Truy cập</h3>
          </div>
        </div>

        {/* Courses Stat */}
        <div className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200/60 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-fuchsia-50 transition-transform group-hover:scale-150 dark:bg-fuchsia-900/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <Link to="/profile/courses" className="flex items-center text-xs font-bold text-fuchsia-600 hover:text-fuchsia-700">
              Vào học <ChevronRight className="ml-0.5 h-3 w-3" />
            </Link>
          </div>
          <div className="relative mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Khoá học của tôi</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">Truy cập</h3>
          </div>
        </div>
      </div>

      {/* Mentor Banner */}
      {!mentorApproved && (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#6C4DFF] to-[#8C6DFD] p-8 text-white shadow-xl shadow-indigo-500/20">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
          
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-indigo-100 mb-2">
                <Award className="h-5 w-5" />
                <span className="text-xs font-black uppercase tracking-widest">Cơ hội mới</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                Trở thành Mentor ngay hôm nay
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-indigo-100">
                Chia sẻ kiến thức của bạn, nhận yêu cầu tư vấn 1:1, mở khóa học riêng và gia tăng thu nhập với Token MXC.
              </p>
            </div>
            <Link
              to="/become-a-mentor"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-white px-8 text-sm font-bold text-indigo-600 transition-all hover:scale-105 hover:bg-slate-50 hover:shadow-lg"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      )}

      {/* Recent Activity Placeholder */}
      <div className="rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Hoạt động gần đây</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
            <Clock className="h-6 w-6 text-slate-400" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-900 dark:text-slate-100">Chưa có hoạt động nào</p>
          <p className="mt-1 text-xs text-slate-500">Các hoạt động thanh toán, đặt lịch sẽ hiển thị tại đây.</p>
        </div>
      </div>
    </div>
  )
}
