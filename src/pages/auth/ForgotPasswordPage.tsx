import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  RefreshCw,
  ArrowRight
} from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [sentAt, setSentAt] = useState('')

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      await authApi.forgotPassword(normalizedEmail)
      setSentAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {!success ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
          {/* Header Section */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50/50 px-3 py-1.5 text-xs font-semibold text-primary-700 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              Account Recovery
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Forgot password?
              </h2>
              <p className="text-sm leading-relaxed text-slate-500 sm:text-base">
                No worries, we'll send you reset instructions. Please enter the email address associated with your MentorX account.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-primary-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border-0 py-3.5 pl-11 pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6 hover:ring-slate-300"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !normalizedEmail}
              className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  <span>Sending instructions...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <Link 
              to="/login" 
              className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to login
            </Link>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8">
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-emerald-50 shadow-sm">
              <div className="absolute inset-0 rounded-[2rem] bg-emerald-100 opacity-50 animate-pulse"></div>
              <CheckCircle2 className="relative h-12 w-12 text-emerald-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Check your email
              </h2>
              <p className="text-sm leading-relaxed text-slate-500 sm:text-base">
                We've sent a password reset link to <br/>
                <span className="font-semibold text-slate-900">{normalizedEmail}</span>
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6 shadow-inner backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-2xl bg-white p-2.5 shadow-sm">
                <ShieldCheck className="h-5 w-5 text-primary-600" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-900 text-base">Secure link expires in 1 hour</p>
                <p className="mt-1 text-slate-500 leading-relaxed">
                  If you don't see the email in your inbox, please check your spam folder or try requesting a new link below.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 border border-slate-200 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 shadow-sm"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              ) : (
                <RefreshCw className="h-5 w-5 text-slate-400 group-hover:text-slate-600 group-hover:rotate-180 transition-all duration-500" />
              )}
              {loading ? 'Resending...' : 'Click to resend'}
            </button>
            
            <div className="text-center">
              <Link 
                to="/login" 
                className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
