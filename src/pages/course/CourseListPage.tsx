import { useQuery } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/formatters'
import { Plus, BookOpen, Star } from 'lucide-react'

export default function CourseListPage() {
  const { data, isLoading } = useQuery('courses', () =>
    courseApi.getPublished({ page: 0, size: 20 })
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Browse Courses</h1>
        <Link to="/courses/create" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Course
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading courses...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.content.map((course) => (
            <Link
              key={course.courseId}
              to={`/courses/${course.courseId}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <img
                src={course.thumbnailUrl || 'https://via.placeholder.com/400x200'}
                alt={course.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              
              <h3 className="font-bold text-lg mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{course.description}</p>

              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-gray-600">By {course.instructor.fullName}</span>
                {course.averageRating && (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="font-semibold">{course.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary-600">
                  {course.priceMxc ? formatCurrency(course.priceMxc) : 'Free'}
                </span>
                <div className="flex items-center text-sm text-gray-600">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {course.totalEnrollments} enrolled
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data?.content.length === 0 && (
        <div className="text-center py-12 text-gray-600">No courses found.</div>
      )}
    </div>
  )
}
