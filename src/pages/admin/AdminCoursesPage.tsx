import { useQuery, useMutation, useQueryClient } from 'react-query'
import { courseApi } from '@/api/courseApi'
import CourseNameConfirmModal from '@/components/course/CourseNameConfirmModal'
import { CourseProductType, CourseStatus } from '@/types'
import { Search, BookOpen, ChevronLeft, ChevronRight, Eye, Archive } from 'lucide-react'
import { useState } from 'react'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export default function AdminCoursesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CourseStatus | ''>('')
  const [productTypeFilter, setProductTypeFilter] = useState<CourseProductType | ''>('')
  const [archiveTarget, setArchiveTarget] = useState<{ courseId: string; courseTitle: string } | null>(null)

  const { data, isLoading } = useQuery(
    ['admin-courses', page, search, statusFilter, productTypeFilter],
    () => courseApi.getAllCourses({ 
      page, 
      size: 10, 
      status: statusFilter || undefined,
      productType: productTypeFilter || undefined,
    })
  )

  const archiveMutation = useMutation((courseId: string) => courseApi.archive(courseId), {
    onSuccess: () => {
      toast.success('Course archived')
      queryClient.invalidateQueries('admin-courses')
      setArchiveTarget(null)
    },
  })

  const getStatusColor = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.PUBLISHED: return 'bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400'
      case CourseStatus.ARCHIVED: return 'bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
      default: return 'bg-slate-50 border border-slate-200 text-slate-600'
    }
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
          Course Catalog
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
          Manage and moderate platform courses and documents.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
        <div className="flex flex-col md:flex-row gap-5">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-medium shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CourseStatus)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-200/60 bg-white/50 text-sm font-bold text-slate-600 outline-none transition-all focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:focus:bg-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              {Object.values(CourseStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={productTypeFilter}
              onChange={(e) => setProductTypeFilter(e.target.value as CourseProductType)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-200/60 bg-white/50 text-sm font-bold text-slate-600 outline-none transition-all focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:focus:bg-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 appearance-none cursor-pointer"
            >
              <option value="">All Types</option>
              <option value={CourseProductType.COURSE}>Courses</option>
              <option value={CourseProductType.DOCUMENT}>Documents</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/50">
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Course Info & Instructor</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Enrollments</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6">
                      <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl w-full" />
                    </td>
                  </tr>
                ))
              ) : (
                data?.content
                  .filter((course) => {
                    const keyword = search.trim().toLowerCase()
                    return !keyword || course.title.toLowerCase().includes(keyword) || course.description?.toLowerCase().includes(keyword)
                  })
                  .map((course) => (
                  <tr key={course.courseId} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30 shadow-sm overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                          {course.thumbnailUrl ? (
                            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[250px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{course.title}</span>
                          <span className="mt-1 w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {course.productType === CourseProductType.DOCUMENT ? 'Document' : 'Course'}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mt-0.5">By {course.instructor?.fullName || course.instructorName || 'Unknown'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {course.priceMxc ? formatCurrency(course.priceMxc) : 'Free'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        {course.totalEnrollments} Students
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(course.status)} shadow-sm`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2 opacity-100 transition-all duration-300 lg:translate-x-4 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100">
                        <Link
                          to={`/admin/courses/${course.courseId}/review`}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-indigo-900/20 transition-all hover:shadow-md hover:-translate-y-0.5"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                        {course.status === CourseStatus.PUBLISHED && (
                          <button
                            onClick={() => setArchiveTarget({ courseId: course.courseId, courseTitle: course.title })}
                            disabled={archiveMutation.isLoading}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-900/20 transition-all hover:shadow-md hover:-translate-y-0.5"
                          >
                            <Archive className="w-4 h-4" />
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-4 border-t border-slate-100/50 bg-slate-50/30 px-6 py-5 dark:border-slate-800/50 dark:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Total {data?.totalElements} courses listed
          </p>
          <div className="flex gap-2">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              disabled={data?.last}
              onClick={() => setPage(p => p + 1)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <CourseNameConfirmModal
        isOpen={!!archiveTarget}
        courseName={archiveTarget?.courseTitle || ''}
        title="Archive course?"
        message="This course will leave the marketplace. Enrolled learners can still access it from their library."
        confirmText="Archive Course"
        confirmTone="slate"
        isLoading={archiveMutation.isLoading}
        onClose={() => {
          if (!archiveMutation.isLoading) setArchiveTarget(null)
        }}
        onConfirm={() => {
          if (!archiveTarget) return
          archiveMutation.mutate(archiveTarget.courseId)
        }}
      />
    </div>
  )
}
