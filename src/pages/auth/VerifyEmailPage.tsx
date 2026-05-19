import React from 'react'
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const { user, logout, refreshUser } = useAuthStore()
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [isResending, setIsResending] = React.useState(false)

  const handleDevVerify = async () => {
    if (!user?.email) return
    
    setIsVerifying(true)
    try {
      const { authApi } = await import('@/api/authApi')
      // Use the newly created devVerifyEmail endpoint for instant activation in dev
      await authApi.devVerifyEmail(user.email)
      await refreshUser()
      alert('Email verified successfully (Dev Bypass)! Welcome to MentorX.')
      navigate('/')
    } catch (error) {
      console.error('Verification failed:', error)
      alert('Failed to verify email. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendEmail = async () => {
    if (!user?.email) return
    setIsResending(true)
    try {
      const { authApi } = await import('@/api/authApi')
      await authApi.sendEmailVerification(user.email)
      alert('Verification link resent! Please check your inbox.')
    } catch (error) {
      console.error('Resend failed:', error)
      alert('Failed to resend verification email.')
    } finally {
      setIsResending(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Dynamic Background Elements */}
      <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-gradient-to-br from-blue-100/40 to-transparent rounded-full blur-[140px] animate-pulse" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-gradient-to-tr from-indigo-100/40 to-transparent rounded-full blur-[140px] animate-pulse delay-1000" />

      <div className="max-w-[520px] w-full bg-white/70 backdrop-blur-2xl rounded-[48px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-white/50 p-10 md:p-16 text-center relative z-10 transition-all hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.12)]">
        <div className="relative mb-12 inline-block">
          <div className="w-28 h-28 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[38px] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30 transform hover:rotate-6 transition-transform duration-500">
            <Mail className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -bottom-3 -right-3 bg-white rounded-2xl p-2.5 shadow-xl ring-8 ring-[#F8FAFC]">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
          </div>
        </div>

        <div className="space-y-5 mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Verify your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">account</span>
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed max-w-[360px] mx-auto">
            We've sent a secure verification link to <br />
            <span className="font-bold text-slate-900 decoration-blue-200 decoration-4 underline-offset-4 underline">{user?.email}</span>
          </p>
        </div>

        <div className="space-y-5">
          <button
            onClick={handleDevVerify}
            disabled={isVerifying}
            className="group w-full relative px-8 py-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all duration-300 shadow-2xl shadow-slate-900/30 active:scale-[0.98] disabled:opacity-70 overflow-hidden"
          >
            <div className="flex items-center justify-center gap-3 relative z-10">
              {isVerifying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              <span>{isVerifying ? 'Activating Account...' : 'Instant Verify (Dev Bypass)'}</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 text-slate-600 font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
              <span className="text-sm tracking-wide uppercase">Resend</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-2xl transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm tracking-wide uppercase">Logout</span>
            </button>
          </div>
        </div>

        <div className="mt-14 pt-10 border-t border-slate-100">
          <p className="text-sm text-slate-400 font-medium">
            Can't find the email? Please check your <span className="text-slate-500">Spam or Promotions</span> folder.
          </p>
        </div>
      </div>
    </div>
  )
}
