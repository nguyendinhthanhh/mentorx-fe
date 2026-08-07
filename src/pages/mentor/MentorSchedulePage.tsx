import { FormEvent, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { CalendarDays, Clock3, MessageCircle, Plus, Save, Trash2, Users } from 'lucide-react'
import { mentorApi } from '@/api/mentorApi'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useQueryClient } from 'react-query'
import { LoadingRows, MetricCard, PageShell, SelectInput, StateCard, StatusPill, TextInput, Toolbar } from './shared/MentorHubUI'
import { appointmentApi } from '@/api/appointmentApi'
import { formatMxc } from '@/utils/formatters'

type AvailabilitySlot = {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive?: boolean
}

const days = [
  { value: 1, label: 'Thứ Hai' },
  { value: 2, label: 'Thứ Ba' },
  { value: 3, label: 'Thứ Tư' },
  { value: 4, label: 'Thứ Năm' },
  { value: 5, label: 'Thứ Sáu' },
  { value: 6, label: 'Thứ Bảy' },
  { value: 7, label: 'Chủ Nhật' },
]

export default function MentorSchedulePage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'calendar' | 'upcoming' | 'availability' | 'past'>('availability')
  const [draft, setDraft] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' })

  useEffect(() => {
    void loadSchedule()
  }, [user?.userId])

  const loadSchedule = async () => {
    if (!user?.userId) return
    try {
      setLoading(true)
      setError('')
      const weekly = await mentorApi.getWeeklyAvailability(user.userId)
      const flattened = Object.entries(weekly.weeklySchedule || {}).flatMap(([day, daySlots]) =>
        (daySlots as AvailabilitySlot[]).map((slot) => ({
          ...slot,
          dayOfWeek: Number(slot.dayOfWeek ?? day),
        }))
      )
      setSlots(flattened)
      setBlockedDates(weekly.blockedDates || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải lịch trình mentor.')
    } finally {
      setLoading(false)
    }
  }

  const { data: appointments, refetch: refetchAppointments } = useQuery(
    ['mentorAppointments', user?.userId],
    () => appointmentApi.getMyMentorAppointments(),
    { enabled: !!user?.userId }
  )

  const handleUpdateMeetingUrl = async (id: string) => {
    const url = prompt('Nhập link Google Meet / Zoom cho cuộc hẹn này:')
    if (!url) return
    try {
      await appointmentApi.updateMeetingUrl(id, url)
      toast.success('Đã cập nhật link meeting')
      queryClient.invalidateQueries(['userBalance'])
      queryClient.invalidateQueries(['wallets'])
      queryClient.invalidateQueries(['transactions'])
      queryClient.invalidateQueries(['userTransactions'])
      queryClient.invalidateQueries(['appointment-bookable-slots'])
      queryClient.invalidateQueries(['userBalance'])
      queryClient.invalidateQueries(['wallets'])
      queryClient.invalidateQueries(['transactions'])
      queryClient.invalidateQueries(['userTransactions'])
      queryClient.invalidateQueries(['appointment-bookable-slots'])
      refetchAppointments()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleComplete = async (id: string) => {
    if (!window.confirm('Xác nhận đã hoàn thành cuộc hẹn này?')) return
    try {
      await appointmentApi.completeAppointment(id)
      toast.success('Đã đánh dấu hoàn thành')
      refetchAppointments()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleCancel = async (id: string) => {
    if (!window.confirm('Xác nhận hủy cuộc hẹn này?')) return
    try {
      await appointmentApi.cancelAppointment(id, { reason: 'Mentor chủ động hủy lịch' })
      toast.success('Đã hủy lịch hẹn')
      refetchAppointments()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const activeSlots = useMemo(() => slots.filter((slot) => slot.isActive !== false), [slots])
  const slotsByDay = useMemo(() => {
    return days.map((day) => ({
      ...day,
      slots: activeSlots
        .filter((slot) => Number(slot.dayOfWeek) === day.value)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
  }, [activeSlots])

  const addSlot = async (event: FormEvent) => {
    event.preventDefault()
    if (!user?.userId) return
    if (draft.startTime >= draft.endTime) {
      toast.error('Thời gian kết thúc phải sau thời gian bắt đầu.')
      return
    }
    try {
      setSaving(true)
      await mentorApi.createAvailabilitySlot(user.userId, {
        dayOfWeek: draft.dayOfWeek,
        startTime: draft.startTime,
        endTime: draft.endTime,
        isActive: true,
      })
      toast.success('Đã lưu lịch làm việc.')
      await loadSchedule()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể lưu lịch làm việc.')
    } finally {
      setSaving(false)
    }
  }

  const deleteSlot = async (slot: AvailabilitySlot) => {
    if (!user?.userId || !slot.id) return
    try {
      setSaving(true)
      await mentorApi.deleteAvailabilitySlot(user.userId, slot.id)
      toast.success('Đã xóa lịch làm việc.')
      await loadSchedule()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa lịch làm việc.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell
      eyebrow="MentorHub"
      title="Lịch trình"
      description="Quản lý lịch trình làm việc và các cuộc hẹn của bạn."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Cuộc hẹn sắp tới" value={appointments?.filter(a => a.status === 'SCHEDULED').length.toString() || '0'} helper="Các buổi sắp diễn ra." icon={<CalendarDays className="h-5 w-5" />} />
        <MetricCard label="Đã hoàn thành" value={appointments?.filter(a => a.status === 'COMPLETED').length.toString() || '0'} helper="Hoàn thành thành công." icon={<Users className="h-5 w-5" />} tone="amber" />
        <MetricCard label="Khung giờ trống" value={activeSlots.length} helper="Các khung giờ cố định hàng tuần." icon={<Clock3 className="h-5 w-5" />} tone="emerald" />
        <MetricCard label="Ngày bị khóa" value={blockedDates.length} helper="Các ngày không nhận lịch." icon={<CalendarDays className="h-5 w-5" />} tone="slate" />
      </div>

      <Toolbar>
        <div className="scrollbar-hide flex w-full overflow-x-auto rounded-2xl bg-slate-100 p-1 lg:w-auto">
          {[
            ['calendar', 'Lịch'],
            ['upcoming', 'Sắp tới'],
            ['availability', 'Thiết lập khung giờ'],
            ['past', 'Đã qua'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`h-10 whitespace-nowrap rounded-xl px-4 text-sm font-bold transition ${activeTab === key ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm font-semibold text-slate-500 lg:ml-auto">
          Múi giờ: {Intl.DateTimeFormat().resolvedOptions().timeZone || 'Múi giờ trình duyệt'}
        </p>
      </Toolbar>

      {loading ? (
        <LoadingRows rows={4} />
      ) : error ? (
        <StateCard tone="error" title="Không thể tải lịch trình" message={error} action={<button onClick={loadSchedule} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Thử lại</button>} />
      ) : activeTab === 'availability' ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Lịch làm việc hàng tuần</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Các buổi đã được đặt không hiển thị ở đây. Trang này chỉ quản lý các khung giờ trống cố định.</p>
              </div>
              <StatusPill label={`${activeSlots.length} khung giờ`} tone="indigo" />
            </div>
            <div className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200">
              {slotsByDay.map((day) => (
                <div key={day.value} className="flex flex-col gap-3 sm:flex-row sm:items-center p-4 transition-colors hover:bg-slate-50/50">
                  <div className="w-32 shrink-0">
                    <p className="text-sm font-bold text-slate-900">{day.label}</p>
                  </div>
                  {day.slots.length === 0 ? (
                    <p className="text-sm font-medium text-slate-400 italic">Không có lịch</p>
                  ) : (
                    <div className="flex flex-1 flex-wrap gap-2">
                      {day.slots.map((slot, index) => (
                        <span key={slot.id || `${day.value}-${index}`} className="group inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-700/10">
                          {slot.startTime} - {slot.endTime}
                          {slot.id ? (
                            <button disabled={saving} onClick={() => deleteSlot(slot)} className="text-emerald-400 opacity-0 transition-opacity hover:text-rose-600 group-hover:opacity-100" aria-label="Remove slot">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={addSlot} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Thêm khung giờ</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">Quản lý thời gian rảnh của bạn trong tuần.</p>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ngày</span>
                <SelectInput value={draft.dayOfWeek} onChange={(event) => setDraft({ ...draft, dayOfWeek: Number(event.target.value) })} className="mt-2 w-full">
                  {days.map((day) => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </SelectInput>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bắt đầu</span>
                  <TextInput type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} className="mt-2 w-full" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kết thúc</span>
                  <TextInput type="time" value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} className="mt-2 w-full" />
                </label>
              </div>
              <button disabled={saving} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? <Save className="h-4 w-4 animate-pulse" /> : <Plus className="h-4 w-4" />}
                Lưu
              </button>
            </div>
          </form>
        </div>
      ) : activeTab === 'calendar' ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-7">
            {slotsByDay.map((day) => (
              <div key={day.value} className="min-h-[160px] rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-950">{day.label}</p>
                <div className="mt-4 space-y-2">
                  {day.slots.length === 0 ? (
                    <p className="text-xs font-semibold text-slate-400">Trống</p>
                  ) : (
                    day.slots.map((slot, index) => (
                      <div key={slot.id || index} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'upcoming' || activeTab === 'past' ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950 mb-4">{activeTab === 'upcoming' ? 'Sắp tới' : 'Đã qua'}</h2>
          <div className="space-y-4">
            {(appointments || [])
              .filter(a => activeTab === 'upcoming' ? a.status === 'SCHEDULED' : a.status !== 'SCHEDULED')
              .map(apt => (
                <div key={apt.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">User: {apt.userName}</h3>
                    {apt.packageTitle && (
                      <p className="mt-1 text-sm font-semibold text-emerald-600">
                        {apt.packageTitle}
                        {apt.priceMxc != null ? ` • ${formatMxc(apt.priceMxc, 'vi')}` : ''}
                      </p>
                    )}
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      {new Date(apt.startTime).toLocaleString('vi-VN')} — {new Date(apt.endTime).toLocaleTimeString('vi-VN')}
                      {apt.status === 'CANCELLED' && apt.updatedAt && <p className="text-xs font-medium text-slate-400 ml-2">Đã hủy vào {new Date(apt.updatedAt).toLocaleDateString('vi-VN')}</p>}
                    </p>
                    {apt.notes && <p className="text-sm text-slate-600 mt-2 bg-white p-3 rounded-xl border border-slate-200">Ghi chú: {apt.notes}</p>}
                    {apt.meetingUrl && <p className="text-sm font-semibold text-emerald-600 mt-2 hover:underline"><a href={apt.meetingUrl} target="_blank" rel="noreferrer">Link Meeting</a></p>}
                  </div>
                  <div className="flex gap-2">
                    {apt.status === 'SCHEDULED' && (
                      <>
                        <button onClick={() => handleUpdateMeetingUrl(apt.id)} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg hover:bg-emerald-200 transition">Sửa Link</button>
                        <button onClick={() => handleComplete(apt.id)} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg hover:bg-emerald-200 transition">Hoàn Thành</button>
                        <button onClick={() => handleCancel(apt.id)} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-rose-100 hover:text-rose-700 transition ring-1 ring-inset ring-slate-200 hover:ring-rose-200">Hủy</button>
                      </>
                    )}
                    {apt.status !== 'SCHEDULED' && (
                      <span className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg uppercase">{apt.status}</span>
                    )}
                  </div>
                </div>
              ))}
              {(appointments || []).filter(a => activeTab === 'upcoming' ? a.status === 'SCHEDULED' : a.status !== 'SCHEDULED').length === 0 && (
                <p className="text-sm text-slate-500">Không có lịch hẹn nào.</p>
              )}
          </div>
        </div>
      ) : null}
    </PageShell>
  )
}
