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
      toast.success('Đã lưu trữ khóa học')
      queryClient.invalidateQueries('admin-courses')
      setArchiveTarget(null)
    },
  })

  const getStatusColor = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.PUBLISHED: return 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-500 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400'
      case CourseStatus.ARCHIVED: return 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
      default: return 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
    }
  }

  const getStatusLabel = (status: CourseStatus) => {
    const labels: Record<CourseStatus, string> = {
      [CourseStatus.PUBLISHED]: 'Đã xuất bản',
      [CourseStatus.ARCHIVED]: 'Đã lưu trữ',
    }
    return labels[status] || status
  }

  const getProductTypeLabel = (type?: CourseProductType) => {
    const labels: Record<CourseProductType, string> = {
      [CourseProductType.COURSE]: 'Khóa học',
      [CourseProductType.DOCUMENT]: 'Tài liệu',
    }
    return type ? labels[type] || type : 'Học liệu'
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent dark:from-white dark:to-slate-400 sm:text-3xl lg:text-4xl">
          Danh mục học liệu
        </h1>
        <p className="text-slate-500 dark:text-slate-400 dark:text-slate-400 text-sm md:text-base">
          Quản lý và kiểm duyệt khóa học, tài liệu trên nền tảng.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-950/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
        <div className="flex flex-col md:flex-row gap-5">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm khóa học hoặc tài liệu..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-white dark:bg-slate-950/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/60 dark:border-slate-700 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-medium shadow-sm hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CourseStatus)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950/50 text-sm font-bold text-slate-600 dark:text-slate-400 outline-none transition-all focus:border-emerald-500/30 focus:bg-white dark:bg-slate-950 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:focus:bg-slate-800 shadow-sm hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600 appearance-none cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.values(CourseStatus).map(s => (
                <option key={s} value={s}>{getStatusLabel(s)}</option>
              ))}
            </select>
            <select
              value={productTypeFilter}
              onChange={(e) => setProductTypeFilter(e.target.value as CourseProductType)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950/50 text-sm font-bold text-slate-600 dark:text-slate-400 outline-none transition-all focus:border-emerald-500/30 focus:bg-white dark:bg-slate-950 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:focus:bg-slate-800 shadow-sm hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600 appearance-none cursor-pointer"
            >
              <option value="">Tất cả loại học liệu</option>
              <option value={CourseProductType.COURSE}>Khóa học</option>
              <option value={CourseProductType.DOCUMENT}>Tài liệu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-950/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/50">
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">Học liệu & giảng viên</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">Giá</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">Lượt học</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
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
                  <tr key={course.courseId} className="group hover:bg-slate-50 dark:bg-slate-900/30 dark:hover:bg-slate-800/80 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-500 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 dark:border-emerald-800/30 shadow-sm overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                          {course.thumbnailUrl ? (
                            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[250px] group-hover:text-emerald-600 dark:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{course.title}</span>
                          <span className="mt-1 w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:bg-slate-800 dark:text-slate-400">
                            {getProductTypeLabel(course.productType)}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider mt-0.5">Bởi {course.instructor?.fullName || course.instructorName || 'Chưa xác định'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {course.priceMxc ? formatCurrency(course.priceMxc) : 'Miễn phí'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 dark:text-slate-400">
                        {course.totalEnrollments} học viên
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(course.status)} shadow-sm`}>
                        {getStatusLabel(course.status)}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2 opacity-100 transition-all duration-300 lg:translate-x-4 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100">
                        <Link
                          to={`/admin/courses/${course.courseId}/review`}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 shadow-sm hover:border-emerald-200 dark:border-emerald-800/50 hover:text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:bg-emerald-900/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-emerald-900/20 transition-all hover:shadow-md hover:-translate-y-0.5"
                        >
                          <Eye className="w-4 h-4" />
                          Xem
                        </Link>
                        {course.status === CourseStatus.PUBLISHED && (
                          <button
                            onClick={() => setArchiveTarget({ courseId: course.courseId, courseTitle: course.title })}
                            disabled={archiveMutation.isLoading}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 shadow-sm hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-900/20 transition-all hover:shadow-md hover:-translate-y-0.5"
                          >
                            <Archive className="w-4 h-4" />
                            Lưu trữ
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
        <div className="flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50 px-6 py-5 dark:border-slate-800/50 dark:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Tổng cộng {data?.totalElements} học liệu
          </p>
          <div className="flex gap-2">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-950 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-slate-400 hover:text-emerald-600 dark:text-emerald-500 hover:border-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              disabled={data?.last}
              onClick={() => setPage(p => p + 1)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-950 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-slate-400 hover:text-emerald-600 dark:text-emerald-500 hover:border-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <CourseNameConfirmModal
        isOpen={!!archiveTarget}
        courseName={archiveTarget?.courseTitle || ''}
        title="Lưu trữ học liệu?"
        message="Học liệu này sẽ rời khỏi marketplace. Học viên đã đăng ký vẫn có thể truy cập từ thư viện của họ."
        confirmText="Lưu trữ học liệu"
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
