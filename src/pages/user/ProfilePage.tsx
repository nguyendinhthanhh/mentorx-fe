import { useAuthStore } from '@/store/authStore'
import UserUpdateForm from '@/components/user/UserUpdateForm'

export default function ProfilePage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <div className="card">
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
