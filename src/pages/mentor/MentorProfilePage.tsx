import { useAuthStore } from '@/store/authStore'
import MentorProfileForm from '@/components/mentor/MentorProfileForm'
import { useQuery } from 'react-query'
import { mentorApi } from '@/api/mentorApi'

export default function MentorProfilePage() {
  const { user } = useAuthStore()

  const { data: mentorProfile, isLoading } = useQuery(
    ['mentorProfile', user?.userId],
    () => mentorApi.getMentorProfile(user!.userId),
    {
      enabled: !!user?.userId,
      retry: false,
    }
  )

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {mentorProfile ? 'Edit Mentor Profile' : 'Become a Mentor'}
      </h1>

      {!isLoading && (
        <div className="card">
          <MentorProfileForm
            userId={user.userId}
            initialData={mentorProfile ? {
              headline: mentorProfile.headline,
              hourlyRateMxc: mentorProfile.hourlyRateMxc,
              yearsOfExperience: mentorProfile.yearsOfExperience,
              availability: mentorProfile.availability,
              responseTimeHours: mentorProfile.responseTimeHours,
              cvUrl: mentorProfile.cvUrl,
              portfolioUrl: mentorProfile.portfolioUrl,
            } : undefined}
            isEdit={!!mentorProfile}
          />
        </div>
      )}
    </div>
  )
}
