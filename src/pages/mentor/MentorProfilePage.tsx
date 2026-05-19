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
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link 
            to="/profile" 
            className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            Quay lại tài khoản
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Xác minh Mentor</h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nâng cấp tài khoản để chia sẻ kiến thức và nhận thu nhập.</p>
            </div>
          </div>
        </div>

        {status === MentorStatus.APPROVED && (
          <Link
            to="/mentor/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white shadow-xl transition-all hover:bg-slate-800 hover:shadow-slate-200 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 dark:shadow-none lg:px-8"
          >
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Vào Mentor Mode
          </Link>
        )}
      </div>

      <div className="mx-auto max-w-4xl space-y-8">
        {status === MentorStatus.APPROVED && (
          <StatusCard
            tone="success"
            icon={<BadgeCheck className="h-6 w-6" />}
            title="Hồ sơ mentor đã được duyệt"
            description="Chúc mừng! Bạn hiện đã có quyền truy cập vào các công cụ dành cho Mentor. Bạn có thể tạo khóa học và quản lý lịch tư vấn ngay bây giờ."
          />
        )}

        {status === MentorStatus.PENDING && (
          <StatusCard
            tone="pending"
            icon={<Timer className="h-6 w-6" />}
            title="Hồ sơ đang chờ duyệt"
            description="Chúng tôi đang kiểm tra thông tin của bạn. Quá trình này thường mất từ 24-48 giờ làm việc. Bạn sẽ nhận được thông báo khi có kết quả."
          />
        )}

        {status === MentorStatus.REJECTED && (
          <StatusCard
            tone="danger"
            icon={<XCircle className="h-6 w-6" />}
            title="Cần cập nhật thông tin"
            description={mentorProfile?.rejectionReason || 'Hồ sơ chưa đạt điều kiện duyệt. Vui lòng kiểm tra lại các thông tin chuyên môn hoặc giấy tờ định danh.'}
          />
        )}

        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
          {isLoading ? (
            <div className="p-10">
              <div className="animate-pulse space-y-6">
                <div className="h-8 w-1/3 rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          ) : (
            <div className="p-1">
              <MentorProfileForm
                userId={user.userId}
                userEmail={user.email}
                isEmailVerified={user.emailVerified}
                initialData={mentorProfile}
                isEdit={Boolean(mentorProfile)}
              />
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Quyền lợi Mentor</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Reason icon={<ShieldCheck className="h-5 w-5" />} title="Uy tín & Tin cậy" text="Huy hiệu xác minh giúp bạn nổi bật hơn." />
              <Reason icon={<CheckCircle2 className="h-5 w-5" />} title="Tăng thu nhập" text="Tự do thiết lập mức phí tư vấn." />
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[2rem] bg-indigo-600 p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
            <h2 className="relative z-10 text-lg font-black">Cần hỗ trợ?</h2>
            <p className="relative z-10 mt-2 text-xs font-medium leading-relaxed text-indigo-100">
              Nếu gặp khó khăn trong quá trình xác minh, hãy liên hệ ngay.
            </p>
            <Link 
              to="/chat" 
              className="relative z-10 mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2 text-sm font-black text-indigo-600"
            >
              Trò chuyện ngay
            </Link>
          </div>
        </div>
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
    success: 'border-emerald-100 bg-emerald-50/50 text-emerald-950 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400',
    pending: 'border-amber-100 bg-amber-50/50 text-amber-950 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400',
    danger: 'border-rose-100 bg-rose-50/50 text-rose-950 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-400',
  }

  const iconStyles = {
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400',
    pending: 'bg-amber-100 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400',
    danger: 'bg-rose-100 text-rose-600 dark:bg-rose-400/20 dark:text-rose-400',
  }

  return (
    <div className={`flex items-start gap-5 rounded-[2rem] border p-6 transition-all ${styles[tone]}`}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconStyles[tone]}`}>
        {icon}
      </div>
      <div className="pt-0.5">
        <h2 className="text-base font-black tracking-tight">{title}</h2>
        <p className="mt-1.5 text-sm font-medium leading-relaxed opacity-80">{description}</p>
      </div>
    </div>
  )
}

function Reason({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-4 group">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-900 dark:text-slate-600 dark:group-hover:text-indigo-400">
        {icon}
      </div>
      <div>
        <p className="text-sm font-black text-slate-950 dark:text-white transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{title}</p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
      </div>
    </div>
  )
}
