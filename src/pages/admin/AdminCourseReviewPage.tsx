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
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Card */}
      <div className="flex flex-wrap items-start justify-between gap-6 rounded-[2.5rem] border border-white/50 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all">
        <div>
          <button onClick={() => navigate('/admin/courses')} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to courses
          </button>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              {course.title}
            </h1>
            <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-sm ${course.status === CourseStatus.PUBLISHED ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400' : 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
              {course.status}
            </span>
          </div>
          <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
            {isDocument ? 'Document' : 'Course'} by <span className="text-indigo-600 dark:text-indigo-400">{course.instructorName || course.instructor?.fullName || 'Instructor'}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <Link to={`/courses/${course.courseId}`} className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 dark:border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            View public page
          </Link>
          {course.status === CourseStatus.PUBLISHED && (
            <button
              onClick={() => setArchiveConfirmOpen(true)}
              disabled={archiveCourse.isLoading}
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl border border-rose-200/60 bg-rose-50/50 dark:bg-rose-900/20 dark:border-rose-800/30 px-5 py-2.5 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-60"
            >
              {archiveCourse.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
              Archive
            </button>
          )}
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <div className="flex flex-col gap-6">
          {/* Media & Meta */}
          <div className="overflow-hidden rounded-[2.5rem] border border-white/50 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl shadow-slate-200/40 dark:shadow-none transition-all">
            <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative group">
              {course.previewVideoUrl ? (
                <video src={course.previewVideoUrl} poster={course.thumbnailUrl || undefined} controls className="h-full w-full bg-black object-cover" />
              ) : course.thumbnailUrl ? (
                <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                  <BookOpen className="h-16 w-16" />
                </div>
              )}
            </div>
            <div className="space-y-4 p-6 sm:p-8">
              <Metric label="Type" value={isDocument ? 'Document' : 'Course'} />
              <Metric label="Price" value={effectivePrice ? formatCurrency(effectivePrice) : 'Free'} />
              <Metric label="Base price" value={course.priceMxc ? formatCurrency(course.priceMxc) : 'Free'} />
              <Metric label="Updated" value={formatDateTime(course.updatedAt || course.createdAt)} />
              <Metric label="Published" value={course.publishedAt ? formatDateTime(course.publishedAt) : 'Published on creation'} />
            </div>
          </div>
        </div>

        <div className="space-y-6 flex flex-col">
          {/* Summary */}
          <div className="rounded-[2.5rem] border border-white/50 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Product Summary</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              {course.description || 'No description provided.'}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Summary icon={<Users className="h-5 w-5" />} label="Enrollments" value={String(course.totalEnrollments || 0)} />
              <Summary icon={<Star className="h-5 w-5 fill-amber-400 text-amber-400" />} label="Rating" value={Number(course.averageRating || 0).toFixed(1)} />
              <Summary icon={<BookOpen className="h-5 w-5" />} label="Lessons" value={String(lessons.length)} />
            </div>
          </div>

          {/* Content */}
          <div className="rounded-[2.5rem] border border-white/50 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all flex-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">{isDocument ? 'Document file' : 'Content Structure'}</h2>
            <div className="space-y-4">
              {(groupedSections.length ? groupedSections : [{ section: null, lessons }]).map((group, index) => (
                <div key={group.section?.id || `group-${index}`} className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/30 p-5">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">{group.section?.title || `Section ${index + 1}`}</p>
                  <div className="mt-4 space-y-2">
                    {group.lessons.map((lesson) => (
                      <div key={lesson.id} className="group/lesson flex items-center gap-4 rounded-xl bg-white dark:bg-slate-800 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 flex-shrink-0 group-hover/lesson:scale-110 transition-transform">
                          {lesson.lessonType === LessonType.DOCUMENT ? <Download className="h-4 w-4" /> : lesson.lessonType === LessonType.QUIZ ? <FileText className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                        </div>
                        <span className="truncate group-hover/lesson:text-indigo-600 dark:group-hover/lesson:text-indigo-400 transition-colors">{lesson.title}</span>
                      </div>
                    ))}
                    {group.lessons.length === 0 && <p className="text-sm font-bold text-slate-400 dark:text-slate-500 py-2">No lessons in this section.</p>}
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
    <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-extrabold text-slate-900 dark:text-white text-right">{value}</span>
    </div>
  )
}

function Summary({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-2.5 text-indigo-500 dark:text-indigo-400">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</p>
    </div>
  )
}
