import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { isAdmin, isMentor } from '@/utils/roleRedirect'
import {
  ArrowLeft,
  Award,
  Bell,
  Briefcase,
  Heart,
  MessageSquare,
  Moon,
  Search,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Sun,
  User,
  Wallet,
} from 'lucide-react'
import NotificationDropdown from '@/components/notification/NotificationDropdown'

const baseTabs = [
  { to: '/profile', label: 'Hồ sơ', icon: User },
  { to: '/profile/saved', label: 'Mentor đã lưu', icon: Heart },
  { to: '/chat', label: 'Tin nhắn', icon: MessageSquare },
  { to: '/profile/notifications', label: 'Thông báo', icon: Bell },
  { to: '/profile/jobs', label: 'Việc của tôi', icon: Briefcase },
  { to: '/profile/courses', label: 'Khóa học', icon: ShoppingBag },
  { to: '/wallet', label: 'Ví', icon: Wallet },
  { to: '/profile/settings', label: 'Cài đặt', icon: Settings },
]

export default function ProfileLayout() {
  const location = useLocation()
  const { user } = useAuthStore()
  const { isDarkMode, toggleTheme } = useThemeStore()

  if (!user) return null

  const displayName = user.displayName || user.fullName || 'User'
  const initials = displayName.charAt(0).toUpperCase()
  const mentorApproved = isMentor(user)
  const tabs = [
    ...baseTabs.slice(0, 2),
    {
      to: mentorApproved ? '/mentor/dashboard' : '/mentor/profile',
      label: mentorApproved ? 'Mentor mode' : 'Trở thành mentor',
      icon: mentorApproved ? Sparkles : Award,
    },
    ...baseTabs.slice(2),
  ]

  const isActive = (path: string) => {
    if (path === '/profile') return location.pathname === '/profile'
    if (path === '/mentor/dashboard') return location.pathname.startsWith('/mentor')
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Trang chủ
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/mentors"
              className="hidden h-10 items-center gap-2 rounded-xl bg-indigo-50 px-3 text-sm font-black text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 sm:inline-flex"
            >
              <Search className="h-4 w-4" />
              Tìm mentor
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <Link
              to="/chat"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              title="Tin nhắn"
            >
              <MessageSquare className="h-5 w-5" />
            </Link>

            <NotificationDropdown userId={user.userId} />

            {isAdmin(user) && (
              <Link
                to="/admin/dashboard"
                className="hidden items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-rose-700 sm:inline-flex"
              >
                <ShieldAlert className="h-4 w-4" />
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-600">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-black text-white">{initials}</span>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-black tracking-tight text-slate-950 dark:text-white">{displayName}</h1>
                <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>
            </div>

            <nav className="-mx-1 overflow-x-auto">
              <div className="flex min-w-max gap-1 px-1">
                {tabs.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-black transition ${
                      isActive(item.to)
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </section>

        <div className="mt-5">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
