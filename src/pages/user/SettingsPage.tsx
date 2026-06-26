import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import UserUpdateForm from '@/components/user/UserUpdateForm'
import PasswordChangeForm from '@/components/auth/PasswordChangeForm'
import MentorProfileSetupPage from '@/pages/mentor/MentorProfileSetupPage'
import { useI18n } from '@/i18n/I18nProvider'
import { User, Lock, Settings as SettingsIcon, ShieldCheck } from 'lucide-react'

export default function SettingsPage() {
  const { t } = useI18n()
  const { user } = useAuthStore()

  if (!user) return null

  const tabs = [
    { id: 'profile', icon: User, label: t('profile.tabs.account') },
    ...(user.isMentor ? [
      { id: 'mentor', icon: ShieldCheck, label: 'Mentor Profile' },
    ] : []),
    { id: 'security', icon: Lock, label: t('profile.tabs.security') },
  ] as const

  type TabId = typeof tabs[number]['id']
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  const isMentorTab = activeTab === 'mentor'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shadow-inner">
          <SettingsIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Cài đặt</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Quản lý thông tin và cài đặt bảo mật cá nhân của bạn.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200/60 bg-blue-50/50 px-5 py-4 text-sm font-medium text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-100 shadow-sm">
        {t('profile.accountLanguageInfo')}
      </div>

      {/* Tab Navigation - always horizontal for simplicity */}
      <nav className="flex flex-wrap gap-2 bg-white dark:bg-slate-900 p-3 rounded-[20px] border border-slate-200/60 dark:border-slate-800 shadow-sm">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                active
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
              }`}
            >
              <tab.icon className={`w-4.5 h-4.5 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-primary-600'}`} />
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Content Area - Mentor Profile gets full width, others get a contained panel */}
      {isMentorTab ? (
        <MentorProfileSetupPage />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/60 dark:border-slate-800 shadow-sm p-6 lg:p-8">
          {activeTab === 'profile' ? (
            <UserUpdateForm
              userId={user.userId}
              initialData={{
                fullName: user.fullName,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                phone: user.phone,
                countryCode: user.countryCode,
                preferredLanguage: user.preferredLanguage,
                profileIsPublic: user.profileIsPublic,
              }}
            />
          ) : (
            <PasswordChangeForm />
          )}
        </div>
      )}
    </div>
  )
}
