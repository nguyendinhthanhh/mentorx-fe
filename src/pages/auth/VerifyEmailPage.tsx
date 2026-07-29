import React from 'react'
import { Mail, CheckCircle2, ShieldCheck, Loader2, ArrowRight } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, refreshUser } = useAuthStore()
  const [status, setStatus] = React.useState<'idle' | 'verifying' | 'success' | 'error'>('idle')

  React.useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setStatus('verifying')
      import('@/api/authApi').then(async ({ authApi }) => {
        try {
          await authApi.verifyEmail(token)
          await refreshUser()
          setStatus('success')
        } catch {
          setStatus('error')
        }
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-gradient-to-br from-blue-100/40 to-transparent rounded-full blur-[140px] animate-pulse" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-gradient-to-tr from-emerald-100/40 to-transparent rounded-full blur-[140px] animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-[520px] rounded-2xl border border-white/50 bg-white/70 p-6 text-center shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition-all hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.12)] sm:rounded-[32px] sm:p-10 md:p-16">
        <div className="relative mb-12 inline-block">
          <div className="w-28 h-28 bg-gradient-to-br from-blue-600 to-emerald-700 rounded-[38px] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30 transform hover:rotate-6 transition-transform duration-500">
            <Mail className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -bottom-3 -right-3 bg-white rounded-2xl p-2.5 shadow-xl ring-8 ring-[#F8FAFC]">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
          </div>
        </div>

        <div className="space-y-5 mb-12">
          <h1 className="text-3xl font-black leading-[1.1] tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            {status === 'verifying' ? 'Verifying...' :
             status === 'success' ? 'Email Verified!' :
             status === 'error' ? 'Verification Failed' :
             <>Verify your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">account</span></>}
          </h1>
          {status === 'verifying' && (
            <div className="flex justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
          )}
          {status === 'success' && (
            <>
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <p className="text-slate-500 text-lg leading-relaxed max-w-[360px] mx-auto">
                Your email has been verified successfully.
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <p className="text-slate-500 text-lg leading-relaxed max-w-[360px] mx-auto">
                This link is invalid or has expired. Please log in to request a new verification email.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-2 px-8 py-5 bg-emerald-600 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 hover:bg-emerald-700 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all duration-300 shadow-2xl shadow-slate-900/30 active:scale-[0.98]"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>Back to Login</span>
                </button>
              </div>
            </>
          )}
          {status === 'idle' && (
            <p className="text-slate-500 text-lg leading-relaxed max-w-[360px] mx-auto">
              We've sent a secure verification link to <br />
              <span className="font-bold text-slate-900 decoration-blue-200 decoration-4 underline-offset-4 underline">{user?.email}</span>
            </p>
          )}
        </div>

        <div className="space-y-5">
          {status === 'success' && (
            <button
              onClick={() => navigate('/onboarding')}
              className="w-full flex items-center justify-center gap-2 px-8 py-5 bg-emerald-600 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 hover:bg-emerald-700 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all duration-300 shadow-2xl shadow-slate-900/30 active:scale-[0.98]"
            >
              <ArrowRight className="w-5 h-5" />
              <span>Continue to Onboarding</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
