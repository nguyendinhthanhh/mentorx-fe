import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

import type { AppointmentResponse } from '@/types'

type Props = {
  appointment: AppointmentResponse | null
  open: boolean
  isLoading?: boolean
  onClose: () => void
  onConfirm: (payload: { reason: string; note?: string }) => void
}

const CANCEL_REASON_OPTIONS = [
  'Tôi bị trùng lịch',
  'Tôi không còn nhu cầu cho buổi này',
  'Tôi muốn đổi sang khung giờ khác',
  'Mentor chưa phản hồi / chưa gửi thông tin cần thiết',
  'Lý do khác',
]

export default function AppointmentCancelModal({
  appointment,
  open,
  isLoading = false,
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setReason('')
      setNote('')
      setError('')
    }
  }, [open])

  if (!open || !appointment) {
    return null
  }

  const needsDetail = reason === 'Lý do khác'

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!reason) {
      setError('Vui lòng chọn lý do hủy.')
      return
    }

    if (needsDetail && !note.trim()) {
      setError('Vui lòng nhập lý do cụ thể.')
      return
    }

    setError('')
    onConfirm({
      reason,
      note: note.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-[560px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_80px_-35px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-rose-500">
              <AlertTriangle className="h-4 w-4" />
              Hủy lịch hẹn
            </div>
            <h2 className="mt-2 text-xl font-black text-slate-950">Chọn lý do hủy buổi hẹn</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {appointment.packageTitle || 'Buổi mentoring'} với {appointment.mentorName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Đóng hộp thoại hủy lịch"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-900">
            Hệ thống sẽ hoàn MXC về ví của bạn theo chính sách hủy hiện tại. Vui lòng chọn lý do rõ ràng để mentor và hệ thống có thể đối soát khi cần.
          </div>

          <div className="space-y-3">
            <p className="text-sm font-black text-slate-950">Lý do hủy</p>
            <div className="space-y-2">
              {CANCEL_REASON_OPTIONS.map((option) => {
                const checked = reason === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setReason(option)
                      setError('')
                    }}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      checked
                        ? 'border-rose-300 bg-rose-50 text-rose-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 h-4 w-4 rounded-full border ${
                        checked ? 'border-rose-500 bg-rose-500' : 'border-slate-300 bg-white'
                      }`}
                    />
                    <span className="text-sm font-semibold">{option}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-950">
              {needsDetail ? 'Mô tả lý do cụ thể' : 'Ghi chú thêm cho mentor'}
            </label>
            <textarea
              value={note}
              onChange={(event) => {
                setNote(event.target.value)
                setError('')
              }}
              rows={4}
              placeholder={
                needsDetail
                  ? 'Nhập lý do cụ thể để mentor hiểu vì sao bạn hủy buổi này...'
                  : 'Bạn có thể để lại ghi chú thêm nếu muốn mentor nắm rõ bối cảnh...'
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            />
          </div>

          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 text-sm font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Xác nhận hủy lịch
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
