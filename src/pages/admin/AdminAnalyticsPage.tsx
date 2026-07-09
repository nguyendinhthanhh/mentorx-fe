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
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">System Analytics</h1>
          <p className="mt-2 text-sm font-bold text-slate-400 dark:text-slate-500">Deep insights into MentorX growth and engagement.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-white/50 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-500 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:-translate-y-0.5 transition-all shadow-sm hover:shadow-md backdrop-blur-xl">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 dark:bg-white dark:text-slate-900 dark:hover:bg-indigo-500 hover:-translate-y-0.5 transition-all shadow-xl hover:shadow-indigo-500/30">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: '$124,500', trend: '+12.5%', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' },
          { label: 'Active Mentees', value: '2,840', trend: '+8.2%', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/30' },
          { label: 'Active Jobs', value: '452', trend: '-2.4%', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30', down: true },
          { label: 'Courses Sold', value: '1,205', trend: '+24.0%', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/30' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className={`p-4 rounded-[1.5rem] ${stat.bg} ${stat.color} border shadow-sm`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-lg shadow-sm border border-slate-100/50 dark:border-slate-700/50 ${stat.down ? 'text-rose-500' : 'text-emerald-500'}`}>
                {stat.down ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <div className="mt-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Area Chart */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100/50 dark:border-slate-800/50 pb-6">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">Revenue vs Profit</h3>
            <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-2 rounded-xl border border-slate-100/50 dark:border-slate-800/50 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Profit</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800/50" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '1.5rem', 
                    border: '1px solid rgba(255,255,255,0.5)', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(12px)',
                    fontSize: '12px',
                    fontWeight: '800'
                  }} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Segmentation Pie Chart */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest mb-8 border-b border-slate-100/50 dark:border-slate-800/50 pb-6">User Demographics</h3>
          <div className="h-[300px] w-full flex items-center justify-center mt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={userSegmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {userSegmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800 }} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Bar Chart */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100/50 dark:border-slate-800/50 pb-6">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">Platform Engagement</h3>
            <div className="flex gap-2 bg-slate-50/50 dark:bg-slate-800/30 px-3 py-1.5 rounded-xl border border-slate-100/50 dark:border-slate-800/50 shadow-sm">
               <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-indigo-500" />Jobs</span>
               <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest ml-2"><div className="w-2 h-2 rounded-full bg-purple-500" />Courses</span>
            </div>
          </div>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={engagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800/50" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                />
                <Bar dataKey="jobs" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={16} />
                <Bar dataKey="courses" fill="#a855f7" radius={[8, 8, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Events / Top Lists */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest mb-8 border-b border-slate-100/50 dark:border-slate-800/50 pb-6">Top Performing Mentors</h3>
          <div className="space-y-4">
            {[
              { name: 'Dr. Sarah Wilson', field: 'Software Architecture', students: 124, revenue: '$4,200', rating: 4.9 },
              { name: 'Marcus Sterling', field: 'Product Design', students: 89, revenue: '$2,850', rating: 4.8 },
              { name: 'Elena Rodriguez', field: 'Data Science', students: 156, revenue: '$5,100', rating: 5.0 },
              { name: 'Johnathan Lee', field: 'Career Growth', students: 67, revenue: '$1,900', rating: 4.7 },
            ].map((mentor, i) => (
              <div key={i} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/50 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all group shadow-sm hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-sm font-black text-indigo-600 dark:text-indigo-400 shadow-sm group-hover:scale-110 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-all">
                    {mentor.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{mentor.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{mentor.field}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">{mentor.revenue}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{mentor.students} Students</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
