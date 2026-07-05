import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { CalendarDays, Clock3, Loader2, Wallet, X } from 'lucide-react'

import { appointmentApi } from '@/api/appointmentApi'
import { walletApi } from '@/api/walletApi'
import { AppointmentResponse, AppointmentSlotResponse, MentorPackageResponse } from '@/types'
import { formatMxc } from '@/utils/formatters'

type Props = {
  open: boolean
  mentorName: string
  mentorUserId: string
  packageItem: MentorPackageResponse | null
  userId?: string
  onClose: () => void
  onBooked: (appointment: AppointmentResponse) => void
}

export default function SingleSessionBookingModal({
  open,
  mentorName,
  mentorUserId,
  packageItem,
  userId,
  onClose,
  onBooked,
}: Props) {
  const queryClient = useQueryClient()
  const [selectedStartTime, setSelectedStartTime] = useState('')
  const [notes, setNotes] = useState('')

  const { data: slots = [], isLoading: slotsLoading, refetch: refetchSlots } = useQuery(
    ['appointment-bookable-slots', mentorUserId, packageItem?.id],
    () => appointmentApi.getBookableSlots(mentorUserId, packageItem!.id, 14),
    {
      enabled: open && Boolean(mentorUserId && packageItem?.id),
      staleTime: 30 * 1000,
    }
  )

  const { data: balance } = useQuery(
    ['wallet-balance', userId],
    () => walletApi.getUserBalance(userId!),
    {
      enabled: open && Boolean(userId),
      staleTime: 30 * 1000,
    }
  )

  useEffect(() => {
    if (!open) {
      setSelectedStartTime('')
      setNotes('')
      return
    }

    if (!selectedStartTime && slots.length > 0) {
      setSelectedStartTime(slots[0].startTime)
    }
  }, [open, selectedStartTime, slots])

  const bookMutation = useMutation(
    () => appointmentApi.bookAppointment({
      mentorPackageId: packageItem!.id,
      startTime: selectedStartTime,
      notes: notes.trim() || undefined,
    }),
    {
      onSuccess: (appointment) => {
        queryClient.invalidateQueries(['wallet-balance', userId])
        queryClient.invalidateQueries(['userAppointments', userId])
        queryClient.invalidateQueries(['appointment-bookable-slots', mentorUserId, packageItem?.id])
        toast.success('Đã đặt lịch và giữ tiền trong escrow.')
        onBooked(appointment)
      },
      onError: async (error: any) => {
        const status = error?.response?.status

        if (!error?.response) {
          toast.error('Không kết nối được tới máy chủ. Kiểm tra backend và thử lại.')
        } else if (status === 403) {
          toast.error('Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại rồi thử lại.')
        } else if (status === 409) {
          toast.error(error.response?.data?.message || 'Khung giờ này vừa thay đổi. Hệ thống sẽ tải lại danh sách slot.')
        } else {
          toast.error(error.response?.data?.message || 'Không thể đặt lịch ở khung giờ này.')
        }

        await refetchSlots()
      },
    }
  )

  const groupedSlots = useMemo(() => {
    return slots.reduce<Record<string, AppointmentSlotResponse[]>>((acc, slot) => {
      const key = new Date(slot.startTime).toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
      })
      acc[key] = acc[key] || []
      acc[key].push(slot)
      return acc
    }, {})
  }, [slots])

  const availableBalance = Number(balance?.available || 0)
  const price = Number(packageItem?.priceMxc || 0)
  const hasEnoughBalance = availableBalance >= price
  const canSubmit = Boolean(packageItem && selectedStartTime && hasEnoughBalance && !bookMutation.isLoading)

  if (!open || !packageItem) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/55 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-6">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-[980px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_-35px_rgba(15,23,42,0.45)] sm:max-h-[calc(100vh-3rem)]">
        <div className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-500">Đặt lịch trực tiếp</p>
              <h2 className="mt-1 text-lg font-black text-slate-950 sm:text-xl">{packageItem.title}</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {mentorName} • {packageItem.durationHours}h • {formatMxc(packageItem.priceMxc, 'vi')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              aria-label="Đóng hộp thoại đặt lịch"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid items-start gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                <h3 className="text-sm font-black text-slate-950">Luồng thanh toán</h3>
                <div className="mt-3 space-y-2 text-sm font-medium leading-6 text-slate-600">
                  <p>1. Bấm đặt buổi, hệ thống sẽ giữ {formatMxc(packageItem.priceMxc, 'vi')} từ ví MXC của bạn vào escrow.</p>
                  <p>2. Hệ thống tạo lịch hẹn, lưu snapshot gói dịch vụ và khung giờ bạn đã chọn.</p>
                  <p>3. Khi mentor hoàn thành buổi hẹn, tiền mới được chuyển sang ví chờ rút của mentor.</p>
                  <p>4. Nếu hủy trước giờ bắt đầu theo chính sách, tiền sẽ được hoàn về ví MXC của bạn.</p>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
                  <CalendarDays className="h-4 w-4 text-indigo-600" />
                  Chọn khung giờ trống
                </div>

                {slotsLoading ? (
                  <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tải khung giờ có thể đặt...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-500">
                    Mentor hiện chưa có khung giờ phù hợp cho gói này trong 14 ngày tới.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedSlots).map(([dayLabel, daySlots]) => (
                      <div key={dayLabel}>
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{dayLabel}</p>
                        <div className="flex flex-wrap gap-2">
                          {daySlots.map((slot) => {
                            const active = selectedStartTime === slot.startTime
                            return (
                              <button
                                key={slot.startTime}
                                type="button"
                                onClick={() => setSelectedStartTime(slot.startTime)}
                                className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold transition ${
                                  active
                                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
                                }`}
                              >
                                <Clock3 className="h-4 w-4" />
                                {formatSlotRange(slot)}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="mt-5 block">
                <span className="text-sm font-black text-slate-950">Ghi chú cho mentor</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Mục tiêu buổi gặp, CV hoặc link repo, chủ đề bạn muốn mentor chuẩn bị..."
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </label>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-0">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-black text-slate-950">
                  <Wallet className="h-4 w-4 text-indigo-600" />
                  Ví MXC của bạn
                </div>
                <div className="mt-4 space-y-3">
                  <Metric label="Số dư khả dụng" value={formatMxc(availableBalance, 'vi')} />
                  <Metric label="Giá gói" value={formatMxc(price, 'vi')} />
                </div>
                {!hasEnoughBalance && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                    Số dư hiện tại chưa đủ để đặt buổi này.
                    <Link to="/wallet" className="mt-3 inline-flex rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700">
                      Nạp thêm MXC
                    </Link>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-black text-slate-950">Xác nhận</h3>
                <div className="mt-3 space-y-3 text-sm font-medium text-slate-600">
                  <p>Gói dịch vụ: <span className="font-bold text-slate-900">{packageItem.title}</span></p>
                  <p>Thời lượng: <span className="font-bold text-slate-900">{packageItem.durationHours} giờ</span></p>
                  <p>Khung giờ: <span className="font-bold text-slate-900">{selectedStartTime ? formatFullSlot(selectedStartTime) : 'Chưa chọn'}</span></p>
                </div>
                <button
                  type="button"
                  onClick={() => bookMutation.mutate()}
                  disabled={!canSubmit}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bookMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Đặt buổi và giữ tiền
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  )
}

function formatSlotRange(slot: AppointmentSlotResponse) {
  const start = new Date(slot.startTime)
  const end = new Date(slot.endTime)
  return `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
}

function formatFullSlot(startTime: string) {
  return new Date(startTime).toLocaleString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
