import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { chatApi } from '@/api/chatApi'
import { contractApi } from '@/api/contractApi'
import { FILE_UPLOAD_DIRS, fileApi } from '@/api/fileApi'
import { mentorApi } from '@/api/mentorApi'
import { ContractResponse, MentorOfferingResponse, MessageType } from '@/types'
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

export default function ChatListPage() {
  const { user } = useAuthStore()
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<InboxFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [composerError, setComposerError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [showConversationMobile, setShowConversationMobile] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const targetUserId = searchParams.get('userId')
  const targetRoomId = searchParams.get('conversationId') || searchParams.get('roomId')

  const { data: rooms, isLoading: roomsLoading, refetch: refetchRooms } = useQuery(
    ['chatRooms', user?.userId],
    () => chatApi.getUserRooms(user!.userId, { size: 50 }),
    {
      enabled: !!user?.userId,
      refetchInterval: 10000,
    }
  )

  const roomList = rooms?.content || []

  const filteredRooms = useMemo(() => {
    return roomList.filter((room) => {
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
  }, [activeFilter, roomList, searchTerm])

  useEffect(() => {
    if (roomsLoading || !user?.userId) return

    if (targetRoomId) {
      const existingRoom = roomList.find((room) => room.id === targetRoomId)
      if (existingRoom) {
        setSelectedRoomId(existingRoom.id)
        setSearchParams({})
      }
      return
    }

    if (targetUserId) {
      const existingRoom = roomList.find(
        (r) => r.roomType === 'DIRECT_MESSAGE' && r.members?.some((m) => m.userId === targetUserId)
      )

      if (existingRoom) {
        setSelectedRoomId(existingRoom.id)
        
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
        chatApi
          .createRoom({
            roomType: 'DIRECT_MESSAGE',
            memberIds: [user.userId, targetUserId],
            createdByUserId: user.userId,
          })
          .then(async (newRoom) => {
            setSelectedRoomId(newRoom.id)
            
            const contextMsg = searchParams.get('contextMsg')
            const linkedJobId = searchParams.get('jobId')

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
      }
      return
    }

    if (roomList.length === 0) {
      setSelectedRoomId(null)
      return
    }

    if (!selectedRoomId) {
      setSelectedRoomId((filteredRooms[0] || roomList[0]).id)
      return
    }

    if (filteredRooms.length === 0) {
      setSelectedRoomId(null)
      return
    }

    if (!filteredRooms.some((room) => room.id === selectedRoomId)) {
      setSelectedRoomId(filteredRooms[0].id)
    }
  }, [filteredRooms, roomList, selectedRoomId, targetRoomId, targetUserId, roomsLoading, user?.userId, setSearchParams, refetchRooms])

  const selectedRoom = useMemo(
    () => roomList.find((room) => room.id === selectedRoomId) || null,
    [roomList, selectedRoomId]
  )

  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useQuery(
    ['messages', selectedRoomId],
    () => chatApi.getRoomMessages(selectedRoomId!, { size: 100 }),
    {
      enabled: !!selectedRoomId,
      refetchInterval: selectedRoomId ? 4000 : false,
    }
  )

  const selectedMessages = messages?.content || []
  const latestMessage = selectedMessages[selectedMessages.length - 1]
  const otherMember = useMemo(
    () => (selectedRoom ? getPrimaryOtherMember(selectedRoom, user?.userId) : undefined),
    [selectedRoom, user?.userId]
  )
  const isDirectRoom = selectedRoom?.roomType === 'DIRECT_MESSAGE'
  const otherMemberId = isDirectRoom ? otherMember?.userId : undefined

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

  const linkedJobId = useMemo(() => {
    if (!selectedRoomId) return null
    return localStorage.getItem(`chat_job_${selectedRoomId}`) || selectedRoom?.referenceId || null
  }, [selectedRoomId, selectedRoom?.referenceId])

  const { data: linkedJob, isLoading: linkedJobLoading } = useQuery(
    ['chat-linked-job', linkedJobId],
    async () => {
      if (!linkedJobId) return null
      // Import jobApi first
      const { jobApi } = await import('@/api/jobApi')
      return jobApi.getById(linkedJobId).catch(() => null)
    },
    {
      enabled: !!linkedJobId,
      retry: false,
    }
  )

  const { data: linkedContract, isLoading: linkedContractLoading } = useQuery(
    ['chat-linked-contract', linkedJobId],
    async () => {
      if (!linkedJobId) return null
      const result = await contractApi.getByJob(linkedJobId, { page: 0, size: 10 }).catch(() => null)
      const contracts = result?.content || []
      return (
        contracts.find((contract) => contract.status === 'ACTIVE') ||
        contracts.find((contract) => contract.status === 'PENDING_PAYMENT') ||
        contracts.find((contract) => contract.status === 'COMPLETED') ||
        contracts[0] ||
        null
      ) as ContractResponse | null
    },
    {
      enabled: !!linkedJobId,
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

  useEffect(() => {
    if (!user?.userId || !selectedRoom || !latestMessage) return
    if (!selectedRoom.unreadCount || latestMessage.senderId === user.userId) return

    let cancelled = false

    chatApi
      .markAsRead(latestMessage.id, user.userId)
      .then(() => {
        if (!cancelled) {
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
    setShowConversationMobile(true)
    setIsDetailsOpen(false)
  }

  const handleBackToList = () => {
    setShowConversationMobile(false)
    setIsDetailsOpen(false)
  }

  const handleSendMessage = async (message: string, files: File[] = []) => {
    const trimmedMessage = message.trim()

    if ((!trimmedMessage && files.length === 0) || !selectedRoomId || isSending) return

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
          const uploadedFile = await fileApi.upload(file, { subDirectory: FILE_UPLOAD_DIRS.PUBLIC_CHAT })
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

      await Promise.all([refetchMessages(), refetchRooms()])
    } catch {
      setComposerError('Failed to send the message or upload attachment.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="bg-[#f7f8fe]">
      <div className="overflow-hidden border-t border-slate-200 bg-white">
        <div className="grid h-[calc(100dvh-73px)] lg:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)_360px]">
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

          <div className={`${showConversationMobile ? 'flex' : 'hidden'} h-[calc(100dvh-73px)] min-w-0 flex-1 flex-col lg:flex`}>
            <ConversationPane
              selectedRoom={selectedRoom}
              selectedMessages={selectedMessages}
              currentUserId={user.userId}
              otherMember={otherMember}
              messagesLoading={messagesLoading}
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
            />
          </div>

          <div className="hidden h-[calc(100dvh-73px)] border-l border-slate-200 2xl:block">
            <ContextRail
              selectedRoom={selectedRoom}
              otherMember={otherMember}
              mentorProfile={mentorProfile}
              mentorCourses={mentorCourses}
              weeklyAvailability={weeklyAvailability}
              sharedImages={sharedImages}
              sharedFiles={sharedFiles}
              sharedLinks={sharedLinks}
              isProfileLoading={mentorProfileLoading}
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

      {isDetailsOpen && selectedRoom && (
        <div className="fixed inset-0 z-40 bg-slate-950/30 2xl:hidden">
          <div
            className="absolute inset-0"
            onClick={() => setIsDetailsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-[380px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <ContextRail
              selectedRoom={selectedRoom}
              otherMember={otherMember}
              mentorProfile={mentorProfile}
              mentorCourses={mentorCourses}
              weeklyAvailability={weeklyAvailability}
              sharedImages={sharedImages}
              sharedFiles={sharedFiles}
              sharedLinks={sharedLinks}
              isProfileLoading={mentorProfileLoading}
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
