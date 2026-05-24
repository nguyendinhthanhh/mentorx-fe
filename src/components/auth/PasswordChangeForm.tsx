import { useState } from 'react'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import { Eye, EyeOff, Loader2, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react'

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

  const rules = [
    { label: 'Minimum 8 characters', valid: newPassword.length >= 8 },
    { label: 'At least one uppercase letter', valid: /[A-Z]/.test(newPassword) },
    { label: 'At least one number', valid: /[0-9]/.test(newPassword) },
    { label: 'At least one special character', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword) },
    { label: 'Passwords match', valid: newPassword === confirmPassword && confirmPassword.length > 0 },
  ]

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
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm bg-white'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5 uppercase tracking-wider'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid gap-2 rounded-2xl border border-gray-200/80 bg-gray-50/80 p-4">
        {rules.map((rule) => (
          <div key={rule.label} className="flex items-center gap-3">
            <ShieldCheck className={`w-4 h-4 ${rule.valid ? 'text-emerald-600' : 'text-gray-300'}`} />
            <span className={`text-sm ${rule.valid ? 'text-gray-700' : 'text-gray-500'}`}>{rule.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="leading-6">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Password changed successfully! You have been signed out of all devices.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm uppercase tracking-widest"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Changing Password...
          </>
        ) : (
          'Change Password'
        )}
      </button>
    </form>
  )
}
