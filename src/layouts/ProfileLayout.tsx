import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  Briefcase,
  CalendarDays,
  Flag,
  LayoutDashboard,
  ReceiptText,
  ShoppingBag,
  Star,
  CreditCard,
  SlidersHorizontal,
  Settings,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import AppHeader from '@/components/AppHeader'
import { cn } from '@/utils/cn'

type SidebarItem = {
  to: string
  label: string
  icon: any
  matches: string[]
}

const tabs: SidebarItem[] = [
  { to: '/profile', label: 'T\u1ed5ng quan', icon: LayoutDashboard, matches: ['/profile'] },
  { to: '/users/requests', label: 'Y\u00eau c\u1ea7u \u0111\u00e3 \u0111\u0103ng', icon: Briefcase, matches: ['/users/requests', '/my-jobs'] },
  { to: '/profile/courses', label: 'Kh\u00f3a h\u1ecdc \u0111\u00e3 mua', icon: ShoppingBag, matches: ['/profile/courses'] },
  { to: '/profile/appointments', label: 'L\u1ecbch h\u1eb9n', icon: CalendarDays, matches: ['/profile/appointments'] },
  { to: '/profile/complaints', label: 'Khi\u1ebfu n\u1ea1i c\u1ee7a t\u00f4i', icon: Flag, matches: ['/profile/complaints'] },
  { to: '/profile/transactions', label: 'Giao d\u1ecbch', icon: ReceiptText, matches: ['/profile/transactions'] },
  { to: '/profile/reviews', label: '\u0110\u00e1nh gi\u00e1 c\u1ee7a t\u00f4i', icon: Star, matches: ['/profile/reviews'] },
  { to: '/profile/bank-accounts', label: 'T\u00e0i kho\u1ea3n ng\u00e2n h\u00e0ng', icon: CreditCard, matches: ['/profile/bank-accounts'] },
  { to: '/profile/preferences', label: 'S\u1edf th\u00edch & gh\u00e9p n\u1ed1i', icon: SlidersHorizontal, matches: ['/profile/preferences'] },
  { to: '/profile/settings', label: 'C\u00e0i \u0111\u1eb7t', icon: Settings, matches: ['/profile/settings'] },
]

export default function ProfileLayout() {
  const location = useLocation()
  const { user } = useAuthStore()

  if (!user) return null

  const isFullWidthPage = location.pathname === '/become-a-mentor'
  const displayName = user.displayName || user.fullName || 'User'
  const initials = displayName.charAt(0).toUpperCase()

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
            <aside className="hidden w-full flex-none space-y-6 lg:sticky lg:top-24 lg:block lg:w-[290px] lg:self-start">
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
