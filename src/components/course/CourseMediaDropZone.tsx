import { Image, Trash2, Upload, Video } from 'lucide-react'

export type CourseMediaKind = 'image' | 'video'

export function CourseMediaDropZone({ label, kind, file, mediaUrl, onFile, onClear }: {
  label: string
  kind: CourseMediaKind
  file?: File | null
  mediaUrl: string
  onFile: (file: File) => void
  onClear: () => void
}) {
  const inputId = `course-${kind}-${label.toLowerCase().replace(/\s+/g, '-')}`
  const accept = kind === 'image' ? 'image/*' : 'video/*'

  const handleFiles = (files: FileList | null) => {
    const selectedFile = files?.[0]
    if (selectedFile) onFile(selectedFile)
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-bold text-slate-700">{label}</p>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          handleFiles(event.dataTransfer.files)
        }}
        className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 transition hover:border-indigo-300"
      >
        {mediaUrl ? (
          <div className="space-y-3">
            {kind === 'image' ? (
              <img src={mediaUrl} alt="" className="aspect-video w-full rounded-lg bg-white object-cover" />
            ) : (
              <video src={mediaUrl} controls className="aspect-video w-full rounded-lg bg-black" />
            )}
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-semibold text-slate-700">{file?.name || label}</p>
              <button type="button" onClick={onClear} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Remove file">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <label htmlFor={inputId} className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg bg-white px-4 py-6 text-center">
            {kind === 'image' ? <Image className="mb-3 h-8 w-8 text-indigo-500" /> : <Video className="mb-3 h-8 w-8 text-indigo-500" />}
            <span className="text-sm font-semibold text-slate-900">Drop a file here or click to browse</span>
            <span className="mt-1 text-xs text-slate-500">{kind === 'image' ? 'Image up to 5 MB' : 'Video up to 200 MB'}</span>
            <span className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">
              <Upload className="h-3.5 w-3.5" />
              Choose file
            </span>
          </label>
        )}
        <input id={inputId} type="file" accept={accept} className="hidden" onChange={(event) => handleFiles(event.target.files)} />
      </div>
    </div>
  )
}

export function validateCourseMedia(file: File, kind: CourseMediaKind) {
  if (kind === 'image') {
    if (!file.type.startsWith('image/')) return 'Course thumbnail must be an image file.'
    if (file.size > 5 * 1024 * 1024) return 'Course thumbnail must be 5 MB or smaller.'
  }
  if (kind === 'video') {
    if (!file.type.startsWith('video/')) return 'Preview video must be a video file.'
    if (file.size > 200 * 1024 * 1024) return 'Preview video must be 200 MB or smaller.'
  }
  return ''
}
