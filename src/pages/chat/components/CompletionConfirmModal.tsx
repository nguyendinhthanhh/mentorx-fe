import { CheckCircle2, X } from 'lucide-react'

type CompletionConfirmModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

export default function CompletionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: CompletionConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6 pt-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 mb-2">Báo cáo hoàn thành</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Bạn có chắc chắn đã bàn giao đầy đủ sản phẩm cho người dùng trong đoạn chat? 
            Sau khi xác nhận, người dùng sẽ được thông báo để nghiệm thu và thanh toán.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? 'Đang gửi...' : 'Xác nhận'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
