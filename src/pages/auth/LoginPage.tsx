import { Link } from 'react-router-dom'
import { useState } from 'react'
import LoginForm from '@/components/auth/LoginForm'
import { useI18n } from '@/i18n/I18nProvider'

export default function LoginPage() {
  const { t } = useI18n()
  const [verificationPending, setVerificationPending] = useState(false)

  return (
    <div className="relative z-10 flex flex-col">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-100 sm:text-4xl">
          {verificationPending ? t('auth.login.verificationTitle') : t('auth.login.title')}
        </h2>
        <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
          {verificationPending ? t('auth.login.verificationSubtitle') : t('auth.login.subtitle')}
        </p>
      </div>

      <LoginForm onVerificationPendingChange={setVerificationPending} />

      <div className="mt-8 text-center space-y-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="font-bold text-primary-600 hover:text-primary-700 hover:underline transition-colors">
            {t('auth.login.signUpFree')}
          </Link>
        </p>
      </div>
    </div>
  )
}
