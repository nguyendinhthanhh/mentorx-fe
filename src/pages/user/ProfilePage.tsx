import { useAuthStore } from '@/store/authStore'
import UserUpdateForm from '@/components/user/UserUpdateForm'
import { User } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
          <User className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-0.5">Manage your personal information</p>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
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
