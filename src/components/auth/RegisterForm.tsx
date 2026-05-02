import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RegisterRequest } from '@/types'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must not exceed 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must not exceed 50 characters'),
})

export default function RegisterForm() {
  const navigate = useNavigate()
  const { setUser, setTokens } = useAuthStore()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterRequest) => {
    try {
      setLoading(true)
      setError('')
      const response = await authApi.register(data)
      setTokens(response.accessToken, response.refreshToken)
      setUser(response.user)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="label">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            {...register('firstName')}
            className="input"
            placeholder="John"
          />
          {errors.firstName && <p className="error-message">{errors.firstName.message}</p>}
        </div>

        <div>
          <label htmlFor="lastName" className="label">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            {...register('lastName')}
            className="input"
            placeholder="Doe"
          />
          {errors.lastName && <p className="error-message">{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="input"
          placeholder="your@email.com"
        />
        {errors.email && <p className="error-message">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className="input"
          placeholder="••••••••"
        />
        {errors.password && <p className="error-message">{errors.password.message}</p>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  )
}
