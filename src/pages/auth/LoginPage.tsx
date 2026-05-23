import { Link } from 'react-router-dom'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="text-gray-500 mt-1 text-sm">Sign in to continue to MentorX</p>
      </div>

      <LoginForm />

      <div className="mt-6 text-center space-y-2">
        <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 hover:underline block">
          Forgot password?
        </Link>
        <p className="text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:text-primary-700 hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
