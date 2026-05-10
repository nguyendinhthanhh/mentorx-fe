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

  const isFullWidthPage = location.pathname === '/become-a-mentor'

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
          to: '/become-a-mentor',
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
          {!isFullWidthPage && (
            <aside className="w-full lg:w-72 flex-none space-y-6">
              <div className="overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/80 p-4 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/80 dark:shadow-none">
                {/* Profile Header */}
                <div className="mb-6 flex items-center gap-4 px-2 py-3">
                  <div className="relative shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200 dark:shadow-none">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl font-black text-white">{initials}</span>
                      )}
                    </div>
                    {mentorApproved && (
                      <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-white p-0.5 shadow-md dark:bg-slate-800">
                        <div className="flex h-full w-full items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                          <Sparkles className="h-3 w-3" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="truncate text-base font-black tracking-tight text-slate-950 dark:text-white">
                      {displayName}
                    </h1>
                    <p className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {user.email.split('@')[0]}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Menu
                  </div>
                  {tabs.map((item) => {
                    const active = isActive(item.to)
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
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors duration-300 ${
                          active 
                            ? 'bg-white/20 text-white' 
                            : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800/50'
                        }`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {active && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        )}
                      </Link>
                    )
                  })}
                </div>

                <div className="mt-8 px-4 py-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                    Mentor X v1.0
                  </p>
                </div>
              </div>
            </aside>
          )}

          {/* Main Content Area */}
          <div className={`min-w-0 flex-1 ${isFullWidthPage ? 'max-w-4xl mx-auto' : ''}`}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
