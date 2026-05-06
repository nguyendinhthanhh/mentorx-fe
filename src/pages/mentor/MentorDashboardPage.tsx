import { 
  Briefcase, 
  BookOpen, 
  Users, 
  Star, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  Clock,
  MessageSquare
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { useAuthStore } from '@/store/authStore'

export default function MentorDashboardPage() {
  const { user } = useAuthStore()

  const stats = [
    { label: 'Total Earnings', value: formatCurrency(4250), change: '+18%', icon: DollarSign, color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
    { label: 'Active Contracts', value: '12', change: '+2', icon: Briefcase, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
    { label: 'Avg. Rating', value: '4.9', change: '+0.1', icon: Star, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
    { label: 'Students', value: '156', change: '+24', icon: Users, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
  ]

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Welcome back, {user?.fullName}!</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Here's a summary of your mentoring activities and performance.</p>
        </div>
        <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          View Performance
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm group hover:scale-105 transition-all duration-500">
            <div className="flex items-start justify-between mb-6">
              <div className={`p-4 rounded-2xl ${stat.color} group-hover:rotate-12 transition-transform`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1.5 rounded-xl uppercase tracking-widest">
                <ArrowUpRight className="w-3 h-3" />
                {stat.change}
              </span>
            </div>
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{stat.label}</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-2 tracking-tighter">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Active Proposals */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-10 py-8 border-b border-gray-50 dark:border-gray-800/50 flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Recent Proposals</h3>
            <button className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-[0.2em]">
              View All Proposals
            </button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-10 py-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-900 dark:text-white tracking-tight">Frontend React Developer for E-commerce</p>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">Proposed: <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(500)}</span> • 2 days ago</p>
                  </div>
                </div>
                <span className="px-4 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-xl uppercase tracking-widest">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Status */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm p-10">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 tracking-tight">Profile Visibility</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center gap-4">
                  <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest">Available</span>
                </div>
                <div className="w-12 h-6 bg-indigo-600 rounded-full relative shadow-inner">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md" />
                </div>
              </div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 text-center leading-relaxed px-4">
                When active, you will appear in search results for new mentoring opportunities.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm p-10">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 tracking-tight">Next Session</h3>
            <div className="space-y-6">
              <div className="flex gap-5 items-center p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex flex-col items-center justify-center text-white font-black shadow-lg shadow-indigo-200 dark:shadow-none group-hover:rotate-6 transition-transform">
                  <span className="text-[10px] leading-none uppercase tracking-widest opacity-80">May</span>
                  <span className="text-2xl leading-none mt-1">12</span>
                </div>
                <div>
                  <p className="text-base font-black text-gray-900 dark:text-white tracking-tight">React Architecture Review</p>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 flex items-center gap-2 mt-1 uppercase tracking-widest">
                    <Clock className="w-4 h-4 text-indigo-500" /> 10:00 - 11:30
                  </p>
                </div>
              </div>
              <button className="w-full py-4 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
                View Full Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
