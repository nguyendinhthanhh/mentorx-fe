import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'
import JobCreateForm from '@/components/job/JobCreateForm'
import { ArrowLeft } from 'lucide-react'

export default function JobCreatePage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to jobs
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Post a New Job</h1>
        <p className="text-gray-500 mt-1">Describe what you need and find the perfect mentor</p>
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <JobCreateForm clientId={user.userId} />
      </div>
    </div>
  )
}
