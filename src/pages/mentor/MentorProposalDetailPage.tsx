import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleDashed,
  Clock3,
  PencilLine,
  Sparkles,
  Wallet,
  X,
  Eye,
} from 'lucide-react'
import { AiExplainModal } from '@/components/ai/AiExplainModal'
import { AiTaskType } from '@/api/aiApi'
import { Skeleton, SkeletonCircle } from '@/components/ui/Skeleton'
import ContextualChatDrawer from '@/components/chat/ContextualChatDrawer'
import { categoryApi } from '@/api/categoryApi'
import { contractApi } from '@/api/contractApi'
import { jobApi } from '@/api/jobApi'
import { negotiationApi, NegotiationResponse } from '@/api/negotiationApi'
import { proposalApi } from '@/api/proposalApi'
import { useI18n } from '@/i18n/I18nProvider'
import { useAuthStore } from '@/store/authStore'
import { CategoryResponse, ContractResponse, JobResponse, ProposalResponse, ProposalStatus } from '@/types'
import { formatCurrency, formatDate, formatDateTime, formatDeadlineWithSeconds, formatTimeRemaining } from '@/utils/formatters'

type CounterMode = 'COUNTER' | 'REQUEST_CHANGES'
type CancellationDecisionMode = 'APPROVE' | 'REJECT'

const quickReplies = ['The price needs to be adjusted slightly.', 'I need more time to ensure the best quality.', 'Could you clarify some of the requirements?', 'I have updated the offer based on our discussion.']

