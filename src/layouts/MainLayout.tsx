import { Outlet, useLocation, Link } from 'react-router-dom'
import { useI18n } from '@/i18n/I18nProvider'
import AppHeader from '@/components/AppHeader'
import { AiAssistantWidget } from '@/components/ui/AiAssistantWidget'

function SiteFooter() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-[#e2e6f5] bg-[#101a4a] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
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
  const { t } = useI18n()
  const location = useLocation()
  const hideFooter = location.pathname.startsWith('/chat')

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AppHeader />
      <main>
        <Outlet />
      </main>
      {!hideFooter && <SiteFooter />}
      <AiAssistantWidget />
    </div>
  )
}
