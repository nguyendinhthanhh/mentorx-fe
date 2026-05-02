import { useQuery } from 'react-query'
import { mentorApi } from '@/api/mentorApi'
import { formatCurrency } from '@/utils/formatters'
import { Star, Clock } from 'lucide-react'

export default function MentorListPage() {
  const { data, isLoading } = useQuery('mentors', () =>
    mentorApi.getAllApprovedMentors({ page: 0, size: 20 })
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Find a Mentor</h1>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading mentors...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.content.map((mentor) => (
            <div key={mentor.userId} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <img
                  src={mentor.user.avatarUrl || 'https://via.placeholder.com/80'}
                  alt={mentor.user.fullName}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{mentor.user.fullName}</h3>
                  <p className="text-sm text-gray-600">{mentor.headline}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Hourly Rate:</span>
                  <span className="font-semibold">
                    {mentor.hourlyRateMxc ? formatCurrency(mentor.hourlyRateMxc) : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Experience:</span>
                  <span className="font-semibold">{mentor.yearsOfExperience || 0} years</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="font-semibold">
                      {mentor.averageRating?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <span className="text-gray-600">({mentor.totalReviews} reviews)</span>
                </div>

                {mentor.responseTimeHours && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    Responds in {mentor.responseTimeHours}h
                  </div>
                )}
              </div>

              <button className="btn btn-primary w-full mt-4">View Profile</button>
            </div>
          ))}
        </div>
      )}

      {data?.content.length === 0 && (
        <div className="text-center py-12 text-gray-600">No mentors found.</div>
      )}
    </div>
  )
}
