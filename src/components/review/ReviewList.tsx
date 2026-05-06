import { useQuery } from 'react-query'
import { reviewApi } from '@/api/reviewApi'
import { Star, ThumbsUp, CheckCircle, User } from 'lucide-react'
import { formatRelativeTime } from '@/utils/formatters'
import { ReviewTargetType } from '@/types'

interface Props {
  targetType: ReviewTargetType
  targetId: string
}

export default function ReviewList({ targetType, targetId }: Props) {
  const { data, isLoading } = useQuery(['reviews', targetType, targetId], () =>
    reviewApi.getByTarget(targetType, targetId)
  )

  if (isLoading) {
    return <div className="space-y-4 animate-pulse">
      {[1, 2].map(i => <div key={i} className="h-40 bg-gray-50 rounded-2xl" />)}
    </div>
  }

  if (!data?.content.length) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <p className="text-gray-500">No reviews yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {data.content.map((review) => (
        <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{review.isAnonymous ? 'Anonymous' : review.reviewerName}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= Math.round(review.overallRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {formatRelativeTime(review.createdAt)}
                  </span>
                  {review.isVerified && (
                    <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-bold uppercase tracking-wider">
                      <CheckCircle className="w-2.5 h-2.5" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <ThumbsUp className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-600">{review.helpfulCount}</span>
            </button>
          </div>

          {review.reviewTitle && (
            <h5 className="font-bold text-gray-900 mb-2">{review.reviewTitle}</h5>
          )}
          
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{review.reviewText}</p>

          {(review.pros || review.cons) && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
              {review.pros && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Pros</p>
                  <p className="text-xs text-gray-700">{review.pros}</p>
                </div>
              )}
              {review.cons && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Cons</p>
                  <p className="text-xs text-gray-700">{review.cons}</p>
                </div>
              )}
            </div>
          )}

          {review.responseText && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 ml-4 relative">
              <div className="absolute top-0 left-4 -translate-y-1/2 border-8 border-transparent border-b-gray-50" />
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Response from Mentor</p>
              <p className="text-xs text-gray-600">{review.responseText}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
