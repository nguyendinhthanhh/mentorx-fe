import { useEffect, useState } from 'react'
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
  Star,
  Sun,
  User,
  UserCog,
  Wallet,
  X,
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

  useEffect(() => {
    setMobileOpen(false)
    setUserDropdownOpen(false)
  }, [location.pathname])

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
    <header className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-[#4f46e5] transition group-hover:border-indigo-200 group-hover:bg-indigo-50">
            MX
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Mentor<span className="text-indigo-600">X</span>
            </span>
            <span className="mt-1 text-[11px] text-slate-500">Academy</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex">
          {navLinks.map((item) => {
            const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(`${item.to}/`))
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-lg px-4 py-2 text-[15px] font-semibold transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex xl:gap-4">
          <LanguageSwitcher />

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              {!mentorApproved && !canAccessAdminWorkspace(user) && (
                <Link
                  to="/become-a-mentor"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#4f46e5] px-3 text-[11px] font-semibold text-white transition hover:bg-[#4338ca] xl:px-5 xl:text-xs"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden xl:inline">{mentorCtaLabel}</span>
                </Link>
              )}

              {canAccessAdminWorkspace(user) && (
                <Link
                  to="/admin/dashboard"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <UserCog className="h-4 w-4" />
                  <span className="hidden 2xl:inline">{isAdmin(user) ? t('nav.adminConsole') : t('nav.moderatorConsole')}</span>
                </Link>
              )}

              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <Link
                  to="/wallet"
                  className="flex h-8 items-center gap-2 rounded-lg bg-white px-2.5 transition hover:bg-slate-50 xl:px-3"
                >
                  <Wallet className="h-3.5 w-3.5 text-amber-500" />
                  <span className="hidden text-[11px] font-semibold text-slate-700 xl:inline">
                    {formatMxc(balance?.available || 0, language)}
                  </span>
                </Link>

                <div className="flex items-center">
                  <Link
                    to="/chat"
                    className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                      location.pathname.startsWith('/chat')
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-500 hover:bg-white hover:text-indigo-600'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
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
                  className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 transition hover:border-indigo-200 hover:bg-slate-50"
                >
                  <div className="h-7 w-7 overflow-hidden rounded-lg bg-indigo-100">
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
                        <p className="text-xs font-medium text-slate-400">{t('common.account')}</p>
                        <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
                        <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 p-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                            <Wallet className="h-3 w-3" />
                            {t('common.balance')}
                          </div>
                          <span className="text-xs font-semibold text-amber-600">{formatMxc(balance?.available || 0, language)}</span>
                        </div>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                      >
                        <User className="h-4 w-4" />
                        {t('common.viewProfile')}
                      </Link>
                      {mentorApproved && (
                        <Link
                          to="/mentor/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                        >
                          <Star className="h-4 w-4" />
                          {t('nav.editMentorProfile')}
                        </Link>
                      )}
                      <Link
                        to="/wallet"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                      >
                        <Wallet className="h-4 w-4" />
                        {t('nav.wallet')}
                      </Link>
                      <Link
                        to="/my-jobs"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
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
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        {t('nav.courses')}
                      </Link>
                      <Link
                        to="/profile/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
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
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
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
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-[#4f46e5]">
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
          className="rounded-lg p-2 text-slate-600 lg:hidden"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#E2E8F0] bg-white px-4 py-3 lg:hidden">
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
          <div className="mt-3 border-t border-[#E2E8F0] pt-3">
            <div className="mb-3">
              <LanguageSwitcher compact />
            </div>
            {user ? (
              <div className="grid gap-2">
                <div className="mb-1 flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3">
                  <div className="h-10 w-10 overflow-hidden rounded-xl bg-indigo-100">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-sm font-bold text-white">
                        {user.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">{user.fullName}</p>
                    <p className="truncate text-xs font-medium text-slate-500">{user.email}</p>
                  </div>
                </div>
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
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {t('common.viewProfile')}
                </Link>
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
                  onClick={() => {
                    setMobileOpen(false)
                    handleLogout()
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
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
