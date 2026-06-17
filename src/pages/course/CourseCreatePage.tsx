import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'
import CourseCreateForm from '@/components/course/CourseCreateForm'
import { ArrowLeft } from 'lucide-react'

export default function CourseCreatePage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <div className="min-h-[calc(100vh-8rem)] space-y-4">
      <Link to="/mentor/courses" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">New product</p>
          <h1 className="text-2xl font-black text-slate-900">Course editor</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Build product info and initial curriculum from the same editor.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <CourseCreateForm instructorId={user.userId} />
      </div>
    </div>
  )
}
