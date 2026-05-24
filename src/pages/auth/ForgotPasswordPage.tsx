import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
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
    <div className="space-y-7">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Account recovery
        </div>

        <div className="space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-700 text-white shadow-lg shadow-indigo-950/15">
            <Mail className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-slate-950">Reset your password</h2>
            <p className="max-w-[34ch] text-sm leading-6 text-slate-500">
              Enter the email address attached to your MentorX account. We will send a secure reset link after confirming the account exists.
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
          {[
            'Only registered MentorX emails can request a reset link.',
            'The newest link expires after 1 hour and invalidates older links.',
            'Changing your password signs out previous sessions automatically.',
          ].map((item, index) => (
            <div key={item} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700 shadow-sm">
                {index + 1}
              </div>
              <p className="text-sm leading-6 text-slate-600">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {success ? (
        <div className="space-y-6">
          <div className="rounded-[26px] border border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.9),rgba(255,255,255,1))] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm shadow-emerald-950/10">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Email queued</p>
                <h3 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">Check your inbox</h3>
                <p className="text-sm leading-6 text-slate-600">
                  A reset link has been sent to <span className="font-semibold text-slate-900">{normalizedEmail}</span>.
                  Open the latest message sent at {sentAt || 'just now'}.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Look for the newest reset email</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Spam and Promotions may delay placement. Older reset links stop working as soon as a new one is created.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Need another link?</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Request again if the email does not arrive. The request itself now returns faster because delivery runs in the background.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.open('https://mail.google.com', '_blank', 'noopener,noreferrer')}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open inbox
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccess(false)
                setSentAt('')
                setEmail('')
              }}
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Use another email
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                placeholder="you@example.com"
                required
              />
            </div>
            <p className="text-xs leading-5 text-slate-500">Use the same email you registered with on MentorX.</p>
          </div>

          {error ? (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="leading-6">{error}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !normalizedEmail}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing reset link...
              </>
            ) : (
              'Send password reset link'
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
