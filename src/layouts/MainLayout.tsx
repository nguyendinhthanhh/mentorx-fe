import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Menu, X, LogOut, MessageSquare, GraduationCap, Sparkles } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import NotificationDropdown from '@/components/notification/NotificationDropdown'
import { useI18n } from '@/i18n/I18nProvider'
import { useQuery } from 'react-query'
import { chatApi } from '@/api/chatApi'
import { isMentor } from '@/utils/roleRedirect'

function SiteFooter() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-[#e2e6f5] bg-[#101a4a] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/15" />
              <span className="text-xl font-bold">Mentor X</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-blue-100">{t('footer.description')}</p>
          </div>

          <div>
            <p className="text-sm font-semibold">{t('footer.explore')}</p>
            <div className="mt-3 grid gap-2 text-sm text-blue-100">
              <Link to="/jobs">{t('nav.jobs')}</Link>
              <Link to="/mentors">{t('nav.mentors')}</Link>
              <Link to="/courses">{t('nav.learning')}</Link>
              <Link to="/blog">{t('nav.blog')}</Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">{t('footer.forCandidates')}</p>
            <div className="mt-3 grid gap-2 text-sm text-blue-100">
              <Link to="/register">{t('footer.createProfile')}</Link>
              <Link to="/jobs">{t('footer.findJobs')}</Link>
              <Link to="/profile">{t('footer.skills')}</Link>
              <Link to="/help">{t('footer.help')}</Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">{t('footer.newsletter')}</p>
            <div className="mt-3 flex gap-2">
              <input
                type="email"
                placeholder={t('footer.emailPlaceholder')}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-200 outline-none"
              />
              <button type="button" className="rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white">
                {t('footer.subscribe')}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-white/15 pt-4 text-xs text-blue-100">{t('footer.copyright')}</div>
      </div>
    </footer>
  )
}

export default function MainLayout() {
  const { user, logout } = useAuthStore()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const hideFooter = location.pathname.startsWith('/chat')
  const mentorApproved = isMentor(user)
  const inMentorMode = location.pathname.startsWith('/mentor') && !location.pathname.startsWith('/mentors')

  // Get unread message count
  const { data: rooms } = useQuery(
    ['chatRooms', user?.userId],
    () => chatApi.getUserRooms(user!.userId),
    { 
      enabled: !!user?.userId,
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  )

  const unreadCount = rooms?.content.reduce((sum, room) => sum + (room.unreadCount || 0), 0) || 0

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
    <div className="min-h-screen bg-[#f7f8fc]">
      <header className="sticky top-0 z-50 border-b border-[#e2e6f5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#2d6cdf]" />
            <span className="text-xl font-bold text-[#16204b]">Mentor X</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((item) => {
              const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(`${item.to}/`))

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative inline-flex h-16 items-center gap-2 border-b-2 text-sm font-medium transition-colors ${
                    active
                      ? 'border-[#4f46e5] text-[#4f46e5]'
                      : 'border-transparent text-slate-600 hover:text-[#4f46e5]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher />
            {user ? (
              <>
                {mentorApproved ? (
                  <Link
                    to={inMentorMode ? '/profile' : '/mentor/dashboard'}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                    title={inMentorMode ? 'Chuyển về User Mode' : 'Chuyển sang Mentor Mode'}
                  >
                    {inMentorMode ? <Sparkles className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
                    {inMentorMode ? 'Mentor Mode' : 'Student Mode'}
                  </Link>
                ) : (
                  <Link
                    to="/mentor/profile"
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    Trở thành mentor
                  </Link>
                )}
                <Link
                  to="/chat"
                  className={`relative rounded-lg p-2 transition-colors ${
                    location.pathname.startsWith('/chat')
                      ? 'bg-indigo-50 text-[#4f46e5]'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                  aria-label={t('nav.messages')}
                  title={t('nav.messages')}
                >
                  <MessageSquare className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#4f46e5] px-1 text-[10px] font-bold leading-none text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <NotificationDropdown userId={user.userId} />
                <Link to="/profile" className="text-sm font-semibold text-slate-700">
                  {user.displayName || user.fullName || t('nav.account')}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
                  aria-label={t('nav.logout')}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
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
                  <Link
                    to={mentorApproved ? (inMentorMode ? '/profile' : '/mentor/dashboard') : '/mentor/profile'}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {mentorApproved ? (inMentorMode ? 'Chuyển về User Mode' : 'Chuyển sang Mentor Mode') : 'Trở thành mentor'}
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
                    Thông báo
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

      <main>
        <Outlet />
      </main>

      {!hideFooter && <SiteFooter />}
    </div>
  )
}
