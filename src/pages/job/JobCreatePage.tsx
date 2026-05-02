import { useAuthStore } from '@/store/authStore'
import JobCreateForm from '@/components/job/JobCreateForm'

export default function JobCreatePage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Post a New Job</h1>
      
      <div className="card">
        <JobCreateForm clientId={user.userId} />
      </div>
    </div>
  )
}
