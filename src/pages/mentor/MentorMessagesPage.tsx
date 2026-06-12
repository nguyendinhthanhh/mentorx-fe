import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  CircleDollarSign,
  FileText,
  Info,
  Link2,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Video,
  X,
} from 'lucide-react'
import { chatApi } from '@/api/chatApi'
import { contractApi } from '@/api/contractApi'
import { FILE_UPLOAD_DIRS, fileApi } from '@/api/fileApi'
import { jobApi } from '@/api/jobApi'
import { proposalApi } from '@/api/proposalApi'
import { PromptInputBox } from '@/components/ui/ai-prompt-box'
import { useAuthStore } from '@/store/authStore'
import { ChatRoomResponse, ContractResponse, JobResponse, MessageResponse, MessageType, ProposalResponse, ProposalStatus } from '@/types'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'
import {
  MessageAttachment,
  MessageText,
  buildSharedFiles,
  buildSharedLinks,
  formatAttachmentMeta,
  formatMessageDate,
  formatMessageTime,
  formatRoomTime,
  getPresenceLabel,
  getPrimaryOtherMember,
  getRoomDisplayName,
  getRoomPreview,
  shortenUrl,
  shouldShowDateSeparator,
} from '@/pages/chat/chatShared'

type MentorInboxFilter = 'ALL' | 'UNREAD' | 'CONTRACTS' | 'PROPOSALS' | 'JOBS'

type ConversationContextMaps = {
  contractMap: Record<string, ContractResponse>
  proposalMap: Record<string, ProposalResponse>
  jobMap: Record<string, JobResponse>
}

const mentorFilters: Array<{ key: MentorInboxFilter; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'UNREAD', label: 'Unread' },
  { key: 'CONTRACTS', label: 'Contracts' },
  { key: 'PROPOSALS', label: 'Proposals' },
  { key: 'JOBS', label: 'Jobs' },
]

const contractStatusLabel: Record<string, string> = {
  ACTIVE: 'Active',
  PENDING_PAYMENT: 'Completion requested',
  UNDER_REVIEW: 'Under review',
  IN_DISPUTE: 'In dispute',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  TERMINATED: 'Cancelled',
}

const contractStatusTone: Record<string, string> = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PENDING_PAYMENT: 'border-sky-200 bg-sky-50 text-sky-700',
  UNDER_REVIEW: 'border-violet-200 bg-violet-50 text-violet-700',
  IN_DISPUTE: 'border-orange-200 bg-orange-50 text-orange-700',
  COMPLETED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
  TERMINATED: 'border-rose-200 bg-rose-50 text-rose-700',
}

const proposalStatusLabel: Record<ProposalStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_REQUESTED: 'Interview requested',
  NEGOTIATING: 'Negotiating',
  OFFER_ACCEPTED: 'Offer agreed',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  EXPIRED: 'Expired',
  AUTO_CLOSED: 'Closed',
  CONTRACT_CANCELLED: 'Contract cancelled',
}

const proposalStatusTone: Record<ProposalStatus, string> = {
  DRAFT: 'border-slate-200 bg-slate-100 text-slate-600',
  SUBMITTED: 'border-sky-200 bg-sky-50 text-sky-700',
  UNDER_REVIEW: 'border-violet-200 bg-violet-50 text-violet-700',
  SHORTLISTED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  INTERVIEW_REQUESTED: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  NEGOTIATING: 'border-amber-200 bg-amber-50 text-amber-700',
  OFFER_ACCEPTED: 'border-violet-200 bg-violet-50 text-violet-700',
  ACCEPTED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  WITHDRAWN: 'border-slate-200 bg-slate-100 text-slate-600',
  EXPIRED: 'border-slate-200 bg-slate-100 text-slate-600',
  AUTO_CLOSED: 'border-slate-200 bg-slate-100 text-slate-600',
  CONTRACT_CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
}

