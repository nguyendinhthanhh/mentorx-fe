import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  Bell,
  ChevronDown,
  Edit3,
  LogOut,
  Megaphone,
  Search,
  Sparkles,
  User,
  Wallet,
  X,
} from 'lucide-react'
import { ChatRoomResponse } from '@/types'
import {
  formatRoomTime,
  getAvatarLabel,
  getRoomDisplayName,
  getRoomPreview,
  InboxFilter,
} from '../chatShared'
import SegmentedButton from '@/components/ui/segmented-button'
import { useAuthStore } from '@/store/authStore'
import { walletApi } from '@/api/walletApi'
import { formatMxc } from '@/utils/formatters'
import { useI18n } from '@/i18n/I18nProvider'
import NotificationDropdown from '@/components/notification/NotificationDropdown'

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
  const { user, logout } = useAuthStore()
  const { language } = useI18n()
  const navigate = useNavigate()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const { data: balance } = useQuery(
    ['userBalance', user?.userId],
    () => walletApi.getUserBalance(user!.userId),
    { enabled: !!user?.userId, staleTime: 30_000 }
  )

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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`flex h-dvh min-w-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 ${
        hiddenOnMobile ? 'hidden lg:flex' : 'flex'
      }`}
    >
      {/* ── Mini Navigation Header ── */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 px-4 py-3 sm:px-5">
        <Link to="/" className="group flex items-center gap-3">
          <img src="/logo.png" alt="MentorX Logo" className="h-8 w-auto object-contain transition-transform group-hover:scale-105" />
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
              Mentor<span className="text-indigo-600 dark:text-indigo-500">X</span>
            </span>
            <span className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-400">Academy</span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {/* Wallet Balance */}
          <Link
            to="/wallet"
            className="hidden min-h-11 items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 px-2 py-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 transition-colors hover:bg-amber-100 dark:bg-amber-900/50 sm:flex"
          >
            <Wallet className="h-3 w-3" />
            {formatMxc(balance?.available || 0, language)}
          </Link>

          {/* Notifications */}
          {user && (
            <NotificationDropdown userId={user.userId} />
          )}

          {/* User Avatar Dropdown */}
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg ring-2 ring-transparent transition-all hover:ring-emerald-200"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover rounded-lg" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-emerald-600 text-[11px] font-bold text-white">
                    {user.fullName.charAt(0)}
                  </div>
                )}
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute left-0 z-40 mt-2 w-56 origin-top-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 shadow-xl">
                    <div className="mb-1 border-b border-slate-100 dark:border-slate-800 px-3 py-2">
                      <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">{user.fullName}</p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:bg-slate-900/50 hover:text-emerald-600 dark:text-emerald-500"
                    >
                      <User className="h-4 w-4" />
                      Hồ sơ
                    </Link>
                    <Link
                      to="/wallet"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:bg-slate-900/50 hover:text-emerald-600 dark:text-emerald-500"
                    >
                      <Wallet className="h-4 w-4" />
                      Ví MXC
                    </Link>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false)
                        handleLogout()
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Inbox Header ── */}
      <div className="px-4 pb-4 pt-5 sm:px-7 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[28px] font-bold tracking-tight text-[#10164a]">Messages</h1>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-[#10164a] transition-colors hover:border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-50 dark:bg-emerald-900/30"
            title="Tin nhắn mới"
          >
            <Edit3 className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-5 flex h-11 items-center gap-3 rounded-xl border border-[#dce2f2] bg-white dark:bg-slate-950 px-4 text-slate-400 transition-colors focus-within:border-emerald-300 focus-within:text-emerald-500">
          <Search className="h-[18px] w-[18px]" />
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Tìm kiếm trò chuyện"
            className="w-full bg-transparent text-[14px] text-[#192052] outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <SegmentedButton
            className="w-full overflow-x-auto scrollbar-hide py-1"
            defaultActive={activeFilter}
            onChange={(id) => onFilterChange(id as InboxFilter)}
            buttons={(Object.keys(FILTER_LABELS) as InboxFilter[]).map((filter) => {
              const active = filter === activeFilter
              return {
                id: filter,
                label: (
                  <div className="flex items-center gap-1.5 px-2">
                    {FILTER_LABELS[filter]}
                    {(filter === 'unread' || filter === 'archived') && (
                      <span
                        className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                          counts[filter] > 0
                            ? 'bg-emerald-600 text-white'
                            : active
                              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                              : 'bg-slate-200 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {counts[filter]}
                      </span>
                    )}
                  </div>
                ),
              }
            })}
          />
        </div>
      </div>

      {/* ── Room List ── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2 sm:px-6">
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
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No conversations match this view.</p>
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
  const otherMember = room.members.find((member) => member.userId !== currentUserId)
  const avatarLabel = getAvatarLabel(otherMember, roomName)

  return (
    <button
      type="button"
      onClick={() => onSelectRoom(room.id)}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
        active
          ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 shadow-sm shadow-emerald-100/70'
          : 'border-transparent bg-white dark:bg-slate-950 hover:border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-900/50'
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
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-500 text-sm font-semibold text-white">
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
            <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-semibold text-white">
              {room.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
