import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { contractApi } from '@/api/contractApi'
import { ContractResponse } from '@/types'
import { AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

import CompletionConfirmModal from './CompletionConfirmModal'
import RevisionRequestModal from './RevisionRequestModal'
import ApprovalConfirmModal from './ApprovalConfirmModal'
import ReviewMentorModal from './ReviewMentorModal'
import { CheckCircle2 } from 'lucide-react'

interface ActiveContractActionsProps {
  contract: ContractResponse
  currentUserId: string
}

export default function ActiveContractActions({ contract, currentUserId }: ActiveContractActionsProps) {
  const queryClient = useQueryClient()

  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false)
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

  const submitCompletionMutation = useMutation(
    (contractId: string) => contractApi.submitCompletion(contractId),
    {
      onSuccess: () => {
        toast.success('Báo cáo hoàn thành thành công!')
        setIsCompletionModalOpen(false)
        queryClient.invalidateQueries('mentor-message-context-maps')
        queryClient.invalidateQueries('chat-mentor-message-linked-contract')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi báo cáo hoàn thành')
      },
    }
  )

  const completeMutation = useMutation(
    (contractId: string) => contractApi.complete(contractId),
    {
      onSuccess: () => {
        toast.success('Đã nghiệm thu và giải ngân thành công!')
        setIsApprovalModalOpen(false)
        setIsReviewModalOpen(true)
        queryClient.invalidateQueries('mentor-message-context-maps')
        queryClient.invalidateQueries('chat-mentor-message-linked-contract')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi nghiệm thu')
      },
    }
  )

  const revisionMutation = useMutation(
    ({ contractId, note }: { contractId: string; note: string }) => contractApi.requestCompletionRevision(contractId, note),
    {
      onSuccess: () => {
        toast.success('Đã gửi yêu cầu chỉnh sửa!')
        setIsRevisionModalOpen(false)
        queryClient.invalidateQueries('mentor-message-context-maps')
        queryClient.invalidateQueries('chat-mentor-message-linked-contract')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi yêu cầu chỉnh sửa')
      },
    }
  )

  const archiveMutation = useMutation(
    (contractId: string) => contractApi.archive(contractId),
    {
      onSuccess: () => {
        toast.success('Đã đưa hợp đồng vào lưu trữ!')
        queryClient.invalidateQueries('mentor-message-context-maps')
        queryClient.invalidateQueries('chat-mentor-message-linked-contract')
        // Also might want to invalidate mentor contracts list if they navigate there
        queryClient.invalidateQueries('mentor-contracts')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu trữ')
      },
      onSettled: () => {
        setIsArchiving(false)
      }
    }
  )

  return (
    <>
      <div className="space-y-3">
        {contract.status === 'ACTIVE' && currentUserId === contract.mentorId && (
          <div className="space-y-2">
            {contract.clientReviewNote && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 p-3 border border-amber-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Yêu cầu chỉnh sửa:</strong> {contract.clientReviewNote}
                </div>
              </div>
            )}
            <button
              onClick={() => setIsCompletionModalOpen(true)}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
            >
              Báo cáo hoàn thành job
            </button>
          </div>
        )}

        {contract.status === 'UNDER_REVIEW' && currentUserId === contract.mentorId && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Đang chờ người dùng nghiệm thu...</p>
          </div>
        )}

        {contract.status === 'UNDER_REVIEW' && currentUserId === contract.clientId && (
          <div className="space-y-2">
            <div className="rounded-xl bg-sky-50 border border-sky-100 p-3 mb-2">
              <p className="text-[13px] text-sky-800">Mentor đã báo cáo hoàn thành. Vui lòng kiểm tra sản phẩm và nghiệm thu để giải ngân.</p>
            </div>
            <button
              onClick={() => setIsApprovalModalOpen(true)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
            >
              {completeMutation.isLoading ? 'Đang xử lý...' : 'Đồng ý & Thanh toán'}
            </button>
            <button
              onClick={() => setIsRevisionModalOpen(true)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30 px-4 text-sm font-semibold text-amber-700 dark:text-amber-400 transition hover:bg-amber-100 dark:bg-amber-900/50 shadow-sm"
            >
              Yêu cầu chỉnh sửa
            </button>
          </div>
        )}

        {contract.status === 'COMPLETED' && currentUserId === contract.clientId && (
          <div className="space-y-2">
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 p-3 mb-2 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[13px] text-emerald-800 dark:text-emerald-200">Bạn đã nghiệm thu Job này. Hãy để lại đánh giá cho Mentor nhé!</p>
            </div>
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-white dark:bg-slate-950 px-4 text-sm font-semibold text-emerald-700 dark:text-emerald-400 transition hover:bg-emerald-50 dark:bg-emerald-900/30 shadow-sm"
            >
              Đánh giá Mentor
            </button>
          </div>
        )}

        {contract.status === 'COMPLETED' && currentUserId === contract.mentorId && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-inner">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-500 shadow-sm">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Job đã hoàn tất!</h4>
                  <p className="mt-1 text-[13px] leading-relaxed text-emerald-800 dark:text-emerald-200/90">
                    Tiền đã được giải ngân vào ví của bạn. Cảm ơn bạn đã mang lại giá trị tuyệt vời cho khách hàng.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href="/mentor/earnings"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg"
              >
                Kiểm tra ví tiền
              </a>
              <a
                href={`/mentor/proposals/${contract.proposalId || contract.id}`}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-700 hover:shadow-md"
              >
                Xem chi tiết hợp đồng
              </a>
              {!contract.isArchived && (
                <button
                  onClick={() => {
                    setIsArchiving(true)
                    archiveMutation.mutate(contract.id)
                  }}
                  disabled={isArchiving}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm font-bold text-slate-500 dark:text-slate-400 shadow-sm transition-all hover:bg-slate-50 dark:bg-slate-900/50 hover:text-slate-700 dark:text-slate-300 disabled:opacity-50"
                >
                  {isArchiving ? 'Đang xử lý...' : 'Lưu trữ hợp đồng'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <CompletionConfirmModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        onConfirm={() => submitCompletionMutation.mutate(contract.id)}
        isLoading={submitCompletionMutation.isLoading}
      />
      <RevisionRequestModal
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        onSubmit={(note) => revisionMutation.mutate({ contractId: contract.id, note })}
        isLoading={revisionMutation.isLoading}
      />
      <ApprovalConfirmModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onConfirm={() => completeMutation.mutate(contract.id)}
        isLoading={completeMutation.isLoading}
        amount={contract.totalAmount}
      />
      <ReviewMentorModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        mentorId={contract.mentorId}
        onSuccess={() => setIsReviewModalOpen(false)}
      />
    </>
  )
}
