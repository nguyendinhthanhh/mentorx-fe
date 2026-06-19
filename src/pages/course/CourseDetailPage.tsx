import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { mentorApi } from '@/api/mentorApi'
import { categoryApi } from '@/api/categoryApi'
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
  ChevronDown,
  ChevronUp,
  Lock,
  PlayCircle,
  Calendar,
  TrendingUp,
  Tag,
  Wallet,
  X,
} from 'lucide-react'
import ReviewList from '@/components/review/ReviewList'
import { CategoryResponse, CourseLessonResponse, CourseProductType, CourseResponse, CourseStatus, MentorProfileResponse, ReviewTargetType } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { categoryLabel } from '@/utils/freeFormTaxonomy'

type TabType = 'overview' | 'curriculum' | 'instructor' | 'reviews'

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [previewingLessonId, setPreviewingLessonId] = useState<string | null>(null)
  const [downloadingLessonId, setDownloadingLessonId] = useState<string | null>(null)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [showAddCoinsPrompt, setShowAddCoinsPrompt] = useState(false)

  const { data: course, isLoading } = useQuery(
    ['course', courseId],
    () => courseApi.getById(courseId!),
    { enabled: !!courseId }
  )
  const { data: courseStats } = useQuery(
    ['course-stats', courseId],
    () => courseApi.getCourseStats(courseId!),
    { enabled: !!courseId }
  )

  const { data: instructorProfile = null } = useQuery(
    ['course-instructor-profile', course?.instructorId],
    () => mentorApi.getMentorProfile(course!.instructorId).catch(() => null),
    { enabled: !!course?.instructorId }
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

  const enrollMutation = useMutation(
    () => courseApi.enrollCurrentUser(courseId!),
    {
      onSuccess: () => {
        setEnrollError(null)
        queryClient.invalidateQueries(['course-enrollment-status', courseId, user?.userId])
        queryClient.invalidateQueries(['my-enrollments', user?.userId])
        queryClient.invalidateQueries(['course', courseId])
        queryClient.invalidateQueries(['userBalance', user?.userId])
        navigate(`/courses/${courseId}/learn`)
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || error?.message || 'Could not complete enrollment.'
        const normalizedMessage = message.toLowerCase()
        if (normalizedMessage.includes('not enough mxc') || normalizedMessage.includes('insufficient balance')) {
          setEnrollError(null)
          setShowAddCoinsPrompt(true)
          return
        }
        setEnrollError(message)
      },
    }
  )

  const publishedLessons = useMemo(
    () => lessons.filter((lesson) => lesson.isPublished !== false),
    [lessons]
  )
  const { data: categories = [] } = useQuery('course-detail-categories', categoryApi.getAllActive, {
    staleTime: 5 * 60 * 1000,
  })
  const firstFreePreviewLesson = useMemo(
    () => publishedLessons.find((lesson) => lesson.isFreePreview),
    [publishedLessons]
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

  const videoCount = publishedLessons.filter((lesson) => !!lesson.videoUrl).length
  const documentCount = publishedLessons.filter(
    (lesson) => !!lesson.resourceUrl || !!lesson.articleContent
  ).length

  const getLessonLabel = (lesson: CourseLessonResponse) => {
    if (lesson.lessonType === 'QUIZ') return 'Quiz'
    if (lesson.videoUrl) return 'Video'
    if (lesson.resourceUrl) return 'Document'
    if (lesson.articleContent) return 'Article'
    return 'Lesson'
  }

  const getLessonIcon = (lesson: CourseLessonResponse) => {
    if (lesson.videoUrl) {
      return <Play className="h-4 w-4 text-indigo-600" />
    }
    if (lesson.resourceUrl) {
      return <Download className="h-4 w-4 text-indigo-600" />
    }
    if (lesson.articleContent) {
      return <FileText className="h-4 w-4 text-indigo-600" />
    }
    return <BookOpen className="h-4 w-4 text-indigo-600" />
  }

  const isDocumentProduct = course?.productType === CourseProductType.DOCUMENT
  const isPublished = course?.status === CourseStatus.PUBLISHED
  const displayPrice = course?.effectivePriceMxc ?? course?.priceMxc ?? 0
  const isPaidCourse = displayPrice > 0
  const canDownload = !!user && (!isPaidCourse || isEnrolled)
  const isPreviewLimited = isPaidCourse && !isEnrolled && !isEnrollmentLoading
  const domainName = useMemo(() => {
    if (!course?.categoryId) return ''
    return categories.find((category: CategoryResponse) => category.id === course.categoryId)
      ? categoryLabel(categories.find((category: CategoryResponse) => category.id === course.categoryId)!)
      : ''
  }, [categories, course?.categoryId])

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

  const requirements = useMemo(
    () => buildRequirements(course),
    [course]
  )

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const handleEnroll = () => {
    if (!isPublished) {
      return
    }
    if (!user) {
      navigate('/login')
      return
    }
    if (isEnrolled) {
      navigate(`/courses/${courseId}/learn`)
      return
    }
    setEnrollError(null)
    setShowAddCoinsPrompt(false)
    enrollMutation.mutate()
  }

  const handlePreview = () => {
    if (!courseId || !firstFreePreviewLesson) return
    navigate(lessonPath(courseId, firstFreePreviewLesson))
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Resource not found</h2>
        <p className="text-gray-500 mb-4">This resource may have been removed or doesn't exist.</p>
        <Link to="/courses" className="text-primary-600 font-medium hover:text-primary-700">
          ← Back to courses
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {showAddCoinsPrompt && (
        <AddCoinsPrompt
          onClose={() => setShowAddCoinsPrompt(false)}
        />
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to marketplace
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div
        className={`relative overflow-hidden text-white ${course.thumbnailUrl ? 'bg-slate-950' : 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800'}`}
        style={course.thumbnailUrl ? { backgroundImage: `url(${course.thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {course.thumbnailUrl && <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]" />}
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
            {/* Left: Product Info */}
            <div className="space-y-6">
              {/* Category Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium">
                {isDocumentProduct ? <FileText className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                {domainName || (isDocumentProduct ? 'Document resource' : course.level || course.language || 'Course')}
              </div>
              {isDocumentProduct && (
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-4 py-1.5 text-sm font-black text-amber-100 backdrop-blur-sm">
                  <Download className="h-4 w-4" />
                  Standalone download
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
                  : isDocumentProduct ? 'Download a practical mentor-created document resource.' : 'Learn with practical mentor-led content and reusable resources.'}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <Link to={`/mentors/${course.instructorId}`} className="flex items-center gap-2 rounded-xl transition hover:bg-white/10">
                  <img
                    src={getInstructorAvatar(course, instructorProfile)}
                    alt={getInstructorName(course, instructorProfile)}
                    className="w-10 h-10 rounded-full border-2 border-white/20"
                  />
                  <div>
                    <p className="text-xs text-indigo-200">Created by</p>
                    <p className="font-semibold">{getInstructorName(course, instructorProfile)}</p>
                    {getInstructorHeadline(instructorProfile) && (
                      <p className="text-xs text-indigo-100">{getInstructorHeadline(instructorProfile)}</p>
                    )}
                  </div>
                </Link>

                {course.averageRating && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{course.averageRating.toFixed(1)}</span>
                    <span className="text-indigo-200">({course.totalReviews || 0} reviews)</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Users className="w-5 h-5" />
                    <span>{course.totalEnrollments?.toLocaleString() || 0} learners</span>
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
                {domainName && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <Tag className="w-4 h-4" />
                    <span className="text-sm font-medium">{domainName}</span>
                  </div>
                )}
                {(course.skills || []).slice(0, 4).map((skill) => (
                  <div key={skill} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <span className="text-sm font-medium">{skill}</span>
                  </div>
                ))}
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
                    {isDocumentProduct ? <FileText className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                    <span className="text-sm font-medium">{isDocumentProduct ? '1 downloadable file' : `${publishedLessons.length} lessons`}</span>
                  </div>
                )}
                {!isDocumentProduct && course.isCertificate && (
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
                isEnrolling={enrollMutation.isLoading}
                isPublished={isPublished}
                totalDuration={totalDuration}
                lessonCount={publishedLessons.length}
                instructorName={getInstructorName(course, instructorProfile)}
                previewLesson={firstFreePreviewLesson}
                enrollError={enrollError}
                onEnroll={handleEnroll}
                onPreview={handlePreview}
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
            isEnrolling={enrollMutation.isLoading}
            isPublished={isPublished}
            totalDuration={totalDuration}
            lessonCount={publishedLessons.length}
            instructorName={getInstructorName(course, instructorProfile)}
            previewLesson={firstFreePreviewLesson}
            enrollError={enrollError}
            onEnroll={handleEnroll}
            onPreview={handlePreview}
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100">
            <nav className="flex overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: BookOpen },
                { id: 'curriculum', label: isDocumentProduct ? 'Document' : 'Curriculum', icon: isDocumentProduct ? FileText : PlayCircle },
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
                <CourseTaxonomyPanel domainName={domainName} skills={course.skills || []} />

                {/* Requirements */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-6 h-6 text-indigo-600" />
                    Requirements
                  </h2>
                  <ul className="space-y-2">
                    {requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* This course includes */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">This {isDocumentProduct ? 'document' : 'course'} includes:</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { icon: isDocumentProduct ? FileText : PlayCircle, text: isDocumentProduct ? 'Downloadable document' : `${publishedLessons.length} published lessons` },
                      { icon: PlayCircle, text: isDocumentProduct ? 'Mentor-created resource' : `${videoCount} video lessons` },
                      { icon: FileText, text: isDocumentProduct ? `${documentCount || 1} document file` : `${documentCount} resource or article lessons` },
                      { icon: Clock, text: totalDuration > 0 ? `${formatDuration(totalDuration)} content` : 'Self-paced content' },
                      { icon: Globe, text: `${formatLanguage(course.language)} language` },
                      ...(domainName ? [{ icon: Tag, text: `${domainName} domain` }] : []),
                      ...(course.skills?.length ? [{ icon: Tag, text: `${course.skills.slice(0, 3).join(', ')} skills` }] : []),
                      { icon: Award, text: isDocumentProduct ? 'No certificate' : course.isCertificate ? 'Certificate of completion' : 'No certificate' },
                      { icon: TrendingUp, text: course.level ? `${course.level} level` : 'Open level' },
                      { icon: TrendingUp, text: `${Math.round(courseStats?.completionRate || 0)}% completion rate` },
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
                courseId={courseId}
              />
            )}

            {/* Instructor Tab */}
            {activeTab === 'instructor' && (
              <InstructorTab instructor={course.instructor} mentorProfile={instructorProfile} course={course} />
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
              {displayPrice ? formatCurrency(displayPrice) : 'Free'}
            </p>
          </div>
          <button
            onClick={handleEnroll}
            disabled={enrollMutation.isLoading || (!isPublished && !isEnrolled)}
            className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-300"
          >
            {!isPublished && !isEnrolled ? 'Archived' : enrollMutation.isLoading ? 'Enrolling...' : isEnrolled ? (isDocumentProduct ? 'Open Document' : 'Continue Learning') : (isDocumentProduct ? 'Get Document' : 'Enroll Now')}
          </button>
        </div>
      </div>
    </div>
  )
}

function buildRequirements(course: CourseResponse | undefined) {
  const requirements: string[] = []
  if (course?.level) {
    requirements.push(`Recommended level: ${course.level}`)
  }
  if (course?.language) {
    requirements.push(`Course language: ${formatLanguage(course.language)}`)
  }
  if (course?.skills?.length) {
    requirements.push(`Interest in ${course.skills.slice(0, 3).join(', ')}`)
  }
  requirements.push('Access to a browser and internet connection')
  return requirements
}

function formatLanguage(language?: string) {
  if (!language) return 'English'
  const labels: Record<string, string> = {
    en: 'English',
    vi: 'Vietnamese',
    zh: 'Chinese',
    ja: 'Japanese',
  }
  return labels[language] || language.toUpperCase()
}

function formatDurationText(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

function CourseTaxonomyPanel({ domainName, skills }: { domainName?: string; skills: string[] }) {
  if (!domainName && skills.length === 0) return null
  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-5">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
        <Tag className="h-5 w-5 text-indigo-600" />
        Domain and skills
      </h2>
      <div className="flex flex-wrap gap-2">
        {domainName && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-700">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            {domainName}
          </span>
        )}
        {skills.map((skill) => (
          <span key={skill} className="rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-bold text-white">
            {skill}
          </span>
        ))}
      </div>
    </div>
  )
}

function lessonPath(courseId: string, lesson: CourseLessonResponse) {
  return `/courses/${courseId}/learn/sections/${lesson.sectionId}/lessons/${lesson.id}`
}

function getInstructorName(course: CourseResponse, mentorProfile?: MentorProfileResponse | null) {
  return mentorProfile?.user?.fullName || course.instructor?.fullName || course.instructorName || 'Instructor'
}

function getInstructorAvatar(course: CourseResponse, mentorProfile?: MentorProfileResponse | null) {
  const name = getInstructorName(course, mentorProfile)
  return mentorProfile?.user?.avatarUrl || course.instructor?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
}

function getInstructorHeadline(mentorProfile?: MentorProfileResponse | null) {
  return mentorProfile?.headline || mentorProfile?.currentTitle || mentorProfile?.primaryDomain || ''
}

function getInstructorBio(instructor: any, mentorProfile?: MentorProfileResponse | null) {
  return mentorProfile?.professionalBio || mentorProfile?.user?.bio || instructor?.bio || 'This instructor has not provided a bio yet.'
}

function AddCoinsPrompt({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add more MXC</h2>
              <p className="mt-1 text-sm text-slate-600">
                You do not have enough MXC to buy this resource.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/wallet"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Wallet className="h-4 w-4" />
            Go to wallet
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}

// Course Preview Card Component
function CoursePreviewCard({ course, isEnrolled, isEnrollmentLoading, isEnrolling, isPublished = true, totalDuration = 0, lessonCount = 0, instructorName, previewLesson, enrollError, onEnroll, onPreview }: any) {
  const isDocumentProduct = course.productType === CourseProductType.DOCUMENT
  const displayPrice = course.effectivePriceMxc ?? course.priceMxc ?? 0
  const isPaid = displayPrice > 0
  const actionLabel = isPaid
    ? isDocumentProduct
      ? `Pay ${formatCurrency(displayPrice)} and get document`
      : `Pay ${formatCurrency(displayPrice)} and enroll`
    : isDocumentProduct
      ? 'Get Document'
      : 'Enroll Now'

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-lg ${isDocumentProduct ? 'border-amber-200' : 'border-gray-200'}`}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-indigo-500 to-purple-600">
        {course.previewVideoUrl ? (
          <video
            src={course.previewVideoUrl}
            poster={course.thumbnailUrl || undefined}
            controls
            preload="metadata"
            className="h-full w-full bg-black object-cover"
          />
        ) : course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isDocumentProduct ? (
              <FileText className="w-16 h-16 text-white/40" />
            ) : (
              <BookOpen className="w-16 h-16 text-white/30" />
            )}
          </div>
        )}
        {isDocumentProduct && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-950">
            <Download className="h-3.5 w-3.5" />
            Document
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Price */}
        <div>
          <p className="text-3xl font-bold text-gray-900">
            {displayPrice ? formatCurrency(displayPrice) : 'Free'}
          </p>
          {course.activeDiscount && displayPrice < (course.priceMxc || 0) && (
            <p className="text-sm font-bold text-gray-400 line-through">{formatCurrency(course.priceMxc)}</p>
          )}
          <p className="mt-1 text-sm font-medium text-gray-500">{isDocumentProduct ? 'Document by' : 'Course by'} {instructorName}</p>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-2">
          {isEnrolled ? (
            <button onClick={onEnroll} className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {isDocumentProduct ? 'Open Document' : 'Continue Learning'}
            </button>
          ) : (
            <>
              {previewLesson && (
                <button
                  type="button"
                  onClick={onPreview}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 px-6 py-3 font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
                >
                  <PlayCircle className="h-5 w-5" />
                  Preview course
                </button>
              )}
              <button
                onClick={onEnroll}
                disabled={isEnrollmentLoading || isEnrolling || (!isPublished && !isEnrolled)}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-300"
              >
                {!isPublished && !isEnrolled ? 'Archived' : isEnrolling ? (isPaid ? 'Processing...' : 'Enrolling...') : actionLabel}
              </button>
              {enrollError && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {enrollError}
                </p>
              )}
            </>
          )}
        </div>

        {/* Features */}
        <div className="pt-4 border-t border-gray-100 space-y-3 text-sm">
          <div className="flex items-center gap-3 text-gray-700">
            {isDocumentProduct ? <FileText className="w-5 h-5 text-amber-500" /> : <PlayCircle className="w-5 h-5 text-gray-400" />}
            <span>{isDocumentProduct ? 'Downloadable document' : `${lessonCount} published lessons`}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            {isDocumentProduct ? <Download className="w-5 h-5 text-amber-500" /> : <Clock className="w-5 h-5 text-gray-400" />}
            <span>{isDocumentProduct ? 'Instant access after enrollment' : totalDuration > 0 ? `${formatDurationText(totalDuration)} content` : 'Self-paced content'}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Award className="w-5 h-5 text-gray-400" />
            <span>{isDocumentProduct ? 'Certificate not applicable' : course.isCertificate ? 'Certificate included' : 'Certificate not included'}</span>
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
  courseId,
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
                  const canOpenLearning = !!courseId && (isEnrolled || lesson.isFreePreview)
                  
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        if (canOpenLearning) window.location.href = lessonPath(courseId, lesson)
                      }}
                      className={`flex flex-col gap-4 p-5 transition sm:flex-row sm:items-center sm:justify-between ${
                        canOpenLearning ? 'cursor-pointer hover:bg-gray-50' : 'opacity-80'
                      }`}
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
                      {canOpenLearning && (
                        <div className="ml-0 flex flex-wrap items-center gap-2 sm:ml-4">
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = lessonPath(courseId, lesson)
                            }}
                            disabled={previewingLessonId === lesson.id}
                            className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-60"
                          >
                            {previewingLessonId === lesson.id ? 'Opening...' : lesson.isFreePreview && !isEnrolled ? 'Preview' : 'Open'}
                          </button>
                          {lesson.resourceUrl && isEnrolled && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                downloadDocument(lesson.id, `${lesson.title}.pdf`)
                              }}
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
                          )}
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
function InstructorTab({ instructor, mentorProfile, course }: { instructor: any; mentorProfile?: MentorProfileResponse | null; course: CourseResponse }) {
  if (!instructor && !mentorProfile) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Instructor information not available</p>
      </div>
    )
  }

  const instructorName = getInstructorName(course, mentorProfile)
  const instructorAvatar = getInstructorAvatar(course, mentorProfile)
  const headline = getInstructorHeadline(mentorProfile) || instructor?.displayName || instructor?.email || 'Course instructor'
  const bio = getInstructorBio(instructor, mentorProfile)
  const mentorSkills = mentorProfile?.skills?.length ? mentorProfile.skills : course.skills

  return (
    <div className="space-y-6">
      {/* Instructor Profile */}
      <Link
        to={`/mentors/${course.instructorId}`}
        className="flex flex-col gap-6 rounded-2xl border border-gray-100 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40 sm:flex-row sm:items-start"
      >
        <img
          src={instructorAvatar}
          alt={instructorName}
          className="w-24 h-24 rounded-full border-4 border-gray-100"
        />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{instructorName}</h2>
          <p className="text-gray-600 mb-4">{headline}</p>
          
          <div className="flex flex-wrap gap-4 text-sm">
            {course.averageRating != null && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-medium">{Number(course.averageRating).toFixed(1)} course rating</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{course.totalEnrollments || 0} enrolled learners</span>
            </div>
            {course.totalLessons != null && (
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{course.totalLessons} lessons in this course</span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* About */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">About the Instructor</h3>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {bio}
          </p>
        </div>
      </div>

      {(mentorSkills?.length || 0) > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{mentorProfile?.skills?.length ? 'Mentor skills' : 'Course skills'}</h3>
          <div className="flex flex-wrap gap-2">
            {mentorSkills?.map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
