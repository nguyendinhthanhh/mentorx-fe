import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  BookOpen,
  Briefcase,
  Calendar,
  ChevronDown,
  Menu,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Moon,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Sun,
  X,
  User,
  Wallet,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import NotificationDropdown from '@/components/notification/NotificationDropdown'
import { UserMode } from '@/types'

const navigationItems = [
  { to: '/mentor/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/mentor/proposals', label: 'My Proposals', icon: CreditCard, badge: 3 },
  { to: '/mentor/contracts', label: 'Active Contracts', icon: Briefcase },
  { to: '/mentor/courses', label: 'My Courses', icon: BookOpen },
  { to: '/mentor/schedule', label: 'Schedule', icon: Calendar },
  { to: '/mentor/earnings', label: 'Earnings', icon: Wallet },
  { to: '/mentor/reviews', label: 'Reviews', icon: Star },
  { to: '/mentor/messages', label: 'Messages', icon: MessageCircle, badge: 2 },
  { to: '/mentor/settings', label: 'Settings', icon: Settings },
]

export default function MentorLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, setCurrentMode } = useAuthStore()
  const { isDarkMode, toggleTheme } = useThemeStore()
  const [availability] = useState('Available')
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`)
  const initials = user?.fullName
    ?.split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950' : 'bg-[#faf9ff]'}`}>
      <div className="flex min-h-screen">
        <aside className="hidden max-h-screen w-[248px] shrink-0 overflow-hidden border-r border-slate-200/80 bg-white xl:flex xl:flex-col">
          <div className="flex h-[88px] shrink-0 items-center border-b border-slate-100 px-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-200">
                <span className="text-lg font-black text-white">M</span>
              </div>
              <div className="min-w-0">
                <p className="text-[22px] font-black leading-none tracking-tight text-slate-950">MentorHub</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Premium Mentor</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-2 px-4 py-5">
            {navigationItems.map((item) => {
              const active = isActive(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group flex h-12 items-center gap-3 rounded-2xl px-4 text-[14px] font-bold transition ${
                    active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-black ${active ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'}`}>
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>

          <div className="px-4 pb-4">
            <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-white to-violet-50 p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900">Complete your profile</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Higher chance of getting hired</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-violet-200 text-[11px] font-black text-indigo-600">
                  85%
                </div>
              </div>
              <Link
                to="/become-a-mentor"
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                Improve Profile
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-100 px-4 py-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-bold text-rose-500 transition hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-slate-950/40"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative flex h-full w-[min(84vw,320px)] flex-col bg-white shadow-2xl">
              <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">
                <Link to="/" className="flex items-center gap-3" onClick={() => setMobileNavOpen(false)}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-200">
                    <span className="text-lg font-black text-white">M</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black leading-none tracking-tight text-slate-950">MentorHub</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Premium Mentor</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
                {navigationItems.map((item) => {
                  const active = isActive(item.to)
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileNavOpen(false)}
                      className={`group flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-bold transition ${
                        active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-black ${active ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'}`}>
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  )
                })}
              </nav>

              <div className="border-t border-slate-100 p-4">
                <button
                  type="button"
                  onClick={() => {
                    setMobileNavOpen(false)
                    handleLogout()
                  }}
                  className="flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-bold text-rose-500 transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="min-w-0 max-h-screen flex-1 overflow-y-auto">
          <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
            <div className="flex h-[80px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 xl:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-4 w-4" />
                </button>

                <div className="relative hidden max-w-[420px] flex-1 lg:block">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search jobs, clients, skills..."
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-14 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-400">
                    K
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  className="hidden h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 2xl:inline-flex"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  {availability}
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {user && <NotificationDropdown userId={user.userId} />}

                <button type="button" className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 sm:flex">
                  <MessageCircle className="h-4 w-4" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-3 rounded-2xl bg-white pl-2 pr-1 border border-slate-200 transition hover:border-indigo-200"
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-2xl bg-slate-100">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user?.fullName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-sm font-black text-indigo-600">
                          {initials || 'M'}
                        </div>
                      )}
                    </div>
                    <div className="hidden text-left 2xl:block">
                      <p className="text-sm font-black text-slate-950">{user?.fullName || 'Mentor'}</p>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">Expert Mentor</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${userDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                  </button>

                  {userDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)} />
                      <div className="absolute right-0 z-20 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="mb-1 border-b border-slate-100 px-3 py-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Account</p>
                          <p className="truncate text-sm font-black text-slate-950">{user?.fullName || 'Mentor'}</p>
                          <p className="truncate text-[11px] font-medium text-slate-500">Expert Mentor</p>
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                        >
                          <User className="h-4 w-4" />
                          View Profile
                        </Link>
                        <Link
                          to="/mentor/profile-setup"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                        >
                          <Star className="h-4 w-4" />
                          View Mentor Profile
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false)
                            setCurrentMode(UserMode.USER)
                            navigate('/')
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          Back to Market
                        </button>

                        <div className="my-1 border-t border-slate-100" />
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false)
                            handleLogout()
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 py-5 sm:px-6 lg:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
