import { useState, useRef, useEffect } from 'react'
import { Camera, RefreshCcw, Video, StopCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

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
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: false 
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      setError('Không thể truy cập camera. Vui lòng cấp quyền và thử lại.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const startRecording = () => {
    if (!stream) return
    
    chunksRef.current = []
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
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

    // Start countdown before recording
    setCountdown(3)
    let count = 3
    const countdownInterval = setInterval(() => {
      count--
      setCountdown(count)
      if (count === 0) {
        clearInterval(countdownInterval)
        // Start actual recording after countdown
        recorder.start()
        setRecording(true)
        setCountdown(null)
        
        // Auto stop after 3 seconds of recording
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop()
          }
        }, 3000)
      }
    }, 1000)
  }


  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      setCountdown(null)
    }
  }

  const handleConfirm = () => {
    if (videoBlob) {
      onCapture(videoBlob)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative aspect-video w-full max-w-xl overflow-hidden rounded-2xl bg-slate-900 shadow-xl">
        {/* Face Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <div className="w-[60%] h-[75%] border-4 border-dashed border-white/40 rounded-[100%] shadow-[0_0_0_9999px_rgba(15,23,42,0.5)]" />
        </div>

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
            <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
            <p className="text-sm font-bold">{error}</p>
            <button onClick={startCamera} className="mt-3 rounded-xl bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-white/20">
              Thử lại
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}

        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
            <div className="text-center">
              <span className="text-7xl font-black text-white drop-shadow-lg">{countdown}</span>
              <p className="mt-2 text-sm font-bold text-white">Chuẩn bị...</p>
            </div>
          </div>
        )}

        {recording && (
          <div className="absolute top-4 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-lg">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            Đang ghi hình
          </div>
        )}
      </div>

      <div className="w-full max-w-xl space-y-3">
        {!videoBlob ? (
          <button
            onClick={startRecording}
            disabled={recording || countdown !== null || !!error}
            className="group flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 py-3.5 text-base font-black text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none dark:shadow-none"
          >
            {countdown !== null ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang chuẩn bị...
              </>
            ) : recording ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang quay...
              </>
            ) : (
              <>
                <Video className="h-5 w-5" />
                Bắt đầu ghi hình
              </>
            )}
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => { setVideoBlob(null); startCamera(); }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white py-3.5 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Quay lại
            </button>
            <button
              onClick={handleConfirm}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 dark:shadow-none"
            >
              <CheckCircle2 className="h-4 w-4" />
              Xác nhận
            </button>
          </div>
        )}
        
        <p className="text-center text-xs font-medium text-slate-500">
          💡 Giữ khuôn mặt trong khung tròn. Video sẽ tự động ghi trong 3 giây.
        </p>
      </div>
    </div>
  )
}
