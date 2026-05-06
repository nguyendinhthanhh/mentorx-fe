import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { mentorApi } from '@/api/mentorApi'
import { formatCurrency } from '@/utils/formatters'
import { Star, Clock, Award, TrendingUp, CheckCircle, Globe, Mail, MessageSquare, Briefcase } from 'lucide-react'
import ReviewList from '@/components/review/ReviewList'
import { ReviewTargetType } from '@/types'

export default function MentorPublicProfilePage() {
  const { userId } = useParams<{ userId: string }>()

  const { data: mentor, isLoading } = useQuery(['mentor', userId], () =>
    mentorApi.getMentorProfile(userId!)
  )

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="h-48 bg-gray-100 rounded-3xl mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-32 bg-gray-50 rounded-2xl" />
            <div className="h-64 bg-gray-50 rounded-2xl" />
          </div>
          <div className="h-96 bg-gray-50 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!mentor) return <div className="text-center py-20">Mentor not found</div>

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg flex-shrink-0 overflow-hidden">
            {mentor.user?.avatarUrl ? (
              <img src={mentor.user.avatarUrl} alt={mentor.user.fullName} className="w-full h-full object-cover" />
            ) : (
              mentor.user?.fullName.charAt(0).toUpperCase()
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{mentor.user?.fullName}</h1>
              {mentor.isFeatured && (
                <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3 h-3" /> Featured
                </span>
              )}
            </div>
            <p className="text-lg text-gray-500 font-medium mb-4">{mentor.headline}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-bold">{mentor.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="text-gray-400">({mentor.totalReviews} reviews)</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">{mentor.yearsOfExperience || 0} years exp</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">{mentor.user?.preferredLanguage || 'EN'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button className="bg-primary-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-md shadow-primary-200 flex items-center justify-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Book a Session
            </button>
            <button className="bg-white border border-gray-200 text-gray-700 px-8 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
              <Mail className="w-5 h-5 text-gray-400" />
              Contact
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About Me</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {mentor.user?.bio || "No biography provided yet."}
            </p>
          </section>

          {/* Reviews */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 px-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              Mentor Reviews
            </h2>
            <ReviewList targetType={ReviewTargetType.MENTOR} targetId={mentor.userId} />
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Service Info</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Hourly Rate</span>
                <span className="text-xl font-bold text-primary-600">
                  {mentor.hourlyRateMxc ? `${formatCurrency(mentor.hourlyRateMxc)}/hr` : 'Flexible'}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Availability
                </span>
                <span className="text-sm font-semibold text-gray-900">{mentor.availability}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> Response Time
                </span>
                <span className="text-sm font-semibold text-gray-900">~{mentor.responseTimeHours}h</span>
              </div>
            </div>
          </div>

          <div className="bg-primary-600 rounded-3xl p-6 text-white shadow-lg shadow-primary-100">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-200" />
              Verified Expert
            </h3>
            <p className="text-sm text-primary-100 leading-relaxed">
              This mentor has been verified by our moderation team for their skills and professional experience.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-primary-200">
              <CheckCircle className="w-4 h-4" />
              ID & IDENTITY VERIFIED
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
