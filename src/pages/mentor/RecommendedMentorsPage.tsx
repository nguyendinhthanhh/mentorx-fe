import { useQuery } from 'react-query'
import { fetchMentorRecommendations } from '@/api/feedApi'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/formatters'
import {
  Star, Clock, ChevronLeft, Zap, TrendingUp, Award, Loader2, AlertCircle, Users
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { MentorRecommendationResponse } from '@/types'

export default function RecommendedMentorsPage() {
  const { user } = useAuthStore()

  const { data: mentors, isLoading, error } = useQuery(
    ['recommended-mentors', user?.userId],
    () => fetchMentorRecommendations(50), // Get up to 50 recommendations
    { enabled: !!user, retry: 1 }
  )

  if (!user) {
    return (
      <div className="text-center py-24">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-300" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Login Required</h2>
        <p className="text-gray-400 mb-6">Please login to see personalized mentor recommendations</p>
        <Link to="/login" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
          Login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        to="/profile"
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Profile
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-[2.5rem] p-10 md:p-14 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-yellow-300" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-white/70">Personalized For You</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Your Perfect<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-pink-200">Mentor Matches</span>
          </h1>
          <p className="mt-4 text-white/70 max-w-md font-medium">
            These mentors are specially selected based on your interests, skills, and learning goals. All matches are 85%+ compatible with your profile.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Finding your perfect mentors...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {Boolean(error) && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900 dark:text-red-100 mb-1">
                Unable to Load Recommendations
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                We couldn't load your personalized mentor recommendations. Please try again later.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      {!isLoading && mentors && mentors.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500">
            {mentors.length} mentor{mentors.length !== 1 ? 's' : ''} matched to your profile
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <Zap className="w-4 h-4 text-green-500" />
            Sorted by match score
          </div>
        </div>
      )}

      {/* Mentor Grid */}
      {!isLoading && mentors && mentors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <MentorCard key={mentor.userId} mentor={mentor} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && mentors && mentors.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 p-16 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-gray-200 dark:text-gray-700" />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No Recommendations Yet</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
            Complete your profile and add your interests to get personalized mentor recommendations.
          </p>
          <Link
            to="/profile"
            className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
          >
            Complete Profile
          </Link>
        </div>
      )}
    </div>
  )
}

function MentorCard({ mentor }: { mentor: MentorRecommendationResponse }) {
  return (
    <div className="group bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-7 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-indigo-500/20 transition-colors" />

      {/* Match Score Badge - Prominent */}
      <div className="absolute top-4 right-4 z-10">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs font-black shadow-lg">
          <Zap className="w-3.5 h-3.5" />
          {Math.round(mentor.matchScore)}% Match
        </div>
      </div>

      <div className="flex items-start gap-4 mb-6 relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden border-3 border-white dark:border-gray-800 shadow-lg shadow-indigo-200 dark:shadow-none group-hover:scale-105 transition-transform duration-500">
          {mentor.avatarUrl ? (
            <img src={mentor.avatarUrl} alt={mentor.fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-xl font-black">
              {mentor.fullName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 pt-0.5 pr-20">
          <h3 className="text-lg font-black text-gray-900 dark:text-white truncate tracking-tight">
            {mentor.displayName || mentor.fullName}
          </h3>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1 italic">
            {mentor.headline || 'Expert Mentor'}
          </p>
          {mentor.isFeatured && (
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
              <Award className="w-2.5 h-2.5" /> Featured
            </span>
          )}
        </div>
      </div>

      {/* Matching Skills */}
      {mentor.skills && mentor.skills.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Matching Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {mentor.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold"
              >
                {skill}
              </span>
            ))}
            {mentor.skills.length > 4 && (
              <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-semibold">
                +{mentor.skills.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-indigo-500" /> Rate
          </span>
          <span className="text-sm font-black text-gray-900 dark:text-white">
            {mentor.hourlyRateMxc ? formatCurrency(mentor.hourlyRateMxc) : 'Flexible'}
            {mentor.hourlyRateMxc && <span className="text-xs font-medium text-gray-400 ml-1">/hr</span>}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Experience</span>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {mentor.yearsOfExperience || 0} yrs
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Rating
          </span>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {mentor.averageRating?.toFixed(1) || 'N/A'}
            <span className="text-xs text-gray-400 ml-1">({mentor.totalReviews})</span>
          </span>
        </div>
        {mentor.availability && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-green-500" /> Availability
            </span>
            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-lg">
              {mentor.availability}
            </span>
          </div>
        )}
      </div>

      <Link
        to={`/mentors/${mentor.userId}`}
        className="block w-full py-3.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-200 dark:group-hover:shadow-none transition-all text-center"
      >
        View Profile →
      </Link>
    </div>
  )
}
