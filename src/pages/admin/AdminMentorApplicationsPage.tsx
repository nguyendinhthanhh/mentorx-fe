import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { mentorApi } from '@/api/mentorApi'
import { useAuthStore } from '@/store/authStore'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Mail,
  Calendar,
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  Award,
  Briefcase,
  Star,
  DollarSign,
} from 'lucide-react'
import { MentorProfileResponse, MentorStatus } from '@/types'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { toast } from 'react-hot-toast'

export default function AdminMentorApplicationsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedApplication, setSelectedApplication] = useState<MentorProfileResponse | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'revision'>('approve')
  const [actionReason, setActionReason] = useState('')

  const { data: applicationsData, isLoading } = useQuery(
    ['mentor-applications', page, size],
    () => mentorApi.getPendingApplications({ page, size }),
    { keepPreviousData: true }
  )

  const approveMutation = useMutation(
    (userId: string) => mentorApi.approveMentorApplication(userId, user!.userId),
    {
      onSuccess: () => {
        toast.success('Đã phê duyệt đơn đăng ký mentor')
        queryClient.invalidateQueries('mentor-applications')
        setShowActionModal(false)
        setSelectedApplication(null)
      },
      onError: () => {
        toast.error('Không thể phê duyệt đơn đăng ký')
      },
    }
  )

  const rejectMutation = useMutation(
    ({ userId, reason }: { userId: string; reason: string }) =>
      mentorApi.rejectMentorApplication(userId, reason, user!.userId),
    {
      onSuccess: () => {
        toast.success('Đã từ chối đơn đăng ký mentor')
        queryClient.invalidateQueries('mentor-applications')
        setShowActionModal(false)
        setSelectedApplication(null)
        setActionReason('')
      },
      onError: () => {
        toast.error('Không thể từ chối đơn đăng ký')
      },
    }
  )

  const revisionMutation = useMutation(
    ({ userId, reason }: { userId: string; reason: string }) =>
      mentorApi.requestMentorApplicationRevision(userId, reason, user!.userId),
    {
      onSuccess: () => {
        toast.success('Đã yêu cầu bổ sung thông tin')
        queryClient.invalidateQueries('mentor-applications')
        setShowActionModal(false)
        setSelectedApplication(null)
        setActionReason('')
      },
      onError: () => {
        toast.error('Không thể gửi yêu cầu bổ sung')
      },
    }
  )

  const handleAction = () => {
    if (!selectedApplication) return

    if (actionType === 'approve') {
      approveMutation.mutate(selectedApplication.userId)
    } else if (actionType === 'reject') {
      if (!actionReason.trim()) {
        toast.error('Vui lòng nhập lý do từ chối')
        return
      }
      rejectMutation.mutate({ userId: selectedApplication.userId, reason: actionReason })
    } else if (actionType === 'revision') {
      if (!actionReason.trim()) {
        toast.error('Vui lòng nhập nội dung cần bổ sung')
        return
      }
      revisionMutation.mutate({ userId: selectedApplication.userId, reason: actionReason })
    }
  }

  const openActionModal = (app: MentorProfileResponse, type: 'approve' | 'reject' | 'revision') => {
    setSelectedApplication(app)
    setActionType(type)
    setActionReason('')
    setShowActionModal(true)
  }

  const openDetailModal = (app: MentorProfileResponse) => {
    setSelectedApplication(app)
    setShowDetailModal(true)
  }

  const filteredApplications = applicationsData?.content.filter((app) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      app.user?.fullName?.toLowerCase().includes(query) ||
      app.user?.email?.toLowerCase().includes(query) ||
      app.bio?.toLowerCase().includes(query) ||
      app.expertise?.toLowerCase().includes(query)
    )
  })

  const totalPages = applicationsData?.totalPages || 0

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Đơn đăng ký Mentor</h1>
            <p className="mt-1 text-sm text-slate-600">
              Xem xét và phê duyệt các đơn đăng ký trở thành mentor
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-xs font-bold text-indigo-600">Đang chờ</p>
                  <p className="text-lg font-black text-indigo-900">
                    {applicationsData?.totalElements || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, chuyên môn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-medium placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <button className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            Bộ lọc
          </button>
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filteredApplications && filteredApplications.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredApplications.map((app) => (
              <ApplicationCard
                key={app.userId}
                application={app}
                onViewDetail={() => openDetailModal(app)}
                onApprove={() => openActionModal(app, 'approve')}
                onReject={() => openActionModal(app, 'reject')}
                onRequestRevision={() => openActionModal(app, 'revision')}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-900">Không có đơn đăng ký</h3>
            <p className="mt-1 text-sm text-slate-600">
              {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có đơn đăng ký mentor nào đang chờ xử lý'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-600">
              Trang {page + 1} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedApplication && (
        <DetailModal
          application={selectedApplication}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedApplication(null)
          }}
          onApprove={() => {
            setShowDetailModal(false)
            openActionModal(selectedApplication, 'approve')
          }}
          onReject={() => {
            setShowDetailModal(false)
            openActionModal(selectedApplication, 'reject')
          }}
          onRequestRevision={() => {
            setShowDetailModal(false)
            openActionModal(selectedApplication, 'revision')
          }}
        />
      )}

      {/* Action Modal */}
      {showActionModal && selectedApplication && (
        <ActionModal
          application={selectedApplication}
          actionType={actionType}
          reason={actionReason}
          onReasonChange={setActionReason}
          onConfirm={handleAction}
          onClose={() => {
            setShowActionModal(false)
            setSelectedApplication(null)
            setActionReason('')
          }}
          isLoading={approveMutation.isLoading || rejectMutation.isLoading || revisionMutation.isLoading}
        />
      )}
    </div>
  )
}

