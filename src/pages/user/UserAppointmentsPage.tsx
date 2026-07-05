import { useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarDays, Clock, Search, Video, XCircle } from 'lucide-react'

import { appointmentApi } from '@/api/appointmentApi'
import AppointmentCancelModal from '@/components/appointment/AppointmentCancelModal'
import { useAuthStore } from '@/store/authStore'
import type { AppointmentResponse } from '@/types'
import { formatMxc } from '@/utils/formatters'

export default function UserAppointmentsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [appointmentToCancel, setAppointmentToCancel] = useState<AppointmentResponse | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  const { data: appointments, isLoading, refetch } = useQuery(
    ['userAppointments', user?.userId],
    () => appointmentApi.getMyAppointments(),
    { enabled: !!user?.userId, staleTime: 5 * 60 * 1000 }
  )

  const handleCancel = async (payload: { reason: string; note?: string }) => {
    if (!appointmentToCancel) return

    try {
      setCancelLoading(true)
      await appointmentApi.cancelAppointment(appointmentToCancel.id, payload)
      toast.success('Đã hủy lịch hẹn')
      queryClient.invalidateQueries(['wallet-balance', user?.userId])
      queryClient.invalidateQueries(['userBalance', user?.userId])
      queryClient.invalidateQueries(['wallets', user?.userId])
      queryClient.invalidateQueries(['transactions', user?.userId])
      queryClient.invalidateQueries(['userTransactions', user?.userId])
      queryClient.invalidateQueries(['appointment-bookable-slots'])
      setAppointmentToCancel(null)
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi hủy lịch hẹn')
    } finally {
      setCancelLoading(false)
    }
  }

  if (!user) return null

  const upcoming = appointments?.filter((appointment) => appointment.status === 'SCHEDULED') || []
  const past = appointments?.filter((appointment) => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status)) || []
  const displayList = activeTab === 'upcoming' ? upcoming : past

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Lịch hẹn của tôi</h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Quản lý các buổi hẹn mentor 1:1 và theo dõi trạng thái hoàn tiền khi cần hủy lịch.
        </p>
      </div>

      <div className="flex w-full overflow-x-auto rounded-2xl border border-slate-200/60 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:w-fit">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`h-11 rounded-xl px-6 text-sm font-bold transition-all ${
            activeTab === 'upcoming'
              ? 'bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-500/20 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
          }`}
        >
          Sắp tới ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`h-11 rounded-xl px-6 text-sm font-bold transition-all ${
            activeTab === 'past'
              ? 'bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-500/20 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
          }`}
        >
          Đã qua
        </button>
      </div>

      <div className="min-h-[400px] rounded-[24px] border border-slate-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="space-y-6 p-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-6">
                <div className="h-14 w-14 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-1/3 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-1/2 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
              <CalendarDays className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-black text-slate-900 dark:text-white">Không có lịch hẹn nào</h3>
            <p className="max-w-sm text-sm font-medium text-slate-500">
              Bạn chưa có lịch hẹn {activeTab === 'upcoming' ? 'sắp tới' : 'nào trong quá khứ'}. Đặt lịch với mentor để bắt đầu.
            </p>
            {activeTab === 'upcoming' ? (
              <Link
                to="/mentors/recommended"
                className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                <Search className="mr-2 h-4 w-4" />
                Tìm mentor
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {displayList.map((appointment) => (
              <div
                key={appointment.id}
                className="flex flex-col items-start justify-between gap-6 p-6 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 md:flex-row md:items-center"
              >
                <div className="flex gap-4">
                  <div className="hidden h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 sm:flex">
                    <CalendarDays className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="mb-1 text-base font-black text-slate-900 dark:text-white">
                      Mentor: {appointment.mentorName}
                    </h3>

                    {appointment.packageTitle ? (
                      <p className="mb-2 text-sm font-semibold text-indigo-600">
                        {appointment.packageTitle}
                        {appointment.priceMxc != null ? ` • ${formatMxc(appointment.priceMxc, 'vi')}` : ''}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {new Date(appointment.startTime).toLocaleString('vi-VN')}
                      </span>
                      <span>•</span>
                      <span>{new Date(appointment.endTime).toLocaleTimeString('vi-VN')}</span>
                    </div>

                    {appointment.notes ? (
                      <p className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/50">
                        "{appointment.notes}"
                      </p>
                    ) : null}

                    {appointment.status === 'CANCELLED' && appointment.cancellationReason ? (
                      <p className="mt-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                        Lý do hủy: {appointment.cancellationReason}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex w-full items-center gap-3 md:w-auto">
                  {appointment.status === 'SCHEDULED' && appointment.meetingUrl ? (
                    <a
                      href={appointment.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 text-sm font-bold text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 md:flex-none"
                    >
                      <Video className="h-4 w-4" />
                      Vào Meet
                    </a>
                  ) : null}

                  {appointment.status === 'SCHEDULED' && !appointment.meetingUrl ? (
                    <span className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-slate-50 px-4 text-sm font-semibold text-slate-400 md:flex-none">
                      Đang đợi link
                    </span>
                  ) : null}

                  {appointment.status === 'SCHEDULED' ? (
                    <button
                      onClick={() => setAppointmentToCancel(appointment)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Hủy</span>
                    </button>
                  ) : (
                    <span
                      className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider ${
                        appointment.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : ''
                      } ${
                        appointment.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' : ''
                      } ${
                        appointment.status === 'NO_SHOW' ? 'bg-rose-100 text-rose-700' : ''
                      }`}
                    >
                      {appointment.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AppointmentCancelModal
        appointment={appointmentToCancel}
        open={Boolean(appointmentToCancel)}
        isLoading={cancelLoading}
        onClose={() => {
          if (!cancelLoading) {
            setAppointmentToCancel(null)
          }
        }}
        onConfirm={handleCancel}
      />
    </div>
  )
}
