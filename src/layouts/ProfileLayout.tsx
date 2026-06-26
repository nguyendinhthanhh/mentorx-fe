import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  Award,
  Briefcase,
  CalendarDays,
  Flag,
  LayoutDashboard,
  ReceiptText,
  ShoppingBag,
  Star,
  Wallet,
  CreditCard,
  SlidersHorizontal,
  Settings,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { canSwitchToMentorMode } from '@/utils/roleRedirect'
import AppHeader from '@/components/AppHeader'
import { cn } from '@/utils/cn'

type SidebarItem = {
  to: string
  label: string
  icon: any
  matches: string[]
}

const baseTabs: SidebarItem[] = [
  { to: '/profile', label: 'Tổng quan', icon: LayoutDashboard, matches: ['/profile'] },
  { to: '/users/requests', label: 'Yêu cầu đã đăng', icon: Briefcase, matches: ['/users/requests', '/my-jobs'] },
  { to: '/profile/courses', label: 'Khóa học đã mua', icon: ShoppingBag, matches: ['/profile/courses'] },
  { to: '/profile/appointments', label: 'Lịch hẹn', icon: CalendarDays, matches: ['/profile/appointments'] },
  { to: '/profile/complaints', label: 'Khiếu nại của tôi', icon: Flag, matches: ['/profile/complaints'] },
  { to: '/profile/transactions', label: 'Giao dịch', icon: ReceiptText, matches: ['/profile/transactions'] },
  { to: '/profile/reviews', label: 'Đánh giá của tôi', icon: Star, matches: ['/profile/reviews'] },
  { to: '/profile/bank-accounts', label: 'Tài khoản ngân hàng', icon: CreditCard, matches: ['/profile/bank-accounts'] },
  { to: '/profile/preferences', label: 'Sở thích & ghép nối', icon: SlidersHorizontal, matches: ['/profile/preferences'] },
  { to: '/profile/settings', label: 'Cài đặt', icon: Settings, matches: ['/profile/settings'] },
]

export default function ProfileLayout() {
  const location = useLocation()
  const { user } = useAuthStore()

  if (!user) return null

  const isFullWidthPage = location.pathname === '/become-a-mentor'
  const displayName = user.displayName || user.fullName || 'User'
  const initials = displayName.charAt(0).toUpperCase()
  const mentorApproved = canSwitchToMentorMode(user)

  const tabs: SidebarItem[] = [
    ...baseTabs,
    ...(mentorApproved
      ? []
      : [{ to: '/become-a-mentor', label: 'Trở thành mentor', icon: Award, matches: ['/become-a-mentor'] }]),
  ]

  const isActive = (paths: string[]) => {
    return paths.some((path) => {
      if (path === '/profile') return location.pathname === '/profile'
      return location.pathname.startsWith(path)
    })
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950 dark:bg-slate-950 dark:text-white">
      <AppHeader />

      <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
        {!isFullWidthPage && (
          <div className="mb-6 lg:hidden">
            <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200 dark:shadow-none">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-black text-white">{initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-base font-black tracking-tight text-slate-950 dark:text-white">{displayName}</h1>
                  <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    User workspace
                  </p>
                </div>
              </div>

              <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
                {tabs.map((item) => {
                  const active = isActive(item.matches)
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition-all',
                        active
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8 lg:flex-row">
          {!isFullWidthPage && (
            <aside className="hidden w-full flex-none space-y-6 lg:block lg:w-[290px]">
              <div className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/90 p-4 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/80 dark:shadow-none">
                <div className="mb-6 rounded-[1.6rem] bg-[radial-gradient(circle_at_top_left,rgba(108,77,255,0.18),transparent_46%),linear-gradient(135deg,#ffffff,#f8f7ff)] px-3 py-4 dark:bg-slate-900">
                  <div className="flex items-center gap-4 px-2 py-1">
                  <div className="relative shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200 dark:shadow-none">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl font-black text-white">{initials}</span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="truncate text-base font-black tracking-tight text-slate-950 dark:text-white">
                      {displayName}
                    </h1>
                    <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      User workspace
                    </p>
                  </div>
                </div>
                </div>

                <div className="space-y-1.5">
                  <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Workspace
                  </div>
                  {tabs.map((item) => {
                    const active = isActive(item.matches)
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`group relative flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                          active
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white'
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors duration-300 ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800/50'
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {active && <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                      </Link>
                    )
                  })}
                </div>

                {!mentorApproved && (
                  <div className="mt-8 rounded-[1.6rem] border border-indigo-100 bg-indigo-50/70 px-4 py-5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-500">Mentor track</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                      Mở rộng tài khoản để nhận job, mentor 1:1 và kiếm thêm MXC.
                    </p>
                    <Link
                      to="/become-a-mentor"
                      className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl bg-[#6C4DFF] px-4 text-sm font-bold text-white transition hover:bg-[#5b3ef0]"
                    >
                      Trở thành mentor
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          )}

          <div className={`min-w-0 flex-1 ${isFullWidthPage ? 'mx-auto max-w-[1600px]' : ''}`}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
