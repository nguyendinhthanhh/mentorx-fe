import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from 'react-query'
import { chatApi } from '@/api/chatApi'
import { contractApi } from '@/api/contractApi'
import { FILE_UPLOAD_DIRS, fileApi } from '@/api/fileApi'
import { mentorApi } from '@/api/mentorApi'
import { userApi } from '@/api/userApi'
import { ChatRoomMemberSummary, ChatRoomResponse, ContractResponse, MentorOfferingResponse, MessageType, PaginatedResponse } from '@/types'
import { useAuthStore } from '@/store/authStore'
import ConversationPane from './components/ConversationPane'
import ContextRail from './components/ContextRail'
import InboxSidebar from './components/InboxSidebar'
import {
  ATTACHMENT_ACCEPT,
  InboxFilter,
  MAX_ATTACHMENTS,
  MAX_FILE_SIZE_BYTES,
  QueuedAttachment,
  buildSharedFiles,
  buildSharedImages,
  buildSharedLinks,
  getPrimaryOtherMember,
} from './chatShared'

type ChatNavigationState = {
  draftRecipient?: {
    userId: string
    fullName?: string
    displayName?: string
    avatarUrl?: string
  }
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

export default function ChatListPage() {
  const { user } = useAuthStore()
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [draftRecipientId, setDraftRecipientId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<InboxFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [composerError, setComposerError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [showConversationMobile, setShowConversationMobile] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isCreatingRef = useRef(false)
  const isLoadingTargetRoomRef = useRef(false)
  const location = useLocation()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const targetUserId = searchParams.get('userId')
  const targetRoomId = searchParams.get('conversationId') || searchParams.get('roomId')
  const targetJobId = searchParams.get('jobId')
  const contextMsg = searchParams.get('contextMsg')
  const navigationState = location.state as ChatNavigationState | null
  const draftRecipientFromState = navigationState?.draftRecipient

  const { data: rooms, isLoading: roomsLoading, refetch: refetchRooms } = useQuery(
    ['chatRooms', user?.userId],
    () => chatApi.getUserRooms(user!.userId, { size: 50 }),
    {
      enabled: !!user?.userId,
      staleTime: 10_000,
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
    }
  )

  const roomList = rooms?.content || []

  const filteredRooms = useMemo(() => {
    return roomList.filter((room) => {
      // Skip self-chat rooms
      if (
        room.roomType === 'DIRECT_MESSAGE' &&
        room.members.length > 0 &&
        room.members.every((m) => m.userId === user?.userId)
      ) {
        return false
      }

      if (activeFilter === 'unread' && (room.unreadCount === 0 || room.isArchived)) return false
      if (activeFilter === 'archived' && !room.isArchived) return false
      if (activeFilter === 'mentors' && (room.memberCount !== 2 || room.roomType !== 'DIRECT_MESSAGE')) return false
      if (activeFilter === 'groups' && room.memberCount <= 2 && room.roomType === 'DIRECT_MESSAGE') return false
      if (activeFilter === 'all' && room.isArchived) return false

      const keyword = searchTerm.trim().toLowerCase()
      if (!keyword) return true

      const roomLabel = `${room.roomName || ''} ${room.lastMessagePreview || ''} ${room.members
        .map((member) => `${member.displayName || ''} ${member.fullName || ''}`)
        .join(' ')}`.toLowerCase()

      return roomLabel.includes(keyword)
    })
  }, [activeFilter, roomList, searchTerm, user?.userId])

  useEffect(() => {
    if (roomsLoading || !user?.userId) return

    if (targetRoomId) {
      const existingRoom = roomList.find((room) => room.id === targetRoomId)
      if (existingRoom) {
        setSelectedRoomId(existingRoom.id)
        setDraftRecipientId(null)
        setShowConversationMobile(true)
        setSearchParams({})
      } else if (!isLoadingTargetRoomRef.current) {
        isLoadingTargetRoomRef.current = true
        chatApi
          .getRoomById(targetRoomId, user.userId)
          .then((room) => {
            queryClient.setQueryData<PaginatedResponse<ChatRoomResponse> | undefined>(
              ['chatRooms', user.userId],
              (current) => upsertRoomInPage(current, room)
            )
            setSelectedRoomId(room.id)
            setDraftRecipientId(null)
            setShowConversationMobile(true)
            setSearchParams({})
          })
          .catch(console.error)
          .finally(() => {
            isLoadingTargetRoomRef.current = false
          })
      }
      return
    }

    if (targetUserId === user.userId) {
      console.warn('Cannot open a conversation with yourself.')
      setSearchParams({})
      return
    }

    if (targetUserId) {
      if (targetJobId) {
        if (isCreatingRef.current) return
        isCreatingRef.current = true
        chatApi
          .resolveConversation({
            recipientId: targetUserId,
            contextType: 'JOB',
            contextId: targetJobId,
          })
          .then(async (room) => {
            queryClient.setQueryData<PaginatedResponse<ChatRoomResponse> | undefined>(
              ['chatRooms', user.userId],
              (current) => upsertRoomInPage(current, room)
            )
            localStorage.setItem(`chat_job_${room.id}`, targetJobId)
            setSelectedRoomId(room.id)
            setDraftRecipientId(null)
            setShowConversationMobile(true)

            if (contextMsg) {
              try {
                await chatApi.sendMessage({
                  chatRoomId: room.id,
                  senderId: user.userId,
                  content: contextMsg,
                  messageType: 'TEXT',
                })
              } catch (error) {
                console.error('Failed to send context message', error)
              }
            }

            setSearchParams({})
            void refetchRooms()
          })
          .catch(console.error)
          .finally(() => {
            isCreatingRef.current = false
          })
        return
      }

      const existingRoom = roomList.find(
        (r) => r.roomType === 'DIRECT_MESSAGE' && r.members?.some((m) => m.userId === targetUserId)
      )

      if (existingRoom) {
        setSelectedRoomId(existingRoom.id)
        setDraftRecipientId(null)
        setShowConversationMobile(true)
        
        const contextMsg = searchParams.get('contextMsg')
        const linkedJobId = searchParams.get('jobId')
        
        if (linkedJobId) {
          localStorage.setItem(`chat_job_${existingRoom.id}`, linkedJobId)
        }

        if (contextMsg) {
          chatApi.sendMessage({
            chatRoomId: existingRoom.id,
            senderId: user.userId,
            content: contextMsg,
            messageType: 'TEXT'
          })
          .then(() => refetchMessages())
          .catch(e => console.error('Failed to send context msg to existing room', e))
        }

        setSearchParams({})
      } else {
        const contextMsg = searchParams.get('contextMsg')
        const linkedJobId = searchParams.get('jobId')

        if (!contextMsg) {
          setSelectedRoomId(null)
          setDraftRecipientId(targetUserId)
          setShowConversationMobile(true)
          if (linkedJobId) {
            localStorage.setItem(`chat_draft_job_${targetUserId}`, linkedJobId)
          }
          setSearchParams({})
          return
        }

        if (isCreatingRef.current) return
        isCreatingRef.current = true
        chatApi
          .createRoom({
            roomType: 'DIRECT_MESSAGE',
            memberIds: [user.userId, targetUserId],
            createdByUserId: user.userId,
          })
          .then(async (newRoom) => {
            queryClient.setQueryData<PaginatedResponse<ChatRoomResponse> | undefined>(
              ['chatRooms', user.userId],
              (current) => upsertRoomInPage(current, newRoom)
            )
            setSelectedRoomId(newRoom.id)
            setDraftRecipientId(null)
            
            if (linkedJobId) {
              localStorage.setItem(`chat_job_${newRoom.id}`, linkedJobId)
            }

            if (contextMsg) {
              try {
                await chatApi.sendMessage({
                  chatRoomId: newRoom.id,
                  senderId: user.userId,
                  content: contextMsg,
                  messageType: 'TEXT'
                })
              } catch (e) {
                console.error('Failed to send context message', e)
              }
            }

            setSearchParams({})
            refetchRooms()
          })
          .catch(console.error)
          .finally(() => {
            isCreatingRef.current = false
          })
      }
      return
    }

    if (roomList.length === 0 || filteredRooms.length === 0) {
      if (selectedRoomId !== null) {
        setSelectedRoomId(null)
      }
      return
    }

    if (draftRecipientId) return

    if (!selectedRoomId || !filteredRooms.some((room) => room.id === selectedRoomId)) {
      setSelectedRoomId(filteredRooms[0].id)
    }
  }, [contextMsg, filteredRooms, queryClient, refetchRooms, roomList, roomsLoading, selectedRoomId, setSearchParams, targetJobId, targetRoomId, targetUserId, draftRecipientId, user?.userId])

  const selectedRoom = useMemo(
    () => roomList.find((room) => room.id === selectedRoomId) || null,
    [roomList, selectedRoomId]
  )
  const selectedRoomOtherMember = useMemo(
    () => (selectedRoom ? getPrimaryOtherMember(selectedRoom, user?.userId) : undefined),
    [selectedRoom, user?.userId]
  )
  const isDirectRoom = selectedRoom?.roomType === 'DIRECT_MESSAGE' || !!draftRecipientId
  const otherMemberId = selectedRoomId ? (isDirectRoom ? selectedRoomOtherMember?.userId : undefined) : draftRecipientId

  const { data: mentorProfile, isLoading: mentorProfileLoading } = useQuery(
    ['chat-mentor-profile', otherMemberId],
    async () => {
      if (!otherMemberId) return null
      return mentorApi.getMentorProfile(otherMemberId).catch(() => null)
    },
    {
      enabled: !!otherMemberId,
      retry: false,
      staleTime: 60_000,
    }
  )

  const { data: otherUserProfile, isLoading: otherUserProfileLoading } = useQuery(
    ['chat-user-profile', otherMemberId],
    async () => {
      if (!otherMemberId) return null
      return userApi.getUserById(otherMemberId).catch(() => null)
    },
    {
      enabled: !!otherMemberId,
      retry: false,
      staleTime: 60_000,
    }
  )

  const { data: mentorCourses = [], isLoading: mentorCoursesLoading } = useQuery(
    ['chat-mentor-courses', otherMemberId],
    async () => {
      if (!otherMemberId) return [] as MentorOfferingResponse[]
      return mentorApi.getPublishedMentorCourses(otherMemberId).catch(() => [] as MentorOfferingResponse[])
    },
    {
      enabled: !!otherMemberId,
      retry: false,
      staleTime: 60_000,
    }
  )

  const { data: weeklyAvailability, isLoading: weeklyAvailabilityLoading } = useQuery(
    ['chat-mentor-availability', otherMemberId],
    async () => {
      if (!otherMemberId) return null
      return mentorApi.getWeeklyAvailability(otherMemberId).catch(() => null)
    },
    {
      enabled: !!otherMemberId,
      retry: false,
      staleTime: 60_000,
    }
  )

  const draftRoom = useMemo<ChatRoomResponse | null>(() => {
    if (!draftRecipientId || !user?.userId) return null

    const mentorUser = mentorProfile?.user
    const stateRecipient =
      draftRecipientFromState?.userId === draftRecipientId ? draftRecipientFromState : undefined
    const displayName =
      mentorUser?.displayName ||
      otherUserProfile?.displayName ||
      stateRecipient?.displayName ||
      mentorUser?.fullName ||
      otherUserProfile?.fullName ||
      stateRecipient?.fullName ||
      'Conversation'
    const fullName =
      mentorUser?.fullName ||
      otherUserProfile?.fullName ||
      stateRecipient?.fullName ||
      displayName
    const avatarUrl = mentorUser?.avatarUrl || otherUserProfile?.avatarUrl || stateRecipient?.avatarUrl
    const timestamp = new Date().toISOString()

    return {
      id: `draft:${draftRecipientId}`,
      roomType: 'DIRECT_MESSAGE',
      roomName: displayName,
      description: undefined,
      createdByUserId: user.userId,
      isActive: true,
      isPrivate: true,
      maxMembers: 2,
      memberCount: 2,
      unreadCount: 0,
      messageCount: 0,
      members: [
        {
          userId: user.userId,
          fullName: user.fullName,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          memberRole: 'OWNER',
          isOnline: true,
          lastSeenAt: user.lastSeenAt,
        },
        {
          userId: draftRecipientId,
          fullName,
          displayName,
          avatarUrl,
          memberRole: 'MEMBER',
          isOnline: false,
          lastSeenAt: mentorUser?.lastSeenAt || otherUserProfile?.lastSeenAt,
        },
      ],
      isArchived: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastActivityAt: timestamp,
    }
  }, [draftRecipientFromState, draftRecipientId, mentorProfile?.user, otherUserProfile, user])

  const effectiveRoom = selectedRoom || draftRoom

  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useQuery(
    ['messages', selectedRoomId],
    () => chatApi.getRoomMessages(selectedRoomId!, { page: 0, size: 50 }),
    {
      enabled: !!selectedRoomId,
      refetchInterval: selectedRoomId ? 10_000 : false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
    }
  )

  const selectedMessages = selectedRoomId ? messages?.content || [] : []
  const latestMessage = selectedMessages[selectedMessages.length - 1]
  const otherMember = useMemo(
    () => (effectiveRoom ? getPrimaryOtherMember(effectiveRoom, user?.userId) : undefined),
    [effectiveRoom, user?.userId]
  )

  const linkedJobId = useMemo(() => {
    if (effectiveRoom?.referenceType === 'JOB' && effectiveRoom.referenceId) return effectiveRoom.referenceId
    if (draftRecipientId) return localStorage.getItem(`chat_draft_job_${draftRecipientId}`) || null
    if (!selectedRoomId) return null
    return localStorage.getItem(`chat_job_${selectedRoomId}`) || null
  }, [draftRecipientId, effectiveRoom?.referenceType, effectiveRoom?.referenceId, selectedRoomId])

  const { data: linkedJob, isLoading: linkedJobLoading } = useQuery(
    ['chat-linked-job', linkedJobId],
    async () => {
      if (!linkedJobId) return null
      const { jobApi } = await import('@/api/jobApi')
      return jobApi.getById(linkedJobId).catch(() => null)
    },
    {
      enabled: !!linkedJobId,
      retry: false,
    }
  )

  const { data: linkedContract, isLoading: linkedContractLoading } = useQuery(
    ['chat-linked-contract', effectiveRoom?.referenceType, effectiveRoom?.referenceId, linkedJobId, effectiveRoom?.roomType, user?.userId, otherMemberId],
    async () => {
      if (effectiveRoom?.referenceType === 'CONTRACT' && effectiveRoom.referenceId) {
        return contractApi.getById(effectiveRoom.referenceId).catch(() => null)
      }
      
      if (linkedJobId) {
        const result = await contractApi.getByJob(linkedJobId, { page: 0, size: 10 }).catch(() => null)
        const contracts = result?.content || []
        const found = 
          contracts.find((contract) => contract.status === 'UNDER_REVIEW') ||
          contracts.find((contract) => contract.status === 'ACTIVE') ||
          contracts.find((contract) => contract.status === 'PENDING_PAYMENT') ||
          contracts.find((contract) => contract.status === 'COMPLETED') ||
          contracts[0]
          
        if (found) return found as ContractResponse
      }

      if (effectiveRoom?.roomType === 'DIRECT_MESSAGE' && user?.userId && otherMemberId) {
        const result = await contractApi.getByClient(user.userId, { page: 0, size: 50 }).catch(() => null)
        const contracts = result?.content || []
        const mentorContracts = contracts.filter((contract) => contract.mentorId === otherMemberId)
        return (
          mentorContracts.find((contract) => contract.status === 'UNDER_REVIEW') ||
          mentorContracts.find((contract) => contract.status === 'ACTIVE') ||
          mentorContracts.find((contract) => contract.status === 'PENDING_PAYMENT') ||
          mentorContracts.find((contract) => contract.status === 'COMPLETED') ||
          mentorContracts[0] ||
          null
        ) as ContractResponse | null
      }
      
      return null
    },
    {
      enabled: (effectiveRoom?.referenceType === 'CONTRACT' && !!effectiveRoom?.referenceId) || !!linkedJobId || (effectiveRoom?.roomType === 'DIRECT_MESSAGE' && !!user?.userId && !!otherMemberId),
      retry: false,
    }
  )

  const sharedImages = useMemo(() => buildSharedImages(selectedMessages), [selectedMessages])
  const sharedFiles = useMemo(() => buildSharedFiles(selectedMessages), [selectedMessages])
  const sharedLinks = useMemo(() => buildSharedLinks(selectedMessages), [selectedMessages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [selectedMessages.length, selectedRoomId])

  const lastReadMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user?.userId || !selectedRoom || !latestMessage) return
    if (latestMessage.senderId === user.userId) return
    if (!selectedRoom.unreadCount && lastReadMessageIdRef.current === latestMessage.id) return

    let cancelled = false

    chatApi
      .markAsRead(latestMessage.id, user.userId)
      .then(() => {
        if (!cancelled) {
          lastReadMessageIdRef.current = latestMessage.id
          refetchRooms()
        }
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [latestMessage, refetchRooms, selectedRoom, user?.userId])

  if (!user) return null

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId)
    setDraftRecipientId(null)
    setShowConversationMobile(true)
    setIsDetailsOpen(false)
  }

  const handleBackToList = () => {
    if (!selectedRoomId) {
      setDraftRecipientId(null)
    }
    setShowConversationMobile(false)
    setIsDetailsOpen(false)
  }

  const handleSendMessage = async (message: string, files: File[] = []) => {
    const trimmedMessage = message.trim()

    if ((!trimmedMessage && files.length === 0) || (!selectedRoomId && !draftRecipientId) || isSending) return

    setComposerError(null)
    setIsSending(true)

    try {
      let roomId = selectedRoomId

      if (!roomId && draftRecipientId) {
        const newRoom = await chatApi.createRoom({
          roomType: 'DIRECT_MESSAGE',
          roomName: otherMember?.displayName || otherMember?.fullName,
          description: otherMember ? `Mentoring conversation with ${otherMember.displayName || otherMember.fullName}` : undefined,
          createdByUserId: user.userId,
          isPrivate: true,
          maxMembers: 2,
          memberIds: [user.userId, draftRecipientId],
        })

        queryClient.setQueryData<PaginatedResponse<ChatRoomResponse> | undefined>(
          ['chatRooms', user.userId],
          (current) => upsertRoomInPage(current, newRoom)
        )
        const draftJobId = localStorage.getItem(`chat_draft_job_${draftRecipientId}`)
        if (draftJobId) {
          localStorage.setItem(`chat_job_${newRoom.id}`, draftJobId)
          localStorage.removeItem(`chat_draft_job_${draftRecipientId}`)
        }
        setSelectedRoomId(newRoom.id)
        setDraftRecipientId(null)
        roomId = newRoom.id
      }

      if (!roomId) return

      if (files.length === 0) {
        await chatApi.sendMessage({
          chatRoomId: roomId,
          senderId: user.userId,
          content: trimmedMessage,
          messageType: MessageType.TEXT,
        })
      } else {
        for (const [index, file] of files.entries()) {
          const uploadedFile = await fileApi.upload(file, { subDirectory: FILE_UPLOAD_DIRS.PUBLIC_CHAT })
          const isImage = file.type.startsWith('image/')

          await chatApi.sendMessage({
            chatRoomId: roomId,
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

      await Promise.all([
        selectedRoomId ? refetchMessages() : queryClient.invalidateQueries(['messages', roomId]),
        refetchRooms(),
      ])
    } catch {
      setComposerError('Failed to send the message or upload attachment.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="bg-[#f7f8fe] dark:bg-slate-950">
      <div className="overflow-hidden bg-white dark:bg-slate-950">
        <div className="grid h-dvh lg:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)_360px]">
          <InboxSidebar
            rooms={filteredRooms}
            currentUserId={user.userId}
            selectedRoomId={selectedRoomId}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onSelectRoom={handleSelectRoom}
            isLoading={roomsLoading}
            hiddenOnMobile={showConversationMobile}
          />

          <div className={`${showConversationMobile ? 'flex' : 'hidden'} h-dvh min-w-0 flex-1 flex-col lg:flex`}>
            <ConversationPane
              selectedRoom={effectiveRoom}
              selectedMessages={selectedMessages}
              currentUserId={user.userId}
              otherMember={otherMember}
              messagesLoading={!!selectedRoomId && messagesLoading}
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
              onShowDetails={() => setIsDetailsOpen(true)}
              onBackToList={handleBackToList}
              showBackButton={showConversationMobile}
              heightClassName="h-dvh"
              linkedJob={linkedJob}
              linkedContract={linkedContract}
            />
          </div>

          <div className="hidden h-dvh border-l border-slate-200 dark:border-slate-800 2xl:block">
            <ContextRail
              currentUserId={user.userId}
              selectedRoom={effectiveRoom}
              otherMember={otherMember}
              userProfile={otherUserProfile}
              mentorProfile={mentorProfile}
              mentorCourses={mentorCourses}
              weeklyAvailability={weeklyAvailability}
              sharedImages={sharedImages}
              sharedFiles={sharedFiles}
              sharedLinks={sharedLinks}
              isProfileLoading={mentorProfileLoading || otherUserProfileLoading}
              isCoursesLoading={mentorCoursesLoading}
              isAvailabilityLoading={weeklyAvailabilityLoading}
              linkedJob={linkedJob}
              isLinkedJobLoading={linkedJobLoading}
              linkedContract={linkedContract}
              isLinkedContractLoading={linkedContractLoading}
            />
          </div>
        </div>
      </div>

      {isDetailsOpen && effectiveRoom && (
        <div className="fixed inset-0 z-40 bg-slate-950/30 2xl:hidden">
          <div
            className="absolute inset-0"
            onClick={() => setIsDetailsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-[380px] overflow-y-auto border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
            <ContextRail
              currentUserId={user.userId}
              selectedRoom={effectiveRoom}
              otherMember={otherMember}
              userProfile={otherUserProfile}
              mentorProfile={mentorProfile}
              mentorCourses={mentorCourses}
              weeklyAvailability={weeklyAvailability}
              sharedImages={sharedImages}
              sharedFiles={sharedFiles}
              sharedLinks={sharedLinks}
              isProfileLoading={mentorProfileLoading || otherUserProfileLoading}
              isCoursesLoading={mentorCoursesLoading}
              isAvailabilityLoading={weeklyAvailabilityLoading}
              linkedJob={linkedJob}
              isLinkedJobLoading={linkedJobLoading}
              linkedContract={linkedContract}
              isLinkedContractLoading={linkedContractLoading}
              onClose={() => setIsDetailsOpen(false)}
              compact
            />
          </div>
        </div>
      )}
    </div>
  )
}
