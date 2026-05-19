import { useState } from 'react'
import { X, AlertCircle, Loader2 } from 'lucide-react'

interface ArchiveReasonModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  isLoading?: boolean
  title?: string
  message?: string
  confirmText?: string
}

export default function ArchiveReasonModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading,
  title = "Archive Item",
  message = "This item will be hidden from public view. The owner will be notified with this reason.",
  confirmText = "Confirm Archive"
}: ArchiveReasonModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please provide a reason for archiving this job.')
      return
    }
    onConfirm(reason)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/30">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h2>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Reason required for moderation</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl flex items-start gap-3 text-amber-700 dark:text-amber-400 text-xs font-bold leading-relaxed">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              {message}
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Reason</label>
              <textarea 
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  setError('')
                }}
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500/30 transition-all text-sm font-medium min-h-[120px] resize-none"
                placeholder="Please explain why..."
                autoFocus
              />
              {error && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-1">{error}</p>}
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className="flex-[2] py-4 rounded-2xl bg-rose-600 text-white text-sm font-black uppercase tracking-widest hover:bg-rose-700 disabled:opacity-50 transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