export default function MentorProposalDetailPage() {
  const { proposalId } = useParams<{ proposalId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { t } = useI18n()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [proposal, setProposal] = useState<ProposalResponse | null>(null)
  const [job, setJob] = useState<JobResponse | null>(null)
  const [contract, setContract] = useState<ContractResponse | null>(null)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [negotiations, setNegotiations] = useState<NegotiationResponse[]>([])

  const [message, setMessage] = useState('')
  const [counterAmount, setCounterAmount] = useState('')
  const [counterDeadline, setCounterDeadline] = useState('')
  const [counterMode, setCounterMode] = useState<CounterMode>('COUNTER')
  const [showCancellationDecisionModal, setShowCancellationDecisionModal] = useState(false)
  const [cancellationDecisionMode, setCancellationDecisionMode] = useState<CancellationDecisionMode>('APPROVE')
  const [cancellationDecisionNote, setCancellationDecisionNote] = useState('')
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRespondForm, setShowRespondForm] = useState(false)
  const [showAiExplain, setShowAiExplain] = useState(false)

  useEffect(() => {
    void loadData()
  }, [proposalId, user?.userId])

  const loadData = async () => {
    if (!proposalId) return

    try {
      setLoading(true)
      setError('')

      const proposalData = await proposalApi.getById(proposalId)
      const [jobData, categoryData, negotiationData, contractPage] = await Promise.all([
        jobApi.getById(proposalData.jobId),
        categoryApi.getAllActive().catch(() => [] as CategoryResponse[]),
        negotiationApi.getByProposal(proposalId).catch(() => [] as NegotiationResponse[]),
        contractApi.getByJob(proposalData.jobId, { page: 0, size: 10 }).catch(() => ({ content: [] as ContractResponse[] })),
      ])

      const linkedContract =
        contractPage.content.find((item) => item.proposalId === proposalData.id) ||
        null

      setProposal(proposalData)
      setJob(jobData)
      setContract(linkedContract)
      setCategories(categoryData)
      setNegotiations(negotiationData.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
      setCounterAmount(String(proposalData.proposedAmount || proposalData.proposedHourlyRate || ''))
      setCounterDeadline(toDateTimeLocalValue(proposalData.deadlineAt))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Khong the tai chi tiet proposal')
    } finally {
      setLoading(false)
    }
  }

  const categoryName = useMemo(() => {
    if (!job?.categoryId) return 'General'
    return categories.find((item) => item.id === job.categoryId)?.name || 'General'
  }, [categories, job?.categoryId])

  const clientName = job?.client?.fullName || job?.clientName || 'Client'
  const clientAvatar = job?.client?.avatarUrl
  const clientInitials = getInitials(clientName)

  const latestNegotiation = negotiations.length > 0 ? negotiations[negotiations.length - 1] : null
  const isClientOffer = latestNegotiation?.senderType === 'CLIENT'
  const isFinalized = proposal?.status === 'ACCEPTED' || proposal?.status === 'REJECTED' || proposal?.status === 'WITHDRAWN' || proposal?.status === 'OFFER_ACCEPTED'
  
  const currentOffer = latestNegotiation || proposal
  const currentAmount = currentOffer?.proposedAmount || currentOffer?.proposedHourlyRate || proposal?.proposedAmount || proposal?.proposedHourlyRate || 0
  const currentStatus = proposal?.status || ProposalStatus.SUBMITTED
  const hasPendingCancellation = contract?.cancellationRequestStatus === 'PENDING'
  const cancellationRejected = contract?.cancellationRequestStatus === 'REJECTED'

  const agreementStatus = getAgreementStatus(currentStatus, latestNegotiation, t)
  const journeyStageIndex = getJourneyStageIndex(proposal, negotiations, contract)
  const currentBudgetLabel = formatBudgetValue(currentOffer, job)
  const currentDeadlineAt = currentOffer?.deadlineAt || proposal?.deadlineAt || null
  const currentOfferMessage = latestNegotiation?.message || proposal?.coverLetter || 'No offer details yet.'
  const currentDeadlineLabel = formatDeadlineWithSeconds(currentDeadlineAt)
  const currentTimeRemainingLabel = formatTimeRemaining(currentDeadlineAt)
  const canRespond = isClientOffer && !isFinalized
  const canOpenChat = currentStatus === ProposalStatus.ACCEPTED
  const rejectReasonWordCount = countWords(rejectReason)
  const currentFlowNotice =
    contract?.status === 'COMPLETED'
      ? 'Hợp đồng đã hoàn thành, thanh toán đã được xử lý.'
      : currentStatus === ProposalStatus.OFFER_ACCEPTED
      ? t('mentorProposalDetail.sidebar.offerAcceptedNotice')
      : currentStatus === ProposalStatus.ACCEPTED
        ? t('mentorProposalDetail.sidebar.contractActiveNotice')
        : canRespond
          ? t('mentorProposalDetail.sidebar.clientOfferNotice')
          : ''
  const latestTermsSource = isClientOffer ? t('mentorProposalDetail.hero.latestFromClient') : t('mentorProposalDetail.hero.latestFromMentor')
  const decisionTitle = contract?.status === 'COMPLETED'
    ? 'Hợp đồng đã hoàn tất'
    : canRespond
    ? t('mentorProposalDetail.decision.reviewClientOffer')
    : currentStatus === ProposalStatus.OFFER_ACCEPTED
      ? t('mentorProposalDetail.decision.waitClientSelection')
      : currentStatus === ProposalStatus.ACCEPTED
        ? t('mentorProposalDetail.decision.contractActive')
        : isFinalized
          ? t('mentorProposalDetail.decision.closed')
          : t('mentorProposalDetail.decision.waitClientReply')
  const decisionBody = contract?.status === 'COMPLETED'
    ? 'Bạn và khách hàng đã hoàn thành công việc và thanh toán xong.'
    : canRespond
    ? t('mentorProposalDetail.decision.reviewClientOfferBody')
    : currentStatus === ProposalStatus.OFFER_ACCEPTED
      ? t('mentorProposalDetail.decision.waitClientSelectionBody')
      : currentStatus === ProposalStatus.ACCEPTED
        ? t('mentorProposalDetail.decision.contractActiveBody')
        : isFinalized
          ? t('mentorProposalDetail.decision.closedBody')
          : t('mentorProposalDetail.decision.waitClientReplyBody')
  const journeyLabels = [
    t('mentorProposalDetail.journey.proposalSent'),
    t('mentorProposalDetail.journey.termsNegotiation'),
    t('mentorProposalDetail.journey.clientSelection'),
    contract?.status === 'COMPLETED' ? 'Hợp đồng hoàn tất' : t('mentorProposalDetail.journey.activeContract'),
  ]

  const threadItems = useMemo(() => {
    if (!proposal) return []

    const items: any[] = [
      {
        id: `proposal-${proposal.id}`,
        type: 'offer',
        senderType: 'MENTOR',
        senderName: 'You',
        title: 'You sent a proposal',
        note: proposal.coverLetter,
        createdAt: proposal.submittedAt || proposal.createdAt,
        amount: proposal.proposedAmount || proposal.proposedHourlyRate,
        deadlineAt: proposal.deadlineAt,
        tone: 'indigo',
      },
    ]

    negotiations.forEach((item, index) => {
      items.push({
        id: item.id,
        type: item.proposedAmount || item.proposedHourlyRate || item.deadlineAt ? 'offer' : 'message',
        senderType: item.senderType,
        senderName: item.senderName,
        title: item.senderType === 'CLIENT' ? `${item.senderName} sent a counter offer` : 'Updated proposal',
        note: item.message,
        createdAt: item.createdAt,
        amount: item.proposedAmount || item.proposedHourlyRate,
        deadlineAt: item.deadlineAt,
        tone: item.senderType === 'CLIENT' ? 'amber' : index === negotiations.length - 1 ? 'violet' : 'slate',
      })
    })

    return items
  }, [negotiations, proposal])

  const handleOpenCounter = (mode: CounterMode) => {
    setCounterMode(mode)
    setCounterAmount(String(currentAmount || ''))
    setCounterDeadline(toDateTimeLocalValue(currentDeadlineAt))
    setMessage(mode === 'REQUEST_CHANGES' ? 'Could we revise the deadline or work details a bit?' : '')
    setError('')
    setShowRespondForm(true)
    setTimeout(() => {
      window.requestAnimationFrame(() => {
        document.getElementById('mentor-proposal-response')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const textarea = document.getElementById('mentor-proposal-message') as HTMLTextAreaElement | null
        textarea?.focus()
      })
    }, 50)
  }

  const handleAccept = async () => {
    if (!user?.userId || submitting) return
    try {
      setSubmitting(true)
      if (latestNegotiation) {
        await negotiationApi.acceptNegotiation(latestNegotiation.id, user.userId)
      } else if (proposal) {
        await proposalApi.accept(proposal.id)
      }
      setShowAcceptModal(false)
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Khong the chap nhan de xuat')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!proposal || submitting) return
    const normalizedReason = rejectReason.trim()
    const wordCount = countWords(normalizedReason)
    if (wordCount < 10) {
      setError('Please provide a rejection reason with at least 10 words.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      await proposalApi.reject(proposal.id, normalizedReason)
      setShowRejectModal(false)
      setRejectReason('')
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not reject this proposal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendCounter = async () => {
    if (!user?.userId || !proposal || submitting) return
    
    const finalMessage = message.trim()
    const finalAmount = Number(counterAmount)
    
    if (!counterAmount || !Number.isFinite(finalAmount) || finalAmount <= 0) {
      setError('Price must be greater than 0 MXC.')
      return
    }

    if (!counterDeadline) {
      setError('Deadline is required.')
      return
    }

    if (new Date(counterDeadline).getTime() <= Date.now()) {
      setError('Deadline must be in the future.')
      return
    }

    if (finalMessage.length < 20 || finalMessage.length > 1000) {
      setError('Message must be between 20 and 1000 characters.')
      return
    }

    try {
      setSubmitting(true)
      const negotiationPayload = {
        proposalId: proposal.id,
        senderId: user.userId,
        message: finalMessage,
        proposedAmount: finalAmount,
        deadlineAt: counterDeadline,
      }

      await negotiationApi.mentorCounterOffer(negotiationPayload)
      setMessage('')
      setCounterAmount('')
      setCounterDeadline('')
      setError('')
      await loadData()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not send negotiation'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenCancellationDecision = (mode: CancellationDecisionMode) => {
    setCancellationDecisionMode(mode)
    setCancellationDecisionNote('')
    setShowCancellationDecisionModal(true)
  }

  const handleSubmitCancellationDecision = async () => {
    if (!user?.userId || !contract || submitting) return

    if (!cancellationDecisionNote.trim()) {
      setError('Please add a short note before responding to the cancellation request.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      if (cancellationDecisionMode === 'APPROVE') {
        await contractApi.approveCancellation(contract.id, user.userId, cancellationDecisionNote.trim())
      } else {
        await contractApi.rejectCancellation(contract.id, user.userId, cancellationDecisionNote.trim())
      }

      setShowCancellationDecisionModal(false)
      setCancellationDecisionNote('')
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not respond to the cancellation request.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex h-12 items-center gap-4">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ChatBubbleSkeleton key={i} align={i % 2 === 0 ? 'left' : 'right'} />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error && !proposal) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-600">
        <p className="text-sm font-semibold">{error}</p>
      </div>
    )
  }

  if (!proposal || !job) return null

  return (
    <>
      <div className="space-y-6">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0">!</div>
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-800">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/mentor/projects?tab=proposals')}
                aria-label="Back to proposals"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 transition hover:bg-slate-50 dark:bg-slate-900/50 hover:text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{t('mentorProposalDetail.hero.dealBrief')}</p>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                  <StatusBadge label={agreementStatus} tone={getStatusTone(currentStatus, isClientOffer)} />
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('mentorProposalDetail.hero.proposalId')} #{proposal.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/jobs/${job.jobId}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ArrowUpRight className="h-4 w-4" />
                {t('mentorProposalDetail.hero.viewOriginalJob')}
              </Link>
              <button
                type="button"
                onClick={() => setShowAiExplain(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 px-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400 transition hover:border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-900/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
              >
                <Sparkles className="h-4 w-4" />
                {t('mentorProposalDetail.hero.askAi')}
              </button>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="min-w-0 px-4 py-5 sm:px-6">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 dark:bg-slate-800 dark:text-slate-400">{categoryName}</span>
              </div>
              <h1 className="mt-3 max-w-[68ch] text-2xl font-bold leading-tight tracking-tight text-slate-950 dark:text-slate-100 sm:text-3xl dark:text-white">{job.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Avatar avatarUrl={clientAvatar} initials={clientInitials} size="sm" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">{t('mentorProposalDetail.hero.postedBy')}: {clientName}</span>
                </span>
                <span>{t('mentorProposalDetail.hero.started', { date: formatDate(proposal.createdAt) })}</span>
                {proposal.viewCount !== undefined ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">
                    <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                    {t('mentorProposalDetail.hero.views', { count: proposal.viewCount })}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-5 sm:px-6 lg:border-l lg:border-t-0 dark:border-slate-800 dark:bg-slate-800/40">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 dark:text-slate-400">{latestTermsSource}</p>
              <div className="mt-3 grid gap-3">
                <DealTerm icon={<Wallet className="h-4 w-4" />} label={t('mentorProposalDetail.offer.price')} value={currentBudgetLabel} />
                <DealTerm icon={<Clock3 className="h-4 w-4" />} label={t('mentorProposalDetail.offer.deadline')} value={currentDeadlineLabel} />
                <DealTerm icon={<CircleDashed className="h-4 w-4" />} label={t('mentorProposalDetail.offer.timeUntilDeadline')} value={currentTimeRemainingLabel} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{t('mentorProposalDetail.hero.currentStep')}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{decisionTitle}</p>
            </div>
            <div className="scrollbar-hide overflow-x-auto pb-1">
              <div className="relative flex min-w-[520px] justify-between">
                <div className="absolute left-0 top-4 h-[2px] w-full bg-slate-100 dark:bg-slate-800" />
                <div
                  className="absolute left-0 top-4 h-[2px] bg-emerald-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, (journeyStageIndex / (journeyLabels.length - 1)) * 100)}%` }}
                />
                {journeyLabels.map((label, index) => {
                  const state = index < journeyStageIndex ? 'done' : index === journeyStageIndex ? 'active' : 'idle'
                  return <JourneyStep key={label} index={index} label={label} state={state} />
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-slate-950 dark:text-white">{t('mentorProposalDetail.timeline.title')}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('mentorProposalDetail.timeline.updates', { count: threadItems.length })}</p>
                  </div>
                </div>
                {isClientOffer ? (
                  <span className="inline-flex h-8 items-center gap-2 rounded-full border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30 px-3 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    {t('mentorProposalDetail.timeline.actionNeeded')}
                  </span>
                ) : (
                  <span className="inline-flex h-8 items-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{t('mentorProposalDetail.timeline.clientReviewing')}</span>
                )}
              </div>
              <div className="mt-5 space-y-5">
                {threadItems.map((item, index) => (
                  <ConversationCard
                    key={item.id}
                    item={item}
                    isLast={index === threadItems.length - 1}
                    onCounter={!isFinalized ? () => handleOpenCounter('COUNTER') : undefined}
                    onAccept={!isFinalized ? () => setShowAcceptModal(true) : undefined}
                  />
                ))}
              </div>
            </section>
            
            {canRespond && showRespondForm ? (
              <section id="mentor-proposal-response" className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 p-5 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/5">
                <div className="flex flex-col gap-2 border-b border-emerald-100 dark:border-emerald-900/50 pb-3 lg:flex-row lg:items-center lg:justify-between dark:border-emerald-500/20">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Shape the next offer</h2>
                    </div>
                    <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400 dark:text-slate-400">Update price, deadline, and work details before sending.</p>
                  </div>
                  <span className="rounded-full bg-white dark:bg-slate-950 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 ring-1 ring-slate-200">
                    Last message {formatShortInboxTime(latestNegotiation?.createdAt)}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Price (MXC)</span>
                    <input
                      type="number"
                      min="1"
                      value={counterAmount}
                      onChange={(event) => setCounterAmount(event.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Deadline date/time</span>
                    <input
                      type="datetime-local"
                      step={1}
                      value={counterDeadline}
                      onChange={(event) => setCounterDeadline(event.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Choose the latest time this offer should be completed by.
                    </p>
                    {counterDeadline ? (
                      <p className={`text-[11px] font-bold ${new Date(counterDeadline).getTime() <= Date.now() ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                        {formatTimeRemaining(counterDeadline)}
                      </p>
                    ) : null}
                  </label>
                </div>
                <label className="mt-3 block space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Message / Work details</span>
                  <textarea
                    id="mentor-proposal-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Describe what you will do, what is included, and what you need from the client."
                    className="min-h-[80px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm leading-5 text-slate-700 dark:text-slate-300 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{message.trim().length}/1000 characters, minimum 20</p>
                </label>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => setMessage(reply)}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 transition hover:border-emerald-200 dark:border-emerald-800/50 hover:text-emerald-700 dark:text-emerald-400"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSendCounter}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <PencilLine className="h-4 w-4" />
                    {submitting ? 'Sending...' : counterMode === 'REQUEST_CHANGES' ? 'Request changes' : 'Send counter offer'}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowRespondForm(false)}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:bg-slate-900/50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </section>
            ) : canRespond && !showRespondForm ? (
              null
            ) : !isFinalized ? (
              <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Your latest offer is with the client</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400">No edits here, until the client replies or accepts. This keeps the negotiation history consistent.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChatDrawerOpen(true)}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Open discussion
                  </button>
                </div>
              </section>
            ) : null}
          </div>
          <aside className="min-w-0">
            <section className="sticky top-[104px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{t('mentorProposalDetail.decision.title')}</p>
                  <h2 className="mt-2 text-lg font-bold leading-6 tracking-tight text-slate-950 dark:text-white">{decisionTitle}</h2>
                </div>
                <StatusBadge label={agreementStatus} tone={getStatusTone(currentStatus, isClientOffer)} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400 dark:text-slate-300">{decisionBody}</p>
              {currentFlowNotice ? (
                <p className="mt-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3 text-xs font-semibold leading-5 text-emerald-700 dark:text-emerald-400">
                  {currentFlowNotice}
                </p>
              ) : null}

              <div className="mt-5 space-y-3">
                {!isFinalized && isClientOffer ? (
                  <>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setShowAcceptModal(true)}
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-60"
                    >
                      {t('mentorProposalDetail.offer.acceptTerms')}
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleOpenCounter('COUNTER')}
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      {t('mentorProposalDetail.sidebar.prepareCounter')}
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setError('')
                        setRejectReason('')
                        setShowRejectModal(true)
                      }}
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-rose-200 bg-white dark:bg-slate-950 text-sm font-bold text-rose-600 transition hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-500/10 disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                    >
                      {t('mentorProposalDetail.sidebar.rejectProposal')}
                    </button>
                  </>
                ) : canOpenChat ? (
                  <button
                    type="button"
                    onClick={() => setIsChatDrawerOpen(true)}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 text-sm font-bold text-emerald-700 dark:text-emerald-400 transition hover:bg-emerald-100 dark:bg-emerald-900/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                  >
                    {t('mentorProposalDetail.sidebar.openProjectChat')}
                  </button>
                ) : (
                  <p className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {t('mentorProposalDetail.decision.noAction')}
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-5 dark:border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{t('mentorProposalDetail.decision.currentMessage')}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400 dark:text-slate-300">{truncateText(currentOfferMessage, 220)}</p>
              </div>

              <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-5 dark:border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{t('mentorProposalDetail.decision.supportingLinks')}</p>
                <div className="mt-3 grid gap-2">
                  <Link
                    to={`/jobs/${job.jobId}`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    {t('mentorProposalDetail.hero.viewOriginalJob')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsChatDrawerOpen(true)}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {t('mentorProposalDetail.decision.openDiscussion')}
                  </button>
                </div>
              </div>
            </section>
          </aside>

          {/*
                    Hỏi AI giải thích
          */}
        </div>
      </div>

      {showAcceptModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-[28px] bg-white dark:bg-slate-950 p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 mb-4">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-100">{t('mentorProposalDetail.acceptModal.title')}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t('mentorProposalDetail.acceptModal.body')}
              </p>
            </div>
            <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 text-left">
              {[t('mentorProposalDetail.acceptModal.pointTerms'), t('mentorProposalDetail.acceptModal.pointClientSelects'), t('mentorProposalDetail.acceptModal.pointEscrow')].map((item) => (
                <div key={item} className="flex gap-2 text-sm font-medium leading-5 text-slate-600 dark:text-slate-400">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowAcceptModal(false)}
                className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:bg-slate-900/50"
              >
                {t('mentorProposalDetail.acceptModal.cancel')}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleAccept}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? t('mentorProposalDetail.acceptModal.processing') : t('mentorProposalDetail.acceptModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showRejectModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-[28px] bg-white dark:bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-100">Reject proposal</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Explain clearly why you are declining this proposal. A reason with at least 10 words is required.
                </p>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition hover:bg-slate-50 dark:bg-slate-900/50 disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Reason for rejection</span>
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Example: I cannot take this project because the requested timeline, scope, and support expectations do not match my current capacity."
                className="min-h-[160px] w-full rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm leading-6 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
              />
            </label>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <p className={`${rejectReasonWordCount >= 10 ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600'}`}>
                {rejectReasonWordCount}/10 words minimum
              </p>
              <p className="text-slate-400">This reason will be saved with the proposal.</p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                }}
                className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:bg-slate-900/50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || rejectReasonWordCount < 10}
                onClick={handleReject}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
              >
                {submitting ? 'Rejecting...' : 'Reject proposal'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCancellationDecisionModal && contract ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[560px] rounded-[28px] bg-white dark:bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">
                  {cancellationDecisionMode === 'APPROVE' ? 'Approve cancellation request' : 'Reject cancellation request'}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {cancellationDecisionMode === 'APPROVE'
                    ? 'If you approve, the contract will be cancelled and any escrow will be refunded to the client.'
                    : 'If you reject, the contract will remain active and the client will see your response note.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCancellationDecisionModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition hover:bg-slate-50 dark:bg-slate-900/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Client reason: {contract.cancellationRequestReason || 'No reason provided.'}
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Your note</span>
              <textarea
                value={cancellationDecisionNote}
                onChange={(event) => setCancellationDecisionNote(event.target.value)}
                placeholder={
                  cancellationDecisionMode === 'APPROVE'
                    ? 'Add a short note for the client before the contract is cancelled...'
                    : 'Explain why you want to continue the contract...'
                }
                className="min-h-[140px] w-full rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm leading-6 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCancellationDecisionModal(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 px-4 text-sm font-bold text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:bg-slate-900/50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !cancellationDecisionNote.trim()}
                onClick={handleSubmitCancellationDecision}
                className={`inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-bold text-white transition disabled:opacity-60 ${
                  cancellationDecisionMode === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {submitting
                  ? 'Processing...'
                  : cancellationDecisionMode === 'APPROVE'
                    ? 'Approve & cancel'
                    : 'Reject request'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {proposal?.id && (
        <AiExplainModal
          open={showAiExplain}
          onOpenChange={setShowAiExplain}
          taskType={AiTaskType.PROPOSAL}
          taskId={proposal.id}
          taskTitle={job?.title}
        />
      )}

      <ContextualChatDrawer
        open={isChatDrawerOpen}
        onOpenChange={setIsChatDrawerOpen}
        recipientId={job?.clientId}
        contextType="PROPOSAL"
        contextId={proposal?.id}
        title={clientName}
        subtitle="Proposal discussion"
      />
    </>
  )
}

interface ConversationItem {
  id: string
  type: 'offer' | 'message'
  senderType: 'CLIENT' | 'MENTOR'
  senderName: string
  title: string
  note: string
  createdAt: string
  amount?: number
  deadlineAt?: string
  tone: 'indigo' | 'amber' | 'violet' | 'slate'
}

function ConversationCard({ item, isLast, onCounter, onAccept }: { item: ConversationItem; isLast?: boolean; onCounter?: () => void; onAccept?: () => void }) {
  const { t } = useI18n()
  const isMentor = item.senderType === 'MENTOR'
  const isClientOffer = !isMentor && item.type === 'offer'
  const bubbleTone =
    item.tone === 'amber'
      ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50  dark:border-amber-500/20 dark:bg-amber-500/5'
      : item.tone === 'violet'
        ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50  dark:border-emerald-500/20 dark:bg-emerald-500/5'
        : item.tone === 'indigo'
          ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50  dark:border-emerald-500/20 dark:bg-emerald-500/5'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:border-slate-700 dark:bg-slate-800'

  const accentText =
    item.tone === 'amber' ? 'text-amber-600' : item.tone === 'violet' ? 'text-emerald-600 dark:text-emerald-500' : 'text-emerald-600 dark:text-emerald-500'

  return (
    <div className={`flex gap-3 ${isMentor ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="pt-1 shrink-0">
        <Avatar initials={getInitials(item.senderName)} size="sm" />
      </div>
      <div className="min-w-0 max-w-[92%]">
        <div className={`relative overflow-hidden rounded-xl border px-4 py-4 shadow-sm ${bubbleTone}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${accentText}`}>
                {item.type === 'offer' ? (isClientOffer ? t('mentorProposalDetail.offer.clientCounter') : t('mentorProposalDetail.offer.mentorOffer')) : item.title}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-400">{formatDateTime(item.createdAt)}</p>
            </div>
          </div>

          {item.type === 'offer' ? (
            <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800/70 bg-white dark:bg-slate-950/80 p-3 dark:border-slate-700 dark:bg-slate-900/50">
              <div className="grid gap-3 sm:grid-cols-2">
                <OfferFact icon={<Wallet className="h-3.5 w-3.5" />} value={item.amount ? formatCurrency(item.amount) : 'To discuss'} label={t('mentorProposalDetail.offer.price')} />
                <OfferFact icon={<Clock3 className="h-3.5 w-3.5" />} value={formatDeadlineWithSeconds(item.deadlineAt)} label={t('mentorProposalDetail.offer.deadline')} />
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 dark:bg-slate-800 dark:text-slate-300">
                <CircleDashed className="h-3.5 w-3.5 text-emerald-500" />
                <span>{t('mentorProposalDetail.offer.timeUntilDeadline')}: {formatTimeRemaining(item.deadlineAt)}</span>
              </div>
            </div>
          ) : null}

          {item.note ? (
            <p className={`mt-4 text-sm leading-6 ${item.type === 'offer' ? 'text-slate-600 dark:text-slate-400 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300 dark:text-slate-200'}`}>
              {item.note}
            </p>
          ) : null}

          {isLast && isClientOffer && onCounter && onAccept ? (
            <div className="mt-4 border-t border-slate-200 dark:border-slate-800/60 pt-4 dark:border-slate-700">
              <p className="mb-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30 px-3 py-2 text-xs font-semibold leading-5 text-amber-800 dark:text-amber-200">
                {t('mentorProposalDetail.offer.termsOnlyNotice')}
              </p>
              <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={onAccept} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700">
                <Check className="h-3.5 w-3.5" />
                {t('mentorProposalDetail.offer.acceptTerms')}
              </button>
              <button type="button" onClick={onCounter} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                <PencilLine className="h-3.5 w-3.5" />
                {t('mentorProposalDetail.offer.counterOffer')}
              </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ label, tone }: { label: string; tone: 'indigo' | 'amber' | 'emerald' | 'rose' | 'slate' }) {
  const toneClass = {
    indigo: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 dark:bg-amber-500/20 dark:text-amber-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-400',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
    slate: 'bg-slate-100 text-slate-700 dark:text-slate-300 dark:bg-slate-800 dark:text-slate-300',
  }[tone]

  return (
    <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${toneClass}`}>
      {label}
    </span>
  )
}

function JourneyStep({
  index,
  label,
  state,
}: {
  index: number
  label: string
  state: 'done' | 'active' | 'idle'
}) {
  const isDone = state === 'done'
  const isActive = state === 'active'

  return (
    <div className="relative z-10 flex w-20 flex-col items-center sm:w-24">
      <div className="bg-white dark:bg-slate-950 px-2 dark:bg-slate-900">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
            isDone || isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
          }`}
        >
          {isDone ? <Check className="h-4 w-4 stroke-[3]" /> : index + 1}
        </div>
      </div>
      <p
        className={`mt-2 text-center text-[11px] font-semibold ${
          isActive ? 'text-emerald-600 dark:text-emerald-500 dark:text-emerald-400' : isDone ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {label}
      </p>
    </div>
  )
}

function DealTerm({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <p className="mt-1 break-words text-sm font-bold leading-5 text-slate-950 dark:text-white">{value}</p>
      </div>
    </div>
  )
}

function OfferFact({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-emerald-500">{icon}</div>
      <div>
        <p className="text-sm font-black tracking-tight text-slate-950 dark:text-slate-100">{value}</p>
        <p className="text-[10px] font-medium text-slate-400">{label}</p>
      </div>
    </div>
  )
}

function Avatar({
  avatarUrl,
  initials,
  size,
}: {
  avatarUrl?: string
  initials: string
  size: 'sm' | 'md'
}) {
  const classes = size === 'md' ? 'h-12 w-12 rounded-2xl text-sm' : 'h-10 w-10 rounded-2xl text-sm'
  return avatarUrl ? (
    <img src={avatarUrl} alt={initials} className={`${classes} object-cover`} />
  ) : (
    <div className={`flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50 font-black text-emerald-600 dark:text-emerald-500 ${classes}`}>{initials}</div>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'M'
}

function formatBudgetValue(
  source: { proposedAmount?: number; proposedHourlyRate?: number; budgetMinMxc?: number; budgetMaxMxc?: number; hourlyRateMxc?: number; budgetType?: string } | null | undefined,
  job: JobResponse | null
) {
  if (!source) return 'To discuss'
  if (source.proposedAmount) return formatCurrency(source.proposedAmount)
  if (source.proposedHourlyRate) return `${formatCurrency(source.proposedHourlyRate)} / hr`
  if (source.hourlyRateMxc) return `${formatCurrency(source.hourlyRateMxc)} / hr`
  if (source.budgetMinMxc && source.budgetMaxMxc) return `${formatCurrency(source.budgetMinMxc)} - ${formatCurrency(source.budgetMaxMxc)}`
  if (source.budgetMinMxc) return formatCurrency(source.budgetMinMxc)
  if (job?.budgetMinMxc && job?.budgetMaxMxc) return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
  return 'To discuss'
}


function getAgreementStatus(status: ProposalStatus, latestNegotiation: NegotiationResponse | null, t: ReturnType<typeof useI18n>['t']) {
  if (status === 'ACCEPTED') return t('mentorProposalDetail.status.acceptedByClient')
  if (status === 'OFFER_ACCEPTED') return t('mentorProposalDetail.status.termsAgreed')
  if (status === 'REJECTED') return t('mentorProposalDetail.status.rejected')
  if (latestNegotiation?.status === 'COUNTERED') return t('mentorProposalDetail.status.draft')
  if (status === 'NEGOTIATING') return t('mentorProposalDetail.status.negotiating')
  return t('mentorProposalDetail.status.draft')
}

function getStageIndex(proposal: ProposalResponse | null, negotiations: NegotiationResponse[]) {
  if (!proposal) return 0
  if (proposal.status === 'ACCEPTED' || proposal.status === 'OFFER_ACCEPTED') return 4
  if (proposal.status === 'REJECTED') return 3
  if (proposal.status === 'NEGOTIATING' && negotiations.length > 1) return 3
  if (negotiations.length > 0) return 2
  if ((proposal.viewCount || 0) > 0 || proposal.status !== 'SUBMITTED') return 1
  return 0
}

function getJourneyStageIndex(
  proposal: ProposalResponse | null,
  negotiations: NegotiationResponse[],
  contract: ContractResponse | null
) {
  if (!proposal) return 0
  
  if (contract) {
    if (contract.status === 'COMPLETED') return 4
    if (contract.status === 'ACTIVE') return 3
    return 2
  }
  
  if (proposal.status === 'ACCEPTED') return 3
  if (proposal.status === 'OFFER_ACCEPTED') return 2
  if (proposal.status === 'NEGOTIATING' || proposal.status === 'INTERVIEW_REQUESTED' || negotiations.length > 0) return 1
  return 0
}

function getStatusTone(status: ProposalStatus, isClientOffer: boolean) {
  if (status === 'ACCEPTED' || status === 'OFFER_ACCEPTED') return 'emerald'
  if (status === 'REJECTED') return 'rose'
  if (isClientOffer) return 'amber'
  if (status === 'NEGOTIATING') return 'indigo'
  return 'slate'
}

function truncateText(input: string, maxLength: number) {
  if (input.length <= maxLength) return input
  return `${input.slice(0, maxLength).trim()}...`
}

function countWords(input: string) {
  const normalized = input.trim()
  if (!normalized) return 0
  return normalized.split(/\s+/).length
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 19)
}

function getStepDate(index: number, proposal: ProposalResponse, negotiations: NegotiationResponse[]) {
  if (index === 0) return formatDayMonth(proposal.submittedAt || proposal.createdAt)
  if (index === 1) return proposal.viewCount ? formatDayMonth(proposal.updatedAt) : '—'
  if (index === 2) return negotiations[0] ? formatDayMonth(negotiations[0].createdAt) : '—'
  if (index === 3) return negotiations[1] ? formatDayMonth(negotiations[1].createdAt) : '—'
  if (index === 4) return proposal.status === 'ACCEPTED' ? formatDayMonth(proposal.updatedAt) : '—'
  return '—'
}

function formatDayMonth(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

function splitIntoBulletPoints(input: string) {
  return input
    .split(/\n|•|\. /)
    .map((item) => item.trim())
    .filter((item) => item.length > 10)
}

function toAttachmentItem(value: string, index: number) {
  const clean = decodeURIComponent(value.split('/').pop() || `Attachment ${index + 1}`)
  const extension = clean.includes('.') ? clean.split('.').pop()?.toUpperCase() : 'FILE'
  return {
    id: `${clean}-${index}`,
    name: clean,
    url: value,
    meta: `${extension || 'FILE'} · ${(index + 1) * 256} KB`,
  }
}

function formatShortInboxTime(value?: string) {
  if (!value) return ''
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.round(diffMs / 60000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  return `${hours} hour${hours > 1 ? 's' : ''} ago`
}
function ChatBubbleSkeleton({ align }: { align: 'left' | 'right' }) {
  return (
    <div className={`flex gap-3 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
      <SkeletonCircle size="h-9 w-9" />
      <div className={`w-2/3 space-y-2 rounded-2xl p-4 ${align === 'right' ? 'bg-emerald-50 ' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}





