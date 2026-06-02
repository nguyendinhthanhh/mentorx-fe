import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from 'react-query'
import { ArrowUpRight, MessageSquare, RefreshCw, X } from 'lucide-react'
import { chatApi } from '@/api/chatApi'
import { fileApi } from '@/api/fileApi'
import { useAuthStore } from '@/store/authStore'
import { Skeleton, SkeletonCircle } from '@/components/ui/Skeleton'
import { PromptInputBox } from '@/components/ui/ai-prompt-box'
import { ChatRoomResponse, MessageResponse, MessageType } from '@/types'
import {
  MessageAttachment,
  MessageText,
  formatMessageDate,
  formatMessageTime,
  getPresenceLabel,
  getPrimaryOtherMember,
  shouldShowDateSeparator,
} from '@/pages/chat/chatShared'

type ContextType = 'JOB' | 'PROPOSAL' | 'CONTRACT' | 'MENTOR_APPLICATION'

type ContextualChatDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId?: string | null
  recipientId?: string | null
  contextType?: ContextType
  contextId?: string | null
  title?: string
  subtitle?: string
  contextTitle?: string
  statusLabel?: string
  statusToneClassName?: string
}

export default function ContextualChatDrawer({
  open,
  onOpenChange,
  conversationId,
  recipientId,
  contextType,
  contextId,
  title,
  subtitle,
  contextTitle,
  statusLabel,
  statusToneClassName,
}: ContextualChatDrawerProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [composerError, setComposerError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const resolveQuery = useQuery(
    ['contextual-chat-room', user?.userId, conversationId, recipientId, contextType, contextId],
    async () => {
      if (!user?.userId) return null

      if (conversationId) {
        return chatApi.getRoomById(conversationId, user.userId)
      }

      if (recipientId && contextType && contextId) {
        return chatApi.resolveConversation({
          recipientId,
          contextType,
          contextId,
        })
      }

      return null
    },
    {
      enabled: open && !!user?.userId && (!!conversationId || (!!recipientId && !!contextType && !!contextId)),
      retry: false,
    }
  )

  const resolvedRoom = (resolveQuery.data || null) as ChatRoomResponse | null
  const otherMember = useMemo(
    () => (resolvedRoom ? getPrimaryOtherMember(resolvedRoom, user?.userId) : undefined),
    [resolvedRoom, user?.userId]
  )

  const messagesQuery = useQuery(
    ['contextual-chat-messages', resolvedRoom?.id],
    async () => {
      if (!resolvedRoom?.id) return { content: [] as MessageResponse[] }
      return chatApi.getRoomMessages(resolvedRoom.id, { size: 100 })
    },
    {
      enabled: open && !!resolvedRoom?.id,
      refetchInterval: open && resolvedRoom?.id ? 5000 : false,
      keepPreviousData: true,
    }
  )

  const selectedMessages = messagesQuery.data?.content || []
  const latestMessage = selectedMessages[selectedMessages.length - 1]

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [selectedMessages.length, resolvedRoom?.id])

  useEffect(() => {
    if (!open || !user?.userId || !resolvedRoom || !latestMessage) return
    if (!resolvedRoom.unreadCount || latestMessage.senderId === user.userId) return

    let cancelled = false
    chatApi
      .markAsRead(latestMessage.id, user.userId)
      .then(() => {
        if (!cancelled) {
          void queryClient.invalidateQueries(['chatRooms', user.userId])
        }
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [latestMessage, open, queryClient, resolvedRoom, user?.userId])

  const handleSendMessage = async (message: string, files: File[] = []) => {
    const trimmedMessage = message.trim()
    if ((!trimmedMessage && files.length === 0) || !resolvedRoom?.id || !user?.userId || isSending) return

    setComposerError(null)
    setIsSending(true)

    try {
      if (files.length === 0) {
        await chatApi.sendMessage({
          chatRoomId: resolvedRoom.id,
          senderId: user.userId,
          content: trimmedMessage,
          messageType: MessageType.TEXT,
        })
      } else {
        for (const [index, file] of files.entries()) {
          const uploadedFile = await fileApi.upload(file)
          const isImage = file.type.startsWith('image/')

          await chatApi.sendMessage({
            chatRoomId: resolvedRoom.id,
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
        messagesQuery.refetch(),
        queryClient.invalidateQueries(['chatRooms', user.userId]),
      ])
    } catch (error: any) {
      setComposerError(error?.response?.data?.message || 'Unable to send this message.')
    } finally {
      setIsSending(false)
    }
  }

  const handleOpenFullChat = () => {
    if (!resolvedRoom?.id) return
    onOpenChange(false)
    const targetBasePath = location.pathname.startsWith('/mentor') ? '/mentor/messages' : '/chat'
    navigate(`${targetBasePath}?conversationId=${resolvedRoom.id}`)
  }

  const resolvedTitle =
    title ||
    otherMember?.displayName ||
    otherMember?.fullName ||
    resolvedRoom?.roomName ||
    'Conversation'

  const resolvedSubtitle = subtitle || getContextSubtitle(contextType) || 'Conversation'
  const helperPresence = otherMember ? getPresenceLabel(otherMember) : null
  const emptyStateTitle =
    contextType === 'CONTRACT'
      ? 'No messages yet. Start the conversation with your client.'
      : 'No messages yet. Start the conversation.'
  const badgeToneClassName = statusToneClassName || 'border-slate-200 bg-slate-100 text-slate-600'

  return (
    <div className={`fixed inset-0 z-[70] ${open ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity xl:hidden ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => onOpenChange(false)}
      />

      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        } xl:top-6 xl:bottom-6 xl:right-6 xl:rounded-[28px] xl:border xl:border-slate-200 xl:shadow-[0_30px_80px_rgba(15,23,42,0.18)]`}
      >
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4 xl:rounded-t-[28px]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex items-center gap-3">
              {resolveQuery.isLoading ? (
                <SkeletonCircle size="h-11 w-11" />
              ) : otherMember?.avatarUrl ? (
                <img src={otherMember.avatarUrl} alt={resolvedTitle} className="h-11 w-11 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-sm font-black text-indigo-600">
                  {resolvedTitle
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('')}
                </div>
              )}

              <div className="min-w-0">
                <h2 className="truncate text-lg font-black tracking-tight text-slate-950">{resolvedTitle}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-6 items-center rounded-full bg-indigo-50 px-2.5 text-[11px] font-bold text-indigo-700">
                    {resolvedSubtitle}
                  </span>
                  {statusLabel ? (
                    <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-bold ${badgeToneClassName}`}>
                      {statusLabel}
                    </span>
                  ) : null}
                </div>
                {contextTitle ? <p className="mt-2 truncate text-sm font-medium text-slate-500">{contextTitle}</p> : null}
                {helperPresence ? <p className="mt-1 text-xs text-slate-400">{helperPresence}</p> : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {resolvedRoom?.id ? (
                <button
                  type="button"
                  onClick={handleOpenFullChat}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Open full chat
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 px-5 py-5">
          {resolveQuery.isLoading ? (
            <DrawerLoadingState />
          ) : resolveQuery.isError ? (
            <DrawerErrorState
              title={(resolveQuery.error as any)?.response?.status === 403 ? 'You do not have access to this conversation.' : 'Unable to load this conversation.'}
              onRetry={() => resolveQuery.refetch()}
            />
          ) : !resolvedRoom ? (
            <DrawerEmptyState title="Opening conversation..." />
          ) : messagesQuery.isLoading ? (
            <DrawerLoadingState />
          ) : messagesQuery.isError ? (
            <DrawerErrorState title="Unable to load this conversation." onRetry={() => messagesQuery.refetch()} />
          ) : selectedMessages.length === 0 ? (
            <DrawerEmptyState title={emptyStateTitle} />
          ) : (
            <div className="space-y-5">
              {selectedMessages.map((message, index) => {
                const mine = message.senderId === user?.userId
                const previousMessage = selectedMessages[index - 1]
                const showDate = shouldShowDateSeparator(previousMessage, message)

                return (
                  <div key={message.id}>
                    {showDate ? (
                      <div className="mb-5 flex items-center gap-4">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs font-medium text-slate-400">{formatMessageDate(message.sentAt)}</span>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>
                    ) : null}

                    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[88%] ${mine ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-sm ${
                            mine
                              ? 'border border-indigo-200 bg-[#e9e7ff] text-[#10164a]'
                              : 'border border-slate-200 bg-white text-[#10164a]'
                          }`}
                        >
                          <MessageText content={message.content} mine={mine} />
                          <MessageAttachment message={message} mine={mine} />
                        </div>
                        <p className={`mt-1 px-1 text-[11px] text-slate-400 ${mine ? 'text-right' : ''}`}>
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

        <div className="border-t border-slate-200 bg-white px-5 py-4 xl:rounded-b-[28px]">
          <PromptInputBox onSend={(message, files) => void handleSendMessage(message, files || [])} isLoading={isSending} />
          {composerError ? <p className="pt-3 text-sm text-rose-500">{composerError}</p> : null}
        </div>
      </aside>
    </div>
  )
}

function DrawerLoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className="w-full max-w-[75%] space-y-2">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DrawerEmptyState({ title }: { title: string }) {
  return (
    <div className="flex h-full min-h-[280px] items-center justify-center">
      <div className="max-w-xs text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
          <MessageSquare className="h-5 w-5" />
        </div>
        <p className="mt-4 text-sm font-bold text-slate-900">{title}</p>
      </div>
    </div>
  )
}

function DrawerErrorState({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <div className="flex h-full min-h-[280px] items-center justify-center">
      <div className="max-w-xs text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <X className="h-5 w-5" />
        </div>
        <p className="mt-4 text-sm font-bold text-slate-900">{title}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    </div>
  )
}

function getContextSubtitle(contextType?: ContextType): string | null {
  if (!contextType) return null

  switch (contextType) {
    case 'CONTRACT':
      return 'Contract chat'
    case 'PROPOSAL':
      return 'Proposal discussion'
    case 'JOB':
      return 'Job conversation'
    case 'MENTOR_APPLICATION':
      return 'Application chat'
    default:
      return null
  }
}
