import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { reviewApi } from '@/api/reviewApi'
import { useAuthStore } from '@/store/authStore'
import { ReviewResponse, ReviewTargetType } from '@/types'
import { Star, Send, X, Eye, EyeOff, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'

interface Props {
  targetType: ReviewTargetType
  targetId: string
  initialReview?: ReviewResponse
  onClose?: () => void
  onSuccess?: () => void
}

const RATING_LABELS = ['Terrible', 'Poor', 'Average', 'Good', 'Excellent']
const SUB_RATINGS = [
  { key: 'communicationRating', label: 'Communication' },
  { key: 'qualityRating', label: 'Quality' },
  { key: 'timelinessRating', label: 'Timeliness' },
  { key: 'professionalismRating', label: 'Professionalism' },
  { key: 'valueRating', label: 'Value for Money' },
] as const

export default function ReviewForm({ targetType, targetId, initialReview, onClose, onSuccess }: Props) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [overallRating, setOverallRating] = useState(initialReview?.overallRating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [subRatings, setSubRatings] = useState<Record<string, number>>({
    communicationRating: initialReview?.communicationRating || 0,
    qualityRating: initialReview?.qualityRating || 0,
    timelinessRating: initialReview?.timelinessRating || 0,
    professionalismRating: initialReview?.professionalismRating || 0,
    valueRating: initialReview?.valueRating || 0,
  })
  const [hoverSub, setHoverSub] = useState<Record<string, number>>({})
  const [reviewTitle, setReviewTitle] = useState(initialReview?.reviewTitle || '')
  const [reviewText, setReviewText] = useState(initialReview?.reviewText || '')
  const [pros, setPros] = useState(initialReview?.pros || '')
  const [cons, setCons] = useState(initialReview?.cons || '')
  const [isAnonymous, setIsAnonymous] = useState(initialReview?.isAnonymous || false)
  const [wouldRecommend, setWouldRecommend] = useState(initialReview?.wouldRecommend ?? true)
  const [error, setError] = useState('')
  const editing = !!initialReview

  const mutation = useMutation(
    (data: any) => editing ? reviewApi.update(initialReview!.id, data) : reviewApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reviews', targetType, targetId])
        queryClient.invalidateQueries(['my-reviews', user?.userId])
        queryClient.invalidateQueries(['course', targetId])
        onSuccess?.()
        onClose?.()
      },
      onError: (err: any) => {
        setError(err?.response?.data?.message || 'Failed to save review. Please try again.')
      },
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) { setError('Please login to submit a review.'); return }
    if (overallRating === 0) { setError('Please select an overall rating.'); return }
    if (!reviewText.trim()) { setError('Please write your review.'); return }

    mutation.mutate({
      reviewerId: user.userId,
      targetType,
      targetId,
      overallRating,
      communicationRating: subRatings.communicationRating || overallRating,
      qualityRating: subRatings.qualityRating || overallRating,
      timelinessRating: subRatings.timelinessRating || overallRating,
      professionalismRating: subRatings.professionalismRating || overallRating,
      valueRating: subRatings.valueRating || overallRating,
      reviewTitle: reviewTitle.trim() || undefined,
      reviewText: reviewText.trim(),
      pros: pros.trim() || undefined,
      cons: cons.trim() || undefined,
      isAnonymous,
      isPublic: true,
      language: 'EN',
    })
  }

  const displayRating = hoverRating || overallRating

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 shadow-sm onb-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-gray-900 dark:text-white">{editing ? 'Edit Review' : 'Write a Review'}</h3>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div className="text-center py-4">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Overall Rating</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setOverallRating(s)}
                className="p-1 transition-transform hover:scale-125"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    s <= displayRating
                      ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                      : 'text-gray-200 dark:text-gray-700'
                  }`}
                />
              </button>
            ))}
          </div>
          {displayRating > 0 && (
            <p className="mt-2 text-sm font-bold text-amber-600 dark:text-amber-400">
              {RATING_LABELS[displayRating - 1]}
            </p>
          )}
        </div>

        {/* Sub Ratings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
          <p className="col-span-full text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Detailed Ratings (Optional)</p>
          {SUB_RATINGS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoverSub(prev => ({ ...prev, [key]: s }))}
                    onMouseLeave={() => setHoverSub(prev => ({ ...prev, [key]: 0 }))}
                    onClick={() => setSubRatings(prev => ({ ...prev, [key]: s }))}
                    className="p-0.5"
                  >
                    <Star
                      className={`w-4 h-4 transition-colors ${
                        s <= (hoverSub[key] || subRatings[key] || 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-200 dark:text-gray-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Review Title</label>
          <input
            type="text"
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            placeholder="Summarize your experience..."
            maxLength={200}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
          />
        </div>

        {/* Review Text */}
        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
            Your Review <span className="text-red-400">*</span>
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this course..."
            rows={4}
            maxLength={2000}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all resize-none"
          />
          <p className="text-right text-xs text-gray-400 mt-1">{reviewText.length}/2000</p>
        </div>

        {/* Pros & Cons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black text-green-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <ThumbsUp className="w-3 h-3" /> Pros
            </label>
            <textarea
              value={pros}
              onChange={(e) => setPros(e.target.value)}
              placeholder="What did you like?"
              rows={2}
              maxLength={1000}
              className="w-full px-4 py-3 bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-black text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <ThumbsDown className="w-3 h-3" /> Cons
            </label>
            <textarea
              value={cons}
              onChange={(e) => setCons(e.target.value)}
              placeholder="What could be better?"
              rows={2}
              maxLength={1000}
              className="w-full px-4 py-3 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              isAnonymous
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {isAnonymous ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {isAnonymous ? 'Posting Anonymously' : 'Post with Name'}
          </button>

          <button
            type="button"
            onClick={() => setWouldRecommend(!wouldRecommend)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              wouldRecommend
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            {wouldRecommend ? 'Would Recommend' : 'Not Recommended'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isLoading || overallRating === 0}
          className="w-full py-4 bg-indigo-600 text-white font-black text-sm rounded-2xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
        >
          {mutation.isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : (
            <><Send className="w-4 h-4" /> {editing ? 'Save Review' : 'Submit Review'}</>
          )}
        </button>
      </form>
    </div>
  )
}
