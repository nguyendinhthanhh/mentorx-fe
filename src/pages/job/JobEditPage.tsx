import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useQuery } from 'react-query'
import JobCreateForm from '@/components/job/JobCreateForm'
import { jobApi } from '@/api/jobApi'
import { useAuthStore } from '@/store/authStore'

export default function JobEditPage() {
  const { user } = useAuthStore()
  const { jobId } = useParams<{ jobId: string }>()

  const { data: job, isLoading } = useQuery(['job-edit', jobId], () => jobApi.getById(jobId!), {
    enabled: Boolean(jobId),
  })

  if (!user) return null

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!job || job.clientId !== user.userId) {
    return (
      <div className="min-h-screen bg-[#f8fafc] px-4 py-12 text-slate-950">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Không thể chỉnh sửa yêu cầu này</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Yêu cầu không tồn tại hoặc không thuộc tài khoản hiện tại.
          </p>
          <Link
            to="/my-jobs"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700"
          >
            Về yêu cầu của tôi
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 text-slate-950">
      <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/my-jobs" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Quay lại yêu cầu của tôi
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Chỉnh sửa yêu cầu</h1>
          <p className="mt-2 text-base text-slate-500">
            Cập nhật nội dung nháp, sau đó lưu lại hoặc đăng để mentor có thể ứng tuyển.
          </p>
        </div>

        <JobCreateForm clientId={user.userId} initialJob={job} mode="edit" />
      </main>
    </div>
  )
}
