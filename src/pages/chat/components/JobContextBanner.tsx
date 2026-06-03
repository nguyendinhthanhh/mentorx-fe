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
      <div className="border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <Briefcase className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">
                {isOwner ? 'Công việc đang thực hiện' : 'Đang làm việc cho client'}
              </p>
              <p className="text-xs text-emerald-700">
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
            className="flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
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
      <div className="border-b border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
              <Clock className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-900">
                {isOwner ? 'Yêu cầu đang chờ chọn mentor' : 'Đã gửi đề xuất'}
              </p>
              <p className="text-xs text-indigo-700">
                {isOwner ? 'Xem và chấp nhận mentor phù hợp' : 'Đang chờ client phản hồi'}
              </p>
            </div>
          </div>
          <Link
            to={isOwner ? `/my-jobs/${jobId}` : `/jobs/${jobId}`}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
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
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <CheckCircle2 className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Công việc đã hoàn thành</p>
              <p className="text-xs text-slate-600">Escrow đã được giải ngân</p>
            </div>
          </div>
          <Link
            to={isOwner ? `/my-jobs/${jobId}` : `/mentor/contracts/${contract?.id}`}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
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
      <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                Công việc đã {job.status === JobStatus.CANCELLED ? 'hủy' : 'đóng'}
              </p>
              <p className="text-xs text-amber-700">
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
