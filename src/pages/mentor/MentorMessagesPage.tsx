import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { ArrowLeft, ChevronRight, MessageCircle, Search } from 'lucide-react'
import { chatApi } from '@/api/chatApi'
import { contractApi } from '@/api/contractApi'
import { fileApi } from '@/api/fileApi'
import { jobApi } from '@/api/jobApi'
import { proposalApi } from '@/api/proposalApi'
import ConversationPane from '@/pages/chat/components/ConversationPane'
import { useAuthStore } from '@/store/authStore'
import { ChatRoomResponse, ContractResponse, JobResponse, MessageType, ProposalResponse, ProposalStatus } from '@/types'
import { formatRelativeTime } from '@/utils/formatters'
import {
  formatRoomTime,
  getPrimaryOtherMember,
  getRoomDisplayName,
  getRoomPreview,
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
    return roomList.filter((room) => {
      if (room.isArchived) return false
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
  }, [activeFilter, contextMaps, roomList, searchTerm, user?.userId])

  const selectedRoom = useMemo(
    () => roomList.find((room) => room.id === selectedRoomId) || null,
    [roomList, selectedRoomId]
  )

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
    ['mentor-messages-thread', selectedRoomId],
    () => chatApi.getRoomMessages(selectedRoomId!, { size: 100 }),
    {
      enabled: !!selectedRoomId && !!selectedRoom,
      refetchInterval: selectedRoomId ? 5000 : false,
    }
  )

  const selectedMessages = selectedMessagesQuery.data?.content || []
  const latestMessage = selectedMessages[selectedMessages.length - 1]
  const otherMember = useMemo(
    () => (selectedRoom ? getPrimaryOtherMember(selectedRoom, user?.userId) : undefined),
    [selectedRoom, user?.userId]
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [selectedMessages.length, selectedRoomId])

  useEffect(() => {
    if (!user?.userId || !selectedRoom || !latestMessage) return
    if (!selectedRoom.unreadCount || latestMessage.senderId === user.userId) return

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
  }, [latestMessage, roomsQuery, selectedRoom, user?.userId])

  const contractContextQuery = useQuery(
    ['mentor-message-contract-context', selectedRoom?.referenceId],
    () => contractApi.getMineById(selectedRoom!.referenceId!),
    {
      enabled: selectedRoom?.referenceType === 'CONTRACT' && !!selectedRoom?.referenceId,
      retry: false,
    }
  )

  const proposalContextQuery = useQuery(
    ['mentor-message-proposal-context', selectedRoom?.referenceId],
    () => proposalApi.getById(selectedRoom!.referenceId!),
    {
      enabled: selectedRoom?.referenceType === 'PROPOSAL' && !!selectedRoom?.referenceId,
      retry: false,
    }
  )

  const jobContextQuery = useQuery(
    ['mentor-message-job-context', selectedRoom?.referenceId],
    () => jobApi.getById(selectedRoom!.referenceId!),
    {
      enabled: selectedRoom?.referenceType === 'JOB' && !!selectedRoom?.referenceId,
      retry: false,
    }
  )

  const contextMeta = useMemo(() => {
    if (!selectedRoom) {
      return {
        actionLabel: undefined as string | undefined,
        actionHref: undefined as string | undefined,
        statusLabel: undefined as string | undefined,
        statusToneClassName: undefined as string | undefined,
        noMessagesDescription: 'Start the conversation with this client.',
      }
    }

    if (selectedRoom.referenceType === 'CONTRACT') {
      const contract = (contextMaps.contractMap[selectedRoom.referenceId || ''] || contractContextQuery.data) as ContractResponse | undefined
      return {
        actionLabel: 'View contract',
        actionHref: contract ? '/mentor/contracts' : undefined,
        statusLabel: contract ? contractStatusLabel[contract.status] || contract.status : undefined,
        statusToneClassName: contract ? contractStatusTone[contract.status] || undefined : undefined,
        noMessagesDescription: 'Start the conversation with this client.',
      }
    }

    if (selectedRoom.referenceType === 'PROPOSAL') {
      const proposal = (contextMaps.proposalMap[selectedRoom.referenceId || ''] || proposalContextQuery.data) as ProposalResponse | undefined
      return {
        actionLabel: proposal ? 'View proposal' : undefined,
        actionHref: proposal ? `/mentor/proposals/${proposal.id}` : undefined,
        statusLabel: proposal ? proposalStatusLabel[proposal.status] || proposal.status : undefined,
        statusToneClassName: proposal ? proposalStatusTone[proposal.status] || undefined : undefined,
        noMessagesDescription: 'Start the conversation with this client.',
      }
    }

    if (selectedRoom.referenceType === 'JOB') {
      const job = (contextMaps.jobMap[selectedRoom.referenceId || ''] || jobContextQuery.data) as JobResponse | undefined
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
  }, [contextMaps, contractContextQuery.data, jobContextQuery.data, proposalContextQuery.data, selectedRoom])

  const handleSelectRoom = (roomId: string) => {
    setSelectionError(null)
    setSearchParams({ conversationId: roomId })
  }

  const handleBackToInbox = () => {
    setComposerError(null)
    setSelectionError(null)
    setSearchParams({})
  }

  const handleSendMessage = async (message: string, files: File[] = []) => {
    const trimmedMessage = message.trim()
    if ((!trimmedMessage && files.length === 0) || !selectedRoomId || !user?.userId || isSending) return

    setComposerError(null)
    setIsSending(true)

    try {
      if (files.length === 0) {
        await chatApi.sendMessage({
          chatRoomId: selectedRoomId,
          senderId: user.userId,
          content: trimmedMessage,
          messageType: MessageType.TEXT,
        })
      } else {
        for (const [index, file] of files.entries()) {
          const uploadedFile = await fileApi.upload(file)
          const isImage = file.type.startsWith('image/')

          await chatApi.sendMessage({
            chatRoomId: selectedRoomId,
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

  const counts = useMemo(
    () => ({
      ALL: roomList.filter((room) => !room.isArchived).length,
      UNREAD: roomList.filter((room) => !room.isArchived && room.unreadCount > 0).length,
      CONTRACTS: roomList.filter((room) => !room.isArchived && room.referenceType === 'CONTRACT').length,
      PROPOSALS: roomList.filter((room) => !room.isArchived && room.referenceType === 'PROPOSAL').length,
      JOBS: roomList.filter((room) => !room.isArchived && room.referenceType === 'JOB').length,
    }),
    [roomList]
  )

  if (!user) return null

  if (selectedRoomId && !selectionError && selectedRoom) {
    return (
      <div className="mx-auto max-w-[1040px] space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackToInbox}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            title="Back to messages"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-[28px] font-black tracking-tight text-slate-950">Messages</h1>
            <p className="mt-1 text-sm text-slate-500">Conversations with clients and job owners.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <ConversationPane
            selectedRoom={selectedRoom}
            selectedMessages={selectedMessages}
            currentUserId={user.userId}
            otherMember={otherMember}
            messagesLoading={selectedMessagesQuery.isLoading}
            scrollRef={scrollRef}
            messageInput=""
            onMessageInputChange={() => {}}
            queuedAttachments={[]}
            onAttachmentSelect={() => {}}
            onRemoveAttachment={() => {}}
            onSendMessage={handleSendMessage}
            fileInputRef={{ current: null }}
            onOpenFilePicker={() => {}}
            composerError={composerError}
            isSending={isSending}
            onShowDetails={() => undefined}
            onBackToList={handleBackToInbox}
            showBackButton
            heightClassName="h-[calc(100vh-220px)]"
            contextStatusLabel={contextMeta.statusLabel}
            contextStatusToneClassName={contextMeta.statusToneClassName}
            contextActionLabel={contextMeta.actionLabel}
            contextActionHref={contextMeta.actionHref}
            participantRoleLabel={getParticipantRoleLabel(selectedRoom, user.userId)}
            noMessagesTitle="No messages yet"
            noMessagesDescription={contextMeta.noMessagesDescription}
            showUtilityActions={false}
            showDetailsButton={false}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1040px] space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[32px] font-black tracking-tight text-slate-950">Messages</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Conversations with clients and job owners.</p>
        </div>
        <div className="text-sm font-semibold text-indigo-600">
          {counts.UNREAD > 0 ? `${counts.UNREAD} unread` : 'All caught up'}
        </div>
      </div>

      {selectionError ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
          {selectionError}
        </div>
      ) : null}

      {roomsQuery.isLoading ? (
        <MentorMessagesLoadingState />
      ) : roomList.filter((room) => !room.isArchived).length === 0 ? (
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
              to="/mentor/jobs"
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
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search messages, clients, jobs..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
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
                    className={`inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-xs font-bold transition ${
                      active ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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

          <div className="divide-y divide-slate-100">
            {filteredRooms.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-base font-black text-slate-950">No conversations found</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">Try another keyword or clear filters.</p>
              </div>
            ) : (
              filteredRooms.map((room) => (
                <ConversationRow
                  key={room.id}
                  room={room}
                  currentUserId={user.userId}
                  contextMaps={contextMaps}
                  onSelect={handleSelectRoom}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ConversationRow({
  room,
  currentUserId,
  contextMaps,
  onSelect,
}: {
  room: ChatRoomResponse
  currentUserId: string
  contextMaps: ConversationContextMaps
  onSelect: (roomId: string) => void
}) {
  const roomName = getRoomDisplayName(room, currentUserId)
  const otherMember = room.members.find((member) => member.userId !== currentUserId) || room.members[0]
  const contextLabel = formatContextLabel(room.referenceType)
  const contextTitle = getContextTitle(room)
  const contextStatusLabel = getContextStatusLabel(room, contextMaps)
  const contextStatusToneClassName = getContextStatusTone(room, contextMaps)
  const participantRoleLabel = getParticipantRoleLabel(room, currentUserId)
  const conversationStateLabel = getConversationStateLabel(room, currentUserId)
  const isUnread = room.unreadCount > 0
  const timeLabel = formatRoomTime(room.lastMessageAt || room.updatedAt)
  const avatarLabel = roomName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <button
      type="button"
      onClick={() => onSelect(room.id)}
      className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
    >
      <div className="relative shrink-0">
        {otherMember?.avatarUrl || room.avatarUrl ? (
          <img
            src={otherMember?.avatarUrl || room.avatarUrl}
            alt={roomName}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-black text-white">
            {avatarLabel}
          </div>
        )}
        {otherMember?.isOnline ? <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" /> : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className={`truncate text-[15px] ${isUnread ? 'font-black text-slate-950' : 'font-bold text-slate-900'}`}>{roomName}</p>
              <span className="text-[11px] font-medium text-slate-400">{participantRoleLabel}</span>
            </div>
            <p className="mt-1 truncate text-sm font-medium text-slate-600">{contextTitle || room.roomName || 'Conversation'}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-medium text-slate-400">{timeLabel}</p>
            {room.unreadCount > 0 ? (
              <span className="mt-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">
                {room.unreadCount}
              </span>
            ) : null}
          </div>
        </div>

        <p className={`mt-2 truncate text-sm ${isUnread ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>{getRoomPreview(room)}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex h-6 items-center rounded-full bg-slate-100 px-2.5 text-[11px] font-bold text-slate-600">
            {contextLabel}
          </span>
          {contextStatusLabel ? (
            <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-bold ${contextStatusToneClassName}`}>
              {contextStatusLabel}
            </span>
          ) : null}
          <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-bold ${getConversationStateTone(room, currentUserId)}`}>
            {conversationStateLabel}
          </span>
          {room.lastMessageAt ? <span className="text-[11px] text-slate-400">{formatRelativeTime(room.lastMessageAt)}</span> : null}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </button>
  )
}

function MentorMessagesLoadingState() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="h-11 w-full animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-9 w-20 animate-pulse rounded-full bg-slate-100" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-4">
            <div className="h-14 w-14 animate-pulse rounded-full bg-slate-100" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-56 animate-pulse rounded-full bg-slate-100" />
              <div className="h-3 w-64 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
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
  const segments = room.description.split('Â·').map((segment) => segment.trim()).filter(Boolean)
  if (segments.length > 1) return segments.slice(1).join(' · ')
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
