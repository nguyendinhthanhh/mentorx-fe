import { 
  Zap, 
  Search, 
  Filter, 
  RefreshCw, 
  Power, 
  Settings, 
  Activity, 
  ShieldCheck, 
  Database, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  Play,
  Square
} from 'lucide-react'
import { useState } from 'react'

const apiFunctions = [
  { id: 1, name: 'send_notification', service: 'Notification', method: 'POST', endpoint: '/api/notifications/send', status: 'Active', version: 'v1.2.0', uptime: '99.9%' },
  { id: 2, name: 'authenticate_user', service: 'Auth', method: 'POST', endpoint: '/api/auth/login', status: 'Active', version: 'v2.0.1', uptime: '100%' },
  { id: 3, name: 'process_payment', service: 'Wallet', method: 'POST', endpoint: '/api/wallet/escrow/process', status: 'Active', version: 'v1.0.5', uptime: '99.8%' },
  { id: 4, name: 'match_mentor_job', service: 'Job Matching', method: 'GET', endpoint: '/api/jobs/match', status: 'Warning', version: 'v0.9.8', uptime: '94.2%' },
  { id: 5, name: 'generate_report', service: 'Analytics', method: 'POST', endpoint: '/api/analytics/reports/generate', status: 'Inactive', version: 'v1.1.0', uptime: '0%' },
  { id: 6, name: 'get_unread_notifications', service: 'Notification', method: 'GET', endpoint: '/api/notifications/unread', status: 'Active', version: 'v1.2.0', uptime: '99.9%' },
]

export default function AdminApiPage() {
  const [search, setSearch] = useState('')

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">API Function Management</h1>
          <p className="mt-2 text-sm font-bold text-slate-400 dark:text-slate-500">Monitor, configure and manage individual API endpoints and microservices.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:-translate-y-0.5 transition-all flex items-center gap-2 group">
            <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Register New API
          </button>
        </div>
      </div>

      {/* Quick Filters & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all hover:-translate-y-1 flex items-center gap-5">
          <div className="w-14 h-14 rounded-[1.5rem] bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500 border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Healthy APIs</p>
            <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">42 <span className="text-lg text-slate-400 font-bold">/ 48</span></h4>
          </div>
        </div>
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all hover:-translate-y-1 flex items-center gap-5">
          <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-900/10 text-indigo-500 border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-center shadow-sm">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Total Requests</p>
            <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">1.2M <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">/ 24h</span></h4>
          </div>
        </div>
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all hover:-translate-y-1 flex items-center gap-5">
          <div className="w-14 h-14 rounded-[1.5rem] bg-rose-50 dark:bg-rose-900/10 text-rose-500 border border-rose-100 dark:border-rose-800/30 flex items-center justify-center shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Critical Errors</p>
            <h4 className="text-3xl font-extrabold text-rose-500 tracking-tight">3</h4>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all">
        {/* Table Toolbar */}
        <div className="px-8 py-6 border-b border-slate-100/50 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search functions, endpoints..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-14 pr-6 py-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 w-full md:w-80 text-sm font-bold shadow-sm transition-all text-slate-900 dark:text-white placeholder:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 dark:border-slate-700/60"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <Filter className="w-5 h-5" />
            </button>
            <button className="p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/20">
                <th className="px-8 py-5 text-left">Function & Service</th>
                <th className="px-8 py-5 text-left">Method & Endpoint</th>
                <th className="px-8 py-5 text-left">Status</th>
                <th className="px-8 py-5 text-left">Uptime</th>
                <th className="px-8 py-5 text-left">Version</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {apiFunctions.map((func) => (
                <tr key={func.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors cursor-default border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{func.name}</span>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{func.service}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                        func.method === 'POST' ? 'bg-indigo-50 border-indigo-200/60 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800/30 dark:text-indigo-400' : 'bg-emerald-50 border-emerald-200/60 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400'
                      }`}>
                        {func.method}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700/50">{func.endpoint}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                        func.status === 'Active' ? 'bg-emerald-500 shadow-emerald-500/30' : 
                        func.status === 'Warning' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-rose-500 shadow-rose-500/30'
                      }`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        func.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 
                        func.status === 'Warning' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {func.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{func.uptime}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 shadow-sm uppercase tracking-widest">{func.version}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 transform lg:translate-x-4 lg:group-hover:translate-x-0">
                      <button className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 shadow-sm transition-all" title="Restart Service">
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                      <button className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 hover:shadow-md hover:-translate-y-0.5 shadow-sm transition-all" title="Stop Service">
                        <Square className="w-4 h-4 fill-current" />
                      </button>
                      <button className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 shadow-sm transition-all" title="Settings">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing <span className="text-slate-600 dark:text-slate-300">6</span> of <span className="text-slate-600 dark:text-slate-300">48</span> functions</p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-[10px] font-black uppercase tracking-widest text-slate-400 disabled:opacity-50" disabled>Previous</button>
            <button className="px-4 py-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white hover:bg-white hover:border-slate-300 transition-all shadow-sm hover:shadow-md">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
