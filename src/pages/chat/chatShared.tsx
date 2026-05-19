import { Fragment } from 'react'
import { FileImage, FileText, Link as LinkIcon } from 'lucide-react'
import { ChatRoomMemberSummary, ChatRoomResponse, MessageResponse } from '@/types'
import { formatRelativeTime } from '@/utils/formatters'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')
const URL_REGEX = /https?:\/\/[^\s<]+/gi

export const MAX_ATTACHMENTS = 5
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024
export const ATTACHMENT_ACCEPT =
  'image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.rar,.fig,.sketch'

export type InboxFilter = 'all' | 'unread' | 'mentors' | 'groups' | 'archived'

export type QueuedAttachment = {
  id: string
  file: File
  previewUrl?: string
}

export type SharedImage = {
  id: string
  url: string
  name: string
  sentAt: string
}

export type SharedFile = {
  id: string
  url: string
  name: string
  sentAt: string
  meta: string
}

export type SharedLink = {
  id: string
  url: string
  sentAt: string
  host: string
  label: string
}

export function EmptySharedState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-400">
      {label}
    </div>
  )
}

export function MessageText({ content, mine }: { content?: string; mine: boolean }) {
  if (!content) return null

  return (
    <p className={`whitespace-pre-wrap break-words text-[14px] leading-6 ${mine ? 'text-white' : 'text-slate-700'}`}>
      {splitContentByUrls(content).map((part, index) => {
        if (part.type === 'text') {
          return <Fragment key={`${part.value}-${index}`}>{part.value}</Fragment>
        }

        return (
          <a
            key={`${part.value}-${index}`}
            href={part.value}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex max-w-full break-all font-semibold underline underline-offset-4 ${
              mine ? 'text-white/95' : 'text-indigo-600'
            }`}
          >
            {shortenUrl(part.value)}
          </a>
        )
      })}
    </p>
  )
}

export function MessageAttachment({ message, mine }: { message: MessageResponse; mine: boolean }) {
  if (!message.attachmentUrl) return null

  if (isImageMessage(message)) {
    return (
      <a
        href={resolveAttachmentUrl(message.attachmentUrl)}
        target="_blank"
        rel="noreferrer"
        className="mt-2 block overflow-hidden rounded-2xl"
      >
        <img
          src={resolveAttachmentUrl(message.attachmentUrl)}
          alt={message.attachmentFilename || 'Shared image'}
          className="max-h-72 w-full rounded-2xl object-cover"
        />
      </a>
    )
  }

  return (
    <a
      href={resolveAttachmentUrl(message.attachmentUrl)}
      target="_blank"
      rel="noreferrer"
      className={`mt-2 flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors ${
        mine
          ? 'border-white/20 bg-white/10 text-white hover:bg-white/15'
          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          mine ? 'bg-white/15' : 'bg-white'
        }`}
      >
        {message.attachmentMimeType?.startsWith('image/') ? (
          <FileImage className="h-5 w-5" />
        ) : (
          <FileText className="h-5 w-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {message.attachmentFilename || 'Attachment'}
        </span>
        <span className={`mt-1 flex items-center gap-1 text-xs ${mine ? 'text-white/75' : 'text-slate-400'}`}>
          <LinkIcon className="h-3.5 w-3.5" />
          {formatAttachmentMeta(message)}
        </span>
      </span>
    </a>
  )
}

export function getPrimaryOtherMember(room: ChatRoomResponse, currentUserId?: string | null) {
  return room.members.find((member) => member.userId !== currentUserId) || room.members[0]
}

export function getRoomDisplayName(room: ChatRoomResponse, currentUserId?: string | null) {
  if (room.roomName && room.roomType !== 'DIRECT_MESSAGE') return room.roomName
  const otherMember = getPrimaryOtherMember(room, currentUserId)
  return otherMember?.displayName || otherMember?.fullName || room.roomName || 'Conversation'
}

export function getRoomPreview(room: ChatRoomResponse) {
  return room.lastMessagePreview || room.description || 'No messages yet'
}

export function getAvatarLabel(member: ChatRoomMemberSummary | undefined, fallback: string) {
  const label = member?.displayName || member?.fullName || fallback
  return label
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function getPresenceLabel(member?: ChatRoomMemberSummary) {
  if (!member) return 'Conversation'
  if (member.isOnline) return 'Online'
  if (member.lastSeenAt) return `Seen ${formatRelativeTime(member.lastSeenAt)}`
  return member.memberRole?.replace(/_/g, ' ').toLowerCase() || 'Conversation'
}

export function formatRoomType(roomType: string) {
  return roomType
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export function formatRoomTime(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export function formatMessageDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function shouldShowDateSeparator(previousMessage: MessageResponse | undefined, currentMessage: MessageResponse) {
  if (!previousMessage) return true
  return formatMessageDate(previousMessage.sentAt) !== formatMessageDate(currentMessage.sentAt)
}

export function formatFileSize(size?: number) {
  if (!size) return '0 KB'
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(size / 1024))} KB`
}

export function formatAttachmentMeta(message: MessageResponse) {
  const parts: string[] = []
  if (message.attachmentMimeType) parts.push(message.attachmentMimeType.split('/').pop()?.toUpperCase() || 'FILE')
  if (message.attachmentSize) parts.push(formatFileSize(message.attachmentSize))
  return parts.join(' - ') || 'File'
}

export function resolveAttachmentUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

export function isImageMessage(message: MessageResponse) {
  return message.messageType === 'IMAGE' || !!message.attachmentMimeType?.startsWith('image/')
}

export function extractUrls(content?: string) {
  return content?.match(URL_REGEX) || []
}

export function splitContentByUrls(content: string) {
  const matches = [...content.matchAll(URL_REGEX)]
  if (matches.length === 0) {
    return [{ type: 'text' as const, value: content }]
  }

  const parts: Array<{ type: 'text' | 'url'; value: string }> = []
  let cursor = 0

  matches.forEach((match) => {
    const index = match.index || 0
    if (index > cursor) {
      parts.push({ type: 'text', value: content.slice(cursor, index) })
    }

    parts.push({ type: 'url', value: match[0] })
    cursor = index + match[0].length
  })

  if (cursor < content.length) {
    parts.push({ type: 'text', value: content.slice(cursor) })
  }

  return parts
}

export function buildSharedImages(messages: MessageResponse[]): SharedImage[] {
  return messages
    .filter((message) => message.attachmentUrl && isImageMessage(message))
    .map((message) => ({
      id: message.id,
      url: resolveAttachmentUrl(message.attachmentUrl!),
      name: message.attachmentFilename || 'Image',
      sentAt: message.sentAt,
    }))
}

export function buildSharedFiles(messages: MessageResponse[]): SharedFile[] {
  return messages
    .filter((message) => message.attachmentUrl && !isImageMessage(message))
    .map((message) => ({
      id: message.id,
      url: resolveAttachmentUrl(message.attachmentUrl!),
      name: message.attachmentFilename || 'Attachment',
      sentAt: message.sentAt,
      meta: formatAttachmentMeta(message),
    }))
}

export function buildSharedLinks(messages: MessageResponse[]): SharedLink[] {
  return messages.flatMap((message) =>
    extractUrls(message.content).map((url, index) => ({
      id: `${message.id}-${index}`,
      url,
      sentAt: message.sentAt,
      host: getUrlHost(url),
      label: shortenUrl(url),
    }))
  )
}

export function getUrlHost(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return 'Link'
  }
}

export function shortenUrl(url: string) {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.length > 26 ? `${parsed.pathname.slice(0, 26)}...` : parsed.pathname
    return `${parsed.host}${path === '/' ? '' : path}`
  } catch {
    return url
  }
}

export function buildContextBanner(room: ChatRoomResponse | null) {
  if (!room) return null

  const tags: string[] = []
  if (room.roomType !== 'DIRECT_MESSAGE') {
    tags.push(formatRoomType(room.roomType))
  }
  if (room.referenceType) {
    tags.push(room.referenceType.replace(/_/g, ' '))
  }

  if (!room.description && tags.length === 0) return null

  return {
    title: room.description || tags.join(' - '),
    detail:
      room.description && tags.length > 0
        ? tags.join(' - ')
        : `${room.memberCount} participant${room.memberCount === 1 ? '' : 's'}`,
  }
}

export function summarizeWeeklyAvailability(weeklyAvailability: any) {
  if (!weeklyAvailability?.weeklySchedule) return []

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date()
  const entries: string[] = []

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() + offset)
    const weekday = date.getDay() === 0 ? 7 : date.getDay()
    const slots = weeklyAvailability.weeklySchedule?.[weekday] || []

    if (!slots.length) continue

    const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : dayNames[date.getDay()]
    const slotText = slots
      .slice(0, 2)
      .map((slot: { startTime: string; endTime: string }) => `${slot.startTime.slice(0, 5)}-${slot.endTime.slice(0, 5)}`)
      .join(', ')

    entries.push(`${label}: ${slotText}`)

    if (entries.length === 3) break
  }

  return entries
}
