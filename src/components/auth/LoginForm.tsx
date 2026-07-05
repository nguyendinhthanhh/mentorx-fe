import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthResponse, LoginRequest } from '@/types'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import GoogleLoginButton from './GoogleLoginButton'
import GithubLoginButton from './GithubLoginButton'
import EmailVerificationPending from './EmailVerificationPending'

import { canAccessAdminWorkspace } from '@/utils/roleRedirect'
import { getSocialAuthRedirectPath } from '@/utils/socialAuth'


const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginForm() {
  const navigate = useNavigate()
  const { setUser, setTokens, skipOnboardingForSession } = useAuthStore()
  const [error, setError] = useState<string>('')
  const [showVerification, setShowVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
      setTokens(response.accessToken, response.refreshToken)
      setUser(response.user)
      
      if (canAccessAdminWorkspace(response.user)) {
        navigate('/admin/dashboard')
      } else {
        navigate('/profile')
      }
    } catch (err: any) {
      const message = err.response?.data?.message || ''
      if (message.includes('verify your email')) {
        setVerificationEmail(data.email)
        setShowVerification(true)
      } else {
        setError(message || 'Invalid email or password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLoginSuccess = (response: AuthResponse) => {
    setTokens(response.accessToken, response.refreshToken)
    setUser(response.user)

    if (!response.isNewUser && !response.user.isOnboarded) {
      skipOnboardingForSession()
    }

    navigate(getSocialAuthRedirectPath(response))
  }

  if (showVerification) {
    return <EmailVerificationPending email={verificationEmail} />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label htmlFor="email" className="block text-sm font-bold text-slate-700">
            Email address
          </label>
        </div>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm text-slate-900 placeholder-slate-400 shadow-sm hover:border-slate-300"
          placeholder="you@example.com"
        />
        {errors.email && <p className="text-xs font-medium text-red-500 mt-2">{errors.email.message}</p>}
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label htmlFor="password" className="block text-sm font-bold text-slate-700">
            Password
          </label>
          <Link to="/forgot-password" className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline transition-colors">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            className="w-full px-4 py-3 pr-11 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm text-slate-900 placeholder-slate-400 shadow-sm hover:border-slate-300"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <p className="text-xs font-medium text-red-500 mt-2">{errors.password.message}</p>}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-red-600 text-center">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign in'}
      </button>

      <div className="relative mt-8 mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-slate-500 font-medium">Or continue with</span>
        </div>
      </div>

      <div className="flex justify-center">
        <GoogleLoginButton
          onSuccess={handleSocialLoginSuccess}
          onError={(error) => setError(error)}
        />
      </div>

      <div className="flex justify-center">
        <GithubLoginButton
          onSuccess={handleSocialLoginSuccess}
          onError={(error) => setError(error)}
        />
      </div>
    </form>
  )
}
