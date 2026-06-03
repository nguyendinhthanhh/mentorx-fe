import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCheck,
  CircleDashed,
  Clock3,
  MessageCircle,
  Paperclip,
  PencilLine,
  ShieldCheck,
  Wallet,
  X,
  ChevronDown,
  Eye,
} from 'lucide-react'
import { Skeleton, SkeletonCircle } from '@/components/ui/Skeleton'
import ContextualChatDrawer from '@/components/chat/ContextualChatDrawer'
import { categoryApi } from '@/api/categoryApi'
import { contractApi } from '@/api/contractApi'
import { jobApi } from '@/api/jobApi'
import { negotiationApi, NegotiationResponse } from '@/api/negotiationApi'
import { proposalApi } from '@/api/proposalApi'
import { useAuthStore } from '@/store/authStore'
import { CategoryResponse, ContractResponse, JobResponse, ProposalResponse, ProposalStatus } from '@/types'
import { formatCurrency, formatDate, formatDateTime, formatDeadline, formatTimeRemaining } from '@/utils/formatters'

type CounterMode = 'COUNTER' | 'REQUEST_CHANGES'
type CancellationDecisionMode = 'APPROVE' | 'REJECT'

const journeyLabels = ['Đề xuất', 'Thương lượng', 'Hợp đồng', 'Bắt đầu']
const quickReplies = ['The price needs to be adjusted slightly.', 'I need more time to ensure the best quality.', 'Could you clarify some of the requirements?', 'I have updated the offer based on our discussion.']

