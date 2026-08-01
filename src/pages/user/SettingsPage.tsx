import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import UserUpdateForm from '@/components/user/UserUpdateForm'
import PasswordChangeForm from '@/components/auth/PasswordChangeForm'
import MentorProfileSetupPage from '@/pages/mentor/MentorProfileSetupPage'
import { useI18n } from '@/i18n/I18nProvider'
import { isMentorApproved } from '@/utils/roleRedirect'
import { User, Lock, Settings as SettingsIcon, ShieldCheck, type LucideIcon } from 'lucide-react'

type TabId = 'profile' | 'mentor' | 'security'
type SettingsTab = { id: TabId; icon: LucideIcon; label: string }

export default function SettingsPage() {
  const { t } = useI18n()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  if (!user) return null

  const tabs: SettingsTab[] = [
    { id: 'profile', icon: User, label: t('profile.tabs.account') },
  ]
  if (isMentorApproved(user)) {
    tabs.push({ id: 'mentor', icon: ShieldCheck, label: 'Mentor Profile' })
  }
  tabs.push({ id: 'security', icon: Lock, label: t('profile.tabs.security') })

  const isMentorTab = activeTab === 'mentor'

  return (
    <div className="space-y-6">


      {/* Tab Navigation */}
      <nav className="flex flex-wrap gap-2 rounded-[20px] border border-slate-200/60 bg-white/70 p-2 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ease-out whitespace-nowrap ${
                active
                  ? 'bg-[#059669] text-white shadow-[0_4px_12px_rgba(5,150,105,0.25)]'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon className={`h-4.5 w-4.5 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-[#059669]'}`} />
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Content Area */}
      {isMentorTab ? (
        <MentorProfileSetupPage />
      ) : (
        <div className="rounded-[28px] border border-slate-200/60 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 lg:p-10">
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
