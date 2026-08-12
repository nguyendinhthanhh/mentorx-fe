import { useState } from 'react'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import { Eye, EyeOff, Loader2, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function PasswordChangeForm() {
  const { user } = useAuthStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess(false)
      await authApi.changePassword(user.userId, currentPassword, newPassword)
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Đã đổi mật khẩu thành công!', { duration: 3000 })
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to change password.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-[14px] border-0 bg-slate-50  py-3 px-4 text-slate-900 dark:text-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] ring-1 ring-inset ring-slate-200/60 transition-all placeholder:text-slate-400 focus:bg-white dark:bg-slate-950 focus:ring-2 focus:ring-inset focus:ring-[#059669] hover:bg-slate-50 dark:bg-slate-900/50 hover:ring-slate-300 sm:text-sm sm:leading-6 dark:bg-slate-900/50 dark:text-white dark:ring-slate-800 dark:focus:bg-slate-900'
  const labelClass = 'mb-1.5 block text-[13px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide dark:text-slate-300'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>Current Password</label>
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={`${inputClass} pr-11`}
            placeholder="Enter your current password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
          >
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className={labelClass}>New Password</label>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`${inputClass} pr-11`}
            placeholder="At least 8 characters, 1 uppercase, 1 number, 1 special"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className={labelClass}>Confirm New Password</label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`${inputClass} pr-11`}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200/60 bg-red-50/80 px-4 py-3 text-sm font-medium text-red-700 shadow-sm backdrop-blur-sm dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="leading-6">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#059669]/20 bg-[#059669]/10 px-4 py-3 text-sm font-medium text-[#059669] shadow-sm backdrop-blur-sm dark:border-[#059669]/30 dark:bg-[#059669]/20 dark:text-[#10B981]">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Password changed successfully! You have been signed out of all devices.</span>
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#059669] to-[#10B981] py-3.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(5,150,105,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(5,150,105,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save New Password'
          )}
        </button>
      </div>
    </form>
  )
}
