import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { formatCurrency } from '@/utils/formatters'
import {
  BookOpen,
  Star,
  Users,
  Award,
  ArrowLeft,
  Globe,
  Play,
  FileText,
  Download,
  Clock,
  CheckCircle2,
  BarChart3,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lock,
  PlayCircle,
  Calendar,
  TrendingUp,
  MessageSquare,
} from 'lucide-react'
import ReviewList from '@/components/review/ReviewList'
import { CourseLessonResponse, ReviewTargetType } from '@/types'
import { useAuthStore } from '@/store/authStore'

type TabType = 'overview' | 'curriculum' | 'instructor' | 'reviews'

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [previewingLessonId, setPreviewingLessonId] = useState<string | null>(null)
  const [downloadingLessonId, setDownloadingLessonId] = useState<string | null>(null)

  const { data: course, isLoading } = useQuery(
    ['course', courseId],
    () => courseApi.getById(courseId!),
    { enabled: !!courseId }
  )

  const { data: isEnrolled = false, isLoading: isEnrollmentLoading } = useQuery(
    ['course-enrollment-status', courseId, user?.userId],
    () => courseApi.isEnrolled(courseId!),
    { enabled: !!courseId && !!user?.userId }
  )

  const { data: sections = [], isLoading: isSectionsLoading } = useQuery(
    ['course-sections', courseId],
    () => courseApi.getPublishedSections(courseId!),
    { enabled: !!courseId }
  )

  const { data: lessons = [], isLoading: isLessonsLoading } = useQuery(
    ['course-lessons', courseId],
    () => courseApi.getLessonsByCourse(courseId!),
    { enabled: !!courseId }
  )

  const publishedLessons = useMemo(
    () => lessons.filter((lesson) => lesson.isPublished !== false),
    [lessons]
  )

  const lessonsBySection = useMemo(() => {
    if (!sections.length) {
      return [{ section: undefined, lessons: publishedLessons }]
    }

    const grouped = new Map<string, CourseLessonResponse[]>()
    sections.forEach((section) => grouped.set(section.id, []))

    publishedLessons.forEach((lesson) => {
      const bucket = grouped.get(lesson.sectionId)
      if (bucket) {
        bucket.push(lesson)
      }
    })

    return sections.map((section) => ({
      section,
      lessons: (grouped.get(section.id) || []).sort(
        (a, b) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0)
      ),
    }))
  }, [publishedLessons, sections])

  const videoCount = publishedLessons.filter(
    (lesson) => lesson.lessonType === 'VIDEO' || !!lesson.videoUrl
  ).length
  const documentCount = publishedLessons.filter(
    (lesson) =>
      lesson.lessonType === 'DOWNLOADABLE' ||
      lesson.lessonType === 'ARTICLE' ||
      lesson.lessonType === 'TEXT' ||
      !!lesson.resourceUrl ||
      !!lesson.articleContent
  ).length

  const getLessonLabel = (lesson: CourseLessonResponse) => {
    if (lesson.lessonType === 'VIDEO' || lesson.videoUrl) return 'Video'
    if (lesson.lessonType === 'DOWNLOADABLE' || lesson.resourceUrl) return 'Document'
    if (lesson.lessonType === 'ARTICLE' || lesson.lessonType === 'TEXT' || lesson.articleContent)
      return 'Article'
    return 'Lesson'
  }

  const getLessonIcon = (lesson: CourseLessonResponse) => {
    if (lesson.lessonType === 'VIDEO' || lesson.videoUrl) {
      return <Play className="h-4 w-4 text-indigo-600" />
    }
    if (lesson.lessonType === 'DOWNLOADABLE' || lesson.resourceUrl) {
      return <Download className="h-4 w-4 text-indigo-600" />
    }
    if (lesson.lessonType === 'ARTICLE' || lesson.lessonType === 'TEXT' || lesson.articleContent) {
      return <FileText className="h-4 w-4 text-indigo-600" />
    }
    return <BookOpen className="h-4 w-4 text-indigo-600" />
  }

  const isPaidCourse = !!course?.priceMxc && course.priceMxc > 0
  const canDownload = !!user && (!isPaidCourse || isEnrolled)
  const isPreviewLimited = isPaidCourse && !isEnrolled && !isEnrollmentLoading

  const openDocumentPreview = async (lessonId: string) => {
    try {
      setPreviewingLessonId(lessonId)
      const { blob } = await courseApi.getLessonDocumentPreview(lessonId)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (error) {
      console.error('Failed to preview document', error)
    } finally {
      setPreviewingLessonId(null)
    }
  }

  const downloadDocument = async (lessonId: string, fallbackName: string) => {
    try {
      setDownloadingLessonId(lessonId)
      const { blob, fileName } = await courseApi.downloadLessonDocument(lessonId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || fallbackName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download document', error)
    } finally {
      setDownloadingLessonId(null)
    }
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const totalDuration = useMemo(() => {
    return publishedLessons.reduce((sum, lesson) => sum + (lesson.durationMinutes || 0), 0)
  }, [publishedLessons])

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-0">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
          <div className="h-72 bg-gray-100" />
          <div className="p-8">
            <div className="h-8 bg-gray-100 rounded-lg w-2/3 mb-4" />
            <div className="h-4 bg-gray-100 rounded-lg w-1/4 mb-8" />
            <div className="mb-8 grid gap-4 min-[520px]:grid-cols-2 xl:grid-cols-4">
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
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to courses
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
            {/* Left: Course Info */}
            <div className="space-y-6">
              {/* Category Badge */}
              {(course.level || course.language) && (
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium">
                  <BookOpen className="w-4 h-4" />
                  {course.level || course.language}
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                {course.title}
              </h1>

              {/* Subtitle */}
              <p className="text-base leading-relaxed text-indigo-100 sm:text-xl">
                {course.description
                  ? `${course.description.substring(0, 150)}${course.description.length > 150 ? '...' : ''}`
                  : 'Learn with practical mentor-led content and reusable resources.'}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <img
                    src={course.instructor?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor?.fullName || 'Instructor')}`}
                    alt={course.instructor?.fullName}
                    className="w-10 h-10 rounded-full border-2 border-white/20"
                  />
                  <div>
                    <p className="text-xs text-indigo-200">Created by</p>
                    <p className="font-semibold">{course.instructor?.fullName || 'Unknown'}</p>
                  </div>
                </div>

                {course.averageRating && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{course.averageRating.toFixed(1)}</span>
                    <span className="text-indigo-200">({course.totalReviews || 0} reviews)</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Users className="w-5 h-5" />
                  <span>{course.totalEnrollments?.toLocaleString() || 0} students</span>
                </div>

                {course.updatedAt && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-5 h-5" />
                    <span>Updated {new Date(course.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Key Features */}
              <div className="flex flex-wrap gap-3">
                {course.level && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm font-medium">{course.level} Level</span>
                  </div>
                )}
                {totalDuration > 0 && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">{formatDuration(totalDuration)} total</span>
                  </div>
                )}
                {publishedLessons.length > 0 && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <PlayCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{publishedLessons.length} lessons</span>
                  </div>
                )}
                {course.isCertificate && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <Award className="w-4 h-4" />
                    <span className="text-sm font-medium">Certificate included</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Preview Card */}
            <div className="hidden lg:block">
              <CoursePreviewCard
                course={course}
                isEnrolled={isEnrolled}
                isEnrollmentLoading={isEnrollmentLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 lg:hidden">
          <CoursePreviewCard
            course={course}
            isEnrolled={isEnrolled}
            isEnrollmentLoading={isEnrollmentLoading}
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100">
            <nav className="flex overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: BookOpen },
                { id: 'curriculum', label: 'Curriculum', icon: PlayCircle },
                { id: 'instructor', label: 'Instructor', icon: Users },
                { id: 'reviews', label: 'Reviews', icon: Star },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex min-w-[140px] flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition border-b-2 sm:px-6 ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-5 sm:p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* What you'll learn */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                    What you'll learn
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      'Master the fundamentals and advanced concepts',
                      'Build real-world projects from scratch',
                      'Learn industry best practices and patterns',
                      'Get hands-on experience with modern tools',
                      'Understand core principles and methodologies',
                      'Prepare for professional certification',
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {course.description || 'No description available.'}
                    </p>
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-6 h-6 text-indigo-600" />
                    Requirements
                  </h2>
                  <ul className="space-y-2">
                    {[
                      'Basic understanding of the subject matter',
                      'A computer with internet connection',
                      'Willingness to learn and practice',
                      'No prior experience required',
                    ].map((req, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* This course includes */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">This course includes:</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { icon: PlayCircle, text: `${videoCount} video lectures` },
                      { icon: FileText, text: `${documentCount} downloadable resources` },
                      { icon: Clock, text: `${formatDuration(totalDuration)} on-demand content` },
                      { icon: Globe, text: `${course.language || 'English'} language` },
                      { icon: Award, text: course.isCertificate ? 'Certificate of completion' : 'No certificate' },
                      { icon: TrendingUp, text: 'Lifetime access' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-indigo-600" />
                        <span className="text-sm text-gray-700">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Curriculum Tab */}
            {activeTab === 'curriculum' && (
              <CurriculumTab
                lessonsBySection={lessonsBySection}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                getLessonIcon={getLessonIcon}
                getLessonLabel={getLessonLabel}
                isEnrolled={isEnrolled}
                isPaidCourse={isPaidCourse}
                user={user}
                previewingLessonId={previewingLessonId}
                downloadingLessonId={downloadingLessonId}
                openDocumentPreview={openDocumentPreview}
                downloadDocument={downloadDocument}
                canDownload={canDownload}
                isPreviewLimited={isPreviewLimited}
                isEnrollmentLoading={isEnrollmentLoading}
              />
            )}

            {/* Instructor Tab */}
            {activeTab === 'instructor' && (
              <InstructorTab instructor={course.instructor} />
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <ReviewList targetType={ReviewTargetType.COURSE} targetId={course.courseId} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Price</p>
            <p className="text-2xl font-bold text-indigo-600">
              {course.priceMxc ? formatCurrency(course.priceMxc) : 'Free'}
            </p>
          </div>
          <button className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
            {isEnrolled ? 'Continue Learning' : 'Enroll Now'}
          </button>
        </div>
      </div>
    </div>
  )
}


// Course Preview Card Component
function CoursePreviewCard({ course, isEnrolled, isEnrollmentLoading }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-indigo-500 to-purple-600">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-white/30" />
          </div>
        )}
        {course.previewVideoUrl && (
          <button className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-indigo-600 ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Price */}
        <div>
          <p className="text-3xl font-bold text-gray-900">
            {course.priceMxc ? formatCurrency(course.priceMxc) : 'Free'}
          </p>
          {course.originalPriceMxc && course.originalPriceMxc > course.priceMxc && (
            <p className="text-sm text-gray-500 line-through">
              {formatCurrency(course.originalPriceMxc)}
            </p>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-2">
          {isEnrolled ? (
            <button className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Continue Learning
            </button>
          ) : (
            <>
              <button className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                Enroll Now
              </button>
              <button className="w-full border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                Add to Cart
              </button>
            </>
          )}
        </div>

        {/* Features */}
        <div className="pt-4 border-t border-gray-100 space-y-3 text-sm">
          <div className="flex items-center gap-3 text-gray-700">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <span>30-day money-back guarantee</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Clock className="w-5 h-5 text-gray-400" />
            <span>Full lifetime access</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            <span>Q&A support</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Curriculum Tab Component
function CurriculumTab({
  lessonsBySection,
  expandedSections,
  toggleSection,
  getLessonIcon,
  getLessonLabel,
  isEnrolled,
  isPaidCourse,
  user,
  previewingLessonId,
  downloadingLessonId,
  openDocumentPreview,
  downloadDocument,
  canDownload,
  isPreviewLimited,
  isEnrollmentLoading,
}: any) {
  return (
    <div className="space-y-4">
      {lessonsBySection.map(({ section, lessons: sectionLessons }: any, index: number) => {
        const sectionId = section?.id ?? `section-${index}`
        const isExpanded = expandedSections.has(sectionId)
        const sectionDuration = sectionLessons.reduce(
          (sum: number, lesson: any) => sum + (lesson.durationMinutes || 0),
          0
        )

        return (
          <div
            key={sectionId}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(sectionId)}
              className="w-full bg-gray-50 p-5 transition hover:bg-gray-100"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="min-w-0 text-left">
                    <h3 className="font-semibold text-gray-900">
                      {section?.title || `Section ${index + 1}`}
                    </h3>
                    {section?.description && (
                      <p className="mt-0.5 text-sm text-gray-500">{section.description}</p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right text-sm text-gray-500">
                  <p>{sectionLessons.length} lessons</p>
                  {sectionDuration > 0 && (
                    <p className="text-xs">
                      {Math.floor(sectionDuration / 60)}h {sectionDuration % 60}m
                    </p>
                  )}
                </div>
              </div>
            </button>

            {/* Lessons List */}
            {isExpanded && (
              <div className="divide-y divide-gray-100 bg-white">
                {sectionLessons.map((lesson: CourseLessonResponse) => {
                  const isLocked = isPaidCourse && !isEnrolled && !lesson.isFreePreview
                  
                  return (
                    <div
                      key={lesson.id}
                      className="flex flex-col gap-4 p-5 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-1 items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                          {isLocked ? (
                            <Lock className="h-5 w-5 text-gray-400" />
                          ) : (
                            getLessonIcon(lesson)
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{lesson.title}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                              {getLessonLabel(lesson)}
                            </span>
                            {lesson.isFreePreview && (
                              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
                                Free Preview
                              </span>
                            )}
                            {lesson.durationMinutes && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3.5 w-3.5" />
                                {lesson.durationMinutes} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {lesson.resourceUrl && (
                        <div className="ml-0 flex flex-wrap items-center gap-2 sm:ml-4">
                          <button
                            type="button"
                            onClick={() => {
                              if (!user) {
                                window.location.href = '/login'
                                return
                              }
                              openDocumentPreview(lesson.id)
                            }}
                            disabled={!user || previewingLessonId === lesson.id}
                            className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-60"
                          >
                            {previewingLessonId === lesson.id ? 'Opening...' : 'Preview'}
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadDocument(lesson.id, `${lesson.title}.pdf`)}
                            disabled={!canDownload || downloadingLessonId === lesson.id}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                              canDownload
                                ? 'border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                : 'border border-gray-100 text-gray-300 cursor-not-allowed'
                            }`}
                          >
                            {downloadingLessonId === lesson.id
                              ? 'Preparing...'
                              : canDownload
                              ? 'Download'
                              : 'Locked'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Instructor Tab Component
function InstructorTab({ instructor }: any) {
  if (!instructor) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Instructor information not available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Instructor Profile */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <img
          src={instructor.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.fullName || 'Instructor')}`}
          alt={instructor.fullName}
          className="w-24 h-24 rounded-full border-4 border-gray-100"
        />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{instructor.fullName}</h2>
          <p className="text-gray-600 mb-4">{instructor.headline || 'Professional Instructor'}</p>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-medium">4.8 Instructor Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="font-medium">12,450 Students</span>
            </div>
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-gray-400" />
              <span className="font-medium">15 Courses</span>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">About the Instructor</h3>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {instructor.bio || 'This instructor has not provided a bio yet.'}
          </p>
        </div>
      </div>

      {/* Expertise */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Expertise</h3>
        <div className="flex flex-wrap gap-2">
          {['Web Development', 'JavaScript', 'React', 'Node.js', 'TypeScript'].map((skill) => (
            <span
              key={skill}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
