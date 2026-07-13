import { type ReactNode, useRef, useState } from 'react'
import { useQuery } from 'react-query'
import { FileText, Image, MessageSquare, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { chatApi } from '@/api/chatApi'
import { FILE_UPLOAD_DIRS, fileApi } from '@/api/fileApi'
import { useI18n } from '@/i18n/I18nProvider'
import ConversationPane from '@/pages/chat/components/ConversationPane'
import { buildSharedFiles, buildSharedImages, getPrimaryOtherMember } from '@/pages/chat/chatShared'
import { useAuthStore } from '@/store/authStore'
import { userApi } from '@/api/userApi'
import { ChatRoomMemberSummary, MessageResponse, MessageType, UserResponse } from '@/types'
import { formatDateTime, formatRelativeTime } from '@/utils/formatters'

export default function AdminSupportPage() {
  const { user } = useAuthStore()
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [composerError, setComposerError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const roomsQuery = useQuery(
    ['admin-support-rooms', user?.userId],
    () => chatApi.getUserRooms(user!.userId, { page: 0, size: 50 }),
    { enabled: !!user?.userId }
  )

  const rooms = roomsQuery.data?.content ?? []
  const query = search.trim().toLowerCase()
  const filteredRooms = query
    ? rooms.filter((room) => (
      room.roomName?.toLowerCase().includes(query)
      || room.lastMessagePreview?.toLowerCase().includes(query)
    ))
    : rooms

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null
  const otherMember = selectedRoom ? getPrimaryOtherMember(selectedRoom, user?.userId) : undefined

  const messagesQuery = useQuery(
    ['admin-support-messages', selectedRoomId],
    () => chatApi.getRoomMessages(selectedRoomId!, { size: 100 }),
    { enabled: !!selectedRoomId, refetchInterval: selectedRoomId ? 5000 : false }
  )
  const selectedMessages = messagesQuery.data?.content ?? []
  const sharedFiles = buildSharedFiles(selectedMessages)
  const sharedImages = buildSharedImages(selectedMessages)

  const profileQuery = useQuery(
    ['admin-support-member', otherMember?.userId],
    () => userApi.getUserById(otherMember!.userId),
    { enabled: !!otherMember?.userId, retry: false, staleTime: 60_000 }
  )

  const handleSendMessage = async (message: string, files: File[] = []) => {
    const content = message.trim()
    if ((!content && files.length === 0) || !selectedRoomId || !user?.userId || isSending) return

    setComposerError(null)
    setIsSending(true)

    try {
      if (files.length === 0) {
        await chatApi.sendMessage({
          chatRoomId: selectedRoomId,
          senderId: user.userId,
          content,
          messageType: MessageType.TEXT,
        })
      } else {
        for (const [index, file] of files.entries()) {
          const uploadedFile = await fileApi.upload(file, { subDirectory: FILE_UPLOAD_DIRS.PUBLIC_CHAT })
          await chatApi.sendMessage({
            chatRoomId: selectedRoomId,
            senderId: user.userId,
            content: index === 0 ? content : '',
            messageType: file.type.startsWith('image/') ? MessageType.IMAGE : MessageType.FILE,
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

      setMessageInput('')
      await messagesQuery.refetch()
    } catch {
      setComposerError(t('admin.support.sendError'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100dvh-5rem)]">
      <section className="flex h-full w-full overflow-hidden bg-white dark:bg-slate-900">
        <div className="flex h-full w-full">
          <aside className={`flex min-h-0 flex-col border-r border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900 ${selectedRoomId ? 'hidden md:flex md:w-[340px]' : 'w-full md:w-[340px]'}`}>
            <div className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-950 dark:text-white">{t('admin.support.inbox')}</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t('admin.support.conversationCount', { count: rooms.length })}
                </span>
              </div>
              <label className="relative mt-3 block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('admin.support.searchPlaceholder')}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-sky-950"
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {roomsQuery.isLoading ? (
                <InboxSkeleton />
              ) : roomsQuery.isError ? (
                <InboxNotice
                  icon={<MessageSquare className="h-5 w-5" />}
                  title={t('admin.support.loadError')}
                  action={t('admin.support.retry')}
                  onAction={() => void roomsQuery.refetch()}
                />
              ) : filteredRooms.length === 0 ? (
                <InboxNotice
                  icon={<MessageSquare className="h-5 w-5" />}
                  title={t('admin.support.emptyInboxTitle')}
                  description={t('admin.support.emptyInboxDescription')}
                />
              ) : (
                filteredRooms.map((room) => {
                  const member = getPrimaryOtherMember(room, user?.userId)
                  const roomName = member?.displayName || member?.fullName || room.roomName || t('admin.support.title')
                  const initials = roomName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('')
                  const active = room.id === selectedRoomId

                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`flex w-full gap-3 border-b border-slate-200 px-4 py-4 text-left transition last:border-b-0 dark:border-slate-800 ${active ? 'bg-sky-50 dark:bg-sky-950/30' : 'hover:bg-white dark:hover:bg-slate-800/60'}`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-200 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {member?.avatarUrl ? <img src={member.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{roomName}</p>
                          <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                            {room.lastMessageAt ? formatDateTime(room.lastMessageAt) : t('admin.support.noRecentActivity')}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {room.lastMessagePreview || t('admin.support.noPreview')}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </aside>

          <div className={`min-h-0 flex-1 ${!selectedRoomId ? 'hidden md:flex' : 'flex'}`}>
            {selectedRoom ? (
              <ConversationPane
                selectedRoom={selectedRoom}
                selectedMessages={selectedMessages}
                currentUserId={user?.userId || ''}
                otherMember={otherMember}
                messagesLoading={messagesQuery.isLoading}
                scrollRef={scrollRef}
                messageInput={messageInput}
                onMessageInputChange={setMessageInput}
                queuedAttachments={[]}
                onAttachmentSelect={() => {}}
                onRemoveAttachment={() => {}}
                onSendMessage={handleSendMessage}
                fileInputRef={fileInputRef}
                onOpenFilePicker={() => {}}
                isSending={isSending}
                composerError={composerError || (messagesQuery.isError ? t('admin.support.loadError') : null)}
                onShowDetails={() => setIsDetailsOpen(true)}
                onBackToList={() => setSelectedRoomId(null)}
                showBackButton
                heightClassName="h-full"
                noMessagesTitle={t('admin.support.noMessagesTitle')}
                noMessagesDescription={t('admin.support.noMessagesDescription')}
                showDetailsButton
                detailsButtonClassName=""
                detailsButtonLabel={t('admin.support.detailsTitle')}
                profileHref={otherMember?.userId ? `/users/${otherMember.userId}` : undefined}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center bg-white p-6 dark:bg-slate-900">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-slate-950 dark:text-white">{t('admin.support.selectTitle')}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t('admin.support.selectDescription')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      {isDetailsOpen && selectedRoom && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsDetailsOpen(false)}
            aria-label={t('admin.support.closeDetails')}
          />
          <SupportDetailsPanel
            member={otherMember}
            profile={profileQuery.data}
            profileLoading={profileQuery.isLoading}
            images={sharedImages}
            files={sharedFiles}
            onClose={() => setIsDetailsOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

function SupportDetailsPanel({
  member,
  profile,
  profileLoading,
  images,
  files,
  onClose,
}: {
  member?: ChatRoomMemberSummary
  profile?: UserResponse
  profileLoading: boolean
  images: ReturnType<typeof buildSharedImages>
  files: ReturnType<typeof buildSharedFiles>
  onClose: () => void
}) {
  const { t } = useI18n()
  const name = profile?.displayName || profile?.fullName || member?.displayName || member?.fullName || t('admin.support.title')
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')

  return (
    <aside className="relative z-10 flex h-full w-full max-w-[380px] flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-950 dark:text-white">{t('admin.support.detailsTitle')}</h2>
        <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white" aria-label={t('admin.support.closeDetails')}>
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-6">
        <section>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {profile?.avatarUrl || member?.avatarUrl ? <img src={profile?.avatarUrl || member?.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
            </div>
            <div className="min-w-0">
              {member?.userId ? (
                <Link to={`/users/${member.userId}`} className="block truncate text-base font-semibold text-slate-950 hover:text-indigo-700 hover:underline hover:underline-offset-4 dark:text-white dark:hover:text-indigo-300">
                  {name}
                </Link>
              ) : <p className="truncate text-base font-semibold text-slate-950 dark:text-white">{name}</p>}
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{member?.isOnline ? t('admin.support.online') : member?.lastSeenAt ? t('admin.support.lastActive', { value: formatRelativeTime(member.lastSeenAt) }) : t('admin.support.offline')}</p>
            </div>
          </div>
          {profileLoading ? <div className="mt-5 h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" /> : (
            <dl className="mt-5 space-y-3 text-sm">
              <DetailRow label={t('admin.support.email')} value={profile?.email} />
              <DetailRow label={t('admin.support.phone')} value={profile?.phone} />
              <DetailRow label={t('admin.support.role')} value={member?.memberRole?.replace(/_/g, ' ')} />
              {!profile?.email && !profile?.phone && !member?.memberRole && <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin.support.noProfileDetails')}</p>}
            </dl>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{t('admin.support.sharedMedia')}</h3>
          {images.length ? <div className="mt-3 grid grid-cols-3 gap-2">{images.slice(0, 9).map((image) => <a key={image.id} href={image.url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-lg bg-slate-100"><img src={image.url} alt={image.name} className="h-full w-full object-cover transition hover:scale-105" /></a>)}</div> : <EmptyDetails icon={<Image className="h-4 w-4" />} label={t('admin.support.noSharedMedia')} />}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{t('admin.support.sharedFiles')}</h3>
          {files.length ? <div className="mt-3 space-y-1">{files.map((file) => <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"><FileText className="h-4 w-4 shrink-0 text-slate-500" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{file.name}</span><span className="block text-xs text-slate-500">{file.meta} · {formatRelativeTime(file.sentAt)}</span></span></a>)}</div> : <EmptyDetails icon={<FileText className="h-4 w-4" />} label={t('admin.support.noSharedFiles')} />}
        </section>
      </div>
    </aside>
  )
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return <div className="flex items-start justify-between gap-4"><dt className="shrink-0 text-slate-500 dark:text-slate-400">{label}</dt><dd className="break-all text-right font-medium text-slate-800 dark:text-slate-100">{value}</dd></div>
}

function EmptyDetails({ icon, label }: { icon: ReactNode; label: string }) {
  return <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">{icon}{label}</div>
}

function InboxSkeleton() {
  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="flex gap-3 px-4 py-4">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

function InboxNotice({
  icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">{icon}</div>
      <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
      {action && onAction && (
        <button type="button" onClick={onAction} className="mt-4 text-sm font-semibold text-sky-700 hover:text-sky-800 dark:text-sky-400">
          {action}
        </button>
      )}
    </div>
  )
}
