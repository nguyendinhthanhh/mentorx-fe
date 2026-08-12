import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { CheckCircle2, Clock3, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import { authApi } from '@/api/authApi'
import { useI18n } from '@/i18n/I18nProvider'

interface EmailVerificationPendingProps {
  email: string
}

const RESEND_COOLDOWN_SECONDS = 30

function getRetryAfterSeconds(error: unknown): number | null {
  if (!axios.isAxiosError(error)) return null

  const headerValue = error.response?.headers?.['retry-after']
  const headerSeconds = Array.isArray(headerValue) ? Number(headerValue[0]) : Number(headerValue)
  if (Number.isFinite(headerSeconds) && headerSeconds > 0) return Math.ceil(headerSeconds)

  const responseData = error.response?.data as { data?: { retryAfterSeconds?: number } } | undefined
  const bodySeconds = responseData?.data?.retryAfterSeconds
  if (Number.isFinite(bodySeconds) && bodySeconds && bodySeconds > 0) return Math.ceil(bodySeconds)

  return null
}

export default function EmailVerificationPending({ email }: EmailVerificationPendingProps) {
  const { t } = useI18n()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const sentRef = useRef(false)

  useEffect(() => {
    let active = true

    if (sentRef.current) return
    sentRef.current = true

    setSending(true)
    authApi.sendEmailVerification(email)
      .then(() => {
        if (!active) return
        setSent(true)
        setCooldown(RESEND_COOLDOWN_SECONDS)
        setStatusMessage(t('auth.verification.sentNotice'))
      })
      .catch((error) => {
        if (!active) return
        const retryAfterSeconds = getRetryAfterSeconds(error)
        if (retryAfterSeconds) {
          setCooldown(retryAfterSeconds)
          setStatusMessage(t('auth.verification.rateLimited', { seconds: retryAfterSeconds }))
          return
        }
        setStatusMessage(t('auth.verification.sendFailed'))
      })
      .finally(() => {
        if (active) setSending(false)
      })

    return () => {
      active = false
    }
  }, [email, t])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setInterval(() => setCooldown((current) => Math.max(0, current - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  const handleResend = async () => {
    setSending(true)
    setStatusMessage('')
    try {
      await authApi.sendEmailVerification(email)
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setSent(true)
      setStatusMessage(t('auth.verification.resentNotice'))
    } catch (error) {
      const retryAfterSeconds = getRetryAfterSeconds(error)
      if (retryAfterSeconds) {
        setCooldown(retryAfterSeconds)
        setStatusMessage(t('auth.verification.rateLimited', { seconds: retryAfterSeconds }))
      } else {
        setStatusMessage(t('auth.verification.sendFailed'))
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="rounded-3xl border border-primary-100 bg-primary-50/40 p-4 shadow-sm shadow-primary-900/5 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary-200 bg-white dark:bg-slate-950 text-primary-700 shadow-sm shadow-primary-900/5">
            <Mail className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-white dark:bg-slate-950 px-2.5 py-1 text-xs font-semibold text-primary-700 shadow-sm shadow-primary-900/5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {sending ? t('auth.verification.sending') : sent ? t('auth.verification.emailQueued') : t('auth.verification.ready')}
            </div>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              {sending && !sent ? t('auth.verification.sendingDescription') : t('auth.verification.description')}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            {t('auth.verification.sentTo')}
          </p>
          <p className="mt-1 break-all text-sm font-semibold text-slate-950 dark:text-slate-100">{email}</p>
        </div>

        <div className="mt-5 space-y-3 text-left">
          <div className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
            <span>{t('auth.verification.instructions')}</span>
          </div>
          <div className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
            <span>{t('auth.verification.limitPolicy')}</span>
          </div>
        </div>

        {statusMessage && (
          <p aria-live="polite" className="mt-5 rounded-2xl border border-primary-100 bg-white dark:bg-slate-950 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            {statusMessage}
          </p>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || sending}
          className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary-700 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-primary-900/15 transition duration-200 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-primary-100 disabled:text-primary-500 disabled:shadow-none"
        >
          <RefreshCw className={`h-4 w-4 ${sending ? 'animate-spin' : ''}`} />
          {sending
            ? t('auth.verification.sending')
            : cooldown > 0
              ? t('auth.verification.resendCooldown', { seconds: cooldown })
              : t('auth.verification.resend')}
        </button>
      </div>
    </div>
  )
}
