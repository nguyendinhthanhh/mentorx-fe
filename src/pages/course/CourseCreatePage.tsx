import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'
import CourseCreateForm from '@/components/course/CourseCreateForm'
import { ArrowLeft } from 'lucide-react'

export default function CourseCreatePage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to courses
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Course Basics</h1>
        <p className="text-gray-500 mt-1">Add the public course details first. After creation, you will build sections and lessons in the editor.</p>
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <CourseCreateForm instructorId={user.userId} />
      </div>
    </div>
  )
}
