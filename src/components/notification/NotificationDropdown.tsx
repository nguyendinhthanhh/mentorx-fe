import { useQuery } from 'react-query'
import { notificationApi } from '@/api/notificationApi'
import { formatRelativeTime } from '@/utils/formatters'
import { Bell, CheckCircle, Info, AlertTriangle, XCircle, Briefcase, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { NotificationType } from '@/types'

interface Props {
  userId: string
}

export default function NotificationDropdown({ userId }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const { data, refetch } = useQuery(['notifications', userId], () =>
    notificationApi.getUserNotifications(userId, { unreadOnly: false, size: 5 })
  )

  const { data: unreadCount } = useQuery(['unreadCount', userId], () =>
    notificationApi.getUnreadCount(userId)
  )

  const handleMarkRead = async (id: string) => {
    await notificationApi.markAsRead(id)
    refetch()
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
      case NotificationType.MESSAGE_RECEIVED:
        return <MessageSquare className="w-4 h-4 text-primary-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount ? (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <button 
                onClick={() => notificationApi.markAllAsRead(userId).then(() => refetch())}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all as read
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {data?.content.length ? (
                data.content.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0 ${
                      !notif.isRead ? 'bg-primary-50/30' : ''
                    }`}
                    onClick={() => handleMarkRead(notif.id)}
                  >
                    <div className="mt-1 flex-shrink-0">{getIcon(notif.notificationType)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
              )}
            </div>

            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="block py-2.5 text-center text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              See all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
