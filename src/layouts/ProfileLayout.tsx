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
  const isAdministrator = isAdmin(user)
  
  const tabs = mentorApproved
    ? [
        {
          to: `/mentors/${user.userId}`,
          label: 'Hồ sơ mentor',
          icon: Sparkles,
        },
        ...baseTabs.slice(1),
      ]
    : isAdministrator
    ? [
        ...baseTabs.slice(0, 2),
        ...baseTabs.slice(2),
      ]
    : [
        ...baseTabs.slice(0, 2),
        {
          to: '/mentor/profile',
          label: 'Trở thành mentor',
          icon: Award,
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

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-none space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-white">{initials}</span>
                    )}
                  </div>
                  {mentorApproved && (
                    <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white p-1 shadow-md dark:bg-slate-900">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
                <h1 className="w-full truncate text-base font-black tracking-tight text-slate-950 dark:text-white">
                  {displayName}
                </h1>
                <p className="w-full truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
              </div>

              <div className="mt-8 space-y-1">
                {tabs.map((item) => {
                  const active = isActive(item.to)
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                        active
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <item.icon className={`h-4 w-4 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
