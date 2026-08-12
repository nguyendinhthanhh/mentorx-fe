import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

type RevisionRequestModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (note: string) => void
  isLoading: boolean
}

export default function RevisionRequestModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: RevisionRequestModalProps) {
  const [note, setNote] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl shadow-xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-400 transition"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6 pt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Yêu cầu chỉnh sửa</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Mô tả lý do bạn muốn Mentor làm lại</p>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Lý do / Yêu cầu
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: File thiết kế còn thiếu màn hình trang chủ..."
              className="w-full h-32 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:bg-slate-900/50 transition"
            >
              Hủy
            </button>
            <button
              onClick={() => onSubmit(note)}
              disabled={isLoading || !note.trim()}
              className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
