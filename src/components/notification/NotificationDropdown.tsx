import { useQuery, useQueryClient } from 'react-query'
import { notificationApi } from '@/api/notificationApi'
import { formatRelativeTime } from '@/utils/formatters'
import { Bell, CheckCircle, Info, AlertTriangle, XCircle, Briefcase, MessageSquare, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { NotificationType } from '@/types'

interface Props {
  userId: string
}

export default function NotificationDropdown({ userId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data, refetch } = useQuery(['notifications-preview', userId], () =>
    notificationApi.getUserNotifications(userId, { unreadOnly: false, size: 5 })
  )

  const { data: unreadCount } = useQuery(['unreadCount', userId], () =>
    notificationApi.getUnreadCount(userId)
  )

  const handleMarkRead = async (id: string) => {
    await notificationApi.markAsRead(id)
    refreshNotifications()
  }

  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead(userId)
    refreshNotifications()
  }

  const refreshNotifications = () => {
    refetch()
    queryClient.invalidateQueries(['unreadCount', userId])
    queryClient.invalidateQueries(['notifications-page', userId])
  }

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
      case NotificationType.PROPOSAL_ACCEPTED:
      case NotificationType.CONTRACT_COMPLETED:
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case NotificationType.ERROR:
      case NotificationType.PROPOSAL_REJECTED:
        return <XCircle className="w-4 h-4 text-red-500" />
      case NotificationType.WARNING:
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case NotificationType.JOB_POSTED:
      case NotificationType.PROPOSAL_SUBMITTED:
        return <Briefcase className="w-4 h-4 text-blue-500" />
      case NotificationType.NEW_MESSAGE:
      case NotificationType.MESSAGE_RECEIVED:
        return <MessageSquare className="w-4 h-4 text-primary-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 animate-in fade-in zoom-in duration-200 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">Thông báo</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {unreadCount ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={!unreadCount}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent dark:text-indigo-300 dark:hover:bg-indigo-950/30 dark:disabled:text-slate-700"
              >
                Đọc hết
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {data?.content.length ? (
                data.content.map((notif) => (
                  <button
                    type="button"
                    key={notif.id}
                    className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 ${
                      !notif.isRead ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                    }`}
                    onClick={() => handleMarkRead(notif.id)}
                  >
                    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800">
                      {getIcon(notif.notificationType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${!notif.isRead ? 'font-black text-slate-950 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                        {notif.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{notif.message}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{formatRelativeTime(notif.createdAt)}</p>
                    </div>
                    {!notif.isRead && <span className="mt-2 h-2 w-2 rounded-full bg-indigo-600" />}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Chưa có thông báo</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Các cập nhật quan trọng sẽ xuất hiện ở đây.</p>
                </div>
              )}
            </div>

            <Link
              to="/profile/notifications"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50 py-3 text-xs font-black text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Xem tất cả thông báo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
