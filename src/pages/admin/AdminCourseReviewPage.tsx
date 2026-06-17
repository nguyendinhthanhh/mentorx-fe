import { ReactNode, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import { courseApi } from '@/api/courseApi'
import CourseNameConfirmModal from '@/components/course/CourseNameConfirmModal'
import { CourseProductType, CourseStatus, LessonType } from '@/types'
import { Archive, ArrowLeft, BookOpen, Download, FileText, Loader2, PlayCircle, Star, Users } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

export default function AdminCourseReviewPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)

  const { data: course, isLoading: courseLoading } = useQuery(
    ['admin-course-review', courseId],
    () => courseApi.getById(courseId!),
    { enabled: !!courseId }
  )
  const { data: sections = [] } = useQuery(
    ['admin-course-review-sections', courseId],
    () => courseApi.getSections(courseId!),
    { enabled: !!courseId }
  )
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery(
    ['admin-course-review-lessons', courseId],
    () => courseApi.getLessonsByCourse(courseId!),
    { enabled: !!courseId }
  )

  const archiveCourse = useMutation(() => courseApi.archive(courseId!), {
    onSuccess: () => {
      queryClient.invalidateQueries('admin-courses')
      queryClient.invalidateQueries(['admin-course-review', courseId])
      toast.success('Course archived')
      setArchiveConfirmOpen(false)
    },
  })

  const groupedSections = useMemo(() => {
    return sections.map((section) => ({
      section,
      lessons: lessons
        .filter((lesson) => lesson.sectionId === section.id)
        .sort((a, b) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0)),
    }))
  }, [lessons, sections])

  if (courseLoading || lessonsLoading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-bold text-slate-500">Loading product material...</div>
  }

  if (!course) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-bold text-slate-600">Product not found.</p>
        <Link to="/admin/courses" className="mt-4 inline-flex text-sm font-black text-indigo-600">Back to courses</Link>
      </div>
    )
  }

  const isDocument = course.productType === CourseProductType.DOCUMENT
  const effectivePrice = course.effectivePriceMxc ?? course.priceMxc ?? 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <button onClick={() => navigate('/admin/courses')} className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Back to courses
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">{course.title}</h1>
            <span className={`rounded-xl px-3 py-1 text-xs font-black uppercase ${course.status === CourseStatus.PUBLISHED ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {course.status}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {isDocument ? 'Document' : 'Course'} by {course.instructorName || course.instructor?.fullName || 'Instructor'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/courses/${course.courseId}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
            View public page
          </Link>
          {course.status === CourseStatus.PUBLISHED && (
            <button
              onClick={() => setArchiveConfirmOpen(true)}
              disabled={archiveCourse.isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {archiveCourse.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
              Archive
            </button>
          )}
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="aspect-video bg-slate-100">
            {course.previewVideoUrl ? (
              <video src={course.previewVideoUrl} poster={course.thumbnailUrl || undefined} controls className="h-full w-full bg-black object-cover" />
            ) : course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <BookOpen className="h-12 w-12" />
              </div>
            )}
          </div>
          <div className="space-y-3 p-5 text-sm">
            <Metric label="Type" value={isDocument ? 'Document' : 'Course'} />
            <Metric label="Price" value={effectivePrice ? formatCurrency(effectivePrice) : 'Free'} />
            <Metric label="Base price" value={course.priceMxc ? formatCurrency(course.priceMxc) : 'Free'} />
            <Metric label="Updated" value={formatDateTime(course.updatedAt || course.createdAt)} />
            <Metric label="Published" value={course.publishedAt ? formatDateTime(course.publishedAt) : 'Published on creation'} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black text-slate-900">Product summary</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-600">
              {course.description || 'No description provided.'}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Summary icon={<Users className="h-4 w-4" />} label="Enrollments" value={String(course.totalEnrollments || 0)} />
              <Summary icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />} label="Rating" value={Number(course.averageRating || 0).toFixed(1)} />
              <Summary icon={<BookOpen className="h-4 w-4" />} label="Lessons" value={String(lessons.length)} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black text-slate-900">{isDocument ? 'Document file' : 'Content'}</h2>
            <div className="mt-4 space-y-3">
              {(groupedSections.length ? groupedSections : [{ section: null, lessons }]).map((group, index) => (
                <div key={group.section?.id || `group-${index}`} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-black text-slate-900">{group.section?.title || `Section ${index + 1}`}</p>
                  <div className="mt-3 space-y-2">
                    {group.lessons.map((lesson) => (
                      <div key={lesson.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                        {lesson.lessonType === LessonType.DOCUMENT ? <Download className="h-4 w-4" /> : lesson.lessonType === LessonType.QUIZ ? <FileText className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                        <span>{lesson.title}</span>
                      </div>
                    ))}
                    {group.lessons.length === 0 && <p className="text-sm font-semibold text-slate-400">No lessons in this section.</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CourseNameConfirmModal
        isOpen={archiveConfirmOpen}
        courseName={course.title}
        title="Archive product?"
        message="This product will leave the marketplace. Enrolled learners can still access it from their library."
        confirmText="Archive Product"
        confirmTone="slate"
        isLoading={archiveCourse.isLoading}
        onClose={() => {
          if (!archiveCourse.isLoading) setArchiveConfirmOpen(false)
        }}
        onConfirm={() => archiveCourse.mutate()}
      />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="text-right font-black text-slate-900">{value}</span>
    </div>
  )
}

function Summary({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-2 text-xl font-black text-slate-900">{value}</p>
    </div>
  )
}
