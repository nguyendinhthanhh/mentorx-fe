import { Link } from 'react-router-dom'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">Login to Your Account</h2>
      <LoginForm />
      <div className="mt-6 text-center space-y-2">
        <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline block">
          Forgot password?
        </Link>
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
