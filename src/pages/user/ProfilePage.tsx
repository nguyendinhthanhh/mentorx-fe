import { useAuthStore } from '@/store/authStore'
import UserUpdateForm from '@/components/user/UserUpdateForm'
import { User } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
          <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Manage your personal information</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
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
      </div>
    </div>
  )
}