function ApplicationCard({
  application,
  onViewDetail,
  onApprove,
  onReject,
  onRequestRevision,
}: {
  application: MentorProfileResponse
  onViewDetail: () => void
  onApprove: () => void
  onReject: () => void
  onRequestRevision: () => void
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-100/50">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-black text-white shadow-lg">
          {application.user?.fullName?.charAt(0) || 'M'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black text-slate-900">
            {application.user?.fullName || 'Unknown'}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <Mail className="h-3.5 w-3.5" />
            {application.user?.email}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Briefcase className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-700">{application.expertise || 'Chưa cập nhật'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-700">
            {application.hourlyRateMxc ? `${formatCurrency(application.hourlyRateMxc)}/giờ` : 'Chưa cập nhật'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-slate-600">Nộp {formatDate(application.createdAt)}</span>
        </div>
      </div>

      {application.bio && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{application.bio}</p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onViewDetail}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <Eye className="h-4 w-4" />
          Chi tiết
        </button>
        <button
          onClick={onApprove}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
          title="Phê duyệt"
        >
          <CheckCircle2 className="h-4 w-4" />
        </button>
        <button
          onClick={onRequestRevision}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600"
          title="Yêu cầu bổ sung"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
        <button
          onClick={onReject}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white hover:bg-rose-600"
          title="Từ chối"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function DetailModal({
  application,
  onClose,
  onApprove,
  onReject,
  onRequestRevision,
}: {
  application: MentorProfileResponse
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  onRequestRevision: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Chi tiết đơn đăng ký</h2>
            <p className="mt-1 text-sm text-slate-600">Xem xét thông tin mentor</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-black text-white shadow-lg">
                {application.user?.fullName?.charAt(0) || 'M'}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-slate-900">{application.user?.fullName}</h3>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="h-4 w-4" />
                  {application.user?.email}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4" />
                  Nộp đơn: {formatDate(application.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            <InfoRow label="Chuyên môn" value={application.expertise || 'Chưa cập nhật'} icon={Briefcase} />
            <InfoRow
              label="Giá theo giờ"
              value={application.hourlyRateMxc ? `${formatCurrency(application.hourlyRateMxc)} MXC` : 'Chưa cập nhật'}
              icon={DollarSign}
            />
            <InfoRow
              label="Số năm kinh nghiệm"
              value={application.yearsOfExperience ? `${application.yearsOfExperience} năm` : 'Chưa cập nhật'}
              icon={Award}
            />
            <InfoRow
              label="Đánh giá"
              value={application.averageRating ? `${application.averageRating}/5.0` : 'Chưa có'}
              icon={Star}
            />
          </div>

          {/* Bio */}
          {application.bio && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-400">
                <FileText className="h-4 w-4" />
                Giới thiệu
              </h4>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{application.bio}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 border-t border-slate-200 pt-6">
            <button
              onClick={onApprove}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-black text-white hover:bg-emerald-600"
            >
              <CheckCircle2 className="h-5 w-5" />
              Phê duyệt
            </button>
            <button
              onClick={onRequestRevision}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-black text-white hover:bg-amber-600"
            >
              <MessageSquare className="h-5 w-5" />
              Yêu cầu bổ sung
            </button>
            <button
              onClick={onReject}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 text-sm font-black text-white hover:bg-rose-600"
            >
              <XCircle className="h-5 w-5" />
              Từ chối
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionModal({
  application,
  actionType,
  reason,
  onReasonChange,
  onConfirm,
  onClose,
  isLoading,
}: {
  application: MentorProfileResponse
  actionType: 'approve' | 'reject' | 'revision'
  reason: string
  onReasonChange: (value: string) => void
  onConfirm: () => void
  onClose: () => void
  isLoading: boolean
}) {
  const config = {
    approve: {
      title: 'Phê duyệt đơn đăng ký',
      description: 'Xác nhận phê duyệt mentor này?',
      icon: CheckCircle2,
      iconClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50',
      buttonClass: 'bg-emerald-500 hover:bg-emerald-600',
      buttonText: 'Phê duyệt',
      showReason: false,
    },
    reject: {
      title: 'Từ chối đơn đăng ký',
      description: 'Vui lòng nhập lý do từ chối',
      icon: XCircle,
      iconClass: 'text-rose-600',
      bgClass: 'bg-rose-50',
      buttonClass: 'bg-rose-500 hover:bg-rose-600',
      buttonText: 'Từ chối',
      showReason: true,
    },
    revision: {
      title: 'Yêu cầu bổ sung thông tin',
      description: 'Nhập nội dung cần bổ sung',
      icon: MessageSquare,
      iconClass: 'text-amber-600',
      bgClass: 'bg-amber-50',
      buttonClass: 'bg-amber-500 hover:bg-amber-600',
      buttonText: 'Gửi yêu cầu',
      showReason: true,
    },
  }

  const current = config[actionType]
  const Icon = current.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${current.bgClass}`}>
          <Icon className={`h-7 w-7 ${current.iconClass}`} />
        </div>

        <h2 className="text-xl font-black text-slate-900">{current.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{current.description}</p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-700">{application.user?.fullName}</p>
          <p className="text-xs text-slate-500">{application.user?.email}</p>
        </div>

        {current.showReason && (
          <div className="mt-4">
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder={actionType === 'reject' ? 'Nhập lý do từ chối...' : 'Nhập nội dung cần bổ sung...'}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50 ${current.buttonClass}`}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Icon className="h-5 w-5" />
                {current.buttonText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <Icon className="h-5 w-5 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}
