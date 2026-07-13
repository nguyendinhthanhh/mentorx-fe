import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from 'react-query'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Briefcase,
  CheckCircle,
  Info,
  MessageSquare,
  XCircle,
} from 'lucide-react'

import { notificationApi } from '@/api/notificationApi'
import { NotificationType } from '@/types'
import { formatRelativeTime } from '@/utils/formatters'

interface Props {
  userId: string
  allHref?: string
}

export default function NotificationDropdown({ userId, allHref = '/profile/notifications' }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const notificationsQuery = useQuery(
    ['notifications-preview', userId],
    () => notificationApi.getUserNotifications(userId, { unreadOnly: false, size: 5 }),
    {
      enabled: Boolean(userId),
      retry: false,
    }
  )

  const unreadQuery = useQuery(['unreadCount', userId], () => notificationApi.getUnreadCount(userId), {
    enabled: Boolean(userId),
    retry: false,
  })

  const unreadCount = unreadQuery.data || 0
  const notifications = notificationsQuery.data?.content || []
  const hasLoadError = notificationsQuery.isError || unreadQuery.isError

  const refreshNotifications = () => {
    void notificationsQuery.refetch()
    void queryClient.invalidateQueries(['unreadCount', userId])
    void queryClient.invalidateQueries(['notifications-page', userId])
  }

  const handleMarkRead = async (id: string) => {
    await notificationApi.markAsRead(id)
    refreshNotifications()
  }

  const handleMarkAllRead = async () => {
    if (!unreadCount) return
    await notificationApi.markAllAsRead(userId)
    refreshNotifications()
  }

  const handleOpenNotification = async (notificationId: string, actionUrl?: string) => {
    await handleMarkRead(notificationId)
    setIsOpen(false)
    if (actionUrl) navigate(actionUrl)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">Notifications</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'No unread notifications'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={!unreadCount}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent dark:text-indigo-300 dark:hover:bg-indigo-950/30 dark:disabled:text-slate-700"
              >
                Mark all read
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {hasLoadError ? (
                <NotificationLoadError onRetry={refreshNotifications} />
              ) : notificationsQuery.isLoading ? (
                <NotificationSkeleton />
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:border-slate-800 dark:hover:bg-slate-900 ${
                      !notification.isRead ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                    }`}
                    onClick={() => handleOpenNotification(notification.id, notification.actionUrl)}
                  >
                    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800">
                      {getIcon(notification.notificationType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm leading-tight ${
                          !notification.isRead
                            ? 'font-black text-slate-950 dark:text-white'
                            : 'font-semibold text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead ? <span className="mt-2 h-2 w-2 rounded-full bg-indigo-600" /> : null}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No notifications yet</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Important account and workflow updates will appear here.
                  </p>
                </div>
              )}
            </div>

            <Link
              to={allHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50 py-3 text-xs font-black text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              View all notifications
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </>
      ) : null}
    </div>
  )
}

function NotificationLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-8 text-center">
      <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-400" />
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Could not load notifications</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
      >
        Retry
      </button>
    </div>
  )
}

function NotificationSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-busy="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />
      ))}
    </div>
  )
}

function getIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.SUCCESS:
    case NotificationType.PROPOSAL_ACCEPTED:
    case NotificationType.CONTRACT_COMPLETED:
      return <CheckCircle className="h-4 w-4 text-emerald-500" />
    case NotificationType.ERROR:
    case NotificationType.PROPOSAL_REJECTED:
      return <XCircle className="h-4 w-4 text-rose-500" />
    case NotificationType.WARNING:
      return <AlertTriangle className="h-4 w-4 text-amber-500" />
    case NotificationType.JOB_POSTED:
    case NotificationType.PROPOSAL_SUBMITTED:
      return <Briefcase className="h-4 w-4 text-blue-500" />
    case NotificationType.NEW_MESSAGE:
    case NotificationType.MESSAGE_RECEIVED:
      return <MessageSquare className="h-4 w-4 text-indigo-500" />
    default:
      return <Info className="h-4 w-4 text-slate-500" />
  }
}
