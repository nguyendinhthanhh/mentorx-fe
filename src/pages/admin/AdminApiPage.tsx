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
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">API Function Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Monitor, configure and manage individual API endpoints and microservices.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-sm font-bold shadow-xl shadow-gray-200 dark:shadow-none hover:bg-primary-600 dark:hover:bg-primary-400 transition-all flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Register New API
          </button>
        </div>
      </div>

      {/* Quick Filters & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-2">Healthy APIs</p>
            <h4 className="text-2xl font-black text-gray-900 dark:text-white">42 / 48</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-2">Total Requests</p>
            <h4 className="text-2xl font-black text-gray-900 dark:text-white">1.2M <span className="text-xs text-gray-400 dark:text-gray-600 font-bold tracking-tight">/ 24h</span></h4>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-2">Critical Errors</p>
            <h4 className="text-2xl font-black text-gray-900 dark:text-white">3</h4>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30 dark:bg-gray-800/30">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search functions, endpoints..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-6 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 w-full md:w-80 font-medium shadow-sm transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-600 transition-all shadow-sm">
              <Filter className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-600 transition-all shadow-sm">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] border-b border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/20">
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
                <tr key={func.id} className="group hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-all cursor-default">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{func.name}</span>
                      <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mt-0.5">{func.service}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                        func.method === 'POST' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {func.method}
                      </span>
                      <span className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400">{func.endpoint}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        func.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 
                        func.status === 'Warning' ? 'bg-amber-500 animate-bounce' : 'bg-rose-500'
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
                      <Clock className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{func.uptime}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">{func.version}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                      <button className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-200 hover:scale-110 shadow-sm transition-all" title="Restart Service">
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                      <button className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 hover:scale-110 shadow-sm transition-all" title="Stop Service">
                        <Square className="w-4 h-4 fill-current" />
                      </button>
                      <button className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 hover:scale-110 shadow-sm transition-all" title="Settings">
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
        <div className="px-8 py-5 bg-gray-50/30 dark:bg-gray-800/30 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500">Showing 6 of 48 registered API functions</p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs font-black uppercase text-gray-400 disabled:opacity-50" disabled>Previous</button>
            <button className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs font-black uppercase text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
