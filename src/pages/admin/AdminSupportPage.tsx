import { useQuery } from 'react-query'
import { chatApi } from '@/api/chatApi'
import { useAuthStore } from '@/store/authStore'
import { 
  MessageSquare, 
  Search, 
  Clock, 
  User, 
  ChevronRight,
  Filter,
  MoreVertical,
  Activity
} from 'lucide-react'
import { useState } from 'react'
import { formatDateTime } from '@/utils/formatters'
import { useNavigate } from 'react-router-dom'

export default function AdminSupportPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery(
    ['admin-support-rooms', user?.userId],
    () => chatApi.getUserRooms(user!.userId, { page: 0, size: 50 }),
    { enabled: !!user }
  )

  const filteredRooms = data?.content.filter(room => 
    room.roomName?.toLowerCase().includes(search.toLowerCase()) ||
    room.lastMessage?.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Support Center</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Manage incoming help requests and community messages.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             System Online
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Active Conversations</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{data?.totalElements || 0}</h3>
         </div>
         <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Unread Messages</p>
            <h3 className="text-3xl font-black text-amber-500">12</h3>
         </div>
         <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Avg. Response Time</p>
            <h3 className="text-3xl font-black text-primary-600">~14m</h3>
         </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {/* Search & Filter */}
        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center gap-4">
           <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 transition-all text-xs font-bold"
              />
           </div>
           <button className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary-600 transition-all">
              <Filter className="w-4 h-4" />
           </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
           {isLoading ? (
             <div className="p-20 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Scanning Secure Channels...</p>
             </div>
           ) : filteredRooms?.length === 0 ? (
             <div className="p-20 text-center space-y-6">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-[2.5rem] flex items-center justify-center mx-auto">
                   <MessageSquare className="w-8 h-8 text-gray-300" />
                </div>
                <div>
                   <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">No Active Tickets</h3>
                   <p className="text-xs font-bold text-gray-400 mt-2">All incoming messages have been cleared. Great job!</p>
                </div>
             </div>
           ) : (
             <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredRooms?.map((room) => (
                  <div 
                    key={room.id}
                    onClick={() => navigate(`/chat/${room.id}`)}
                    className="p-6 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all cursor-pointer group"
                  >
                     <div className="flex items-center gap-5">
                        <div className="relative">
                           <div className="w-14 h-14 rounded-[1.5rem] bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-xl border-2 border-white dark:border-gray-900 shadow-sm">
                              {room.roomName?.charAt(0).toUpperCase() || 'S'}
                           </div>
                           <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-emerald-500 border-2 border-white dark:border-gray-900" />
                        </div>
                        <div className="min-w-0">
                           <div className="flex items-center gap-3">
                              <h4 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{room.roomName || 'Support Session'}</h4>
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest">{room.roomType}</span>
                           </div>
                           <p className="text-xs font-bold text-gray-500 truncate max-w-md mt-1 italic">
                              {room.lastMessage?.content || 'No messages yet...'}
                           </p>
                           <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                 <Clock className="w-3 h-3" /> {room.lastMessageAt ? formatDateTime(room.lastMessageAt) : 'Recent'}
                              </span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <button className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 text-gray-400 group-hover:text-primary-600 transition-all shadow-sm">
                           <ChevronRight className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
