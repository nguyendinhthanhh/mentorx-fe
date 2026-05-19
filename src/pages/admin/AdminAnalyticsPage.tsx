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
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  BookOpen, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  Calendar
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'

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

const engagementData = [
  { name: 'Mon', jobs: 45, courses: 32 },
  { name: 'Tue', jobs: 52, courses: 41 },
  { name: 'Wed', jobs: 48, courses: 38 },
  { name: 'Thu', jobs: 61, courses: 52 },
  { name: 'Fri', jobs: 55, courses: 48 },
  { name: 'Sat', jobs: 32, courses: 65 },
  { name: 'Sun', jobs: 28, courses: 72 },
]

const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b']

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">System Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Deep insights into MentorX growth and engagement.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-primary-500 transition-all shadow-sm">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: '$124,500', trend: '+12.5%', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
          { label: 'Active Mentees', value: '2,840', trend: '+8.2%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
          { label: 'Active Jobs', value: '452', trend: '-2.4%', icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10', down: true },
          { label: 'Courses Sold', value: '1,205', trend: '+24.0%', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${stat.down ? 'text-rose-500' : 'text-emerald-500'}`}>
                {stat.down ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Area Chart */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Revenue vs Profit</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-500" />
                <span className="text-[10px] font-bold text-gray-500 uppercase">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase">Profit</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Segmentation Pie Chart */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-8">User Demographics</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userSegmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {userSegmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Bar Chart */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Platform Engagement</h3>
            <div className="flex gap-2">
               <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black">Jobs</span>
               <span className="px-3 py-1 rounded-lg bg-purple-50 text-purple-600 text-[10px] font-black">Courses</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="jobs" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="courses" fill="#a855f7" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Events / Top Lists */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-8">Top Performing Mentors</h3>
          <div className="space-y-4">
            {[
              { name: 'Dr. Sarah Wilson', field: 'Software Architecture', students: 124, revenue: '$4,200', rating: 4.9 },
              { name: 'Marcus Sterling', field: 'Product Design', students: 89, revenue: '$2,850', rating: 4.8 },
              { name: 'Elena Rodriguez', field: 'Data Science', students: 156, revenue: '$5,100', rating: 5.0 },
              { name: 'Johnathan Lee', field: 'Career Growth', students: 67, revenue: '$1,900', rating: 4.7 },
            ].map((mentor, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center text-xs font-black shadow-sm group-hover:scale-110 transition-transform">
                    {mentor.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900 dark:text-white">{mentor.name}</p>
                    <p className="text-[10px] font-medium text-gray-400">{mentor.field}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-emerald-600">{mentor.revenue}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{mentor.students} Students</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
