import { Edit3, Megaphone, Search, X } from 'lucide-react'
import { ChatRoomResponse } from '@/types'
import {
  formatRoomTime,
  getAvatarLabel,
  getRoomDisplayName,
  getRoomPreview,
  InboxFilter,
} from '../chatShared'

type InboxSidebarProps = {
  rooms: ChatRoomResponse[]
  currentUserId: string
  selectedRoomId: string | null
  searchTerm: string
  onSearchTermChange: (value: string) => void
  activeFilter: InboxFilter
  onFilterChange: (value: InboxFilter) => void
  onSelectRoom: (roomId: string) => void
  isLoading: boolean
  hiddenOnMobile?: boolean
}

const FILTER_LABELS: Record<InboxFilter, string> = {
  all: 'All',
  unread: 'Unread',
  mentors: 'Mentors',
  groups: 'Groups',
  archived: 'Archived',
}

export default function InboxSidebar({
  rooms,
  currentUserId,
  selectedRoomId,
  searchTerm,
  onSearchTermChange,
  activeFilter,
  onFilterChange,
  onSelectRoom,
  isLoading,
  hiddenOnMobile,
}: InboxSidebarProps) {
  const counts = {
    all: rooms.length,
    unread: rooms.filter((room) => room.unreadCount > 0 && !room.isArchived).length,
    mentors: rooms.filter((room) => room.memberCount === 2 && room.roomType === 'DIRECT_MESSAGE').length,
    groups: rooms.filter((room) => room.memberCount > 2 || room.roomType !== 'DIRECT_MESSAGE').length,
    archived: rooms.filter((room) => room.isArchived).length,
  }
  const pinnedRooms = rooms.filter((room) => room.unreadCount > 0 || room.id === selectedRoomId).slice(0, 2)
  const recentRooms = rooms.filter((room) => !pinnedRooms.some((pinned) => pinned.id === room.id))
  const displayedSections = [
    { title: 'Pinned', rooms: pinnedRooms },
    { title: 'Recent', rooms: recentRooms },
  ].filter((section) => section.rooms.length > 0)

  return (
    <aside
      className={`flex h-[calc(100vh-73px)] flex-col border-r border-slate-200 bg-white ${
        hiddenOnMobile ? 'hidden lg:flex' : 'flex'
      }`}
    >
      <div className="px-7 pb-4 pt-7">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[28px] font-bold tracking-tight text-[#10164a]">Messages</h1>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-[#10164a] transition-colors hover:border-indigo-100 hover:bg-indigo-50"
            title="New message"
          >
            <Edit3 className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-6 flex h-11 items-center gap-3 rounded-xl border border-[#dce2f2] bg-white px-4 text-slate-400 transition-colors focus-within:border-indigo-300 focus-within:text-indigo-500">
          <Search className="h-[18px] w-[18px]" />
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search conversations"
            className="w-full bg-transparent text-[14px] text-[#192052] outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(FILTER_LABELS) as InboxFilter[]).map((filter) => {
            const active = filter === activeFilter

            return (
              <button
                key={filter}
                type="button"
                onClick={() => onFilterChange(filter)}
                className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-colors ${
                  active
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-[#f6f7ff] text-[#52608b] hover:border-indigo-200 hover:text-indigo-700'
                }`}
              >
                {FILTER_LABELS[filter]}
                {(filter === 'unread' || filter === 'archived') && (
                  <span
                    className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs ${
                      counts[filter] > 0
                        ? 'bg-indigo-600 text-white'
                        : active
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-white text-slate-400'
                    }`}
                  >
                    {counts[filter]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-2">
        {isLoading ? (
          <div className="space-y-3 px-2 pt-2">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl px-3 py-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-slate-100" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-3 w-44 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-slate-500">No conversations match this view.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {displayedSections.map((section) => (
              <div key={section.title}>
                <h2 className="mb-2 px-2 text-[13px] font-bold text-[#10164a]">{section.title}</h2>
                <div className="space-y-1.5">
                  {section.rooms.map((room) => (
                    <RoomListItem
                      key={room.id}
                      room={room}
                      currentUserId={currentUserId}
                      selectedRoomId={selectedRoomId}
                      onSelectRoom={onSelectRoom}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-auto hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 xl:block">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-[#10164a]">Bring a friend to Mentor X</p>
                    <button type="button" className="text-indigo-400 hover:text-indigo-700" title="Dismiss invite">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#66729d]">Invite your network and keep project context together.</p>
                  <button
                    type="button"
                    className="mt-3 h-9 w-full rounded-xl border border-indigo-200 bg-white text-xs font-semibold text-indigo-700"
                  >
                    Invite now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

function RoomListItem({
  room,
  currentUserId,
  selectedRoomId,
  onSelectRoom,
}: {
  room: ChatRoomResponse
  currentUserId: string
  selectedRoomId: string | null
  onSelectRoom: (roomId: string) => void
}) {
  const active = room.id === selectedRoomId
  const roomName = getRoomDisplayName(room, currentUserId)
  const otherMember = room.members.find((member) => member.userId !== currentUserId) || room.members[0]
  const avatarLabel = getAvatarLabel(otherMember, roomName)

  return (
    <button
      type="button"
      onClick={() => onSelectRoom(room.id)}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
        active
          ? 'border-indigo-200 bg-indigo-50 shadow-sm shadow-indigo-100/70'
          : 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50'
      }`}
    >
      <div className="relative shrink-0">
        {otherMember?.avatarUrl || room.avatarUrl ? (
          <img
            src={otherMember?.avatarUrl || room.avatarUrl}
            alt={roomName}
            className="h-[52px] w-[52px] rounded-full object-cover"
          />
        ) : (
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white">
            {avatarLabel}
          </div>
        )}
        {room.members.some((member) => member.userId !== currentUserId && member.isOnline) && (
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-[14px] font-bold text-[#10164a]">{roomName}</p>
          <span className="shrink-0 text-[12px] text-[#52608b]">{formatRoomTime(room.lastMessageAt || room.updatedAt)}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-[13px] text-[#66729d]">{getRoomPreview(room)}</p>
          {room.unreadCount > 0 && (
            <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-semibold text-white">
              {room.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
