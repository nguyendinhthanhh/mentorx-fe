import { useQuery, useMutation, useQueryClient } from 'react-query'
import { reviewApi } from '@/api/reviewApi'
import { useAuthStore } from '@/store/authStore'
import { Star, ThumbsUp, ThumbsDown, CheckCircle, User, ChevronDown, MessageCircle, Award } from 'lucide-react'
import { formatRelativeTime } from '@/utils/formatters'
import { ReviewTargetType, ReviewResponse } from '@/types'
import { useState } from 'react'
import ReviewForm from './ReviewForm'

interface Props {
  targetType: ReviewTargetType
  targetId: string
}

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-8 text-right">{value.toFixed(1)}</span>
    </div>
  )
}

function ReviewCard({ review }: { review: ReviewResponse }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const voteMutation = useMutation(
    (isHelpful: boolean) => reviewApi.vote(review.id, isHelpful),
    { onSuccess: () => queryClient.invalidateQueries(['reviews']) }
  )

  if (editing) {
    return (
      <ReviewForm
        targetType={review.targetType}
        targetId={review.targetId}
        initialReview={review}
        onClose={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                {review.isAnonymous ? 'Anonymous User' : review.reviewerName}
              </h4>
              {review.isVerified && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 rounded-lg text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider">
                  <CheckCircle className="w-2.5 h-2.5" /> Verified
                </span>
              )}
              {review.isFeatured && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  <Award className="w-2.5 h-2.5" /> Featured
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= Math.round(review.overallRating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200 dark:text-gray-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-white">{review.overallRating.toFixed(1)}</span>
              <span className="text-[10px] text-gray-400 font-medium">•</span>
              <span className="text-[10px] text-gray-400 font-medium">{formatRelativeTime(review.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Vote Buttons */}
        <div className="flex items-center gap-1">
          {user?.userId === review.reviewerId && review.canBeEdited && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-indigo-100 px-3 py-1.5 text-xs font-black text-indigo-600 hover:bg-indigo-50"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => user && voteMutation.mutate(true)}
            disabled={!user}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-800 transition-colors disabled:opacity-50 group"
          >
            <ThumbsUp className="w-3 h-3 text-gray-400 group-hover:text-green-500" />
            <span className="text-xs font-bold text-gray-500 group-hover:text-green-600">{review.helpfulCount}</span>
          </button>
          <button
            onClick={() => user && voteMutation.mutate(false)}
            disabled={!user}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 transition-colors disabled:opacity-50 group"
          >
            <ThumbsDown className="w-3 h-3 text-gray-400 group-hover:text-red-500" />
            <span className="text-xs font-bold text-gray-500 group-hover:text-red-600">{review.notHelpfulCount}</span>
          </button>
        </div>
      </div>

      {/* Title */}
      {review.reviewTitle && (
        <h5 className="font-bold text-gray-900 dark:text-white mb-2">{review.reviewTitle}</h5>
      )}

      {/* Review Text */}
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3 whitespace-pre-wrap">
        {review.reviewText}
      </p>

      {/* Pros & Cons */}
      {(review.pros || review.cons) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {review.pros && (
            <div className="p-3 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
              <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                <ThumbsUp className="w-2.5 h-2.5" /> Pros
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300">{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div className="p-3 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <ThumbsDown className="w-2.5 h-2.5" /> Cons
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300">{review.cons}</p>
            </div>
          )}
        </div>
      )}

      {/* Detailed Ratings Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors mt-2"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        {expanded ? 'Hide' : 'Show'} detailed ratings
      </button>

      {expanded && (
        <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-2 onb-fade-in-up">
          <RatingBar label="Communication" value={review.communicationRating} />
          <RatingBar label="Quality" value={review.qualityRating} />
          <RatingBar label="Timeliness" value={review.timelinessRating} />
          <RatingBar label="Professionalism" value={review.professionalismRating} />
          <RatingBar label="Value" value={review.valueRating} />
        </div>
      )}

      {/* Mentor Response */}
      {review.responseText && (
        <div className="mt-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30 ml-4">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <MessageCircle className="w-2.5 h-2.5" /> Response from Mentor
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{review.responseText}</p>
        </div>
      )}

      {/* Would Recommend */}
      {review.wouldRecommend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400">
          <ThumbsUp className="w-3 h-3" /> Would recommend this mentor
        </div>
      )}
    </div>
  )
}

export default function ReviewList({ targetType, targetId }: Props) {
  const [page, setPage] = useState(0)
  const pageSize = 10

  const { data, isLoading } = useQuery(
    ['reviews', targetType, targetId, page],
    () => reviewApi.getByTarget(targetType, targetId, { page, size: pageSize })
  )

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-50 dark:bg-gray-800 rounded-2xl" />)}
      </div>
    )
  }

  if (!data?.content?.length) {
    return (
      <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
        <MessageCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">No reviews yet</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Be the first to share your experience!</p>
      </div>
    )
  }

  // Calculate summary stats
  const reviews = data.content
  const avgRating = reviews.reduce((a, r) => a + r.overallRating, 0) / reviews.length
  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    stars: r,
    count: reviews.filter(rv => Math.round(rv.overallRating) === r).length,
    pct: (reviews.filter(rv => Math.round(rv.overallRating) === r).length / reviews.length) * 100,
  }))

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col sm:flex-row gap-8">
        <div className="text-center sm:text-left shrink-0">
          <div className="text-5xl font-black text-gray-900 dark:text-white">{avgRating.toFixed(1)}</div>
          <div className="flex gap-0.5 mt-2 justify-center sm:justify-start">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5 font-medium">{data.totalElements} reviews</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {ratingDist.map(d => (
            <div key={d.stars} className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-500 w-6">{d.stars}★</span>
              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-6 text-right">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Cards */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-gray-400">
            Page {page + 1} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))}
            disabled={page >= data.totalPages - 1}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
