import { Link } from 'react-router-dom'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="relative z-10 flex flex-col">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold tracking-tighter text-slate-900">Welcome back</h2>
        <p className="mt-3 text-sm font-medium text-slate-500">Sign in to your account to continue</p>
      </div>

      <LoginForm />

      <div className="mt-8 text-center space-y-4">
        <p className="text-sm font-medium text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-primary-600 hover:text-primary-700 hover:underline transition-colors">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  )
}
