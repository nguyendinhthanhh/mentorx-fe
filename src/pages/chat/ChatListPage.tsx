import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from 'react-query'
import { chatApi } from '@/api/chatApi'
import { fileApi } from '@/api/fileApi'
import { mentorApi } from '@/api/mentorApi'
import { CourseResponse, MessageType } from '@/types'
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
  const [messageInput, setMessageInput] = useState('')
  const [queuedAttachments, setQueuedAttachments] = useState<QueuedAttachment[]>([])
  const [composerError, setComposerError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [showConversationMobile, setShowConversationMobile] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  }, [filteredRooms, roomList, selectedRoomId])

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
      if (!otherMemberId) return [] as CourseResponse[]
      return mentorApi.getPublishedMentorCourses(otherMemberId).catch(() => [] as CourseResponse[])
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

  useEffect(() => {
    return () => {
      queuedAttachments.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl)
        }
      })
    }
  }, [queuedAttachments])

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

  const handleAttachmentSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const nextAttachments: QueuedAttachment[] = []
    let nextError: string | null = null

    for (const file of files) {
      if (queuedAttachments.length + nextAttachments.length >= MAX_ATTACHMENTS) {
        nextError = `You can attach up to ${MAX_ATTACHMENTS} files per message.`
        break
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        nextError = `${file.name} is larger than 15 MB.`
        continue
      }

      nextAttachments.push({
        id: `${file.name}-${file.lastModified}-${file.size}`,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      })
    }

    if (nextAttachments.length > 0) {
      setQueuedAttachments((current) => [...current, ...nextAttachments])
    }

    setComposerError(nextError)
    event.target.value = ''
  }

  const handleRemoveAttachment = (attachmentId: string) => {
    setQueuedAttachments((current) => {
      const target = current.find((item) => item.id === attachmentId)
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return current.filter((item) => item.id !== attachmentId)
    })
  }

  const clearQueuedAttachments = () => {
    setQueuedAttachments((current) => {
      current.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl)
        }
      })
      return []
    })
  }

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedMessage = messageInput.trim()

    if ((!trimmedMessage && queuedAttachments.length === 0) || !selectedRoomId || isSending) return

    setComposerError(null)
    setIsSending(true)

    try {
      if (queuedAttachments.length === 0) {
        await chatApi.sendMessage({
          chatRoomId: selectedRoomId,
          senderId: user.userId,
          content: trimmedMessage,
          messageType: MessageType.TEXT,
        })
      } else {
        for (const [index, attachment] of queuedAttachments.entries()) {
          const uploadedFile = await fileApi.upload(attachment.file)
          const isImage = attachment.file.type.startsWith('image/')

          await chatApi.sendMessage({
            chatRoomId: selectedRoomId,
            senderId: user.userId,
            content: index === 0 ? trimmedMessage : '',
            messageType: isImage ? MessageType.IMAGE : MessageType.FILE,
            attachmentUrl: uploadedFile.fileUrl,
            attachmentFilename: attachment.file.name,
            attachmentMimeType: attachment.file.type || uploadedFile.fileType,
            attachmentSize: attachment.file.size,
            metadata: {
              uploadedFileName: uploadedFile.fileName,
              originalFileName: attachment.file.name,
            },
          })
        }
      }

      setMessageInput('')
      clearQueuedAttachments()
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
        <div className="grid h-[calc(100vh-73px)] lg:grid-cols-[350px_minmax(0,1fr)_330px] 2xl:grid-cols-[380px_minmax(0,1fr)_360px]">
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

          <div className={`${showConversationMobile ? 'flex' : 'hidden'} h-[calc(100vh-73px)] flex-1 flex-col lg:flex`}>
            <ConversationPane
              selectedRoom={selectedRoom}
              selectedMessages={selectedMessages}
              currentUserId={user.userId}
              otherMember={otherMember}
              messagesLoading={messagesLoading}
              scrollRef={scrollRef}
              messageInput={messageInput}
              onMessageInputChange={setMessageInput}
              queuedAttachments={queuedAttachments}
              onAttachmentSelect={handleAttachmentSelect}
              onRemoveAttachment={handleRemoveAttachment}
              onSendMessage={handleSendMessage}
              fileInputRef={fileInputRef}
              onOpenFilePicker={() => fileInputRef.current?.click()}
              composerError={composerError}
              isSending={isSending}
              onShowDetails={() => setIsDetailsOpen(true)}
              onBackToList={handleBackToList}
              showBackButton={showConversationMobile}
            />
          </div>

          <div className="hidden h-[calc(100vh-73px)] border-l border-slate-200 lg:block">
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
            />
          </div>
        </div>
      </div>

      {isDetailsOpen && selectedRoom && (
        <div className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden">
          <div
            className="absolute inset-0"
            onClick={() => setIsDetailsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-[380px] border-l border-slate-200 bg-white shadow-2xl">
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
              onClose={() => setIsDetailsOpen(false)}
              compact
            />
          </div>
        </div>
      )}
    </div>
  )
}
