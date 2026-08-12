import * as Dialog from '@radix-ui/react-dialog'
import { AlertCircle, Loader2, X } from 'lucide-react'

import { useI18n } from '@/i18n/I18nProvider'

interface JobCancelConfirmModalProps {
  isOpen: boolean
  isLoading?: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function JobCancelConfirmModal({
  isOpen,
  isLoading = false,
  onClose,
  onConfirm,
}: JobCancelConfirmModalProps) {
  const { t } = useI18n()

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4 focus:outline-none">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-lg font-bold text-slate-950 dark:text-slate-100">
                  {t('jobs.cancelConfirm.title')}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {t('jobs.cancelConfirm.description')}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={isLoading}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={t('common.close')}
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-900">
              {t('jobs.cancelConfirm.note')}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={isLoading}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:bg-slate-900/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? t('jobs.cancelConfirm.loading') : t('jobs.cancelConfirm.confirm')}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
