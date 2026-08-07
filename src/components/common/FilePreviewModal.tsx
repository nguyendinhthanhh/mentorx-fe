import { X, Download, ExternalLink } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  fileUrl: string
  fileName: string
  fileType: string
}

export default function FilePreviewModal({ isOpen, onClose, fileUrl, fileName, fileType }: FilePreviewModalProps) {
  const isImage = fileType.toLowerCase().includes('image') || fileUrl.match(/\.(jpeg|jpg|gif|png)$/i)
  const isPdf = fileType.toLowerCase().includes('pdf') || fileUrl.match(/\.pdf$/i)
  
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-[60] w-full max-w-5xl translate-x-[-50%] translate-y-[-50%] p-4 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="relative flex h-[85vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="min-w-0 flex-1">
                <Dialog.Title className="truncate text-lg font-bold text-slate-900">
                  {fileName}
                </Dialog.Title>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">Mở trong tab mới</span>
                </a>
                <Dialog.Close asChild>
                  <button className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-100 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20">
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-slate-100/50 p-4 sm:p-6 overflow-hidden flex items-center justify-center">
              {isImage ? (
                <div className="relative h-full w-full">
                  <img
                    src={fileUrl}
                    alt={fileName}
                    className="h-full w-full object-contain drop-shadow-md"
                  />
                </div>
              ) : isPdf ? (
                <iframe
                  src={`${fileUrl}#toolbar=0`}
                  title={fileName}
                  className="h-full w-full rounded-xl border border-slate-200 bg-white shadow-sm"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-500 shadow-inner">
                    <Download className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Không có bản xem trước</h3>
                  <p className="mt-2 text-sm text-slate-500 max-w-sm">
                    Không thể xem trước định dạng file này trong trình duyệt. Bạn có thể mở trong tab mới để tải về.
                  </p>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    <Download className="h-4 w-4" />
                    Tải file về
                  </a>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
