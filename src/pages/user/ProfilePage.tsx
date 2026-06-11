import { useAuthStore } from '@/store/authStore'
import UserUpdateForm from '@/components/user/UserUpdateForm'
import EkycVerification from '@/components/user/EkycVerification'
import UserPreferenceForm from '@/components/user/UserPreferenceForm'
import PasswordChangeForm from '@/components/auth/PasswordChangeForm'
import { useI18n } from '@/i18n/I18nProvider'
import { User, ShieldCheck, SlidersHorizontal, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ProfilePage() {
  const { t } = useI18n()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'ekyc'>('profile')

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
            <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('profile.accountSettings')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">{t('profile.accountSubtitle')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/mentors/${user.userId}`}
            className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-slate-900"
          >
            {t('nav.publicMentorProfile')}
          </Link>
          <Link
            to="/mentor/profile"
            className="inline-flex items-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-700"
          >
            {t('nav.editMentorProfile')}
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex p-1 bg-gray-100 dark:bg-slate-900 rounded-2xl w-fit flex-wrap">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'profile'
              ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <User className="w-4 h-4" />
          {t('profile.tabs.account')}
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'preferences'
              ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t('profile.tabs.preferences')}
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'security'
              ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Lock className="w-4 h-4" />
          {t('profile.tabs.security')}
        </button>
        <button
          onClick={() => setActiveTab('ekyc')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'ekyc'
              ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          {t('profile.tabs.verification')}
        </button>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-100">
        {t('profile.accountLanguageInfo')}
      </div>
      
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
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
  )
}
