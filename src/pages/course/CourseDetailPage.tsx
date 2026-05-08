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
} from 'lucide-react'
import ReviewList from '@/components/review/ReviewList'
import { CourseLessonResponse, ReviewTargetType } from '@/types'
import { useAuthStore } from '@/store/authStore'

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuthStore()
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
      <Link
        to="/courses"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
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
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                course.status === 'PUBLISHED'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
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
                <p className="font-semibold text-gray-900 text-sm">
                  {course.averageRating.toFixed(1)}
                </p>
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

          {/* Course Content */}
          <div className="border-t border-gray-100 pt-6 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Course content</h2>
                <p className="text-sm text-gray-500">
                  Videos and downloadable materials from this course.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600">
                {videoCount > 0 && (
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">
                    {videoCount} Video{videoCount > 1 ? 's' : ''}
                  </span>
                )}
                {documentCount > 0 && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    {documentCount} Document{documentCount > 1 ? 's' : ''}
                  </span>
                )}
                {publishedLessons.length > 0 && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                    {publishedLessons.length} Lessons
                  </span>
                )}
              </div>
            </div>

            {isSectionsLoading || isLessonsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-16 rounded-xl bg-gray-50 animate-pulse" />
                ))}
              </div>
            ) : lessonsBySection.length > 0 && publishedLessons.length > 0 ? (
              <div className="space-y-4">
                {lessonsBySection.map(({ section, lessons: sectionLessons }, index) => (
                  <div
                    key={section?.id ?? `course-lessons-${index}`}
                    className="rounded-2xl border border-gray-100 bg-gray-50/70"
                  >
                    {section && (
                      <div className="border-b border-gray-100 px-5 py-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">{section.title}</h3>
                          <span className="text-xs font-semibold text-gray-500">
                            {sectionLessons.length} lessons
                          </span>
                        </div>
                        {section.description && (
                          <p className="mt-1 text-sm text-gray-500">{section.description}</p>
                        )}
                      </div>
                    )}
                    <div className="divide-y divide-gray-100">
                      {sectionLessons.length > 0 ? (
                        sectionLessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                                {getLessonIcon(lesson)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{lesson.title}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                  <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-gray-600">
                                    {getLessonLabel(lesson)}
                                  </span>
                                  {lesson.isFreePreview && (
                                    <span className="rounded-full bg-green-50 px-2.5 py-1 font-semibold text-green-600">
                                      Preview
                                    </span>
                                  )}
                                  {lesson.durationMinutes && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-semibold text-gray-600">
                                      <Clock className="h-3.5 w-3.5" />
                                      {lesson.durationMinutes} min
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {lesson.resourceUrl && (
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
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
                                    className="rounded-full border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-60"
                                  >
                                    {previewingLessonId === lesson.id
                                      ? 'Opening...'
                                      : user
                                      ? 'Preview'
                                      : 'Login to preview'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => downloadDocument(lesson.id, `${lesson.title}.pdf`)}
                                    disabled={!canDownload || downloadingLessonId === lesson.id}
                                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                      canDownload
                                        ? 'border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                        : 'border border-gray-100 text-gray-300'
                                    }`}
                                  >
                                    {downloadingLessonId === lesson.id
                                      ? 'Preparing...'
                                      : isEnrollmentLoading && isPaidCourse
                                      ? 'Checking access...'
                                      : canDownload
                                      ? 'Download'
                                      : user
                                      ? 'Purchase to download'
                                      : 'Login to download'}
                                  </button>
                                </div>
                                {isPreviewLimited && (
                                  <span className="text-[11px] text-gray-400">
                                    Preview limited to first 2 pages.
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-5 py-4 text-sm text-gray-500">
                          No lessons available.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white px-5 py-6 text-sm text-gray-500">
                This course does not have published lessons yet.
              </div>
            )}
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
