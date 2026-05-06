import { useQuery } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/formatters'
import { Plus, BookOpen, Star, Search, Users } from 'lucide-react'
import { useState } from 'react'

export default function CourseListPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery('courses', () =>
    courseApi.getPublished({ page: 0, size: 20 })
  )

  const filteredCourses = data?.content.filter((course) =>
    !search || 
    course.title.toLowerCase().includes(search.toLowerCase()) ||
    course.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Courses</h1>
          <p className="text-gray-500 mt-1">Expand your skills with expert-led courses</p>
        </div>
        <Link
          to="/courses/create"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors text-sm shadow-sm shadow-primary-200"
        >
          <Plus className="w-4 h-4" />
          Create Course
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses by title or description..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
          />
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-100" />
              <div className="p-5">
                <div className="h-5 bg-gray-100 rounded-lg w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-100 rounded w-20" />
                  <div className="h-4 bg-gray-100 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredCourses && filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Link
              key={course.courseId}
              to={`/courses/${course.courseId}`}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-100/50 hover:border-gray-200 transition-all duration-300"
            >
              <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-50 overflow-hidden">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-primary-300" />
                  </div>
                )}
                {course.level && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur rounded-lg text-xs font-medium text-gray-700">
                    {course.level}
                  </span>
                )}
              </div>
              
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 mb-1.5 group-hover:text-primary-600 transition-colors line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{course.description || 'No description'}</p>

                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-500 truncate mr-2">
                    {course.instructor?.fullName || 'Unknown instructor'}
                  </span>
                  {course.averageRating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-medium text-gray-700">{course.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-lg font-bold text-primary-600">
                    {course.priceMxc ? formatCurrency(course.priceMxc) : 'Free'}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    {course.totalEnrollments}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No courses found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {search ? 'Try adjusting your search' : 'Be the first to create a course!'}
          </p>
          <Link
            to="/courses/create"
            className="inline-flex items-center gap-2 text-sm text-primary-600 font-medium hover:text-primary-700"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </Link>
        </div>
      )}
    </div>
  )
}
