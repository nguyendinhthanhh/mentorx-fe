import { useQuery } from 'react-query'
import { notificationApi } from '@/api/notificationApi'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime } from '@/utils/formatters'
import { Bell, CheckCircle, Info, AlertTriangle, XCircle, Briefcase, MessageSquare, Trash2, Check } from 'lucide-react'
import { NotificationType } from '@/types'

export default function NotificationListPage() {
  const { user } = useAuthStore()

  const { data, isLoading, refetch } = useQuery(['notifications', user?.userId], () =>
    notificationApi.getUserNotifications(user!.userId, { size: 50 })
  )

  const handleMarkRead = async (id: string) => {
    await notificationApi.markAsRead(id)
    refetch()
  }

  const handleDismiss = async (id: string) => {
    await notificationApi.dismiss(id)
    refetch()
  }

  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead(user!.userId)
    refetch()
  }

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
      case NotificationType.PROPOSAL_ACCEPTED:
      case NotificationType.CONTRACT_COMPLETED:
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case NotificationType.ERROR:
      case NotificationType.PROPOSAL_REJECTED:
        return <XCircle className="w-6 h-6 text-red-500" />
      case NotificationType.WARNING:
        return <AlertTriangle className="w-6 h-6 text-amber-500" />
      case NotificationType.JOB_POSTED:
      case NotificationType.PROPOSAL_SUBMITTED:
        return <Briefcase className="w-6 h-6 text-blue-500" />
      case NotificationType.MESSAGE_RECEIVED:
        return <MessageSquare className="w-6 h-6 text-primary-500" />
      default:
        return <Info className="w-6 h-6 text-gray-400" />
    }
  }

  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Stay updated with your activities</p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
        >
          <Check className="w-4 h-4" />
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
        {isLoading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="p-6 animate-pulse flex gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))
        ) : data?.content.length ? (
          data.content.map((notif) => (
            <div
              key={notif.id}
              className={`p-6 flex gap-4 transition-colors hover:bg-gray-50/50 relative group ${
                !notif.isRead ? 'bg-primary-50/20' : ''
              }`}
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                  {getIcon(notif.notificationType)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-sm leading-tight ${!notif.isRead ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap ml-4">
                    {formatDateTime(notif.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-3">{notif.message}</p>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(notif.id)}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Dismiss
                  </button>
                </div>
              </div>
              {!notif.isRead && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
              )}
            </div>
          ))
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-200" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No notifications yet</h3>
            <p className="text-sm text-gray-500 mt-1">We'll notify you when something important happens.</p>
          </div>
        )}
      </div>
    </div>
  )
}
