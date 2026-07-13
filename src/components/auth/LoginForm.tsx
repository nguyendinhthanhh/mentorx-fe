import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthResponse, LoginRequest } from '@/types'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'

import GoogleLoginButton from './GoogleLoginButton'
import GithubLoginButton from './GithubLoginButton'
import EmailVerificationPending from './EmailVerificationPending'

import { canAccessAdminWorkspace } from '@/utils/roleRedirect'
import { getSocialAuthRedirectPath } from '@/utils/socialAuth'


const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  totpCode: z.string().regex(/^\d{6}$/, 'Enter the 6-digit authenticator code').optional().or(z.literal('')),
})

export default function LoginForm() {
  const navigate = useNavigate()
  const { setUser, setTokens } = useAuthStore()
  const [error, setError] = useState<string>('')
  const [showVerification, setShowVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showTotpCode, setShowTotpCode] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginRequest) => {
    try {
      setLoading(true)
      setError('')
      const response = await authApi.login(data)
      setTokens(response.accessToken)
      setUser(response.user)
      
      navigate(getSocialAuthRedirectPath(response))
    } catch (err: any) {
      const message = err.response?.data?.message || ''
      if (message.includes('verify your email')) {
        setVerificationEmail(data.email)
        setShowVerification(true)
      } else if (message.toLowerCase().includes('two-factor')) {
        setShowTotpCode(true)
        setError('Enter your 6-digit authenticator code to continue.')
      } else {
        setError(message || 'Invalid email or password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLoginSuccess = (response: AuthResponse) => {
    setTokens(response.accessToken)
    setUser(response.user)

    navigate(getSocialAuthRedirectPath(response))
  }

  if (showVerification) {
    return <EmailVerificationPending email={verificationEmail} />
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
            Email address
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              {...register('email')}
              className="block w-full rounded-2xl border-0 py-3.5 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 hover:ring-slate-300"
              placeholder="name@example.com"
            />
          </div>
          {errors.email && <p className="animate-in slide-in-from-top-1 text-xs font-medium text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <Link to="/forgot-password" className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className="block w-full rounded-2xl border-0 py-3.5 pl-4 pr-11 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 hover:ring-slate-300"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-primary-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="animate-in slide-in-from-top-1 text-xs font-medium text-red-500">{errors.password.message}</p>}
        </div>

        {showTotpCode && (
          <div className="space-y-2">
            <label htmlFor="totpCode" className="block text-sm font-semibold text-slate-700">
              Authenticator code
            </label>
            <input
              id="totpCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              {...register('totpCode')}
              className="block w-full rounded-2xl border-0 px-4 py-3.5 tracking-[0.35em] text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-primary-600"
              placeholder="000000"
            />
            {errors.totpCode && <p className="text-xs font-medium text-red-500">{errors.totpCode.message}</p>}
          </div>
        )}

        {error && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>

        <div className="relative mt-8 mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-400 font-medium">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <GoogleLoginButton
            onSuccess={handleSocialLoginSuccess}
            onError={(error) => setError(error)}
            text="Google"
          />
          <GithubLoginButton
            onSuccess={handleSocialLoginSuccess}
            onError={(error) => setError(error)}
            text="GitHub"
          />
        </div>
      </form>
    </div>
  )
}
