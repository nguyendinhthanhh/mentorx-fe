import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft, XCircle } from 'lucide-react'

import { adminMentorVerificationApi } from '@/api/adminMentorVerificationApi'
import { useAuthStore } from '@/store/authStore'
import { hasRole } from '@/utils/roleRedirect'
import MentorApplicationReviewPanel from '@/components/admin/MentorApplicationReviewPanel'
import {
  ModerationAction,
  QueueTab,
  ReviewTab,
  getSuccessMessage,
} from '@/pages/admin/mentorVerification.helpers'

export default function AdminMentorApplicationDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const [searchParams] = useSearchParams()
  const activeTab: QueueTab = searchParams.get('tab') === 'payout' ? 'payout' : 'expertise'

  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const isAdmin = hasRole(user, 'ADMIN')
  const isModerator = hasRole(user, 'MODERATOR')
  const canReviewExpertise = isAdmin || isModerator
  const canReviewPayout = isAdmin

  const [reviewTab, setReviewTab] = useState<ReviewTab>('overview')
  const [draftAction, setDraftAction] = useState<ModerationAction | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [internalNote, setInternalNote] = useState('')

  const { data: profile, isLoading, error } = useQuery(
    ['admin-mentor-application-detail', userId],
    () => adminMentorVerificationApi.getExpertiseApplication(userId!),
    { enabled: Boolean(userId), staleTime: 0 }
  )

  useEffect(() => {
    if (!profile) {
      setInternalNote('')
      return
    }
    setInternalNote(
      profile.expertiseReviewNote
      || profile.expertiseRejectionReason
      || profile.payoutRejectionReason
      || ''
    )
  }, [profile?.userId])

  const moderationMutation = useMutation(
    async ({ action, note }: { action: ModerationAction; note: string }) => {
      if (!userId) return
      switch (action) {
        case 'approve-expertise':
          return adminMentorVerificationApi.approveExpertise(userId)
        case 'reject-expertise':
          return adminMentorVerificationApi.rejectExpertise(userId, note)
        case 'request-more-info':
          return adminMentorVerificationApi.requestMoreInfo(userId, note)
        case 'suspend':
          return adminMentorVerificationApi.suspendMentor(userId, note)
        case 'approve-payout':
          return adminMentorVerificationApi.approvePayout(userId)
        case 'reject-payout':
          return adminMentorVerificationApi.rejectPayout(userId, note)
      }
    },
    {
      onSuccess: (updatedProfile, variables) => {
        toast.success(getSuccessMessage(variables.action))
        if (updatedProfile) {
          queryClient.setQueryData(['admin-mentor-application-detail', userId], updatedProfile)
        }
        queryClient.invalidateQueries('admin-mentor-expertise')
        queryClient.invalidateQueries('admin-mentor-payouts')
        queryClient.invalidateQueries('admin-mentor-application-detail')
        setDraftAction(null)
        setActionReason('')
      },
      onError: (submissionError: any) => {
        toast.error(submissionError?.response?.data?.message || 'The moderation action could not be completed.')
      },
    }
  )

  const submitAction = (action: ModerationAction, note: string) => {
    moderationMutation.mutate({ action, note: note.trim() })
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/admin/mentor-applications?tab=${activeTab}`}
          className="inline-flex items-center gap-2 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-white/50 dark:border-slate-800 shadow-sm px-4 py-2 text-xs font-bold text-slate-500 hover:text-emerald-600 hover:border-emerald-200 dark:hover:border-emerald-800/50 dark:hover:text-emerald-400 hover:shadow-md transition-all hover:-translate-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to queue
        </Link>
      </div>

      {!userId ? (
        <MissingApplicationState />
      ) : (
        <MentorApplicationReviewPanel
          activeTab={activeTab}
          profile={profile}
          loading={isLoading}
          error={error}
          reviewTab={reviewTab}
          onReviewTabChange={setReviewTab}
          internalNote={internalNote}
          onInternalNoteChange={setInternalNote}
          draftAction={draftAction}
          onDraftActionChange={setDraftAction}
          actionReason={actionReason}
          onActionReasonChange={setActionReason}
          onSubmitAction={submitAction}
          isSubmitting={moderationMutation.isLoading}
          canReviewExpertise={canReviewExpertise}
          canReviewPayout={canReviewPayout}
        />
      )}
    </div>
  )
}

function MissingApplicationState() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-24 text-center bg-white/70 dark:bg-slate-900/70 rounded-[2.5rem] border border-white/50 dark:border-slate-800 backdrop-blur-xl shadow-xl shadow-slate-200/40 dark:shadow-none">
      <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-rose-50 text-rose-500 dark:bg-rose-950/40 shadow-sm border border-rose-100 dark:border-rose-900/30">
        <XCircle className="w-7 h-7" />
      </div>
      <p className="text-sm font-extrabold text-slate-900 dark:text-white">No application was specified.</p>
    </div>
  )
}
