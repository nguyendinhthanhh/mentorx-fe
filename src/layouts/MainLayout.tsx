import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import {
  Award,
  BookOpen,
  Briefcase,
  Facebook,
  Globe,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  ShieldAlert,
  Sun,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import NotificationDropdown from '@/components/notification/NotificationDropdown'

const publicLinks = [
  { to: '/mentors', label: 'Mentors', icon: Users },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/courses', label: 'Courses', icon: BookOpen },
]

const landingLinks = [
  { to: '/jobs/create', label: 'Post a Request', icon: Briefcase },
  { to: '/mentors', label: 'Find a Mentor', icon: Users },
  { to: '/courses', label: 'Resources & Courses', icon: BookOpen },
]

const privateLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
]

const landingFooterGroups = [
  {
    title: 'About Us',
    links: [
      { to: '/about', label: 'About MentorX' },
      { to: '/jobs', label: 'Careers' },
      { to: '/terms', label: 'Terms of Service' },
      { to: '/privacy', label: 'Privacy Policy' },
    ],
  },
  {
    title: 'For Users',
    links: [
      { to: '/jobs/create', label: 'Post a Request' },
      { to: '/mentors', label: 'Find a Mentor' },
      { to: '/courses', label: 'Courses' },
      { to: '/wallet', label: 'Wallet' },
    ],
  },
  {
    title: 'Support',
    links: [
      { to: '/help', label: 'Help Center' },
      { to: '/certificates', label: 'Report an Issue' },
      { to: '/disputes', label: 'Dispute Resolution' },
      { to: '/support', label: 'Support: 1900 xxxx' },
    ],
  },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { isDarkMode, toggleTheme } = useThemeStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isLandingPage = location.pathname === '/'
  const navLinks = isLandingPage ? landingLinks : user ? [...privateLinks, ...publicLinks] : publicLinks

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDarkMode ? 'dark bg-slate-950' : isLandingPage ? 'bg-white' : 'bg-gray-50'
      }`}
    >
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${
          isLandingPage
            ? 'border-slate-200 bg-white/90 dark:border-white/10 dark:bg-slate-950/90'
            : 'border-gray-100 bg-white/80 dark:border-gray-800 dark:bg-gray-900/85'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to={user ? '/dashboard' : '/'} className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-8 w-8 flex-none items-center justify-center rounded-md text-sm font-black shadow-sm ${
                  isLandingPage
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
                }`}
              >
                X
              </div>
              <span className="truncate text-sm font-black tracking-tight text-slate-950 dark:text-white sm:text-base">
                Mentor X
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors lg:text-sm ${
                    isActive(link.to)
                      ? isLandingPage
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300'
                      : isLandingPage
                        ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              {isLandingPage && (
                <a
                  href="#how-it-works"
                  className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white lg:text-sm"
                >
                  How it Works
                </a>
              )}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Toggle theme"
                title="Toggle theme"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {user ? (
                <>
                  <NotificationDropdown userId={user.userId} />

                  {user.mentorStatus === 'APPROVED' && (
                    <Link
                      to="/mentor"
                      className="hidden items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/25 dark:text-indigo-300 dark:hover:bg-indigo-900/40 lg:flex"
                    >
                      <Award className="h-3.5 w-3.5" />
                      MentorHub
                    </Link>
                  )}

                  {user.roles?.some((role) => role.roleName.toUpperCase().includes('ADMIN')) && (
                    <Link
                      to="/admin"
                      className="hidden items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-900/25 dark:text-amber-300 dark:hover:bg-amber-900/40 lg:flex"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      AdminHub
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    className="hidden items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 sm:flex"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-blue-600 shadow-sm dark:border-gray-800">
                      <span className="text-xs font-bold text-white">
                        {(user.displayName || user.fullName || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden text-sm font-semibold text-gray-700 dark:text-gray-300 md:inline">
                      {user.displayName || user.fullName}
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    to="/login"
                    className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white lg:text-sm"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5 hover:bg-blue-700 dark:bg-blue-500 dark:shadow-none dark:hover:bg-blue-400 lg:text-sm"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10 md:hidden"
                aria-label="Open menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <nav className="space-y-1 border-t border-slate-200 pb-4 pt-3 dark:border-white/10 md:hidden">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
                    isActive(link.to)
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/10'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              {isLandingPage && (
                <a
                  href="#how-it-works"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  How it Works
                </a>
              )}
              {!user && (
                <div className="grid grid-cols-2 gap-2 pt-2 sm:hidden">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg bg-blue-600 px-3 py-2.5 text-center text-sm font-black text-white dark:bg-blue-500"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className={isLandingPage ? 'flex-1' : 'mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'}>
        <Outlet />
      </main>

      {isLandingPage ? (
        <footer className="bg-slate-950 pb-10 pt-14 text-white dark:bg-black">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 md:grid-cols-[1.15fr_2fr]">
              <div>
                <Link to="/" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-black text-white">
                    X
                  </div>
                  <span className="text-sm font-black">Mentor X</span>
                </Link>
                <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
                  Vietnam's leading Mentor-Mentee platform with secure Escrow payments.
                </p>
                <div className="mt-5 flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300">
                    <Facebook className="h-4 w-4" />
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300">
                    <Globe className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-3">
                {landingFooterGroups.map((group) => (
                  <div key={group.title}>
                    <h5 className="text-sm font-black text-white">{group.title}</h5>
                    <ul className="mt-4 space-y-3 text-sm text-slate-400">
                      {group.links.map((link) => (
                        <li key={link.to}>
                          <Link to={link.to} className="transition-colors hover:text-white">
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 Mentor X Inc. All rights reserved.</p>
              <p>Designed for Trust</p>
            </div>
          </div>
        </footer>
      ) : (
        <footer className="bg-gray-900 pb-10 pt-16 text-white dark:bg-black">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 grid grid-cols-2 gap-12 text-left md:grid-cols-4 lg:grid-cols-5">
              <div className="col-span-2 lg:col-span-2">
                <Link to="/" className="mb-6 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <span className="text-sm font-bold text-white">M</span>
                  </div>
                  <span className="text-xl font-bold">MentorX</span>
                </Link>
                <p className="mb-6 max-w-xs text-sm leading-relaxed text-gray-400">
                  Vietnam's leading Mentor-Mentee network solving recruitment and training challenges.
                </p>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors hover:text-white">
                    <Facebook className="h-4 w-4" />
                  </div>
                  <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors hover:text-white">
                    <Globe className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div>
                <h5 className="mb-6 text-sm font-bold">About Us</h5>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li><Link to="/about" className="transition-colors hover:text-white">About MentorX</Link></li>
                  <li><Link to="/jobs" className="transition-colors hover:text-white">Careers</Link></li>
                  <li><Link to="/terms" className="transition-colors hover:text-white">Terms of Service</Link></li>
                  <li><Link to="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="mb-6 text-sm font-bold">For Users</h5>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li><Link to="/jobs/create" className="transition-colors hover:text-white">Post a Request</Link></li>
                  <li><Link to="/mentors" className="transition-colors hover:text-white">Find a Mentor</Link></li>
                  <li><Link to="/faq" className="transition-colors hover:text-white">FAQ</Link></li>
                  <li><Link to="/support" className="transition-colors hover:text-white">24/7 Support</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="mb-6 text-sm font-bold">Support</h5>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li><Link to="/help" className="transition-colors hover:text-white">Help Center</Link></li>
                  <li><Link to="/certificates" className="transition-colors hover:text-white">Certificates</Link></li>
                  <li><Link to="/disputes" className="transition-colors hover:text-white">Dispute Resolution</Link></li>
                  <li><span className="font-bold text-blue-400">Support: 1900 xxxx</span></li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 text-center text-xs font-medium text-gray-500 md:flex-row md:text-left">
              <p>© 2026 MentorX Inc. All rights reserved.</p>
              <p>Designed for the Tech Community</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
