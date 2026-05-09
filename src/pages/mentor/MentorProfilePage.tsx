import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { ArrowLeft, BadgeCheck, CheckCircle2, GraduationCap, ShieldCheck, Sparkles, Timer, XCircle } from 'lucide-react'
import { mentorApi } from '@/api/mentorApi'
import MentorProfileForm from '@/components/mentor/MentorProfileForm'
import { useAuthStore } from '@/store/authStore'
import { MentorStatus } from '@/types'

export default function MentorProfilePage() {
  const { user } = useAuthStore()
  const status = user?.mentorStatus
  const shouldFetchMentorProfile = Boolean(user?.userId && status && status !== MentorStatus.NONE)

  const { data: mentorProfile, isLoading } = useQuery(
    ['mentorProfile', user?.userId],
    () => mentorApi.getMentorProfile(user!.userId),
    { enabled: shouldFetchMentorProfile, retry: false }
  )

  if (!user) return null

  const hasSubmitted = status === MentorStatus.PENDING || status === MentorStatus.APPROVED || status === MentorStatus.REJECTED

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/profile" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Quay lại tài khoản
          </Link>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Xác minh Mentor</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
            Hoàn tất các cấp độ xác minh để mở khóa mentor mode, tạo hồ sơ chuyên gia, đăng khóa học và thiết lập lịch tư vấn.
          </p>
        </div>

        {status === MentorStatus.APPROVED && (
          <Link
            to="/mentor/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
          >
            <Sparkles className="h-4 w-4" />
            Vào Mentor Mode
          </Link>
        )}
      </div>

      {status === MentorStatus.APPROVED && (
        <StatusCard
          tone="success"
          icon={<BadgeCheck className="h-5 w-5" />}
          title="Hồ sơ mentor đã được duyệt"
          description="Bạn có thể switch giữa User Mode và Mentor Mode. Các chức năng học, lưu mentor, mua khóa học vẫn giữ nguyên cho tài khoản này."
        />
      )}

      {status === MentorStatus.PENDING && (
        <StatusCard
          tone="pending"
          icon={<Timer className="h-5 w-5" />}
          title="Hồ sơ đang chờ duyệt"
          description="Admin hoặc Moderator sẽ kiểm tra danh tính, kinh nghiệm và thông tin thanh toán trước khi bật mentor mode."
        />
      )}

      {status === MentorStatus.REJECTED && (
        <StatusCard
          tone="danger"
          icon={<XCircle className="h-5 w-5" />}
          title="Hồ sơ cần bổ sung"
          description={mentorProfile?.rejectionReason || 'Hồ sơ chưa đạt điều kiện duyệt. Bạn có thể cập nhật và gửi lại.'}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="animate-pulse space-y-5">
                <div className="h-12 rounded-2xl bg-slate-100" />
                <div className="h-80 rounded-2xl bg-slate-100" />
              </div>
            </div>
          ) : (
            <MentorProfileForm
              userId={user.userId}
              userEmail={user.email}
              isEmailVerified={user.emailVerified}
              initialData={mentorProfile}
              isEdit={Boolean(mentorProfile)}
            />
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-950">Vì sao cần xác minh?</h2>
            <div className="mt-5 space-y-4">
              <Reason icon={<ShieldCheck className="h-4 w-4" />} title="Bảo vệ học viên" text="Tạo môi trường tư vấn an toàn và đáng tin cậy." />
              <Reason icon={<CheckCircle2 className="h-4 w-4" />} title="Tăng tỉ lệ booking" text="Hồ sơ rõ ràng giúp học viên ra quyết định nhanh hơn." />
              <Reason icon={<BadgeCheck className="h-4 w-4" />} title="Badge Verified" text="Huy hiệu xác minh hiển thị trên hồ sơ công khai." />
              <Reason icon={<GraduationCap className="h-4 w-4" />} title="Mở khóa mentor tools" text="Sau khi duyệt, bạn có thể quản lý dịch vụ, lịch và khóa học." />
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
            <h2 className="text-sm font-black text-blue-950">Cần hỗ trợ?</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-blue-800">
              Nếu thông tin xác minh bị từ chối hoặc file tải lên lỗi, hãy nhắn hỗ trợ qua trang chat.
            </p>
            <Link to="/chat" className="mt-4 inline-flex text-sm font-black text-blue-700 hover:text-blue-900">
              Mở hỗ trợ
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

function StatusCard({
  tone,
  icon,
  title,
  description,
}: {
  tone: 'success' | 'pending' | 'danger'
  icon: React.ReactNode
  title: string
  description: string
}) {
  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    pending: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-red-200 bg-red-50 text-red-800',
  }

  return (
    <div className={`flex items-start gap-3 rounded-3xl border p-5 ${styles[tone]}`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <h2 className="text-sm font-black">{title}</h2>
        <p className="mt-1 text-sm font-medium opacity-85">{description}</p>
      </div>
    </div>
  )
}

function Reason({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        {icon}
      </div>
      <div>
        <p className="text-sm font-black text-slate-900">{title}</p>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{text}</p>
      </div>
    </div>
  )
}
