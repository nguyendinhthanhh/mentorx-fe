import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'
import CourseCreateForm from '@/components/course/CourseCreateForm'
import { ArrowLeft } from 'lucide-react'
import { CourseProductType } from '@/types'

export default function CourseCreatePage({ productType = CourseProductType.COURSE }: { productType?: CourseProductType }) {
  const { user } = useAuthStore()
  const isDocument = productType === CourseProductType.DOCUMENT

  if (!user) return null

  return (
    <div className="min-h-[calc(100vh-8rem)] space-y-4">
      <Link to="/mentor/courses" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to courses
      </Link>

      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">{isDocument ? 'New document' : 'New course'}</p>
          <h1 className="text-2xl font-black text-slate-900">{isDocument ? 'Document editor' : 'Course editor'}</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {isDocument
              ? 'Create a downloadable document listing with cover image, domain, skills, and pricing.'
            : 'Build course info and initial curriculum from the same editor.'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <CourseCreateForm instructorId={user.userId} productType={productType} />
      </div>
    </div>
  )
}
