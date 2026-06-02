import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCheck,
  CircleDashed,
  Clock3,
  Loader2,
  MessageCircle,
  Paperclip,
  PencilLine,
  ShieldCheck,
  Wallet,
  X,
  ChevronDown,
  Eye,
} from 'lucide-react'
import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/ui/Skeleton'
import ContextualChatDrawer from '@/components/chat/ContextualChatDrawer'
import { categoryApi } from '@/api/categoryApi'
import { contractApi } from '@/api/contractApi'
import { jobApi } from '@/api/jobApi'
import { mentorApi } from '@/api/mentorApi'
import { negotiationApi, NegotiationResponse } from '@/api/negotiationApi'
import { proposalApi } from '@/api/proposalApi'
import { useAuthStore } from '@/store/authStore'
import { CategoryResponse, ContractResponse, JobResponse, MentorProfileResponse, ProposalResponse, ProposalStatus } from '@/types'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters'

type CounterMode = 'COUNTER' | 'REQUEST_CHANGES'
type CancellationDecisionMode = 'APPROVE' | 'REJECT'

const stepLabels = ['Proposal Sent', 'Viewed', 'Counter Offer', 'Negotiating', 'Agreement', 'Contract']
const quickReplies = ['Can you reduce the price?', 'Can we add another revision?', 'Can we split into milestones?', 'I accept this offer']

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
  const [recommendedMentors, setRecommendedMentors] = useState<MentorProfileResponse[]>([])

  const [message, setMessage] = useState('')
  const [counterAmount, setCounterAmount] = useState('')
  const [counterDays, setCounterDays] = useState('')
  const [showCounterModal, setShowCounterModal] = useState(false)
  const [counterMode, setCounterMode] = useState<CounterMode>('COUNTER')
  const [showCancellationDecisionModal, setShowCancellationDecisionModal] = useState(false)
  const [cancellationDecisionMode, setCancellationDecisionMode] = useState<CancellationDecisionMode>('APPROVE')
  const [cancellationDecisionNote, setCancellationDecisionNote] = useState('')
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false)

  useEffect(() => {
    void loadData()
  }, [proposalId, user?.userId])

  const loadData = async () => {
    if (!proposalId) return

    try {
      setLoading(true)
      setError('')

      const proposalData = await proposalApi.getById(proposalId)
      const [jobData, categoryData, negotiationData, mentorPage, contractPage] = await Promise.all([
        jobApi.getById(proposalData.jobId),
        categoryApi.getAllActive().catch(() => [] as CategoryResponse[]),
        negotiationApi.getByProposal(proposalId).catch(() => [] as NegotiationResponse[]),
        mentorApi.getAllApprovedMentors({ page: 0, size: 3, sortBy: 'averageRating', sortDir: 'desc' }).catch(() => ({
          content: [] as MentorProfileResponse[],
        })),
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
      setRecommendedMentors(mentorPage.content || [])
      setCounterAmount(String(proposalData.proposedAmount || proposalData.proposedHourlyRate || ''))
      setCounterDays(String(proposalData.estimatedDurationDays || ''))
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

  const attachmentItems = useMemo(() => {
    const sources = [...(job?.attachments || []), ...(job?.attachmentUrl ? [job.attachmentUrl] : []), ...(proposal?.attachments || [])]
    return Array.from(new Set(sources)).filter(Boolean).map((item, index) => toAttachmentItem(item, index))
  }, [job?.attachmentUrl, job?.attachments, proposal?.attachments])

  const scopeItems = useMemo(() => {
    const candidates = [job?.successCriteria, job?.learningGoals, job?.description]
      .filter(Boolean)
      .flatMap((value) => splitIntoBulletPoints(value as string))

    if (candidates.length > 0) return candidates.slice(0, 5)
    return ['Review current architecture', 'Identify performance bottlenecks', 'Suggest refactor plan', 'Review codebase', 'Provide final improvement checklist']
  }, [job?.description, job?.learningGoals, job?.successCriteria])

  const latestNegotiation = negotiations.length > 0 ? negotiations[negotiations.length - 1] : null
  const isClientOffer = latestNegotiation?.senderType === 'CLIENT'
  const isFinalized = proposal?.status === 'ACCEPTED' || proposal?.status === 'REJECTED' || proposal?.status === 'WITHDRAWN' || proposal?.status === 'OFFER_ACCEPTED'
  
  const currentOffer = latestNegotiation || proposal
  const currentAmount = currentOffer?.proposedAmount || currentOffer?.proposedHourlyRate || proposal?.proposedAmount || proposal?.proposedHourlyRate || 0
  const currentDuration = currentOffer?.estimatedDurationDays || proposal?.estimatedDurationDays
  const currentStatus = proposal?.status || ProposalStatus.SUBMITTED
  const hasPendingCancellation = contract?.cancellationRequestStatus === 'PENDING'
  const cancellationRejected = contract?.cancellationRequestStatus === 'REJECTED'

  const agreementStatus = getAgreementStatus(currentStatus, latestNegotiation)
  const stageIndex = getStageIndex(proposal, negotiations)
  const currentBudgetLabel = formatBudgetValue(currentOffer, job)
  const originalBudgetLabel = formatBudgetValue(job, job)
  const currentTimelineLabel = currentDuration ? `${currentDuration} week${currentDuration > 1 ? 's' : ''}` : 'Flexible'
  const originalTimelineLabel = job?.deadlineAt ? formatDate(job.deadlineAt) : 'Flexible'

  const deliverables = useMemo(() => {
    const items = scopeItems.map((item, index) => ({
      label: item,
      included: index < 4 || currentStatus === ProposalStatus.ACCEPTED,
    }))
    return items.slice(0, 5)
  }, [currentStatus, scopeItems])

  const scopeDiff = useMemo(() => {
    const originalSessions = normalizeSessionCount(proposal?.coverLetter || '')
    const currentSessions = normalizeSessionCount(latestNegotiation?.message || proposal?.coverLetter || '')
    return {
      added: 'None',
      modified: originalSessions !== currentSessions ? `Review sessions: ${originalSessions} -> ${currentSessions}` : 'None',
      removed: 'None',
    }
  }, [latestNegotiation?.message, proposal?.coverLetter])

  const threadItems = useMemo(() => {
    if (!proposal) return []

    const items: ConversationItem[] = [
      {
        id: `proposal-${proposal.id}`,
        type: 'offer',
        senderType: 'MENTOR',
        senderName: 'You',
        title: 'You sent a proposal',
        note: proposal.coverLetter,
        createdAt: proposal.submittedAt || proposal.createdAt,
        amount: proposal.proposedAmount || proposal.proposedHourlyRate,
        durationDays: proposal.estimatedDurationDays,
        sessions: normalizeSessionCount(proposal.coverLetter),
        tone: 'indigo',
      },
    ]

    negotiations.forEach((item, index) => {
      items.push({
        id: item.id,
        type: item.proposedAmount || item.proposedHourlyRate || item.estimatedDurationDays ? 'offer' : 'message',
        senderType: item.senderType,
        senderName: item.senderName,
        title: item.senderType === 'CLIENT' ? `${item.senderName} sent a counter offer` : 'Updated proposal',
        note: item.message,
        createdAt: item.createdAt,
        amount: item.proposedAmount || item.proposedHourlyRate,
        durationDays: item.estimatedDurationDays,
        sessions: normalizeSessionCount(item.message),
        tone: item.senderType === 'CLIENT' ? 'amber' : index === negotiations.length - 1 ? 'violet' : 'slate',
      })
    })

    return items
  }, [negotiations, proposal])

  const inboxItems = useMemo(() => {
    const names = Array.from(new Set(negotiations.filter((item) => item.senderType === 'CLIENT').map((item) => item.senderName)))
    return names.slice(0, 3).map((name, index) => ({
      name,
      time: formatShortInboxTime(negotiations.find((item) => item.senderName === name)?.createdAt),
      subtitle: index === 0 ? 'Counter-offer received' : 'Waiting for your reply',
    }))
  }, [negotiations])

  const handleOpenCounter = (mode: CounterMode) => {
    setCounterMode(mode)
    setShowCounterModal(true)
    setCounterAmount(String(currentAmount || ''))
    setCounterDays(String(currentDuration || ''))
    setMessage(mode === 'REQUEST_CHANGES' ? 'Could we revise the scope and delivery details a bit?' : '')
    setError('')
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
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Khong the chap nhan de xuat')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!user?.userId || !proposal || submitting) return
    try {
      setSubmitting(true)
      if (latestNegotiation) {
        await negotiationApi.rejectNegotiation(latestNegotiation.id, user.userId)
      } else {
        await proposalApi.reject(proposal.id, 'Rejected by mentor')
      }
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Khong the tu choi de xuat')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendCounter = async () => {
    if (!user?.userId || !proposal || submitting) return
    
    const finalMessage = message.trim() || (counterMode === 'REQUEST_CHANGES' ? 'Could we revise the scope and delivery details a bit?' : 'I would like to propose an updated offer for this job.')
    
    if (finalMessage.length < 10) {
      setError('Message must be at least 10 characters long')
      return
    }

    try {
      setSubmitting(true)
      const negotiationPayload = {
        proposalId: proposal.id,
        senderId: user.userId,
        message: finalMessage,
        proposedAmount: counterAmount ? Number(counterAmount) : undefined,
        estimatedDurationDays: counterDays ? Number(counterDays) : undefined,
      }

      await negotiationApi.mentorCounterOffer(negotiationPayload)
      setShowCounterModal(false)
      setMessage('')
      setCounterAmount('')
      setCounterDays('')
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
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <button
            type="button"
            onClick={() => navigate('/mentor/proposals')}
            className="inline-flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Proposals
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0">!</div>
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6 min-w-0">
            <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl px-4 py-3 outline-none hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-slate-950">Job Brief</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Read only</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>

              <div className="border-t border-slate-100 px-4 py-4">
                {/* Title + category */}
                <h3 className="text-base font-black text-slate-950">{job.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">{categoryName}</span>
                  <span className="text-xs text-slate-400">Posted {formatDate(job.createdAt)}</span>
                </div>

                {/* Key info grid */}
                <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-bold text-slate-400">Client</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Avatar avatarUrl={clientAvatar} initials={clientInitials} size="sm" />
                      <p className="truncate text-xs font-bold text-slate-700">{clientName}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-bold text-slate-400">Budget</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{originalBudgetLabel}</p>
                    <p className="text-[10px] text-slate-400">{job.budgetType === 'FIXED' ? 'Fixed' : 'Hourly'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-bold text-slate-400">Timeline</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{originalTimelineLabel}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-bold text-slate-400">Skills</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(job.requiredSkills || []).slice(0, 3).map((s) => (
                        <span key={s} className="rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-700">{s}</span>
                      ))}
                      {(job.requiredSkills || []).length > 3 ? <span className="text-[9px] text-slate-400">+{(job.requiredSkills || []).length - 3}</span> : null}
                    </div>
                  </div>
                </div>

                {/* Scope */}
                {scopeItems.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-[10px] font-bold text-slate-400">Scope</p>
                    <ul className="mt-1.5 space-y-1">
                      {scopeItems.map((item) => (
                        <li key={item} className="flex gap-2 text-xs leading-5 text-slate-600">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Attachments inline */}
                {attachmentItems.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {attachmentItems.map((item) => (
                      <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600">
                        <Paperclip className="h-3 w-3" />
                        {item.name.length > 20 ? `${item.name.slice(0, 20)}...` : item.name}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </details>

            <section className="space-y-4">
            {/* Compact negotiation header */}
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h1 className="truncate text-lg font-black tracking-tight text-slate-950">Negotiation with {clientName}</h1>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Online
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-bold text-indigo-600">#{proposal.id.slice(0, 8)}</span>
                    <span>Started {formatDate(proposal.createdAt)}</span>
                    <span>·</span>
                    <span className="font-medium text-slate-700">{agreementStatus}</span>
                    {proposal.viewCount !== undefined && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-bold text-slate-900">
                          <Eye className="h-3 w-3" />
                          {proposal.viewCount} views
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/jobs/${job.jobId}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    View Job
                  </Link>
                </div>
              </div>

              {/* Step progress bar with labels */}
              <div className="mt-3 flex items-center gap-0 overflow-x-auto border-t border-slate-100 pt-3">
                {stepLabels.map((label, index) => {
                  const reached = index <= stageIndex
                  const active = index === stageIndex
                  const completed = index < stageIndex

                  let textCls = 'text-slate-400'
                  let dotCls = 'bg-slate-200'
                  let lineCls = 'bg-slate-200'

                  if (completed) {
                    textCls = 'text-indigo-600'
                    dotCls = 'bg-indigo-500'
                    lineCls = 'bg-indigo-400'
                  } else if (active) {
                    textCls = 'text-slate-950'
                    dotCls = 'bg-indigo-500'
                  }

                  return (
                    <div key={label} className="flex items-center">
                      <div className="flex items-center gap-1.5">
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white ${dotCls}`}>
                          {completed ? (
                            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span className={`whitespace-nowrap text-[11px] font-bold ${textCls} ${active ? 'rounded-md bg-indigo-50 px-1.5 py-0.5 text-indigo-700' : ''}`}>
                          {label}
                        </span>
                      </div>
                      {index < stepLabels.length - 1 ? (
                        <div className={`mx-2 h-[1.5px] w-4 shrink-0 ${lineCls}`} />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              {threadItems.map((item, index) => (
                <ConversationCard
                  key={item.id}
                  item={item}
                  isLast={index === threadItems.length - 1}
                  onCounter={() => handleOpenCounter('COUNTER')}
                  onAccept={handleAccept}
                />
              ))}
            </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="sticky top-[104px] space-y-4">
              {/* Agreement summary */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-slate-950">Current Agreement</h2>
                  <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600">{agreementStatus}</span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Offer</p>
                      <p className="mt-0.5 text-lg font-black tracking-tight text-slate-950">{currentBudgetLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Original</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-500">{originalBudgetLabel}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Timeline</p>
                      <p className="mt-0.5 text-sm font-black text-slate-950">{currentTimelineLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Original</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-500">{originalTimelineLabel}</p>
                    </div>
                  </div>
                </div>

                {/* Deliverables compact */}
                <div className="mt-4">
                  <p className="text-xs font-black text-slate-700">Deliverables ({deliverables.filter((i) => i.included).length}/{deliverables.length})</p>
                  <div className="mt-2 space-y-1.5">
                    {deliverables.map((item) => (
                      <div key={item.label} className="flex items-start gap-2">
                        {item.included ? (
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        ) : (
                          <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                        )}
                        <span className={`text-xs leading-5 ${item.included ? 'text-slate-600' : 'text-slate-400 line-through'}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {currentStatus === ProposalStatus.ACCEPTED && (
                  <>
                    {hasPendingCancellation && (
                      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Cancellation request</p>
                        <p className="mt-2 text-sm font-bold text-amber-900">
                          {contract?.clientName || clientName} wants to cancel this job.
                        </p>
                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          Reason: {contract?.cancellationRequestReason || 'No reason provided.'}
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleOpenCancellationDecision('APPROVE')}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Approve cancel
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleOpenCancellationDecision('REJECT')}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-amber-300 bg-white text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                          >
                            Keep contract
                          </button>
                        </div>
                      </div>
                    )}

                    {cancellationRejected && contract?.cancellationResponseNote && (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
                        Latest cancellation decision note: {contract.cancellationResponseNote}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsChatDrawerOpen(true)}
                      className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      Open chat
                    </button>
                  </>
                )}

                {/* Action buttons */}
                {!isFinalized && (
                  <div className="mt-5 space-y-2">
                    {isClientOffer ? (
                      <>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleAccept}
                          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                        >
                          Accept This Offer
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleOpenCounter('COUNTER')}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                          >
                            Counter Offer
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={handleReject}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-rose-200 text-xs font-bold text-rose-500 transition hover:bg-rose-50 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="rounded-xl bg-slate-50 px-4 py-3 text-center border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Waiting for client</p>
                          <p className="mt-1 text-xs text-slate-400">The client is reviewing your latest offer.</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Escrow notice */}
              <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <p className="text-xs leading-5 text-slate-500"><span className="font-bold text-slate-700">Payment protected</span> by MentorHub Escrow.</p>
              </div>
            </section>
          </aside>
        </div>
      </div>

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

      {showCounterModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[560px] rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-950">
                  {counterMode === 'COUNTER' ? 'Counter Offer' : 'Request Changes'}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Update the amount, timeline, and message before sending back to the client.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCounterModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600">
                {error}
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">Proposed amount</span>
                <input
                  type="number"
                  value={counterAmount}
                  onChange={(event) => setCounterAmount(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">Delivery time (days)</span>
                <input
                  type="number"
                  value={counterDays}
                  onChange={(event) => setCounterDays(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </label>
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-bold text-slate-700">Message</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCounterModal(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSendCounter}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? 'Sending...' : 'Send response'}
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
  durationDays?: number
  sessions?: string
  tone: 'indigo' | 'amber' | 'violet' | 'slate'
}

function ConversationCard({ item, isLast, onCounter, onAccept }: { item: ConversationItem; isLast?: boolean; onCounter?: () => void; onAccept?: () => void }) {
  const isMentor = item.senderType === 'MENTOR'
  const isClientOffer = !isMentor && item.type === 'offer'
  const bubbleTone =
    item.tone === 'amber'
      ? 'border-amber-100 bg-amber-50/70'
      : item.tone === 'violet'
        ? 'border-violet-100 bg-violet-50/60'
        : item.tone === 'indigo'
          ? 'border-indigo-100 bg-indigo-50/60'
          : 'border-slate-200 bg-white'

  const accentText =
    item.tone === 'amber' ? 'text-amber-600' : item.tone === 'violet' ? 'text-violet-600' : 'text-indigo-600'

  return (
    <div className={`flex gap-3 ${isMentor ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar initials={getInitials(item.senderName)} size="sm" />
      <div className={`min-w-0 max-w-[85%]`}>
        <div className={`rounded-2xl border px-4 py-4 shadow-sm ${bubbleTone}`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-black ${accentText}`}>{item.title}</p>
            <span className="text-[11px] font-medium text-slate-400">{formatDateTime(item.createdAt)}</span>
          </div>

          {item.type === 'offer' ? (
            <div className="mt-3 flex flex-wrap items-center gap-4 rounded-xl border border-white/70 bg-white/90 px-4 py-3">
              <OfferFact icon={<Wallet className="h-3.5 w-3.5" />} value={item.amount ? formatCurrency(item.amount) : 'To discuss'} label="Price" />
              <div className="h-6 w-px bg-slate-200" />
              <OfferFact icon={<Clock3 className="h-3.5 w-3.5" />} value={item.durationDays ? `${item.durationDays} days` : 'Flexible'} label="Timeline" />
              <div className="h-6 w-px bg-slate-200" />
              <OfferFact icon={<MessageCircle className="h-3.5 w-3.5" />} value={item.sessions || '1 session'} label="Sessions" />
            </div>
          ) : null}

          {item.note ? (
            <p className={`mt-3 text-sm leading-6 ${item.type === 'offer' ? 'text-slate-600' : 'text-slate-700'}`}>
              {item.note}
            </p>
          ) : null}

          {/* Action buttons for the latest client offer */}
          {isLast && isClientOffer && onCounter ? (
            <div className="mt-3 flex items-center gap-2 border-t border-white/50 pt-3">
              <button type="button" onClick={onAccept} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-700">
                <Check className="h-3.5 w-3.5" />
                Accept
              </button>
              <button type="button" onClick={onCounter} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100">
                <PencilLine className="h-3.5 w-3.5" />
                Counter Offer
              </button>
            </div>
          ) : null}

          {isMentor ? (
            <div className="mt-2 flex items-center justify-end gap-1 text-[10px] font-medium text-slate-400">
              <CheckCheck className="h-3.5 w-3.5 text-indigo-500" />
              Sent
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function MetaRow({ label, value, subvalue }: { label: string; value: string; subvalue?: string }) {
  return (
    <div className="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-[28px] font-black tracking-tight text-slate-950">{value}</p>
        {subvalue ? <p className="text-xs font-medium text-slate-400">{subvalue}</p> : null}
      </div>
    </div>
  )
}

function AgreementCompare({
  title,
  current,
  currentLabel,
  original,
  originalLabel,
  diff,
}: {
  title: string
  current: string
  currentLabel: string
  original: string
  originalLabel: string
  diff?: string
}) {
  return (
    <div className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
      <p className="text-sm font-black text-slate-950">{title}</p>
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div>
          <p className="text-[32px] font-black tracking-tight text-slate-950">{current}</p>
          <p className="mt-1 text-sm text-slate-500">{currentLabel}</p>
          {diff ? <p className="mt-2 text-sm font-bold text-amber-500">{diff}</p> : null}
        </div>
        <div className="rounded-full border border-slate-200 px-2 py-1 text-xs font-bold text-slate-400">vs</div>
        <div className="text-right">
          <p className="text-[28px] font-black tracking-tight text-slate-950">{original}</p>
          <p className="mt-1 text-sm text-slate-500">{originalLabel}</p>
        </div>
      </div>
    </div>
  )
}

function ScopeLine({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'amber' | 'rose' }) {
  const toneClass = tone === 'emerald' ? 'text-emerald-500' : tone === 'amber' ? 'text-amber-500' : 'text-rose-500'
  return (
    <div className="grid grid-cols-[74px_1fr] gap-3">
      <span className={`font-bold ${toneClass}`}>{label}</span>
      <span className="text-slate-600">{value}</span>
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

function normalizeSessionCount(input: string) {
  const match = input.match(/(\d+)\s*(session|buoi|revision)/i)
  return match ? `${match[1]} ${match[2].toLowerCase()}` : '1 session'
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
