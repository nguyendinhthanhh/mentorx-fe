import { useAuthStore } from '@/store/authStore'
import UserUpdateForm from '@/components/user/UserUpdateForm'
import EkycVerification from '@/components/user/EkycVerification'
import { User, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isMentor } from '@/utils/roleRedirect'

export default function ProfilePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'profile' | 'ekyc'>('profile')

  useEffect(() => {
    if (user && isMentor(user)) {
      navigate(`/mentors/${user.userId}`, { replace: true })
    }
  }, [user, navigate])

  if (!user || isMentor(user)) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
            <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">Manage your identity and profile information</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex p-1 bg-gray-100 dark:bg-slate-900 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'profile'
              ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <User className="w-4 h-4" />
          Personal Info
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
          Identity Verification
        </button>
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
        ) : (
          <EkycVerification />
        )}
      </div>
    </div>
  )
}
