import { useQuery, useMutation, useQueryClient } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { CourseStatus } from '@/types'
import { 
  Search, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  XCircle,
  Eye,
  Archive
} from 'lucide-react'
import { useState } from 'react'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { Link } from 'react-router-dom'
import ArchiveReasonModal from '@/components/admin/ArchiveReasonModal'
import { toast } from 'react-hot-toast'

export default function AdminCoursesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CourseStatus | ''>('')

  const [isDenyModalOpen, setIsDenyModalOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const { data, isLoading } = useQuery(
    ['admin-courses', page, search, statusFilter],
    () => courseApi.getAllCourses({ 
      page, 
      size: 10, 
      status: statusFilter || undefined
    })
  )

  const updateStatusMutation = useMutation(
    ({ courseId, status, reason }: { courseId: string; status: CourseStatus; reason?: string }) => 
      courseApi.updateStatus(courseId, status, reason),
    {
      onSuccess: () => {
        toast.success('Course status updated')
        queryClient.invalidateQueries('admin-courses')
        setIsDenyModalOpen(false)
      }
    }
  )

  const archiveMutation = useMutation((courseId: string) => courseApi.archive(courseId), {
    onSuccess: () => {
      toast.success('Course archived')
      queryClient.invalidateQueries('admin-courses')
    },
  })

  const getStatusColor = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.PUBLISHED: return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
      case CourseStatus.PENDING_REVIEW: return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
      case CourseStatus.DRAFT: return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
      case CourseStatus.ARCHIVED: return 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      case CourseStatus.REJECTED: return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
      default: return 'bg-gray-50 text-gray-600'
    }
  }

  const handleDeny = (courseId: string) => {
    setSelectedCourseId(courseId)
    setIsDenyModalOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-medium text-gray-900 dark:text-white"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CourseStatus)}
            className="px-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-bold text-gray-600 dark:text-gray-400"
          >
            <option value="">All Statuses</option>
            {Object.values(CourseStatus).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] border-b border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/20">
                <th className="px-8 py-5 text-left">Course Info & Instructor</th>
                <th className="px-8 py-5 text-left">Price</th>
                <th className="px-8 py-5 text-left">Enrollments</th>
                <th className="px-8 py-5 text-left">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6">
                      <div className="h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl w-full" />
                    </td>
                  </tr>
                ))
              ) : (
                data?.content.map((course) => (
                  <tr key={course.courseId} className="group hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800 shadow-sm overflow-hidden">
                          {course.thumbnailUrl ? (
                            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight truncate max-w-[250px]">{course.title}</span>
                          <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.1em] mt-0.5">By {course.instructor?.fullName || course.instructorName || 'Unknown'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
                        {course.priceMxc ? formatCurrency(course.priceMxc) : 'Free'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {course.totalEnrollments} Students
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(course.status)}`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                        <Link to={`/admin/courses/${course.courseId}/review`} className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-600 transition-all shadow-sm" title="Review Material">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {course.status !== CourseStatus.PUBLISHED && (
                          <button 
                            onClick={() => updateStatusMutation.mutate({ courseId: course.courseId, status: CourseStatus.PUBLISHED })}
                            className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-emerald-600 transition-all shadow-sm"
                            title="Approve & Publish"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {course.status === CourseStatus.PENDING_REVIEW && (
                          <button 
                            onClick={() => handleDeny(course.courseId)}
                            className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-rose-500 transition-all shadow-sm"
                            title="Deny and Return to Draft"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {course.status === CourseStatus.PUBLISHED && (
                          <button
                            onClick={() => {
                              if (window.confirm('Archive this course? It will leave the marketplace but enrolled learners can still access it.')) {
                                archiveMutation.mutate(course.courseId)
                              }
                            }}
                            disabled={archiveMutation.isLoading}
                            className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-slate-700 transition-all shadow-sm"
                            title="Archive Course"
                          >
                            <Archive className="w-4 h-4" />
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
        <div className="px-8 py-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/30">
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Total {data?.totalElements} courses listed
          </p>
          <div className="flex gap-3">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-600 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              disabled={data?.last}
              onClick={() => setPage(p => p + 1)}
              className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-600 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <ArchiveReasonModal 
        isOpen={isDenyModalOpen}
        onClose={() => setIsDenyModalOpen(false)}
        isLoading={updateStatusMutation.isLoading}
        title="Return Course to Draft"
        message="The mentor will see this reason and can revise the course before submitting it again."
        confirmText="Return to Draft"
        onConfirm={(reason) => {
          if (selectedCourseId) {
            updateStatusMutation.mutate({ 
              courseId: selectedCourseId, 
              status: CourseStatus.DRAFT,
              reason 
            })
          }
        }}
      />
    </div>
  )
}
