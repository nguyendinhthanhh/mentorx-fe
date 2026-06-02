import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  Briefcase,
  ChevronDown,
  GraduationCap,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  User,
  UserCog,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import NotificationDropdown from '@/components/notification/NotificationDropdown'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { chatApi } from '@/api/chatApi'
import { walletApi } from '@/api/walletApi'
import { useI18n } from '@/i18n/I18nProvider'
import { formatMxc } from '@/utils/formatters'
import { canAccessAdminWorkspace, canSwitchToMentorMode, isAdmin } from '@/utils/roleRedirect'
import { MentorStatus, UserMode } from '@/types'

function getMentorCtaLabel(status: MentorStatus | undefined, t: ReturnType<typeof useI18n>['t']) {
  switch (status) {
    case MentorStatus.PENDING:
      return t('nav.mentorApplicationPending')
    case MentorStatus.REJECTED:
      return t('nav.updateMentorApplication')
    case MentorStatus.SUSPENDED:
      return t('nav.mentorSuspended')
    default:
      return t('nav.becomeMentor')
  }
}

export default function AppHeader() {
  const { t, language } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, setCurrentMode } = useAuthStore()
  const { isDarkMode, toggleTheme } = useThemeStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const mentorApproved = canSwitchToMentorMode(user)
  const { data: rooms } = useQuery(
    ['chatRooms', user?.userId],
    () => chatApi.getUserRooms(user!.userId),
    { enabled: !!user?.userId, refetchInterval: 30000 }
  )

  const { data: balance } = useQuery(
    ['userBalance', user?.userId],
    () => walletApi.getUserBalance(user!.userId),
    { enabled: !!user?.userId, refetchInterval: 30000 }
  )

  const unreadCount = rooms?.content.reduce((sum, room) => sum + (room.unreadCount || 0), 0) || 0
  const mentorCtaLabel = getMentorCtaLabel(user?.mentorStatus, t)

  const navLinks = [
    { to: '/jobs', label: t('nav.jobs') },
    { to: '/mentors', label: t('nav.mentors') },
    { to: '/courses', label: t('nav.learning') },
    { to: '/blog', label: t('nav.blog') },
    { to: '/about', label: t('nav.about') },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-950/70">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-950 shadow-lg transition-transform group-hover:scale-105 group-active:scale-95 dark:bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-90 transition-opacity group-hover:opacity-100" />
            <Sparkles className="relative h-5 w-5 text-white mix-blend-overlay" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Mentor<span className="text-indigo-600">X</span>
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Academy</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((item) => {
            const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(`${item.to}/`))
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group relative px-4 py-2 text-sm font-bold transition-all duration-300 ${
                  active
                    ? 'text-indigo-600'
                    : 'text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <span className="relative z-10">{item.label}</span>
                {active ? (
                  <div className="absolute inset-0 z-0 rounded-full bg-indigo-50/50 dark:bg-indigo-900/20" />
                ) : (
                  <div className="absolute inset-0 z-0 scale-75 rounded-full bg-slate-100 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 dark:bg-slate-800" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <LanguageSwitcher />

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              {!mentorApproved && !canAccessAdminWorkspace(user) && (
                <Link
                  to="/become-a-mentor"
                  className="group relative flex h-10 items-center gap-2 overflow-hidden rounded-xl bg-slate-950 px-5 text-xs font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-indigo-200 active:translate-y-0 dark:bg-white dark:text-slate-950 dark:shadow-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 transition-opacity group-hover:opacity-100" />
                  <GraduationCap className="relative h-4 w-4" />
                  <span className="relative">{mentorCtaLabel}</span>
                </Link>
              )}

              {canAccessAdminWorkspace(user) && (
                <Link
                  to="/admin/dashboard"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <UserCog className="h-4 w-4" />
                  <span className="hidden lg:inline">{isAdmin(user) ? t('nav.adminConsole') : t('nav.moderatorConsole')}</span>
                </Link>
              )}

              <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
                <Link
                  to="/wallet"
                  className="flex h-8 items-center gap-2 rounded-xl bg-white px-3 shadow-sm transition hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <Wallet className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                    {formatMxc(balance?.available || 0, language)}
                  </span>
                </Link>

                <div className="flex items-center">
                  <Link
                    to="/chat"
                    className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                      location.pathname.startsWith('/chat')
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-500 hover:bg-white hover:text-indigo-600 dark:hover:bg-slate-800'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-slate-100 dark:ring-slate-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <NotificationDropdown userId={user.userId} />
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="group flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 transition-all hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="h-7 w-7 overflow-hidden rounded-lg bg-indigo-100 ring-2 ring-transparent transition-all group-hover:ring-indigo-200">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-[10px] font-bold text-white">
                        {user.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-300 ${userDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-60 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="mb-1 border-b border-slate-100 px-3 py-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('common.account')}</p>
                        <p className="truncate text-sm font-black text-slate-900">{user.fullName}</p>
                        <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 p-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                            <Wallet className="h-3 w-3" />
                            {t('common.balance')}
                          </div>
                          <span className="text-xs font-black text-amber-600">{formatMxc(balance?.available || 0, language)}</span>
                        </div>
                      </div>

                      <Link
                        to="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                        >
                          <User className="h-4 w-4" />
                          {t('common.viewProfile')}
                      </Link>
                      {mentorApproved && (
                        <Link
                          to="/mentor/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                        >
                          <Star className="h-4 w-4" />
                          {t('nav.editMentorProfile')}
                        </Link>
                      )}
                      <Link
                        to="/wallet"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                      >
                        <Wallet className="h-4 w-4" />
                        {t('nav.wallet')}
                      </Link>
                      <Link
                        to="/my-jobs"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                      >
                        <Briefcase className="h-4 w-4" />
                        {t('nav.myJobs')}
                      </Link>
                      {/* <Link
                        to="/quick-support"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                      >
                        <Zap className="h-4 w-4" />
                        Quick Support
                      </Link> */}
                      <Link
                        to="/profile/courses"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        {t('nav.courses')}
                      </Link>
                      <Link
                        to="/profile/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                      >
                        <UserCog className="h-4 w-4" />
                        {t('nav.settings')}
                      </Link>

                      {mentorApproved && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false)
                            setCurrentMode(UserMode.MENTOR)
                            navigate('/mentor/dashboard')
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                        >
                          <GraduationCap className="h-4 w-4" />
                          {t('nav.mentorDashboard')}
                        </button>
                      )}

                      <div className="my-1 border-t border-slate-100" />
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false)
                          handleLogout()
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-[#4f46e5]">
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca]"
              >
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="rounded-lg p-2 text-slate-600 md:hidden"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#e2e6f5] bg-white px-4 py-3 md:hidden">
          <div className="grid gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 border-t border-[#e2e6f5] pt-3">
            <div className="mb-3">
              <LanguageSwitcher compact />
            </div>
            {user ? (
              <div className="grid gap-2">
                <div className="mb-2 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-3 text-amber-700">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Wallet className="h-4 w-4" />
                    {t('common.balance')}
                  </div>
                  <span className="font-black">{formatMxc(balance?.available || 0, language)}</span>
                </div>
                {mentorApproved && (
                  <Link
                    to="/mentor/dashboard"
                    onClick={() => {
                      setMobileOpen(false)
                      setCurrentMode(UserMode.MENTOR)
                    }}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {t('nav.mentorDashboard')}
                  </Link>
                )}
                {!mentorApproved && (
                  <Link
                    to="/become-a-mentor"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {mentorCtaLabel}
                  </Link>
                )}
                <Link
                  to="/chat"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <span>{t('nav.messages')}</span>
                  {unreadCount > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#4f46e5] px-1.5 text-[11px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/profile/notifications"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {t('common.notifications')}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="flex-1 rounded-lg bg-[#4f46e5] px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
