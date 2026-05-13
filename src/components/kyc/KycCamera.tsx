import { useState, useRef, useEffect } from 'react'
import { Video, RefreshCcw, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react'

interface Props {
  onCapture: (videoBlob: Blob) => void
  onCancel: () => void
}

export default function KycCamera({ onCapture, onCancel }: Props) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recording, setRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    void startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24, max: 30 },
        },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('Camera error:', err)
      setError('Không thể mở camera. Vui lòng cấp quyền trình duyệt và thử lại.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
  }

  const startRecording = () => {
    if (!stream) return

    chunksRef.current = []
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm'
    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_500_000 })
    } catch {
      recorder = new MediaRecorder(stream, { mimeType: mime })
    }
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setVideoBlob(blob)
      setRecording(false)
      setCountdown(null)
    }

    setCountdown(3)
    let count = 3
    const countdownInterval = setInterval(() => {
      count -= 1
      setCountdown(count)
      if (count === 0) {
        clearInterval(countdownInterval)
        recorder.start(100)
        setRecording(true)
        setCountdown(null)
        // Đủ dài để backend đọc nhiều khung WebM tuần tự (đừng ngắn hơn ~4s).
        setTimeout(() => {
          if (recorder.state === 'recording') recorder.stop()
        }, 5200)
      }
    }, 1000)
  }

  const handleConfirm = () => {
    if (videoBlob) onCapture(videoBlob)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative aspect-video w-full max-w-xl overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-200/60 dark:ring-slate-800">
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="h-[72%] w-[58%] rounded-[999px] border-2 border-dashed border-white/50 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
        </div>

        {error ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950/90 p-6 text-center text-white">
            <AlertCircle className="h-9 w-9 text-amber-400" />
            <p className="max-w-xs text-sm">{error}</p>
            <button
              type="button"
              onClick={() => void startCamera()}
              className="rounded-lg bg-white/10 px-4 py-2 text-xs font-medium hover:bg-white/20"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        )}

        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
            <div className="text-center">
              <span className="text-6xl font-semibold tabular-nums text-white drop-shadow-md">{countdown}</span>
              <p className="mt-2 text-sm text-white/90">Chuẩn bị quay</p>
            </div>
          </div>
        )}

        {recording && (
          <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-medium text-white shadow-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Đang ghi
          </div>
        )}
      </div>

      <div className="flex w-full max-w-xl flex-col gap-3">
        {!videoBlob ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={recording || countdown !== null || !!error}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            {countdown !== null ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang đếm…
              </>
            ) : recording ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang quay (~5s)
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                Bắt đầu quay video
              </>
            )}
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setVideoBlob(null)
                void startCamera()
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCcw className="h-4 w-4" />
              Quay lại
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Gửi video này
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p className="flex-1 leading-relaxed">
            Video chỉ dùng để kiểm tra có chuyển động thật; không thay thế xác minh thủ công khi cần.
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X className="h-3.5 w-3.5" />
            Hủy
          </button>
        </div>
      </div>
    </div>
  )
}
