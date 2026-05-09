import { useQuery, useMutation, useQueryClient } from 'react-query'
import { userApi } from '@/api/userApi'
import { mentorApi } from '@/api/mentorApi'
import { UserStatus, MentorStatus, UserResponse } from '@/types'
import { 
  Search, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Mail, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Eye
} from 'lucide-react'
import { useState } from 'react'
import { formatDateTime } from '@/utils/formatters'
import AdminUserModal from '@/components/admin/AdminUserModal'
import AdminUserDetailsModal from '@/components/admin/AdminUserDetailsModal'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'react-hot-toast'

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')
  const [mentorStatusFilter, setMentorStatusFilter] = useState<MentorStatus | ''>('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)

  const { data, isLoading } = useQuery(
    ['admin-users', page, search, statusFilter, mentorStatusFilter],
    () => userApi.getAllUsers({ 
      page, 
      size: 10, 
      search, 
      status: statusFilter || undefined,
      mentorStatus: mentorStatusFilter || undefined
    })
  )

  const updateStatusMutation = useMutation(
    ({ userId, status }: { userId: string; status: UserStatus }) => 
      userApi.updateUserStatus(userId, status),
    {
      onSuccess: () => {
        toast.success('User status updated')
        queryClient.invalidateQueries('admin-users')
      }
    }
  )

  const approveMentorMutation = useMutation(
    (userId: string) => mentorApi.approveMentorApplication(userId, currentUser!.userId),
    {
      onSuccess: () => {
        toast.success('Mentor approved')
        queryClient.invalidateQueries('admin-users')
      }
    }
  )

  const rejectMentorMutation = useMutation(
    ({ userId, reason }: { userId: string; reason: string }) =>
      mentorApi.requestMentorApplicationRevision(userId, reason, currentUser!.userId),
    {
      onSuccess: () => {
        toast.success('Revision requested')
        queryClient.invalidateQueries('admin-users')
      }
    }
  )

  const deleteUserMutation = useMutation(
    (userId: string) => userApi.softDeleteUser(userId),
    {
      onSuccess: () => {
        toast.success('User deleted')
        queryClient.invalidateQueries('admin-users')
      }
    }
  )

  const handleDelete = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId)
    }
  }

  const handleRejectMentor = (userId: string) => {
    const reason = window.prompt('Mentor cần bổ sung/chỉnh sửa thông tin gì?')
    if (reason && reason.trim()) {
      rejectMentorMutation.mutate({ userId, reason: reason.trim() })
    }
  }

  const handleEdit = (user: UserResponse) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedUser(null)
    setIsModalOpen(true)
  }

  const handleViewDetails = (user: UserResponse) => {
    setSelectedUser(user)
    setIsDetailsOpen(true)
  }

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE: return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
      case UserStatus.PENDING: return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
      case UserStatus.SUSPENDED: return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
      case UserStatus.BANNED: return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
      case UserStatus.DEACTIVATED: return 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      case UserStatus.DELETED: return 'bg-gray-100 text-gray-400 dark:bg-gray-900 dark:text-gray-600'
      default: return 'bg-gray-50 text-gray-600'
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Control and moderate platform accounts.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-5 h-5" />
          Create New User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-medium text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-4">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus)}
              className="px-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-bold text-gray-600 dark:text-gray-400 outline-none"
            >
              <option value="">Account Status</option>
              {Object.values(UserStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select 
              value={mentorStatusFilter}
              onChange={(e) => setMentorStatusFilter(e.target.value as MentorStatus)}
              className="px-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-bold text-gray-600 dark:text-gray-400 outline-none"
            >
              <option value="">Mentor Role</option>
              {Object.values(MentorStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] border-b border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/20">
                <th className="px-8 py-5 text-left">Profile</th>
                <th className="px-8 py-5 text-left">Account</th>
                <th className="px-8 py-5 text-left">Role Status</th>
                <th className="px-8 py-5 text-left">Joined</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-6"><div className="w-32 h-4 bg-gray-100 dark:bg-gray-800 rounded" /></td>
                    <td colSpan={4} />
                  </tr>
                ))
              ) : (
                data?.content.map((user) => (
                  <tr key={user.userId} className="group hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-lg border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden flex-shrink-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                          ) : (
                            user.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight truncate">{user.fullName}</span>
                          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5 mt-0.5 truncate">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {user.mentorStatus ? (
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          user.mentorStatus === MentorStatus.APPROVED ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' :
                          user.mentorStatus === MentorStatus.PENDING ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                          'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                        }`}>
                          {user.mentorStatus}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-gray-300 dark:text-gray-700 italic">Common User</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-tight">
                        {formatDateTime(user.createdAt)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleViewDetails(user)}
                          className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all shadow-sm"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                         {user.mentorStatus === MentorStatus.PENDING && (
                          <>
                            <button
                              onClick={() => approveMentorMutation.mutate(user.userId)}
                              className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm"
                              title="Approve Mentor"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectMentor(user.userId)}
                              className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all shadow-sm"
                              title="Reject/Revision"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {user.status === UserStatus.ACTIVE ? (
                          <button 
                            onClick={() => updateStatusMutation.mutate({ userId: user.userId, status: UserStatus.SUSPENDED })}
                            className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all shadow-sm"
                            title="Freeze Account"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => updateStatusMutation.mutate({ userId: user.userId, status: UserStatus.ACTIVE })}
                            className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all shadow-sm"
                            title="Unfreeze Account"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}

                        <button 
                          onClick={() => handleEdit(user)}
                          className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm"
                          title="Edit Profile"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button 
                          onClick={() => handleDelete(user.userId)}
                          className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/30">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
            Page {data?.number! + 1} of {data?.totalPages}
          </p>
          <div className="flex gap-3">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              disabled={data?.last}
              onClick={() => setPage(p => p + 1)}
              className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <AdminUserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
      />
      <AdminUserDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        user={selectedUser}
      />
    </div>
  )
}
