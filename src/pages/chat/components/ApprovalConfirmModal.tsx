import { CheckCircle2, X } from 'lucide-react'

type ApprovalConfirmModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  amount: number
}

export default function ApprovalConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  amount,
}: ApprovalConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600"
          disabled={isLoading}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 pt-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>

          <h2 className="mb-2 text-xl font-bold text-slate-900">Nghiệm thu & Thanh toán</h2>
          <p className="mb-6 leading-relaxed text-sm text-slate-500">
            Bạn có chắc chắn sản phẩm đã đạt yêu cầu và đồng ý giải ngân <strong className="text-slate-700">{amount} MXC</strong> cho mentor? Hành động này không thể hoàn tác.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex flex-1 items-center justify-center rounded-xl bg-emerald-600 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading ? 'Đang xử lý...' : 'Đồng ý & Thanh toán'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
