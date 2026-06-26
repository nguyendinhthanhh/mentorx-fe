import { useEffect, useMemo, useState } from 'react'
import { MessageSquareReply, Search, Star, ThumbsUp, Flag } from 'lucide-react'
import toast from 'react-hot-toast'
import { reviewApi } from '@/api/reviewApi'
import { reportApi } from '@/api/reportApi'
import { useAuthStore } from '@/store/authStore'
import { ReviewResponse, ReviewTargetType, ReportTargetType } from '@/types'
import { formatDate } from '@/utils/formatters'
import { LoadingRows, MetricCard, PageShell, SelectInput, StateCard, TextInput, Toolbar } from './shared/MentorHubUI'

export default function MentorReviewsPage() {
  const { user } = useAuthStore()
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ratingFilter, setRatingFilter] = useState('ALL')
  const [sourceFilter, setSourceFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  const [reportCategory, setReportCategory] = useState('INAPPROPRIATE_CONTENT')
  const [reportReason, setReportReason] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  
  // Reply State
  const [replyingToReviewId, setReplyingToReviewId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  useEffect(() => {
    void loadReviews()
  }, [user?.userId])

  const loadReviews = async () => {
    if (!user?.userId) return
    try {
      setLoading(true)
      setError('')
      const page = await reviewApi.getByTarget(ReviewTargetType.MENTOR, user.userId, { page: 0, size: 100 })
      setReviews(page.content || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load mentor reviews.')
    } finally {
      setLoading(false)
    }
  }

  const handleReport = (id: string) => {
    setSelectedReviewId(id)
    setReportCategory('INAPPROPRIATE_CONTENT')
    setReportReason('')
    setReportModalOpen(true)
  }

  const submitReport = async () => {
    if (!selectedReviewId || !user?.userId) return
    if (!reportReason.trim()) {
      toast.error('Vui lòng nhập lý do báo cáo.')
      return
    }

    try {
      setIsSubmittingReport(true)
      await reportApi.createReport({
        reporterId: user.userId,
        targetType: ReportTargetType.REVIEW,
        targetId: selectedReviewId,
        reportCategory,
        reason: reportReason,
        reportedUserId: reviews.find(r => r.id === selectedReviewId)?.reviewerId,
      })
      toast.success('Đã gửi báo cáo thành công. Admin sẽ xem xét sớm nhất!')
      setReportModalOpen(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo.')
    } finally {
      setIsSubmittingReport(false)
    }
  }

  const submitReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi.')
      return
    }
    
    try {
      setIsSubmittingReply(true)
      const updatedReview = await reviewApi.respond(reviewId, replyText)
      setReviews(prev => prev.map(r => r.id === reviewId ? updatedReview : r))
      toast.success('Đã gửi phản hồi thành công!')
      setReplyingToReviewId(null)
      setReplyText('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi phản hồi.')
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const summary = useMemo(() => {
    const publicReviews = reviews.filter((review) => review.isPublic && !review.isHidden)
    const total = publicReviews.length
    const average = total > 0 ? publicReviews.reduce((sum, review) => sum + Number(review.overallRating || 0), 0) / total : 0
    const breakdown = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: publicReviews.filter((review) => Math.round(Number(review.overallRating || 0)) === rating).length,
    }))
    const replied = publicReviews.filter((review) => review.responseText).length
    return {
      total,
      average,
      breakdown,
      responseRate: total > 0 ? Math.round((replied / total) * 100) : 0,
      latest: publicReviews[0]?.createdAt,
    }
  }, [reviews])

  const filteredReviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return reviews
      .filter((review) => {
        const ratingMatches = ratingFilter === 'ALL' || Math.round(Number(review.overallRating || 0)) === Number(ratingFilter)
        const sourceMatches =
          sourceFilter === 'ALL' ||
          (sourceFilter === 'WITH_COMMENTS' && !!review.reviewText) ||
          (sourceFilter === 'UNREPLIED' && !review.responseText) ||
          String(review.targetType) === sourceFilter
        const haystack = [review.reviewerName, review.reviewTitle, review.reviewText, review.pros, review.cons].join(' ').toLowerCase()
        return ratingMatches && sourceMatches && (!query || haystack.includes(query))
      })
      .sort((a, b) => {
        if (sortBy === 'highest') return Number(b.overallRating || 0) - Number(a.overallRating || 0)
        if (sortBy === 'lowest') return Number(a.overallRating || 0) - Number(b.overallRating || 0)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [ratingFilter, reviews, searchQuery, sortBy, sourceFilter])

  return (
    <PageShell
      eyebrow="MentorHub"
      title="Reviews"
      description="See client feedback, ratings, and reputation signals from real review records."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Average rating" value={`${summary.average.toFixed(1)} / 5`} helper="Public mentor reviews only." icon={<Star className="h-5 w-5" />} tone="amber" />
        <MetricCard label="Total reviews" value={summary.total} helper="Visible, public feedback." icon={<MessageSquareReply className="h-5 w-5" />} />
        <MetricCard label="Response rate" value={`${summary.responseRate}%`} helper="Based on existing mentor replies." icon={<ThumbsUp className="h-5 w-5" />} tone="emerald" />
        <MetricCard label="Latest review" value={summary.latest ? formatDate(summary.latest) : 'None'} helper="No fake sentiment or AI summary." icon={<Star className="h-5 w-5" />} tone="slate" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Rating breakdown</h2>
          <div className="mt-5 space-y-4">
            {summary.breakdown.map((item) => (
              <div key={item.rating} className="grid grid-cols-[48px_1fr_32px] items-center gap-3">
                <span className="text-sm font-bold text-slate-700">{item.rating} star</span>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${summary.total > 0 ? (item.count / summary.total) * 100 : 0}%` }} />
                </div>
                <span className="text-right text-sm font-bold text-slate-500">{item.count}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-500">
            Bạn có thể phản hồi lại những đánh giá này để giải thích hoặc cảm ơn học viên/khách hàng. 
            <strong className="block mt-1 text-slate-700">Lưu ý: Mỗi đánh giá chỉ được phản hồi một lần duy nhất.</strong>
          </p>
        </aside>

        <section className="space-y-5">
          <Toolbar>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search review text or client name" className="w-full pl-11" />
            </div>
            <SelectInput value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)} className="w-full lg:w-40">
              <option value="ALL">All ratings</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </SelectInput>
            <SelectInput value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="w-full lg:w-48">
              <option value="ALL">All reviews</option>
              <option value="WITH_COMMENTS">With comments</option>
              <option value="UNREPLIED">Unreplied</option>
              <option value="JOB_CONTRACT">Contract reviews</option>
              <option value="COURSE">Course reviews</option>
            </SelectInput>
            <SelectInput value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="w-full lg:w-44">
              <option value="newest">Newest first</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
            </SelectInput>
          </Toolbar>

          {loading ? (
            <LoadingRows rows={4} />
          ) : error ? (
            <StateCard tone="error" title="Unable to load reviews" message={error} action={<button onClick={loadReviews} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Retry</button>} />
          ) : filteredReviews.length === 0 ? (
            <StateCard title="No reviews yet" message="Reviews will appear after clients complete contracts or learners finish courses." />
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700">
                        {getInitials(review.reviewerName)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-bold text-slate-950">{review.isAnonymous ? 'Anonymous client' : review.reviewerName}</h2>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600">{formatTargetType(review.targetType)}</span>
                        </div>
                        {review.targetTitle && review.targetTitle !== 'Unknown Target' && (
                          <div className="mt-1 text-[13px] font-medium text-slate-500">
                            Về: <span className="font-semibold text-slate-700">{review.targetTitle}</span>
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star key={index} className={`h-4 w-4 ${index < Math.round(Number(review.overallRating || 0)) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                          ))}
                          <span className="ml-2 text-xs font-bold text-slate-400">{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.isVerified ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Verified</span> : null}
                      <button 
                        onClick={() => handleReport(review.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        title="Báo cáo vi phạm"
                      >
                        <Flag className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {review.reviewTitle ? <h3 className="mt-5 text-base font-bold text-slate-900">{review.reviewTitle}</h3> : null}
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{review.reviewText || 'No written comment provided.'}</p>
                  {review.responseText ? (
                    <div className="mt-5 rounded-xl bg-indigo-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Phản hồi của bạn</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-indigo-900">{review.responseText}</p>
                    </div>
                  ) : replyingToReviewId === review.id ? (
                    <div className="mt-5 rounded-xl bg-slate-50 p-4">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Nhập nội dung phản hồi của bạn... (Chỉ được phản hồi 1 lần duy nhất)"
                        className="h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <div className="mt-3 flex justify-end gap-3">
                        <button
                          disabled={isSubmittingReply}
                          onClick={() => setReplyingToReviewId(null)}
                          className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Hủy
                        </button>
                        <button
                          disabled={isSubmittingReply || !replyText.trim()}
                          onClick={() => submitReply(review.id)}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {isSubmittingReply ? 'Đang gửi...' : 'Gửi phản hồi'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setReplyingToReviewId(review.id)
                        setReplyText('')
                      }}
                      className="mt-5 flex items-center gap-2 text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-700"
                    >
                      <MessageSquareReply className="h-4 w-4" />
                      Phản hồi đánh giá này
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Báo cáo vi phạm</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Vui lòng cung cấp chi tiết để giúp quản trị viên xử lý báo cáo này.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Phân loại</span>
                <SelectInput 
                  value={reportCategory} 
                  onChange={(e) => setReportCategory(e.target.value)} 
                  className="w-full"
                >
                  <option value="INAPPROPRIATE_CONTENT">Nội dung thô tục, khiếm nhã</option>
                  <option value="SPAM">Spam, quảng cáo</option>
                  <option value="HARASSMENT">Quấy rối, công kích cá nhân</option>
                  <option value="FALSE_INFORMATION">Thông tin sai sự thật</option>
                  <option value="OTHER">Lý do khác</option>
                </SelectInput>
              </label>
              
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Lý do chi tiết</span>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Mô tả rõ tại sao đánh giá này vi phạm tiêu chuẩn cộng đồng..."
                  className="h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={isSubmittingReport}
                onClick={() => setReportModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                disabled={isSubmittingReport}
                onClick={submitReport}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {isSubmittingReport ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

function getInitials(name?: string) {
  return (name || 'C')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatTargetType(type: string) {
  const labels: Record<string, string> = {
    MENTOR: 'Mentor',
    JOB_CONTRACT: 'Contract',
    COURSE: 'Course',
    CLIENT: 'Client',
  }
  return labels[type] || type.replace(/_/g, ' ').toLowerCase()
}
