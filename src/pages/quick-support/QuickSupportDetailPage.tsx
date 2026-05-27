import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  UserCheck,
  MessageSquare,
  Star,
  DollarSign,
  Send,
  Loader2,
  ThumbsUp,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { quickSupportApi } from '@/api/quickSupportApi'
import { useAuthStore } from '@/store/authStore'
import { QuickSupportStatus } from '@/types'

const STATUS_FLOW = [
  QuickSupportStatus.PENDING,
  QuickSupportStatus.MATCHED,
  QuickSupportStatus.IN_PROGRESS,
  QuickSupportStatus.COMPLETED,
]

export default function QuickSupportDetailPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [ratingForm, setRatingForm] = useState({ rating: 5, feedback: '', issueResolved: true })
  const [cancelReason, setCancelReason] = useState('')

  const { data: request, isLoading } = useQuery(
    ['quick-support', requestId],
    () => quickSupportApi.getById(requestId!),
    { enabled: !!requestId }
  )

  const isClient = request?.clientId === user?.userId
  const isMentor = request?.mentorId === user?.userId
  const statusIdx = request ? STATUS_FLOW.indexOf(request.status) : -1

  const invalidate = () => queryClient.invalidateQueries(['quick-support', requestId])

  const acceptMutation = useMutation(
    () => quickSupportApi.acceptRequest(requestId!, user!.userId),
    {
      onSuccess: () => { toast.success('Request accepted!'); invalidate() },
      onError: () => { toast.error('Failed to accept') },
    }
  )

  const startMutation = useMutation(
    () => quickSupportApi.startSession(requestId!),
    {
      onSuccess: () => { toast.success('Session started! Chat room opened.'); invalidate() },
      onError: () => { toast.error('Failed to start session') },
    }
  )

  const completeMutation = useMutation(
    () => quickSupportApi.completeRequest(requestId!, { sessionNotes: '' }),
    {
      onSuccess: () => { toast.success('Session completed!'); invalidate() },
      onError: () => { toast.error('Failed to complete') },
    }
  )

  const rateMutation = useMutation(
    () =>
      quickSupportApi.rateRequest(requestId!, {
        rating: ratingForm.rating,
        feedback: ratingForm.feedback || undefined,
        issueResolved: ratingForm.issueResolved,
      }),
    {
      onSuccess: () => { toast.success('Rating submitted!'); invalidate() },
      onError: () => { toast.error('Failed to submit rating') },
    }
  )

  const paymentMutation = useMutation(
    () => quickSupportApi.releasePayment(requestId!),
    {
      onSuccess: () => { toast.success('Payment released!'); invalidate() },
      onError: () => { toast.error('Failed to release payment') },
    }
  )

  const cancelMutation = useMutation(
    () => quickSupportApi.cancelRequest(requestId!, cancelReason || undefined),
    {
      onSuccess: () => { toast.success('Request cancelled'); invalidate() },
      onError: () => { toast.error('Failed to cancel') },
    }
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600">Request not found</h2>
        <Link to="/quick-support" className="mt-4 inline-block text-blue-500 hover:text-blue-600">Back to Quick Support</Link>
      </div>
    )
  }

  const statusMeta: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    [QuickSupportStatus.PENDING]: { label: 'Pending', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200', icon: <Clock className="w-5 h-5" /> },
    [QuickSupportStatus.MATCHED]: { label: 'Matched', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200', icon: <UserCheck className="w-5 h-5" /> },
    [QuickSupportStatus.IN_PROGRESS]: { label: 'In Progress', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200', icon: <MessageSquare className="w-5 h-5" /> },
    [QuickSupportStatus.COMPLETED]: { label: 'Completed', color: 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200', icon: <CheckCircle2 className="w-5 h-5" /> },
    [QuickSupportStatus.CANCELLED]: { label: 'Cancelled', color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200', icon: <XCircle className="w-5 h-5" /> },
    [QuickSupportStatus.EXPIRED]: { label: 'Expired', color: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200', icon: <Timer className="w-5 h-5" /> },
  }
  const meta = statusMeta[request.status] || statusMeta[QuickSupportStatus.PENDING]

  const canAccept = request.status === QuickSupportStatus.PENDING && !isClient
  const canStart = request.status === QuickSupportStatus.MATCHED && (isMentor || isClient)
  const canComplete = request.status === QuickSupportStatus.IN_PROGRESS && (isMentor || isClient)
  const canRate = request.status === QuickSupportStatus.COMPLETED && isClient && !request.clientRating
  const canPay = request.status === QuickSupportStatus.COMPLETED && isClient && request.totalAmount != null && request.totalAmount > 0
  const canCancel = [QuickSupportStatus.PENDING, QuickSupportStatus.MATCHED].includes(request.status) && isClient

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/quick-support')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Quick Support
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {request.issueDescription}
          </h1>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap ${meta.color}`}>
            {meta.icon}
            <span>{meta.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {STATUS_FLOW.map((s, i) => {
            const isActive = i <= statusIdx
            const isCurrent = i === statusIdx
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isCurrent ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                  isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                }`}>
                  <span>{s === QuickSupportStatus.IN_PROGRESS ? 'Active' : s.charAt(0) + s.slice(1).toLowerCase()}</span>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div className={`w-6 h-0.5 ${isActive && i < statusIdx ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-600'}`} />
                )}
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Category</span>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{request.categoryName}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Urgency</span>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{request.urgencyLevel}/5</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Time Limit</span>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {request.expiresAt
                ? `${Math.max(0, Math.floor((new Date(request.expiresAt).getTime() - Date.now()) / 60000))} min remaining`
                : `${request.estimatedDurationMinutes} min estimated`}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Est. Duration</span>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{request.estimatedDurationMinutes} min</p>
          </div>
          {request.clientName && (
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Client</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" /> {request.clientName}
              </p>
            </div>
          )}
          {request.mentorName && (
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Mentor</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" /> {request.mentorName}
              </p>
            </div>
          )}
          {request.maxRateMxc != null && (
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Max Rate</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{request.maxRateMxc} MXC/hr</p>
            </div>
          )}
          {request.agreedRateMxc != null && (
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Agreed Rate</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{request.agreedRateMxc} MXC/hr</p>
            </div>
          )}
        </div>

        {request.detailedDescription && (
          <div className="mb-6">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Details</span>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{request.detailedDescription}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          {canAccept && (
            <button
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {acceptMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              Instant Accept
            </button>
          )}

          {canStart && (
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {startMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              Open Chat & Start Session
            </button>
          )}

          {request.chatRoomId && (
            <Link
              to={`/chat`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Go to Chat
            </Link>
          )}

          {canComplete && (
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {completeMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Mark Solved
            </button>
          )}

          {canCancel && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason (optional)"
                className="w-40 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-xs"
              />
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                {cancelMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {canRate && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" /> Fast Rating
          </h3>
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                className={`p-1 transition-colors ${star <= ratingForm.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
              >
                <Star className="w-8 h-8 fill-current" />
              </button>
            ))}
          </div>
          <textarea
            value={ratingForm.feedback}
            onChange={(e) => setRatingForm({ ...ratingForm, feedback: e.target.value })}
            rows={3}
            maxLength={1000}
            placeholder="Share your feedback (optional)..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm mb-3"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <input
              type="checkbox"
              checked={ratingForm.issueResolved}
              onChange={(e) => setRatingForm({ ...ratingForm, issueResolved: e.target.checked })}
              className="rounded border-gray-300"
            />
            Issue resolved
          </label>
          <button
            onClick={() => rateMutation.mutate()}
            disabled={rateMutation.isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 transition-colors"
          >
            {rateMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
            Submit Rating
          </button>
        </div>
      )}

      {canPay && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" /> Quick Payment Release
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Release payment of {request.totalAmount} MXC to {request.mentorName}
          </p>
          <button
            onClick={() => paymentMutation.mutate()}
            disabled={paymentMutation.isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {paymentMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Release Payment
          </button>
        </div>
      )}

      {request.clientRating && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" /> Rating Given
          </h3>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${star <= Math.round(request.clientRating!) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
              />
            ))}
          </div>
          {request.clientFeedback && <p className="text-sm text-gray-600 dark:text-gray-400">{request.clientFeedback}</p>}
          {request.issueResolved != null && (
            <p className="text-xs text-gray-400 mt-1">
              Issue resolved: {request.issueResolved ? 'Yes' : 'No'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
