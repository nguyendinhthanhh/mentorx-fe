import { useState } from 'react'
import { Check, CreditCard, User, Video, UploadCloud, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import KycCamera from './KycCamera'

interface Props {
  onComplete: (data: { front: File; back: File; video: File }) => void
}

export default function KycStepWizard({ onComplete }: Props) {
  const [activeStep, setActiveStep] = useState(1)
  const [files, setFiles] = useState<{ front?: File; back?: File; video?: File }>({})

  const steps = [
    { id: 1, title: 'Mặt trước CCCD', icon: CreditCard, description: 'Chụp hoặc tải ảnh mặt trước thẻ' },
    { id: 2, title: 'Mặt sau CCCD', icon: CreditCard, description: 'Chụp hoặc tải ảnh mặt sau thẻ' },
    { id: 3, title: 'Xác thực sống', icon: Video, description: 'Ghi hình khuôn mặt trực tiếp' },
  ]

  const handleFileUpload = (step: 'front' | 'back', file: File) => {
    setFiles(prev => ({ ...prev, [step]: file }))
    setActiveStep(prev => prev + 1)
  }

  const handleVideoCapture = (blob: Blob) => {
    const videoFile = new File([blob], 'liveness.webm', { type: 'video/webm' })
    setFiles(prev => ({ ...prev, video: videoFile }))
    
    if (files.front && files.back) {
      onComplete({ front: files.front, back: files.back, video: videoFile })
    }
  }



  return (
    <div className="w-full space-y-8 p-1">
      {/* Step Indicators */}
      <div className="flex items-center justify-between px-2">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex flex-1 items-center">
            <div className={`flex flex-col items-center gap-2 ${idx === steps.length - 1 ? 'flex-initial' : 'flex-1'}`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 ${
                activeStep === step.id 
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-lg' 
                  : activeStep > step.id 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-100 text-slate-400'
              }`}>
                {activeStep > step.id ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${
                activeStep === step.id ? 'text-indigo-600' : 'text-slate-400'
              }`}>
                {step.title}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 rounded-full transition-colors duration-500 ${
                activeStep > step.id ? 'bg-emerald-500' : 'bg-slate-100'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Active Content */}
      <div className="min-h-[360px] animate-in fade-in slide-in-from-right-4 duration-500">
        {activeStep === 1 && (
          <UploadStep 
            title="Tải lên mặt trước" 
            description="Hãy đảm bảo ảnh rõ nét, không bị lóa sáng hoặc mất góc."
            onUpload={(f) => handleFileUpload('front', f)}
          />
        )}
        {activeStep === 2 && (
          <UploadStep 
            title="Tải lên mặt sau" 
            description="Chúng tôi cần cả hai mặt để xác minh thông tin đầy đủ."
            onUpload={(f) => handleFileUpload('back', f)}
          />
        )}
        {activeStep === 3 && (
          <div className="space-y-8 py-4">
            <div className="text-center">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">Xác thực khuôn mặt</h3>
              <p className="mt-2 text-base font-medium text-slate-500 italic">"Hãy nhìn thẳng vào camera và thực hiện theo hướng dẫn"</p>
            </div>

            <KycCamera 
              onCapture={handleVideoCapture}
              onCancel={() => setActiveStep(2)}
            />
          </div>
        )}
      </div>

      {activeStep < 3 && (
        <button
          type="button"
          onClick={() => setActiveStep(prev => prev - 1)}
          disabled={activeStep === 1}
          className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 disabled:opacity-0"
        >
          Quay lại bước trước
        </button>
      )}
    </div>
  )
}

function UploadStep({ title, description, onUpload }: { title: string; description: string; onUpload: (file: File) => void }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8">
      <div className="text-center">
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
        <p className="mt-2 max-w-xs text-sm font-medium leading-relaxed text-slate-500">{description}</p>
      </div>
      
      <label className="group relative flex h-56 w-full max-w-sm cursor-pointer flex-col items-center justify-center rounded-[2.5rem] border-4 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-indigo-400 hover:bg-indigo-50/50">
        <input 
          type="file" 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        />
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-indigo-200">
          <UploadCloud className="h-10 w-10" />
        </div>
        <p className="text-sm font-black text-slate-900">Click để chọn ảnh</p>
        <p className="mt-1 text-xs font-medium text-slate-500">Hoặc kéo thả file vào đây</p>
      </label>

      <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-[10px] font-black text-amber-700">
        <AlertCircle className="h-4 w-4" />
        ẢNH CẦN RÕ NÉT, ĐỦ 4 GÓC, ĐỊNH DẠNG JPG/PNG
      </div>
    </div>
  )
}
