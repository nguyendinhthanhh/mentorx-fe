import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { formatCurrency } from '@/utils/formatters'
import { BookOpen, Star, Users, Award, ArrowLeft, Globe, Play, MessageSquare } from 'lucide-react'
import ReviewList from '@/components/review/ReviewList'
import { ReviewTargetType } from '@/types'

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  
  const { data: course, isLoading } = useQuery(
    ['course', courseId],
    () => courseApi.getById(courseId!),
    { enabled: !!courseId }
  )

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
          <div className="h-72 bg-gray-100" />
          <div className="p-8">
            <div className="h-8 bg-gray-100 rounded-lg w-2/3 mb-4" />
            <div className="h-4 bg-gray-100 rounded-lg w-1/4 mb-8" />
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-50 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-gray-300" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Course not found</h2>
        <p className="text-gray-500 mb-4">This course may have been removed or doesn't exist.</p>
        <Link to="/courses" className="text-primary-600 font-medium hover:text-primary-700">
          ← Back to courses
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to courses
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Hero Image */}
        <div className="relative h-72 bg-gradient-to-br from-primary-500 to-primary-700 overflow-hidden">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-20 h-20 text-white/30" />
            </div>
          )}
          {course.previewVideoUrl && (
            <button className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-6 h-6 text-primary-600 ml-1" />
              </div>
            </button>
          )}
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-500">By {course.instructor?.fullName || 'Unknown'}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              course.status === 'PUBLISHED' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
              {course.status}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <BookOpen className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500 mb-0.5">Level</p>
              <p className="font-semibold text-gray-900 text-sm">{course.level || 'All'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500 mb-0.5">Enrolled</p>
              <p className="font-semibold text-gray-900 text-sm">{course.totalEnrollments}</p>
            </div>
            {course.averageRating && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500 mb-0.5">Rating</p>
                <p className="font-semibold text-gray-900 text-sm">{course.averageRating.toFixed(1)}</p>
              </div>
            )}
            {course.language && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Globe className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500 mb-0.5">Language</p>
                <p className="font-semibold text-gray-900 text-sm">{course.language}</p>
              </div>
            )}
            {course.isCertificate && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Award className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-xs text-gray-500 mb-0.5">Certificate</p>
                <p className="font-semibold text-gray-900 text-sm">Included</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="border-t border-gray-100 pt-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About this course</h2>
            <div className="text-gray-600 whitespace-pre-wrap leading-relaxed">
              {course.description || 'No description available.'}
            </div>
          </div>

          {/* Reviews */}
          <div className="border-t border-gray-100 pt-8 mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              Student Reviews
            </h2>
            <ReviewList targetType={ReviewTargetType.COURSE} targetId={course.courseId} />
          </div>

          {/* Enroll CTA */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Price</p>
              <p className="text-3xl font-bold text-primary-600">
                {course.priceMxc ? formatCurrency(course.priceMxc) : 'Free'}
              </p>
            </div>
            <button className="bg-primary-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors text-sm">
              Enroll Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
