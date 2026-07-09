import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { userApi } from '@/api/userApi'
import { 
  User, 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react'
import { formatRelativeTime } from '@/utils/formatters'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { MentorStatus } from '@/types'

export default function UserPublicProfilePage() {
  const { userId } = useParams<{ userId: string }>()

  const { data: userProfile, isLoading } = useQuery(['user', userId], () => userApi.getUserById(userId!), {
    enabled: Boolean(userId),
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-300">
          <User className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-gray-950">Người dùng không tồn tại</h2>
        <p className="mt-2 text-sm font-medium text-gray-500">Hồ sơ này có thể đã bị xóa hoặc không còn hoạt động.</p>
      </div>
    )
  }

  // Redirect to mentor profile if they are an approved mentor
  if (userProfile.mentorStatus === MentorStatus.APPROVED) {
    return <Navigate to={`/mentors/${userProfile.userId}`} replace />
  }

  const name = userProfile.fullName || userProfile.displayName || 'Người dùng'

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-gray-900">
      <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Trang chủ', to: '/' },
            { label: 'Người dùng', to: '#' },
            { label: name },
          ]}
        />
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-4">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          {/* Header/Cover */}
          <div className="h-32 bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-800 sm:h-48" />
          
          <div className="px-5 pb-8 sm:px-8">
            <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div className="relative -mt-16 sm:-mt-24 flex items-end gap-5">
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-[26px] border-[5px] border-white bg-white shadow-lg sm:h-32 sm:w-32">
                  {userProfile.avatarUrl ? (
                    <img src={userProfile.avatarUrl} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-4xl font-black text-white">
                      {name.charAt(0)}
                    </div>
                  )}
                </div>
                
                <div className="pb-2">
                  <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl flex items-center gap-2">
                    {name}
                    {userProfile.emailVerified && (
                      <ShieldCheck className="h-6 w-6 text-emerald-500" title="Đã xác thực" />
                    )}
                  </h1>
                  <p className="mt-1 text-sm font-bold text-gray-500">Client</p>
                </div>
              </div>
            </div>

            {userProfile.bio && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Giới thiệu</h3>
                <p className="max-w-3xl text-[15px] font-medium leading-relaxed text-gray-600 whitespace-pre-wrap">{userProfile.bio}</p>
              </div>
            )}

            <div className="mt-8 grid gap-4 border-t border-slate-100 pt-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Thành viên từ</p>
                  <p className="mt-0.5 font-semibold text-slate-900">{formatRelativeTime(userProfile.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                  {userProfile.emailVerified ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Clock className="h-5 w-5 text-amber-500" />}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái xác thực</p>
                  <p className="mt-0.5 font-semibold text-slate-900">
                    {userProfile.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
