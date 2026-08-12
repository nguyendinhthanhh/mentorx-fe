import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { ArrowRight, Briefcase, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { contractApi } from '@/api/contractApi'
import { jobApi } from '@/api/jobApi'
import { formatCurrency } from '@/utils/formatters'
import { JobStatus } from '@/types'

interface JobContextBannerProps {
  jobId: string
  userId: string
}

export default function JobContextBanner({ jobId, userId }: JobContextBannerProps) {
  const { data: job } = useQuery(
    ['job-context', jobId],
    () => jobApi.getById(jobId),
    {
      enabled: Boolean(jobId),
      staleTime: 30_000,
    }
  )

  const { data: contractsPage } = useQuery(
    ['job-contracts-context', jobId],
    () => contractApi.getByJob(jobId, { page: 0, size: 5 }),
    {
      enabled: Boolean(jobId),
      staleTime: 30_000,
    }
  )

  const contract = contractsPage?.content.find((c) => c.status === 'ACTIVE') || null
  const isOwner = job?.clientId === userId
  const isMentor = contract?.mentorId === userId

  // Don't show banner if no relevant context
  if (!job || (!isOwner && !isMentor)) return null

  // Banner variants based on status
  if (job.status === JobStatus.IN_PROGRESS && contract?.status === 'ACTIVE') {
    return (
      <div className="border-b border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50 to-blue-50 dark:to-blue-900/30 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
              <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                {isOwner ? 'Công việc đang thực hiện' : 'Đang làm việc cho client'}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                {contract.amountInEscrow ? (
                  <>Escrow: <span className="font-bold">{formatCurrency(contract.amountInEscrow)}</span></>
                ) : (
                  <>Giá thỏa thuận: <span className="font-bold">{formatCurrency(contract.totalAmount || 0)}</span></>
                )}
              </p>
            </div>
          </div>
          <Link
            to={isOwner ? `/my-jobs/${jobId}` : `/mentor/contracts/${contract.id}`}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-white dark:bg-slate-950 px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 transition hover:bg-emerald-50 dark:bg-emerald-900/30"
          >
            {isOwner ? 'Chi tiết & Xác nhận' : 'Xem hợp đồng'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  // Job is open - show proposal status
  if (job.status === JobStatus.OPEN) {
    return (
      <div className="border-b border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50 to-emerald-50 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
              <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                {isOwner ? 'Yêu cầu đang chờ chọn mentor' : 'Đã gửi đề xuất'}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                {isOwner ? 'Xem và chấp nhận mentor phù hợp' : 'Đang chờ client phản hồi'}
              </p>
            </div>
          </div>
          <Link
            to={isOwner ? `/my-jobs/${jobId}` : `/jobs/${jobId}`}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-white dark:bg-slate-950 px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 transition hover:bg-emerald-50 dark:bg-emerald-900/30"
          >
            Xem chi tiết
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  // Job completed
  if (job.status === JobStatus.COMPLETED) {
    return (
      <div className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <CheckCircle2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Công việc đã hoàn thành</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Escrow đã được giải ngân</p>
            </div>
          </div>
          <Link
            to={isOwner ? `/my-jobs/${jobId}` : `/mentor/contracts/${contract?.id}`}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:bg-slate-900/50"
          >
            Xem lịch sử
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  // Job cancelled/closed
  if (job.status === JobStatus.CANCELLED || job.status === JobStatus.CLOSED) {
    return (
      <div className="border-b border-amber-200 dark:border-amber-800/50 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                Công việc đã {job.status === JobStatus.CANCELLED ? 'hủy' : 'đóng'}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {job.statusReason || 'Không còn hoạt động'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
