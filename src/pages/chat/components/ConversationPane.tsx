import { ChangeEvent, ReactNode, RefObject } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronLeft,
  Sparkles,
  Target,
} from 'lucide-react'
import { ChatRoomMemberSummary, ChatRoomResponse, MessageResponse } from '@/types'
import {
  ATTACHMENT_ACCEPT,
  buildContextBanner,
  MessageAttachment,
  MessageText,
  QueuedAttachment,
  formatMessageDate,
  formatMessageTime,
  formatRoomType,
  getPresenceLabel,
  shouldShowDateSeparator,
} from '../chatShared'
import { PromptInputBox } from '@/components/ui/ai-prompt-box'
import JobContextBanner from './JobContextBanner'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Message, MessageAvatar, MessageContent, MessageFooter } from '@/components/ui/message'

type ConversationPaneProps = {
  selectedRoom: ChatRoomResponse | null
  selectedMessages: MessageResponse[]
  currentUserId: string
  otherMember?: ChatRoomMemberSummary
  messagesLoading: boolean
  scrollRef: RefObject<HTMLDivElement>
  messageInput: string
  onMessageInputChange: (value: string) => void
  queuedAttachments: QueuedAttachment[]
  onAttachmentSelect: (event: ChangeEvent<HTMLInputElement>) => void
  onRemoveAttachment: (attachmentId: string) => void
  onSendMessage: (message: string, files: File[]) => void
  fileInputRef: RefObject<HTMLInputElement>
  onOpenFilePicker: () => void
  composerError?: string | null
  isSending: boolean
  onShowDetails: () => void
  onBackToList: () => void
  showBackButton: boolean
  heightClassName?: string
  contextStatusLabel?: string
  contextStatusToneClassName?: string
  contextActionLabel?: string
  contextActionHref?: string
  noMessagesTitle?: string
  noMessagesDescription?: string
  participantRoleLabel?: string
  showUtilityActions?: boolean
  showDetailsButton?: boolean
  detailsButtonClassName?: string
  detailsButtonLabel?: string
  profileHref?: string
}

