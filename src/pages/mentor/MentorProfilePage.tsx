import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'
import MentorProfileForm from '@/components/mentor/MentorProfileForm'
import { useQuery } from 'react-query'
import { mentorApi } from '@/api/mentorApi'
import { ArrowLeft, Award } from 'lucide-react'

export default function MentorProfilePage() {
  const { user } = useAuthStore()

  const { data: mentorProfile, isLoading } = useQuery(
    ['mentorProfile', user?.userId],
    () => mentorApi.getMentorProfile(user!.userId),
    { enabled: !!user?.userId, retry: false }
  )

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/mentors" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to mentors
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
          <Award className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {mentorProfile ? 'Edit Mentor Profile' : 'Become a Mentor'}
          </h1>
          <p className="text-gray-500 mt-0.5">
            {mentorProfile ? 'Update your mentor information' : 'Share your expertise and earn MXC'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 bg-gray-100 rounded w-1/4 mb-2" />
              <div className="h-10 bg-gray-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
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
