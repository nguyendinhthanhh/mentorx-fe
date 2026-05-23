import { useState } from 'react'
import { AlertCircle, Check, CreditCard, UploadCloud, Video } from 'lucide-react'

import KycCamera from './KycCamera'

interface Props {
  onComplete: (data: { front: File; back?: File; video: File }) => void
  documentLabel?: string
  requiresBackImage?: boolean
}

export default function KycStepWizard({
  onComplete,
  documentLabel = 'Document',
  requiresBackImage = true,
}: Props) {
  const [activeStep, setActiveStep] = useState(1)
  const [files, setFiles] = useState<{ front?: File; back?: File; video?: File }>({})

  const finalStep = requiresBackImage ? 3 : 2

  const steps = [
    {
      id: 1,
      title: `${documentLabel} front`,
      icon: CreditCard,
      hint: 'Use a straight image with all corners visible.',
    },
    ...(requiresBackImage
      ? [
          {
            id: 2,
            title: `${documentLabel} back`,
            icon: CreditCard,
            hint: 'Use the same quality as the front image.',
          },
        ]
      : []),
    {
      id: finalStep,
      title: 'Liveness video',
      icon: Video,
      hint: 'Record about 5 seconds with slight head movement.',
    },
  ]

  const handleFileUpload = (step: 'front' | 'back', file: File) => {
    setFiles((prev) => ({ ...prev, [step]: file }))
    setActiveStep((prev) => prev + 1)
  }

  const handleVideoCapture = (blob: Blob) => {
    const videoFile = new File([blob], 'liveness.webm', { type: 'video/webm' })
    setFiles((prev) => {
      const next = { ...prev, video: videoFile }
      if (prev.front && (!requiresBackImage || prev.back)) {
        queueMicrotask(() => onComplete({ front: prev.front!, back: prev.back, video: videoFile }))
      }
      return next
    })
  }

  return (
    <div className="w-full space-y-8">
      <ol className="flex items-center justify-between gap-2 px-1">
        {steps.map((step, idx) => {
          const done = activeStep > step.id
          const current = activeStep === step.id
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  done
                    ? 'bg-emerald-600 text-white'
                    : current
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-200 dark:ring-indigo-900'
                      : 'border border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <div className="min-w-0 flex-1 max-sm:hidden">
                <p
                  className={`truncate text-xs font-medium ${
                    current ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {step.title}
                </p>
                <p className="truncate text-[10px] text-slate-500">{step.hint}</p>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`hidden h-px w-6 shrink-0 sm:block ${
                    done ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>

      <div className="min-h-[340px]">
        {activeStep === 1 && (
          <UploadStep
            title={`${documentLabel} front`}
            description="Upload a clear image or scan. Avoid glare, cropped corners, or blurry text."
            onUpload={(file) => handleFileUpload('front', file)}
          />
        )}

        {requiresBackImage && activeStep === 2 && (
          <UploadStep
            title={`${documentLabel} back`}
            description="Upload the back side or secondary document page with the same image quality."
            onUpload={(file) => handleFileUpload('back', file)}
          />
        )}

        {activeStep === finalStep && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Record a liveness video</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Keep your face inside the guide. Turn slightly left and right once so the liveness check can
                detect natural motion.
              </p>
            </div>
            <KycCamera onCapture={handleVideoCapture} onCancel={() => setActiveStep(finalStep - 1)} />
          </div>
        )}
      </div>

      {activeStep < finalStep && (
        <button
          type="button"
          onClick={() => setActiveStep((prev) => prev - 1)}
          disabled={activeStep === 1}
          className="text-xs font-medium text-slate-500 hover:text-indigo-600 disabled:pointer-events-none disabled:opacity-0 dark:hover:text-indigo-400"
        >
          Back
        </button>
      )}
    </div>
  )
}

function UploadStep({
  title,
  description,
  onUpload,
}: {
  title: string
  description: string
  onUpload: (file: File) => void
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center space-y-6 py-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
      </div>

      <label className="group flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 transition hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-slate-700 dark:bg-slate-900/30 dark:hover:border-indigo-800">
        <input
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onUpload(file)
            event.target.value = ''
          }}
        />
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition group-hover:text-indigo-600 dark:bg-slate-900 dark:ring-slate-700">
          <UploadCloud className="h-6 w-6" />
        </div>
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Choose image</span>
        <span className="mt-1 text-xs text-slate-500">JPEG, PNG, or WebP</span>
      </label>

      <div className="flex w-full items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100/90">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>Screenshots, virtual cards, or heavily edited images can be rejected during manual review.</span>
      </div>
    </div>
  )
}
