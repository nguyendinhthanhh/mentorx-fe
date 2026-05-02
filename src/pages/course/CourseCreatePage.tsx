import { useAuthStore } from '@/store/authStore'
import CourseCreateForm from '@/components/course/CourseCreateForm'

export default function CourseCreatePage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create a New Course</h1>
      
      <div className="card">
        <CourseCreateForm instructorId={user.userId} />
      </div>
    </div>
  )
}
