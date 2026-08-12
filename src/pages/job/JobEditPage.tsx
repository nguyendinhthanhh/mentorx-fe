import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useQuery } from 'react-query'
import JobCreateForm from '@/components/job/JobCreateForm'
import { jobApi } from '@/api/jobApi'
import { useAuthStore } from '@/store/authStore'
import { JobStatus } from '@/types'

export default function JobEditPage() {
  const { user } = useAuthStore()
  const { jobId } = useParams<{ jobId: string }>()

  const { data: job, isLoading } = useQuery(['job-edit', jobId], () => jobApi.getById(jobId!), {
    enabled: Boolean(jobId),
  })

  if (!user) return null

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-[#f8fafc] dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-500" />
      </div>
    )
  }

  const canEdit = job && (job.status === JobStatus.DRAFT || job.status === JobStatus.OPEN || job.status === JobStatus.PENDING_APPROVAL)

  if (!job || job.clientId !== user.userId || !canEdit) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 px-4 py-12 text-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Không thể chỉnh sửa yêu cầu này</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Yêu cầu không tồn tại, không thuộc tài khoản hiện tại, hoặc đã có Mentor được chọn (đang thực hiện).
          </p>
          <Link
            to="/my-jobs"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700"
          >
            Về yêu cầu của tôi
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-20 text-slate-950 dark:text-slate-100">
      <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/my-jobs" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100">
            <ArrowLeft className="h-4 w-4" />
            Quay lại yêu cầu của tôi
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Chỉnh sửa yêu cầu</h1>
          <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
            Cập nhật nội dung nháp, sau đó lưu lại hoặc đăng để mentor có thể ứng tuyển.
          </p>
        </div>

        <JobCreateForm clientId={user.userId} initialJob={job} mode="edit" />
      </main>
    </div>
  )
}