export default function MentorProposalDetailPage() {
  const { proposalId } = useParams<{ proposalId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

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

  const agreementStatus = getAgreementStatus(currentStatus, latestNegotiation)
  const journeyStageIndex = getJourneyStageIndex(proposal, negotiations, contract)
  const currentBudgetLabel = formatBudgetValue(currentOffer, job)
  const currentDeadlineAt = currentOffer?.deadlineAt || proposal?.deadlineAt || null
  const currentOfferMessage = latestNegotiation?.message || proposal?.coverLetter || 'No offer details yet.'
  const currentDeadlineLabel = formatDeadline(currentDeadlineAt)
  const currentTimeRemainingLabel = formatTimeRemaining(currentDeadlineAt)
  const canRespond = isClientOffer && !isFinalized
  const canOpenChat = currentStatus === ProposalStatus.ACCEPTED
  const rejectReasonWordCount = countWords(rejectReason)

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
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex h-12 items-center gap-4">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
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
      <div className="mx-auto max-w-7xl space-y-6">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0">!</div>
            {error}
          </div>
        )}

        <section className="flex items-center gap-6 rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <button
            type="button"
            onClick={() => navigate('/mentor/proposals')}
            aria-label="Back to proposals"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="relative min-w-0 flex-1 flex justify-between pr-4">
            <div className="absolute left-0 top-4 h-[2px] w-full bg-slate-100" />
            <div
              className="absolute left-0 top-4 h-[2px] bg-indigo-600 transition-all duration-500"
              style={{ width: `${(journeyStageIndex / (journeyLabels.length - 1)) * 100}%` }}
            />
            {journeyLabels.map((label, index) => {
              const state = index < journeyStageIndex ? 'done' : index === journeyStageIndex ? 'active' : 'idle'
              return <JourneyStep key={label} index={index} label={label} state={state} />
            })}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="min-w-0 space-y-6 lg:col-span-8">
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-slate-900">Negotiation Timeline</h2>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                    {threadItems.length} updates
                  </span>
                </div>
                <div>
                  {isClientOffer ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                      </span>
                      Action needed
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">Client reviewing...</span>
                  )}
                </div>
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
              <section id="mentor-proposal-response" className="mt-6 rounded-[24px] border border-indigo-200/80 bg-[linear-gradient(180deg,rgba(245,247,255,0.95),rgba(255,255,255,1))] p-5 shadow-sm">
                <div className="flex flex-col gap-2 border-b border-indigo-100 pb-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Respond</p>
                      <h2 className="text-base font-black tracking-tight text-slate-950">Shape the next offer</h2>
                    </div>
                    <p className="mt-0.5 text-[13px] text-slate-500">Update price, deadline, and work details before sending.</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                    Last message {formatShortInboxTime(latestNegotiation?.createdAt)}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Price (MXC)</span>
                    <input
                      type="number"
                      min="1"
                      value={counterAmount}
                      onChange={(event) => setCounterAmount(event.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Deadline date/time</span>
                    <input
                      type="datetime-local"
                      value={counterDeadline}
                      onChange={(event) => setCounterDeadline(event.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                    <p className="text-[11px] font-medium text-slate-500">
                      Choose the latest time this offer should be completed by.
                    </p>
                    {counterDeadline ? (
                      <p className={`text-[11px] font-bold ${new Date(counterDeadline).getTime() <= Date.now() ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {formatTimeRemaining(counterDeadline)}
                      </p>
                    ) : null}
                  </label>
                </div>
                <label className="mt-3 block space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Message / Work details</span>
                  <textarea
                    id="mentor-proposal-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Describe what you will do, what is included, and what you need from the client."
                    className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-5 text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <p className="text-[11px] font-medium text-slate-500">{message.trim().length}/1000 characters, minimum 20</p>
                </label>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => setMessage(reply)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-700"
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
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    <PencilLine className="h-4 w-4" />
                    {submitting ? 'Sending...' : counterMode === 'REQUEST_CHANGES' ? 'Request changes' : 'Send counter offer'}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowRespondForm(false)}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </section>
            ) : canRespond && !showRespondForm ? (
              <div className="mt-6"></div>
            ) : !isFinalized ? (
              <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Status</p>
                    <h2 className="mt-2 text-lg font-black tracking-tight text-slate-950">Your latest offer is with the client</h2>
                    <p className="mt-1 text-sm text-slate-500">No edits here, until the client replies or accepts. This keeps the negotiation history consistent.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChatDrawerOpen(true)}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    Open discussion
                  </button>
                </div>
              </section>
            ) : null}
          </div>
          <aside className="space-y-4 lg:col-span-4">
            <section className="sticky top-[104px] space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <StatusBadge label={agreementStatus} tone={getStatusTone(currentStatus, isClientOffer)} />
                  <span className="text-sm font-bold text-slate-500">#{proposal.id.slice(0, 8)}</span>
                </div>
                <h1 className="mt-3 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{job.title}</h1>
                <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Avatar avatarUrl={clientAvatar} initials={clientInitials} size="sm" />
                    <span className="font-bold text-slate-700">{clientName}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    Started {formatDate(proposal.createdAt)}
                    {proposal.viewCount !== undefined ? (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Eye className="h-4 w-4 text-indigo-500" />
                          {proposal.viewCount} views
                        </span>
                      </>
                    ) : null}
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">{categoryName}</span>
                  </div>
                  <Link
                    to={`/jobs/${job.jobId}`}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-bold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    View Original Job
                  </Link>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-[linear-gradient(160deg,rgba(243,247,255,1),rgba(255,255,255,0.92))] px-5 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Current Proposal</p>
                      <h2 className="mt-2 text-lg font-black tracking-tight text-slate-950">{currentBudgetLabel}</h2>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <RailMetric icon={<Wallet className="h-4 w-4" />} label="Price" value={currentBudgetLabel} />
                    <RailMetric icon={<Clock3 className="h-4 w-4" />} label="Deadline" value={currentDeadlineLabel} />
                    <RailMetric icon={<CircleDashed className="h-4 w-4" />} label="Time left" value={currentTimeRemainingLabel} />
                  </div>
                  <div className="mt-3 rounded-[20px] bg-white px-4 py-3 ring-1 ring-slate-200/80">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Message / Offer details</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {truncateText(currentOfferMessage, 180)}
                    </p>
                  </div>
                  {currentStatus === ProposalStatus.OFFER_ACCEPTED ? (
                    <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold leading-5 text-emerald-700">
                      Offer terms agreed. Waiting for client to accept mentor and lock escrow.
                    </p>
                  ) : currentStatus === ProposalStatus.ACCEPTED ? (
                    <p className="mt-3 rounded-2xl bg-indigo-50 px-4 py-3 text-xs font-bold leading-5 text-indigo-700">
                      Contract active. Escrow locked.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-4 px-5 py-5">
                  {!isFinalized ? (
                    isClientOffer ? (
                      <>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => setShowAcceptModal(true)}
                          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-indigo-600 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                        >
                          Accept offer terms
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleOpenCounter('COUNTER')}
                          className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-60"
                        >
                          Prepare counter offer
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => {
                            setError('')
                            setRejectReason('')
                            setShowRejectModal(true)
                          }}
                          className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-rose-200 bg-white text-sm font-bold text-rose-500 transition hover:bg-rose-50 disabled:opacity-60"
                        >
                          Reject proposal
                        </button>
                      </>
                    ) : null
                  ) : null}
                  {canOpenChat ? (
                    <button
                      type="button"
                      onClick={() => setIsChatDrawerOpen(true)}
                      className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      Open project chat
                    </button>
                  ) : null}
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {showAcceptModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-slate-950">Accept offer terms</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Accepting offer terms does not create a contract or lock escrow yet. The client still needs to accept the mentor.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowAcceptModal(false)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleAccept}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? 'Accepting...' : 'Accept offer terms'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showRejectModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-950">Reject proposal</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
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
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-bold text-slate-700">Reason for rejection</span>
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Example: I cannot take this project because the requested timeline, scope, and support expectations do not match my current capacity."
                className="min-h-[160px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
              />
            </label>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <p className={`${rejectReasonWordCount >= 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
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
                className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
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
          <div className="w-full max-w-[560px] rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-950">
                  {cancellationDecisionMode === 'APPROVE' ? 'Approve cancellation request' : 'Reject cancellation request'}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {cancellationDecisionMode === 'APPROVE'
                    ? 'If you approve, the contract will be cancelled and any escrow will be refunded to the client.'
                    : 'If you reject, the contract will remain active and the client will see your response note.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCancellationDecisionModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
              Client reason: {contract.cancellationRequestReason || 'No reason provided.'}
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-bold text-slate-700">Your note</span>
              <textarea
                value={cancellationDecisionNote}
                onChange={(event) => setCancellationDecisionNote(event.target.value)}
                placeholder={
                  cancellationDecisionMode === 'APPROVE'
                    ? 'Add a short note for the client before the contract is cancelled...'
                    : 'Explain why you want to continue the contract...'
                }
                className="min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCancellationDecisionModal(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
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
  const isMentor = item.senderType === 'MENTOR'
  const isClientOffer = !isMentor && item.type === 'offer'
  const bubbleTone =
    item.tone === 'amber'
      ? 'border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,1),rgba(255,255,255,1))]'
      : item.tone === 'violet'
        ? 'border-violet-100 bg-[linear-gradient(180deg,rgba(245,243,255,1),rgba(255,255,255,1))]'
        : item.tone === 'indigo'
          ? 'border-indigo-100 bg-[linear-gradient(180deg,rgba(238,242,255,1),rgba(255,255,255,1))]'
          : 'border-slate-200 bg-white'

  const accentText =
    item.tone === 'amber' ? 'text-amber-600' : item.tone === 'violet' ? 'text-violet-600' : 'text-indigo-600'

  return (
    <div className={`flex gap-3 ${isMentor ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="pt-1 shrink-0">
        <Avatar initials={getInitials(item.senderName)} size="sm" />
      </div>
      <div className="min-w-0 max-w-[92%]">
        <div className={`relative overflow-hidden rounded-[28px] border px-4 py-4 shadow-sm ${bubbleTone}`}>
          <div className="absolute inset-x-5 top-0 h-px bg-white/70" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs font-medium text-slate-400">{formatDateTime(item.createdAt)}</p>
          </div>

          {item.type === 'offer' ? (
            <div className="mt-4 grid gap-3 rounded-[22px] border border-white/70 bg-white/90 p-3 sm:grid-cols-3">
              <OfferFact icon={<Wallet className="h-3.5 w-3.5" />} value={item.amount ? formatCurrency(item.amount) : 'To discuss'} label="Price" />
              <OfferFact icon={<Clock3 className="h-3.5 w-3.5" />} value={formatDeadline(item.deadlineAt)} label="Deadline" />
              <OfferFact icon={<CircleDashed className="h-3.5 w-3.5" />} value={formatTimeRemaining(item.deadlineAt)} label="Time left" />
            </div>
          ) : null}

          {item.note ? (
            <p className={`mt-4 text-sm leading-6 ${item.type === 'offer' ? 'text-slate-600' : 'text-slate-700'}`}>
              {item.note}
            </p>
          ) : null}

          {isLast && isClientOffer && onCounter ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/60 pt-4">
              <button type="button" onClick={onAccept} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-700">
                <Check className="h-3.5 w-3.5" />
                Accept offer terms
              </button>
              <button type="button" onClick={onCounter} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100">
                <PencilLine className="h-3.5 w-3.5" />
                Counter Offer
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CompactMetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-slate-50 px-3.5 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1.5 text-sm font-black leading-5 text-slate-950">{value}</p>
    </div>
  )
}

function StatusBadge({ label, tone }: { label: string; tone: 'indigo' | 'amber' | 'emerald' | 'rose' | 'slate' }) {
  const toneClass = {
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  }[tone]

  return (
    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] ring-1 ${toneClass}`}>
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
    <div className="relative z-10 flex w-24 flex-col items-center">
      <div className="bg-white px-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black transition-colors ${
            isDone || isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-400'
          }`}
        >
          {isDone ? <Check className="h-4 w-4 stroke-[3]" /> : index + 1}
        </div>
      </div>
      <p
        className={`mt-3 text-center text-xs font-bold ${
          isActive ? 'text-indigo-600' : isDone ? 'text-slate-900' : 'text-slate-400'
        }`}
      >
        {label}
      </p>
    </div>
  )
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-black text-slate-900">{value}</p>
    </div>
  )
}

function RailMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] bg-white px-4 py-3 ring-1 ring-slate-200/80">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
      </div>
    </div>
  )
}

function OfferFact({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-indigo-500">{icon}</div>
      <div>
        <p className="text-sm font-black tracking-tight text-slate-950">{value}</p>
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
    <div className={`flex items-center justify-center bg-indigo-100 font-black text-indigo-600 ${classes}`}>{initials}</div>
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

function getAgreementStatus(status: ProposalStatus, latestNegotiation: NegotiationResponse | null) {
  if (status === 'ACCEPTED') return 'Accepted'
  if (status === 'OFFER_ACCEPTED') return 'Offer Accepted'
  if (status === 'REJECTED') return 'Rejected'
  if (latestNegotiation?.status === 'COUNTERED') return 'Draft'
  if (status === 'NEGOTIATING') return 'Negotiating'
  return 'Draft'
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
    if (contract.status === 'ACTIVE' || contract.status === 'COMPLETED') return 3
    return 2
  }
  
  if (proposal.status === 'ACCEPTED' || proposal.status === 'OFFER_ACCEPTED') return 2
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
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
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
      <div className={`w-2/3 space-y-2 rounded-2xl p-4 ${align === 'right' ? 'bg-indigo-50/50' : 'bg-slate-50'}`}>
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}





