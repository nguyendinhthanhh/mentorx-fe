import { ChangeEvent, FormEvent, ReactNode, RefObject } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Phone,
  Send,
  Smile,
  Sparkles,
  Target,
  Video,
  X,
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
  onSendMessage: (event: FormEvent) => void
  fileInputRef: RefObject<HTMLInputElement>
  onOpenFilePicker: () => void
  composerError?: string | null
  isSending: boolean
  onShowDetails: () => void
  onBackToList: () => void
  showBackButton: boolean
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
}: ConversationPaneProps) {
  const banner = buildContextBanner(selectedRoom)

  if (!selectedRoom) {
    return (
      <section className="hidden h-[calc(100vh-73px)] flex-1 items-center justify-center bg-white lg:flex">
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
    <section className="flex h-[calc(100vh-73px)] flex-1 flex-col bg-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
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
              <div className="flex items-center gap-2">
                <h2 className="truncate text-[18px] font-bold text-[#10164a]">{roomName}</h2>
                {otherMember?.isOnline && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
                {otherMember?.isOnline && <span className="text-[13px] font-medium text-[#10164a]">Online</span>}
              </div>
              <p className="truncate text-[14px] text-[#66729d]">
                {selectedRoom.roomType === 'DIRECT_MESSAGE'
                  ? otherMember?.memberRole?.replace(/_/g, ' ') || roomPresence
                  : `${roomPresence} - ${formatRoomType(selectedRoom.roomType)}`}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <IconAction title="Call">
              <Phone className="h-4 w-4" />
            </IconAction>
            <IconAction title="Video call">
              <Video className="h-4 w-4" />
            </IconAction>
            <IconAction title="Calendar">
              <CalendarDays className="h-4 w-4" />
            </IconAction>
            <IconAction title="More">
              <MoreHorizontal className="h-5 w-5" />
            </IconAction>
          </div>

          <button
            type="button"
            onClick={onShowDetails}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-[#52608b] transition-colors hover:border-indigo-200 hover:text-indigo-700 lg:hidden"
          >
            Details
          </button>
        </div>

        {banner && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-4 rounded-xl border border-indigo-100 bg-[#f4f3ff] px-4 py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-indigo-600">
                <Target className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-[#10164a]">Goal: {banner.title}</p>
                <p className="mt-1 truncate text-[13px] text-[#25305f]">{banner.detail}</p>
              </div>
              {goalLink && (
                <Link
                  to={goalLink}
                  className="hidden h-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-white px-4 text-[13px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 sm:inline-flex"
                >
                  View goal
                </Link>
              )}
              <button type="button" className="text-indigo-500 hover:text-indigo-700" title="Dismiss goal banner">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-white px-6 py-5">
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
              <h3 className="mt-4 text-lg font-semibold text-[#10164a]">No messages yet</h3>
              <p className="mt-2 text-sm text-[#66729d]">Start the conversation with a message or share a file.</p>
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

                  <div className={`flex gap-3 ${mine ? 'justify-end' : 'justify-start'}`}>
                    {!mine && (
                      <div className="mt-auto hidden h-9 w-9 shrink-0 overflow-hidden rounded-full sm:block">
                        {message.senderAvatarUrl ? (
                          <img src={message.senderAvatarUrl} alt={message.senderName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-[11px] font-semibold text-[#52608b]">
                            {message.senderName
                              .split(' ')
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase())
                              .join('')}
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`max-w-[86%] sm:max-w-[64%] ${mine ? 'items-end' : 'items-start'}`}>
                      {showSenderName && <p className="mb-1 ml-1 text-xs font-medium text-[#66729d]">{message.senderName}</p>}

                      <div
                        className={`rounded-xl px-4 py-3 shadow-sm ${
                          mine
                            ? 'border border-indigo-200 bg-[#e9e7ff] text-[#10164a]'
                            : 'border border-slate-200 bg-white text-[#10164a]'
                        }`}
                      >
                        <MessageText content={message.content} mine={false} />
                        <MessageAttachment message={message} mine={false} />
                      </div>

                      <p className={`mt-1 px-1 text-[11px] ${mine ? 'text-right text-[#66729d]' : 'text-[#66729d]'}`}>
                        {formatMessageTime(message.sentAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-white px-6 py-4 border-t border-slate-100">
        <form onSubmit={onSendMessage} className="relative w-full max-w-4xl mx-auto flex flex-col bg-white border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all duration-300">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            onChange={onAttachmentSelect}
            className="hidden"
          />

          {composerError && <p className="text-sm text-rose-500 p-3 pb-0">{composerError}</p>}

          {queuedAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 pb-0">
              {queuedAttachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-sm group max-w-[200px]">
                  {attachment.previewUrl ? (
                    <img src={attachment.previewUrl} alt={attachment.file.name} className="h-8 w-8 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 truncate font-medium text-xs">{attachment.file.name}</p>
                    <p className="text-slate-400 text-[10px]">{(attachment.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(attachment.id)}
                    className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 p-3">
            <textarea
              value={messageInput}
              onChange={(event) => {
                onMessageInputChange(event.target.value)
                event.target.style.height = 'auto'
                event.target.style.height = `${Math.min(event.target.scrollHeight, 200)}px`
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (!isSending && (messageInput.trim() || queuedAttachments.length > 0)) {
                    onSendMessage(e as any)
                    e.currentTarget.style.height = 'auto'
                  }
                }
              }}
              rows={1}
              placeholder="Type a message..."
              className="w-full max-h-[200px] min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none px-3 py-3 text-slate-700 text-[15px] placeholder:text-slate-400"
            />

            <div className="flex items-center gap-2 shrink-0 pb-1 pr-1">
              <button
                type="button"
                onClick={onOpenFilePicker}
                className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                type="submit"
                disabled={isSending || (!messageInput.trim() && queuedAttachments.length === 0)}
                className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center ${
                  messageInput.trim() || queuedAttachments.length > 0
                    ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}

function IconAction({ title, children }: { title: string; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#dce2f2] bg-white text-[#10164a] transition-colors hover:border-indigo-200 hover:bg-indigo-50"
    >
      {children}
    </button>
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
