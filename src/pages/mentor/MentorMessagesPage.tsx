import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
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
  AlertCircle,
  Clock,
} from 'lucide-react'
import ActiveContractActions from '@/pages/chat/components/ActiveContractActions'
import { chatApi } from '@/api/chatApi'
import { contractApi } from '@/api/contractApi'
import { FILE_UPLOAD_DIRS, fileApi } from '@/api/fileApi'
import { jobApi } from '@/api/jobApi'
import { proposalApi } from '@/api/proposalApi'
import { PromptInputBox } from '@/components/ui/ai-prompt-box'
import { useAuthStore } from '@/store/authStore'
import { ChatRoomResponse, ContractResponse, JobResponse, MessageResponse, MessageType, PaginatedResponse, ProposalResponse, ProposalStatus } from '@/types'
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
  { key: 'ALL', label: 'Tất cả' },
  { key: 'UNREAD', label: 'Chưa đọc' },
  { key: 'CONTRACTS', label: 'Hợp đồng' },
  { key: 'PROPOSALS', label: 'Đề xuất' },
  { key: 'JOBS', label: 'Công việc' },
]

const contractStatusLabel: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  PENDING_PAYMENT: 'Yêu cầu nghiệm thu',
  UNDER_REVIEW: 'Đang xem xét',
  IN_DISPUTE: 'Tranh chấp',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  TERMINATED: 'Đã hủy',
}

const contractStatusTone: Record<string, string> = {
  ACTIVE: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  PENDING_PAYMENT: 'border-sky-200 bg-sky-50 text-sky-700',
  UNDER_REVIEW: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  IN_DISPUTE: 'border-orange-200 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  COMPLETED: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
  TERMINATED: 'border-rose-200 bg-rose-50 text-rose-700',
}

const proposalStatusLabel: Record<ProposalStatus, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã gửi',
  UNDER_REVIEW: 'Đang xem xét',
  SHORTLISTED: 'Vòng trong',
  INTERVIEW_REQUESTED: 'Phỏng vấn',
  NEGOTIATING: 'Thương lượng',
  OFFER_ACCEPTED: 'Đã chốt',
  ACCEPTED: 'Chấp nhận',
  REJECTED: 'Từ chối',
  WITHDRAWN: 'Đã rút',
  EXPIRED: 'Hết hạn',
  AUTO_CLOSED: 'Đã đóng',
  CONTRACT_CANCELLED: 'Hợp đồng hủy',
}

const proposalStatusTone: Record<ProposalStatus, string> = {
  DRAFT: 'border-slate-200 dark:border-slate-800 bg-slate-100 text-slate-600 dark:text-slate-400',
  SUBMITTED: 'border-sky-200 bg-sky-50 text-sky-700',
  UNDER_REVIEW: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  SHORTLISTED: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  INTERVIEW_REQUESTED: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  NEGOTIATING: 'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  OFFER_ACCEPTED: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  ACCEPTED: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  WITHDRAWN: 'border-slate-200 dark:border-slate-800 bg-slate-100 text-slate-600 dark:text-slate-400',
  EXPIRED: 'border-slate-200 dark:border-slate-800 bg-slate-100 text-slate-600 dark:text-slate-400',
  AUTO_CLOSED: 'border-slate-200 dark:border-slate-800 bg-slate-100 text-slate-600 dark:text-slate-400',
  CONTRACT_CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
}

function upsertRoomInPage(
  current: PaginatedResponse<ChatRoomResponse> | undefined,
  room: ChatRoomResponse
): PaginatedResponse<ChatRoomResponse> {
  if (!current) {
    return {
      content: [room],
      totalElements: 1,
      totalPages: 1,
      size: 50,
      number: 0,
      first: true,
      last: true,
    }
  }

  const content = [room, ...current.content.filter((item) => item.id !== room.id)]
  return {
    ...current,
    content,
    totalElements: Math.max(current.totalElements, content.length),
    totalPages: Math.max(current.totalPages, 1),
  }
}

