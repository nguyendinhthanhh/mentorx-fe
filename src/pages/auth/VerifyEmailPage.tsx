import React from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, MailCheck, ShieldCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { authApi } from '@/api/authApi'
import { useI18n } from '@/i18n/I18nProvider'
import { useAuthStore } from '@/store/authStore'

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'error'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { t } = useI18n()
  const { user, refreshUser } = useAuthStore()
  const [status, setStatus] = React.useState<VerificationStatus>('idle')

  React.useEffect(() => {
    let active = true

    if (!token) {
      setStatus('idle')
      return () => {
        active = false
      }
    }

    const verifyEmail = async () => {
      setStatus('verifying')
      try {
        await authApi.verifyEmail(token)
        await refreshUser()
        if (active) setStatus('success')
      } catch {
        if (active) setStatus('error')
      }
    }

    void verifyEmail()

    return () => {
      active = false
    }
  }, [refreshUser, token])

  const isVerifying = status === 'verifying'
  const isSuccess = status === 'success'
  const isError = status === 'error'

  const iconShellClass = isError
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : isSuccess
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-primary-200 bg-primary-50 text-primary-700'

  const title = isVerifying
    ? t('auth.verifyEmail.verifyingTitle')
    : isSuccess
      ? t('auth.verifyEmail.successTitle')
      : isError
        ? t('auth.verifyEmail.failedTitle')
        : t('auth.verifyEmail.pendingTitle')

  const description = isVerifying
    ? t('auth.verifyEmail.verifyingDescription')
    : isSuccess
      ? t('auth.verifyEmail.successDescription')
      : isError
        ? t('auth.verifyEmail.failedDescription')
        : t('auth.verifyEmail.pendingDescription')

  const actionLabel = isSuccess ? t('auth.verifyEmail.continueOnboarding') : t('auth.verifyEmail.backToLogin')
  const actionTarget = isSuccess ? '/onboarding' : '/login'

  return (
    <section className="relative z-10">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/80 shadow-sm shadow-slate-900/5">
        <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3 text-left">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${iconShellClass}`}>
              {isVerifying ? (
                <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" />
              ) : isSuccess ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : isError ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <MailCheck className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
                {t('auth.verifyEmail.eyebrow')}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{title}</h2>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-6 text-left sm:px-6 sm:py-7">
          <p className="text-sm leading-6 text-slate-600">{description}</p>

          {user?.email && !isError && (
            <div className="rounded-2xl border border-primary-100 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {t('auth.verifyEmail.accountEmail')}
              </p>
              <p className="mt-1 break-words text-sm font-bold text-slate-950">{user.email}</p>
            </div>
          )}

          {isError && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm leading-6 text-rose-900">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
                <p>{t('auth.verifyEmail.failedGuidance')}</p>
              </div>
            </div>
          )}

          {!isVerifying && (
            <button
              type="button"
              onClick={() => navigate(actionTarget)}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary-700 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-primary-900/15 transition duration-200 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 active:scale-[0.99]"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
