import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
} from 'lucide-react'

function validatePassword(password: string, confirmPassword: string): string {
  if (password.length < 8) return 'Password must be at least 8 characters long.'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) return 'Password must contain at least one special character.'
  if (password !== confirmPassword) return 'Passwords do not match.'
  return ''
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const token = searchParams.get('token') || ''
  const tokenMissing = useMemo(() => token.trim().length === 0, [token])

  const rules = useMemo(
    () => [
      { label: 'Minimum 8 characters', valid: password.length >= 8 },
      { label: 'At least one uppercase letter', valid: /[A-Z]/.test(password) },
      { label: 'At least one number', valid: /[0-9]/.test(password) },
      { label: 'At least one special character', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) },
    ],
    [password]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (tokenMissing) {
      setError('Reset link is invalid. Request a new password reset email.')
      return
    }

    const validationError = validatePassword(password, confirmPassword)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setLoading(true)
      setError('')
      await authApi.resetPassword(token, password)
      setSuccess(true)
      window.setTimeout(() => navigate('/login'), 1400)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-7">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Create new password
        </div>

        <div className="space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-700 text-white shadow-lg shadow-indigo-950/15">
            <KeyRound className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-slate-950">Create a new password</h2>
            <p className="max-w-[36ch] text-sm leading-6 text-slate-500">
              Choose a strong password that you have not used before on MentorX. This link can be used only once.
            </p>
          </div>
        </div>
      </div>

      {success ? (
        <div className="space-y-5 rounded-[26px] border border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(255,255,255,1))] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm shadow-emerald-950/10">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Password updated</p>
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">You can sign in now</h3>
              <p className="text-sm leading-6 text-slate-600">
                Your password was changed successfully. Previous sign-in sessions have been invalidated. Redirecting you back to sign in.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pr-11 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="At least 8 characters, 1 uppercase, 1 number, 1 special"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pr-11 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
            {rules.map((rule) => (
              <div key={rule.label} className="flex items-center gap-3">
                <ShieldCheck className={`h-4 w-4 ${rule.valid ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className={`text-sm ${rule.valid ? 'text-slate-700' : 'text-slate-500'}`}>{rule.label}</span>
              </div>
            ))}
          </div>

          {error ? (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="leading-6">{error}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || tokenMissing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating password...
              </>
            ) : (
              'Save new password'
            )}
          </button>
        </form>
      )}

      <div className="pt-1">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
