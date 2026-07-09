import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from 'react-query'
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Check,
  CheckCheck,
  CheckCircle,
  ChevronRight,
  Clock3,
  Inbox,
  Info,
  MessageSquare,
  Trash2,
  UserRoundSearch,
  XCircle,
} from 'lucide-react'

import { notificationApi } from '@/api/notificationApi'
import { useAuthStore } from '@/store/authStore'
import { NotificationResponse, NotificationType } from '@/types'
import { cn } from '@/utils/cn'
import { formatDateTime, formatRelativeTime } from '@/utils/formatters'

type FilterKey = 'all' | 'unread' | 'messages' | 'work' | 'system'
type TimeGroupKey = 'today' | 'week' | 'older'

const filterLabels: Record<FilterKey, string> = {
  all: 'Tất cả',
  unread: 'Chưa đọc',
  messages: 'Tin nhắn',
  work: 'Công việc',
  system: 'Hệ thống',
}

const timeGroupLabels: Record<TimeGroupKey, string> = {
  today: 'Mới hơn',
  week: '7 ngày qua',
  older: 'Cũ hơn',
}

export default function NotificationListPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const { data, isLoading, refetch } = useQuery(
    ['notifications-page', user?.userId],
    () => notificationApi.getUserNotifications(user!.userId, { size: 50 }),
    { enabled: !!user?.userId }
  )

  const notifications = data?.content || []

  const counts = useMemo(
    () => ({
      all: notifications.length,
      unread: notifications.filter((item) => !item.isRead).length,
      messages: notifications.filter(isMessageNotification).length,
      work: notifications.filter(isWorkNotification).length,
      system: notifications.filter(isSystemNotification).length,
    }),
    [notifications]
  )

  const visibleNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === 'all') return true
      if (activeFilter === 'unread') return !item.isRead
      if (activeFilter === 'messages') return isMessageNotification(item)
      if (activeFilter === 'work') return isWorkNotification(item)
      return isSystemNotification(item)
    })
  }, [activeFilter, notifications])

  const groupedNotifications = useMemo(() => {
    const groups: Record<TimeGroupKey, NotificationResponse[]> = {
      today: [],
      week: [],
      older: [],
    }

    for (const notification of visibleNotifications) {
      groups[getTimeGroup(notification.createdAt)].push(notification)
    }

    return groups
  }, [visibleNotifications])

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

  const handleOpenNotification = async (notification: NotificationResponse) => {
    if (!notification.isRead) {
      await notificationApi.markAsRead(notification.id)
      refreshNotifications()
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
  }

  return (
    <div className="mx-auto max-w-[1080px] space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,rgba(99,102,241,0.08),rgba(255,255,255,0.94)_42%,rgba(255,255,255,1)_100%)] px-5 py-5 dark:border-slate-800 dark:bg-[linear-gradient(135deg,rgba(99,102,241,0.18),rgba(15,23,42,0.96)_45%,rgba(15,23,42,1)_100%)] sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/30">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Thông báo</h1>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Theo dõi cập nhật mới, hành động cần xử lý và các thay đổi quan trọng của tài khoản.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <TopStat label="Tổng" value={counts.all} tone="neutral" />
                <TopStat label="Chưa đọc" value={counts.unread} tone="primary" />
                <TopStat label="Cần xem ngay" value={notifications.filter((item) => item.requiresAction && !item.actionTaken).length} tone="warning" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={counts.unread === 0}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
            >
              <CheckCheck className="h-4 w-4" />
              Đánh dấu tất cả đã đọc
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 py-4 sm:px-6">
          {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
            <FilterChip
              key={key}
              active={activeFilter === key}
              label={filterLabels[key]}
              count={counts[key]}
              onClick={() => setActiveFilter(key)}
            />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
        {isLoading ? (
          <NotificationSkeleton />
        ) : visibleNotifications.length > 0 ? (
          <div className="space-y-1 px-3 py-3 sm:px-4 sm:py-4">
            {(Object.keys(timeGroupLabels) as TimeGroupKey[]).map((groupKey) => {
              const items = groupedNotifications[groupKey]
              if (items.length === 0) return null

              return (
                <section key={groupKey} className="space-y-2.5">
                  <div className="flex items-center justify-between px-2 pt-2">
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        {timeGroupLabels[groupKey]}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {items.length} thông báo trong mục này
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {items.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onOpen={() => handleOpenNotification(notification)}
                        onMarkRead={() => handleMarkRead(notification.id)}
                        onDismiss={() => handleDismiss(notification.id)}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <EmptyState filter={activeFilter} hasAnyNotifications={notifications.length > 0} />
        )}
      </section>
    </div>
  )
}

function NotificationCard({
  notification,
  onOpen,
  onMarkRead,
  onDismiss,
}: {
  notification: NotificationResponse
  onOpen: () => void
  onMarkRead: () => void
  onDismiss: () => void
}) {
  const tone = getNotificationTone(notification)
  const interactive = Boolean(notification.actionUrl)

  return (
    <article
      className={cn(
        'group rounded-[1.6rem] border px-4 py-4 transition-all duration-200 sm:px-5',
        interactive && 'cursor-pointer',
        tone.surface,
        !notification.isRead && 'shadow-[0_16px_40px_rgba(99,102,241,0.08)]'
      )}
      onClick={interactive ? onOpen : undefined}
    >
      <div className="flex gap-4">
        <NotificationVisual notification={notification} toneClassName={tone.iconWrap} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <NotificationBadge label={getNotificationCategoryLabel(notification)} className={tone.badge} />
                {notification.requiresAction && !notification.actionTaken ? (
                  <NotificationBadge label="Cần xử lý" className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" />
                ) : null}
                {notification.isExpired ? (
                  <NotificationBadge label="Đã hết hạn" className="bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300" />
                ) : null}
              </div>

              <div className="mt-2 flex items-start gap-2">
                <h3
                  className={cn(
                    'text-[15px] leading-6 text-slate-900 dark:text-white',
                    notification.isRead ? 'font-bold' : 'font-black'
                  )}
                >
                  {notification.title}
                </h3>
                {!notification.isRead ? (
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-600 shadow-[0_0_0_5px_rgba(99,102,241,0.12)]" />
                ) : null}
              </div>

              <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{notification.message}</p>
            </div>

            <div className="shrink-0 space-y-1 text-left sm:text-right">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                <Clock3 className="h-3.5 w-3.5" />
                {formatRelativeTime(notification.createdAt)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(notification.createdAt)}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {interactive ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onOpen()
                }}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Xem chi tiết
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : null}

            {!notification.isRead ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onMarkRead()
                }}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                <Check className="h-4 w-4" />
                Đánh dấu đã đọc
              </button>
            ) : null}

            {notification.isDismissible ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onDismiss()
                }}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-transparent px-3.5 text-sm font-bold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/20 dark:hover:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
                Ẩn
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

function NotificationVisual({
  notification,
  toneClassName,
}: {
  notification: NotificationResponse
  toneClassName: string
}) {
  if (notification.iconUrl) {
    return (
      <div className="relative">
        <img
          src={notification.iconUrl}
          alt={notification.title}
          className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-white/70 dark:ring-slate-900/40',
        toneClassName
      )}
    >
      {getIcon(notification.notificationType)}
    </div>
  )
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-all',
        active
          ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/25'
          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          'rounded-full px-2 py-1 text-[11px] leading-none',
          active ? 'bg-white/18 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
        )}
      >
        {count}
      </span>
    </button>
  )
}

function TopStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'neutral' | 'primary' | 'warning'
}) {
  const toneClasses =
    tone === 'primary'
      ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'
        : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'

  return (
    <div className={cn('min-w-[120px] rounded-2xl border px-4 py-3', toneClasses)}>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-75">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  )
}

function NotificationBadge({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em]', className)}>
      {label}
    </span>
  )
}

function EmptyState({
  filter,
  hasAnyNotifications,
}: {
  filter: FilterKey
  hasAnyNotifications: boolean
}) {
  const title = hasAnyNotifications
    ? `Không có thông báo trong mục ${filterLabels[filter].toLowerCase()}`
    : 'Bạn đã bắt kịp mọi thứ'
  const description = hasAnyNotifications
    ? 'Hãy chuyển sang bộ lọc khác để xem thêm hoạt động gần đây.'
    : 'Khi có cập nhật mới về tin nhắn, công việc, khóa học hoặc hệ thống, chúng sẽ xuất hiện ở đây theo dạng feed để bạn đọc nhanh hơn.'

  return (
    <div className="px-6 py-16 text-center sm:px-10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-slate-100 text-slate-300 dark:bg-slate-900 dark:text-slate-700">
        {hasAnyNotifications ? <Inbox className="h-9 w-9" /> : <Bell className="h-9 w-9" />}
      </div>
      <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">{description}</p>

      {!hasAnyNotifications ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/mentors"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            <UserRoundSearch className="h-4 w-4" />
            Tìm mentor
          </Link>
          <Link
            to="/profile"
            className="inline-flex h-11 items-center rounded-full border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Cập nhật hồ sơ
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function NotificationSkeleton() {
  return (
    <div className="space-y-3 px-4 py-4 sm:px-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex gap-4 rounded-[1.6rem] border border-slate-200/80 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="h-14 w-14 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

function getTimeGroup(date: string): TimeGroupKey {
  const createdAt = new Date(date).getTime()
  const diff = Date.now() - createdAt
  const oneDay = 24 * 60 * 60 * 1000
  const oneWeek = 7 * oneDay

  if (diff <= oneDay) return 'today'
  if (diff <= oneWeek) return 'week'
  return 'older'
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

function getNotificationCategoryLabel(notification: NotificationResponse) {
  if (isMessageNotification(notification)) return 'Tin nhắn'
  if (isWorkNotification(notification)) return 'Công việc'
  if (notification.notificationType === NotificationType.WARNING) return 'Cảnh báo'
  if (notification.notificationType === NotificationType.ERROR) return 'Sự cố'
  if (notification.notificationType === NotificationType.SUCCESS) return 'Hoàn tất'
  return 'Hệ thống'
}

function getNotificationTone(notification: NotificationResponse) {
  if (notification.notificationType === NotificationType.WARNING) {
    return {
      surface:
        'border-amber-200/80 bg-amber-50/70 hover:border-amber-300 hover:bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/15 dark:hover:border-amber-800/50 dark:hover:bg-amber-950/25',
      iconWrap: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    }
  }

  if (
    notification.notificationType === NotificationType.ERROR ||
    notification.notificationType === NotificationType.PROPOSAL_REJECTED
  ) {
    return {
      surface:
        'border-rose-200/80 bg-rose-50/60 hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/15 dark:hover:border-rose-800/50 dark:hover:bg-rose-950/25',
      iconWrap: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
    }
  }

  if (isMessageNotification(notification)) {
    return {
      surface:
        'border-indigo-200/80 bg-indigo-50/55 hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-950/15 dark:hover:border-indigo-800/50 dark:hover:bg-indigo-950/25',
      iconWrap: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
      badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
    }
  }

  if (isWorkNotification(notification)) {
    return {
      surface:
        'border-sky-200/80 bg-sky-50/55 hover:border-sky-300 hover:bg-sky-50 dark:border-sky-900/40 dark:bg-sky-950/15 dark:hover:border-sky-800/50 dark:hover:bg-sky-950/25',
      iconWrap: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
      badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
    }
  }

  if (
    notification.notificationType === NotificationType.SUCCESS ||
    notification.notificationType === NotificationType.PROPOSAL_ACCEPTED ||
    notification.notificationType === NotificationType.CONTRACT_COMPLETED
  ) {
    return {
      surface:
        'border-emerald-200/80 bg-emerald-50/55 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/15 dark:hover:border-emerald-800/50 dark:hover:bg-emerald-950/25',
      iconWrap: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    }
  }

  return {
    surface:
      'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900',
    iconWrap: 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
  }
}

function getIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.SUCCESS:
    case NotificationType.PROPOSAL_ACCEPTED:
    case NotificationType.CONTRACT_COMPLETED:
      return <CheckCircle className="h-5 w-5" />
    case NotificationType.ERROR:
    case NotificationType.PROPOSAL_REJECTED:
      return <XCircle className="h-5 w-5" />
    case NotificationType.WARNING:
      return <AlertTriangle className="h-5 w-5" />
    case NotificationType.JOB_APPLICATION_RECEIVED:
    case NotificationType.JOB_POSTED:
    case NotificationType.PROPOSAL_SUBMITTED:
      return <Briefcase className="h-5 w-5" />
    case NotificationType.NEW_MESSAGE:
    case NotificationType.MESSAGE_RECEIVED:
      return <MessageSquare className="h-5 w-5" />
    default:
      return <Info className="h-5 w-5" />
  }
}
