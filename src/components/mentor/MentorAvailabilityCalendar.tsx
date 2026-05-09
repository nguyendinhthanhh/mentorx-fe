import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Calendar, Clock, Plus, Trash2, Loader2, CheckCircle2, X } from 'lucide-react'
import { mentorApi } from '@/api/mentorApi'

interface Props {
  userId: string
}

interface TimeSlot {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Thứ 2', short: 'T2' },
  { value: 2, label: 'Thứ 3', short: 'T3' },
  { value: 3, label: 'Thứ 4', short: 'T4' },
  { value: 4, label: 'Thứ 5', short: 'T5' },
  { value: 5, label: 'Thứ 6', short: 'T6' },
  { value: 6, label: 'Thứ 7', short: 'T7' },
  { value: 7, label: 'Chủ Nhật', short: 'CN' },
]

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
]

export default function MentorAvailabilityCalendar({ userId }: Props) {
  const queryClient = useQueryClient()
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [isAdding, setIsAdding] = useState(false)
  const [newSlot, setNewSlot] = useState<TimeSlot>({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    isActive: true
  })
  const [blockedDate, setBlockedDate] = useState('')

  const { data: weeklyAvailability, isLoading } = useQuery(
    ['mentor-availability', userId],
    () => mentorApi.getWeeklyAvailability(userId)
  )

  const createSlotMutation = useMutation(
    (slot: TimeSlot) => mentorApi.createAvailabilitySlot(userId, slot),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mentor-availability', userId])
        setIsAdding(false)
        setNewSlot({
          dayOfWeek: selectedDay,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true
        })
      }
    }
  )

  const deleteSlotMutation = useMutation(
    (slotId: string) => mentorApi.deleteAvailabilitySlot(userId, slotId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mentor-availability', userId])
      }
    }
  )

  const blockDateMutation = useMutation(
    (date: string) => mentorApi.blockDate(userId, date),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mentor-availability', userId])
        setBlockedDate('')
      }
    }
  )

  const unblockDateMutation = useMutation(
    (date: string) => mentorApi.unblockDate(userId, date),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mentor-availability', userId])
      }
    }
  )

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault()
    createSlotMutation.mutate({ ...newSlot, dayOfWeek: selectedDay })
  }

  const handleBlockDate = (e: React.FormEvent) => {
    e.preventDefault()
    if (blockedDate) {
      blockDateMutation.mutate(blockedDate)
    }
  }

  const getDaySlots = (day: number) => {
    return weeklyAvailability?.weeklySchedule?.[day] || []
  }

  const selectedDaySlots = getDaySlots(selectedDay)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary-600" />
          Lịch Trống Hàng Tuần
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Thiết lập lịch trống để học viên có thể đặt lịch mentoring với bạn
        </p>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        {/* Days Sidebar */}
        <div className="space-y-2">
          <h3 className="font-bold text-gray-900 mb-3">Chọn ngày</h3>
          {DAYS_OF_WEEK.map(day => {
            const daySlots = getDaySlots(day.value)
            return (
              <button
                key={day.value}
                onClick={() => setSelectedDay(day.value)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  selectedDay === day.value
                    ? 'bg-primary-50 border-primary-500 shadow-md'
                    : 'bg-white border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                    selectedDay === day.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {day.short}
                  </div>
                  <span className="font-bold text-gray-900">{day.label}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  daySlots.length > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {daySlots.length} slot
                </span>
              </button>
            )
          })}
        </div>

        {/* Time Slots */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">
              Khung giờ - {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}
            </h3>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                Thêm Khung Giờ
              </button>
            )}
          </div>

          {/* Add Slot Form */}
          {isAdding && (
            <form onSubmit={handleAddSlot} className="bg-primary-50 rounded-2xl p-5 border-2 border-primary-200">
              <h4 className="font-bold text-gray-900 mb-4">Thêm Khung Giờ Mới</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Giờ Bắt Đầu
                  </label>
                  <select
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Giờ Kết Thúc
                  </label>
                  <select
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={createSlotMutation.isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50"
                >
                  {createSlotMutation.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang thêm...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Thêm
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}

          {/* Existing Slots */}
          <div className="space-y-2">
            {selectedDaySlots.length > 0 ? (
              selectedDaySlots.map((slot: any) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-primary-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary-600" />
                    <div>
                      <div className="font-bold text-gray-900">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="text-xs text-gray-500">
                        {calculateDuration(slot.startTime, slot.endTime)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Xóa khung giờ này?')) {
                        deleteSlotMutation.mutate(slot.id)
                      }
                    }}
                    disabled={deleteSlotMutation.isLoading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  Chưa có khung giờ nào cho ngày này
                </p>
              </div>
            )}
          </div>

          {/* Blocked Dates Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Ngày Nghỉ / Không Nhận Lịch</h3>
            
            <form onSubmit={handleBlockDate} className="flex gap-3 mb-4">
              <input
                type="date"
                value={blockedDate}
                onChange={(e) => setBlockedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                required
              />
              <button
                type="submit"
                disabled={blockDateMutation.isLoading}
                className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {blockDateMutation.isLoading ? 'Đang block...' : 'Block Ngày'}
              </button>
            </form>

            <div className="space-y-2">
              {weeklyAvailability?.blockedDates?.map((date: string) => (
                <div
                  key={date}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl"
                >
                  <span className="font-bold text-red-900">
                    {new Date(date).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <button
                    onClick={() => unblockDateMutation.mutate(date)}
                    disabled={unblockDateMutation.isLoading}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-xl disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="font-black text-blue-900 mb-3">💡 Tips quản lý lịch</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Cập nhật lịch trống mỗi tuần để tăng khả năng được đặt</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Nên có ít nhất 10-15 slots/tuần để linh hoạt</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Block ngày nghỉ trước ít nhất 1 tuần</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Khung giờ phổ biến: 9h-12h, 14h-17h, 19h-21h</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

function calculateDuration(start: string, end: string): string {
  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  const duration = endMinutes - startMinutes
  
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h`
  } else {
    return `${minutes}m`
  }
}
