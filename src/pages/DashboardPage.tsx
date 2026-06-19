import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'
import { Briefcase, BookOpen, Users, Wallet, TrendingUp, ArrowUpRight, Bell, Clock, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import apiClient from '@/api/client'
import { formatMxc } from '@/utils/formatters'
import { useDashboard } from '@/hooks/useAnalytics'

interface DashboardStats {
  activeJobs: number
  enrolledCourses: number
  walletBalance: number
  unreadNotifications: number
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    enrolledCourses: 0,
    walletBalance: 0,
    unreadNotifications: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const results = await Promise.allSettled([
          apiClient.get(`/jobs/client/${user?.userId}`, { params: { page: 0, size: 1 } }),
          apiClient.get(`/v1/wallet/user/${user?.userId}/balance`),
          apiClient.get('/notifications/unread-count', { params: { userId: user?.userId } }),
        ])

        const jobsResult = results[0]
        const walletResult = results[1]
        const notifResult = results[2]

        setStats({
          activeJobs: jobsResult.status === 'fulfilled' ? jobsResult.value.data?.data?.totalElements ?? 0 : 0,
          enrolledCourses: 0,
          walletBalance: walletResult.status === 'fulfilled' ? walletResult.value.data?.data?.total ?? 0 : 0,
          unreadNotifications: notifResult.status === 'fulfilled' ? notifResult.value.data?.data?.unreadCount ?? 0 : 0,
        })
      } catch {
      } finally {
        setLoading(false)
      }
    }

    if (user?.userId) {
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [user?.userId])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const statCards = [
    {
      label: 'Active Jobs',
      value: stats.activeJobs,
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      link: '/jobs',
    },
    {
      label: 'Enrolled Courses',
      value: stats.enrolledCourses,
      icon: BookOpen,
      color: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      link: '/courses',
    },
    {
      label: 'Wallet Balance',
      value: formatMxc(stats.walletBalance),
      icon: Wallet,
      color: 'from-violet-500 to-violet-600',
      bgLight: 'bg-violet-50 dark:bg-violet-900/20',
      textColor: 'text-violet-600 dark:text-violet-400',
      link: '/wallet',
      isString: true,
    },
    {
      label: 'Notifications',
      value: stats.unreadNotifications,
      icon: Bell,
      color: 'from-amber-500 to-amber-600',
      bgLight: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-600 dark:text-amber-400',
      link: '/dashboard',
    },
  ]

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {getGreeting()}, {user?.displayName || user?.fullName?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium flex items-center gap-1.5 italic">
            <Clock className="w-4 h-4" />
            Here's what's happening with your account today
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/jobs/create"
            className="inline-flex items-center gap-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-slate-200 dark:shadow-none hover:bg-primary-600 dark:hover:bg-primary-400 transition-all"
          >
            <Plus className="w-4 h-4" />
            Post a Job
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className="group bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl ${card.bgLight} flex items-center justify-center group-hover:rotate-12 transition-transform`}>
                <card.icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-200 dark:text-gray-700 group-hover:text-primary-500 transition-colors" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">{card.label}</p>
              {loading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                  {card.isString ? card.value : Number(card.value).toLocaleString()}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 p-10 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">Quick Actions</h2>
          <div className="space-y-4">
            {[
              { to: '/jobs/create', label: 'Post a New Job', sub: 'Find the perfect mentor', icon: Briefcase, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
              { to: '/become-a-mentor', label: 'Become a Mentor', sub: 'Share your expertise', icon: Users, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
              { to: '/courses', label: 'Browse Courses', sub: 'Learn something new', icon: BookOpen, color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400' },
              { to: '/wallet', label: 'Manage Wallet', sub: 'Deposit, withdraw, transfer', icon: TrendingUp, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="flex items-center gap-5 px-5 py-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{action.label}</p>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-0.5">{action.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 p-10 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-8 border border-gray-100 dark:border-gray-700">
              <Clock className="w-10 h-10 text-gray-200 dark:text-gray-700" />
            </div>
            <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">No recent activity found</p>
            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 mt-2 max-w-xs mx-auto italic">
              Your activity feed will appear here as you interact with the platform.
            </p>
            <Link
              to="/mentors"
              className="mt-10 px-8 py-3 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              Start by browsing mentors
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <AnalyticsDashboardSection />
    </div>
  )
}

function AnalyticsDashboardSection() {
  const { data: dashboard } = useDashboard()

  if (!dashboard || dashboard.sections.length === 0) return null

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Analytics</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboard.sections.map((section) => (
          <div key={section.section} className="rounded-[28px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-indigo-500 dark:text-indigo-400">
              {formatSectionLabel(section.section)}
            </h3>
            <div className="mt-3 space-y-2">
              {section.tiles.map((tile) => (
                <div key={tile.label} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{tile.label}</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">{tile.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatSectionLabel(section: string): string {
  const labels: Record<string, string> = {
    earnings: 'Earnings',
    jobs: 'Jobs',
    courses: 'Courses',
    views: 'Views',
    conversions: 'Conversions',
  }
  return labels[section] || section.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
