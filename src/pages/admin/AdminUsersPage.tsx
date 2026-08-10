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
  Eye,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { useState } from 'react'
import { formatDateTime } from '@/utils/formatters'
import AdminUserModal from '@/components/admin/AdminUserModal'
import AdminUserDetailsModal from '@/components/admin/AdminUserDetailsModal'
import { adminMentorVerificationApi } from '@/api/adminMentorVerificationApi'
import { useAuthStore } from '@/store/authStore'
import { useI18n } from '@/i18n/I18nProvider'
import { toast } from 'react-hot-toast'

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const { t } = useI18n()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')
  const [mentorStatusFilter, setMentorStatusFilter] = useState<MentorStatus | ''>('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  const [suspendTarget, setSuspendTarget] = useState<string | null>(null)
  const [suspendReason, setSuspendReason] = useState('')

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
        toast.success(t('admin.users.toast.statusUpdated'))
        queryClient.invalidateQueries('admin-users')
      }
    }
  )

  const approveMentorMutation = useMutation(
    (userId: string) => mentorApi.approveMentorApplication(userId, currentUser!.userId),
    {
      onSuccess: () => {
        toast.success(t('admin.users.toast.mentorApproved'))
        queryClient.invalidateQueries('admin-users')
      }
    }
  )

  const rejectMentorMutation = useMutation(
    ({ userId, reason }: { userId: string; reason: string }) =>
      mentorApi.requestMentorApplicationRevision(userId, reason, currentUser!.userId),
    {
      onSuccess: () => {
        toast.success(t('admin.users.toast.revisionRequested'))
        queryClient.invalidateQueries('admin-users')
      }
    }
  )

  const suspendMentorMutation = useMutation(
    ({ userId, reason }: { userId: string; reason: string }) =>
      adminMentorVerificationApi.suspendMentor(userId, reason),
    {
      onSuccess: () => {
        toast.success(t('admin.users.toast.mentorSuspended'))
        queryClient.invalidateQueries('admin-users')
      }
    }
  )

  const handleSuspendMentor = (userId: string) => {
    setSuspendTarget(userId)
    setSuspendReason('')
  }

  const handleSuspendConfirm = () => {
    if (suspendTarget && suspendReason.trim()) {
      suspendMentorMutation.mutate({ userId: suspendTarget, reason: suspendReason.trim() })
      setSuspendTarget(null)
      setSuspendReason('')
    }
  }

  const restoreMentorMutation = useMutation(
    ({ userId, reason }: { userId: string; reason: string }) => adminMentorVerificationApi.reinstateMentor(userId, reason),
    {
      onSuccess: () => {
        toast.success(t('admin.users.toast.mentorRestored'))
        queryClient.invalidateQueries('admin-users')
      }
    }
  )

  const deleteUserMutation = useMutation(
    (userId: string) => userApi.softDeleteUser(userId),
    {
      onSuccess: () => {
        toast.success(t('admin.users.toast.userDeleted'))
        queryClient.invalidateQueries('admin-users')
      }
    }
  )

  const handleDelete = (userId: string) => {
    if (window.confirm(t('admin.users.confirm.delete'))) {
      deleteUserMutation.mutate(userId)
    }
  }

  const handleRejectMentor = (userId: string) => {
    const reason = window.prompt(t('admin.users.prompt.revisionReason'))
    if (reason && reason.trim()) {
      rejectMentorMutation.mutate({ userId, reason: reason.trim() })
    }
  }

  const handleRestoreMentor = (userId: string) => {
    const reason = window.prompt(t('admin.users.prompt.restoreReason'), t('admin.users.prompt.restoreReasonDefault'))
    if (reason && reason.trim()) {
      restoreMentorMutation.mutate({ userId, reason: reason.trim() })
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
      case UserStatus.ACTIVE: return 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-500 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400'
      case UserStatus.PENDING: return 'bg-amber-50 dark:bg-amber-900/30 border border-amber-100 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-400'
      case UserStatus.SUSPENDED: return 'bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800/30 dark:text-rose-400'
      case UserStatus.BANNED: return 'bg-red-50 border border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400'
      case UserStatus.DEACTIVATED: return 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
      case UserStatus.DELETED: return 'bg-slate-100 border border-slate-200 dark:border-slate-800 text-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-600'
      default: return 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
    }
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-1">
          <h1 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent dark:from-white dark:to-slate-400 sm:text-3xl lg:text-4xl">{t('admin.users.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-400 text-sm md:text-base">{t('admin.users.subtitle')}</p>
        </div>
        <button 
          onClick={handleCreate}
          className="group flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-95 sm:px-8"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
          {t('admin.users.create')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-950 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder={t("admin.users.searchPlaceholder")} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 dark:border-slate-700 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 outline-none transition-all focus:border-emerald-500/50 focus:bg-white dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:focus:bg-slate-800 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600 sm:w-auto appearance-none cursor-pointer"
            >
              <option value="">{t('admin.users.accountStatus')}</option>
              {Object.values(UserStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select 
              value={mentorStatusFilter}
              onChange={(e) => setMentorStatusFilter(e.target.value as MentorStatus)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 outline-none transition-all focus:border-emerald-500/50 focus:bg-white dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:focus:bg-slate-800 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600 sm:w-auto appearance-none cursor-pointer"
            >
              <option value="">{t('admin.users.mentorRole')}</option>
              {Object.values(MentorStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-950 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/50">
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t('admin.users.table.profile')}</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t('admin.users.table.accountStatus')}</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t('admin.users.table.roleStatus')}</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t('admin.users.table.joined')}</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider text-right">{t('admin.users.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-6"><div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                    <td colSpan={4} />
                  </tr>
                ))
              ) : (
                data?.content.map((user) => (
                  <tr key={user.userId} className="group hover:bg-slate-50 dark:bg-slate-900/30 dark:hover:bg-slate-800/80 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-500 dark:text-emerald-400 font-extrabold text-lg border border-emerald-100 dark:border-emerald-900/50 dark:border-emerald-800/30 shadow-sm overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                          ) : (
                            user.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{user.fullName}</span>
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(user.status)} shadow-sm`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      {user.mentorStatus ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                          user.mentorStatus === MentorStatus.APPROVED ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-500 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400' :
                          user.mentorStatus === MentorStatus.PENDING ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-100 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-400' :
                          'bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800/30 dark:text-rose-400'
                        }`}>
                          {user.mentorStatus}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-600 italic">{t('admin.users.role.user')}</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 dark:text-slate-400">
                        {formatDateTime(user.createdAt)}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:translate-x-4 lg:group-hover:translate-x-0 transition-all duration-300">
                        <button 
                          onClick={() => handleViewDetails(user)}
                          className="p-2 rounded-xl bg-white dark:bg-slate-950 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-slate-400 hover:text-emerald-600 dark:text-emerald-500 hover:border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          title={t('admin.users.action.viewDetails')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                          {user.mentorStatus === MentorStatus.PENDING && (
                          <>
                            <button
                              onClick={() => approveMentorMutation.mutate(user.userId)}
                              className="p-2 rounded-xl bg-white dark:bg-slate-950 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-emerald-500 hover:border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                              title={t('admin.users.action.approveMentor')}
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectMentor(user.userId)}
                              className="p-2 rounded-xl bg-white dark:bg-slate-950 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                              title={t('admin.users.action.rejectRevision')}
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {user.mentorStatus === MentorStatus.APPROVED && (
                          <button 
                            onClick={() => handleSuspendMentor(user.userId)}
                            className="p-2 rounded-xl bg-white dark:bg-slate-950 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                            title={t('admin.users.action.suspendMentor')}
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        )}

                        {user.mentorStatus === MentorStatus.SUSPENDED && (
                          <button 
                            onClick={() => handleRestoreMentor(user.userId)}
                            className="p-2 rounded-xl bg-white dark:bg-slate-950 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-emerald-500 hover:border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                            title={t('admin.users.action.restoreMentor')}
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        
                        {user.status === UserStatus.ACTIVE ? (
                          <button 
                            onClick={() => updateStatusMutation.mutate({ userId: user.userId, status: UserStatus.SUSPENDED })}
                            className="p-2 rounded-xl bg-white dark:bg-slate-950 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-amber-500 hover:border-amber-200 dark:border-amber-800/50 hover:bg-amber-50 dark:bg-amber-900/30 dark:hover:bg-amber-900/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                            title={t('admin.users.action.freezeAccount')}
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => updateStatusMutation.mutate({ userId: user.userId, status: UserStatus.ACTIVE })}
                            className="p-2 rounded-xl bg-white dark:bg-slate-950 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-emerald-500 hover:border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                            title={t('admin.users.action.unfreezeAccount')}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}

                        <button 
                          onClick={() => handleEdit(user)}
                          className="p-2 rounded-xl bg-white dark:bg-slate-950 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          title={t('admin.users.action.editProfile')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button 
                          onClick={() => handleDelete(user.userId)}
                          className="p-2 rounded-xl bg-white dark:bg-slate-950 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          title={t('admin.users.action.deleteUser')}
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
        <div className="flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50 px-6 py-5 dark:border-slate-800/50 dark:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {t('admin.users.pagination.page')} {(data?.number ?? 0) + 1} {t('admin.users.pagination.of')} {data?.totalPages ?? 0}
          </p>
          <div className="flex gap-2">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-950 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-slate-400 hover:text-emerald-600 dark:text-emerald-500 hover:border-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              disabled={data?.last}
              onClick={() => setPage(p => p + 1)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-950 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-slate-400 hover:text-emerald-600 dark:text-emerald-500 hover:border-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
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

      {suspendTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-xl rounded-[2.5rem] border border-white/20 bg-white dark:bg-slate-950/90 p-8 shadow-2xl backdrop-blur-xl dark:bg-slate-900/90 dark:border-slate-700 animate-in zoom-in-95 duration-300">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-[10px] font-black uppercase tracking-widest text-rose-600 dark:bg-rose-900/20 dark:border-rose-800/30 dark:text-rose-400 mb-3 shadow-sm">
                  <AlertCircle className="w-3 h-3" /> {t('admin.users.suspendModal.moderationAction')}
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('admin.users.suspendModal.title')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400 hover:border-slate-300 dark:border-slate-700 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900/50 transition-all dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 shadow-sm"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 space-y-4">
              <p className="text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-400 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 dark:border-slate-700/50">{t('admin.users.suspendModal.description')}</p>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-slate-300 uppercase tracking-wider ml-1">{t('admin.users.suspendModal.reasonLabel')}</label>
                <textarea
                  rows={4}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder={t('admin.users.suspendModal.reasonPlaceholder')}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-4 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none transition-all focus:border-rose-300 focus:ring-4 focus:ring-rose-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-sm placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 text-sm font-bold text-slate-600 dark:text-slate-400 transition-all hover:border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shadow-sm"
              >{t('admin.users.suspendModal.cancel')}</button>
              <button
                type="button"
                onClick={handleSuspendConfirm}
                disabled={!suspendReason.trim() || suspendMentorMutation.isLoading}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-6 text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-rose-500/25 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:transform-none disabled:hover:shadow-none"
              >
                {suspendMentorMutation.isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
                {suspendMentorMutation.isLoading ? t('admin.users.suspendModal.submitting') : t('admin.users.suspendModal.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
