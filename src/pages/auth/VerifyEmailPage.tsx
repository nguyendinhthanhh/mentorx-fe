import React, { useEffect, useState, useCallback } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, logout, refreshUser } = useAuthStore()
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [resendMessage, setResendMessage] = useState('')
  const [resendError, setResendError] = useState('')

  const email = user?.email || 'your email'

  const extractApiErrorMessage = useCallback((error: unknown, fallback: string): string => {
    if (typeof error === 'object' && error !== null) {
      const candidate = error as {
        message?: string
        response?: { data?: { message?: string } }
      }
      return candidate.response?.data?.message || candidate.message || fallback
    }
    return fallback
  }, [])

  const verifyAttempted = React.useRef(false)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) return

    // Prevent React 18 Strict Mode from calling this twice
    if (verifyAttempted.current) return
    verifyAttempted.current = true

    let isMounted = true

    const verifyWithToken = async () => {
      setIsVerifying(true)
      setVerifyError('')
      setVerifyMessage('')
      try {
        const { authApi } = await import('@/api/authApi')
        await authApi.verifyEmail(token)
        
        try {
          await refreshUser()
        } catch (e) {
          // Ignore 403 if user is verifying from a new incognito window / email client
          console.warn('Could not refresh user, user might not be logged in this session.')
        }

        if (!isMounted) return
        setVerifyMessage('Account verified successfully. You are ready to go.')
        window.setTimeout(() => navigate('/onboarding'), 2000)
      } catch (error: unknown) {
        if (!isMounted) return
        setVerifyError(extractApiErrorMessage(error, 'Verification link is invalid or expired.'))
      } finally {
        if (isMounted) setIsVerifying(false)
      }
    }

    verifyWithToken()

    return () => {
      isMounted = false
    }
  }, [extractApiErrorMessage, refreshUser, searchParams, navigate])

  const handleResendEmail = async () => {
    if (!user?.email) return
    setIsResending(true)
    setResendMessage('')
    setResendError('')
    try {
      const { authApi } = await import('@/api/authApi')
      await authApi.sendEmailVerification(user.email)
      setResendMessage('A fresh verification link has been sent to your inbox.')
    } catch (error: unknown) {
      setResendError(extractApiErrorMessage(error, 'Failed to resend verification email.'))
    } finally {
      setIsResending(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-1">MentorX</h1>
          <p className="text-gray-500 text-sm">Verify your email address</p>
        </div>

        {/* Card matches AuthLayout right panel */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100 text-center">
          
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
            <Mail className="h-8 w-8 text-primary-600" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Check your inbox
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            We've sent a verification link to <br />
            <span className="font-medium text-gray-900">{email}</span>
          </p>

          <div className="mb-6">
            {verifyMessage && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 border border-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <span>{verifyMessage}</span>
              </div>
            )}
            {verifyError && (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 border border-red-100">
                <XCircle className="h-5 w-5 text-red-500" />
                <span>{verifyError}</span>
              </div>
            )}
            {resendMessage && !verifyMessage && !verifyError && (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 border border-blue-100">
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                <span>{resendMessage}</span>
              </div>
            )}
            {resendError && !verifyMessage && !verifyError && (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 border border-red-100">
                <XCircle className="h-5 w-5 text-red-500" />
                <span>{resendError}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.open('https://mail.google.com', '_blank', 'noopener,noreferrer')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              Open Email Client
              <ExternalLink className="h-4 w-4" />
            </button>

            <button
              onClick={handleResendEmail}
              disabled={isResending || !user?.email}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : (
                <RefreshCw className="h-4 w-4 text-gray-400" />
              )}
              Resend link
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 flex w-full items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  )
}
