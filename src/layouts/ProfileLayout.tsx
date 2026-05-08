import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { isAdmin } from '@/utils/roleRedirect'
import {
  ArrowLeft,
  Award,
  Bell,
  Briefcase,
  CreditCard,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  MessageSquare,
  Moon,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Star,
  Sun,
  User,
  Wallet,
} from 'lucide-react'
import NotificationDropdown from '@/components/notification/NotificationDropdown'

const navigationSections = [
  {
    title: 'Overview',
    items: [
      { to: '/profile/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & stats' },
    ],
  },
  {
    title: 'Account',
    items: [
      { to: '/profile', label: 'Profile', icon: User, description: 'Personal information' },
      { to: '/profile/settings', label: 'Settings', icon: Settings, description: 'Account preferences' },
    ],
  },
  {
    title: 'Activity',
    items: [
      { to: '/chat', label: 'Messages', icon: MessageSquare, description: 'Chat & conversations' },
      { to: '/profile/notifications', label: 'Notifications', icon: Bell, description: 'Alerts & updates' },
      { to: '/profile/jobs', label: 'My Jobs', icon: Briefcase, description: 'Posted jobs & applicants' },
      { to: '/profile/proposals', label: 'Proposals', icon: FileText, description: 'Proposal activity' },
    ],
  },
  {
    title: 'Learning',
    items: [
      { to: '/profile/courses', label: 'My Courses', icon: ShoppingBag, description: 'Enrolled courses' },
      { to: '/profile/saved', label: 'Saved Items', icon: Heart, description: 'Bookmarked content' },
      { to: '/profile/reviews', label: 'Reviews', icon: Star, description: 'Given & received' },
    ],
  },
  {
    title: 'Financial',
    items: [
      { to: '/wallet', label: 'Wallet', icon: Wallet, description: 'Balance & transactions' },
      { to: '/profile/payments', label: 'Payment Methods', icon: CreditCard, description: 'Cards & banks' },
    ],
  },
]

export default function ProfileLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isDarkMode, toggleTheme } = useThemeStore()

  if (!user) return null

  const isActive = (path: string) => {
    if (path === '/profile') return location.pathname === '/profile'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Mini Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Back to Home */}
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-bold">Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />
              <h1 className="text-lg font-black text-gray-900 dark:text-white">
                My Account
              </h1>
            </div>

            {/* Right: Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <Link
                to="/chat"
                className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Messages"
              >
                <MessageSquare className="h-5 w-5" />
              </Link>

              <Link
                to="/wallet"
                className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Wallet"
              >
                <Wallet className="h-5 w-5" />
              </Link>

              <NotificationDropdown userId={user.userId} />

              {isAdmin(user) && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-200 dark:shadow-none hover:scale-105 transition-all"
                  title="Go to Admin Panel"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-6">
            {/* User Card */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {(user.displayName || user.fullName || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {user.displayName || user.fullName}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                  {user.roles && user.roles.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {user.roles.map((role) => (
                        <span
                          key={role.roleName}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                        >
                          {role.roleName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-6">
              {navigationSections.map((section) => (
                <div key={section.title}>
                  <h3 className="px-3 mb-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive(item.to)
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                        }`}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold">{item.label}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Quick Stats (Optional) */}
            <div className="bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5" />
                <h3 className="font-bold">Your Progress</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/80">Profile Complete</span>
                  <span className="font-bold">85%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