export default function MentorMessagesPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeFilter, setActiveFilter] = useState<MentorInboxFilter>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [composerError, setComposerError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [showContextPanel, setShowContextPanel] = useState(false)
  const selectedRoomId = searchParams.get('conversationId') || searchParams.get('roomId')
  const isCreatingTargetRoomRef = useRef(false)
  const lastReadMessageIdRef = useRef<string | null>(null)

  const roomsQuery = useQuery(
    ['mentor-messages-rooms', user?.userId],
    () => chatApi.getUserRooms(user!.userId, { page: 0, size: 50 }),
    {
      enabled: !!user?.userId,
      staleTime: 10_000,
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
    }
  )
  const refetchRooms = roomsQuery.refetch

  const roomList = roomsQuery.data?.content || []
  const visibleRooms = useMemo(() => roomList.filter((room) => !room.isArchived), [roomList])

  // Base rooms for counts: all visible rooms except self-chats
  const deduplicatedRooms = useMemo(() => {
    return visibleRooms.filter((room) => {
      // Hide self-chat rooms
      if (
        room.roomType === 'DIRECT_MESSAGE' &&
        room.members.length > 0 &&
        room.members.every((m) => m.userId === user?.userId)
      ) {
        return false
      }
      return true
    })
  }, [visibleRooms, user?.userId])

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
      // Hide self-chat rooms
      if (
        room.roomType === 'DIRECT_MESSAGE' &&
        room.members.length > 0 &&
        room.members.every((m) => m.userId === user?.userId)
      ) {
        return false
      }

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

  const targetUserId = searchParams.get('targetUserId')
  const targetJobId = searchParams.get('jobId')

  useEffect(() => {
    if (roomsQuery.isLoading) return

    if (targetUserId && !selectedRoomId) {
      if (!user?.userId) return
      if (targetUserId === user.userId) {
        setSelectionError('Bạn không thể mở cuộc trò chuyện với chính mình.')
        setSearchParams({}, { replace: true })
        return
      }
      if (targetJobId) {
        if (isCreatingTargetRoomRef.current) return
        isCreatingTargetRoomRef.current = true
        setSelectionError(null)
        chatApi
          .resolveConversation({
            recipientId: targetUserId,
            contextType: 'JOB',
            contextId: targetJobId,
          })
          .then((room) => {
            queryClient.setQueryData<PaginatedResponse<ChatRoomResponse> | undefined>(
              ['mentor-messages-rooms', user.userId],
              (current) => upsertRoomInPage(current, room)
            )
            setSearchParams({ conversationId: room.id }, { replace: true })
            void refetchRooms()
          })
          .catch(() => {
            setSelectionError('ChÆ°a thá»ƒ má»Ÿ cuá»™c há»™i thoáº¡i cho cÃ´ng viá»‡c nÃ y.')
          })
          .finally(() => {
            isCreatingTargetRoomRef.current = false
          })
        return
      }
      const existingRoom = deduplicatedRooms.find(
        (r) => r.roomType === 'DIRECT_MESSAGE' && r.members?.some((m) => m.userId === targetUserId)
      )
      if (existingRoom) {
        setSearchParams({ conversationId: existingRoom.id }, { replace: true })
      } else {
        if (isCreatingTargetRoomRef.current) return
        isCreatingTargetRoomRef.current = true
        setSelectionError(null)
        chatApi
          .createRoom({
            roomType: 'DIRECT_MESSAGE',
            memberIds: [user.userId, targetUserId],
            createdByUserId: user.userId,
          })
          .then((newRoom) => {
            setSearchParams({ conversationId: newRoom.id }, { replace: true })
            void refetchRooms()
          })
          .catch(() => {
            setSelectionError('Chưa thể mở cuộc hội thoại với người dùng này.')
          })
          .finally(() => {
            isCreatingTargetRoomRef.current = false
          })
      }
      return
    }

    if (!selectedRoomId) {
      setSelectionError(null)
      return
    }
    if (selectedRoom) {
      setSelectionError(null)
      return
    }
    setSelectionError('Bạn không có quyền truy cập cuộc trò chuyện này.')
  }, [deduplicatedRooms, queryClient, refetchRooms, roomsQuery.isLoading, selectedRoom, selectedRoomId, setSearchParams, targetJobId, targetUserId, user?.userId])

  const selectedMessagesQuery = useQuery(
    ['mentor-messages-thread', effectiveRoomId],
    () => chatApi.getRoomMessages(effectiveRoomId!, { page: 0, size: 50 }),
    {
      enabled: !!effectiveRoomId,
      refetchInterval: effectiveRoomId ? 10_000 : false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
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
    if (latestMessage.senderId === user.userId) return
    if (!effectiveRoom.unreadCount && lastReadMessageIdRef.current === latestMessage.id) return

    let cancelled = false
    chatApi
      .markAsRead(latestMessage.id, user.userId)
      .then(() => {
        if (!cancelled) {
          lastReadMessageIdRef.current = latestMessage.id
          void roomsQuery.refetch()
          void queryClient.invalidateQueries(['chatRooms', user.userId])
          void queryClient.invalidateQueries(['unreadCount', user.userId])
        }
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [effectiveRoom, latestMessage, roomsQuery, user?.userId, queryClient])

  const contractContextQuery = useQuery(
    ['mentor-message-contract-context', effectiveRoom?.referenceId],
    () => contractApi.getMineById(effectiveRoom!.referenceId!),
    {
      enabled: effectiveRoom?.referenceType === 'CONTRACT' && !!effectiveRoom.referenceId,
      retry: false,
    }
  )

  const linkedContractQuery = useQuery(
    ['mentor-message-linked-contract', otherMember?.userId],
    async () => {
      const result = await contractApi.getMine({ page: 0, size: 50 }).catch(() => null)
      const contracts = result?.content || []
      const clientContracts = contracts.filter((c) => c.clientId === otherMember?.userId)
      return (
        clientContracts.find((c) => c.status === 'UNDER_REVIEW') ||
        clientContracts.find((c) => c.status === 'ACTIVE') ||
        clientContracts.find((c) => c.status === 'PENDING_PAYMENT') ||
        clientContracts.find((c) => c.status === 'COMPLETED') ||
        clientContracts[0] ||
        null
      )
    },
    {
      enabled: !!otherMember?.userId && effectiveRoom?.roomType === 'DIRECT_MESSAGE',
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
        noMessagesDescription: 'Bắt đầu cuộc trò chuyện với khách hàng này.',
      }
    }

    if (effectiveRoom.referenceType === 'CONTRACT' || (effectiveRoom.roomType === 'DIRECT_MESSAGE' && linkedContractQuery.data)) {
      const contract = (effectiveRoom.referenceType === 'CONTRACT' ? (contextMaps.contractMap[effectiveRoom.referenceId || ''] || contractContextQuery.data) : linkedContractQuery.data) as ContractResponse | undefined
      return {
        actionLabel: 'Xem hợp đồng',
        actionHref: contract ? '/mentor/projects?tab=contracts' : undefined,
        statusLabel: contract ? contractStatusLabel[contract.status] || contract.status : undefined,
        statusToneClassName: contract ? contractStatusTone[contract.status] || undefined : undefined,
        noMessagesDescription: 'Bắt đầu cuộc trò chuyện với khách hàng này.',
      }
    }

    if (effectiveRoom.referenceType === 'PROPOSAL') {
      const proposal = (contextMaps.proposalMap[effectiveRoom.referenceId || ''] || proposalContextQuery.data) as ProposalResponse | undefined
      return {
        actionLabel: proposal ? 'Xem đề xuất' : undefined,
        actionHref: proposal ? `/mentor/proposals/${proposal.id}` : undefined,
        statusLabel: proposal ? proposalStatusLabel[proposal.status] || proposal.status : undefined,
        statusToneClassName: proposal ? proposalStatusTone[proposal.status] || undefined : undefined,
        noMessagesDescription: 'Bắt đầu cuộc trò chuyện với khách hàng này.',
      }
    }

    if (effectiveRoom.referenceType === 'JOB') {
      const job = (contextMaps.jobMap[effectiveRoom.referenceId || ''] || jobContextQuery.data) as JobResponse | undefined
      return {
        actionLabel: job ? 'Xem công việc' : undefined,
        actionHref: job ? `/jobs/${job.jobId}` : undefined,
        statusLabel: job ? formatJobStatus(job.status) : undefined,
        statusToneClassName: job ? getJobStatusTone(job.status) : undefined,
        noMessagesDescription: 'Bắt đầu cuộc trò chuyện với khách hàng này.',
      }
    }

    return {
      actionLabel: undefined as string | undefined,
      actionHref: undefined as string | undefined,
      statusLabel: undefined as string | undefined,
      statusToneClassName: undefined as string | undefined,
      noMessagesDescription: 'Bắt đầu cuộc trò chuyện với khách hàng này.',
    }
  }, [contextMaps, contractContextQuery.data, effectiveRoom, jobContextQuery.data, proposalContextQuery.data])

  const contextCard = useMemo(() => {
    if (!effectiveRoom) return null

    if (effectiveRoom.referenceType === 'CONTRACT' || (effectiveRoom.roomType === 'DIRECT_MESSAGE' && linkedContractQuery.data)) {
      const contract = (effectiveRoom.referenceType === 'CONTRACT' ? (contextMaps.contractMap[effectiveRoom.referenceId || ''] || contractContextQuery.data) : linkedContractQuery.data) as ContractResponse | undefined
      if (!contract) return null
      return {
        title: contract.title || contract.jobTitle,
        description: contract.description || contract.deliverables || 'Chi tiết hợp đồng và giao tiếp công việc.',
        metrics: [
          { label: 'Giá trị', value: formatCurrency(contract.totalAmount || 0), icon: CircleDollarSign },
          {
            label: 'Tiến độ',
            value: contract.milestoneCount > 0 ? `${contract.completedMilestoneCount}/${contract.milestoneCount} cột mốc` : `${contract.progressPercentage}% hoàn thành`,
            icon: CalendarDays,
          },
        ],
        primaryAction: contextMeta.actionHref && contextMeta.actionLabel ? { href: contextMeta.actionHref, label: contextMeta.actionLabel } : undefined,
        secondaryAction: { href: '/mentor/projects?tab=contracts', label: 'Mở hợp đồng' },
      }
    }

    if (effectiveRoom.referenceType === 'PROPOSAL') {
      const proposal = (contextMaps.proposalMap[effectiveRoom.referenceId || ''] || proposalContextQuery.data) as ProposalResponse | undefined
      if (!proposal) return null
      return {
        title: proposal.jobTitle,
        description: proposal.relevantExperience || proposal.coverLetter || 'Kênh thảo luận và thương lượng đề xuất.',
        metrics: [
          { label: 'Chào giá', value: formatCurrency(proposal.proposedAmount || proposal.proposedHourlyRate || 0), icon: CircleDollarSign },
          { label: 'Thời gian', value: proposal.estimatedDurationDays ? `${proposal.estimatedDurationDays} ngày` : 'Linh hoạt', icon: CalendarDays },
        ],
        primaryAction: contextMeta.actionHref && contextMeta.actionLabel ? { href: contextMeta.actionHref, label: contextMeta.actionLabel } : undefined,
        secondaryAction: { href: '/jobs', label: 'Tìm việc' },
      }
    }

    if (effectiveRoom.referenceType === 'JOB') {
      const job = (contextMaps.jobMap[effectiveRoom.referenceId || ''] || jobContextQuery.data) as JobResponse | undefined
      if (!job) return null
      return {
        title: job.title,
        description: job.description || 'Kênh thảo luận công việc.',
        metrics: [
          { label: 'Ngân sách', value: formatJobBudget(job), icon: CircleDollarSign },
          { label: 'Hạn chót', value: job.deadlineAt ? formatRoomDate(job.deadlineAt) : 'Linh hoạt', icon: CalendarDays },
        ],
        primaryAction: contextMeta.actionHref && contextMeta.actionLabel ? { href: contextMeta.actionHref, label: contextMeta.actionLabel } : undefined,
        secondaryAction: { href: '/jobs', label: 'Tìm việc' },
      }
    }

    return {
      title: getRoomDisplayName(effectiveRoom, user?.userId),
      description: effectiveRoom.description || 'Không gian trò chuyện trực tiếp.',
      metrics: [
        { label: 'Loại', value: formatContextLabel(effectiveRoom.referenceType), icon: FileText },
        { label: 'Tin nhắn', value: String(effectiveRoom.messageCount || 0), icon: MessageCircle },
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
      ALL: deduplicatedRooms.length,
      UNREAD: deduplicatedRooms.filter((room) => room.unreadCount > 0).length,
      CONTRACTS: deduplicatedRooms.filter((room) => room.referenceType === 'CONTRACT').length,
      PROPOSALS: deduplicatedRooms.filter((room) => room.referenceType === 'PROPOSAL').length,
      JOBS: deduplicatedRooms.filter((room) => room.referenceType === 'JOB').length,
    }),
    [deduplicatedRooms]
  )

  const sharedFiles = useMemo(() => buildSharedFiles(selectedMessages).slice(-4).reverse(), [selectedMessages])
  const sharedLinks = useMemo(() => buildSharedLinks(selectedMessages).slice(-2).reverse(), [selectedMessages])

  const handleSelectRoom = (roomId: string) => {
    setSelectionError(null)
    setShowContextPanel(true)
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
      setComposerError(error?.response?.data?.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.')
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
      <div className="rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500">
          <MessageCircle className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">Chưa có tin nhắn</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Các cuộc hội thoại với khách hàng từ các dự án sẽ hiển thị tại đây.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/jobs"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            Tìm việc
          </Link>
          <Link
            to="/mentor/projects?tab=proposals"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 text-sm font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:bg-slate-900/50"
          >
            Xem đề xuất
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100vh-104px)] w-full overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
      {selectionError ? (
        <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow-sm">
          {selectionError}
        </div>
      ) : null}

      <section className="h-full w-full">
        <div className={`grid h-full lg:grid-cols-[340px_minmax(0,1fr)] ${showContextPanel ? '2xl:grid-cols-[340px_minmax(0,1fr)_300px]' : '2xl:grid-cols-[340px_minmax(0,1fr)]'}`}>
          <aside className="flex min-h-0 flex-col border-b border-slate-200 dark:border-slate-800 xl:border-b-0 xl:border-r">
            <div className="shrink-0 border-b border-slate-100 dark:border-slate-800 px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-[18px] font-bold tracking-[-0.02em] text-slate-950 dark:text-slate-100">Tin nhắn</h1>
                  <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                    {counts.UNREAD > 0 ? `${counts.UNREAD} cuộc trò chuyện chưa đọc` : 'Đã xem tất cả'}
                  </p>
                </div>
              </div>

              <div className="relative mt-4">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm kiếm tin nhắn"
                  className="h-11 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 pl-11 pr-3 text-sm text-slate-700 dark:text-slate-300 outline-none transition focus:border-emerald-500 focus:bg-white dark:bg-slate-950 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div className="mt-5 -mx-5 px-5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex w-max items-center gap-1.5 pb-2">
                  {mentorFilters.map((filter) => {
                    const active = activeFilter === filter.key
                    const count = counts[filter.key]
                    return (
                      <button
                        key={filter.key}
                        onClick={() => setActiveFilter(filter.key)}
                        className={`group relative flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all duration-300 ${
                          active
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20 shadow-sm'
                            : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900/50 hover:text-slate-900 dark:text-slate-100 ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:ring-slate-700'
                        }`}
                      >
                        <span>{filter.label}</span>
                        {count >= 0 && (
                          <span
                            className={`flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-black transition-colors ${
                              active
                                ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                                : 'bg-slate-100 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredRooms.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-base font-black text-slate-950 dark:text-slate-100">Không tìm thấy cuộc trò chuyện nào</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Thử từ khóa khác hoặc xóa bộ lọc.</p>
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

          <section className={`flex min-h-0 flex-col border-b border-slate-200 dark:border-slate-800 xl:border-b-0 ${showContextPanel ? '2xl:border-r' : ''}`}>
            {effectiveRoom ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <AvatarBadge
                        name={otherMember?.displayName || otherMember?.fullName || getRoomDisplayName(effectiveRoom, user.userId)}
                        avatarUrl={otherMember?.avatarUrl || effectiveRoom.avatarUrl}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-[18px] font-bold tracking-[-0.02em] text-slate-950 dark:text-slate-100">
                            {otherMember?.displayName || otherMember?.fullName || getRoomDisplayName(effectiveRoom, user.userId)}
                          </h2>
                        </div>
                        <p className="mt-0.5 text-[13px] font-medium text-emerald-600 dark:text-emerald-500">
                          {otherMember?.isOnline ? 'Đang hoạt động' : getPresenceLabel(otherMember)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="hidden items-center gap-2 sm:flex">
                        <HeaderActionButton icon={<Briefcase className="h-4 w-4" />} label="Thông tin" href={contextMeta.actionHref} />
                        <HeaderActionButton icon={<Video className="h-4 w-4" />} label="Họp trực tuyến" href="/mentor/schedule" />
                      </div>
                      <button
                        type="button"
                        title="Thông tin"
                        onClick={() => setShowContextPanel(true)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 transition hover:border-emerald-200 dark:border-emerald-800/50 hover:text-emerald-700 dark:text-emerald-400"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/30 px-5 py-5">
                  {selectedMessagesQuery.isLoading ? (
                    <MessageThreadLoading />
                  ) : selectedMessages.length === 0 ? (
                    <div className="flex min-h-[360px] items-center justify-center">
                      <div className="max-w-sm text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500">
                          <Send className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-slate-950 dark:text-slate-100">Chưa có tin nhắn</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{contextMeta.noMessagesDescription}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col pb-2">
                      {selectedMessages.map((message, index) => (
                        <WorkspaceMessageBubble
                          key={message.id}
                          message={message}
                          previousMessage={selectedMessages[index - 1]}
                          nextMessage={selectedMessages[index + 1]}
                          mine={message.senderId === user.userId}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 px-5 py-4">
                  <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1 shadow-sm ring-1 ring-inset ring-slate-200/50 transition-shadow focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 hover:shadow-md">
                    <PromptInputBox
                      onSend={(msg, files) => handleSendMessage(msg, files || [])}
                      isLoading={isSending}
                      placeholder="Nhập tin nhắn..."
                      className="rounded-[20px] border-none shadow-none focus:ring-0"
                    />
                  </div>
                  {composerError ? <p className="px-2 pt-3 text-sm font-medium text-rose-500">{composerError}</p> : null}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center px-6 py-16">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 text-base font-bold text-slate-950 dark:text-slate-100">Chọn một cuộc trò chuyện</h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Chọn một cuộc trò chuyện từ hộp thư để xem tin nhắn.</p>
                </div>
              </div>
            )}
          </section>

          {showContextPanel ? (
          <aside className="hidden min-h-0 flex-col bg-white dark:bg-slate-950 2xl:flex">
            <div className="shrink-0 border-b border-slate-100 dark:border-slate-800 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-900 dark:text-slate-100">Thông tin dự án</p>
                <button
                  type="button"
                  onClick={() => setShowContextPanel(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400 transition hover:border-slate-300 dark:border-slate-700 hover:text-slate-700 dark:text-slate-300"
                  aria-label="Đóng thông tin"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-5">
              {contextCard ? (
                <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] ring-1 ring-inset ring-slate-200/50 transition hover:shadow-md">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-500">{formatContextLabel(effectiveRoom?.referenceType)}</p>
                  <h3 className="mt-2 text-[15px] font-bold leading-6 text-slate-950 dark:text-slate-100">{contextCard.title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-400">{truncateText(contextCard.description, 180)}</p>
                </div>
              ) : (
                <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 text-sm text-slate-500 dark:text-slate-400 shadow-[0_4px_24px_rgba(0,0,0,0.02)] ring-1 ring-inset ring-slate-200/50">
                  Đang tải thông tin cuộc trò chuyện...
                </div>
              )}

              <div className="space-y-4">
                {contextCard?.metrics.map((metric) => (
                  <div key={metric.label} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500">
                      <metric.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-400">{metric.label}</p>
                      <p className="mt-1 text-[15px] font-bold text-slate-950 dark:text-slate-100">{metric.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {(effectiveRoom?.referenceType === 'CONTRACT' || (effectiveRoom?.roomType === 'DIRECT_MESSAGE' && linkedContractQuery.data)) && (() => {
                  const contract = (effectiveRoom.referenceType === 'CONTRACT' ? (contextMaps.contractMap[effectiveRoom.referenceId || ''] || contractContextQuery.data) : linkedContractQuery.data) as ContractResponse | undefined
                  
                  if (!contract) return null

                  return (
                    <ActiveContractActions 
                      contract={contract} 
                      currentUserId={user?.userId || ''} 
                    />
                  )
                })()}

                {contextCard?.primaryAction ? (
                  <Link
                    to={contextCard.primaryAction.href}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    {contextCard.primaryAction.label}
                  </Link>
                ) : null}
                {contextCard?.secondaryAction ? (
                  <Link
                    to={contextCard.secondaryAction.href}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:bg-slate-900/50"
                  >
                    {contextCard.secondaryAction.label}
                  </Link>
                ) : null}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-400">Tệp đính kèm</p>
                  {contextMeta.actionHref ? (
                    <Link to={contextMeta.actionHref} className="text-sm font-black text-emerald-600 dark:text-emerald-500">
                      Xem tất cả
                    </Link>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {sharedFiles.length === 0 && sharedLinks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-5 text-sm text-slate-400">
                      Chưa có tệp đính kèm nào.
                    </div>
                  ) : (
                    <>
                      {sharedFiles.map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-start gap-3 rounded-2xl px-2 py-2 transition hover:bg-slate-50 dark:bg-slate-900/50"
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-semibold text-slate-950 dark:text-slate-100">{file.name}</p>
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
                          className="flex items-start gap-3 rounded-2xl px-2 py-2 transition hover:bg-slate-50 dark:bg-slate-900/50"
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                            <Link2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-semibold text-slate-950 dark:text-slate-100">{shortenUrl(link.url)}</p>
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
          <aside className="absolute right-0 top-0 h-full w-full max-w-[380px] overflow-y-auto border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
            <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-900 dark:text-slate-100">Thông tin dự án</p>
                <button
                  type="button"
                  onClick={() => setShowContextPanel(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400 transition hover:border-slate-300 dark:border-slate-700 hover:text-slate-700 dark:text-slate-300"
                  aria-label="Đóng thông tin"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-5">
              {contextCard ? (
                <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] ring-1 ring-inset ring-slate-200/50 transition hover:shadow-md">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-500">{formatContextLabel(effectiveRoom?.referenceType)}</p>
                  <h3 className="mt-2 text-[15px] font-bold leading-6 text-slate-950 dark:text-slate-100">{contextCard.title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-400">{truncateText(contextCard.description, 180)}</p>
                </div>
              ) : (
                <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 text-sm text-slate-500 dark:text-slate-400 shadow-[0_4px_24px_rgba(0,0,0,0.02)] ring-1 ring-inset ring-slate-200/50">
                  Đang tải thông tin cuộc trò chuyện...
                </div>
              )}

              <div className="space-y-4">
                {contextCard?.metrics.map((metric) => (
                  <div key={metric.label} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500">
                      <metric.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-400">{metric.label}</p>
                      <p className="mt-1 text-[15px] font-bold text-slate-950 dark:text-slate-100">{metric.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {(effectiveRoom?.referenceType === 'CONTRACT' || (effectiveRoom?.roomType === 'DIRECT_MESSAGE' && linkedContractQuery.data)) && (() => {
                  const contract = (effectiveRoom.referenceType === 'CONTRACT' ? (contextMaps.contractMap[effectiveRoom.referenceId || ''] || contractContextQuery.data) : linkedContractQuery.data) as ContractResponse | undefined
                  
                  if (!contract) return null

                  return (
                    <ActiveContractActions 
                      contract={contract} 
                      currentUserId={user?.userId || ''} 
                    />
                  )
                })()}

                {contextCard?.primaryAction ? (
                  <Link
                    to={contextCard.primaryAction.href}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    {contextCard.primaryAction.label}
                  </Link>
                ) : null}
                {contextCard?.secondaryAction ? (
                  <Link
                    to={contextCard.secondaryAction.href}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:bg-slate-900/50"
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
      className={`w-full border-b border-slate-100 dark:border-slate-800 px-5 py-4 text-left transition ${
        isActive ? 'bg-emerald-50  shadow-[inset_-3px_0_0_0_#059669]' : 'hover:bg-slate-50 dark:bg-slate-900/50'
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
              <p className={`truncate text-[15px] ${isUnread ? 'font-bold text-slate-950 dark:text-slate-100' : 'font-semibold text-slate-900 dark:text-slate-100'}`}>{roomName}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-right">
              <p className={`text-xs font-medium ${isUnread ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-400'}`}>{formatRoomTime(room.lastMessageAt || room.updatedAt)}</p>
              {isUnread ? (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-black text-white">
                  {room.unreadCount}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-0.5 flex items-center text-[13px] text-slate-500 dark:text-slate-400">
            <span className={`truncate ${isUnread ? 'font-medium text-slate-700 dark:text-slate-300' : ''}`}>{getRoomPreview(room)}</span>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {(!room.referenceType || room.referenceType === 'DIRECT_MESSAGE') ? null : (
              <span className={`inline-flex h-5 max-w-full items-center gap-1 rounded-full border px-2 text-[10px] font-bold ${getContextStatusTone(room, contextMaps)}`}>
                {room.referenceType === 'CONTRACT' ? <FileText className="h-3 w-3 shrink-0" /> : <Briefcase className="h-3 w-3 shrink-0" />}
                <span className="truncate">
                  {contextTitle || formatContextLabel(room.referenceType)}
                </span>
                {contextStatusLabel ? <span className="shrink-0">· {contextStatusLabel}</span> : null}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

function WorkspaceMessageBubble({
  message,
  previousMessage,
  nextMessage,
  mine,
}: {
  message: MessageResponse
  previousMessage?: MessageResponse
  nextMessage?: MessageResponse
  mine: boolean
}) {
  const showDate = shouldShowDateSeparator(previousMessage, message)
  
  const isFirstInGroup = !previousMessage || previousMessage.senderId !== message.senderId || showDate || (new Date(message.sentAt).getTime() - new Date(previousMessage.sentAt).getTime() > 5 * 60 * 1000)
  const isLastInGroup = !nextMessage || nextMessage.senderId !== message.senderId || shouldShowDateSeparator(message, nextMessage) || (new Date(nextMessage.sentAt).getTime() - new Date(message.sentAt).getTime() > 5 * 60 * 1000)

  return (
    <div className={isFirstInGroup && !showDate ? 'mt-6' : 'mt-1'}>
      {showDate ? (
        <div className="mb-6 mt-6 flex items-center justify-center">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
            {formatMessageDate(message.sentAt)}
          </span>
        </div>
      ) : null}

      <div className={`flex gap-3 ${mine ? 'justify-end' : 'justify-start'}`}>
        {!mine ? (
          <div className="mt-1 hidden shrink-0 sm:block">
            {isFirstInGroup ? (
              <AvatarBadge name={message.senderName} avatarUrl={message.senderAvatarUrl} size="xs" />
            ) : (
              <div className="h-9 w-9" />
            )}
          </div>
        ) : null}

        <div className={`flex max-w-[78%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
          <div
            className={`px-4 py-3.5 shadow-sm ${
              mine
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white ring-1 ring-inset ring-emerald-400/20'
                : 'bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 ring-1 ring-inset ring-slate-200/50'
            } ${
              mine
                ? `rounded-l-[22px] ${isFirstInGroup ? 'rounded-tr-[22px]' : 'rounded-tr-[8px]'} ${isLastInGroup ? 'rounded-br-[22px]' : 'rounded-br-[2px]'}`
                : `rounded-r-[22px] ${isFirstInGroup ? 'rounded-tl-[22px]' : 'rounded-tl-[8px]'} ${isLastInGroup ? 'rounded-bl-[22px]' : 'rounded-bl-[2px]'}`
            }`}
          >
            <MessageText content={message.content} mine={mine} />
            <MessageAttachment message={message} mine={mine} />
          </div>
          {isLastInGroup ? (
            <p className={`mt-1.5 px-1 text-[11px] font-medium text-slate-400 ${mine ? 'text-right' : ''}`}>
              {formatMessageTime(message.sentAt)}
            </p>
          ) : null}
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
    <div className={`flex ${sizeClasses} items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,_#dbeafe,_#c7d2fe_55%,_#e2e8f0)] font-black text-emerald-700 dark:text-emerald-400`}>
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
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400">
        {icon}
      </span>
    )
  }

  return (
    <Link
      to={href}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 transition hover:border-emerald-200 dark:border-emerald-800/50 hover:text-emerald-700 dark:text-emerald-400"
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
    <div className="overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
      <div className="grid h-[calc(100vh-104px)] xl:grid-cols-[360px_minmax(0,1fr)_320px]">
        <div className="border-r border-slate-100 dark:border-slate-800 p-5">
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

        <div className="border-r border-slate-100 dark:border-slate-800 p-5">
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
  if (referenceType === 'CONTRACT') return 'Hợp đồng'
  if (referenceType === 'PROPOSAL') return 'Đề xuất'
  if (referenceType === 'JOB') return 'Công việc'
  return 'Chung'
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
  if (status === 'OPEN') return 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
  if (status === 'IN_PROGRESS') return 'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
  if (status === 'COMPLETED') return 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
  if (status === 'CLOSED' || status === 'CANCELLED') return 'border-slate-200 dark:border-slate-800 bg-slate-100 text-slate-600 dark:text-slate-400'
  return 'border-slate-200 dark:border-slate-800 bg-slate-100 text-slate-600 dark:text-slate-400'
}

function getParticipantRoleLabel(room: ChatRoomResponse, currentUserId?: string) {
  const otherMember = room.members.find((member) => member.userId !== currentUserId) || room.members[0]
  if (room.referenceType === 'CONTRACT' || room.referenceType === 'PROPOSAL' || room.referenceType === 'JOB') {
    return 'Khách hàng'
  }
  const rawRole = otherMember?.memberRole?.toUpperCase()
  if (rawRole?.includes('ADMIN')) return 'Quản trị viên'
  if (rawRole?.includes('SYSTEM')) return 'Hệ thống'
  if (rawRole?.includes('MENTOR')) return 'Mentor'
  if (rawRole?.includes('CLIENT') || rawRole?.includes('USER')) return 'Khách hàng'
  return 'Người tham gia'
}

function getContextStatusLabel(room: ChatRoomResponse, contextMaps: ConversationContextMaps) {
  if (room.referenceType === 'CONTRACT' && room.referenceId) {
    const contract = contextMaps.contractMap[room.referenceId]
    if (!contract) return undefined
    return contract.status === 'ACTIVE' && contract.fundsInEscrow ? 'Đã khóa Escrow' : contractStatusLabel[contract.status] || contract.status
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
    if (!contract) return 'border-slate-200 dark:border-slate-800 bg-slate-100 text-slate-600 dark:text-slate-400'
    if (contract.status === 'ACTIVE' && contract.fundsInEscrow) return 'border-sky-200 bg-sky-50 text-sky-700'
    return contractStatusTone[contract.status] || 'border-slate-200 dark:border-slate-800 bg-slate-100 text-slate-600 dark:text-slate-400'
  }
  if (room.referenceType === 'PROPOSAL' && room.referenceId) {
    const proposal = contextMaps.proposalMap[room.referenceId]
    return proposal ? proposalStatusTone[proposal.status] || 'border-slate-200 dark:border-slate-800 bg-slate-100 text-slate-600 dark:text-slate-400' : 'border-slate-200 dark:border-slate-800 bg-slate-100 text-slate-600 dark:text-slate-400'
  }
  if (room.referenceType === 'JOB' && room.referenceId) {
    const job = contextMaps.jobMap[room.referenceId]
    return job ? getJobStatusTone(job.status) : 'border-slate-200 dark:border-slate-800 bg-slate-100 text-slate-600 dark:text-slate-400'
  }
  return 'border-slate-200 dark:border-slate-800 bg-slate-100 text-slate-600 dark:text-slate-400'
}

function getConversationStateLabel(room: ChatRoomResponse, currentUserId: string) {
  if (!room.lastMessagePreview && !room.lastMessageAt) return 'Chưa có tin nhắn'
  if (room.unreadCount > 0) return 'Chưa đọc'
  if (room.lastMessageSenderId === currentUserId) return 'Đang đợi khách hàng'
  return 'Đang đợi bạn'
}

function getConversationStateTone(room: ChatRoomResponse, currentUserId: string) {
  const state = getConversationStateLabel(room, currentUserId)
  if (state === 'Chưa đọc') return 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
  if (state === 'Đang đợi khách hàng') return 'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
  if (state === 'Đang đợi bạn') return 'border-rose-200 bg-rose-50 text-rose-700'
  return 'border-slate-200 dark:border-slate-800 bg-slate-100 text-slate-600 dark:text-slate-400'
}

function formatJobBudget(job: JobResponse) {
  if (job.budgetType === 'HOURLY' && job.hourlyRateMxc) return `${formatCurrency(job.hourlyRateMxc)}/giờ`
  if (job.budgetMinMxc || job.budgetMaxMxc) {
    if (job.budgetMinMxc && job.budgetMaxMxc) return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
    return formatCurrency(job.budgetMaxMxc || job.budgetMinMxc || 0)
  }
  return 'Ngân sách linh hoạt'
}

function formatRoomDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', { month: 'short', day: 'numeric' }).format(date)
}

function truncateText(value?: string, limit = 120) {
  if (!value) return ''
  return value.length > limit ? `${value.slice(0, limit).trim()}...` : value
}
