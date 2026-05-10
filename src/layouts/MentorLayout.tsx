import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { 
  LayoutDashboard, 
  UserCog,
  Briefcase, 
  BookOpen, 
  MessageSquare, 
  Wallet, 
  LogOut, 
  ChevronRight, 
  Menu, 
  X,
  Calendar,
  Award,
  ExternalLink,
  Sun,
  Moon,
  Search
} from 'lucide-react'
import { useState } from 'react'

const mentorLinks = [
  { to: '/mentor/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/mentor/jobs', label: 'Find Jobs', icon: Search },
  { to: '/mentor/proposals', label: 'My Proposals', icon: MessageSquare },
  { to: '/mentor/contracts', label: 'Active Contracts', icon: Briefcase },
  { to: '/mentor/my-courses', label: 'My Courses', icon: BookOpen },
  { to: '/mentor/schedule', label: 'Schedule', icon: Calendar },
  { to: '/mentor/wallet', label: 'Earnings', icon: Wallet },
]

export default function MentorLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { isDarkMode, toggleTheme } = useThemeStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-72' : 'w-24'
        } bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-all duration-300 sticky top-0 h-screen z-50`}
      >
        <div className="h-20 flex items-center px-8 border-b border-gray-50 dark:border-gray-800/50">
          <Link to="/" className="flex items-center gap-4 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200 dark:shadow-none">
              <Award className="w-6 h-6 text-white" />
            </div>
            {isSidebarOpen && (
              <div className="leading-none">
                <span className="text-xl font-black text-gray-900 dark:text-white whitespace-nowrap block tracking-tight">MentorHub</span>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Premium Expert</span>
              </div>
            )}
          </Link>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {mentorLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-4 px-4 py-4 rounded-[1.25rem] text-sm font-bold transition-all group ${
                isActive(link.to)
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none translate-x-2'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <link.icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive(link.to) ? 'text-white' : 'text-gray-400 dark:text-gray-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`} />
              {isSidebarOpen && <span>{link.label}</span>}
              {isSidebarOpen && isActive(link.to) && (
                <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-50 dark:border-gray-800/50 space-y-4">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-[1.25rem] text-sm font-bold transition-all ${
              isDarkMode ? 'text-amber-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isSidebarOpen && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-[1.25rem] text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all overflow-hidden`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-24 w-7 h-7 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full flex items-center justify-center shadow-lg text-gray-400 hover:text-indigo-600 transition-all z-[60]"
        >
          {isSidebarOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              {mentorLinks.find(l => isActive(l.to))?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to={`/mentors/${user?.userId}`}
              className="hidden items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-indigo-600 transition hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-300 lg:inline-flex"
            >
              <ExternalLink className="h-4 w-4" />
              View Public Profile
            </Link>
            <div className="flex items-center gap-4 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none border-2 border-white dark:border-gray-700">
                <span className="text-white text-sm font-black uppercase">
                  {user?.fullName.charAt(0)}
                </span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-black text-gray-900 dark:text-white leading-none tracking-tight">{user?.fullName}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest font-black">Expert Mentor</p>
              </div>
            </div>
            <Link to="/" className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-widest border-b-2 border-indigo-100 dark:border-indigo-900 pb-0.5">
              Go to Website →
            </Link>
          </div>
        </header>

        <main className="p-10 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