export default function MentorMessagesPage() {
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeFilter, setActiveFilter] = useState<MentorInboxFilter>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [composerError, setComposerError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [showContextPanel, setShowContextPanel] = useState(false)
  const selectedRoomId = searchParams.get('conversationId') || searchParams.get('roomId')

  const roomsQuery = useQuery(
    ['mentor-messages-rooms', user?.userId],
    () => chatApi.getUserRooms(user!.userId, { size: 100 }),
    {
      enabled: !!user?.userId,
      refetchInterval: 10000,
    }
  )

  const roomList = roomsQuery.data?.content || []
  const visibleRooms = useMemo(() => roomList.filter((room) => !room.isArchived), [roomList])

  const contextMapsQuery = useQuery<ConversationContextMaps>(
    ['mentor-message-context-maps', roomList.map((room) => `${room.referenceType || 'NONE'}:${room.referenceId || room.id}`).join('|')],
    async () => {
      const contractIds = Array.from(new Set(roomList.filter((room) => room.referenceType === 'CONTRACT' && room.referenceId).map((room) => room.referenceId!)))
      const proposalIds = Array.from(new Set(roomList.filter((room) => room.referenceType === 'PROPOSAL' && room.referenceId).map((room) => room.referenceId!)))
      const jobIds = Array.from(new Set(roomList.filter((room) => room.referenceType === 'JOB' && room.referenceId).map((room) => room.referenceId!)))

      const [contracts, proposals, jobs] = await Promise.all([
        Promise.all(contractIds.map(async (id) => contractApi.getMineById(id).catch(() => null))),
        Promise.all(proposalIds.map(async (id) => proposalApi.getById(id).catch(() => null))),
        Promise.all(jobIds.map(async (id) => jobApi.getById(id).catch(() => null))),
      ])

      return {
        contractMap: contracts.reduce<Record<string, ContractResponse>>((acc, contract) => {
          if (contract) acc[contract.id] = contract
          return acc
        }, {}),
        proposalMap: proposals.reduce<Record<string, ProposalResponse>>((acc, proposal) => {
          if (proposal) acc[proposal.id] = proposal
          return acc
        }, {}),
        jobMap: jobs.reduce<Record<string, JobResponse>>((acc, job) => {
          if (job) acc[job.jobId] = job
          return acc
        }, {}),
      }
    },
    {
      enabled: roomList.length > 0,
      keepPreviousData: true,
      staleTime: 60_000,
    }
  )

  const contextMaps = contextMapsQuery.data || { contractMap: {}, proposalMap: {}, jobMap: {} }

  const filteredRooms = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    return visibleRooms.filter((room) => {
      if (activeFilter === 'UNREAD' && room.unreadCount === 0) return false
      if (activeFilter === 'CONTRACTS' && room.referenceType !== 'CONTRACT') return false
      if (activeFilter === 'PROPOSALS' && room.referenceType !== 'PROPOSAL') return false
      if (activeFilter === 'JOBS' && room.referenceType !== 'JOB') return false
      if (!keyword) return true

      const haystack = [
        getRoomDisplayName(room, user?.userId),
        getRoomPreview(room),
        getContextTitle(room),
        formatContextLabel(room.referenceType),
        getContextStatusLabel(room, contextMaps),
        getParticipantRoleLabel(room, user?.userId),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(keyword)
    })
  }, [activeFilter, contextMaps, searchTerm, user?.userId, visibleRooms])

  const selectedRoom = useMemo(
    () => roomList.find((room) => room.id === selectedRoomId) || null,
    [roomList, selectedRoomId]
  )

  const effectiveRoom = useMemo(() => {
    if (selectedRoom) return selectedRoom
    return filteredRooms[0] || visibleRooms[0] || null
  }, [filteredRooms, selectedRoom, visibleRooms])

  const effectiveRoomId = effectiveRoom?.id || null

  useEffect(() => {
    if (roomsQuery.isLoading) return
    if (!selectedRoomId) {
      setSelectionError(null)
      return
    }
    if (selectedRoom) {
      setSelectionError(null)
      return
    }
    setSelectionError('You do not have access to this conversation.')
  }, [roomsQuery.isLoading, selectedRoom, selectedRoomId])

  const selectedMessagesQuery = useQuery(
    ['mentor-messages-thread', effectiveRoomId],
    () => chatApi.getRoomMessages(effectiveRoomId!, { size: 100 }),
    {
      enabled: !!effectiveRoomId,
      refetchInterval: effectiveRoomId ? 5000 : false,
    }
  )

  const selectedMessages = selectedMessagesQuery.data?.content || []
  const latestMessage = selectedMessages[selectedMessages.length - 1]
  const otherMember = useMemo(
    () => (effectiveRoom ? getPrimaryOtherMember(effectiveRoom, user?.userId) : undefined),
    [effectiveRoom, user?.userId]
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [selectedMessages.length, effectiveRoomId])

  useEffect(() => {
    if (!user?.userId || !effectiveRoom || !latestMessage) return
    if (!effectiveRoom.unreadCount || latestMessage.senderId === user.userId) return

    let cancelled = false
    chatApi
      .markAsRead(latestMessage.id, user.userId)
      .then(() => {
        if (!cancelled) void roomsQuery.refetch()
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [effectiveRoom, latestMessage, roomsQuery, user?.userId])

  const contractContextQuery = useQuery(
    ['mentor-message-contract-context', effectiveRoom?.referenceId],
    () => contractApi.getMineById(effectiveRoom!.referenceId!),
    {
      enabled: effectiveRoom?.referenceType === 'CONTRACT' && !!effectiveRoom.referenceId,
      retry: false,
    }
  )

  const proposalContextQuery = useQuery(
    ['mentor-message-proposal-context', effectiveRoom?.referenceId],
    () => proposalApi.getById(effectiveRoom!.referenceId!),
    {
      enabled: effectiveRoom?.referenceType === 'PROPOSAL' && !!effectiveRoom.referenceId,
      retry: false,
    }
  )

  const jobContextQuery = useQuery(
    ['mentor-message-job-context', effectiveRoom?.referenceId],
    () => jobApi.getById(effectiveRoom!.referenceId!),
    {
      enabled: effectiveRoom?.referenceType === 'JOB' && !!effectiveRoom.referenceId,
      retry: false,
    }
  )

  const contextMeta = useMemo(() => {
    if (!effectiveRoom) {
      return {
        actionLabel: undefined as string | undefined,
        actionHref: undefined as string | undefined,
        statusLabel: undefined as string | undefined,
        statusToneClassName: undefined as string | undefined,
        noMessagesDescription: 'Start the conversation with this client.',
      }
    }

    if (effectiveRoom.referenceType === 'CONTRACT') {
      const contract = (contextMaps.contractMap[effectiveRoom.referenceId || ''] || contractContextQuery.data) as ContractResponse | undefined
      return {
        actionLabel: 'View contract',
        actionHref: contract ? '/mentor/contracts' : undefined,
        statusLabel: contract ? contractStatusLabel[contract.status] || contract.status : undefined,
        statusToneClassName: contract ? contractStatusTone[contract.status] || undefined : undefined,
        noMessagesDescription: 'Start the conversation with this client.',
      }
    }

    if (effectiveRoom.referenceType === 'PROPOSAL') {
      const proposal = (contextMaps.proposalMap[effectiveRoom.referenceId || ''] || proposalContextQuery.data) as ProposalResponse | undefined
      return {
        actionLabel: proposal ? 'View proposal' : undefined,
        actionHref: proposal ? `/mentor/proposals/${proposal.id}` : undefined,
        statusLabel: proposal ? proposalStatusLabel[proposal.status] || proposal.status : undefined,
        statusToneClassName: proposal ? proposalStatusTone[proposal.status] || undefined : undefined,
        noMessagesDescription: 'Start the conversation with this client.',
      }
    }

    if (effectiveRoom.referenceType === 'JOB') {
      const job = (contextMaps.jobMap[effectiveRoom.referenceId || ''] || jobContextQuery.data) as JobResponse | undefined
      return {
        actionLabel: job ? 'View job' : undefined,
        actionHref: job ? `/jobs/${job.jobId}` : undefined,
        statusLabel: job ? formatJobStatus(job.status) : undefined,
        statusToneClassName: job ? getJobStatusTone(job.status) : undefined,
        noMessagesDescription: 'Start the conversation with this client.',
      }
    }

    return {
      actionLabel: undefined as string | undefined,
      actionHref: undefined as string | undefined,
      statusLabel: undefined as string | undefined,
      statusToneClassName: undefined as string | undefined,
      noMessagesDescription: 'Start the conversation with this client.',
    }
  }, [contextMaps, contractContextQuery.data, effectiveRoom, jobContextQuery.data, proposalContextQuery.data])

  const contextCard = useMemo(() => {
    if (!effectiveRoom) return null

    if (effectiveRoom.referenceType === 'CONTRACT') {
      const contract = (contextMaps.contractMap[effectiveRoom.referenceId || ''] || contractContextQuery.data) as ContractResponse | undefined
      if (!contract) return null
      return {
        title: contract.title || contract.jobTitle,
        description: contract.description || contract.deliverables || 'Contract conversation and delivery details.',
        metrics: [
          { label: 'Value', value: formatCurrency(contract.totalAmount || 0), icon: CircleDollarSign },
          {
            label: 'Progress',
            value: contract.milestoneCount > 0 ? `${contract.completedMilestoneCount}/${contract.milestoneCount} milestones` : `${contract.progressPercentage}% complete`,
            icon: CalendarDays,
          },
        ],
        primaryAction: contextMeta.actionHref && contextMeta.actionLabel ? { href: contextMeta.actionHref, label: contextMeta.actionLabel } : undefined,
        secondaryAction: { href: '/mentor/contracts', label: 'Open contracts' },
      }
    }

    if (effectiveRoom.referenceType === 'PROPOSAL') {
      const proposal = (contextMaps.proposalMap[effectiveRoom.referenceId || ''] || proposalContextQuery.data) as ProposalResponse | undefined
      if (!proposal) return null
      return {
        title: proposal.jobTitle,
        description: proposal.relevantExperience || proposal.coverLetter || 'Proposal discussion and negotiation thread.',
        metrics: [
          { label: 'Offer', value: formatCurrency(proposal.proposedAmount || proposal.proposedHourlyRate || 0), icon: CircleDollarSign },
          { label: 'Timeline', value: proposal.estimatedDurationDays ? `${proposal.estimatedDurationDays} days` : 'Flexible', icon: CalendarDays },
        ],
        primaryAction: contextMeta.actionHref && contextMeta.actionLabel ? { href: contextMeta.actionHref, label: contextMeta.actionLabel } : undefined,
        secondaryAction: { href: '/jobs', label: 'Find jobs' },
      }
    }

    if (effectiveRoom.referenceType === 'JOB') {
      const job = (contextMaps.jobMap[effectiveRoom.referenceId || ''] || jobContextQuery.data) as JobResponse | undefined
      if (!job) return null
      return {
        title: job.title,
        description: job.description || 'Job discussion and project discovery thread.',
        metrics: [
          { label: 'Budget', value: formatJobBudget(job), icon: CircleDollarSign },
          { label: 'Deadline', value: job.deadlineAt ? formatRoomDate(job.deadlineAt) : 'Flexible', icon: CalendarDays },
        ],
        primaryAction: contextMeta.actionHref && contextMeta.actionLabel ? { href: contextMeta.actionHref, label: contextMeta.actionLabel } : undefined,
        secondaryAction: { href: '/jobs', label: 'Browse jobs' },
      }
    }

    return {
      title: getRoomDisplayName(effectiveRoom, user?.userId),
      description: effectiveRoom.description || 'Direct conversation space.',
      metrics: [
        { label: 'Type', value: formatContextLabel(effectiveRoom.referenceType), icon: FileText },
        { label: 'Messages', value: String(effectiveRoom.messageCount || 0), icon: MessageCircle },
      ],
      primaryAction: undefined,
      secondaryAction: undefined,
    }
  }, [
    contextMaps.contractMap,
    contextMaps.jobMap,
    contextMaps.proposalMap,
    contractContextQuery.data,
    contextMeta.actionHref,
    contextMeta.actionLabel,
    effectiveRoom,
    jobContextQuery.data,
    proposalContextQuery.data,
    user?.userId,
  ])

  const counts = useMemo(
    () => ({
      ALL: visibleRooms.length,
      UNREAD: visibleRooms.filter((room) => room.unreadCount > 0).length,
      CONTRACTS: visibleRooms.filter((room) => room.referenceType === 'CONTRACT').length,
      PROPOSALS: visibleRooms.filter((room) => room.referenceType === 'PROPOSAL').length,
      JOBS: visibleRooms.filter((room) => room.referenceType === 'JOB').length,
    }),
    [visibleRooms]
  )

  const sharedFiles = useMemo(() => buildSharedFiles(selectedMessages).slice(-4).reverse(), [selectedMessages])
  const sharedLinks = useMemo(() => buildSharedLinks(selectedMessages).slice(-2).reverse(), [selectedMessages])

  const handleSelectRoom = (roomId: string) => {
    setSelectionError(null)
    setSearchParams({ conversationId: roomId })
  }

  const handleSendMessage = async (message: string, files: File[] = []) => {
    const trimmedMessage = message.trim()
    if ((!trimmedMessage && files.length === 0) || !effectiveRoomId || !user?.userId || isSending) return

    setComposerError(null)
    setIsSending(true)

    try {
      if (files.length === 0) {
        await chatApi.sendMessage({
          chatRoomId: effectiveRoomId,
          senderId: user.userId,
          content: trimmedMessage,
          messageType: MessageType.TEXT,
        })
      } else {
        for (const [index, file] of files.entries()) {
          const uploadedFile = await fileApi.upload(file, { subDirectory: FILE_UPLOAD_DIRS.PUBLIC_CHAT })
          const isImage = file.type.startsWith('image/')

          await chatApi.sendMessage({
            chatRoomId: effectiveRoomId,
            senderId: user.userId,
            content: index === 0 ? trimmedMessage : '',
            messageType: isImage ? MessageType.IMAGE : MessageType.FILE,
            attachmentUrl: uploadedFile.fileUrl,
            attachmentFilename: file.name,
            attachmentMimeType: file.type || uploadedFile.fileType,
            attachmentSize: file.size,
            metadata: {
              uploadedFileName: uploadedFile.fileName,
              originalFileName: file.name,
            },
          })
        }
      }

      await Promise.all([selectedMessagesQuery.refetch(), roomsQuery.refetch()])
    } catch (error: any) {
      setComposerError(error?.response?.data?.message || 'Unable to send this message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  if (!user) return null

  if (roomsQuery.isLoading) {
    return <MentorMessagesWorkspaceLoading />
  }

  if (visibleRooms.length === 0) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
          <MessageCircle className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">No messages yet</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          When you message a client from a proposal or contract, conversations will appear here.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/jobs"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Find jobs
          </Link>
          <Link
            to="/mentor/proposals"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            View proposals
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {selectionError ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
          {selectionError}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.22)]">
        <div className={`grid min-h-[calc(100dvh-180px)] ${showContextPanel ? '2xl:grid-cols-[340px_minmax(0,1fr)_300px]' : '2xl:grid-cols-[340px_minmax(0,1fr)]'}`}>
          <aside className="border-b border-slate-200 xl:border-b-0 xl:border-r">
            <div className="border-b border-slate-100 px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-[18px] font-bold tracking-[-0.02em] text-slate-950">Messages</h1>
                  <p className="mt-1 text-[13px] font-medium text-slate-500">
                    {counts.UNREAD > 0 ? `${counts.UNREAD} unread conversations` : 'All caught up'}
                  </p>
                </div>
              </div>

              <div className="relative mt-4">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search conversations"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {mentorFilters.map((filter) => {
                  const active = activeFilter === filter.key
                  return (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setActiveFilter(filter.key)}
                      className={`inline-flex h-8 items-center gap-2 rounded-full px-3 text-[12px] font-semibold transition ${
                        active ? 'bg-indigo-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {filter.label}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {counts[filter.key]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="max-h-[calc(100dvh-340px)] overflow-y-auto xl:max-h-[calc(100dvh-245px)]">
              {filteredRooms.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-base font-black text-slate-950">No conversations found</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Try another keyword or clear filters.</p>
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <WorkspaceConversationRow
                    key={room.id}
                    room={room}
                    currentUserId={user.userId}
                    contextMaps={contextMaps}
                    isActive={room.id === effectiveRoomId}
                    onSelect={handleSelectRoom}
                  />
                ))
              )}
            </div>
          </aside>

          <section className={`border-b border-slate-200 xl:border-b-0 ${showContextPanel ? '2xl:border-r' : ''}`}>
            {effectiveRoom ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <AvatarBadge
                        name={otherMember?.displayName || otherMember?.fullName || getRoomDisplayName(effectiveRoom, user.userId)}
                        avatarUrl={otherMember?.avatarUrl || effectiveRoom.avatarUrl}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-[18px] font-bold tracking-[-0.02em] text-slate-950">
                            {otherMember?.displayName || otherMember?.fullName || getRoomDisplayName(effectiveRoom, user.userId)}
                          </h2>
                        </div>
                        <p className="mt-0.5 text-[13px] font-medium text-emerald-600">
                          {otherMember?.isOnline ? 'Online' : getPresenceLabel(otherMember)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="hidden items-center gap-2 sm:flex">
                        <HeaderActionButton icon={<Briefcase className="h-4 w-4" />} label="Context" href={contextMeta.actionHref} />
                        <HeaderActionButton icon={<Video className="h-4 w-4" />} label="Meet" href="/mentor/schedule" />
                      </div>
                      <button
                        type="button"
                        title="Info"
                        onClick={() => setShowContextPanel(true)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-700"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#ffffff,#fafbff)] px-5 py-5">
                  {selectedMessagesQuery.isLoading ? (
                    <MessageThreadLoading />
                  ) : selectedMessages.length === 0 ? (
                    <div className="flex min-h-[360px] items-center justify-center">
                      <div className="max-w-sm text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                          <Send className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-slate-950">No messages yet</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{contextMeta.noMessagesDescription}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedMessages.map((message, index) => (
                        <WorkspaceMessageBubble
                          key={message.id}
                          message={message}
                          previousMessage={selectedMessages[index - 1]}
                          mine={message.senderId === user.userId}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 bg-white px-5 py-4">
                  <PromptInputBox
                    onSend={(msg, files) => handleSendMessage(msg, files || [])}
                    isLoading={isSending}
                    placeholder="Type your message..."
                    className="rounded-[24px] border border-slate-200 shadow-none"
                  />
                  {composerError ? <p className="px-2 pt-3 text-sm text-rose-500">{composerError}</p> : null}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center px-6 py-16">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 text-base font-bold text-slate-950">Select a conversation</h2>
                  <p className="mt-2 text-sm text-slate-500">Choose a room from the inbox to read messages and files.</p>
                </div>
              </div>
            )}
          </section>

          {showContextPanel ? (
          <aside className="hidden bg-white 2xl:block">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-900">Project Context</p>
                <button
                  type="button"
                  onClick={() => setShowContextPanel(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
                  aria-label="Close project context"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-5">
              {contextCard ? (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600">{formatContextLabel(effectiveRoom?.referenceType)}</p>
                  <h3 className="mt-2 text-[15px] font-bold leading-6 text-slate-950">{contextCard.title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-slate-500">{truncateText(contextCard.description, 180)}</p>
                </div>
              ) : (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-500">
                  Conversation details are loading.
                </div>
              )}

              <div className="space-y-4">
                {contextCard?.metrics.map((metric) => (
                  <div key={metric.label} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <metric.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-400">{metric.label}</p>
                      <p className="mt-1 text-[15px] font-bold text-slate-950">{metric.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {contextCard?.primaryAction ? (
                  <Link
                    to={contextCard.primaryAction.href}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    {contextCard.primaryAction.label}
                  </Link>
                ) : null}
                {contextCard?.secondaryAction ? (
                  <Link
                    to={contextCard.secondaryAction.href}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {contextCard.secondaryAction.label}
                  </Link>
                ) : null}
              </div>

              <div className="border-t border-slate-100 pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-400">Shared Files</p>
                  {contextMeta.actionHref ? (
                    <Link to={contextMeta.actionHref} className="text-sm font-black text-indigo-600">
                      See all
                    </Link>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {sharedFiles.length === 0 && sharedLinks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-400">
                      No shared files yet.
                    </div>
                  ) : (
                    <>
                      {sharedFiles.map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-start gap-3 rounded-2xl px-2 py-2 transition hover:bg-slate-50"
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-semibold text-slate-950">{file.name}</p>
                            <p className="mt-1 text-[13px] text-slate-400">{file.meta}</p>
                          </div>
                        </a>
                      ))}
                      {sharedLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-start gap-3 rounded-2xl px-2 py-2 transition hover:bg-slate-50"
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                            <Link2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-semibold text-slate-950">{shortenUrl(link.url)}</p>
                            <p className="mt-1 text-[13px] text-slate-400">{link.host}</p>
                          </div>
                        </a>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </aside>
          ) : null}
        </div>
      </section>

      {showContextPanel ? (
        <div className="fixed inset-0 z-40 bg-slate-950/30 2xl:hidden">
          <div
            className="absolute inset-0"
            onClick={() => setShowContextPanel(false)}
            aria-hidden="true"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[380px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-900">Project Context</p>
                <button
                  type="button"
                  onClick={() => setShowContextPanel(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
                  aria-label="Close project context"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-5">
              {contextCard ? (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600">{formatContextLabel(effectiveRoom?.referenceType)}</p>
                  <h3 className="mt-2 text-[15px] font-bold leading-6 text-slate-950">{contextCard.title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-slate-500">{truncateText(contextCard.description, 180)}</p>
                </div>
              ) : (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-500">
                  Conversation details are loading.
                </div>
              )}

              <div className="space-y-4">
                {contextCard?.metrics.map((metric) => (
                  <div key={metric.label} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <metric.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-400">{metric.label}</p>
                      <p className="mt-1 text-[15px] font-bold text-slate-950">{metric.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {contextCard?.primaryAction ? (
                  <Link
                    to={contextCard.primaryAction.href}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    {contextCard.primaryAction.label}
                  </Link>
                ) : null}
                {contextCard?.secondaryAction ? (
                  <Link
                    to={contextCard.secondaryAction.href}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {contextCard.secondaryAction.label}
                  </Link>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}

function WorkspaceConversationRow({
  room,
  currentUserId,
  contextMaps,
  isActive,
  onSelect,
}: {
  room: ChatRoomResponse
  currentUserId: string
  contextMaps: ConversationContextMaps
  isActive: boolean
  onSelect: (roomId: string) => void
}) {
  const roomName = getRoomDisplayName(room, currentUserId)
  const otherMember = room.members.find((member) => member.userId !== currentUserId) || room.members[0]
  const contextTitle = getContextTitle(room)
  const contextStatusLabel = getContextStatusLabel(room, contextMaps)
  const participantRoleLabel = getParticipantRoleLabel(room, currentUserId)
  const conversationStateLabel = getConversationStateLabel(room, currentUserId)
  const isUnread = room.unreadCount > 0

  return (
    <button
      type="button"
      onClick={() => onSelect(room.id)}
      className={`w-full border-b border-slate-100 px-5 py-4 text-left transition ${
        isActive ? 'bg-[linear-gradient(180deg,#edf3ff,#e7f0ff)] shadow-[inset_-3px_0_0_0_#2563eb]' : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <AvatarBadge
          name={roomName}
          avatarUrl={otherMember?.avatarUrl || room.avatarUrl}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`truncate text-[15px] ${isUnread ? 'font-bold text-slate-950' : 'font-semibold text-slate-900'}`}>{roomName}</p>
              <p className="mt-0.5 truncate text-[13px] font-medium text-indigo-600">{contextTitle || formatContextLabel(room.referenceType)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-medium text-slate-400">{formatRoomTime(room.lastMessageAt || room.updatedAt)}</p>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[13px] text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="truncate">{getRoomPreview(room)}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-5 items-center rounded-full bg-white px-2.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
              {participantRoleLabel}
            </span>
            {contextStatusLabel ? (
              <span className={`inline-flex h-5 items-center rounded-full border px-2.5 text-[10px] font-semibold ${getContextStatusTone(room, contextMaps)}`}>
                {contextStatusLabel}
              </span>
            ) : null}
            <span className={`inline-flex h-5 items-center rounded-full border px-2.5 text-[10px] font-semibold ${getConversationStateTone(room, currentUserId)}`}>
              {conversationStateLabel}
            </span>
            {room.unreadCount > 0 ? (
              <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-black text-white">
                {room.unreadCount}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  )
}

function WorkspaceMessageBubble({
  message,
  previousMessage,
  mine,
}: {
  message: MessageResponse
  previousMessage?: MessageResponse
  mine: boolean
}) {
  const showDate = shouldShowDateSeparator(previousMessage, message)

  return (
    <div>
      {showDate ? (
        <div className="mb-6 flex items-center justify-center">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
            {formatMessageDate(message.sentAt)}
          </span>
        </div>
      ) : null}

      <div className={`flex gap-3 ${mine ? 'justify-end' : 'justify-start'}`}>
        {!mine ? (
          <div className="mt-1 hidden sm:block">
            <AvatarBadge name={message.senderName} avatarUrl={message.senderAvatarUrl} size="xs" />
          </div>
        ) : null}

        <div className={`max-w-[78%] ${mine ? 'items-end' : 'items-start'}`}>
          <div
            className={`rounded-[22px] px-4 py-3.5 shadow-sm ${
              mine
                ? 'bg-[linear-gradient(180deg,#2f67f6,#2457dc)] text-white'
                : 'border border-slate-200 bg-white text-slate-900'
            }`}
          >
            <MessageText content={message.content} mine={mine} />
            <MessageAttachment message={message} mine={mine} />
          </div>
          <p className={`mt-2 px-1 text-xs text-slate-400 ${mine ? 'text-right' : ''}`}>
            {formatMessageTime(message.sentAt)}
          </p>
        </div>
      </div>
    </div>
  )
}

function AvatarBadge({
  name,
  avatarUrl,
  size = 'md',
}: {
  name: string
  avatarUrl?: string
  size?: 'xs' | 'sm' | 'md'
}) {
  const sizeClasses = {
    xs: 'h-9 w-9 text-xs',
    sm: 'h-11 w-11 text-sm',
    md: 'h-12 w-12 text-base',
  }[size]

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${sizeClasses} rounded-full object-cover`} />
  }

  return (
    <div className={`flex ${sizeClasses} items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,_#dbeafe,_#c7d2fe_55%,_#e2e8f0)] font-black text-indigo-700`}>
      {name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')}
    </div>
  )
}

function HeaderActionButton({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode
  label: string
  href?: string
}) {
  if (!href) {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400">
        {icon}
      </span>
    )
  }

  return (
    <Link
      to={href}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-700"
    >
      {icon}
    </Link>
  )
}

function MessageThreadLoading() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className="w-full max-w-[70%] space-y-2">
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100" />
            <div className="h-28 animate-pulse rounded-[26px] bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MentorMessagesWorkspaceLoading() {
  return (
    <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm">
      <div className="grid min-h-[calc(100vh-180px)] xl:grid-cols-[360px_minmax(0,1fr)_320px]">
        <div className="border-r border-slate-100 p-5">
          <div className="h-10 w-40 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-4 h-11 w-full animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-9 w-20 animate-pulse rounded-full bg-slate-100" />
            ))}
          </div>
          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-slate-100" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-3 w-56 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-r border-slate-100 p-5">
          <div className="h-14 w-72 animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-8 space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="h-28 w-[70%] animate-pulse rounded-[26px] bg-slate-100" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="h-5 w-40 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-6 h-44 animate-pulse rounded-[26px] bg-slate-100" />
          <div className="mt-6 space-y-4">
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  )
}

function formatContextLabel(referenceType?: string) {
  if (referenceType === 'CONTRACT') return 'Contract'
  if (referenceType === 'PROPOSAL') return 'Proposal'
  if (referenceType === 'JOB') return 'Job'
  return 'General'
}

function getContextTitle(room: ChatRoomResponse) {
  if (!room.description) return room.roomName || ''
  const segments = room.description.split('Ã‚Â·').map((segment) => segment.trim()).filter(Boolean)
  if (segments.length > 1) return segments.slice(1).join(' Â· ')
  return room.description
}

function formatJobStatus(status?: string) {
  if (!status) return undefined
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getJobStatusTone(status?: string) {
  if (status === 'OPEN') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'IN_PROGRESS') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'COMPLETED') return 'border-indigo-200 bg-indigo-50 text-indigo-700'
  if (status === 'CLOSED' || status === 'CANCELLED') return 'border-slate-200 bg-slate-100 text-slate-600'
  return 'border-slate-200 bg-slate-100 text-slate-600'
}

function getParticipantRoleLabel(room: ChatRoomResponse, currentUserId?: string) {
  const otherMember = room.members.find((member) => member.userId !== currentUserId) || room.members[0]
  if (room.referenceType === 'CONTRACT' || room.referenceType === 'PROPOSAL' || room.referenceType === 'JOB') {
    return 'Client'
  }
  const rawRole = otherMember?.memberRole?.toUpperCase()
  if (rawRole?.includes('ADMIN')) return 'Admin'
  if (rawRole?.includes('SYSTEM')) return 'System'
  if (rawRole?.includes('MENTOR')) return 'Mentor'
  if (rawRole?.includes('CLIENT') || rawRole?.includes('USER')) return 'Client'
  return 'Participant'
}

function getContextStatusLabel(room: ChatRoomResponse, contextMaps: ConversationContextMaps) {
  if (room.referenceType === 'CONTRACT' && room.referenceId) {
    const contract = contextMaps.contractMap[room.referenceId]
    if (!contract) return undefined
    return contract.status === 'ACTIVE' && contract.fundsInEscrow ? 'Escrow locked' : contractStatusLabel[contract.status] || contract.status
  }
  if (room.referenceType === 'PROPOSAL' && room.referenceId) {
    const proposal = contextMaps.proposalMap[room.referenceId]
    return proposal ? proposalStatusLabel[proposal.status] || proposal.status : undefined
  }
  if (room.referenceType === 'JOB' && room.referenceId) {
    const job = contextMaps.jobMap[room.referenceId]
    return job ? formatJobStatus(job.status) : undefined
  }
  return undefined
}

function getContextStatusTone(room: ChatRoomResponse, contextMaps: ConversationContextMaps) {
  if (room.referenceType === 'CONTRACT' && room.referenceId) {
    const contract = contextMaps.contractMap[room.referenceId]
    if (!contract) return 'border-slate-200 bg-slate-100 text-slate-600'
    if (contract.status === 'ACTIVE' && contract.fundsInEscrow) return 'border-sky-200 bg-sky-50 text-sky-700'
    return contractStatusTone[contract.status] || 'border-slate-200 bg-slate-100 text-slate-600'
  }
  if (room.referenceType === 'PROPOSAL' && room.referenceId) {
    const proposal = contextMaps.proposalMap[room.referenceId]
    return proposal ? proposalStatusTone[proposal.status] || 'border-slate-200 bg-slate-100 text-slate-600' : 'border-slate-200 bg-slate-100 text-slate-600'
  }
  if (room.referenceType === 'JOB' && room.referenceId) {
    const job = contextMaps.jobMap[room.referenceId]
    return job ? getJobStatusTone(job.status) : 'border-slate-200 bg-slate-100 text-slate-600'
  }
  return 'border-slate-200 bg-slate-100 text-slate-600'
}

function getConversationStateLabel(room: ChatRoomResponse, currentUserId: string) {
  if (!room.lastMessagePreview && !room.lastMessageAt) return 'No messages yet'
  if (room.unreadCount > 0) return 'Unread'
  if (room.lastMessageSenderId === currentUserId) return 'Waiting for client'
  return 'Waiting for you'
}

function getConversationStateTone(room: ChatRoomResponse, currentUserId: string) {
  const state = getConversationStateLabel(room, currentUserId)
  if (state === 'Unread') return 'border-indigo-200 bg-indigo-50 text-indigo-700'
  if (state === 'Waiting for client') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (state === 'Waiting for you') return 'border-rose-200 bg-rose-50 text-rose-700'
  return 'border-slate-200 bg-slate-100 text-slate-600'
}

function formatJobBudget(job: JobResponse) {
  if (job.budgetType === 'HOURLY' && job.hourlyRateMxc) return `${formatCurrency(job.hourlyRateMxc)}/hr`
  if (job.budgetMinMxc || job.budgetMaxMxc) {
    if (job.budgetMinMxc && job.budgetMaxMxc) return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
    return formatCurrency(job.budgetMaxMxc || job.budgetMinMxc || 0)
  }
  return 'Budget flexible'
}

function formatRoomDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value))
}

function truncateText(value?: string, limit = 120) {
  if (!value) return ''
  return value.length > limit ? `${value.slice(0, limit).trim()}...` : value
}
