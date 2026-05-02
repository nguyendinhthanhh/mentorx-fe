import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { formatCurrency } from '@/utils/formatters'
import { BookOpen, Star, Users, Award } from 'lucide-react'

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  
  const { data: course, isLoading } = useQuery(
    ['course', courseId],
    () => courseApi.getById(courseId!),
    { enabled: !!courseId }
  )

  if (isLoading) {
    return <div className="text-center py-12">Loading course details...</div>
  }

  if (!course) {
    return <div className="text-center py-12">Course not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <img
          src={course.thumbnailUrl || 'https://via.placeholder.com/800x400'}
          alt={course.title}
          className="w-full h-64 object-cover rounded-lg mb-6"
        />

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            <p className="text-gray-600">By {course.instructor.fullName}</p>
          </div>
          <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
            {course.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Level</p>
              <p className="font-semibold">{course.level || 'All Levels'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Enrolled</p>
              <p className="font-semibold">{course.totalEnrollments}</p>
            </div>
          </div>

          {course.averageRating && (
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-600">Rating</p>
                <p className="font-semibold">{course.averageRating.toFixed(1)}</p>
              </div>
            </div>
          )}

          {course.isCertificate && (
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Certificate</p>
                <p className="font-semibold">Yes</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-6 mb-6">
          <h2 className="text-xl font-bold mb-3">About this course</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{course.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-primary-600">
            {course.priceMxc ? formatCurrency(course.priceMxc) : 'Free'}
          </span>
          <button className="btn btn-primary">Enroll Now</button>
        </div>
      </div>
    </div>
  )
}
