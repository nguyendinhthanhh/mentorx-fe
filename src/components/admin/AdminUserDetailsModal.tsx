import { useState } from 'react'
import { 
  X, Mail, Phone, Calendar, Wallet, Briefcase, BookOpen, 
  Clock, ShieldCheck, ShieldAlert, ExternalLink, Activity, 
  User, Shield, Lock, Globe, Star, Award, History,
  ChevronRight, MessageSquare, Fingerprint
} from 'lucide-react'
import { UserResponse, UserStatus, MentorStatus } from '@/types'
import { formatDateTime, formatCurrency } from '@/utils/formatters'
import { notificationApi } from '@/api/notificationApi'
import { chatApi } from '@/api/chatApi'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface AdminUserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
}

type TabType = 'overview' | 'financial' | 'activity' | 'security'

export default function AdminUserDetailsModal({ isOpen, onClose, user }: AdminUserDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const { user: currentUser } = useAuthStore()
  const navigate = useNavigate()

  if (!isOpen || !user) return null

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE: return 'text-emerald-500 bg-emerald-500/10'
      case UserStatus.SUSPENDED: return 'text-rose-500 bg-rose-500/10'
      default: return 'text-gray-500 bg-gray-500/10'
    }
  }

  const handleSendNotification = async () => {
    const title = window.prompt('Enter notification title:')
    const content = window.prompt('Enter notification message:')
    
    if (title && content) {
      try {
        await notificationApi.sendNotification({
          userId: user.userId,
          title,
          content,
          type: 'SYSTEM'
        })
        toast.success('Notification sent successfully')
      } catch (error) {
        toast.error('Failed to send notification')
      }
    }
  }

  const handleMessageUser = async () => {
    if (!currentUser) return
    try {
      const room = await chatApi.createRoom({
        participantIds: [user.userId, currentUser.userId],
        roomType: 'DIRECT_MESSAGE'
      })
      toast.success('Chat room created')
      navigate(`/chat/${room.id}`)
    } catch (error) {
      toast.error('Failed to start conversation')
    }
  }

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: User, desc: 'Personal info & profile' },
    { id: 'financial', label: 'Financial', icon: Wallet, desc: 'Wallet & transactions' },
    { id: 'activity', label: 'Activity', icon: Activity, desc: 'Jobs & course history' },
    { id: 'security', label: 'Security', icon: Shield, desc: 'Access & safety audit' },
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-gray-950/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-6xl h-[85vh] bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex animate-in fade-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* LEFT SIDEBAR */}
        <div className="w-80 bg-gray-50/50 dark:bg-gray-800/20 border-r border-gray-100 dark:border-gray-800 flex flex-col">
           {/* Profile Summary */}
           <div className="p-8 text-center space-y-4">
              <div className="relative inline-block group">
                 <div className="w-32 h-32 rounded-[2rem] bg-white dark:bg-gray-800 p-1.5 shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden mx-auto">
                    {user.avatarUrl ? (
                       <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover rounded-[1.6rem]" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-600 text-4xl font-black rounded-[1.6rem]">
                          {user.fullName.charAt(0).toUpperCase()}
                       </div>
                    )}
                 </div>
                 <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center ${user.status === UserStatus.ACTIVE ? 'bg-emerald-500' : 'bg-rose-500 shadow-lg shadow-rose-500/20'}`}>
                    <ShieldCheck className="w-4 h-4 text-white" />
                 </div>
              </div>
              <div>
                 <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight px-4">{user.fullName}</h2>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{user.role?.toString() || 'Platform Member'}</p>
              </div>
           </div>

           {/* Navigation Menu */}
           <div className="flex-1 px-4 space-y-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${activeTab === item.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
                >
                   <div className={`p-2.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-white/20' : 'bg-white dark:bg-gray-800 shadow-sm group-hover:scale-110'}`}>
                      <item.icon className="w-4 h-4" />
                   </div>
                   <div className="text-left">
                      <p className="text-xs font-black uppercase tracking-widest leading-none">{item.label}</p>
                      <p className={`text-[9px] font-bold mt-1 opacity-60 ${activeTab === item.id ? 'text-white' : 'text-gray-400'}`}>{item.desc}</p>
                   </div>
                   <ChevronRight className={`w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-all ${activeTab === item.id ? 'opacity-100' : ''}`} />
                </button>
              ))}
           </div>

           {/* Sidebar Footer Actions */}
           <div className="p-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
              <button 
                onClick={handleMessageUser}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
              >
                 <MessageSquare className="w-4 h-4" /> Message User
              </button>
              <button 
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                 Close Dashboard
              </button>
           </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
           {/* Top Info Bar */}
           <div className="h-20 px-10 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                 <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${getStatusColor(user.status)}`}>
                   Status: {user.status}
                 </span>
                 <div className="h-4 w-px bg-gray-100 dark:bg-gray-800" />
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <History className="w-3 h-3" /> Member since {formatDateTime(user.createdAt)}
                 </span>
              </div>
              <div className="flex items-center gap-2">
                 <button 
                  onClick={handleSendNotification}
                  className="px-6 py-2.5 rounded-xl bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary-500/20"
                 >
                    Send Notification
                 </button>
                 <button className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 transition-all">
                    <ExternalLink className="w-4 h-4" />
                 </button>
              </div>
           </div>

           {/* Tab Content (Scrollable) */}
           <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              
              {activeTab === 'overview' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="md:col-span-2 space-y-10">
                         <section className="space-y-4">
                            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Biography</h3>
                            <div className="p-8 rounded-[2rem] bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 leading-relaxed text-gray-600 dark:text-gray-400 italic text-sm">
                               "{user.bio || 'This user has not set a biography yet.'}"
                            </div>
                         </section>

                         <section className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                               <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Contact Details</h3>
                               <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-4 h-4" />
                                     </div>
                                     <div className="min-w-0">
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Email</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.email}</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-4 h-4" />
                                     </div>
                                     <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Phone</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">{user.phone || 'N/A'}</p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                            <div className="space-y-4">
                               <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Account Info</h3>
                               <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                        <Globe className="w-4 h-4" />
                                     </div>
                                     <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Locale</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">{user.countryCode || 'International'}</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                                        <Award className="w-4 h-4" />
                                     </div>
                                     <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Status</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">{user.isMentor ? 'Mentor' : 'Member'}</p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </section>
                      </div>

                      <div className="space-y-8">
                         <div className="p-8 rounded-[2.5rem] bg-gray-950 text-white shadow-xl">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-400">Reputation Score</h4>
                            <div className="mt-6 flex items-baseline gap-2">
                               <span className="text-5xl font-black">4.9</span>
                               <span className="text-gray-400 text-sm font-bold">/ 5.0</span>
                            </div>
                            <div className="mt-4 flex gap-1">
                               {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-primary-400 text-primary-400" />)}
                            </div>
                            <p className="mt-6 text-[10px] font-bold text-gray-400 uppercase leading-relaxed">Top 5% of trusted community members on MentorX.</p>
                         </div>
                         
                         <div className="p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Badges</h4>
                            <div className="flex flex-wrap gap-3">
                               <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center" title="Verified Member"><ShieldCheck className="w-5 h-5" /></div>
                               <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center" title="2FA Enabled"><Lock className="w-5 h-5" /></div>
                               <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center" title="Course Grad"><BookOpen className="w-5 h-5" /></div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'financial' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="p-8 rounded-[2.5rem] bg-primary-500 text-white shadow-xl relative overflow-hidden group">
                         <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Available Credits</p>
                         <h3 className="text-4xl font-black mt-3">{formatCurrency(user.balance || 1250000)}</h3>
                         <div className="mt-8 flex gap-3">
                            <button className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-[10px] font-black uppercase transition-all backdrop-blur-md">Add Funds</button>
                            <button className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-[10px] font-black uppercase transition-all backdrop-blur-md">Lock Balance</button>
                         </div>
                      </div>
                      <div className="p-8 rounded-[2.5rem] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Spent</p>
                         <h3 className="text-4xl font-black mt-3 text-gray-900 dark:text-white">{formatCurrency(450000)}</h3>
                         <div className="mt-6 flex items-center gap-2 text-rose-500 font-bold text-xs">
                            <TrendingUp className="w-3 h-3" /> +12.4% from last month
                         </div>
                      </div>
                   </div>

                   <section className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Transaction Ledger</h3>
                         <button className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline">View All</button>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-50 dark:border-gray-800 overflow-hidden">
                         {[
                           { id: 'TX-1', type: 'DEPOSIT', amount: '+500,000', method: 'VNPAY', status: 'MATCHED', time: '2h ago' },
                           { id: 'TX-2', type: 'PAYOUT', amount: '-120,000', method: 'BANK', status: 'COMPLETED', time: '1d ago' },
                           { id: 'TX-3', type: 'PURCHASE', amount: '-350,000', method: 'WALLET', status: 'COMPLETED', time: '3d ago' },
                         ].map((tx, i) => (
                           <div key={i} className="flex items-center justify-between p-5 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 transition-all">
                              <div className="flex items-center gap-5">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.amount.startsWith('+') ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-500'}`}>
                                    <History className="w-5 h-5" />
                                 </div>
                                 <div>
                                    <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{tx.type}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{tx.id} • {tx.time}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className={`text-sm font-black ${tx.amount.startsWith('+') ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>{tx.amount} MXC</p>
                                 <span className="text-[9px] font-black text-gray-400 uppercase border border-gray-100 dark:border-gray-700 px-2 py-0.5 rounded-md">{tx.status}</span>
                              </div>
                           </div>
                         ))}
                      </div>
                   </section>
                </div>
              )}

              {activeTab === 'activity' && (
                 <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-10">
                       <section className="space-y-6">
                          <div className="flex items-center justify-between">
                             <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Active Jobs</h3>
                             <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase">12 Posted</span>
                          </div>
                          <div className="space-y-3">
                             {[1,2,3].map(i => (
                               <div key={i} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-gray-200 transition-all cursor-pointer group">
                                  <div className="flex justify-between items-start">
                                     <p className="text-xs font-black text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors">Backend Architect Needed</p>
                                     <ExternalLink className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                                  </div>
                                  <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">Budget: $450 • 2 weeks ago</p>
                               </div>
                             ))}
                          </div>
                       </section>
                       <section className="space-y-6">
                          <div className="flex items-center justify-between">
                             <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Learning History</h3>
                             <span className="px-3 py-1 rounded-lg bg-purple-50 text-purple-600 text-[10px] font-black uppercase">5 Enrolled</span>
                          </div>
                          <div className="space-y-3">
                             {[1,2].map(i => (
                               <div key={i} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-gray-200 transition-all flex gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm">
                                     <BookOpen className="w-6 h-6 text-purple-500" />
                                  </div>
                                  <div className="min-w-0">
                                     <p className="text-xs font-black text-gray-900 dark:text-white truncate">Advanced System Design</p>
                                     <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden w-32">
                                        <div className="h-full bg-purple-500 w-[85%]" />
                                     </div>
                                     <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase">85% Completed</p>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </section>
                    </div>
                 </div>
              )}

              {activeTab === 'security' && (
                 <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-8 rounded-[2.5rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6">
                          <div className={`p-4 rounded-2xl ${user.isEmailVerified ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                             <Mail className="w-6 h-6" />
                          </div>
                          <div>
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Identity</h4>
                             <p className="text-sm font-black text-gray-900 dark:text-white">{user.isEmailVerified ? 'Verified' : 'Unverified'}</p>
                          </div>
                       </div>
                       <div className="p-8 rounded-[2.5rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6">
                          <div className={`p-4 rounded-2xl ${user.is2faEnabled ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                             <Fingerprint className="w-6 h-6" />
                          </div>
                          <div>
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Two-Factor</h4>
                             <p className="text-sm font-black text-gray-900 dark:text-white">{user.is2faEnabled ? 'Protected' : 'Disabled'}</p>
                          </div>
                       </div>
                    </div>

                    <section className="bg-gray-900 dark:bg-black rounded-[2.5rem] p-10 text-white space-y-8">
                       <div className="flex items-center gap-4">
                          <Lock className="w-5 h-5 text-primary-500" />
                          <h3 className="text-xs font-black uppercase tracking-[0.2em]">Security Logs & Governance</h3>
                       </div>
                       <div className="grid grid-cols-2 gap-10">
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Last Login Attempt</p>
                             <p className="text-sm font-bold text-gray-300">{user.lastSeenAt ? formatDateTime(user.lastSeenAt) : 'Never logged in'}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Authorized Device IP</p>
                             <p className="text-sm font-bold text-gray-300">192.168.1.104 (Vietnam)</p>
                          </div>
                       </div>
                       <div className="pt-8 border-t border-white/5 flex gap-4">
                          <button className="px-6 py-3 rounded-xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all border border-rose-500/20">Reset Password</button>
                          <button className="px-6 py-3 rounded-xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">Force Logout</button>
                       </div>
                    </section>
                 </div>
              )}

           </div>
        </div>
      </div>
    </div>
  )
}

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}
