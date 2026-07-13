import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Menu, 
  X,
  Briefcase,
  BookOpen,
  PieChart,
  Flag,
  Inbox,
  Search,
  Globe,
  Sun,
  Moon,
  DollarSign,
  MessageSquare,
  UserCheck
} from 'lucide-react'
import { useState } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { isAdmin, isModerator } from '@/utils/roleRedirect'
import NotificationDropdown from '@/components/notification/NotificationDropdown'

const adminLinks = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/mentor-applications', label: 'Mentor Verification', icon: UserCheck },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/complaints', label: 'Complaints', icon: Inbox },
  { to: '/admin/disputes', label: 'Escrow Disputes', icon: ShieldAlert },
  { to: '/admin/support', label: 'Support Chat', icon: MessageSquare },
  { to: '/admin/wallet', label: 'Wallet Moderation', icon: DollarSign },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { isDarkMode, toggleTheme } = useThemeStore()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const isFinanceAdmin = isAdmin(user)
  const isSupportWorkspace = location.pathname === '/admin/support'
  const userRoleLabel = isAdmin(user) ? 'Admin' : isModerator(user) ? 'Moderator' : 'Operations'
  const visibleAdminLinks = adminLinks.filter((link) => {
    if (isFinanceAdmin) return true
    return !['/admin/wallet', '/admin/users', '/admin/settings'].includes(link.to)
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex bg-[#fcfcfd] dark:bg-gray-950 min-h-screen transition-colors duration-300">
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-[60] xl:hidden">
            <button
              type="button"
              aria-label="Close admin navigation"
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <aside className="relative flex h-full w-[min(84vw,320px)] flex-col bg-white shadow-2xl dark:bg-[#09090b]">
              <div className="flex h-[80px] shrink-0 items-center justify-between px-5">
                <Link to="/" className="flex items-center gap-3" onClick={() => setIsMobileSidebarOpen(false)}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md dark:bg-indigo-500/20 dark:text-indigo-400">
                    <ShieldAlert className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <p className="text-[19px] font-bold leading-none tracking-tight text-slate-900 dark:text-white">MentorX</p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">Admin Workspace</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto custom-scrollbar">
                {visibleAdminLinks.map((link) => {
                  const active = isActive(link.to)
                  return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`group flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                      active
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 dark:bg-indigo-500/20 dark:text-indigo-400 dark:shadow-none translate-x-1'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <link.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="truncate">{link.label}</span>
                  </Link>
                  )
                })}
              </nav>

              <div className="border-t border-slate-100 p-4 dark:border-slate-800/60">
                <div className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 overflow-hidden border border-slate-200 dark:border-slate-700">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <UserCheck className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">{user?.fullName || 'Admin'}</p>
                    <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileSidebarOpen(false)
                      handleLogout()
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Sidebar */}
        <aside 
          className={`${
            isSidebarCollapsed ? 'w-[80px]' : 'w-[280px]'
          } hidden bg-white dark:bg-[#09090b] border-r border-slate-100 dark:border-slate-800/60 shrink-0 xl:flex flex-col transition-all duration-300 ease-in-out sticky top-0 h-screen z-50`}
        >
          {/* Sidebar Header */}
          <div className="h-[80px] shrink-0 flex items-center px-5 border-b border-slate-100 dark:border-slate-800/60">
            <Link to="/" className="flex items-center gap-3 overflow-hidden w-full">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md dark:bg-indigo-500/20 dark:text-indigo-400 flex-shrink-0">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col justify-center min-w-0 opacity-100 transition-opacity duration-300 delay-100">
                  <span className="text-[19px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">MentorX</span>
                  <span className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">Admin Workspace</span>
                </div>
              )}
            </Link>
          </div>

          {/* Sidebar Nav */}
          <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto custom-scrollbar">
            {/* Admin Links */}
            {visibleAdminLinks.map((link) => {
              const active = isActive(link.to)
              return (
              <Link
                key={link.to}
                to={link.to}
                title={isSidebarCollapsed ? link.label : undefined}
                className={`group flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 dark:bg-indigo-500/20 dark:text-indigo-400 dark:shadow-none translate-x-1'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              >
                <link.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                {!isSidebarCollapsed && <span className="truncate">{link.label}</span>}
              </Link>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/60">
            <div className={`flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 overflow-hidden border border-slate-200 dark:border-slate-700">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserCheck className="h-5 w-5" />
                )}
              </div>
              {!isSidebarCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">{user?.fullName || 'Admin'}</p>
                    <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Collapse Toggle */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3.5 top-24 hidden h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all z-50 hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-white xl:flex"
          >
            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-gray-100 bg-white/90 px-4 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 sm:gap-6">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-white xl:hidden"
                aria-label="Open admin navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">
                {adminLinks.find(l => isActive(l.to))?.label || 'Dashboard'}
              </h2>
              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50 transition-all">
                <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input type="text" placeholder="Search..." className="bg-transparent border-none text-sm focus:ring-0 w-32 lg:w-48 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400" />
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Toggle Theme"
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                {user?.userId && <NotificationDropdown userId={user.userId} allHref="/profile/notifications" />}
              </div>

              <div className="hidden h-6 w-px bg-gray-200 dark:bg-gray-700 sm:block" />

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{userRoleLabel}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gray-900 dark:bg-gray-700 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {user?.fullName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className={isSupportWorkspace ? 'min-h-0 flex-1' : 'mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8'}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
