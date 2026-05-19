import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from 'react-query'
import { notificationApi } from '@/api/notificationApi'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime } from '@/utils/formatters'
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Check,
  CheckCircle,
  Inbox,
  Info,
  MessageSquare,
  Search,
  Trash2,
  UserRoundSearch,
  XCircle,
} from 'lucide-react'
import { NotificationResponse, NotificationType } from '@/types'

type FilterKey = 'all' | 'unread' | 'messages' | 'work' | 'system'

const filterLabels: Record<FilterKey, string> = {
  all: 'Tất cả',
  unread: 'Chưa đọc',
  messages: 'Tin nhắn',
  work: 'Công việc',
  system: 'Hệ thống',
}

export default function NotificationListPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const { data, isLoading, refetch } = useQuery(
    ['notifications-page', user?.userId],
    () => notificationApi.getUserNotifications(user!.userId, { size: 50 }),
    { enabled: !!user?.userId }
  )

  const notifications = data?.content || []

  const counts = useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter((item) => !item.isRead).length,
      messages: notifications.filter(isMessageNotification).length,
      work: notifications.filter(isWorkNotification).length,
      system: notifications.filter(isSystemNotification).length,
    }
  }, [notifications])

  const visibleNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === 'all') return true
      if (activeFilter === 'unread') return !item.isRead
      if (activeFilter === 'messages') return isMessageNotification(item)
      if (activeFilter === 'work') return isWorkNotification(item)
      return isSystemNotification(item)
    })
  }, [activeFilter, notifications])

  if (!user) return null

  const refreshNotifications = () => {
    refetch()
    queryClient.invalidateQueries(['unreadCount', user.userId])
    queryClient.invalidateQueries(['notifications-preview', user.userId])
  }

  const handleMarkRead = async (id: string) => {
    await notificationApi.markAsRead(id)
    refreshNotifications()
  }

  const handleDismiss = async (id: string) => {
    await notificationApi.dismiss(id)
    refreshNotifications()
  }

  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead(user.userId)
    refreshNotifications()
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-950 dark:text-white">Thông báo</h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{counts.unread} chưa đọc</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <SummaryTile label="Tổng" value={counts.all} />
            <SummaryTile label="Mới" value={counts.unread} emphasis />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`flex h-10 w-full items-center justify-between rounded-xl px-3 text-sm font-black transition ${
                activeFilter === key
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              <span>{filterLabels[key]}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${activeFilter === key ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-900'}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={counts.unread === 0}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 text-sm font-black text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-white disabled:text-slate-300 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300 dark:disabled:border-slate-800 dark:disabled:bg-slate-950 dark:disabled:text-slate-700"
        >
          <Check className="h-4 w-4" />
          Đánh dấu đã đọc
        </button>
      </aside>

      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-950 dark:text-white">{filterLabels[activeFilter]}</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {visibleNotifications.length} thông báo trong mục này
            </p>
          </div>
          <Link
            to="/mentors"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-black text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Search className="h-4 w-4" />
            Tìm mentor
          </Link>
        </div>

        {isLoading ? (
          <NotificationSkeleton />
        ) : visibleNotifications.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleNotifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onMarkRead={() => handleMarkRead(notification.id)}
                onDismiss={() => handleDismiss(notification.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState filter={activeFilter} hasAnyNotifications={notifications.length > 0} />
        )}
      </section>
    </div>
  )
}

function NotificationRow({
  notification,
  onMarkRead,
  onDismiss,
}: {
  notification: NotificationResponse
  onMarkRead: () => void
  onDismiss: () => void
}) {
  return (
    <article
      className={`group relative flex gap-4 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 ${
        !notification.isRead ? 'bg-indigo-50/35 dark:bg-indigo-950/20' : ''
      }`}
    >
      {!notification.isRead && <div className="absolute bottom-0 left-0 top-0 w-1 bg-indigo-600" />}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800">
        {getIcon(notification.notificationType)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <h3 className={`text-sm leading-5 ${notification.isRead ? 'font-bold text-slate-700 dark:text-slate-300' : 'font-black text-slate-950 dark:text-white'}`}>
            {notification.title}
          </h3>
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {formatDateTime(notification.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{notification.message}</p>

        <div className="mt-3 flex flex-wrap gap-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          {!notification.isRead && (
            <button type="button" onClick={onMarkRead} className="text-xs font-black text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">
              Đánh dấu đã đọc
            </button>
          )}
          <button type="button" onClick={onDismiss} className="inline-flex items-center gap-1 text-xs font-black text-rose-500 hover:text-rose-600">
            <Trash2 className="h-3 w-3" />
            Ẩn
          </button>
        </div>
      </div>
    </article>
  )
}

function SummaryTile({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${emphasis ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' : 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  )
}

function EmptyState({ filter, hasAnyNotifications }: { filter: FilterKey; hasAnyNotifications: boolean }) {
  const title = hasAnyNotifications ? `Không có thông báo trong mục ${filterLabels[filter].toLowerCase()}` : 'Bạn chưa có thông báo'
  const description = hasAnyNotifications
    ? 'Chọn bộ lọc khác hoặc quay lại tất cả thông báo.'
    : 'Khi có tin nhắn, cập nhật công việc, khóa học hoặc hoạt động tài khoản, chúng sẽ xuất hiện ở đây.'

  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 dark:bg-slate-900 dark:text-slate-700">
        {hasAnyNotifications ? <Inbox className="h-8 w-8" /> : <Bell className="h-8 w-8" />}
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      {!hasAnyNotifications && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link to="/mentors" className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white transition hover:bg-indigo-700">
            <UserRoundSearch className="h-4 w-4" />
            Tìm mentor
          </Link>
          <Link to="/profile" className="inline-flex h-10 items-center rounded-xl border border-slate-300 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900">
            Cập nhật hồ sơ
          </Link>
        </div>
      )}
    </div>
  )
}

function NotificationSkeleton() {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-4 p-4">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

function isMessageNotification(notification: NotificationResponse) {
  return [NotificationType.NEW_MESSAGE, NotificationType.MESSAGE_RECEIVED].includes(notification.notificationType)
}

function isWorkNotification(notification: NotificationResponse) {
  return [
    NotificationType.JOB_APPLICATION_RECEIVED,
    NotificationType.JOB_POSTED,
    NotificationType.PROPOSAL_SUBMITTED,
    NotificationType.PROPOSAL_ACCEPTED,
    NotificationType.PROPOSAL_REJECTED,
    NotificationType.CONTRACT_CREATED,
    NotificationType.CONTRACT_COMPLETED,
    NotificationType.MILESTONE_CREATED,
    NotificationType.MILESTONE_COMPLETED,
  ].includes(notification.notificationType)
}

function isSystemNotification(notification: NotificationResponse) {
  return !isMessageNotification(notification) && !isWorkNotification(notification)
}

function getIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.SUCCESS:
    case NotificationType.PROPOSAL_ACCEPTED:
    case NotificationType.CONTRACT_COMPLETED:
      return <CheckCircle className="h-5 w-5 text-emerald-500" />
    case NotificationType.ERROR:
    case NotificationType.PROPOSAL_REJECTED:
      return <XCircle className="h-5 w-5 text-rose-500" />
    case NotificationType.WARNING:
      return <AlertTriangle className="h-5 w-5 text-amber-500" />
    case NotificationType.JOB_APPLICATION_RECEIVED:
    case NotificationType.JOB_POSTED:
    case NotificationType.PROPOSAL_SUBMITTED:
      return <Briefcase className="h-5 w-5 text-blue-500" />
    case NotificationType.NEW_MESSAGE:
    case NotificationType.MESSAGE_RECEIVED:
      return <MessageSquare className="h-5 w-5 text-indigo-500" />
    default:
      return <Info className="h-5 w-5 text-slate-400" />
  }
}
