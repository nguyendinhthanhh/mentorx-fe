import { useState } from 'react'
import { 
  Users, 
  DollarSign, 
  Briefcase, 
  BookOpen, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Activity, 
  Database,
  Search,
  MoreVertical,
  RefreshCw,
  Power,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { useQuery } from 'react-query'
import { walletApi } from '@/api/walletApi'
import { adminMentorVerificationApi } from '@/api/adminMentorVerificationApi'
import { useAuthStore } from '@/store/authStore'
import { isAdmin } from '@/utils/roleRedirect'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts'

// Mock Data for Charts (Integrated)
const revenueData = [
  { name: 'Jan', revenue: 4000, profit: 2400 },
  { name: 'Feb', revenue: 3000, profit: 1398 },
  { name: 'Mar', revenue: 2000, profit: 9800 },
  { name: 'Apr', revenue: 2780, profit: 3908 },
  { name: 'May', revenue: 1890, profit: 4800 },
  { name: 'Jun', revenue: 2390, profit: 3800 },
  { name: 'Jul', revenue: 3490, profit: 4300 },
]

const userSegmentData = [
  { name: 'Mentees', value: 2400, color: '#3b82f6' },
  { name: 'Mentors', value: 800, color: '#10b981' },
  { name: 'Enterprise', value: 300, color: '#6366f1' },
]

export default function AdminDashboardPage() {
  const { user } = useAuthStore()
  const financeAdmin = isAdmin(user)
  const { data: walletSummary } = useQuery(['admin-financial-summary'], () => walletApi.getFinancialSummary(), {
    enabled: financeAdmin,
  })
  const { data: expertiseQueue } = useQuery(['admin-dashboard-expertise-queue'], () =>
    adminMentorVerificationApi.getExpertiseQueue({ page: 0, size: 1 })
  )
  const { data: identityQueue } = useQuery(['admin-dashboard-identity-queue'], () =>
    adminMentorVerificationApi.getIdentityQueue({ page: 0, size: 1 })
  )
  const pendingWithdrawalsCount = walletSummary?.pendingWithdrawals || 0

  if (!financeAdmin) {
    const moderationCards = [
      { label: 'Expertise reviews', value: expertiseQueue?.totalElements || 0, icon: ShieldCheck, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' },
      { label: 'Identity reviews', value: identityQueue?.totalElements || 0, icon: Users, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
      { label: 'Content moderation', value: 'Live', icon: BookOpen, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
      { label: 'Support inbox', value: 'Active', icon: Activity, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
    ]

    return (
      <div className="space-y-10 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Moderation Center</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">
              Review mentor expertise, trust signals, and content quality without exposing finance controls.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {moderationCards.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className={`inline-flex p-4 rounded-2xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Primary moderation workflows</h3>
            <div className="mt-6 space-y-4">
              {[
                { title: 'Mentor verification queue', detail: 'Approve expertise, request more info, and handle identity review.', href: '/admin/mentor-applications' },
                { title: 'Jobs moderation', detail: 'Inspect public jobs and moderate risky or low-quality postings.', href: '/admin/jobs' },
                { title: 'Courses moderation', detail: 'Review mentor-created courses before or after publication.', href: '/admin/courses' },
                { title: 'Support operations', detail: 'Respond to user issues and route abuse or trust cases.', href: '/admin/support' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-3xl bg-gray-50 dark:bg-gray-800/50 p-4 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all group"
                >
                  <div>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{item.detail}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-all" />
                </a>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Policy note</h3>
            <div className="mt-6 rounded-[2rem] border border-amber-100 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-900/10">
              <p className="text-sm font-semibold leading-7 text-amber-900 dark:text-amber-100">
                Mentors can unlock Mentor Mode through professional profile approval alone. Identity verification and payout approval stay in separate queues because they are risk-based, not application prerequisites.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Total Users', value: '2,840', change: '+12.5%', icon: Users, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', trend: 'up' },
    { label: 'Pending Payouts', value: pendingWithdrawalsCount.toString(), change: 'Action Required', icon: DollarSign, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400', trend: 'neutral', alert: pendingWithdrawalsCount > 0 },
    { label: 'Platform Revenue', value: '$45,200', change: '+24.0%', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', trend: 'up' },
    { label: 'Active Jobs', value: '452', change: '+8.2%', icon: Briefcase, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400', trend: 'up' },
  ]

  const systemStatus = [
    { name: 'Notification Service', status: 'Healthy', latency: '42ms', icon: Zap, color: 'text-amber-500' },
    { name: 'Wallet & Escrow', status: 'Healthy', latency: '89ms', icon: DollarSign, color: 'text-emerald-500' },
    { name: 'Job Matching Engine', status: 'Heavy Load', latency: '156ms', icon: Activity, color: 'text-rose-500' },
  ]

  return (
    <div className="space-y-10 pb-20">
      {/* 1. WELCOME & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Command Center</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Real-time platform oversight and strategic growth analysis.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-primary-500 transition-all shadow-sm">
            <RefreshCw className="w-4 h-4" />
            Full Sync
          </button>
          <button className="px-6 py-3 rounded-2xl bg-primary-500 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20">
            Export Report
          </button>
        </div>
      </div>

      {/* 2. OPERATIONAL STATS (High Urgency) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 ${stat.alert ? 'ring-2 ring-rose-500/20' : ''}`}>
            <div className="flex justify-between items-start relative z-10">
              <div className={`p-4 rounded-2xl ${stat.color} shadow-sm group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${stat.trend === 'up' ? 'text-emerald-500' : stat.trend === 'down' ? 'text-rose-500' : 'text-amber-500'}`}>
                {stat.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                {stat.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div className="mt-6 relative z-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</h3>
            </div>
            {stat.alert && (
              <div className="absolute top-0 right-0 p-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 3. MIDDLE SECTION: LIVE FEED & SYSTEM HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Event Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Platform Pulse</h3>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Now
            </span>
          </div>
          <div className="space-y-6">
            {[
              { type: 'withdrawal', user: 'Sarah Chen', amount: '$450', time: '2 mins ago', icon: DollarSign, color: 'bg-amber-100 text-amber-600' },
              { type: 'job', user: 'Alex Morgan', action: 'posted a new job', time: '15 mins ago', icon: Briefcase, color: 'bg-indigo-100 text-indigo-600' },
              { type: 'user', user: 'Elena Rodriguez', action: 'verified as Mentor', time: '1 hour ago', icon: ShieldCheck, color: 'bg-emerald-100 text-emerald-600' },
            ].map((event, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-gray-100 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${event.color} group-hover:scale-110 transition-transform`}>
                    <event.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 dark:text-white">
                      {event.user} <span className="font-medium text-gray-400">{event.action || `requested ${event.amount} payout`}</span>
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">{event.time}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-all" />
              </div>
            ))}
          </div>
        </div>

        {/* System Health Column */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-8">Infrastructure</h3>
          <div className="space-y-8 flex-1">
            {systemStatus.map((service, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <service.icon className={`w-4 h-4 ${service.color}`} />
                    <span className="text-xs font-black text-gray-900 dark:text-white">{service.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{service.latency}</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${service.status === 'Healthy' ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: service.status === 'Healthy' ? '92%' : '45%' }} />
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
            System Settings
          </button>
        </div>
      </div>

      {/* 4. STRATEGIC ANALYTICS (Long-term trends) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trends */}
        <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Growth Analytics</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Monthly Revenue vs Profit</p>
            </div>
            <div className="flex gap-3">
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-50 text-primary-600 text-[10px] font-black uppercase">Revenue</div>
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black">Profit</div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Distribution */}
        <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-10">User Ecosystem</h3>
          <div className="h-[350px] w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={userSegmentData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={10} dataKey="value">
                  {userSegmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-10 mt-8">
              {userSegmentData.map((segment, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{segment.name}</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{segment.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
