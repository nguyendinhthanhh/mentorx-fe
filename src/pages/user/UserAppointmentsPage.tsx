import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarDays, Clock, Video, XCircle, Search } from 'lucide-react'
import { appointmentApi } from '@/api/appointmentApi'
import { useAuthStore } from '@/store/authStore'
import { AppointmentStatus, AppointmentResponse } from '@/types'

export default function UserAppointmentsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  const { data: appointments, isLoading, refetch } = useQuery(
    ['userAppointments', user?.userId],
    () => appointmentApi.getUserAppointments(user!.userId),
    { enabled: !!user?.userId, staleTime: 5 * 60 * 1000 }
  )

  const handleCancel = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return
    try {
      await appointmentApi.cancelAppointment(id)
      toast.success('Đã hủy lịch hẹn')
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi hủy lịch hẹn')
    }
  }

  if (!user) return null

  const upcoming = appointments?.filter((a) => ['SCHEDULED'].includes(a.status)) || []
  const past = appointments?.filter((a) => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status)) || []
  
  const displayList = activeTab === 'upcoming' ? upcoming : past

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Lịch hẹn của tôi
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Quản lý các buổi hẹn mentor 1:1 của bạn
        </p>
      </div>

      <div className="flex w-full overflow-x-auto rounded-2xl bg-white p-1 shadow-sm border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 lg:w-fit">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`h-11 px-6 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'upcoming'
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
          }`}
        >
          Sắp tới ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`h-11 px-6 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'past'
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
          }`}
        >
          Đã qua
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/60 dark:border-slate-800 shadow-sm min-h-[400px]">
        {isLoading ? (
          <div className="p-6 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-6">
                <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3 animate-pulse" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2 animate-pulse" />
                </div>
                <div className="w-24 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
              Không có lịch hẹn nào
            </h3>
            <p className="text-sm font-medium text-slate-500 max-w-sm">
              Bạn chưa có lịch hẹn {activeTab === 'upcoming' ? 'sắp tới' : 'nào trong quá khứ'}. Đặt lịch với Mentor để bắt đầu.
            </p>
            {activeTab === 'upcoming' && (
              <Link
                to="/mentors/recommended"
                className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                <Search className="w-4 h-4 mr-2" />
                Tìm Mentor
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {displayList.map((apt) => (
              <div key={apt.id} className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex gap-4">
                  <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
                      Mentor: {apt.mentorName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {new Date(apt.startTime).toLocaleString('vi-VN')}
                      </span>
                      <span>—</span>
                      <span>{new Date(apt.endTime).toLocaleTimeString('vi-VN')}</span>
                    </div>
                    {apt.notes && (
                      <p className="mt-2 text-sm text-slate-600 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        "{apt.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  {apt.status === 'SCHEDULED' && apt.meetingUrl && (
                    <a
                      href={apt.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 md:flex-none inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-50 text-emerald-600 px-4 text-sm font-bold transition hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400"
                    >
                      <Video className="w-4 h-4" />
                      Vào Meet
                    </a>
                  )}
                  {apt.status === 'SCHEDULED' && !apt.meetingUrl && (
                    <span className="flex-1 md:flex-none inline-flex h-10 items-center justify-center px-4 text-sm font-semibold text-slate-400 bg-slate-50 rounded-xl">
                      Đang đợi Link
                    </span>
                  )}
                  {apt.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleCancel(apt.id)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white text-rose-600 px-4 text-sm font-bold transition hover:bg-rose-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Hủy</span>
                    </button>
                  )}
                  {apt.status !== 'SCHEDULED' && (
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider
                      ${apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : ''}
                      ${apt.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' : ''}
                      ${apt.status === 'NO_SHOW' ? 'bg-rose-100 text-rose-700' : ''}
                    `}>
                      {apt.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
