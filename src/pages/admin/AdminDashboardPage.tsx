import { 
  Users, 
  Briefcase, 
  BookOpen, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
  Zap,
  Globe,
  Database,
  Search,
  MoreVertical,
  RefreshCw,
  Power
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'

export default function AdminDashboardPage() {
  const stats = [
    { label: 'Total Users', value: '2,840', change: '+12.5%', icon: Users, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', trend: 'up' },
    { label: 'Active Jobs', value: '452', change: '+8.2%', icon: Briefcase, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400', trend: 'up' },
    { label: 'Total Revenue', value: formatCurrency(12500), change: '-3.1%', icon: DollarSign, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', trend: 'down' },
    { label: 'Course Sales', value: '1,205', change: '+24.0%', icon: BookOpen, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400', trend: 'up' },
  ]

  const apiServices = [
    { name: 'Notification Service', status: 'Healthy', latency: '42ms', requests: '12.4k', icon: Zap, color: 'text-amber-500' },
    { name: 'Auth & User Service', status: 'Healthy', latency: '24ms', requests: '8.2k', icon: ShieldCheck, color: 'text-blue-500 dark:text-blue-400' },
    { name: 'Job Matching Engine', status: 'Heavy Load', latency: '156ms', requests: '45.1k', icon: Activity, color: 'text-rose-500' },
    { name: 'Wallet & Escrow', status: 'Healthy', latency: '89ms', requests: '2.1k', icon: DollarSign, color: 'text-emerald-500 dark:text-emerald-400' },
    { name: 'Analytics Worker', status: 'Standby', latency: '-', requests: '0', icon: Database, color: 'text-indigo-500 dark:text-indigo-400' },
  ]

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Platform Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Welcome back, Administrator. Here's your real-time platform insight.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm text-sm font-bold text-gray-600 dark:text-gray-400">
            <Globe className="w-4 h-4 text-blue-500" />
            Global Status: <span className="text-emerald-600 dark:text-emerald-400">Operational</span>
          </div>
          <button className="p-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm text-gray-400 hover:text-primary-600 transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.02)] group hover:shadow-xl hover:shadow-primary-600/5 transition-all duration-300">
            <div className="flex items-start justify-between mb-6">
              <div className={`p-4 rounded-2xl ${stat.color} transition-transform group-hover:scale-110 duration-500 shadow-inner`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                stat.trend === 'down' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
              }`}>
                {stat.trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-2">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* API Function Management */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-200 dark:shadow-none">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 dark:text-white">API Function Management</h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Real-time Service Monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Filter services..." 
                  className="pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 w-48 font-medium text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] border-b border-gray-50 dark:border-gray-800">
                  <th className="px-4 py-3 text-left">Service Name</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Latency</th>
                  <th className="px-4 py-3 text-left">Requests/h</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {apiServices.map((service) => (
                  <tr key={service.name} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${service.color}`}>
                          <service.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{service.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          service.status === 'Healthy' ? 'bg-emerald-500 animate-pulse' : 
                          service.status === 'Heavy Load' ? 'bg-rose-500 animate-bounce' : 'bg-gray-400'
                        }`} />
                        <span className={`text-xs font-black uppercase tracking-tighter ${
                          service.status === 'Healthy' ? 'text-emerald-600 dark:text-emerald-400' : 
                          service.status === 'Heavy Load' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'
                        }`}>{service.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-bold ${
                        parseInt(service.latency) > 100 ? 'text-rose-500' : 'text-gray-900 dark:text-white'
                      }`}>{service.latency}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{service.requests}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-600 hover:border-primary-100 shadow-sm transition-all">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-rose-600 hover:border-rose-100 shadow-sm transition-all">
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health & Resources */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8">
            <h3 className="font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              System Resources
            </h3>
            <div className="space-y-8">
              {[
                { label: 'Server CPU', value: 24, color: 'bg-emerald-500' },
                { label: 'Memory Usage', value: 68, color: 'bg-amber-500' },
                { label: 'Database Load', value: 12, color: 'bg-emerald-500' },
              ].map((res) => (
                <div key={res.label} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{res.label}</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">{res.value}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700 shadow-inner">
                    <div className={`h-full ${res.color} rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.1)]`} style={{ width: `${res.value}%` }} />
                  </div>
                </div>
              ))}
              
              <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
                <button className="w-full py-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 transition-all">
                  Full Diagnostics
                </button>
              </div>
            </div>
          </div>

          {/* Recent Reports / Notifications */}
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h3 className="font-black text-gray-900 dark:text-white mb-6 flex items-center justify-between relative z-10">
              Moderation
              <span className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase">4 Pending</span>
            </h3>
            <div className="space-y-4 relative z-10">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group hover:border-primary-200 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-black text-gray-900 dark:text-white uppercase">Report #{i*123}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                    Flagged for inappropriate content in job description: "Senior Frontend React..."
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-tighter">2h ago by Admin</span>
                    <button className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline">Review Now</button>
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
