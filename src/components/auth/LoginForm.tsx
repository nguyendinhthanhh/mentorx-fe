import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LoginRequest } from '@/types'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import GoogleLoginButton from './GoogleLoginButton'
import GithubLoginButton from './GithubLoginButton'
import EmailVerificationPending from './EmailVerificationPending'

import { CredentialResponse, GoogleLogin } from '@react-oauth/google'
import { canAccessAdminWorkspace } from '@/utils/roleRedirect'


const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginForm() {
  const navigate = useNavigate()
  const { setUser, setTokens } = useAuthStore()
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

  if (showVerification) {
    return <EmailVerificationPending email={verificationEmail} />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Email address
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
          placeholder="you@example.com"
        />
        {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            className="w-full px-4 py-2.5 pr-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password.message}</p>}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-xl font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="flex justify-center">
        <GoogleLoginButton
          onSuccess={(response) => {
            setTokens(response.accessToken, response.refreshToken)
            setUser(response.user)

            const userRoles = response.user.roles.map(r => r.roleName.toUpperCase())
            if (userRoles.includes('ADMIN')) {
              navigate('/admin/dashboard')
            } else if (userRoles.includes('MENTOR') || response.user.mentorStatus === 'APPROVED') {
              navigate('/mentor/dashboard')
            } else {
              navigate('/dashboard')
            }
          }}
          onError={(error) => setError(error)}
        />
      </div>

      <div className="flex justify-center">
        <GithubLoginButton
          onSuccess={(response) => {
            setTokens(response.accessToken, response.refreshToken)
            setUser(response.user)

            const userRoles = response.user.roles.map(r => r.roleName.toUpperCase())
            if (userRoles.includes('ADMIN')) {
              navigate('/admin/dashboard')
            } else if (userRoles.includes('MENTOR') || response.user.mentorStatus === 'APPROVED') {
              navigate('/mentor/dashboard')
            } else {
              navigate('/dashboard')
            }
          }}
          onError={(error) => setError(error)}
        />
      </div>
    </form>
  )
}
