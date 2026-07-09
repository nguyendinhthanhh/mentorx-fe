import { useState } from 'react'
import { 
  X, Mail, Phone, Calendar, Wallet, Briefcase, BookOpen, 
  Clock, ShieldCheck, ShieldAlert, ExternalLink, Activity, 
  User, Shield, Lock, Globe, Star, Award, History,
  ChevronRight, MessageSquare, Fingerprint, TrendingUp
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
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false)
  const [notifTitle, setNotifTitle] = useState('')
  const [notifContent, setNotifContent] = useState('')
  const [isSendingNotif, setIsSendingNotif] = useState(false)
  const { user: currentUser } = useAuthStore()
  const navigate = useNavigate()

  if (!isOpen || !user) return null

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE: return 'text-emerald-600 bg-emerald-50 border-emerald-100'
      case UserStatus.SUSPENDED: return 'text-rose-600 bg-rose-50 border-rose-100'
      default: return 'text-gray-600 bg-gray-50 border-gray-100'
    }
  }

  const handleSendNotification = async () => {
    if (!notifTitle || !notifContent) return
    setIsSendingNotif(true)
    
    try {
      await notificationApi.sendNotification({
        userId: user.userId,
        title: notifTitle,
        message: notifContent,
        notificationType: 'SYSTEM_ANNOUNCEMENT'
      })
      toast.success('Notification sent successfully')
      setIsNotifModalOpen(false)
      setNotifTitle('')
      setNotifContent('')
    } catch (error) {
      toast.error('Failed to send notification')
    } finally {
      setIsSendingNotif(false)
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
      navigate(`/chat?roomId=${room.id}`)
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-gray-900/50 backdrop-blur-sm">
      <div 
        className="w-full max-w-5xl h-[85vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex animate-in fade-in zoom-in-95 duration-300 border border-gray-200 dark:border-gray-800"
        onClick={e => e.stopPropagation()}
      >
        {/* LEFT SIDEBAR */}
        <div className="w-72 bg-gray-50/50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col">
           {/* Profile Summary */}
           <div className="p-8 text-center space-y-4 border-b border-gray-100 dark:border-gray-800">
              <div className="relative inline-block group">
                 <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 p-1 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mx-auto">
                    {user.avatarUrl ? (
                       <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover rounded-[0.9rem]" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-600 text-3xl font-bold rounded-[0.9rem]">
                          {user.fullName.charAt(0).toUpperCase()}
                       </div>
                    )}
                 </div>
                 <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center ${user.status === UserStatus.ACTIVE ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                 </div>
              </div>
              <div>
                 <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{user.fullName}</h2>
                 <p className="text-xs font-medium text-gray-500 mt-1">{user.role?.toString() || 'Platform Member'}</p>
              </div>
           </div>

           {/* Navigation Menu */}
           <div className="flex-1 px-4 py-4 space-y-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                    activeTab === item.id 
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                   <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                   <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">{item.label}</p>
                   </div>
                   <ChevronRight className={`w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all ${activeTab === item.id ? 'opacity-100' : ''}`} />
                </button>
              ))}
           </div>

           {/* Sidebar Footer Actions */}
           <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <button 
                onClick={handleMessageUser}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                 <MessageSquare className="w-4 h-4" /> Message User
              </button>
           </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
           {/* Top Info Bar */}
           <div className="h-20 px-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                 <span className={`px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(user.status)}`}>
                   Status: {user.status}
                 </span>
                 <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
                 <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <History className="w-4 h-4" /> Member since {formatDateTime(user.createdAt)}
                 </span>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                  onClick={() => setIsNotifModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                 >
                    Send Notification
                 </button>
                 <button className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                 </button>
                 <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 ml-1"></div>
                 <button 
                  onClick={onClose} 
                  className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 text-gray-500 transition-colors"
                  title="Close Dashboard"
                 >
                    <X className="w-5 h-5" />
                 </button>
              </div>
           </div>

           {/* Tab Content (Scrollable) */}
           <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="md:col-span-2 space-y-8">
                         <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Biography</h3>
                            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 leading-relaxed text-gray-600 dark:text-gray-400 italic text-sm">
                               "{user.bio || 'This user has not set a biography yet.'}"
                            </div>
                         </section>

                         <section className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                               <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Contact Details</h3>
                               <div className="space-y-4">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5" />
                                     </div>
                                     <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Email</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-5 h-5" />
                                     </div>
                                     <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Phone</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.phone || 'N/A'}</p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                            <div className="space-y-4">
                               <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Account Info</h3>
                               <div className="space-y-4">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                                        <Globe className="w-5 h-5" />
                                     </div>
                                     <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Locale</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.countryCode || 'International'}</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                                        <Award className="w-5 h-5" />
                                     </div>
                                     <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Status</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.mentorStatus === 'APPROVED' ? 'Mentor' : 'Member'}</p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </section>
                      </div>

                      <div className="space-y-6">
                         <div className="p-6 rounded-3xl bg-gray-900 dark:bg-gray-800 text-white shadow-lg">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Reputation Score</h4>
                            <div className="mt-4 flex items-baseline gap-2">
                               <span className="text-4xl font-bold">4.9</span>
                               <span className="text-gray-400 text-sm font-medium">/ 5.0</span>
                            </div>
                            <div className="mt-3 flex gap-1">
                               {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                            </div>
                            <p className="mt-4 text-xs font-medium text-gray-400 leading-relaxed">Top 5% of trusted community members.</p>
                         </div>
                         
                         <div className="p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4 bg-white dark:bg-gray-900">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">System Badges</h4>
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
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 rounded-3xl bg-indigo-600 text-white shadow-md relative overflow-hidden group">
                         <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                         <p className="text-xs font-medium uppercase tracking-wider opacity-80">Available Credits</p>
                         <h3 className="text-3xl font-bold mt-2">{formatCurrency(user.balance || 1250000)}</h3>
                         <div className="mt-6 flex gap-2">
                            <button className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-medium transition-colors backdrop-blur-sm">Add Funds</button>
                            <button className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-medium transition-colors backdrop-blur-sm">Lock Balance</button>
                         </div>
                      </div>
                      <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                         <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Spent</p>
                         <h3 className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{formatCurrency(450000)}</h3>
                         <div className="mt-6 flex items-center gap-1.5 text-rose-500 font-medium text-sm">
                            <TrendingUp className="w-4 h-4" /> +12.4% from last month
                         </div>
                      </div>
                   </div>

                   <section className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Transaction Ledger</h3>
                         <button className="text-sm font-medium text-indigo-600 hover:underline">View All</button>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                         {[
                           { id: 'TX-1', type: 'DEPOSIT', amount: '+500,000', method: 'VNPAY', status: 'MATCHED', time: '2h ago' },
                           { id: 'TX-2', type: 'PAYOUT', amount: '-120,000', method: 'BANK', status: 'COMPLETED', time: '1d ago' },
                           { id: 'TX-3', type: 'PURCHASE', amount: '-350,000', method: 'WALLET', status: 'COMPLETED', time: '3d ago' },
                         ].map((tx, i) => (
                           <div key={i} className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <div className="flex items-center gap-4">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.amount.startsWith('+') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                    <History className="w-5 h-5" />
                                 </div>
                                 <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{tx.type}</p>
                                    <p className="text-xs font-medium text-gray-500">{tx.id} • {tx.time}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className={`text-sm font-bold ${tx.amount.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{tx.amount} MXC</p>
                                 <span className="text-xs font-medium text-gray-500 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-md mt-1 inline-block">{tx.status}</span>
                              </div>
                           </div>
                         ))}
                      </div>
                   </section>
                </div>
              )}

              {activeTab === 'activity' && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-8">
                       <section className="space-y-4">
                          <div className="flex items-center justify-between">
                             <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Active Jobs</h3>
                             <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 text-xs font-semibold">12 Posted</span>
                          </div>
                          <div className="space-y-3">
                             {[1,2,3].map(i => (
                               <div key={i} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors cursor-pointer group">
                                  <div className="flex justify-between items-start">
                                     <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">Backend Architect Needed</p>
                                     <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-all" />
                                  </div>
                                  <p className="text-xs font-medium text-gray-500 mt-1">Budget: $450 • 2 weeks ago</p>
                               </div>
                             ))}
                          </div>
                       </section>
                       <section className="space-y-4">
                          <div className="flex items-center justify-between">
                             <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Learning History</h3>
                             <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 text-xs font-semibold">5 Enrolled</span>
                          </div>
                          <div className="space-y-3">
                             {[1,2].map(i => (
                               <div key={i} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors flex gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm">
                                     <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                     <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Advanced System Design</p>
                                     <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-600 dark:bg-purple-500 w-[85%]" />
                                     </div>
                                     <p className="text-xs font-medium text-gray-500 mt-1.5">85% Completed</p>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </section>
                    </div>
                 </div>
              )}

              {activeTab === 'security' && (
                 <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${user.isEmailVerified ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                             <Mail className="w-5 h-5" />
                          </div>
                          <div>
                             <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Identity</h4>
                             <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.isEmailVerified ? 'Verified' : 'Unverified'}</p>
                          </div>
                       </div>
                       <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${user.is2faEnabled ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                             <Fingerprint className="w-5 h-5" />
                          </div>
                          <div>
                             <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Two-Factor</h4>
                             <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.is2faEnabled ? 'Protected' : 'Disabled'}</p>
                          </div>
                       </div>
                    </div>

                    <section className="bg-gray-900 rounded-3xl p-8 text-white space-y-6">
                       <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-indigo-400" />
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-200">Security Logs & Governance</h3>
                       </div>
                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-1">
                             <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Last Login Attempt</p>
                             <p className="text-sm font-medium text-gray-100">{user.lastSeenAt ? formatDateTime(user.lastSeenAt) : 'Never logged in'}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Authorized Device IP</p>
                             <p className="text-sm font-medium text-gray-100">192.168.1.104 (Vietnam)</p>
                          </div>
                       </div>
                       <div className="pt-6 border-t border-gray-800 flex gap-3">
                          <button className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 text-sm font-medium hover:bg-rose-500/20 transition-colors border border-rose-500/20">Reset Password</button>
                          <button className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors border border-white/10">Force Logout</button>
                       </div>
                    </section>
                 </div>
              )}

           </div>
        </div>
      </div>
      
      {/* Custom Notification Modal */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsNotifModalOpen(false)}>
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">Send Notification</h3>
              <button onClick={() => setIsNotifModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input 
                  type="text" 
                  value={notifTitle}
                  onChange={e => setNotifTitle(e.target.value)}
                  placeholder="Notification Title"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                <textarea 
                  value={notifContent}
                  onChange={e => setNotifContent(e.target.value)}
                  placeholder="Enter message..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex justify-end gap-3">
              <button 
                onClick={() => setIsNotifModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendNotification}
                disabled={isSendingNotif || !notifTitle || !notifContent}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[80px]"
              >
                {isSendingNotif ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
