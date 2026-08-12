import { useQuery, useMutation } from 'react-query'
import { reviewApi } from '@/api/reviewApi'
import { useI18n } from '@/i18n/I18nProvider'
import { useAuthStore } from '@/store/authStore'
import { Star, ThumbsUp, ThumbsDown, CheckCircle, User, ChevronDown, MessageCircle, Award } from 'lucide-react'
import { formatRelativeTime } from '@/utils/formatters'
import { ReviewTargetType, ReviewResponse, ReviewSummaryResponse } from '@/types'
import { useState, useEffect } from 'react'
import ReviewForm from './ReviewForm'

interface Props {
  targetType: ReviewTargetType
  targetId: string
  summary?: ReviewSummaryResponse
}

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300 w-8 text-right">{value.toFixed(1)}</span>
    </div>
  )
}

function ReviewCard({ review }: { review: ReviewResponse }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  
  // Local state for optimistic UI (Facebook-style toggle)
  const [votedType, setVotedType] = useState<'helpful' | 'notHelpful' | null>(
    review.currentUserVote === true ? 'helpful' : review.currentUserVote === false ? 'notHelpful' : null
  )
  const [localHelpfulCount, setLocalHelpfulCount] = useState(review.helpfulCount)
  const [localNotHelpfulCount, setLocalNotHelpfulCount] = useState(review.notHelpfulCount)
  
  const { user } = useAuthStore()
  const { t, language } = useI18n()

  useEffect(() => {
    setVotedType(review.currentUserVote === true ? 'helpful' : review.currentUserVote === false ? 'notHelpful' : null)
    setLocalHelpfulCount(review.helpfulCount)
    setLocalNotHelpfulCount(review.notHelpfulCount)
  }, [review.currentUserVote, review.helpfulCount, review.notHelpfulCount])

  const voteMutation = useMutation(
    (isHelpful: boolean) => reviewApi.vote(review.id, isHelpful)
    // We don't invalidate queries here to avoid the server count immediately overwriting our optimistic local count,
    // since the server response doesn't include the current user's vote state to calculate the diff.
  )

  const handleVote = (isHelpful: boolean) => {
    if (!user) return
    const newType = isHelpful ? 'helpful' : 'notHelpful'
    
    if (votedType === newType) {
      // Toggle off (unlike / undislike)
      setVotedType(null)
      if (isHelpful) setLocalHelpfulCount(prev => Math.max(0, prev - 1))
      else setLocalNotHelpfulCount(prev => Math.max(0, prev - 1))
      voteMutation.mutate(isHelpful)
    } else {
      // Switch vote or new vote
      if (votedType === 'helpful') setLocalHelpfulCount(prev => Math.max(0, prev - 1))
      if (votedType === 'notHelpful') setLocalNotHelpfulCount(prev => Math.max(0, prev - 1))
      
      setVotedType(newType)
      if (isHelpful) setLocalHelpfulCount(prev => prev + 1)
      else setLocalNotHelpfulCount(prev => prev + 1)
      
      voteMutation.mutate(isHelpful)
    }
  }

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
    <div className="bg-white dark:bg-slate-950 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/30 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-600 dark:text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-gray-900 dark:text-gray-100 dark:text-white text-sm">
                {review.isAnonymous ? t('reviews.anonymous') : review.reviewerName}
              </h4>
              {review.isVerified && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 rounded-lg text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider">
                  <CheckCircle className="w-2.5 h-2.5" /> {t('reviews.verified')}
                </span>
              )}
              {review.isFeatured && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 dark:bg-amber-900/20 rounded-lg text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  <Award className="w-2.5 h-2.5" /> {t('reviews.featured')}
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
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 dark:text-white">{review.overallRating.toFixed(1)}</span>
              <span className="text-[10px] text-gray-400 font-medium">•</span>
              <span className="text-[10px] text-gray-400 font-medium">{formatRelativeTime(review.createdAt, language)}</span>
            </div>
          </div>
        </div>

        {/* Vote Buttons */}
        <div className="flex items-center gap-1 self-start sm:self-auto">
          {user?.userId === review.reviewerId && review.canBeEdited && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-emerald-100 dark:border-emerald-900/50 px-3 py-1.5 text-xs font-black text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:bg-emerald-900/30"
            >
              {t('reviews.edit')}
            </button>
          )}
          <button
            onClick={() => handleVote(true)}
            disabled={!user || voteMutation.isLoading}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed group ${
              votedType === 'helpful'
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                : 'border-gray-100 dark:border-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-800'
            }`}
          >
            <ThumbsUp className={`w-3 h-3 transition-colors ${
              votedType === 'helpful' ? 'text-green-500' : 'text-gray-400 group-hover:text-green-500'
            }`} />
            <span className={`text-xs font-bold transition-colors ${
              votedType === 'helpful' ? 'text-green-600' : 'text-gray-500 group-hover:text-green-600'
            }`}>{localHelpfulCount}</span>
          </button>
          <button
            onClick={() => handleVote(false)}
            disabled={!user || voteMutation.isLoading}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed group ${
              votedType === 'notHelpful'
                ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                : 'border-gray-100 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800'
            }`}
          >
            <ThumbsDown className={`w-3 h-3 transition-colors ${
              votedType === 'notHelpful' ? 'text-red-500' : 'text-gray-400 group-hover:text-red-500'
            }`} />
            <span className={`text-xs font-bold transition-colors ${
              votedType === 'notHelpful' ? 'text-red-600' : 'text-gray-500 group-hover:text-red-600'
            }`}>{localNotHelpfulCount}</span>
          </button>
        </div>
      </div>

      {/* Title */}
      {review.reviewTitle && (
        <h5 className="font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-2">{review.reviewTitle}</h5>
      )}

      {/* Review Text */}
      <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 leading-relaxed mb-3 whitespace-pre-wrap">
        {review.reviewText}
      </p>

      {/* Pros & Cons */}
      {(review.pros || review.cons) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {review.pros && (
            <div className="p-3 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
              <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                <ThumbsUp className="w-2.5 h-2.5" /> {t('reviews.pros')}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-300">{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div className="p-3 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <ThumbsDown className="w-2.5 h-2.5" /> {t('reviews.cons')}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-300">{review.cons}</p>
            </div>
          )}
        </div>
      )}

      {/* Detailed Ratings Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 hover:text-emerald-600 dark:text-emerald-500 transition-colors mt-2"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        {expanded ? t('reviews.hideDetails') : t('reviews.showDetails')}
      </button>

      {expanded && (
        <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900/50 dark:bg-gray-800/50 rounded-xl space-y-2 onb-fade-in-up">
          <RatingBar label={t('reviews.communication')} value={review.communicationRating} />
          <RatingBar label={t('reviews.quality')} value={review.qualityRating} />
          <RatingBar label={t('reviews.timeliness')} value={review.timelinessRating} />
          <RatingBar label={t('reviews.professionalism')} value={review.professionalismRating} />
          <RatingBar label={t('reviews.value')} value={review.valueRating} />
        </div>
      )}

      {/* Mentor Response */}
      {review.responseText && (
        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/50 dark:border-emerald-900/30 ml-4">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <MessageCircle className="w-2.5 h-2.5" /> {t('reviews.mentorResponse')}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400 leading-relaxed">{review.responseText}</p>
        </div>
      )}

      {/* Would Recommend */}
      {review.wouldRecommend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400">
          <ThumbsUp className="w-3 h-3" /> {t('reviews.wouldRecommend')}
        </div>
      )}
    </div>
  )
}

