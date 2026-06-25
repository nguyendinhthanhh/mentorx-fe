import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import UserUpdateForm from '@/components/user/UserUpdateForm'
import EkycVerification from '@/components/user/EkycVerification'
import UserPreferenceForm from '@/components/user/UserPreferenceForm'
import PasswordChangeForm from '@/components/auth/PasswordChangeForm'
import { useI18n } from '@/i18n/I18nProvider'
import { User, ShieldCheck, SlidersHorizontal, Lock, Settings as SettingsIcon } from 'lucide-react'

export default function SettingsPage() {
  const { t } = useI18n()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'ekyc'>('profile')

  if (!user) return null

  const tabs = [
    { id: 'profile', icon: User, label: t('profile.tabs.account') },
    { id: 'preferences', icon: SlidersHorizontal, label: t('profile.tabs.preferences') },
    { id: 'security', icon: Lock, label: t('profile.tabs.security') },
    { id: 'ekyc', icon: ShieldCheck, label: t('profile.tabs.verification') },
  ] as const

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
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Vertical Tabs Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="flex flex-row overflow-x-auto lg:flex-col gap-2 bg-white dark:bg-slate-900 p-3 rounded-[20px] border border-slate-200/60 dark:border-slate-800 shadow-sm">
            {tabs.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap lg:whitespace-normal ${
                    active
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <tab.icon className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-primary-600'}`} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/60 dark:border-slate-800 shadow-sm p-6 lg:p-8">
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
          ) : activeTab === 'preferences' ? (
            <UserPreferenceForm />
          ) : activeTab === 'security' ? (
            <PasswordChangeForm />
          ) : (
            <EkycVerification />
          )}
        </div>
      </div>
    </div>
  )
}
