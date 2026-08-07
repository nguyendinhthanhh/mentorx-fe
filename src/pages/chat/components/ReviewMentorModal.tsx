import { X } from 'lucide-react'
import ReviewForm from '@/components/review/ReviewForm'
import { ReviewTargetType } from '@/types'

type ReviewMentorModalProps = {
  isOpen: boolean
  onClose: () => void
  mentorId: string
  onSuccess: () => void
}

export default function ReviewMentorModal({
  isOpen,
  onClose,
  mentorId,
  onSuccess,
}: ReviewMentorModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl my-8">
        <div className="absolute right-0 top-0 -translate-y-12 translate-x-0 sm:translate-x-12 sm:translate-y-0">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ReviewForm 
          targetType={ReviewTargetType.MENTOR} 
          targetId={mentorId} 
          onClose={onClose} 
          onSuccess={onSuccess} 
        />
      </div>
    </div>
  )
}
