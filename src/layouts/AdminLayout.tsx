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
  Zap,
  Bell,
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

const adminLinks = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/mentor-applications', label: 'Mentor Verification', icon: UserCheck },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/api', label: 'API Functions', icon: Zap },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
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
  const userRoleLabel = isAdmin(user) ? 'Admin' : isModerator(user) ? 'Moderator' : 'Operations'
  const visibleAdminLinks = adminLinks.filter((link) => {
    if (isFinanceAdmin) return true
    return !['/admin/wallet', '/admin/users', '/admin/api', '/admin/settings'].includes(link.to)
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
              className="absolute inset-0 bg-slate-950/45"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <aside className="relative flex h-full w-[min(84vw,320px)] flex-col bg-white shadow-2xl dark:bg-gray-900">
              <div className="h-20 flex items-center justify-between px-6 border-b border-gray-50 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
                <Link to="/" className="flex items-center gap-4 overflow-hidden" onClick={() => setIsMobileSidebarOpen(false)}>
                  <div className="w-10 h-10 rounded-2xl bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-gray-200 dark:shadow-none">
                    <ShieldAlert className="w-6 h-6 text-white dark:text-gray-900" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">AdminHub</span>
                    <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] -mt-1">Control Panel</span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-100 text-gray-500 dark:border-gray-700 dark:text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="flex-1 p-5 space-y-2 overflow-y-auto custom-scrollbar">
                {visibleAdminLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-[1.25rem] text-sm font-bold transition-all group relative ${
                      isActive(link.to)
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xl shadow-gray-200 dark:shadow-none'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <link.icon className={`w-5 h-5 flex-shrink-0 ${isActive(link.to) ? 'text-blue-400 dark:text-blue-600' : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                    <span className="tracking-tight">{link.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="p-5 border-t border-gray-50 dark:border-gray-800">
                <button
                  onClick={() => {
                    setIsMobileSidebarOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-[1.25rem] text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Sidebar */}
        <aside 
          className={`${
            isSidebarCollapsed ? 'w-24' : 'w-72'
          } hidden bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 xl:flex flex-col transition-all duration-500 ease-in-out sticky top-0 h-screen z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
        >
          {/* Sidebar Header */}
          <div className="h-20 flex items-center px-8 border-b border-gray-50 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
            <Link to="/" className="flex items-center gap-4 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-gray-200 dark:shadow-none group hover:bg-primary-600 dark:hover:bg-primary-400 transition-colors">
                <ShieldAlert className="w-6 h-6 text-white dark:text-gray-900" />
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">AdminHub</span>
                  <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] -mt-1">Control Panel</span>
                </div>
              )}
            </Link>
          </div>

          {/* Sidebar Nav */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
            {/* Admin Links */}
            {visibleAdminLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-[1.25rem] text-sm font-bold transition-all group relative ${
                  isActive(link.to)
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xl shadow-gray-200 dark:shadow-none'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <link.icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive(link.to) ? 'text-blue-400 dark:text-blue-600' : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                {!isSidebarCollapsed && <span className="tracking-tight">{link.label}</span>}
                {!isSidebarCollapsed && isActive(link.to) && (
                  <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-600" />
                )}
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-gray-50 dark:border-gray-800">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[1.25rem] text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all overflow-hidden group`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
              {!isSidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>

          {/* Collapse Toggle */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-4 top-24 hidden h-8 w-8 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-400 shadow-xl transition-all z-50 group hover:border-primary-100 hover:text-primary-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 dark:hover:text-primary-400 xl:flex"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4 transition-transform group-hover:scale-125" /> : <ChevronRight className="w-4 h-4 rotate-180 transition-transform group-hover:scale-125" />}
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 sm:gap-6">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-500 transition hover:text-primary-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 xl:hidden"
                aria-label="Open admin navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                {adminLinks.find(l => isActive(l.to))?.label || 'Dashboard'}
              </h2>
              <div className="hidden xl:flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input type="text" placeholder="Global search..." className="bg-transparent border-none text-xs font-medium focus:ring-0 w-48 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600" />
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleTheme}
                  className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-gray-100 dark:hover:border-gray-600 transition-all"
                  title="Toggle Theme"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-gray-100 dark:hover:border-gray-600 transition-all relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-gray-900" />
                </button>
              </div>

              <div className="hidden h-8 w-px bg-gray-100 dark:bg-gray-800 sm:block" />

              <div className="flex items-center gap-4">
                <div className="text-right hidden 2xl:block">
                  <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{user?.fullName}</p>
                  <p className="text-[10px] text-primary-600 dark:text-primary-400 mt-1 font-black uppercase tracking-[0.2em]">{userRoleLabel}</p>
                </div>
                <div className="w-12 h-12 rounded-[1.25rem] bg-gray-900 dark:bg-gray-700 border-4 border-gray-50 dark:border-gray-800 flex items-center justify-center shadow-lg shadow-gray-200 dark:shadow-none overflow-hidden">
                  <span className="text-white text-sm font-black">
                    {user?.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
