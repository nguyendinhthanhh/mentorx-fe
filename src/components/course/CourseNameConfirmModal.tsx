import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

interface CourseNameConfirmModalProps {
  isOpen: boolean
  courseName: string
  title: string
  message: string
  confirmText: string
  confirmTone?: 'rose' | 'slate'
  isLoading?: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function CourseNameConfirmModal({
  isOpen,
  courseName,
  title,
  message,
  confirmText,
  confirmTone = 'rose',
  isLoading,
  onClose,
  onConfirm,
}: CourseNameConfirmModalProps) {
  const [typedName, setTypedName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setTypedName('')
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const normalizedExpected = courseName.trim().toLowerCase()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (typedName.trim().toLowerCase() !== normalizedExpected) {
      setError('Type the course name exactly to continue.')
      return
    }
    onConfirm()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">{title}</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{message}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close dialog">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Type the course name below to confirm.
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-amber-700">{courseName}</p>
        </div>

        <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Course name</label>
        <input
          value={typedName}
          onChange={(event) => {
            setTypedName(event.target.value)
            setError('')
          }}
          placeholder="Enter the course name exactly"
          autoFocus
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
        />
        {error && <p className="mt-2 text-xs font-bold text-rose-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60 ${
              confirmTone === 'rose' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmText}
          </button>
        </div>
      </form>
    </div>
  )
}
