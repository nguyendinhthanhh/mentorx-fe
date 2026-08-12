import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

import { useI18n } from '@/i18n/I18nProvider'

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
  const { t } = useI18n()
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
      setError(t('courseConfirm.nameMismatch'))
      return
    }
    onConfirm()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{title}</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">{message}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300" aria-label="Close dialog">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-sm font-semibold text-amber-900 dark:text-amber-100">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t('courseConfirm.instructions')}
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">{courseName}</p>
        </div>

        <label className="block text-xs font-black uppercase tracking-widest text-slate-400">{t('courseConfirm.courseName')}</label>
        <input
          value={typedName}
          onChange={(event) => {
            setTypedName(event.target.value)
            setError('')
          }}
          placeholder={t('courseConfirm.placeholder')}
          autoFocus
          className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
        />
        {error && <p className="mt-2 text-xs font-bold text-rose-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50"
          >
            {t('courseConfirm.cancel')}
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
