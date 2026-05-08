import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Heart,
  Loader2,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
  Zap,
  AlertCircle,
} from 'lucide-react'
import { fetchPersonalizedFeed } from '@/api/dashboardApi'
import type {
  MentorRecommendationResponse,
  CourseRecommendationResponse,
  KnowledgeRecommendationResponse,
  JobRecommendationResponse,
} from '@/types'

export default function DiscoveryFeedPage() {
  const { user } = useAuthStore()
  const [mentorSlideIndex, setMentorSlideIndex] = useState(0)
  
  // State for API data
  const [mentors, setMentors] = useState<MentorRecommendationResponse[]>([])
  const [courses, setCourses] = useState<CourseRecommendationResponse[]>([])
  const [knowledge, setKnowledge] = useState<KnowledgeRecommendationResponse[]>([])
  const [jobs, setJobs] = useState<JobRecommendationResponse[]>([])
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch personalized feed on component mount
  useEffect(() => {
    const loadFeed = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const feed = await fetchPersonalizedFeed()
        setMentors(feed.mentors || [])
        setCourses(feed.courses || [])
        setKnowledge(feed.knowledge || [])
        setJobs(feed.jobs || [])
      } catch (err) {
        console.error('Failed to load personalized feed:', err)
        setError('Unable to load personalized recommendations. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadFeed()
    }
  }, [user])

  if (!user) return null

  const visibleMentors = 3
  const maxSlideIndex = Math.max(0, mentors.length - visibleMentors)

  const nextMentorSlide = () => {
    setMentorSlideIndex((prev) => Math.min(prev + 1, maxSlideIndex))
  }

  const prevMentorSlide = () => {
    setMentorSlideIndex((prev) => Math.max(prev - 1, 0))
  }

  return (
    <div className="space-y-8">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your personalized feed...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900 dark:text-red-100 mb-1">
                Unable to Load Feed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content - Only show when not loading */}
      {!isLoading && (
        <>
          {/* Welcome Section */}
          <div className="bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black mb-2">
                  Discover Your Path, {user.displayName || user.fullName?.split(' ')[0]}! 🚀
                </h1>
                <p className="text-white/80 text-lg">
                  Personalized recommendations based on your interests and goals
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <TrendingUp className="w-16 h-16" />
                </div>
              </div>
            </div>
          </div>

      {/* Recommended Mentors Slider */}
      {mentors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                Top Mentors For You
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Matched based on your interests and skill level
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/mentors/recommended"
                className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMentorSlide}
                  disabled={mentorSlideIndex === 0}
                  className="p-2 rounded-xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextMentorSlide}
                  disabled={mentorSlideIndex >= maxSlideIndex}
                  className="p-2 rounded-xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden">
            <div
              className="flex gap-6 transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${mentorSlideIndex * (100 / visibleMentors + 2)}%)` }}
            >
              {mentors.map((mentor) => (
                <div
                  key={mentor.mentorId}
                  className="flex-shrink-0 w-[calc(33.333%-16px)] bg-white dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:border-primary-300 dark:hover:border-primary-700 transition-all group"
                >
                  {/* Match Score Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 text-xs font-black">
                      <Zap className="w-3 h-3" />
                      {Math.round(mentor.matchScore)}% Match
                    </div>
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <Heart className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-4">
                    {mentor.avatarUrl ? (
                      <img
                        src={mentor.avatarUrl}
                        alt={mentor.fullName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
                        {mentor.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-gray-900 dark:text-white truncate">
                        {mentor.displayName || mentor.fullName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {mentor.headline || 'Mentor'}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-gray-900 dark:text-white">
                        {mentor.averageRating?.toFixed(1) || 'N/A'}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        ({mentor.totalReviews})
                      </span>
                    </div>
                    {mentor.hourlyRateMxc && (
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-bold">{mentor.hourlyRateMxc} MXC/hr</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mentor.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Availability */}
                  {mentor.availability && (
                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-semibold mb-4">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      {mentor.availability}
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    to={`/mentors/${mentor.userId}`}
                    className="block w-full py-2.5 text-center rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-all group-hover:scale-105"
                  >
                    View Profile
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Newsfeed */}
      {knowledge.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                Knowledge Feed
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Articles and insights tailored to your learning path
              </p>
            </div>
            <Link
              to="/feed"
              className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {knowledge.slice(0, 3).map((post) => (
              <div
                key={post.id}
                className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 transition-all group cursor-pointer"
              >
                {/* Thumbnail */}
                {post.thumbnailUrl ? (
                  <img
                    src={post.thumbnailUrl}
                    alt={post.title}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="h-48 bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900/20 dark:to-indigo-900/20 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-primary-400" />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Match Score */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 text-xs font-black">
                      <Zap className="w-3 h-3" />
                      {Math.round(post.matchScore)}% Match
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {post.readTimeMinutes} min read
                    </span>
                    {post.skillLevel && (
                      <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold">
                        {post.skillLevel}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-black text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Author & Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      {post.authorAvatarUrl ? (
                        <img
                          src={post.authorAvatarUrl}
                          alt={post.authorName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                          {post.authorName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                          {post.authorName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likesCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {post.commentsCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Courses */}
      {courses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                Courses You'll Love
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Best-selling courses matched to your skill level
              </p>
            </div>
            <Link
              to="/courses"
              className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              Browse All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 3).map((course) => (
              <Link
                key={course.courseId}
                to={`/courses/${course.courseId}`}
                className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 transition-all group"
              >
                {/* Thumbnail */}
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-indigo-400" />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Match Score & Level */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 text-xs font-black">
                      <Zap className="w-3 h-3" />
                      {Math.round(course.matchScore)}% Match
                    </div>
                    {course.level && (
                      <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold">
                        {course.level}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-black text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {course.title}
                  </h3>

                  {/* Instructor */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    by {course.instructorName}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    {course.averageRating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-gray-900 dark:text-white">
                          {course.averageRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{course.totalEnrollments.toLocaleString()}</span>
                    </div>
                    {course.totalDurationMinutes && (
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{Math.round(course.totalDurationMinutes / 60)}h</span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                    {course.priceMxc ? (
                      <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
                        {course.priceMxc} MXC
                      </span>
                    ) : (
                      <span className="text-2xl font-black text-green-600 dark:text-green-400">
                        Free
                      </span>
                    )}
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                      Enroll Now →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Support Jobs */}
      {jobs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                Quick Support Requests
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Help others and earn while learning
              </p>
            </div>
            <Link
              to="/jobs"
              className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              View All Jobs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {jobs.slice(0, 3).map((job) => (
              <Link
                key={job.jobId}
                to={`/jobs/${job.jobId}`}
                className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:border-primary-300 dark:hover:border-primary-700 transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <span className="px-2 py-1 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 text-xs font-bold">
                        {job.budgetType === 'FIXED'
                          ? `${job.budgetMinMxc || 0} MXC`
                          : `${job.hourlyRateMxc || 0} MXC/hr`}
                      </span>
                    </div>
                  </div>
                  {job.deadlineAt && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(job.deadlineAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Match Score */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 text-xs font-black">
                    <Zap className="w-3 h-3" />
                    {Math.round(job.matchScore)}% Match
                  </div>
                  {job.isFeatured && (
                    <span className="px-2 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 text-xs font-bold">
                      Featured
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-black text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {job.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {job.description}
                </p>

                {/* Category */}
                {job.categoryName && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {job.categoryName}
                    </span>
                  </div>
                )}

                {/* Applicants */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {job.proposalCount} applicants
                  </span>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    Apply Now →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
