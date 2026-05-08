import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'

const quickActions = [
  {
    to: '/jobs/create',
    label: 'Post a Job',
    description: 'Find the right mentor',
    icon: Briefcase,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300',
  },
  {
    to: '/mentors',
    label: 'Find Mentors',
    description: 'Browse experts',
    icon: Users,
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300',
  },
  {
    to: '/courses',
    label: 'Browse Courses',
    description: 'Learn new skills',
    icon: ShoppingBag,
    color: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-300',
  },
  {
    to: '/chat',
    label: 'Messages',
    description: 'Chat with mentors',
    icon: MessageSquare,
    color: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300',
  },
]

const stats = [
  { label: 'Active Jobs', value: '3', icon: Briefcase, change: '+2 this month' },
  { label: 'Total Spent', value: '$1,250', icon: DollarSign, change: '+$450 this month' },
  { label: 'Courses Enrolled', value: '5', icon: ShoppingBag, change: '2 in progress' },
  { label: 'Avg Rating', value: '4.8', icon: Star, change: 'From 12 reviews' },
]

const recentActivity = [
  {
    type: 'proposal',
    title: 'New proposal received',
    description: 'John Doe sent a proposal for "React Development"',
    time: '2 hours ago',
    icon: FileText,
  },
  {
    type: 'message',
    title: 'New message',
    description: 'Sarah replied to your message',
    time: '5 hours ago',
    icon: MessageSquare,
  },
  {
    type: 'job',
    title: 'Job posted successfully',
    description: 'Your job "Node.js Backend" is now live',
    time: '1 day ago',
    icon: Briefcase,
  },
]

export default function ProfileDashboardPage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2">
              Welcome back, {user.displayName || user.fullName?.split(' ')[0]}! 👋
            </h1>
            <p className="text-white/80 text-lg">
              Here's what's happening with your account today
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <TrendingUp className="w-16 h-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">
              {stat.value}
            </div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              {stat.label}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:border-primary-300 dark:hover:border-primary-700 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                {action.label}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <Link
            to="/profile/notifications"
            className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {recentActivity.map((activity, index) => (
            <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <activity.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                    {activity.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
