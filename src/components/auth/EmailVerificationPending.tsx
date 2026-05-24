import { useState, useEffect, useRef } from 'react'
import { Mail, RefreshCw } from 'lucide-react'
import { authApi } from '@/api/authApi'

interface EmailVerificationPendingProps {
  email: string
}

export default function EmailVerificationPending({ email }: EmailVerificationPendingProps) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const sentRef = useRef(false)

  useEffect(() => {
    if (sentRef.current) return
    sentRef.current = true
    setSending(true)
    authApi.sendEmailVerification(email)
      .then(() => setSent(true))
      .catch(() => {})
      .finally(() => setSending(false))
  }, [email])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  const handleResend = async () => {
    setSending(true)
    try {
      await authApi.sendEmailVerification(email)
      setCooldown(20)
      setSent(true)
    } catch {
      // silent
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail className="w-8 h-8 text-primary-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
      <p className="text-gray-500 text-sm mb-1">
        {sending && !sent ? 'Sending verification email...' : "We've sent a verification link to"}
      </p>
      <p className="font-semibold text-gray-900 mb-4">{email}</p>
      <p className="text-sm text-gray-500 mb-6">
        Click the link in the email to activate your account. If you don't see it, check your spam folder.
      </p>
      <button
        onClick={handleResend}
        disabled={cooldown > 0 || sending}
        className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-xl font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
      >
        <RefreshCw className={`w-4 h-4 ${sending ? 'animate-spin' : ''}`} />
        {sending ? 'Sending...' :
         cooldown > 0 ? `Resend in ${cooldown}s...` :
         'Resend verification email'}
      </button>
    </div>
  )
}