export default function ReviewList({ targetType, targetId, summary }: Props) {
  const [page, setPage] = useState(0)
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const pageSize = 10
  const { t, language } = useI18n()

  const { data, isLoading, isError, refetch } = useQuery(
    ['reviews', targetType, targetId, page, ratingFilter],
    () => reviewApi.getByTarget(targetType, targetId, {
      page,
      size: pageSize,
      rating: ratingFilter ?? undefined,
    })
  )
  const { data: fetchedSummary } = useQuery(
    ['review-summary', targetType, targetId],
    () => reviewApi.getSummaryByTarget(targetType, targetId),
    { enabled: !summary }
  )
  const reviewSummary = summary ?? fetchedSummary

  useEffect(() => {
    setPage(0)
    setRatingFilter(null)
  }, [targetId, targetType])

  const selectRating = (rating: number | null) => {
    setPage(0)
    setRatingFilter(rating)
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        {[1, 2].map(i => <div key={i} className="h-40 rounded-2xl bg-slate-100 dark:bg-slate-800" />)}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
        <MessageCircle className="mx-auto mb-3 h-9 w-9 text-slate-300 dark:text-slate-600" />
        <p className="font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">{t('reviews.loadError')}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-white dark:bg-slate-950 px-4 py-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-500/25 dark:bg-slate-900 dark:text-emerald-200"
        >
          {t('mentorProfile.retry')}
        </button>
      </div>
    )
  }

  const reviews = data?.content ?? []
  const totalReviews = reviewSummary?.totalReviews ?? data?.totalElements ?? 0
  const averageRating = Number(reviewSummary?.averageRating ?? 0)
  const ratingDist = [
    { stars: 5, count: reviewSummary?.fiveStarReviews ?? 0 },
    { stars: 4, count: reviewSummary?.fourStarReviews ?? 0 },
    { stars: 3, count: reviewSummary?.threeStarReviews ?? 0 },
    { stars: 2, count: reviewSummary?.twoStarReviews ?? 0 },
    { stars: 1, count: reviewSummary?.oneStarReviews ?? 0 },
  ].map(item => ({
    ...item,
    pct: totalReviews > 0 ? (item.count / totalReviews) * 100 : 0,
  }))

  if (totalReviews === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/50">
        <MessageCircle className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
        <p className="font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">{t('reviews.emptyTitle')}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400">{t('reviews.emptyDescription')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-center border-b border-slate-200 dark:border-slate-800 pb-5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6 dark:border-slate-800">
          <div className="text-5xl font-bold tracking-[-0.05em] text-slate-950 dark:text-white">
            {formatReviewRating(averageRating, language)}
          </div>
          <div className="mt-2 flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`h-4 w-4 ${s <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
            ))}
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-400">
            {t('reviews.count', { count: totalReviews })}
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 dark:text-slate-400">
              {t('reviews.filterLabel')}
            </p>
            <button
              type="button"
              onClick={() => selectRating(null)}
              aria-pressed={ratingFilter === null}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                ratingFilter === null
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {t('reviews.all')}
            </button>
          </div>
          {ratingDist.map(d => (
            <button
              type="button"
              key={d.stars}
              onClick={() => selectRating(d.stars)}
              aria-pressed={ratingFilter === d.stars}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors ${
                ratingFilter === d.stars
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 dark:bg-emerald-500/10'
                  : 'hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-800/70'
              }`}
            >
              <span className={`w-9 text-xs font-bold ${ratingFilter === d.stars ? 'text-emerald-700 dark:text-emerald-400 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
                {d.stars} ★
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <span
                  className={`block h-full rounded-full transition-[width] duration-500 ${
                    ratingFilter === d.stars ? 'bg-emerald-600' : 'bg-amber-400'
                  }`}
                  style={{ width: `${d.pct}%` }}
                />
              </span>
              <span className="w-7 text-right text-xs font-medium text-slate-400">{d.count}</span>
            </button>
          ))}
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {ratingFilter ? (
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-400">
              {t('reviews.filteredCount', {
                count: data?.totalElements ?? 0,
                rating: ratingFilter,
              })}
            </p>
          ) : null}
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <p className="font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">{t('reviews.noMatches')}</p>
          <button
            type="button"
            onClick={() => selectRating(null)}
            className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:text-emerald-200 dark:text-emerald-300"
          >
            {t('reviews.clearFilter')}
          </button>
        </div>
      )}

      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-800 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:bg-gray-900/50 dark:hover:bg-gray-800 transition-colors"
          >
            {t('reviews.previous')}
          </button>
          <span className="text-xs font-medium text-gray-400">
            {t('reviews.pageOf', { page: page + 1, total: data?.totalPages ?? 1 })}
          </span>
          <button
            onClick={() => setPage(p => Math.min((data?.totalPages ?? 1) - 1, p + 1))}
            disabled={page >= (data?.totalPages ?? 1) - 1}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-800 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:bg-gray-900/50 dark:hover:bg-gray-800 transition-colors"
          >
            {t('reviews.next')}
          </button>
        </div>
      )}
    </div>
  )
}

function formatReviewRating(value: number, language: 'en' | 'vi') {
  return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}
