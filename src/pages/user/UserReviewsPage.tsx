import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { ArrowRight, MessageSquareReply, Star, History, Users, Edit3 } from 'lucide-react'
import { reviewApi } from '@/api/reviewApi'
import { appointmentApi } from '@/api/appointmentApi'
import { useAuthStore } from '@/store/authStore'
import { ReviewResponse, ReviewTargetType, AppointmentStatus } from '@/types'
import { formatDate } from '@/utils/formatters'
import ReviewForm from '@/components/review/ReviewForm'

export default function UserReviewsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'PENDING'>('HISTORY')
  const [reviewingMentor, setReviewingMentor] = useState<{ id: string; name: string } | null>(null)

  const { data: historyData, isLoading: isLoadingHistory } = useQuery(
    ['user-reviews', user?.userId],
    () => reviewApi.getByReviewer(user!.userId, { page: 0, size: 50 }),
    { enabled: !!user?.userId && activeTab === 'HISTORY' }
  )

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery(
    ['user-appointments', user?.userId],
    () => appointmentApi.getUserAppointments(user!.userId),
    { enabled: !!user?.userId && activeTab === 'PENDING' }
  )

  const reviews = historyData?.content || []

  // Get unique mentors from completed appointments
  const pendingMentors = appointments
    ? Array.from(
        new Map(
          appointments
            .filter((a) => a.status === AppointmentStatus.COMPLETED)
            .map((a) => [a.mentorId, { id: a.mentorId, name: a.mentorName }])
        ).values()
      )
    : []

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Star className="h-3.5 w-3.5 fill-current" />
              Đánh giá
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-gray-950 dark:text-white">Đánh giá của tôi</h1>
            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              Quản lý các đánh giá bạn đã viết hoặc viết đánh giá cho mentor đã làm việc.
            </p>
          </div>
          <Link
            to="/mentors"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-black text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300"
          >
            Tìm mentor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="mt-6 flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
              activeTab === 'HISTORY'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <History className="h-4 w-4" />
            Lịch sử đánh giá
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
              activeTab === 'PENDING'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Users className="h-4 w-4" />
            Mentor đã làm việc
          </button>
        </div>
      </div>

      {activeTab === 'HISTORY' && (
        <>
          {isLoadingHistory ? (
            <ReviewSkeleton />
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <EmptyReviews />
          )}
        </>
      )}

      {activeTab === 'PENDING' && (
        <>
          {isLoadingAppointments ? (
            <ReviewSkeleton />
          ) : pendingMentors.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingMentors.map((mentor) => (
                <div key={mentor.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-950">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-lg font-black text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                      {mentor.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{mentor.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Đã hoàn thành lịch hẹn</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setReviewingMentor(mentor)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                  >
                    <Edit3 className="h-4 w-4" />
                    Viết đánh giá
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-slate-950">
              <Users className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-700" />
              <h2 className="mt-4 text-xl font-black text-gray-950 dark:text-white">Chưa có mentor nào</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
                Bạn chưa hoàn thành lịch hẹn nào với các mentor. Hãy đặt lịch và trải nghiệm ngay!
              </p>
            </div>
          )}
        </>
      )}

      {/* Write Review Modal */}
      {reviewingMentor && (
        <div className="relative z-50">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setReviewingMentor(null)} />
          <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-950">
              <ReviewForm
                targetType={ReviewTargetType.MENTOR}
                targetId={reviewingMentor.id}
                onClose={() => setReviewingMentor(null)}
                onSuccess={() => {
                  setReviewingMentor(null)
                  setActiveTab('HISTORY')
                }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function ReviewCard({ review }: { review: ReviewResponse }) {
  const getTargetName = () => {
    switch (review.targetType) {
      case 'MENTOR': return 'Mentor'
      case 'COURSE': return 'Khóa học'
      case 'JOB': return 'Dự án / Công việc'
      default: return review.targetType
    }
  }
  
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:border-gray-800 dark:bg-slate-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-gray-950 dark:text-white">
              Đánh giá cho {getTargetName()}
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {review.targetType}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={`h-4 w-4 ${
                  index < Math.round(Number(review.overallRating || 0))
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-200 dark:text-gray-700'
                }`}
              />
            ))}
            <span className="ml-2 text-xs font-bold text-gray-400">{formatDate(review.createdAt)}</span>
          </div>
        </div>
        {review.isVerified && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            Đã xác thực
          </span>
        )}
      </div>
      
      {review.reviewTitle && (
        <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">{review.reviewTitle}</h3>
      )}
      
      <p className="mt-3 text-sm font-medium leading-6 text-gray-600 dark:text-gray-300">
        {review.reviewText || 'Không có bình luận chi tiết.'}
      </p>
      
      {(review.pros || review.cons) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {review.pros && (
            <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/20">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Ưu điểm</p>
              <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-200">{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-950/20">
              <p className="text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">Nhược điểm</p>
              <p className="mt-1 text-sm text-rose-900 dark:text-rose-200">{review.cons}</p>
            </div>
          )}
        </div>
      )}

      {review.responseText && (
        <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
          <div className="flex items-center gap-2">
            <MessageSquareReply className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Phản hồi
            </p>
          </div>
          <p className="mt-2 text-sm font-medium leading-6 text-indigo-900 dark:text-indigo-200">
            {review.responseText}
          </p>
        </div>
      )}
    </article>
  )
}

function ReviewSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-950">
          <div className="flex flex-col gap-3">
            <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-slate-800" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-slate-800" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-slate-800" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyReviews() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-slate-950">
      <Star className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-700" />
      <h2 className="mt-4 text-xl font-black text-gray-950 dark:text-white">Bạn chưa viết đánh giá nào</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
        Sau khi hoàn thành khóa học hoặc dự án, bạn có thể viết đánh giá để chia sẻ trải nghiệm của mình.
      </p>
      <Link
        to="/mentors"
        className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-700"
      >
        Tìm Mentor ngay
      </Link>
    </div>
  )
}