export default function ConversationPane({
  selectedRoom,
  selectedMessages,
  currentUserId,
  otherMember,
  messagesLoading,
  scrollRef,
  messageInput,
  onMessageInputChange,
  queuedAttachments,
  onAttachmentSelect,
  onRemoveAttachment,
  onSendMessage,
  fileInputRef,
  onOpenFilePicker,
  composerError,
  isSending,
  onShowDetails,
  onBackToList,
  showBackButton,
  heightClassName = 'h-dvh',
  contextStatusLabel,
  contextStatusToneClassName = 'border-slate-200 bg-slate-100 text-slate-600',
  contextActionLabel,
  contextActionHref,
  noMessagesTitle = 'No messages yet',
  noMessagesDescription = 'Start the conversation with a message or share a file.',
  participantRoleLabel,
  showUtilityActions = false,
  showDetailsButton = true,
  detailsButtonClassName = 'lg:hidden',
  detailsButtonLabel = 'Details',
  profileHref,
}: ConversationPaneProps) {
  const banner = buildContextBanner(selectedRoom)

  if (!selectedRoom) {
    return (
      <section className={`hidden ${heightClassName} flex-1 items-center justify-center bg-white lg:flex`}>
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-[#10164a]">Select a conversation</h2>
          <p className="mt-2 text-sm text-[#66729d]">Choose a room from the inbox to read messages and files.</p>
        </div>
      </section>
    )
  }

  const roomName = otherMember?.displayName || otherMember?.fullName || selectedRoom.roomName || 'Conversation'
  const roomPresence = getPresenceLabel(otherMember)
  const goalLink = selectedRoom.referenceType === 'JOB' && selectedRoom.referenceId ? `/jobs/${selectedRoom.referenceId}` : undefined

  return (
    <section className={`flex ${heightClassName} flex-1 flex-col bg-white`}>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={showBackButton ? onBackToList : undefined}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#10164a] transition-colors hover:bg-indigo-50"
              title={showBackButton ? 'Back to inbox' : 'Back'}
            >
              {showBackButton ? <ArrowLeft className="h-4 w-4 lg:hidden" /> : <ChevronLeft className="h-5 w-5" />}
            </button>

            <div className="relative shrink-0">
              {otherMember?.avatarUrl ? (
                <img
                  src={otherMember.avatarUrl}
                  alt={roomName}
                  className="h-[52px] w-[52px] rounded-full object-cover"
                />
              ) : (
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white">
                  {roomName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('')}
                </div>
              )}
              {otherMember?.isOnline && (
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
              )}
            </div>

              <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {profileHref ? (
                  <Link to={profileHref} className="truncate text-[18px] font-bold text-[#10164a] hover:text-indigo-700 hover:underline hover:underline-offset-4">
                    {roomName}
                  </Link>
                ) : (
                  <h2 className="truncate text-[18px] font-bold text-[#10164a]">{roomName}</h2>
                )}
                {otherMember?.isOnline && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
                {otherMember?.isOnline && <span className="text-[13px] font-medium text-[#10164a]">Online</span>}
              </div>
              <p className="truncate text-[14px] text-[#66729d]">
                {selectedRoom.roomType === 'DIRECT_MESSAGE'
                  ? participantRoleLabel || otherMember?.memberRole?.replace(/_/g, ' ') || roomPresence
                  : `${roomPresence} - ${formatRoomType(selectedRoom.roomType)}`}
              </p>
            </div>
          </div>

          {showUtilityActions ? <div className="hidden items-center gap-3 md:flex" /> : null}

          {showDetailsButton ? (
            <button
              type="button"
              onClick={onShowDetails}
              className={`inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-[#52608b] transition-colors hover:border-indigo-200 hover:text-indigo-700 ${detailsButtonClassName}`}
            >
              {detailsButtonLabel}
            </button>
          ) : null}
        </div>

        {banner && (
          <div className="px-4 pb-4 sm:px-6">
            <div className="flex flex-col gap-4 rounded-xl border border-indigo-100 bg-[#f4f3ff] px-4 py-4 sm:flex-row sm:items-center">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-indigo-600">
                <Target className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-[14px] font-bold text-[#10164a]">Goal: {banner.title}</p>
                  {contextStatusLabel ? (
                    <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-bold ${contextStatusToneClassName}`}>
                      {contextStatusLabel}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-[13px] text-[#25305f]">{banner.detail}</p>
              </div>
              {(contextActionHref && contextActionLabel) || goalLink ? (
                <Link
                  to={contextActionHref || goalLink!}
                  className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-white px-4 text-[13px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 sm:w-auto"
                >
                  {contextActionLabel || 'View goal'}
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </header>

      {/* Job Context Banner - Shows when chat is linked to a job */}
      {selectedRoom.referenceType === 'JOB' && selectedRoom.referenceId && (
        <JobContextBanner jobId={selectedRoom.referenceId} userId={currentUserId} />
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-5 pb-8 sm:px-6 sm:pb-10">
        {messagesLoading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className={`flex ${item % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="w-full max-w-[60%] space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : selectedMessages.length === 0 ? (
            <div className="flex h-full min-h-[340px] items-center justify-center">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                  <Sparkles className="h-6 w-6" />
                </div>
              <h3 className="mt-4 text-lg font-semibold text-[#10164a]">{noMessagesTitle}</h3>
              <p className="mt-2 text-sm text-[#66729d]">{noMessagesDescription}</p>
              </div>
            </div>
        ) : (
          <div className="space-y-5">
            {selectedMessages.map((message, index) => {
              const mine = message.senderId === currentUserId
              const previousMessage = selectedMessages[index - 1]
              const showDate = shouldShowDateSeparator(previousMessage, message)
              const showSenderName = !mine && selectedRoom.memberCount > 2

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="mb-5 flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-100" />
                      <span className="text-xs font-medium text-[#66729d]">{formatMessageDate(message.sentAt)}</span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                  )}

                  <Message align={mine ? "end" : "start"}>
                    {(!mine || mine) && (
                      <MessageAvatar className="hidden sm:block">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={message.senderAvatarUrl || undefined} alt={message.senderName} />
                          <AvatarFallback>
                            {message.senderName
                              .split(' ')
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase())
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                      </MessageAvatar>
                    )}

                    <MessageContent>
                      {showSenderName && !mine && <p className="mb-1 ml-1 text-xs font-medium text-[#66729d]">{message.senderName}</p>}

                      <Bubble align={mine ? "end" : "start"} variant={mine ? "default" : "muted"} className="max-w-full">
                        <BubbleContent className={mine ? "border-0 shadow-sm" : "shadow-sm border-0"}>
                          <MessageText content={message.content} mine={mine} />
                          <MessageAttachment message={message} mine={mine} />
                        </BubbleContent>
                      </Bubble>

                      <MessageFooter>
                        {formatMessageTime(message.sentAt)}
                      </MessageFooter>
                    </MessageContent>
                  </Message>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
        <PromptInputBox 
           onSend={(msg, files) => onSendMessage(msg, files || [])} 
           isLoading={isSending}
           className="shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        />
        {composerError && <p className="text-sm text-rose-500 p-3 pb-0">{composerError}</p>}
      </div>
    </section>
  )
}

function ComposerIconButton({
  title,
  onClick,
  children,
}: {
  title: string
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#10164a] transition-colors hover:bg-indigo-50 hover:text-indigo-700"
    >
      {children}
    </button>
  )
}
